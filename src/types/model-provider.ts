/**
 * Type definitions for Model Provider System
 * Comprehensive types for model mapping, availability, and translation
 */

export type LogicalModelName = 'sonnet' | 'haiku' | 'opus'

export type ProviderType = 'anthropic' | 'bedrock'

export interface ModelVersion {
  name: string
  version: string
  releaseDate: string
  deprecated?: boolean
  endOfLife?: string
}

export interface ProviderModelMapping {
  anthropic: string
  bedrock: string
}

export interface ModelMappingConfig {
  sonnet: ProviderModelMapping
  haiku: ProviderModelMapping
  opus: ProviderModelMapping
}

export interface ModelAvailability {
  modelId: string
  provider: ProviderType
  available: boolean
  region?: string
  lastChecked: Date
  error?: string
  capabilities?: ModelCapabilities
}

export interface RegionalAvailability {
  [region: string]: {
    available: boolean
    modelIds: string[]
    lastChecked: Date
  }
}

export interface ModelTranslationResult {
  originalName: string
  translatedId: string
  provider: ProviderType
  fallbackId?: string
  isAvailable: boolean
  region?: string
  version?: string
  cached: boolean
}

export interface ModelFallbackConfig {
  primary: LogicalModelName
  fallbacks: LogicalModelName[]
  strategy: 'performance' | 'cost' | 'availability'
}

export interface ModelCostInfo {
  inputTokenCost: number
  outputTokenCost: number
  currency: 'USD'
  per1kTokens: boolean
  lastUpdated: Date
}

export interface ModelCapabilities {
  maxInputTokens: number
  maxOutputTokens: number
  maxThinkingTokens?: number
  supportsStreaming: boolean
  supportsVision: boolean
  supportsToolUse: boolean
  supportsCaching: boolean
  contextWindow: number
}

export interface ModelMetadata {
  name: string
  description: string
  provider: ProviderType
  family: string
  capabilities: ModelCapabilities
  cost: ModelCostInfo
  availability: RegionalAvailability
  version: ModelVersion
  fallbacks: LogicalModelName[]
}

export interface ModelRegistryEntry {
  logicalName: LogicalModelName
  metadata: ModelMetadata
  mapping: ProviderModelMapping
  lastUpdated: Date
}

export interface ModelTranslatorConfig {
  enableCaching: boolean
  cacheTTLMinutes: number
  enableFallbacks: boolean
  fallbackStrategy: 'performance' | 'cost' | 'availability'
  enableRegionalCheck: boolean
  defaultRegion: string
  maxRetries: number
}

export interface ModelAvailabilityCache {
  [key: string]: {
    availability: ModelAvailability
    expiresAt: Date
  }
}

export interface TranslationCache {
  [key: string]: {
    result: ModelTranslationResult
    expiresAt: Date
  }
}

export interface ModelTranslatorStats {
  totalTranslations: number
  cacheHits: number
  cacheMisses: number
  fallbacksUsed: number
  availabilityChecks: number
  errors: number
  lastError?: string
  averageTranslationTime: number
}

export interface ModelRegistryUpdate {
  type: 'add' | 'update' | 'remove' | 'deprecate'
  logicalName: LogicalModelName
  changes: Partial<ModelRegistryEntry>
  reason: string
  timestamp: Date
}

export interface ModelValidationResult {
  isValid: boolean
  logicalName: LogicalModelName
  provider: ProviderType
  translatedId: string
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface ProviderModelCatalog {
  provider: ProviderType
  models: Array<{
    id: string
    name: string
    family: string
    capabilities: ModelCapabilities
    regions: string[]
    cost: ModelCostInfo
    deprecated: boolean
  }>
  lastUpdated: Date
}

/**
 * Error types for model translation and availability
 */
export class ModelTranslationError extends Error {
  constructor(
    message: string,
    public logicalName: LogicalModelName,
    public provider: ProviderType,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'ModelTranslationError'
  }
}

export class ModelAvailabilityError extends Error {
  constructor(
    message: string,
    public modelId: string,
    public provider: ProviderType,
    public region?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'ModelAvailabilityError'
  }
}

export class ModelNotFoundError extends Error {
  constructor(
    message: string,
    public logicalName: LogicalModelName,
    public provider: ProviderType
  ) {
    super(message)
    this.name = 'ModelNotFoundError'
  }
}

/**
 * Configuration interfaces for integration
 */
export interface ModelTranslatorOptions {
  config?: Partial<ModelTranslatorConfig>
  customMappings?: Partial<ModelMappingConfig>
  enableMetrics?: boolean
  enableLogging?: boolean
}

export interface ModelAvailabilityOptions {
  region?: string
  timeout?: number
  enableCaching?: boolean
  forceCheck?: boolean
}

export interface ModelSelectionCriteria {
  preferredModels: LogicalModelName[]
  maxCost?: number
  minPerformance?: number
  requiredCapabilities?: Partial<ModelCapabilities>
  excludeDeprecated?: boolean
  region?: string
}

/**
 * Event types for model system events
 */
export interface ModelSystemEvent {
  type: 'translation' | 'availability_check' | 'fallback_used' | 'error'
  timestamp: Date
  data: Record<string, any>
}

export interface ModelTranslationEvent extends ModelSystemEvent {
  type: 'translation'
  data: {
    logicalName: LogicalModelName
    provider: ProviderType
    translatedId: string
    cacheHit: boolean
    translationTime: number
  }
}

export interface ModelAvailabilityEvent extends ModelSystemEvent {
  type: 'availability_check'
  data: {
    modelId: string
    provider: ProviderType
    region: string
    available: boolean
    checkTime: number
  }
}

export interface ModelFallbackEvent extends ModelSystemEvent {
  type: 'fallback_used'
  data: {
    originalModel: LogicalModelName
    fallbackModel: LogicalModelName
    reason: string
    provider: ProviderType
  }
}

export interface ModelErrorEvent extends ModelSystemEvent {
  type: 'error'
  data: {
    error: string
    context: Record<string, any>
    severity: 'low' | 'medium' | 'high'
  }
}

/**
 * Utility types
 */
export type ModelEventHandler = (event: ModelSystemEvent) => void

export type ModelTranslationFunction = (
  logicalName: LogicalModelName,
  provider: ProviderType,
  options?: ModelTranslatorOptions
) => Promise<ModelTranslationResult>

export type ModelAvailabilityFunction = (
  modelId: string,
  provider: ProviderType,
  options?: ModelAvailabilityOptions
) => Promise<ModelAvailability>

/**
 * Configuration validation types
 */
export interface ModelConfigValidation {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning'
  }>
  suggestions: string[]
}

export interface ModelMappingValidation extends ModelConfigValidation {
  missingMappings: LogicalModelName[]
  duplicateMappings: string[]
  deprecatedModels: string[]
}