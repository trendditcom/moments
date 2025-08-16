/**
 * Automatic Prompt Caching for Claude Code SDK
 * Implements intelligent caching for prompt responses to reduce API calls and costs
 */

import { ModelMessage } from '../model-providers/provider-interface'

export interface CacheEntry {
  key: string
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  provider: string
  cost: number
  timestamp: string
  accessCount: number
  lastAccessed: string
  metadata?: Record<string, any>
}

export interface CacheConfig {
  maxEntries: number
  ttlHours: number
  enableLRU: boolean
  persistToStorage: boolean
  compressionEnabled: boolean
  minTokensToCache: number
}

export interface CacheStats {
  totalEntries: number
  hitRate: number
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  totalSavings: number
  avgResponseTime: number
}

/**
 * Prompt Cache implementation with LRU eviction and persistence
 */
export class PromptCache {
  private cache = new Map<string, CacheEntry>()
  private accessOrder: string[] = []
  private config: CacheConfig
  private stats: CacheStats = {
    totalEntries: 0,
    hitRate: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalSavings: 0,
    avgResponseTime: 0
  }

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxEntries: 1000,
      ttlHours: 24,
      enableLRU: true,
      persistToStorage: true,
      compressionEnabled: false,
      minTokensToCache: 100,
      ...config
    }

    if (this.config.persistToStorage) {
      this.loadFromStorage()
    }
  }

  /**
   * Generate cache key from request parameters
   */
  generateCacheKey(
    messages: ModelMessage[],
    model: string,
    provider: string,
    options: {
      temperature?: number
      maxTokens?: number
      system?: string
    } = {}
  ): string {
    const normalizedMessages = messages.map(m => ({
      role: m.role,
      content: this.normalizeContent(m.content)
    }))

    const keyData = {
      messages: normalizedMessages,
      model,
      provider,
      temperature: Math.round((options.temperature || 0.7) * 100) / 100,
      maxTokens: options.maxTokens || 4000,
      system: options.system
    }

    // Create hash of the key data
    const keyString = JSON.stringify(keyData)
    return this.createHash(keyString)
  }

  /**
   * Check if response is cached
   */
  get(cacheKey: string): CacheEntry | null {
    this.stats.totalRequests++

    const entry = this.cache.get(cacheKey)
    if (!entry) {
      this.stats.cacheMisses++
      this.updateHitRate()
      return null
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey)
      this.removeFromAccessOrder(cacheKey)
      this.stats.cacheMisses++
      this.updateHitRate()
      return null
    }

    // Update access information
    entry.accessCount++
    entry.lastAccessed = new Date().toISOString()
    
    // Update LRU order
    this.updateAccessOrder(cacheKey)

    this.stats.cacheHits++
    this.stats.totalSavings += entry.cost
    this.updateHitRate()

    return entry
  }

  /**
   * Store response in cache
   */
  set(
    cacheKey: string,
    content: string,
    usage: { inputTokens: number; outputTokens: number; totalTokens: number },
    model: string,
    provider: string,
    cost: number,
    metadata?: Record<string, any>
  ): void {
    // Check if response meets caching criteria
    if (usage.totalTokens < this.config.minTokensToCache) {
      return
    }

    const entry: CacheEntry = {
      key: cacheKey,
      content,
      usage,
      model,
      provider,
      cost,
      timestamp: new Date().toISOString(),
      accessCount: 1,
      lastAccessed: new Date().toISOString(),
      metadata
    }

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest()
    }

    this.cache.set(cacheKey, entry)
    this.updateAccessOrder(cacheKey)
    this.stats.totalEntries = this.cache.size

    if (this.config.persistToStorage) {
      this.saveToStorage()
    }
  }

  /**
   * Check if cache entry has expired
   */
  private isExpired(entry: CacheEntry): boolean {
    const entryTime = new Date(entry.timestamp).getTime()
    const expiryTime = entryTime + (this.config.ttlHours * 60 * 60 * 1000)
    return Date.now() > expiryTime
  }

  /**
   * Evict oldest entry using LRU strategy
   */
  private evictOldest(): void {
    if (this.config.enableLRU && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder[0]
      this.cache.delete(oldestKey)
      this.removeFromAccessOrder(oldestKey)
    } else {
      // Fallback to random eviction
      const keys = Array.from(this.cache.keys())
      if (keys.length > 0) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)]
        this.cache.delete(randomKey)
        this.removeFromAccessOrder(randomKey)
      }
    }
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = this.stats.cacheHits / this.stats.totalRequests
    }
  }

  /**
   * Normalize content for consistent caching
   */
  private normalizeContent(content: string): string {
    return content
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
  }

  /**
   * Create hash from string
   */
  private createHash(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.stats = {
      totalEntries: 0,
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalSavings: 0,
      avgResponseTime: 0
    }

    if (this.config.persistToStorage) {
      this.saveToStorage()
    }
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    const expiredKeys: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
    }

    this.stats.totalEntries = this.cache.size

    if (this.config.persistToStorage) {
      this.saveToStorage()
    }

    return expiredKeys.length
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats, totalEntries: this.cache.size }
  }

  /**
   * Get cache entries for analysis
   */
  getEntries(): CacheEntry[] {
    return Array.from(this.cache.values())
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        accessOrder: this.accessOrder,
        stats: this.stats,
        timestamp: new Date().toISOString()
      }

      const jsonData = JSON.stringify(cacheData)
      
      if (this.config.compressionEnabled) {
        // Simple compression would go here
        localStorage.setItem('claude-prompt-cache', jsonData)
      } else {
        localStorage.setItem('claude-prompt-cache', jsonData)
      }
    } catch (error) {
      console.warn('Failed to save prompt cache to storage:', error)
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const cacheData = localStorage.getItem('claude-prompt-cache')
      if (!cacheData) return

      const parsed = JSON.parse(cacheData)
      
      // Restore cache entries
      this.cache = new Map(parsed.entries || [])
      this.accessOrder = parsed.accessOrder || []
      this.stats = { ...this.stats, ...parsed.stats }

      // Clean up expired entries on load
      this.cleanup()

    } catch (error) {
      console.warn('Failed to load prompt cache from storage:', error)
      this.clear()
    }
  }

  /**
   * Export cache for backup
   */
  export(): string {
    return JSON.stringify({
      entries: Array.from(this.cache.entries()),
      accessOrder: this.accessOrder,
      stats: this.stats,
      config: this.config,
      exportedAt: new Date().toISOString()
    })
  }

  /**
   * Import cache from backup
   */
  import(cacheData: string): void {
    try {
      const parsed = JSON.parse(cacheData)
      
      this.cache = new Map(parsed.entries || [])
      this.accessOrder = parsed.accessOrder || []
      this.stats = { ...this.stats, ...parsed.stats }

      if (this.config.persistToStorage) {
        this.saveToStorage()
      }

    } catch (error) {
      throw new Error(`Failed to import cache data: ${error}`)
    }
  }

  /**
   * Get cache efficiency metrics
   */
  getEfficiencyMetrics(): {
    memoryUsage: number
    avgEntrySize: number
    hitRate: number
    savingsPercentage: number
    mostAccessedEntries: Array<{ key: string; accessCount: number; cost: number }>
  } {
    const entries = Array.from(this.cache.values())
    const totalSize = entries.reduce((sum, entry) => sum + entry.content.length, 0)
    const avgEntrySize = entries.length > 0 ? totalSize / entries.length : 0
    
    const totalPotentialCost = entries.reduce((sum, entry) => sum + (entry.cost * entry.accessCount), 0)
    const savingsPercentage = totalPotentialCost > 0 ? (this.stats.totalSavings / totalPotentialCost) * 100 : 0

    const mostAccessed = entries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(entry => ({
        key: entry.key,
        accessCount: entry.accessCount,
        cost: entry.cost
      }))

    return {
      memoryUsage: totalSize,
      avgEntrySize,
      hitRate: this.stats.hitRate,
      savingsPercentage,
      mostAccessedEntries: mostAccessed
    }
  }
}

/**
 * Global prompt cache instance
 */
let globalPromptCache: PromptCache | null = null

export function getGlobalPromptCache(): PromptCache {
  if (!globalPromptCache) {
    globalPromptCache = new PromptCache()
  }
  return globalPromptCache
}

export function setGlobalPromptCache(cache: PromptCache): void {
  globalPromptCache = cache
}

/**
 * Create a prompt cache with specific configuration
 */
export function createPromptCache(config: Partial<CacheConfig> = {}): PromptCache {
  return new PromptCache(config)
}