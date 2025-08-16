/**
 * Mock Providers for Testing
 * Provides mock implementations of ModelProvider for comprehensive testing
 */

import {
  ModelProvider,
  ModelProviderConfig,
  ModelRequest,
  ModelResponse,
  ModelStreamChunk,
  ProviderHealthCheck,
  ModelMapping,
  ModelProviderError,
  ModelProviderAuthError,
  ModelProviderRateLimitError,
} from '@/lib/model-providers/provider-interface'

export interface MockProviderOptions {
  shouldThrowAuth?: boolean
  shouldThrowError?: boolean
  shouldThrowRateLimit?: boolean
  simulateLatency?: number
  responseOverride?: Partial<ModelResponse>
  healthOverride?: Partial<ProviderHealthCheck>
  availableModels?: string[]
}

/**
 * Mock Anthropic Provider for testing
 */
export class MockAnthropicProvider extends ModelProvider {
  public mockOptions: MockProviderOptions
  public callLog: { method: string; args: any[] }[] = []

  constructor(config: ModelProviderConfig, modelMapping?: ModelMapping, options: MockProviderOptions = {}) {
    super(config, modelMapping)
    this.mockOptions = options
  }

  private logCall(method: string, ...args: any[]) {
    this.callLog.push({ method, args })
  }

  private async simulateLatency() {
    if (this.mockOptions.simulateLatency) {
      await new Promise(resolve => setTimeout(resolve, this.mockOptions.simulateLatency))
    }
  }

  async sendRequest(request: ModelRequest): Promise<ModelResponse> {
    this.logCall('sendRequest', request)
    await this.simulateLatency()

    if (this.mockOptions.shouldThrowAuth) {
      throw new ModelProviderAuthError('Mock auth error', 'anthropic')
    }

    if (this.mockOptions.shouldThrowRateLimit) {
      throw new ModelProviderRateLimitError('Mock rate limit error', 'anthropic', 60)
    }

    if (this.mockOptions.shouldThrowError) {
      throw new ModelProviderError('Mock general error', 'anthropic')
    }

    const defaultResponse: ModelResponse = {
      content: 'Mock response from Anthropic',
      usage: {
        inputTokens: request.messages.join(' ').length / 4, // Rough estimation
        outputTokens: 50,
        totalTokens: (request.messages.join(' ').length / 4) + 50,
      },
      model: request.model,
      stopReason: 'end_turn',
    }

    return {
      ...defaultResponse,
      ...this.mockOptions.responseOverride,
    }
  }

  async streamRequest(
    request: ModelRequest,
    onChunk: (chunk: ModelStreamChunk) => void
  ): Promise<void> {
    this.logCall('streamRequest', request)
    await this.simulateLatency()

    if (this.mockOptions.shouldThrowAuth) {
      throw new ModelProviderAuthError('Mock auth error', 'anthropic')
    }

    if (this.mockOptions.shouldThrowError) {
      throw new ModelProviderError('Mock streaming error', 'anthropic')
    }

    // Simulate streaming chunks
    const chunks = ['Mock ', 'streaming ', 'response ', 'from ', 'Anthropic']
    for (const content of chunks) {
      onChunk({ type: 'text', content })
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Final metadata chunk
    onChunk({
      type: 'metadata',
      metadata: {
        usage: {
          inputTokens: request.messages.join(' ').length / 4,
          outputTokens: 25,
          totalTokens: (request.messages.join(' ').length / 4) + 25,
        },
        model: request.model,
        stopReason: 'end_turn',
      },
    })
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    this.logCall('healthCheck')
    await this.simulateLatency()

    if (this.mockOptions.shouldThrowAuth) {
      throw new ModelProviderAuthError('Mock auth error', 'anthropic')
    }

    const defaultHealth: ProviderHealthCheck = {
      isHealthy: true,
      provider: 'anthropic',
      latency: this.mockOptions.simulateLatency || 100,
      lastChecked: new Date(),
      modelAvailability: {
        'claude-3-5-sonnet-20241022': true,
        'claude-3-5-haiku-20241022': true,
        'claude-3-opus-20240229': true,
      },
    }

    return {
      ...defaultHealth,
      ...this.mockOptions.healthOverride,
    }
  }

  async validateAuth(): Promise<boolean> {
    this.logCall('validateAuth')
    await this.simulateLatency()

    if (this.mockOptions.shouldThrowAuth) {
      return false
    }

    return true
  }

  async getAvailableModels(): Promise<string[]> {
    this.logCall('getAvailableModels')
    await this.simulateLatency()

    return this.mockOptions.availableModels || [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ]
  }

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    this.logCall('estimateCost', inputTokens, outputTokens, model)

    // Mock Anthropic pricing (per 1M tokens)
    const pricing = {
      'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
      'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
      'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
    }

    const modelPricing = pricing[model as keyof typeof pricing] || pricing['claude-3-5-sonnet-20241022']
    return (inputTokens / 1000000) * modelPricing.input + (outputTokens / 1000000) * modelPricing.output
  }

  getRateLimits(): { requestsPerMinute: number; tokensPerMinute: number; concurrentRequests: number } {
    this.logCall('getRateLimits')

    return {
      requestsPerMinute: 100,
      tokensPerMinute: 150000,
      concurrentRequests: 10,
    }
  }

  // Helper methods for testing
  clearCallLog() {
    this.callLog = []
  }

  getCallCount(method: string): number {
    return this.callLog.filter(call => call.method === method).length
  }

  getLastCall(method: string) {
    const calls = this.callLog.filter(call => call.method === method)
    return calls[calls.length - 1]
  }
}

/**
 * Mock Bedrock Provider for testing
 */
export class MockBedrockProvider extends ModelProvider {
  public mockOptions: MockProviderOptions
  public callLog: { method: string; args: any[] }[] = []

  constructor(config: ModelProviderConfig, modelMapping?: ModelMapping, options: MockProviderOptions = {}) {
    super(config, modelMapping)
    this.mockOptions = options
  }

  private logCall(method: string, ...args: any[]) {
    this.callLog.push({ method, args })
  }

  private async simulateLatency() {
    if (this.mockOptions.simulateLatency) {
      await new Promise(resolve => setTimeout(resolve, this.mockOptions.simulateLatency))
    }
  }

  async sendRequest(request: ModelRequest): Promise<ModelResponse> {
    this.logCall('sendRequest', request)
    await this.simulateLatency()

    if (this.mockOptions.shouldThrowAuth) {
      throw new ModelProviderAuthError('Mock AWS auth error', 'bedrock')
    }

    if (this.mockOptions.shouldThrowRateLimit) {
      throw new ModelProviderRateLimitError('Mock Bedrock throttling', 'bedrock', 120)
    }

    if (this.mockOptions.shouldThrowError) {
      throw new ModelProviderError('Mock Bedrock error', 'bedrock')
    }

    const defaultResponse: ModelResponse = {
      content: 'Mock response from Bedrock',
      usage: {
        inputTokens: request.messages.join(' ').length / 4,
        outputTokens: 45,
        totalTokens: (request.messages.join(' ').length / 4) + 45,
      },
      model: request.model,
      stopReason: 'end_turn',
    }

    return {
      ...defaultResponse,
      ...this.mockOptions.responseOverride,
    }
  }

  async streamRequest(
    request: ModelRequest,
    onChunk: (chunk: ModelStreamChunk) => void
  ): Promise<void> {
    this.logCall('streamRequest', request)
    await this.simulateLatency()

    if (this.mockOptions.shouldThrowAuth) {
      throw new ModelProviderAuthError('Mock AWS auth error', 'bedrock')
    }

    if (this.mockOptions.shouldThrowError) {
      throw new ModelProviderError('Mock Bedrock streaming error', 'bedrock')
    }

    // Simulate streaming chunks
    const chunks = ['Mock ', 'streaming ', 'response ', 'from ', 'Bedrock']
    for (const content of chunks) {
      onChunk({ type: 'text', content })
      await new Promise(resolve => setTimeout(resolve, 15))
    }

    // Final metadata chunk
    onChunk({
      type: 'metadata',
      metadata: {
        usage: {
          inputTokens: request.messages.join(' ').length / 4,
          outputTokens: 25,
          totalTokens: (request.messages.join(' ').length / 4) + 25,
        },
        model: request.model,
        stopReason: 'end_turn',
      },
    })
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    this.logCall('healthCheck')
    await this.simulateLatency()

    if (this.mockOptions.shouldThrowAuth) {
      throw new ModelProviderAuthError('Mock AWS auth error', 'bedrock')
    }

    const defaultHealth: ProviderHealthCheck = {
      isHealthy: true,
      provider: 'bedrock',
      latency: this.mockOptions.simulateLatency || 120,
      lastChecked: new Date(),
      modelAvailability: {
        'us.anthropic.claude-3-5-sonnet-20241022-v2:0': true,
        'us.anthropic.claude-3-5-haiku-20241022-v1:0': true,
        'anthropic.claude-3-opus-20240229-v1:0': true,
      },
    }

    return {
      ...defaultHealth,
      ...this.mockOptions.healthOverride,
    }
  }

  async validateAuth(): Promise<boolean> {
    this.logCall('validateAuth')
    await this.simulateLatency()

    if (this.mockOptions.shouldThrowAuth) {
      return false
    }

    return true
  }

  async getAvailableModels(): Promise<string[]> {
    this.logCall('getAvailableModels')
    await this.simulateLatency()

    return this.mockOptions.availableModels || [
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      'us.anthropic.claude-3-5-haiku-20241022-v1:0',
      'anthropic.claude-3-opus-20240229-v1:0',
    ]
  }

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    this.logCall('estimateCost', inputTokens, outputTokens, model)

    // Mock Bedrock pricing (10% markup over Anthropic)
    const pricing = {
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0': { input: 3.3, output: 16.5 },
      'us.anthropic.claude-3-5-haiku-20241022-v1:0': { input: 0.88, output: 4.4 },
      'anthropic.claude-3-opus-20240229-v1:0': { input: 16.5, output: 82.5 },
    }

    const modelPricing = pricing[model as keyof typeof pricing] || pricing['us.anthropic.claude-3-5-sonnet-20241022-v2:0']
    return (inputTokens / 1000000) * modelPricing.input + (outputTokens / 1000000) * modelPricing.output
  }

  getRateLimits(): { requestsPerMinute: number; tokensPerMinute: number; concurrentRequests: number } {
    this.logCall('getRateLimits')

    return {
      requestsPerMinute: 50,
      tokensPerMinute: 100000,
      concurrentRequests: 5,
    }
  }

  // Helper methods for testing
  clearCallLog() {
    this.callLog = []
  }

  getCallCount(method: string): number {
    return this.callLog.filter(call => call.method === method).length
  }

  getLastCall(method: string) {
    const calls = this.callLog.filter(call => call.method === method)
    return calls[calls.length - 1]
  }
}

/**
 * Mock Factory for creating test providers
 */
export class MockProviderFactory {
  static createAnthropicProvider(options: MockProviderOptions = {}): MockAnthropicProvider {
    const config: ModelProviderConfig = {
      type: 'anthropic',
      apiKey: 'test-anthropic-key',
      baseUrl: 'https://api.anthropic.com',
      timeout: 30000,
      maxRetries: 2,
    }

    return new MockAnthropicProvider(config, undefined, options)
  }

  static createBedrockProvider(options: MockProviderOptions = {}): MockBedrockProvider {
    const config: ModelProviderConfig = {
      type: 'bedrock',
      region: 'us-east-1',
      timeout: 30000,
      maxRetries: 3,
    }

    return new MockBedrockProvider(config, undefined, options)
  }

  static createFailingProvider(providerType: 'anthropic' | 'bedrock', errorType: 'auth' | 'rate_limit' | 'general') {
    const options: MockProviderOptions = {
      shouldThrowAuth: errorType === 'auth',
      shouldThrowRateLimit: errorType === 'rate_limit',
      shouldThrowError: errorType === 'general',
    }

    return providerType === 'anthropic' 
      ? this.createAnthropicProvider(options)
      : this.createBedrockProvider(options)
  }
}

/**
 * Mock request and response generators for testing
 */
export class MockDataGenerator {
  static createModelRequest(overrides: Partial<ModelRequest> = {}): ModelRequest {
    return {
      messages: [
        { role: 'user', content: 'Test prompt for the AI model' }
      ],
      model: 'sonnet',
      maxTokens: 100,
      temperature: 0.7,
      ...overrides,
    }
  }

  static createModelResponse(overrides: Partial<ModelResponse> = {}): ModelResponse {
    return {
      content: 'Test response from AI model',
      usage: {
        inputTokens: 25,
        outputTokens: 50,
        totalTokens: 75,
      },
      model: 'claude-3-5-sonnet-20241022',
      stopReason: 'end_turn',
      ...overrides,
    }
  }

  static createHealthCheck(overrides: Partial<ProviderHealthCheck> = {}): ProviderHealthCheck {
    return {
      isHealthy: true,
      provider: 'anthropic',
      latency: 100,
      lastChecked: new Date(),
      modelAvailability: {
        'claude-3-5-sonnet-20241022': true,
        'claude-3-5-haiku-20241022': true,
      },
      ...overrides,
    }
  }
}

export default {
  MockAnthropicProvider,
  MockBedrockProvider,
  MockProviderFactory,
  MockDataGenerator,
}