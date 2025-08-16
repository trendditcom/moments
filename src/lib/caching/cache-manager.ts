/**
 * Cache Manager
 * High-level cache management across all providers with advanced features
 */

import { ResponseCache, CacheConfig, CacheStats, CacheExportData, getGlobalResponseCache } from './response-cache'
import { ModelRequest, ModelResponse, ProviderType } from '../model-providers/provider-interface'
import { loadConfigClient } from '../config-loader.client'

export interface CacheManagerConfig {
  enabled?: boolean
  providers?: {
    anthropic?: CacheConfig
    bedrock?: CacheConfig
  }
  global?: {
    maxTotalMemory?: number
    analyticsEnabled?: boolean
    exportSchedule?: 'daily' | 'weekly' | 'never'
    warningThresholds?: {
      memoryUsage?: number // percentage (0-100)
      hitRate?: number // minimum hit rate percentage
    }
  }
}

export interface CacheAnalytics {
  totalRequests: number
  totalCacheHits: number
  totalCacheMisses: number
  overallHitRate: number
  providerPerformance: Record<ProviderType, {
    requests: number
    hits: number
    misses: number
    hitRate: number
    avgResponseTime: number
    costSavings: number // estimated cost savings from cache hits
  }>
  timeSeriesData: {
    timestamp: number
    hits: number
    misses: number
    hitRate: number
  }[]
  topCachedRequests: {
    requestHash: string
    provider: ProviderType
    hits: number
    lastUsed: number
    estimatedSavings: number
  }[]
  memoryUsageHistory: {
    timestamp: number
    memoryUsage: number
    entryCount: number
  }[]
}

export interface CacheWarning {
  type: 'memory' | 'hit_rate' | 'error'
  severity: 'info' | 'warning' | 'error'
  message: string
  provider?: ProviderType
  timestamp: number
  value?: number
  threshold?: number
}

/**
 * Advanced cache manager with analytics and optimization
 */
export class CacheManager {
  private responseCache: ResponseCache
  private config: CacheManagerConfig
  private analytics: Partial<CacheAnalytics> = {}
  private warnings: CacheWarning[] = []
  private analyticsTimer?: NodeJS.Timeout
  private exportTimer?: NodeJS.Timeout

  constructor(config?: Partial<CacheManagerConfig>) {
    this.config = this.mergeDefaultConfig(config)
    this.responseCache = getGlobalResponseCache()
    
    // Update response cache with merged config
    this.updateResponseCacheConfig()
    
    // Initialize analytics
    if (this.config.global?.analyticsEnabled) {
      this.initializeAnalytics()
    }
    
    // Schedule exports if configured
    if (this.config.global?.exportSchedule && this.config.global.exportSchedule !== 'never') {
      this.scheduleExports()
    }
  }

  /**
   * Merge with default configuration
   */
  private mergeDefaultConfig(userConfig?: Partial<CacheManagerConfig>): CacheManagerConfig {
    const defaultConfig: CacheManagerConfig = {
      enabled: true,
      providers: {
        anthropic: {
          enabled: true,
          maxEntries: 500,
          defaultTtl: 2 * 60 * 60 * 1000, // 2 hours for Anthropic
          maxMemory: 50 * 1024 * 1024, // 50MB
          compressionEnabled: true,
          persistToDisk: true,
          cleanupInterval: 10 * 60 * 1000, // 10 minutes
        },
        bedrock: {
          enabled: true,
          maxEntries: 500,
          defaultTtl: 4 * 60 * 60 * 1000, // 4 hours for Bedrock (more expensive)
          maxMemory: 50 * 1024 * 1024, // 50MB
          compressionEnabled: true,
          persistToDisk: true,
          cleanupInterval: 15 * 60 * 1000, // 15 minutes
        }
      },
      global: {
        maxTotalMemory: 100 * 1024 * 1024, // 100MB total
        analyticsEnabled: true,
        exportSchedule: 'weekly',
        warningThresholds: {
          memoryUsage: 90, // 90%
          hitRate: 30 // 30% minimum hit rate
        }
      }
    }

    const merged = {
      ...defaultConfig,
      ...userConfig,
      providers: {
        anthropic: { ...defaultConfig.providers!.anthropic, ...userConfig?.providers?.anthropic },
        bedrock: { ...defaultConfig.providers!.bedrock, ...userConfig?.providers?.bedrock }
      },
      global: { ...defaultConfig.global!, ...userConfig?.global }
    }

    return merged as CacheManagerConfig
  }

  /**
   * Update response cache configuration based on current provider and settings
   */
  private updateResponseCacheConfig(): void {
    const anthropicConfig = this.config.providers?.anthropic
    const bedrockConfig = this.config.providers?.bedrock
    const globalConfig = this.config.global
    
    if (!anthropicConfig || !bedrockConfig || !globalConfig) {
      return
    }

    // Combine provider configs for unified cache
    const combinedConfig: Partial<CacheConfig> = {
      enabled: this.config.enabled,
      maxEntries: (anthropicConfig.maxEntries || 500) + (bedrockConfig.maxEntries || 500),
      defaultTtl: Math.max(anthropicConfig.defaultTtl || 2 * 60 * 60 * 1000, bedrockConfig.defaultTtl || 4 * 60 * 60 * 1000),
      maxMemory: globalConfig.maxTotalMemory || 100 * 1024 * 1024,
      compressionEnabled: anthropicConfig.compressionEnabled,
      persistToDisk: anthropicConfig.persistToDisk,
      cleanupInterval: Math.min(anthropicConfig.cleanupInterval || 10 * 60 * 1000, bedrockConfig.cleanupInterval || 15 * 60 * 1000),
      providerSpecificTtl: {
        anthropic: anthropicConfig.defaultTtl || 2 * 60 * 60 * 1000,
        bedrock: bedrockConfig.defaultTtl || 4 * 60 * 60 * 1000
      }
    }

    this.responseCache.updateConfig(combinedConfig)
  }

  /**
   * Initialize analytics tracking
   */
  private initializeAnalytics(): void {
    this.analytics = {
      totalRequests: 0,
      totalCacheHits: 0,
      totalCacheMisses: 0,
      overallHitRate: 0,
      providerPerformance: {
        anthropic: { requests: 0, hits: 0, misses: 0, hitRate: 0, avgResponseTime: 0, costSavings: 0 },
        bedrock: { requests: 0, hits: 0, misses: 0, hitRate: 0, avgResponseTime: 0, costSavings: 0 }
      },
      timeSeriesData: [],
      topCachedRequests: [],
      memoryUsageHistory: []
    }

    // Start analytics collection timer
    this.analyticsTimer = setInterval(() => {
      this.collectAnalytics()
    }, 60 * 1000) // Every minute
  }

  /**
   * Collect analytics data
   */
  private collectAnalytics(): void {
    const stats = this.responseCache.getStats()
    const now = Date.now()

    // Update basic metrics
    this.analytics.totalRequests = stats.totalHits + stats.totalMisses
    this.analytics.totalCacheHits = stats.totalHits
    this.analytics.totalCacheMisses = stats.totalMisses
    this.analytics.overallHitRate = stats.hitRate

    // Update provider performance
    if (this.analytics.providerPerformance) {
      for (const provider of ['anthropic', 'bedrock'] as ProviderType[]) {
        const providerHits = stats.hitsByProvider[provider] || 0
        const providerEntries = stats.entriesByProvider[provider] || 0
        const providerRequests = providerHits + (stats.totalMisses * providerEntries / stats.totalEntries || 0)

        this.analytics.providerPerformance[provider] = {
          requests: Math.round(providerRequests),
          hits: providerHits,
          misses: Math.round(providerRequests - providerHits),
          hitRate: providerRequests > 0 ? providerHits / providerRequests : 0,
          avgResponseTime: 0, // Would need to track this separately
          costSavings: this.estimateCostSavings(provider, providerHits)
        }
      }
    }

    // Add time series data point
    if (this.analytics.timeSeriesData) {
      this.analytics.timeSeriesData.push({
        timestamp: now,
        hits: stats.totalHits,
        misses: stats.totalMisses,
        hitRate: stats.hitRate
      })

      // Keep only last 24 hours of data
      const cutoff = now - 24 * 60 * 60 * 1000
      this.analytics.timeSeriesData = this.analytics.timeSeriesData.filter(
        point => point.timestamp > cutoff
      )
    }

    // Add memory usage data point
    if (this.analytics.memoryUsageHistory) {
      this.analytics.memoryUsageHistory.push({
        timestamp: now,
        memoryUsage: stats.memoryUsage,
        entryCount: stats.totalEntries
      })

      // Keep only last 7 days of data
      const cutoff = now - 7 * 24 * 60 * 60 * 1000
      this.analytics.memoryUsageHistory = this.analytics.memoryUsageHistory.filter(
        point => point.timestamp > cutoff
      )
    }

    // Check warning thresholds
    this.checkWarningThresholds(stats)
  }

  /**
   * Estimate cost savings from cache hits
   */
  private estimateCostSavings(provider: ProviderType, hits: number): number {
    // Rough cost estimates per request
    const costPerRequest = {
      anthropic: 0.005, // $0.005 per request average
      bedrock: 0.0055   // $0.0055 per request average (10% markup)
    }

    return hits * costPerRequest[provider]
  }

  /**
   * Check warning thresholds and generate warnings
   */
  private checkWarningThresholds(stats: CacheStats): void {
    const now = Date.now()
    const maxMemory = this.config.global?.maxTotalMemory || 100 * 1024 * 1024
    const memoryUsagePercent = (stats.memoryUsage / maxMemory) * 100
    const memoryThreshold = this.config.global?.warningThresholds?.memoryUsage || 90
    const hitRateThreshold = this.config.global?.warningThresholds?.hitRate || 30

    // Memory usage warning
    if (memoryUsagePercent > memoryThreshold) {
      this.addWarning({
        type: 'memory',
        severity: memoryUsagePercent > 95 ? 'error' : 'warning',
        message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        timestamp: now,
        value: memoryUsagePercent,
        threshold: memoryThreshold
      })
    }

    // Hit rate warning
    if (stats.hitRate < hitRateThreshold / 100) {
      this.addWarning({
        type: 'hit_rate',
        severity: stats.hitRate < 0.1 ? 'error' : 'warning',
        message: `Low cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`,
        timestamp: now,
        value: stats.hitRate * 100,
        threshold: hitRateThreshold
      })
    }
  }

  /**
   * Add warning to collection
   */
  private addWarning(warning: CacheWarning): void {
    // Don't duplicate warnings of same type within 30 minutes
    const cutoff = Date.now() - 30 * 60 * 1000
    const exists = this.warnings.some(w => 
      w.type === warning.type && 
      w.timestamp > cutoff
    )

    if (!exists) {
      this.warnings.push(warning)
      
      // Keep only last 100 warnings
      if (this.warnings.length > 100) {
        this.warnings = this.warnings.slice(-100)
      }
    }
  }

  /**
   * Schedule automatic exports
   */
  private scheduleExports(): void {
    const exportSchedule = this.config.global?.exportSchedule || 'weekly'
    const interval = exportSchedule === 'daily' 
      ? 24 * 60 * 60 * 1000  // 24 hours
      : 7 * 24 * 60 * 60 * 1000  // 7 days

    this.exportTimer = setInterval(() => {
      this.exportToFile()
    }, interval)
  }

  /**
   * Get cached response
   */
  async get(request: ModelRequest, provider: ProviderType): Promise<ModelResponse | null> {
    const providerConfig = this.config.providers?.[provider]
    if (!this.config.enabled || !providerConfig?.enabled) {
      return null
    }

    const result = this.responseCache.get(request, provider)
    
    // Track analytics
    if (this.config.global?.analyticsEnabled) {
      if (result) {
        this.analytics.totalCacheHits = (this.analytics.totalCacheHits || 0) + 1
      } else {
        this.analytics.totalCacheMisses = (this.analytics.totalCacheMisses || 0) + 1
      }
    }

    return result
  }

  /**
   * Store response in cache
   */
  async set(request: ModelRequest, response: ModelResponse, provider: ProviderType): Promise<void> {
    const providerConfig = this.config.providers?.[provider]
    if (!this.config.enabled || !providerConfig?.enabled) {
      return
    }

    this.responseCache.set(request, response, provider)
  }

  /**
   * Check if request is cached
   */
  has(request: ModelRequest, provider: ProviderType): boolean {
    const providerConfig = this.config.providers?.[provider]
    if (!this.config.enabled || !providerConfig?.enabled) {
      return false
    }

    return this.responseCache.has(request, provider)
  }

  /**
   * Clear cache for specific provider
   */
  clearProvider(provider: ProviderType): number {
    return this.responseCache.clearProvider(provider)
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.responseCache.clear()
    
    // Reset analytics
    if (this.analytics) {
      this.analytics.totalRequests = 0
      this.analytics.totalCacheHits = 0
      this.analytics.totalCacheMisses = 0
      this.analytics.overallHitRate = 0
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    return this.responseCache.getStats()
  }

  /**
   * Get analytics data
   */
  getAnalytics(): CacheAnalytics {
    return this.analytics as CacheAnalytics
  }

  /**
   * Get current warnings
   */
  getWarnings(): CacheWarning[] {
    return [...this.warnings]
  }

  /**
   * Clear warnings
   */
  clearWarnings(): void {
    this.warnings = []
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheManagerConfig>): void {
    this.config = this.mergeDefaultConfig({ ...this.config, ...newConfig })
    this.updateResponseCacheConfig()

    // Restart analytics if needed
    if (newConfig.global?.analyticsEnabled !== undefined) {
      if (this.analyticsTimer) {
        clearInterval(this.analyticsTimer)
        this.analyticsTimer = undefined
      }
      
      if (this.config.global?.analyticsEnabled) {
        this.initializeAnalytics()
      }
    }

    // Restart export scheduler if needed
    if (newConfig.global?.exportSchedule) {
      if (this.exportTimer) {
        clearInterval(this.exportTimer)
        this.exportTimer = undefined
      }
      
      const exportSchedule = this.config.global?.exportSchedule
      if (exportSchedule && exportSchedule !== 'never') {
        this.scheduleExports()
      }
    }
  }

  /**
   * Get cache optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    type: 'config' | 'usage' | 'memory'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    implementation: string
    estimatedImpact: string
  }> {
    const recommendations = []
    const stats = this.getStats()

    // Hit rate optimization
    if (stats.hitRate < 0.3) {
      recommendations.push({
        type: 'config' as const,
        priority: 'high' as const,
        title: 'Increase Cache TTL',
        description: `Current hit rate is ${(stats.hitRate * 100).toFixed(1)}%, which is below optimal`,
        implementation: 'Increase defaultTtl in cache configuration to keep responses longer',
        estimatedImpact: '15-25% improvement in hit rate'
      })
    }

    // Memory optimization
    const maxMemory = this.config.global?.maxTotalMemory || 100 * 1024 * 1024
    if (stats.memoryUsage > maxMemory * 0.8) {
      recommendations.push({
        type: 'memory' as const,
        priority: 'medium' as const,
        title: 'Optimize Memory Usage',
        description: `Memory usage is ${((stats.memoryUsage / maxMemory) * 100).toFixed(1)}%`,
        implementation: 'Enable compression or reduce maxEntries',
        estimatedImpact: '30-40% reduction in memory usage'
      })
    }

    // Provider-specific recommendations
    if (stats.entriesByProvider.anthropic > stats.entriesByProvider.bedrock * 2) {
      recommendations.push({
        type: 'usage' as const,
        priority: 'low' as const,
        title: 'Balance Provider Usage',
        description: 'Anthropic cache has significantly more entries than Bedrock',
        implementation: 'Consider adjusting provider-specific TTL or usage patterns',
        estimatedImpact: '10-15% improvement in cache efficiency'
      })
    }

    return recommendations
  }

  /**
   * Export cache data to file
   */
  async exportToFile(): Promise<string> {
    try {
      const exportData = this.responseCache.export()
      const enhancedExport = {
        ...exportData,
        analytics: this.analytics,
        warnings: this.warnings,
        managerConfig: this.config
      }

      const blob = new Blob([JSON.stringify(enhancedExport, null, 2)], {
        type: 'application/json'
      })

      const filename = `moments-cache-export-${new Date().toISOString().split('T')[0]}.json`
      
      if (typeof window !== 'undefined') {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }

      return filename
    } catch (error) {
      console.error('Failed to export cache:', error)
      throw error
    }
  }

  /**
   * Import cache data from file
   */
  async importFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const success = this.responseCache.import(data)
      
      if (success && data.analytics) {
        this.analytics = data.analytics
      }
      
      if (success && data.warnings) {
        this.warnings = data.warnings
      }

      return success
    } catch (error) {
      console.error('Failed to import cache:', error)
      return false
    }
  }

  /**
   * Cleanup and destroy manager
   */
  destroy(): void {
    if (this.analyticsTimer) {
      clearInterval(this.analyticsTimer)
    }
    
    if (this.exportTimer) {
      clearInterval(this.exportTimer)
    }
    
    // Don't destroy global cache as other parts might use it
  }
}

// Global cache manager instance
let globalCacheManager: CacheManager | null = null

/**
 * Get global cache manager instance
 */
export function getGlobalCacheManager(): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager()
  }
  return globalCacheManager
}

/**
 * Initialize global cache manager with config
 */
export async function initializeGlobalCacheManager(config?: Partial<CacheManagerConfig>): Promise<CacheManager> {
  if (globalCacheManager) {
    globalCacheManager.destroy()
  }
  
  // Load cache configuration from app config if not provided
  if (!config) {
    try {
      const appConfig = await loadConfigClient()
      // Extract cache config from app config if it exists
      const cacheConfigFromApp = (appConfig as any)?.cache as Partial<CacheManagerConfig>
      config = cacheConfigFromApp
    } catch (error) {
      console.warn('Could not load cache config from app config:', error)
    }
  }
  
  globalCacheManager = new CacheManager(config)
  return globalCacheManager
}

/**
 * Destroy global cache manager
 */
export function destroyGlobalCacheManager(): void {
  if (globalCacheManager) {
    globalCacheManager.destroy()
    globalCacheManager = null
  }
}