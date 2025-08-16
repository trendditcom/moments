/**
 * Provider-Agnostic Response Cache
 * Comprehensive caching system for AI responses that works across all providers
 */

import { ModelRequest, ModelResponse, ProviderType } from '../model-providers/provider-interface'
import crypto from 'crypto'

export interface CacheEntry {
  key: string
  request: ModelRequest
  response: ModelResponse
  provider: ProviderType
  timestamp: number
  ttl: number
  hits: number
  lastAccessed: number
  expiresAt: number
  size: number // in bytes
}

export interface CacheConfig {
  enabled?: boolean
  maxEntries?: number
  defaultTtl?: number // milliseconds
  maxMemory?: number // bytes
  compressionEnabled?: boolean
  persistToDisk?: boolean
  cleanupInterval?: number // milliseconds
  providerSpecificTtl?: {
    anthropic?: number
    bedrock?: number
  }
}

export interface CacheStats {
  totalEntries: number
  totalHits: number
  totalMisses: number
  hitRate: number
  memoryUsage: number
  cacheSize: number
  averageEntrySize: number
  entriesByProvider: Record<ProviderType, number>
  hitsByProvider: Record<ProviderType, number>
  oldestEntry?: number
  newestEntry?: number
  cleanupCount: number
  lastCleanup?: number
}

export interface CacheExportData {
  entries: CacheEntry[]
  stats: CacheStats
  config: CacheConfig
  exportedAt: number
  version: string
}

/**
 * LRU cache implementation optimized for AI response caching
 */
export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig
  private stats: Omit<CacheStats, 'hitRate' | 'averageEntrySize' | 'entriesByProvider' | 'hitsByProvider'>
  private cleanupTimer?: NodeJS.Timeout
  private isCleaningUp = false

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enabled: true,
      maxEntries: 1000,
      defaultTtl: 60 * 60 * 1000, // 1 hour
      maxMemory: 100 * 1024 * 1024, // 100MB
      compressionEnabled: false,
      persistToDisk: false,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      ...config
    }

    this.stats = {
      totalEntries: 0,
      totalHits: 0,
      totalMisses: 0,
      memoryUsage: 0,
      cacheSize: 0,
      cleanupCount: 0
    }

    // Start cleanup timer
    if (this.config.enabled && this.config.cleanupInterval && this.config.cleanupInterval > 0) {
      this.startCleanupTimer()
    }

    // Load from disk if persistence is enabled
    if (this.config.persistToDisk) {
      this.loadFromDisk()
    }
  }

  /**
   * Generate cache key from request and provider
   */
  private generateCacheKey(request: ModelRequest, provider: ProviderType): string {
    const keyData = {
      messages: request.messages,
      model: request.model,
      provider,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
      systemPrompt: request.systemPrompt,
      tools: request.tools,
      stream: request.stream
    }

    const serialized = JSON.stringify(keyData, Object.keys(keyData).sort())
    return crypto.createHash('sha256').update(serialized).digest('hex')
  }

  /**
   * Calculate response size in bytes
   */
  private calculateSize(entry: CacheEntry): number {
    return JSON.stringify(entry).length * 2 // Approximate UTF-16 byte size
  }

  /**
   * Get TTL for specific provider
   */
  private getTtl(provider: ProviderType): number {
    const providerTtl = this.config.providerSpecificTtl?.[provider]
    return providerTtl || this.config.defaultTtl || 60 * 60 * 1000
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt
  }

  /**
   * Remove expired entries
   */
  private removeExpiredEntries(): number {
    let removedCount = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        this.stats.memoryUsage -= entry.size
        removedCount++
      }
    }

    this.stats.totalEntries = this.cache.size
    this.stats.cacheSize = this.cache.size
    return removedCount
  }

  /**
   * Evict least recently used entries to fit memory constraints
   */
  private evictLRUEntries(): number {
    let evictedCount = 0

    // Sort by last accessed (LRU)
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)

    // Remove entries until we're under memory limit or entry limit
    const maxMemory = this.config.maxMemory || 100 * 1024 * 1024
    const maxEntries = this.config.maxEntries || 1000
    while (
      (this.stats.memoryUsage > maxMemory || 
       this.cache.size > maxEntries) &&
      sortedEntries.length > 0
    ) {
      const [key, entry] = sortedEntries.shift()!
      this.cache.delete(key)
      this.stats.memoryUsage -= entry.size
      evictedCount++
    }

    this.stats.totalEntries = this.cache.size
    this.stats.cacheSize = this.cache.size
    return evictedCount
  }

  /**
   * Perform cache cleanup
   */
  private cleanup(): void {
    if (this.isCleaningUp) return

    this.isCleaningUp = true
    const expiredRemoved = this.removeExpiredEntries()
    const lruEvicted = this.evictLRUEntries()
    
    this.stats.cleanupCount++
    this.stats.lastCleanup = Date.now()
    this.isCleaningUp = false

    if (expiredRemoved > 0 || lruEvicted > 0) {
      console.log(`Cache cleanup: removed ${expiredRemoved} expired, evicted ${lruEvicted} LRU entries`)
    }

    // Persist to disk if enabled
    if (this.config.persistToDisk) {
      this.saveToDisk()
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Stop automatic cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromDisk(): void {
    try {
      if (typeof window === 'undefined') return

      const stored = localStorage.getItem('moments_response_cache')
      if (!stored) return

      const data: CacheExportData = JSON.parse(stored)
      
      // Validate version compatibility
      if (data.version !== '1.0') {
        console.warn('Cache version mismatch, clearing cache')
        localStorage.removeItem('moments_response_cache')
        return
      }

      // Restore entries
      for (const entry of data.entries) {
        if (!this.isExpired(entry)) {
          this.cache.set(entry.key, entry)
          this.stats.memoryUsage += entry.size
        }
      }

      this.stats.totalEntries = this.cache.size
      this.stats.cacheSize = this.cache.size
      
      console.log(`Loaded ${this.cache.size} cache entries from disk`)
    } catch (error) {
      console.error('Failed to load cache from disk:', error)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('moments_response_cache')
      }
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToDisk(): void {
    try {
      if (typeof window === 'undefined') return

      const exportData: CacheExportData = {
        entries: Array.from(this.cache.values()),
        stats: this.getStats(),
        config: this.config,
        exportedAt: Date.now(),
        version: '1.0'
      }

      localStorage.setItem('moments_response_cache', JSON.stringify(exportData))
    } catch (error) {
      console.error('Failed to save cache to disk:', error)
    }
  }

  /**
   * Get cached response
   */
  get(request: ModelRequest, provider: ProviderType): ModelResponse | null {
    if (!this.config.enabled) return null

    const key = this.generateCacheKey(request, provider)
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.totalMisses++
      return null
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.memoryUsage -= entry.size
      this.stats.totalEntries = this.cache.size
      this.stats.totalMisses++
      return null
    }

    // Update access info
    entry.hits++
    entry.lastAccessed = Date.now()
    this.stats.totalHits++

    return entry.response
  }

  /**
   * Store response in cache
   */
  set(request: ModelRequest, response: ModelResponse, provider: ProviderType): void {
    if (!this.config.enabled) return

    const key = this.generateCacheKey(request, provider)
    const now = Date.now()
    const ttl = this.getTtl(provider)

    const entry: CacheEntry = {
      key,
      request,
      response,
      provider,
      timestamp: now,
      ttl,
      hits: 0,
      lastAccessed: now,
      expiresAt: now + ttl,
      size: 0
    }

    entry.size = this.calculateSize(entry)

    // Remove existing entry if it exists
    const existing = this.cache.get(key)
    if (existing) {
      this.stats.memoryUsage -= existing.size
    } else {
      this.stats.totalEntries++
    }

    // Add new entry
    this.cache.set(key, entry)
    this.stats.memoryUsage += entry.size
    this.stats.cacheSize = this.cache.size

    // Trigger cleanup if needed
    const maxMemory = this.config.maxMemory || 100 * 1024 * 1024
    const maxEntries = this.config.maxEntries || 1000
    if (this.stats.memoryUsage > maxMemory || this.cache.size > maxEntries) {
      this.evictLRUEntries()
    }
  }

  /**
   * Check if request is cached
   */
  has(request: ModelRequest, provider: ProviderType): boolean {
    if (!this.config.enabled) return false

    const key = this.generateCacheKey(request, provider)
    const entry = this.cache.get(key)
    
    return entry !== undefined && !this.isExpired(entry)
  }

  /**
   * Remove specific entry from cache
   */
  delete(request: ModelRequest, provider: ProviderType): boolean {
    const key = this.generateCacheKey(request, provider)
    const entry = this.cache.get(key)
    
    if (entry) {
      this.cache.delete(key)
      this.stats.memoryUsage -= entry.size
      this.stats.totalEntries = this.cache.size
      this.stats.cacheSize = this.cache.size
      return true
    }
    
    return false
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.stats.totalEntries = 0
    this.stats.memoryUsage = 0
    this.stats.cacheSize = 0

    if (this.config.persistToDisk && typeof window !== 'undefined') {
      localStorage.removeItem('moments_response_cache')
    }
  }

  /**
   * Clear entries for specific provider
   */
  clearProvider(provider: ProviderType): number {
    let removedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.provider === provider) {
        this.cache.delete(key)
        this.stats.memoryUsage -= entry.size
        removedCount++
      }
    }

    this.stats.totalEntries = this.cache.size
    this.stats.cacheSize = this.cache.size
    return removedCount
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entriesByProvider: Record<ProviderType, number> = { anthropic: 0, bedrock: 0 }
    const hitsByProvider: Record<ProviderType, number> = { anthropic: 0, bedrock: 0 }
    let oldestEntry: number | undefined
    let newestEntry: number | undefined

    for (const entry of this.cache.values()) {
      entriesByProvider[entry.provider]++
      hitsByProvider[entry.provider] += entry.hits

      if (!oldestEntry || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp
      }
      if (!newestEntry || entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp
      }
    }

    const totalRequests = this.stats.totalHits + this.stats.totalMisses
    
    return {
      ...this.stats,
      hitRate: totalRequests > 0 ? this.stats.totalHits / totalRequests : 0,
      averageEntrySize: this.stats.totalEntries > 0 ? this.stats.memoryUsage / this.stats.totalEntries : 0,
      entriesByProvider,
      hitsByProvider,
      oldestEntry,
      newestEntry
    }
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    const wasEnabled = this.config.enabled
    this.config = { ...this.config, ...newConfig }

    // Handle enable/disable
    if (!wasEnabled && this.config.enabled) {
      this.startCleanupTimer()
    } else if (wasEnabled && !this.config.enabled) {
      this.stopCleanupTimer()
    }

    // Restart timer if interval changed
    if (this.config.enabled && 
        newConfig.cleanupInterval && 
        newConfig.cleanupInterval !== this.config.cleanupInterval) {
      this.startCleanupTimer()
    }

    // Trigger cleanup if limits were reduced
    if (this.config.enabled && 
        (newConfig.maxEntries || newConfig.maxMemory)) {
      this.evictLRUEntries()
    }
  }

  /**
   * Export cache data
   */
  export(): CacheExportData {
    return {
      entries: Array.from(this.cache.values()),
      stats: this.getStats(),
      config: this.config,
      exportedAt: Date.now(),
      version: '1.0'
    }
  }

  /**
   * Import cache data
   */
  import(data: CacheExportData): boolean {
    try {
      // Validate version
      if (data.version !== '1.0') {
        console.error('Incompatible cache version:', data.version)
        return false
      }

      // Clear existing cache
      this.clear()

      // Import entries
      for (const entry of data.entries) {
        if (!this.isExpired(entry)) {
          this.cache.set(entry.key, entry)
          this.stats.memoryUsage += entry.size
        }
      }

      this.stats.totalEntries = this.cache.size
      this.stats.cacheSize = this.cache.size

      console.log(`Imported ${this.cache.size} cache entries`)
      return true
    } catch (error) {
      console.error('Failed to import cache data:', error)
      return false
    }
  }

  /**
   * Get entries for debugging
   */
  getEntries(): CacheEntry[] {
    return Array.from(this.cache.values())
  }

  /**
   * Cleanup and destroy cache instance
   */
  destroy(): void {
    this.stopCleanupTimer()
    
    if (this.config.persistToDisk) {
      this.saveToDisk()
    }
    
    this.clear()
  }
}

// Global cache instance
let globalResponseCache: ResponseCache | null = null

/**
 * Get global response cache instance
 */
export function getGlobalResponseCache(): ResponseCache {
  if (!globalResponseCache) {
    globalResponseCache = new ResponseCache()
  }
  return globalResponseCache
}

/**
 * Initialize global response cache with config
 */
export function initializeGlobalResponseCache(config: Partial<CacheConfig>): ResponseCache {
  if (globalResponseCache) {
    globalResponseCache.destroy()
  }
  globalResponseCache = new ResponseCache(config)
  return globalResponseCache
}

/**
 * Destroy global response cache
 */
export function destroyGlobalResponseCache(): void {
  if (globalResponseCache) {
    globalResponseCache.destroy()
    globalResponseCache = null
  }
}