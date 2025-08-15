/**
 * Amazon Bedrock Provider Implementation
 * Integration with AWS Bedrock for Claude models
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  InvokeModelCommandInput,
  InvokeModelWithResponseStreamCommandInput
} from '@aws-sdk/client-bedrock-runtime'
import { fromIni, fromEnv } from '@aws-sdk/credential-providers'
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

export class BedrockProvider extends ModelProvider {
  private client: BedrockRuntimeClient
  private isInitialized: boolean = false

  constructor(config: ModelProviderConfig, modelMapping?: any) {
    super(config, modelMapping)
    this.initializeClient()
  }

  private async initializeClient(): Promise<void> {
    try {
      const region = this.config.region || process.env.AWS_REGION || 'us-east-1'
      
      // Configure credentials based on settings
      let credentials
      
      if (this.config.useBedrockApiKey) {
        // Use Bedrock API keys (new authentication method)
        const apiKey = this.config.apiKey || 
          (this.config.apiKeyEnv ? process.env[this.config.apiKeyEnv] : undefined) ||
          process.env.BEDROCK_API_KEY

        if (!apiKey) {
          throw new ModelProviderAuthError(
            'Bedrock API key not found. Please set BEDROCK_API_KEY or provide it in config.',
            'bedrock'
          )
        }

        // Bedrock API keys are handled differently
        credentials = {
          accessKeyId: apiKey,
          secretAccessKey: apiKey // Bedrock uses same key for both
        }
      } else if (this.config.profile) {
        // Use AWS profile from ~/.aws/credentials
        credentials = fromIni({ profile: this.config.profile })
      } else {
        // Use environment variables or default chain
        credentials = fromEnv()
      }

      // Initialize Bedrock client
      this.client = new BedrockRuntimeClient({
        region,
        credentials,
        maxAttempts: this.config.maxRetries || 3,
        requestHandler: {
          requestTimeout: this.config.timeout || 60000
        }
      })

      this.isInitialized = true
    } catch (error: any) {
      throw new ModelProviderAuthError(
        `Failed to initialize Bedrock client: ${error.message}`,
        'bedrock'
      )
    }
  }

  async sendRequest(request: ModelRequest): Promise<ModelResponse> {
    if (!this.isInitialized) {
      await this.initializeClient()
    }

    try {
      // Map model name if needed
      const modelId = this.mapModelId(request.model)

      // Prepare the request body in Anthropic format for Bedrock
      const requestBody = this.prepareAnthropicRequestBody(request)

      // Create the command
      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(JSON.stringify(requestBody))
      } as InvokeModelCommandInput)

      // Send the request
      const response = await this.client.send(command)

      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))

      // Convert to common format
      return this.parseAnthropicResponse(responseBody, modelId)
    } catch (error: any) {
      // Handle specific error types
      if (error.name === 'AccessDeniedException') {
        throw new ModelProviderAuthError(
          'Access denied to Bedrock. Check IAM permissions.',
          'bedrock'
        )
      }
      
      if (error.name === 'ThrottlingException') {
        throw new ModelProviderRateLimitError(
          'Bedrock rate limit exceeded',
          'bedrock',
          error.$metadata?.retryAfterSeconds
        )
      }

      if (error.name === 'ResourceNotFoundException') {
        throw new ModelProviderError(
          `Model not available in region: ${request.model}`,
          'bedrock',
          'MODEL_NOT_FOUND',
          false
        )
      }

      throw new ModelProviderError(
        `Bedrock API error: ${error.message}`,
        'bedrock',
        error.name,
        error.$retryable || false
      )
    }
  }

  async streamRequest(
    request: ModelRequest,
    onChunk: (chunk: ModelStreamChunk) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeClient()
    }

    try {
      // Map model name if needed
      const modelId = this.mapModelId(request.model)

      // Prepare the request body
      const requestBody = this.prepareAnthropicRequestBody(request)

      // Create the streaming command
      const command = new InvokeModelWithResponseStreamCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(JSON.stringify(requestBody))
      } as InvokeModelWithResponseStreamCommandInput)

      // Send the request
      const response = await this.client.send(command)

      // Process the stream
      if (response.body) {
        for await (const chunk of response.body) {
          if (chunk.chunk?.bytes) {
            const decodedChunk = new TextDecoder().decode(chunk.chunk.bytes)
            const parsedChunk = JSON.parse(decodedChunk)

            // Handle different chunk types
            if (parsedChunk.type === 'content_block_delta') {
              onChunk({
                type: 'text',
                content: parsedChunk.delta?.text || ''
              })
            } else if (parsedChunk.type === 'message_start') {
              onChunk({
                type: 'metadata',
                metadata: {
                  model: modelId,
                  usage: parsedChunk.message?.usage
                }
              })
            } else if (parsedChunk.type === 'message_delta') {
              onChunk({
                type: 'metadata',
                metadata: {
                  stopReason: parsedChunk.delta?.stop_reason,
                  usage: parsedChunk.usage
                }
              })
            }
          }
        }
      }
    } catch (error: any) {
      onChunk({
        type: 'error',
        error: error.message
      })
      throw new ModelProviderError(
        `Bedrock streaming error: ${error.message}`,
        'bedrock',
        error.name,
        error.$retryable || false
      )
    }
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    const startTime = Date.now()
    
    try {
      // Try a minimal API call to check connectivity
      const testRequest: ModelRequest = {
        messages: [{ role: 'user', content: 'test' }],
        model: 'haiku',
        maxTokens: 1
      }

      await this.sendRequest(testRequest)

      return {
        isHealthy: true,
        provider: 'bedrock',
        latency: Date.now() - startTime,
        lastChecked: new Date()
      }
    } catch (error: any) {
      return {
        isHealthy: false,
        provider: 'bedrock',
        latency: Date.now() - startTime,
        error: error.message,
        lastChecked: new Date()
      }
    }
  }

  async validateAuth(): Promise<boolean> {
    try {
      // Try a minimal API call to validate auth
      const testRequest: ModelRequest = {
        messages: [{ role: 'user', content: 'test' }],
        model: 'haiku',
        maxTokens: 1
      }

      await this.sendRequest(testRequest)
      return true
    } catch (error: any) {
      if (error.name === 'AccessDeniedException' || 
          error.name === 'UnrecognizedClientException') {
        return false
      }
      // Other errors don't necessarily mean auth is invalid
      return true
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // Return known Claude models available on Bedrock
    // Note: Availability varies by region
    return [
      'anthropic.claude-3-opus-20240229-v1:0',
      'anthropic.claude-3-sonnet-20240229-v1:0',
      'anthropic.claude-3-haiku-20240307-v1:0',
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      'us.anthropic.claude-3-5-haiku-20241022-v1:0'
    ]
  }

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    // Bedrock pricing per 1000 tokens (as of Nov 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'anthropic.claude-3-opus-20240229-v1:0': { input: 0.015, output: 0.075 },
      'anthropic.claude-3-sonnet-20240229-v1:0': { input: 0.003, output: 0.015 },
      'anthropic.claude-3-haiku-20240307-v1:0': { input: 0.00025, output: 0.00125 },
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0': { input: 0.003, output: 0.015 },
      'us.anthropic.claude-3-5-haiku-20241022-v1:0': { input: 0.0008, output: 0.004 }
    }

    const modelPricing = pricing[model] || pricing['us.anthropic.claude-3-5-sonnet-20241022-v2:0']
    const inputCost = (inputTokens / 1000) * modelPricing.input
    const outputCost = (outputTokens / 1000) * modelPricing.output
    
    return inputCost + outputCost
  }

  getRateLimits() {
    // Bedrock rate limits vary by region and model
    return {
      requestsPerMinute: 100,
      tokensPerMinute: 100000,
      concurrentRequests: 10
    }
  }

  /**
   * Prepare request body in Anthropic format for Bedrock
   */
  private prepareAnthropicRequestBody(request: ModelRequest): any {
    // Convert messages to Anthropic format
    const messages = request.messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    // Extract system message if present
    const systemMessage = request.messages.find(msg => msg.role === 'system')
    const system = request.system || systemMessage?.content

    // Prepare the request body
    const body: any = {
      anthropic_version: 'bedrock-2023-05-31',
      messages,
      max_tokens: request.maxTokens || 4000
    }

    // Add optional parameters
    if (request.temperature !== undefined) body.temperature = request.temperature
    if (request.topP !== undefined) body.top_p = request.topP
    if (request.topK !== undefined) body.top_k = request.topK
    if (request.stopSequences) body.stop_sequences = request.stopSequences
    if (system) body.system = system

    return body
  }

  /**
   * Parse Anthropic response from Bedrock
   */
  private parseAnthropicResponse(responseBody: any, modelId: string): ModelResponse {
    // Extract content
    let content = ''
    if (responseBody.content && Array.isArray(responseBody.content)) {
      content = responseBody.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('')
    } else if (typeof responseBody.completion === 'string') {
      content = responseBody.completion
    }

    // Extract usage metrics
    const usage = responseBody.usage || {}

    return {
      content,
      usage: {
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
        totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0)
      },
      model: modelId,
      stopReason: responseBody.stop_reason
    }
  }

  /**
   * Set AWS region (Bedrock-specific)
   */
  async setRegion(region: string): Promise<void> {
    this.config.region = region
    await this.initializeClient()
  }

  /**
   * Use cross-region inference profile (Bedrock-specific optimization)
   */
  useCrossRegionInference(profileArn: string): void {
    this.config.inferenceProfile = profileArn
  }

  /**
   * Check model availability in current region
   */
  async checkModelAvailability(modelId: string): Promise<boolean> {
    try {
      const testRequest: ModelRequest = {
        messages: [{ role: 'user', content: 'test' }],
        model: modelId,
        maxTokens: 1
      }

      await this.sendRequest(testRequest)
      return true
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        return false
      }
      // Other errors don't mean the model is unavailable
      return true
    }
  }
}