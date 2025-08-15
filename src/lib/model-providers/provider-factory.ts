/**
 * Model Provider Factory
 * Creates and manages model provider instances based on configuration
 */

import { ModelProvider, ModelProviderConfig, ModelMapping } from './provider-interface'
import { AnthropicProvider } from './anthropic-provider'
import { BedrockProvider } from './bedrock-provider'

export interface ProviderFactoryConfig {
  type: 'anthropic' | 'bedrock'
  fallbackProvider?: 'anthropic' | 'bedrock'
  autoFallback?: boolean
  modelMapping?: ModelMapping
  anthropic?: {
    apiKeyEnv?: string
    baseUrl?: string
    timeout?: number
    maxRetries?: number
  }
  bedrock?: {
    region?: string
    profile?: string
    useBedrockApiKey?: boolean
    apiKeyEnv?: string
    inferenceProfile?: string
    timeout?: number
    maxRetries?: number
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
    modelMapping?: ModelMapping
  ): ModelProvider {
    const providerConfig: ModelProviderConfig = {
      type,
      ...config
    }

    switch (type) {
      case 'anthropic':
        return new AnthropicProvider(providerConfig, modelMapping)
      case 'bedrock':
        return new BedrockProvider(providerConfig, modelMapping)
      default:
        throw new Error(`Unknown provider type: ${type}`)
    }
  }

  /**
   * Initialize the factory with configuration
   */
  static initialize(config: ProviderFactoryConfig): void {
    this.config = config

    // Create primary provider
    const primaryConfig: ModelProviderConfig = {
      type: config.type,
      ...(config[config.type] || {})
    }
    this.primaryProvider = this.createProvider(
      config.type,
      primaryConfig,
      config.modelMapping
    )

    // Create fallback provider if configured
    if (config.fallbackProvider && config.fallbackProvider !== config.type) {
      const fallbackConfig: ModelProviderConfig = {
        type: config.fallbackProvider,
        ...(config[config.fallbackProvider] || {})
      }
      this.fallbackProvider = this.createProvider(
        config.fallbackProvider,
        fallbackConfig,
        config.modelMapping
      )
    }

    // Store instances
    this.instances.set(config.type, this.primaryProvider)
    if (this.fallbackProvider) {
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
      // Create on demand
      provider = this.createProvider(type)
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
    
    for (const [type, provider] of this.instances) {
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
}