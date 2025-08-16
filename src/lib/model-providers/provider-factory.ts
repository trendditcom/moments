/**
 * Model Provider Factory
 * Creates and manages model provider instances based on configuration
 */

import { ModelProvider, ModelProviderConfig, ModelMapping } from './provider-interface'
import { AnthropicProvider } from './anthropic-provider'
import { BedrockProvider } from './bedrock-provider'
import { AnthropicOptimizationConfig } from '../optimizations/anthropic-optimizer'
import { BedrockOptimizationConfig } from '../optimizations/bedrock-optimizer'
import { withCaching, CachedProviderWrapper } from '../caching/cached-provider-wrapper'

export interface ProviderFactoryConfig {
  type: 'anthropic' | 'bedrock'
  fallbackProvider?: 'anthropic' | 'bedrock'
  autoFallback?: boolean
  modelMapping?: ModelMapping
  cachingEnabled?: boolean
  anthropic?: {
    apiKeyEnv?: string
    baseUrl?: string
    timeout?: number
    maxRetries?: number
    optimizations?: AnthropicOptimizationConfig
    cachingEnabled?: boolean
  }
  bedrock?: {
    region?: string
    profile?: string
    useBedrockApiKey?: boolean
    apiKeyEnv?: string
    inferenceProfile?: string
    timeout?: number
    maxRetries?: number
    optimizations?: BedrockOptimizationConfig
    cachingEnabled?: boolean
  }
}

export class ModelProviderFactory {
  private static instances: Map<string, ModelProvider> = new Map()
  private static primaryProvider: ModelProvider | null = null
  private static fallbackProvider: ModelProvider | null = null
  private static config: ProviderFactoryConfig | null = null

  /**
   * Create a model provider instance
   */
  static createProvider(
    type: 'anthropic' | 'bedrock',
    config?: Partial<ModelProviderConfig>,
    modelMapping?: ModelMapping,
    optimizations?: AnthropicOptimizationConfig | BedrockOptimizationConfig,
    cachingEnabled?: boolean
  ): ModelProvider {
    const providerConfig: ModelProviderConfig = {
      type,
      ...config
    }

    let provider: ModelProvider

    switch (type) {
      case 'anthropic':
        provider = new AnthropicProvider(providerConfig, modelMapping)
        // Set optimization configuration if provided
        if (optimizations) {
          (provider as AnthropicProvider).setOptimizationConfig(optimizations as AnthropicOptimizationConfig)
        }
        break
      case 'bedrock':
        provider = new BedrockProvider(providerConfig, modelMapping)
        // Set optimization configuration if provided
        if (optimizations) {
          (provider as BedrockProvider).setOptimizationConfig(optimizations as BedrockOptimizationConfig)
        }
        break
      default:
        throw new Error(`Unknown provider type: ${type}`)
    }

    // Wrap with caching if enabled
    if (cachingEnabled !== false) { // Default to enabled
      provider = withCaching(provider, cachingEnabled)
    }

    return provider
  }

  /**
   * Initialize the factory with configuration
   */
  static initialize(config: ProviderFactoryConfig): void {
    this.config = config

    // Determine caching for primary provider
    const primaryCaching = config[config.type]?.cachingEnabled ?? config.cachingEnabled ?? true

    // Create primary provider
    const primaryConfig: ModelProviderConfig = {
      type: config.type,
      ...(config[config.type] || {})
    }
    this.primaryProvider = this.createProvider(
      config.type,
      primaryConfig,
      config.modelMapping,
      config[config.type]?.optimizations,
      primaryCaching
    )

    // Create fallback provider if configured
    if (config.fallbackProvider && config.fallbackProvider !== config.type) {
      const fallbackCaching = config[config.fallbackProvider]?.cachingEnabled ?? config.cachingEnabled ?? true
      
      const fallbackConfig: ModelProviderConfig = {
        type: config.fallbackProvider,
        ...(config[config.fallbackProvider] || {})
      }
      this.fallbackProvider = this.createProvider(
        config.fallbackProvider,
        fallbackConfig,
        config.modelMapping,
        config[config.fallbackProvider]?.optimizations,
        fallbackCaching
      )
    }

    // Store instances
    this.instances.set(config.type, this.primaryProvider)
    if (this.fallbackProvider && config.fallbackProvider) {
      this.instances.set(config.fallbackProvider, this.fallbackProvider)
    }
  }

  /**
   * Get the primary provider
   */
  static getPrimaryProvider(): ModelProvider {
    if (!this.primaryProvider) {
      // If not initialized, create a default Anthropic provider
      console.warn('Provider factory not initialized. Creating default Anthropic provider.')
      this.primaryProvider = this.createProvider('anthropic')
    }
    return this.primaryProvider
  }

  /**
   * Get the fallback provider
   */
  static getFallbackProvider(): ModelProvider | null {
    return this.fallbackProvider
  }

  /**
   * Get a specific provider by type
   */
  static getProvider(type: 'anthropic' | 'bedrock'): ModelProvider {
    let provider = this.instances.get(type)
    
    if (!provider) {
      // Create on demand with caching enabled by default
      const cachingEnabled = this.config?.[type]?.cachingEnabled ?? this.config?.cachingEnabled ?? true
      provider = this.createProvider(type, undefined, undefined, undefined, cachingEnabled)
      this.instances.set(type, provider)
    }
    
    return provider
  }

  /**
   * Get provider with automatic fallback
   */
  static async getProviderWithFallback(): Promise<ModelProvider> {
    const primary = this.getPrimaryProvider()
    
    // If no fallback configured, return primary
    if (!this.config?.autoFallback || !this.fallbackProvider) {
      return primary
    }

    // Check primary provider health
    try {
      const health = await primary.healthCheck()
      if (health.isHealthy) {
        return primary
      }
    } catch (error) {
      console.warn('Primary provider health check failed:', error)
    }

    // Try fallback provider
    if (this.fallbackProvider) {
      console.info('Switching to fallback provider')
      const fallbackHealth = await this.fallbackProvider.healthCheck()
      if (fallbackHealth.isHealthy) {
        return this.fallbackProvider
      }
    }

    // Return primary anyway (will likely fail but preserves error context)
    return primary
  }

  /**
   * Create provider from environment detection
   */
  static createFromEnvironment(): ModelProvider {
    // Check for Bedrock configuration
    const awsRegion = process.env.AWS_REGION
    const awsProfile = process.env.AWS_PROFILE
    const bedrockApiKey = process.env.BEDROCK_API_KEY
    
    // Check for Anthropic configuration
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY || 
                           process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY

    // Determine which provider to use based on available credentials
    if ((awsRegion || awsProfile || bedrockApiKey) && !anthropicApiKey) {
      // Bedrock credentials available, no Anthropic key
      console.info('Detected Bedrock configuration from environment')
      return this.createProvider('bedrock', {
        region: awsRegion,
        profile: awsProfile,
        useBedrockApiKey: !!bedrockApiKey,
        apiKeyEnv: bedrockApiKey ? 'BEDROCK_API_KEY' : undefined
      })
    } else if (anthropicApiKey && !awsRegion && !awsProfile && !bedrockApiKey) {
      // Only Anthropic key available
      console.info('Detected Anthropic configuration from environment')
      return this.createProvider('anthropic', {
        apiKeyEnv: anthropicApiKey.startsWith('NEXT_PUBLIC') 
          ? 'NEXT_PUBLIC_ANTHROPIC_API_KEY' 
          : 'ANTHROPIC_API_KEY'
      })
    } else if (anthropicApiKey) {
      // Both available or ambiguous, prefer Anthropic for local development
      console.info('Multiple providers detected, defaulting to Anthropic')
      return this.createProvider('anthropic', {
        apiKeyEnv: anthropicApiKey.startsWith('NEXT_PUBLIC') 
          ? 'NEXT_PUBLIC_ANTHROPIC_API_KEY' 
          : 'ANTHROPIC_API_KEY'
      })
    } else {
      // No credentials found
      throw new Error(
        'No provider credentials found. Please set either ANTHROPIC_API_KEY or configure AWS credentials for Bedrock.'
      )
    }
  }

  /**
   * Reset the factory (useful for testing)
   */
  static reset(): void {
    this.instances.clear()
    this.primaryProvider = null
    this.fallbackProvider = null
    this.config = null
  }

  /**
   * Get current configuration
   */
  static getConfig(): ProviderFactoryConfig | null {
    return this.config
  }

  /**
   * Update model mapping for all providers
   */
  static updateModelMapping(mapping: Partial<ModelMapping>): void {
    this.instances.forEach(provider => {
      provider.updateModelMapping(mapping)
    })
  }

  /**
   * Run health checks on all providers
   */
  static async healthCheckAll(): Promise<Map<string, any>> {
    const results = new Map()
    
    for (const [type, provider] of Array.from(this.instances.entries())) {
      try {
        const health = await provider.healthCheck()
        results.set(type, health)
      } catch (error: any) {
        results.set(type, {
          isHealthy: false,
          provider: type,
          error: error.message,
          lastChecked: new Date()
        })
      }
    }
    
    return results
  }

  /**
   * Enable optimizations for a specific provider
   */
  static enableOptimizations(
    type: 'anthropic' | 'bedrock',
    config?: AnthropicOptimizationConfig | BedrockOptimizationConfig
  ): void {
    const provider = this.instances.get(type)
    if (provider) {
      if (type === 'anthropic') {
        (provider as AnthropicProvider).setOptimizationConfig(
          config as AnthropicOptimizationConfig || {} as AnthropicOptimizationConfig
        )
      } else if (type === 'bedrock') {
        (provider as BedrockProvider).setOptimizationConfig(
          config as BedrockOptimizationConfig || {} as BedrockOptimizationConfig
        )
      }
    }
  }

  /**
   * Enable optimizations for all providers
   */
  static enableAllOptimizations(): void {
    for (const [type, provider] of this.instances.entries()) {
      if (type === 'anthropic') {
        (provider as AnthropicProvider).enableOptimizations()
      } else if (type === 'bedrock') {
        (provider as BedrockProvider).enableOptimizations()
      }
    }
  }

  /**
   * Disable optimizations for a specific provider
   */
  static disableOptimizations(type: 'anthropic' | 'bedrock'): void {
    const provider = this.instances.get(type)
    if (provider) {
      if (type === 'anthropic') {
        (provider as AnthropicProvider).disableOptimizations()
      } else if (type === 'bedrock') {
        (provider as BedrockProvider).disableOptimizations()
      }
    }
  }

  /**
   * Get optimization metrics for all providers
   */
  static getOptimizationMetrics(): Map<string, any> {
    const metrics = new Map()
    
    for (const [type, provider] of this.instances.entries()) {
      try {
        let providerMetrics: any = null
        
        if (type === 'anthropic') {
          providerMetrics = (provider as AnthropicProvider).getOptimizationMetrics()
        } else if (type === 'bedrock') {
          providerMetrics = (provider as BedrockProvider).getOptimizationMetrics()
        }
        
        if (providerMetrics) {
          metrics.set(type, providerMetrics)
        }
      } catch (error: any) {
        metrics.set(type, { error: error.message })
      }
    }
    
    return metrics
  }

  /**
   * Get optimization recommendations for all providers
   */
  static getOptimizationRecommendations(): Map<string, any[]> {
    const recommendations = new Map()
    
    for (const [type, provider] of this.instances.entries()) {
      try {
        let providerRecommendations: any[] = []
        
        // Unwrap cached provider if needed
        const unwrappedProvider = provider instanceof CachedProviderWrapper 
          ? provider.getWrappedProvider() 
          : provider
        
        if (type === 'anthropic') {
          providerRecommendations = (unwrappedProvider as AnthropicProvider).getOptimizationRecommendations() || []
        } else if (type === 'bedrock') {
          providerRecommendations = (unwrappedProvider as BedrockProvider).getOptimizationRecommendations() || []
        }
        
        recommendations.set(type, providerRecommendations)
      } catch (error: any) {
        recommendations.set(type, [{ error: error.message }])
      }
    }
    
    return recommendations
  }

  /**
   * Enable caching for specific provider
   */
  static enableCaching(type: 'anthropic' | 'bedrock'): void {
    const provider = this.instances.get(type)
    if (provider && provider instanceof CachedProviderWrapper) {
      provider.setCachingEnabled(true)
    }
  }

  /**
   * Disable caching for specific provider
   */
  static disableCaching(type: 'anthropic' | 'bedrock'): void {
    const provider = this.instances.get(type)
    if (provider && provider instanceof CachedProviderWrapper) {
      provider.setCachingEnabled(false)
    }
  }

  /**
   * Clear cache for specific provider
   */
  static clearProviderCache(type: 'anthropic' | 'bedrock'): number {
    const provider = this.instances.get(type)
    if (provider && provider instanceof CachedProviderWrapper) {
      return provider.clearCache()
    }
    return 0
  }

  /**
   * Clear cache for all providers
   */
  static clearAllCache(): Map<string, number> {
    const results = new Map<string, number>()
    
    for (const [type, provider] of this.instances.entries()) {
      if (provider instanceof CachedProviderWrapper) {
        const cleared = provider.clearCache()
        results.set(type, cleared)
      } else {
        results.set(type, 0)
      }
    }
    
    return results
  }

  /**
   * Get cache statistics for all providers
   */
  static getCacheStats(): Map<string, any> {
    const stats = new Map()
    
    for (const [type, provider] of this.instances.entries()) {
      if (provider instanceof CachedProviderWrapper) {
        stats.set(type, provider.getCacheStats())
      } else {
        stats.set(type, { cached: false })
      }
    }
    
    return stats
  }

  /**
   * Check if provider has caching enabled
   */
  static isCachingEnabled(type: 'anthropic' | 'bedrock'): boolean {
    const provider = this.instances.get(type)
    if (provider instanceof CachedProviderWrapper) {
      return provider.isCachingEnabled()
    }
    return false
  }
}