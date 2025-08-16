/**
 * Model ID Translation System
 * Maps logical model names to provider-specific model IDs with caching and fallback support
 */

import {
  LogicalModelName,
  ProviderType,
  ModelMappingConfig,
  ModelTranslationResult,
  ModelTranslatorConfig,
  ModelTranslatorStats,
  ModelTranslationError,
  ModelNotFoundError,
  TranslationCache,
  ModelTranslatorOptions,
  ModelFallbackConfig,
  ModelValidationResult
} from '@/types/model-provider'

import { ModelProviderFactory } from '../model-providers/provider-factory'
import { loadConfigClient } from '../config-loader.client'

/**
 * Model Translator class that handles logical name to provider-specific ID translation
 */
export class ModelTranslator {
  private config: ModelTranslatorConfig
  private modelMapping: ModelMappingConfig
  private translationCache: Map<string, { result: ModelTranslationResult; expiresAt: Date }> = new Map()
  private stats: ModelTranslatorStats
  private fallbackConfigs: Map<LogicalModelName, ModelFallbackConfig> = new Map()

  constructor(options: ModelTranslatorOptions = {}) {
    this.config = {
      enableCaching: true,
      cacheTTLMinutes: 60,
      enableFallbacks: true,
      fallbackStrategy: 'performance',
      enableRegionalCheck: false,
      defaultRegion: 'us-east-1',
      maxRetries: 3,
      ...options.config
    }

    this.modelMapping = this.getDefaultModelMapping()
    this.stats = this.initializeStats()
    this.initializeFallbackConfigs()
  }

  /**
   * Initialize the translator with configuration
   */
  async initialize(): Promise<void> {
    try {
      const config = await loadConfigClient()
      if (config.model_provider?.model_mapping) {
        this.modelMapping = {
          ...this.modelMapping,
          ...config.model_provider.model_mapping
        }
      }
    } catch (error) {
      console.warn('Failed to load model mapping from config, using defaults:', error)
    }
  }

  /**
   * Translate logical model name to provider-specific model ID
   */
  async translateModel(
    logicalName: LogicalModelName,
    provider: ProviderType,
    options: { useCache?: boolean; enableFallback?: boolean } = {}
  ): Promise<ModelTranslationResult> {
    const startTime = Date.now()
    this.stats.totalTranslations++

    try {
      // Check cache first
      if (options.useCache !== false && this.config.enableCaching) {
        const cached = this.getFromCache(logicalName, provider)
        if (cached) {
          this.stats.cacheHits++
          return cached
        }
      }

      this.stats.cacheMisses++

      // Validate logical name exists
      if (!this.modelMapping[logicalName]) {
        throw new ModelNotFoundError(
          `Logical model name '${logicalName}' not found in mapping`,
          logicalName,
          provider
        )
      }

      const mapping = this.modelMapping[logicalName]
      
      // Get provider-specific model ID
      const translatedId = mapping[provider]
      if (!translatedId) {
        throw new ModelTranslationError(
          `No mapping found for model '${logicalName}' and provider '${provider}'`,
          logicalName,
          provider
        )
      }

      // Create translation result
      const result: ModelTranslationResult = {
        originalName: logicalName,
        translatedId,
        provider,
        isAvailable: true, // Will be validated if regional check is enabled
        cached: false
      }

      // Regional availability check (if enabled)
      if (this.config.enableRegionalCheck) {
        try {
          const availability = await this.checkModelAvailability(translatedId, provider)
          result.isAvailable = availability.available
          result.region = availability.region
        } catch (error) {
          console.warn(`Regional availability check failed for ${translatedId}:`, error)
          // Continue with translation, mark as potentially unavailable
          result.isAvailable = false
        }
      }

      // Handle fallback if model is not available
      if (!result.isAvailable && options.enableFallback !== false && this.config.enableFallbacks) {
        const fallbackResult = await this.handleFallback(logicalName, provider)
        if (fallbackResult) {
          this.stats.fallbacksUsed++
          return fallbackResult
        }
      }

      // Cache the result
      if (this.config.enableCaching) {
        this.addToCache(logicalName, provider, result)
      }

      // Update stats
      this.stats.averageTranslationTime = this.updateAverageTime(
        this.stats.averageTranslationTime,
        Date.now() - startTime
      )

      return result

    } catch (error) {
      this.stats.errors++
      this.stats.lastError = error instanceof Error ? error.message : String(error)

      if (error instanceof ModelTranslationError || error instanceof ModelNotFoundError) {
        throw error
      }

      throw new ModelTranslationError(
        `Translation failed for ${logicalName}/${provider}: ${error}`,
        logicalName,
        provider,
        error as Error
      )
    }
  }

  /**
   * Translate multiple models in batch
   */
  async translateModels(
    requests: Array<{ logicalName: LogicalModelName; provider: ProviderType }>
  ): Promise<ModelTranslationResult[]> {
    const results = await Promise.allSettled(
      requests.map(req => this.translateModel(req.logicalName, req.provider))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        const req = requests[index]
        return {
          originalName: req.logicalName,
          translatedId: '',
          provider: req.provider,
          isAvailable: false,
          cached: false
        } as ModelTranslationResult
      }
    })
  }

  /**
   * Validate model configuration
   */
  validateModelConfig(
    agentConfigs: Record<string, { model: string }>
  ): ModelValidationResult[] {
    const results: ModelValidationResult[] = []

    for (const [agentName, config] of Object.entries(agentConfigs)) {
      const modelName = config.model as LogicalModelName
      const result: ModelValidationResult = {
        isValid: true,
        logicalName: modelName,
        provider: 'anthropic', // Will be determined from config
        translatedId: '',
        errors: [],
        warnings: [],
        suggestions: []
      }

      // Check if model name is logical or provider-specific
      if (this.isLogicalModelName(modelName)) {
        // Valid logical name
        result.translatedId = this.modelMapping[modelName]?.anthropic || 'unknown'
      } else {
        // Appears to be provider-specific ID
        result.warnings.push(
          `Agent '${agentName}' uses provider-specific model ID '${modelName}'. Consider using logical name.`
        )
        result.suggestions.push(
          `Consider changing to logical name: ${this.guessLogicalName(modelName)}`
        )
      }

      // Check if mapping exists for all providers
      if (this.isLogicalModelName(modelName)) {
        const mapping = this.modelMapping[modelName]
        if (!mapping?.anthropic) {
          result.errors.push(`Missing Anthropic mapping for '${modelName}'`)
          result.isValid = false
        }
        if (!mapping?.bedrock) {
          result.errors.push(`Missing Bedrock mapping for '${modelName}'`)
          result.isValid = false
        }
      }

      results.push(result)
    }

    return results
  }

  /**
   * Get recommended model for specific use case
   */
  getRecommendedModel(
    useCase: 'analysis' | 'classification' | 'correlation' | 'generation',
    provider: ProviderType,
    prioritize: 'performance' | 'cost' | 'balance' = 'balance'
  ): LogicalModelName {
    const recommendations = {
      analysis: {
        performance: 'sonnet' as LogicalModelName,
        cost: 'haiku' as LogicalModelName,
        balance: 'sonnet' as LogicalModelName
      },
      classification: {
        performance: 'sonnet' as LogicalModelName,
        cost: 'haiku' as LogicalModelName,
        balance: 'haiku' as LogicalModelName
      },
      correlation: {
        performance: 'sonnet' as LogicalModelName,
        cost: 'haiku' as LogicalModelName,
        balance: 'sonnet' as LogicalModelName
      },
      generation: {
        performance: 'opus' as LogicalModelName,
        cost: 'haiku' as LogicalModelName,
        balance: 'sonnet' as LogicalModelName
      }
    }

    return recommendations[useCase][prioritize]
  }

  /**
   * Update model mapping
   */
  updateModelMapping(newMapping: Partial<ModelMappingConfig>): void {
    this.modelMapping = { ...this.modelMapping, ...newMapping }
    this.clearCache()
  }

  /**
   * Get current statistics
   */
  getStats(): ModelTranslatorStats {
    return { ...this.stats }
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.translationCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    hitRate: number
    totalRequests: number
  } {
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses
    return {
      size: this.translationCache.size,
      hitRate: totalRequests > 0 ? this.stats.cacheHits / totalRequests : 0,
      totalRequests
    }
  }

  // Private methods

  private getDefaultModelMapping(): ModelMappingConfig {
    return {
      sonnet: {
        anthropic: 'claude-3-5-sonnet-20241022',
        bedrock: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
      },
      haiku: {
        anthropic: 'claude-3-5-haiku-20241022',
        bedrock: 'us.anthropic.claude-3-5-haiku-20241022-v1:0'
      },
      opus: {
        anthropic: 'claude-3-opus-20240229',
        bedrock: 'anthropic.claude-3-opus-20240229-v1:0'
      }
    }
  }

  private initializeStats(): ModelTranslatorStats {
    return {
      totalTranslations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fallbacksUsed: 0,
      availabilityChecks: 0,
      errors: 0,
      averageTranslationTime: 0
    }
  }

  private initializeFallbackConfigs(): void {
    // Define fallback chains for each model
    this.fallbackConfigs.set('sonnet', {
      primary: 'sonnet',
      fallbacks: ['haiku', 'opus'],
      strategy: 'performance'
    })

    this.fallbackConfigs.set('haiku', {
      primary: 'haiku',
      fallbacks: ['sonnet'],
      strategy: 'cost'
    })

    this.fallbackConfigs.set('opus', {
      primary: 'opus',
      fallbacks: ['sonnet', 'haiku'],
      strategy: 'performance'
    })
  }

  private getCacheKey(logicalName: LogicalModelName, provider: ProviderType): string {
    return `${logicalName}:${provider}`
  }

  private getFromCache(
    logicalName: LogicalModelName,
    provider: ProviderType
  ): ModelTranslationResult | null {
    const key = this.getCacheKey(logicalName, provider)
    const cached = this.translationCache.get(key)

    if (cached && cached.expiresAt > new Date()) {
      return { ...cached.result, cached: true }
    }

    if (cached) {
      this.translationCache.delete(key)
    }

    return null
  }

  private addToCache(
    logicalName: LogicalModelName,
    provider: ProviderType,
    result: ModelTranslationResult
  ): void {
    const key = this.getCacheKey(logicalName, provider)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + this.config.cacheTTLMinutes)

    this.translationCache.set(key, {
      result: { ...result, cached: false },
      expiresAt
    })
  }

  private async checkModelAvailability(
    modelId: string,
    provider: ProviderType
  ): Promise<{ available: boolean; region?: string }> {
    try {
      const modelProvider = ModelProviderFactory.getProvider(provider)
      const availableModels = await modelProvider.getAvailableModels()
      
      return {
        available: availableModels.includes(modelId),
        region: this.config.defaultRegion
      }
    } catch (error) {
      console.warn(`Failed to check model availability for ${modelId}:`, error)
      return { available: false }
    }
  }

  private async handleFallback(
    logicalName: LogicalModelName,
    provider: ProviderType
  ): Promise<ModelTranslationResult | null> {
    const fallbackConfig = this.fallbackConfigs.get(logicalName)
    if (!fallbackConfig) {
      return null
    }

    for (const fallbackModel of fallbackConfig.fallbacks) {
      try {
        const fallbackResult = await this.translateModel(
          fallbackModel,
          provider,
          { enableFallback: false } // Prevent infinite recursion
        )

        if (fallbackResult.isAvailable) {
          return {
            ...fallbackResult,
            fallbackId: fallbackResult.translatedId,
            originalName: logicalName // Keep original name for tracking
          }
        }
      } catch (error) {
        console.warn(`Fallback model ${fallbackModel} also failed:`, error)
        continue
      }
    }

    return null
  }

  private isLogicalModelName(name: string): name is LogicalModelName {
    return ['sonnet', 'haiku', 'opus'].includes(name)
  }

  private guessLogicalName(providerSpecificId: string): LogicalModelName {
    const id = providerSpecificId.toLowerCase()
    
    if (id.includes('sonnet')) return 'sonnet'
    if (id.includes('haiku')) return 'haiku'
    if (id.includes('opus')) return 'opus'
    
    return 'sonnet' // Default fallback
  }

  private updateAverageTime(currentAverage: number, newTime: number): number {
    const totalTranslations = this.stats.totalTranslations
    return ((currentAverage * (totalTranslations - 1)) + newTime) / totalTranslations
  }
}

/**
 * Global model translator instance
 */
let globalModelTranslator: ModelTranslator | null = null

export function getGlobalModelTranslator(): ModelTranslator {
  if (!globalModelTranslator) {
    globalModelTranslator = new ModelTranslator()
    globalModelTranslator.initialize().catch(console.warn)
  }
  return globalModelTranslator
}

/**
 * Create a new model translator instance
 */
export function createModelTranslator(options: ModelTranslatorOptions = {}): ModelTranslator {
  return new ModelTranslator(options)
}

/**
 * Convenience function for quick translation
 */
export async function translateModel(
  logicalName: LogicalModelName,
  provider: ProviderType
): Promise<string> {
  const translator = getGlobalModelTranslator()
  const result = await translator.translateModel(logicalName, provider)
  return result.translatedId
}

/**
 * Validate agent configuration models
 */
export function validateAgentModels(
  agentConfigs: Record<string, { model: string }>
): ModelValidationResult[] {
  const translator = getGlobalModelTranslator()
  return translator.validateModelConfig(agentConfigs)
}