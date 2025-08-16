/**
 * Model Availability Checker
 * Handles regional model availability, capability checking, and provider-specific model catalogs
 */

import {
  ProviderType,
  ModelAvailability,
  RegionalAvailability,
  ModelAvailabilityOptions,
  ModelAvailabilityError,
  ModelCapabilities,
  ProviderModelCatalog,
  ModelAvailabilityCache,
  ModelCostInfo,
  ModelAvailabilityFunction
} from '@/types/model-provider'

import { ModelProviderFactory } from '../model-providers/provider-factory'

/**
 * Model Availability Checker class
 */
export class ModelAvailabilityChecker {
  private cache: Map<string, { availability: ModelAvailability; expiresAt: Date }> = new Map()
  private cacheTTLMinutes: number = 30
  private providerCatalogs: Map<ProviderType, ProviderModelCatalog> = new Map()
  private enableCaching: boolean = true

  constructor(options: { cacheTTLMinutes?: number; enableCaching?: boolean } = {}) {
    this.cacheTTLMinutes = options.cacheTTLMinutes || 30
    this.enableCaching = options.enableCaching !== false
  }

  /**
   * Check if a model is available for a specific provider and region
   */
  async checkModelAvailability(
    modelId: string,
    provider: ProviderType,
    options: ModelAvailabilityOptions = {}
  ): Promise<ModelAvailability> {
    const region = options.region || this.getDefaultRegion(provider)
    const cacheKey = `${provider}:${modelId}:${region}`

    // Check cache first
    if (!options.forceCheck && this.enableCaching) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const startTime = Date.now()
      
      // Get provider instance
      const modelProvider = ModelProviderFactory.getProvider(provider)
      
      // Check basic availability
      const availableModels = await modelProvider.getAvailableModels()
      const isAvailable = availableModels.includes(modelId)

      // Get model capabilities
      const capabilities = await this.getModelCapabilities(modelId, provider)
      
      const availability: ModelAvailability = {
        modelId,
        provider,
        available: isAvailable,
        region,
        lastChecked: new Date(),
        capabilities
      }

      // Add to cache
      if (this.enableCaching) {
        this.addToCache(cacheKey, availability)
      }

      return availability

    } catch (error) {
      const availability: ModelAvailability = {
        modelId,
        provider,
        available: false,
        region,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : String(error)
      }

      // Cache negative results for shorter time
      if (this.enableCaching) {
        this.addToCache(cacheKey, availability, 5) // 5 minutes for errors
      }

      return availability
    }
  }

  /**
   * Check availability across multiple regions
   */
  async checkRegionalAvailability(
    modelId: string,
    provider: ProviderType,
    regions: string[]
  ): Promise<RegionalAvailability> {
    const results: RegionalAvailability = {}

    const checks = regions.map(async (region) => {
      try {
        const availability = await this.checkModelAvailability(modelId, provider, { region })
        return {
          region,
          available: availability.available,
          modelIds: availability.available ? [modelId] : [],
          lastChecked: availability.lastChecked
        }
      } catch (error) {
        return {
          region,
          available: false,
          modelIds: [],
          lastChecked: new Date()
        }
      }
    })

    const regionResults = await Promise.allSettled(checks)
    
    regionResults.forEach((result, index) => {
      const region = regions[index]
      if (result.status === 'fulfilled') {
        results[region] = result.value
      } else {
        results[region] = {
          available: false,
          modelIds: [],
          lastChecked: new Date()
        }
      }
    })

    return results
  }

  /**
   * Get all available models for a provider
   */
  async getProviderCatalog(
    provider: ProviderType,
    forceRefresh: boolean = false
  ): Promise<ProviderModelCatalog> {
    // Check cache
    if (!forceRefresh && this.providerCatalogs.has(provider)) {
      const cached = this.providerCatalogs.get(provider)!
      const cacheAge = Date.now() - cached.lastUpdated.getTime()
      if (cacheAge < this.cacheTTLMinutes * 60 * 1000) {
        return cached
      }
    }

    try {
      const modelProvider = ModelProviderFactory.getProvider(provider)
      const availableModels = await modelProvider.getAvailableModels()

      const models = await Promise.all(
        availableModels.map(async (modelId) => {
          const capabilities = await this.getModelCapabilities(modelId, provider)
          const cost = this.getModelCost(modelId, provider)
          
          return {
            id: modelId,
            name: this.getModelDisplayName(modelId),
            family: this.getModelFamily(modelId),
            capabilities,
            regions: await this.getModelRegions(modelId, provider),
            cost,
            deprecated: this.isModelDeprecated(modelId)
          }
        })
      )

      const catalog: ProviderModelCatalog = {
        provider,
        models,
        lastUpdated: new Date()
      }

      // Cache the catalog
      this.providerCatalogs.set(provider, catalog)
      
      return catalog

    } catch (error) {
      throw new ModelAvailabilityError(
        `Failed to get provider catalog for ${provider}`,
        '',
        provider,
        undefined,
        error as Error
      )
    }
  }

  /**
   * Find best available model based on criteria
   */
  async findBestModel(
    provider: ProviderType,
    criteria: {
      family?: string
      minPerformance?: number
      maxCost?: number
      requiredCapabilities?: Partial<ModelCapabilities>
      region?: string
    } = {}
  ): Promise<string | null> {
    try {
      const catalog = await this.getProviderCatalog(provider)
      
      let candidates = catalog.models.filter(model => {
        // Filter by family
        if (criteria.family && model.family !== criteria.family) {
          return false
        }

        // Filter by cost
        if (criteria.maxCost && model.cost.inputTokenCost > criteria.maxCost) {
          return false
        }

        // Filter by capabilities
        if (criteria.requiredCapabilities) {
          const caps = criteria.requiredCapabilities
          if (caps.supportsStreaming && !model.capabilities.supportsStreaming) return false
          if (caps.supportsVision && !model.capabilities.supportsVision) return false
          if (caps.supportsToolUse && !model.capabilities.supportsToolUse) return false
          if (caps.maxInputTokens && model.capabilities.maxInputTokens < caps.maxInputTokens) return false
        }

        // Filter by region
        if (criteria.region && !model.regions.includes(criteria.region)) {
          return false
        }

        return true
      })

      if (candidates.length === 0) {
        return null
      }

      // Sort by performance score (higher context window = better performance)
      candidates.sort((a, b) => b.capabilities.contextWindow - a.capabilities.contextWindow)
      
      return candidates[0].id

    } catch (error) {
      console.warn('Failed to find best model:', error)
      return null
    }
  }

  /**
   * Validate model exists and is accessible
   */
  async validateModelAccess(
    modelId: string,
    provider: ProviderType,
    region?: string
  ): Promise<{
    isValid: boolean
    isAccessible: boolean
    error?: string
    capabilities?: ModelCapabilities
  }> {
    try {
      const availability = await this.checkModelAvailability(modelId, provider, { region })
      
      if (!availability.available) {
        return {
          isValid: false,
          isAccessible: false,
          error: availability.error || 'Model not available'
        }
      }

      // Try to make a minimal test call to verify access
      const isAccessible = await this.testModelAccess(modelId, provider)

      return {
        isValid: true,
        isAccessible,
        capabilities: availability.capabilities
      }

    } catch (error) {
      return {
        isValid: false,
        isAccessible: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(
    modelId: string,
    provider: ProviderType
  ): Promise<{
    averageLatency?: number
    tokenThroughput?: number
    availability?: number
    lastUpdated: Date
  }> {
    // This would typically connect to monitoring/metrics service
    // For now, return estimated metrics based on model type
    
    const isHighPerformance = modelId.includes('sonnet') || modelId.includes('opus')
    const isFast = modelId.includes('haiku')

    return {
      averageLatency: isFast ? 800 : isHighPerformance ? 1200 : 1000,
      tokenThroughput: isFast ? 150 : isHighPerformance ? 100 : 120,
      availability: 99.5,
      lastUpdated: new Date()
    }
  }

  /**
   * Clear availability cache
   */
  clearCache(): void {
    this.cache.clear()
    this.providerCatalogs.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cacheSize: number
    catalogsCount: number
    oldestEntry?: Date
    newestEntry?: Date
  } {
    const entries = Array.from(this.cache.values())
    
    return {
      cacheSize: this.cache.size,
      catalogsCount: this.providerCatalogs.size,
      oldestEntry: entries.length > 0 ? 
        new Date(Math.min(...entries.map(e => e.availability.lastChecked.getTime()))) : 
        undefined,
      newestEntry: entries.length > 0 ? 
        new Date(Math.max(...entries.map(e => e.availability.lastChecked.getTime()))) : 
        undefined
    }
  }

  // Private helper methods

  private getDefaultRegion(provider: ProviderType): string {
    switch (provider) {
      case 'bedrock':
        return 'us-east-1'
      case 'anthropic':
        return 'global'
      default:
        return 'us-east-1'
    }
  }

  private getFromCache(cacheKey: string): ModelAvailability | null {
    const cached = this.cache.get(cacheKey)
    if (!cached) return null

    const isExpired = cached.expiresAt < new Date()
    if (isExpired) {
      this.cache.delete(cacheKey)
      return null
    }

    return cached.availability
  }

  private addToCache(
    cacheKey: string,
    availability: ModelAvailability,
    ttlMinutes?: number
  ): void {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + (ttlMinutes || this.cacheTTLMinutes))

    this.cache.set(cacheKey, {
      availability,
      expiresAt
    })
  }

  private async getModelCapabilities(
    modelId: string,
    provider: ProviderType
  ): Promise<ModelCapabilities> {
    // Default capabilities based on model ID patterns
    const isClaudeModel = modelId.includes('claude')
    const isSonnet = modelId.includes('sonnet')
    const isHaiku = modelId.includes('haiku')
    const isOpus = modelId.includes('opus')

    return {
      maxInputTokens: isOpus ? 200000 : isSonnet ? 200000 : 200000,
      maxOutputTokens: isOpus ? 4096 : isSonnet ? 4096 : 4096,
      maxThinkingTokens: isClaudeModel ? 65536 : undefined,
      supportsStreaming: true,
      supportsVision: isSonnet || isOpus,
      supportsToolUse: isClaudeModel,
      supportsCaching: provider === 'anthropic' && isClaudeModel,
      contextWindow: isOpus ? 200000 : isSonnet ? 200000 : 200000
    }
  }

  private getModelCost(modelId: string, provider: ProviderType): ModelCostInfo {
    // Estimated costs based on model type and provider
    let inputCost = 3.0
    let outputCost = 15.0

    if (modelId.includes('haiku')) {
      inputCost = 0.25
      outputCost = 1.25
    } else if (modelId.includes('sonnet')) {
      inputCost = 3.0
      outputCost = 15.0
    } else if (modelId.includes('opus')) {
      inputCost = 15.0
      outputCost = 75.0
    }

    // Bedrock typically has different pricing
    if (provider === 'bedrock') {
      inputCost *= 1.1 // Slight markup for Bedrock
      outputCost *= 1.1
    }

    return {
      inputTokenCost: inputCost,
      outputTokenCost: outputCost,
      currency: 'USD',
      per1kTokens: true,
      lastUpdated: new Date()
    }
  }

  private getModelDisplayName(modelId: string): string {
    if (modelId.includes('sonnet')) return 'Claude 3.5 Sonnet'
    if (modelId.includes('haiku')) return 'Claude 3.5 Haiku'
    if (modelId.includes('opus')) return 'Claude 3 Opus'
    return modelId
  }

  private getModelFamily(modelId: string): string {
    if (modelId.includes('claude')) return 'claude'
    return 'unknown'
  }

  private async getModelRegions(modelId: string, provider: ProviderType): Promise<string[]> {
    switch (provider) {
      case 'anthropic':
        return ['global']
      case 'bedrock':
        // Common Bedrock regions for Claude models
        return ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1']
      default:
        return ['us-east-1']
    }
  }

  private isModelDeprecated(modelId: string): boolean {
    // Check for deprecated model patterns
    const deprecatedPatterns = [
      '20230301',
      '20240229', // Older versions
      'instant',
      'v1.3'
    ]

    return deprecatedPatterns.some(pattern => modelId.includes(pattern))
  }

  private async testModelAccess(modelId: string, provider: ProviderType): Promise<boolean> {
    try {
      const modelProvider = ModelProviderFactory.getProvider(provider)
      
      // Make a minimal test request
      const testRequest = {
        messages: [{ role: 'user' as const, content: 'test' }],
        model: modelId,
        maxTokens: 1
      }

      await modelProvider.sendRequest(testRequest)
      return true

    } catch (error) {
      // If it's an auth error or model not found, return false
      // If it's a different error, it might still be accessible
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
      
      if (errorMessage.includes('not found') || 
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('access denied')) {
        return false
      }

      // For other errors, assume the model is accessible but there's a temporary issue
      return true
    }
  }
}

/**
 * Global model availability checker instance
 */
let globalAvailabilityChecker: ModelAvailabilityChecker | null = null

export function getGlobalAvailabilityChecker(): ModelAvailabilityChecker {
  if (!globalAvailabilityChecker) {
    globalAvailabilityChecker = new ModelAvailabilityChecker()
  }
  return globalAvailabilityChecker
}

/**
 * Create a new availability checker instance
 */
export function createAvailabilityChecker(
  options: { cacheTTLMinutes?: number; enableCaching?: boolean } = {}
): ModelAvailabilityChecker {
  return new ModelAvailabilityChecker(options)
}

/**
 * Convenience function for checking model availability
 */
export const checkModelAvailability: ModelAvailabilityFunction = async (
  modelId: string,
  provider: ProviderType,
  options: ModelAvailabilityOptions = {}
) => {
  const checker = getGlobalAvailabilityChecker()
  return checker.checkModelAvailability(modelId, provider, options)
}