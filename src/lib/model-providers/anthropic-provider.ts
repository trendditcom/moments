/**
 * Anthropic Provider Implementation
 * Direct integration with Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  ModelProvider,
  ModelProviderConfig,
  ModelRequest,
  ModelResponse,
  ModelStreamChunk,
  ProviderHealthCheck,
  ModelProviderError,
  ModelProviderAuthError,
  ModelProviderRateLimitError
} from './provider-interface'

export class AnthropicProvider extends ModelProvider {
  private client!: Anthropic
  private isInitialized: boolean = false

  constructor(config: ModelProviderConfig, modelMapping?: any) {
    super(config, modelMapping)
    this.initializeClient()
  }

  private initializeClient(): void {
    // Get API key from config or environment
    const apiKey = this.config.apiKey || 
      (this.config.apiKeyEnv ? process.env[this.config.apiKeyEnv] : undefined) ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new ModelProviderAuthError(
        'Anthropic API key not found. Please set ANTHROPIC_API_KEY or provide it in config.',
        'anthropic'
      )
    }

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey,
      baseURL: this.config.baseUrl || 'https://api.anthropic.com',
      timeout: this.config.timeout || 60000,
      maxRetries: this.config.maxRetries || 2,
      // For browser environments (development only)
      dangerouslyAllowBrowser: typeof window !== 'undefined',
      defaultHeaders: typeof window !== 'undefined' ? {
        "anthropic-dangerous-direct-browser-access": "true"
      } : undefined
    })

    this.isInitialized = true
  }

  async sendRequest(request: ModelRequest): Promise<ModelResponse> {
    if (!this.isInitialized) {
      throw new ModelProviderError('Anthropic provider not initialized', 'anthropic')
    }

    try {
      // Map model name if needed
      const modelId = this.mapModelId(request.model)

      // Convert messages to Anthropic format
      const messages = request.messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))

      // Extract system message if present
      const systemMessage = request.messages.find(msg => msg.role === 'system')
      const system = request.system || systemMessage?.content

      // Make the API call
      const response = await this.client.messages.create({
        model: modelId,
        messages,
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature,
        top_p: request.topP,
        top_k: request.topK,
        stop_sequences: request.stopSequences,
        system,
        metadata: request.metadata
      })

      // Convert response to common format
      return {
        content: response.content[0].type === 'text' 
          ? response.content[0].text 
          : '',
        usage: {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        },
        model: response.model,
        stopReason: response.stop_reason || undefined
      }
    } catch (error: any) {
      // Handle specific error types
      if (error.status === 401) {
        throw new ModelProviderAuthError(
          'Invalid Anthropic API key',
          'anthropic'
        )
      }
      
      if (error.status === 429) {
        throw new ModelProviderRateLimitError(
          'Anthropic rate limit exceeded',
          'anthropic',
          error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) : undefined
        )
      }

      throw new ModelProviderError(
        `Anthropic API error: ${error.message}`,
        'anthropic',
        error.code,
        error.status >= 500
      )
    }
  }

  async streamRequest(
    request: ModelRequest,
    onChunk: (chunk: ModelStreamChunk) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new ModelProviderError('Anthropic provider not initialized', 'anthropic')
    }

    try {
      // Map model name if needed
      const modelId = this.mapModelId(request.model)

      // Convert messages to Anthropic format
      const messages = request.messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))

      // Extract system message if present
      const systemMessage = request.messages.find(msg => msg.role === 'system')
      const system = request.system || systemMessage?.content

      // Create streaming request
      const stream = await this.client.messages.create({
        model: modelId,
        messages,
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature,
        top_p: request.topP,
        top_k: request.topK,
        stop_sequences: request.stopSequences,
        system,
        stream: true,
        metadata: request.metadata
      })

      // Process stream chunks
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          onChunk({
            type: 'text',
            content: chunk.delta.type === 'text_delta' ? chunk.delta.text : ''
          })
        } else if (chunk.type === 'message_start') {
          onChunk({
            type: 'metadata',
            metadata: {
              model: chunk.message.model,
              usage: chunk.message.usage
            }
          })
        } else if (chunk.type === 'message_delta') {
          onChunk({
            type: 'metadata',
            metadata: {
              stopReason: chunk.delta.stop_reason,
              usage: chunk.usage
            }
          })
        }
      }
    } catch (error: any) {
      onChunk({
        type: 'error',
        error: error.message
      })
      throw new ModelProviderError(
        `Anthropic streaming error: ${error.message}`,
        'anthropic',
        error.code,
        error.status >= 500
      )
    }
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    const startTime = Date.now()
    
    try {
      // Try a minimal API call to check connectivity
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1
      })

      return {
        isHealthy: true,
        provider: 'anthropic',
        latency: Date.now() - startTime,
        lastChecked: new Date()
      }
    } catch (error: any) {
      return {
        isHealthy: false,
        provider: 'anthropic',
        latency: Date.now() - startTime,
        error: error.message,
        lastChecked: new Date()
      }
    }
  }

  async validateAuth(): Promise<boolean> {
    try {
      // Try a minimal API call to validate auth
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
      return true
    } catch (error: any) {
      if (error.status === 401) {
        return false
      }
      // Other errors don't necessarily mean auth is invalid
      return true
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // Anthropic doesn't have a list models endpoint, so we return known models
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  }

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    // Pricing per million tokens (as of Nov 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
      'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
      'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
      'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }
    }

    const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022']
    const inputCost = (inputTokens / 1_000_000) * modelPricing.input
    const outputCost = (outputTokens / 1_000_000) * modelPricing.output
    
    return inputCost + outputCost
  }

  getRateLimits() {
    // Default Anthropic rate limits (may vary by tier)
    return {
      requestsPerMinute: 50,
      tokensPerMinute: 40000,
      concurrentRequests: 5
    }
  }

  /**
   * Enable beta features (Anthropic-specific)
   */
  enableBetaFeatures(features: string[]): void {
    if (!this.client) {
      throw new ModelProviderError('Client not initialized', 'anthropic')
    }

    // Set beta headers
    const betaHeaders: Record<string, string> = {}
    features.forEach(feature => {
      betaHeaders[`anthropic-beta`] = feature
    })

    // Recreate client with beta headers
    const apiKey = this.config.apiKey || 
      (this.config.apiKeyEnv ? process.env[this.config.apiKeyEnv] : undefined) ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY

    this.client = new Anthropic({
      apiKey: apiKey!,
      baseURL: this.config.baseUrl || 'https://api.anthropic.com',
      timeout: this.config.timeout || 60000,
      maxRetries: this.config.maxRetries || 2,
      defaultHeaders: {
        ...betaHeaders,
        ...(typeof window !== 'undefined' ? {
          "anthropic-dangerous-direct-browser-access": "true"
        } : {})
      },
      dangerouslyAllowBrowser: typeof window !== 'undefined'
    })
  }

  /**
   * Enable prompt caching (Anthropic-specific optimization)
   */
  enablePromptCaching(): void {
    this.enableBetaFeatures(['prompt-caching-2024-07-31'])
  }
}