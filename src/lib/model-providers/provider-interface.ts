/**
 * Model Provider Interface
 * Unified interface for AI model providers (Anthropic, Bedrock, etc.)
 */

export interface ModelResponse {
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens?: number
  }
  model: string
  stopReason?: string
}

export interface ModelStreamChunk {
  type: 'text' | 'error' | 'metadata'
  content?: string
  error?: string
  metadata?: Record<string, any>
}

export interface ModelMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ModelRequest {
  messages: ModelMessage[]
  model: string
  maxTokens?: number
  temperature?: number
  topP?: number
  topK?: number
  stopSequences?: string[]
  system?: string
  stream?: boolean
  metadata?: Record<string, any>
}

export interface ModelProviderConfig {
  type: 'anthropic' | 'bedrock'
  region?: string
  apiKey?: string
  apiKeyEnv?: string
  baseUrl?: string
  profile?: string
  useBedrockApiKey?: boolean
  inferenceProfile?: string
  timeout?: number
  maxRetries?: number
}

export interface ModelMapping {
  sonnet: {
    anthropic: string
    bedrock: string
  }
  haiku: {
    anthropic: string
    bedrock: string
  }
  opus: {
    anthropic: string
    bedrock: string
  }
}

export interface ProviderHealthCheck {
  isHealthy: boolean
  provider: string
  latency?: number
  error?: string
  modelAvailability?: Record<string, boolean>
  lastChecked: Date
}

/**
 * Abstract base class for model providers
 */
export abstract class ModelProvider {
  protected config: ModelProviderConfig
  protected modelMapping: ModelMapping

  constructor(config: ModelProviderConfig, modelMapping?: ModelMapping) {
    this.config = config
    this.modelMapping = modelMapping || this.getDefaultModelMapping()
  }

  /**
   * Send a request to the model
   */
  abstract sendRequest(request: ModelRequest): Promise<ModelResponse>

  /**
   * Stream a request to the model
   */
  abstract streamRequest(
    request: ModelRequest,
    onChunk: (chunk: ModelStreamChunk) => void
  ): Promise<void>

  /**
   * Check provider health and availability
   */
  abstract healthCheck(): Promise<ProviderHealthCheck>

  /**
   * Validate authentication and configuration
   */
  abstract validateAuth(): Promise<boolean>

  /**
   * Get available models for this provider
   */
  abstract getAvailableModels(): Promise<string[]>

  /**
   * Map logical model name to provider-specific model ID
   */
  mapModelId(logicalName: string): string {
    const providerType = this.config.type
    
    // Check if it's a known logical name
    if (logicalName in this.modelMapping) {
      const mapping = this.modelMapping[logicalName as keyof ModelMapping]
      return mapping[providerType]
    }
    
    // Return as-is if not a logical name (assume it's already a provider-specific ID)
    return logicalName
  }

  /**
   * Get default model mapping
   */
  protected getDefaultModelMapping(): ModelMapping {
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

  /**
   * Get provider type
   */
  getType(): string {
    return this.config.type
  }

  /**
   * Get provider configuration
   */
  getConfig(): ModelProviderConfig {
    return { ...this.config }
  }

  /**
   * Update model mapping
   */
  updateModelMapping(mapping: Partial<ModelMapping>): void {
    this.modelMapping = { ...this.modelMapping, ...mapping }
  }

  /**
   * Calculate cost estimate for a request (provider-specific pricing)
   */
  abstract estimateCost(inputTokens: number, outputTokens: number, model: string): number

  /**
   * Get rate limits for the provider
   */
  abstract getRateLimits(): {
    requestsPerMinute: number
    tokensPerMinute: number
    concurrentRequests: number
  }
}

/**
 * Provider error class
 */
export class ModelProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'ModelProviderError'
  }
}

/**
 * Provider authentication error
 */
export class ModelProviderAuthError extends ModelProviderError {
  constructor(message: string, provider: string) {
    super(message, provider, 'AUTH_ERROR', false)
    this.name = 'ModelProviderAuthError'
  }
}

/**
 * Provider rate limit error
 */
export class ModelProviderRateLimitError extends ModelProviderError {
  constructor(
    message: string,
    provider: string,
    public retryAfter?: number
  ) {
    super(message, provider, 'RATE_LIMIT', true)
    this.name = 'ModelProviderRateLimitError'
  }
}