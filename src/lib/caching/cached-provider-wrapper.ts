/**
 * Cached Provider Wrapper
 * Wraps any ModelProvider with caching functionality
 */

import { 
  ModelProvider, 
  ModelRequest, 
  ModelResponse, 
  ModelStreamChunk, 
  ProviderHealthCheck,
  ProviderType 
} from '../model-providers/provider-interface'
import { getGlobalCacheManager } from './cache-manager'

/**
 * Wrapper that adds caching to any ModelProvider
 */
export class CachedProviderWrapper extends ModelProvider {
  private wrappedProvider: ModelProvider
  private cacheManager = getGlobalCacheManager()
  private cachingEnabled: boolean

  constructor(provider: ModelProvider, cachingEnabled: boolean = true) {
    // Initialize parent with wrapped provider's config
    super(provider.getConfig(), provider['modelMapping'])
    this.wrappedProvider = provider
    this.cachingEnabled = cachingEnabled
  }

  /**
   * Send request with caching
   */
  async sendRequest(request: ModelRequest): Promise<ModelResponse> {
    const providerType = this.wrappedProvider.getType() as ProviderType

    // Check cache first if enabled
    if (this.cachingEnabled) {
      const cachedResponse = await this.cacheManager.get(request, providerType)
      if (cachedResponse) {
        console.log(`Cache hit for ${providerType} request`)
        return cachedResponse
      }
    }

    // Make actual request
    const response = await this.wrappedProvider.sendRequest(request)

    // Cache the response if enabled and not streaming
    if (this.cachingEnabled && !request.stream) {
      await this.cacheManager.set(request, response, providerType)
      console.log(`Cached response for ${providerType} request`)
    }

    return response
  }

  /**
   * Stream request (no caching for streams)
   */
  async streamRequest(
    request: ModelRequest,
    onChunk: (chunk: ModelStreamChunk) => void
  ): Promise<void> {
    // Streaming requests are not cached
    return this.wrappedProvider.streamRequest(request, onChunk)
  }

  /**
   * Health check (delegated)
   */
  async healthCheck(): Promise<ProviderHealthCheck> {
    return this.wrappedProvider.healthCheck()
  }

  /**
   * Validate auth (delegated)
   */
  async validateAuth(): Promise<boolean> {
    return this.wrappedProvider.validateAuth()
  }

  /**
   * Get available models (delegated)
   */
  async getAvailableModels(): Promise<string[]> {
    return this.wrappedProvider.getAvailableModels()
  }

  /**
   * Estimate cost (delegated)
   */
  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    return this.wrappedProvider.estimateCost(inputTokens, outputTokens, model)
  }

  /**
   * Get rate limits (delegated)
   */
  getRateLimits(): {
    requestsPerMinute: number
    tokensPerMinute: number
    concurrentRequests: number
  } {
    return this.wrappedProvider.getRateLimits()
  }

  /**
   * Get the wrapped provider
   */
  getWrappedProvider(): ModelProvider {
    return this.wrappedProvider
  }

  /**
   * Enable/disable caching
   */
  setCachingEnabled(enabled: boolean): void {
    this.cachingEnabled = enabled
  }

  /**
   * Check if caching is enabled
   */
  isCachingEnabled(): boolean {
    return this.cachingEnabled
  }

  /**
   * Clear cache for this provider
   */
  clearCache(): number {
    const providerType = this.wrappedProvider.getType() as ProviderType
    return this.cacheManager.clearProvider(providerType)
  }

  /**
   * Check if a request would be cached
   */
  isCached(request: ModelRequest): boolean {
    if (!this.cachingEnabled || request.stream) {
      return false
    }
    
    const providerType = this.wrappedProvider.getType() as ProviderType
    return this.cacheManager.has(request, providerType)
  }

  /**
   * Get cache statistics for this provider
   */
  getCacheStats() {
    const stats = this.cacheManager.getStats()
    const providerType = this.wrappedProvider.getType() as ProviderType
    
    return {
      entries: stats.entriesByProvider[providerType] || 0,
      hits: stats.hitsByProvider[providerType] || 0,
      memoryUsage: stats.memoryUsage,
      hitRate: stats.hitRate
    }
  }
}

/**
 * Utility function to wrap any provider with caching
 */
export function withCaching(provider: ModelProvider, enabled: boolean = true): CachedProviderWrapper {
  if (provider instanceof CachedProviderWrapper) {
    // Already wrapped, just update caching setting
    provider.setCachingEnabled(enabled)
    return provider
  }
  
  return new CachedProviderWrapper(provider, enabled)
}

/**
 * Utility function to unwrap a cached provider
 */
export function unwrapProvider(provider: ModelProvider): ModelProvider {
  if (provider instanceof CachedProviderWrapper) {
    return provider.getWrappedProvider()
  }
  
  return provider
}