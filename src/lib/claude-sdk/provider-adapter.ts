/**
 * Provider Adapter for Claude Code SDK
 * Adapts different provider responses to a standardized interface
 */

import { ModelProvider, ModelRequest, ModelResponse, ModelMessage, ModelStreamChunk } from '../model-providers/provider-interface'

export interface AdapterRequest {
  provider: ModelProvider
  messages: ModelMessage[]
  model: string
  options?: {
    maxTokens?: number
    temperature?: number
    topP?: number
    system?: string
    stream?: boolean
    enableCaching?: boolean
    metadata?: Record<string, any>
  }
}

export interface AdapterResponse {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  provider: string
  metadata?: Record<string, any>
  cost?: number
  cacheHit?: boolean
}

export interface AdapterStreamChunk {
  type: 'text' | 'metadata' | 'error' | 'done'
  content?: string
  delta?: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  metadata?: Record<string, any>
  error?: string
  isDone?: boolean
}

/**
 * Provider Adapter class that standardizes provider interactions
 */
export class ProviderAdapter {
  private provider: ModelProvider
  private cacheEnabled: boolean
  private cache: Map<string, AdapterResponse> = new Map()

  constructor(provider: ModelProvider, options: { enableCache?: boolean } = {}) {
    this.provider = provider
    this.cacheEnabled = options.enableCache ?? true
  }

  /**
   * Send a standardized request to the provider
   */
  async sendRequest(request: AdapterRequest): Promise<AdapterResponse> {
    const { messages, model, options = {} } = request

    // Generate cache key if caching is enabled
    const cacheKey = this.cacheEnabled ? this.generateCacheKey(request) : null
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      return { ...cached, cacheHit: true }
    }

    // Build provider request
    const providerRequest: ModelRequest = {
      messages,
      model: this.provider.mapModelId(model),
      maxTokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      topP: options.topP,
      system: options.system,
      stream: options.stream || false,
      metadata: {
        ...options.metadata,
        enableCaching: options.enableCaching
      }
    }

    try {
      const response = await this.provider.sendRequest(providerRequest)
      
      // Adapt response to standardized format
      const adaptedResponse: AdapterResponse = {
        content: response.content,
        usage: {
          inputTokens: response.usage?.inputTokens || 0,
          outputTokens: response.usage?.outputTokens || 0,
          totalTokens: response.usage?.totalTokens || 
            (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0)
        },
        model: response.model,
        provider: this.provider.getType(),
        metadata: response.stopReason ? { stopReason: response.stopReason } : undefined,
        cost: response.usage ? 
          this.provider.estimateCost(
            response.usage.inputTokens,
            response.usage.outputTokens,
            response.model
          ) : 0,
        cacheHit: false
      }

      // Cache the response if caching is enabled
      if (cacheKey && this.cacheEnabled) {
        this.cache.set(cacheKey, adaptedResponse)
      }

      return adaptedResponse

    } catch (error: any) {
      throw new ProviderAdapterError(
        `Provider ${this.provider.getType()} request failed: ${error.message}`,
        this.provider.getType(),
        error
      )
    }
  }

  /**
   * Stream a request with standardized chunk format
   */
  async *streamRequest(request: AdapterRequest): AsyncIterableIterator<AdapterStreamChunk> {
    const { messages, model, options = {} } = request

    const providerRequest: ModelRequest = {
      messages,
      model: this.provider.mapModelId(model),
      maxTokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      topP: options.topP,
      system: options.system,
      stream: true,
      metadata: {
        ...options.metadata,
        enableCaching: options.enableCaching
      }
    }

    let fullContent = ''
    let totalInputTokens = 0
    let totalOutputTokens = 0

    try {
      await this.provider.streamRequest(providerRequest, (chunk: ModelStreamChunk) => {
        const adaptedChunk: AdapterStreamChunk = this.adaptStreamChunk(chunk)
        
        if (adaptedChunk.type === 'text' && adaptedChunk.content) {
          fullContent += adaptedChunk.content
        }

        if (adaptedChunk.usage) {
          totalInputTokens = adaptedChunk.usage.inputTokens
          totalOutputTokens += adaptedChunk.usage.outputTokens || 0
        }

        // Note: In real streaming, we would yield here
        // For this implementation, we're collecting for final yield
      })

      // Yield final chunk with complete data
      yield {
        type: 'text',
        content: fullContent,
        delta: fullContent,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens
        },
        metadata: {
          provider: this.provider.getType(),
          model: providerRequest.model
        }
      }

      // Yield completion marker
      yield {
        type: 'done',
        isDone: true,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens
        }
      }

    } catch (error: any) {
      yield {
        type: 'error',
        error: `Streaming failed: ${error.message}`,
        metadata: {
          provider: this.provider.getType(),
          originalError: error
        }
      }
    }
  }

  /**
   * Adapt provider-specific stream chunks to standardized format
   */
  private adaptStreamChunk(chunk: ModelStreamChunk): AdapterStreamChunk {
    switch (chunk.type) {
      case 'text':
        return {
          type: 'text',
          content: chunk.content,
          delta: chunk.content
        }

      case 'metadata':
        return {
          type: 'metadata',
          metadata: chunk.metadata
        }

      case 'error':
        return {
          type: 'error',
          error: chunk.error
        }

      default:
        return {
          type: 'metadata',
          metadata: { originalType: chunk.type, ...chunk.metadata }
        }
    }
  }

  /**
   * Generate cache key for request caching
   */
  private generateCacheKey(request: AdapterRequest): string {
    const { messages, model, options = {} } = request
    
    const keyData = {
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      model,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 4000,
      system: options.system,
      provider: this.provider.getType()
    }

    return Buffer.from(JSON.stringify(keyData)).toString('base64')
  }

  /**
   * Clear adapter cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    hitRate: number
    totalRequests: number
    cacheHits: number
  } {
    // This would be implemented with proper hit/miss tracking
    return {
      size: this.cache.size,
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0
    }
  }

  /**
   * Switch to a different provider
   */
  switchProvider(newProvider: ModelProvider): void {
    this.provider = newProvider
    // Clear cache when switching providers
    this.clearCache()
  }

  /**
   * Get current provider information
   */
  getProviderInfo(): {
    type: string
    config: any
    health: Promise<boolean>
  } {
    return {
      type: this.provider.getType(),
      config: this.provider.getConfig(),
      health: this.provider.healthCheck().then(h => h.isHealthy).catch(() => false)
    }
  }

  /**
   * Validate provider configuration
   */
  async validateProvider(): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Check authentication
      const authValid = await this.provider.validateAuth()
      if (!authValid) {
        errors.push('Authentication validation failed')
      }

      // Check health
      const health = await this.provider.healthCheck()
      if (!health.isHealthy) {
        errors.push(`Provider health check failed: ${health.error}`)
      }

      // Check model availability
      const availableModels = await this.provider.getAvailableModels()
      if (availableModels.length === 0) {
        warnings.push('No models reported as available')
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }

    } catch (error: any) {
      return {
        isValid: false,
        errors: [`Provider validation failed: ${error.message}`],
        warnings
      }
    }
  }

  /**
   * Get provider-specific optimizations
   */
  getOptimizations(): {
    supportsCaching: boolean
    supportsStreaming: boolean
    recommendedBatchSize: number
    maxConcurrentRequests: number
  } {
    const providerType = this.provider.getType()
    
    // Provider-specific optimizations
    switch (providerType) {
      case 'anthropic':
        return {
          supportsCaching: true,
          supportsStreaming: true,
          recommendedBatchSize: 5,
          maxConcurrentRequests: 10
        }

      case 'bedrock':
        return {
          supportsCaching: false,
          supportsStreaming: true,
          recommendedBatchSize: 3,
          maxConcurrentRequests: 5
        }

      default:
        return {
          supportsCaching: false,
          supportsStreaming: false,
          recommendedBatchSize: 1,
          maxConcurrentRequests: 1
        }
    }
  }
}

/**
 * Provider Adapter Error class
 */
export class ProviderAdapterError extends Error {
  constructor(
    message: string,
    public provider: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'ProviderAdapterError'
  }
}

/**
 * Create a provider adapter with automatic provider detection
 */
export function createProviderAdapter(
  provider?: ModelProvider,
  options: { enableCache?: boolean } = {}
): ProviderAdapter {
  if (!provider) {
    // Use the factory to get the primary provider
    const { ModelProviderFactory } = require('../model-providers/provider-factory')
    const primaryProvider = ModelProviderFactory.getPrimaryProvider()
    if (!primaryProvider) {
      throw new Error('No primary provider available')
    }
    provider = primaryProvider
  }

  return new ProviderAdapter(provider!, options)
}

/**
 * Multi-provider adapter for automatic failover
 */
export class MultiProviderAdapter {
  private primaryAdapter: ProviderAdapter
  private fallbackAdapter?: ProviderAdapter
  private failoverThreshold: number = 3

  constructor(
    primaryProvider: ModelProvider,
    fallbackProvider?: ModelProvider,
    options: { enableCache?: boolean; failoverThreshold?: number } = {}
  ) {
    this.primaryAdapter = new ProviderAdapter(primaryProvider, options)
    this.fallbackAdapter = fallbackProvider ? 
      new ProviderAdapter(fallbackProvider, options) : undefined
    this.failoverThreshold = options.failoverThreshold || 3
  }

  async sendRequest(request: AdapterRequest): Promise<AdapterResponse> {
    try {
      return await this.primaryAdapter.sendRequest(request)
    } catch (error) {
      if (this.fallbackAdapter) {
        console.warn('Primary provider failed, trying fallback:', error)
        return await this.fallbackAdapter.sendRequest(request)
      }
      throw error
    }
  }

  async *streamRequest(request: AdapterRequest): AsyncIterableIterator<AdapterStreamChunk> {
    try {
      yield* this.primaryAdapter.streamRequest(request)
    } catch (error) {
      if (this.fallbackAdapter) {
        console.warn('Primary provider streaming failed, trying fallback:', error)
        yield* this.fallbackAdapter.streamRequest(request)
      } else {
        throw error
      }
    }
  }
}