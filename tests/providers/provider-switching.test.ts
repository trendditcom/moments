/**
 * Provider Switching Integration Tests
 * Tests for seamless switching between Anthropic and Bedrock providers
 */

import { ModelProviderFactory, ProviderFactoryConfig } from '@/lib/model-providers/provider-factory'
import { ModelProvider, ModelProviderConfig, ModelRequest, ModelProviderError } from '@/lib/model-providers/provider-interface'
import { MockAnthropicProvider, MockBedrockProvider, MockDataGenerator } from '../mocks/mock-providers'

// Mock the actual provider classes
jest.mock('@/lib/model-providers/anthropic-provider', () => ({
  AnthropicProvider: jest.fn(),
}))

jest.mock('@/lib/model-providers/bedrock-provider', () => ({
  BedrockProvider: jest.fn(),
}))

describe('Provider Switching Integration Tests', () => {
  let mockAnthropicProvider: MockAnthropicProvider
  let mockBedrockProvider: MockBedrockProvider

  beforeEach(() => {
    // Create mock providers
    mockAnthropicProvider = new MockAnthropicProvider({
      type: 'anthropic',
      apiKey: 'test-key',
    })

    mockBedrockProvider = new MockBedrockProvider({
      type: 'bedrock',
      region: 'us-east-1',
    })

    // Mock the provider constructors
    const { AnthropicProvider } = require('@/lib/model-providers/anthropic-provider')
    const { BedrockProvider } = require('@/lib/model-providers/bedrock-provider')
    
    AnthropicProvider.mockImplementation(() => mockAnthropicProvider)
    BedrockProvider.mockImplementation(() => mockBedrockProvider)
  })

  afterEach(() => {
    jest.clearAllMocks()
    mockAnthropicProvider.clearCallLog()
    mockBedrockProvider.clearCallLog()
  })

  describe('Basic Provider Creation', () => {
    test('should create Anthropic provider', () => {
      const provider = ModelProviderFactory.createProvider('anthropic', {
        apiKey: 'test-key',
      })

      expect(provider).toBe(mockAnthropicProvider)
      expect(provider.getType()).toBe('anthropic')
    })

    test('should create Bedrock provider', () => {
      const provider = ModelProviderFactory.createProvider('bedrock', {
        region: 'us-east-1',
      })

      expect(provider).toBe(mockBedrockProvider)
      expect(provider.getType()).toBe('bedrock')
    })

    test('should throw error for unknown provider type', () => {
      expect(() => {
        ModelProviderFactory.createProvider('unknown' as any)
      }).toThrow('Unknown provider type: unknown')
    })
  })

  describe('Factory Initialization', () => {
    test('should initialize with Anthropic as primary provider', () => {
      const config: ProviderFactoryConfig = {
        type: 'anthropic',
        anthropic: {
          apiKeyEnv: 'ANTHROPIC_API_KEY',
        },
      }

      ModelProviderFactory.initialize(config)

      const primary = ModelProviderFactory.getPrimaryProvider()
      const fallback = ModelProviderFactory.getFallbackProvider()

      expect(primary).toBe(mockAnthropicProvider)
      expect(fallback).toBeNull()
    })

    test('should initialize with Bedrock as primary provider', () => {
      const config: ProviderFactoryConfig = {
        type: 'bedrock',
        bedrock: {
          region: 'us-east-1',
        },
      }

      ModelProviderFactory.initialize(config)

      const primary = ModelProviderFactory.getPrimaryProvider()
      expect(primary).toBe(mockBedrockProvider)
    })

    test('should initialize with fallback provider', () => {
      const config: ProviderFactoryConfig = {
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        anthropic: {
          apiKeyEnv: 'ANTHROPIC_API_KEY',
        },
        bedrock: {
          region: 'us-east-1',
        },
      }

      ModelProviderFactory.initialize(config)

      const primary = ModelProviderFactory.getPrimaryProvider()
      const fallback = ModelProviderFactory.getFallbackProvider()

      expect(primary).toBe(mockAnthropicProvider)
      expect(fallback).toBe(mockBedrockProvider)
    })

    test('should not create fallback when same as primary', () => {
      const config: ProviderFactoryConfig = {
        type: 'anthropic',
        fallbackProvider: 'anthropic',
        anthropic: {
          apiKeyEnv: 'ANTHROPIC_API_KEY',
        },
      }

      ModelProviderFactory.initialize(config)

      const primary = ModelProviderFactory.getPrimaryProvider()
      const fallback = ModelProviderFactory.getFallbackProvider()

      expect(primary).toBe(mockAnthropicProvider)
      expect(fallback).toBeNull()
    })
  })

  describe('Provider Switching', () => {
    test('should switch from Anthropic to Bedrock', () => {
      // Initialize with Anthropic
      ModelProviderFactory.initialize({
        type: 'anthropic',
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
      })

      expect(ModelProviderFactory.getPrimaryProvider()).toBe(mockAnthropicProvider)

      // Switch to Bedrock
      ModelProviderFactory.switchProvider('bedrock', {
        region: 'us-east-1',
      })

      expect(ModelProviderFactory.getPrimaryProvider()).toBe(mockBedrockProvider)
    })

    test('should switch from Bedrock to Anthropic', () => {
      // Initialize with Bedrock
      ModelProviderFactory.initialize({
        type: 'bedrock',
        bedrock: { region: 'us-east-1' },
      })

      expect(ModelProviderFactory.getPrimaryProvider()).toBe(mockBedrockProvider)

      // Switch to Anthropic
      ModelProviderFactory.switchProvider('anthropic', {
        apiKey: 'test-key',
      })

      expect(ModelProviderFactory.getPrimaryProvider()).toBe(mockAnthropicProvider)
    })

    test('should maintain fallback provider during switch', () => {
      // Initialize with fallback
      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const originalFallback = ModelProviderFactory.getFallbackProvider()

      // Switch primary provider
      ModelProviderFactory.switchProvider('bedrock', {
        region: 'us-west-2',
      })

      // Fallback should remain the same
      expect(ModelProviderFactory.getFallbackProvider()).toBe(originalFallback)
    })
  })

  describe('Request Execution with Provider Switching', () => {
    test('should execute request with primary provider', async () => {
      ModelProviderFactory.initialize({
        type: 'anthropic',
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
      })

      const request = MockDataGenerator.createModelRequest()
      const response = await ModelProviderFactory.executeRequest(request)

      expect(response.content).toContain('Mock response from Anthropic')
      expect(mockAnthropicProvider.getCallCount('sendRequest')).toBe(1)
    })

    test('should fallback to secondary provider when primary fails', async () => {
      // Configure primary to fail
      mockAnthropicProvider.mockOptions.shouldThrowError = true

      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        autoFallback: true,
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const request = MockDataGenerator.createModelRequest()
      const response = await ModelProviderFactory.executeRequest(request)

      expect(response.content).toContain('Mock response from Bedrock')
      expect(mockAnthropicProvider.getCallCount('sendRequest')).toBe(1)
      expect(mockBedrockProvider.getCallCount('sendRequest')).toBe(1)
    })

    test('should not fallback when autoFallback is disabled', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowError = true

      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        autoFallback: false,
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const request = MockDataGenerator.createModelRequest()

      await expect(ModelProviderFactory.executeRequest(request)).rejects.toThrow(ModelProviderError)
      expect(mockAnthropicProvider.getCallCount('sendRequest')).toBe(1)
      expect(mockBedrockProvider.getCallCount('sendRequest')).toBe(0)
    })

    test('should throw error when both providers fail', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowError = true
      mockBedrockProvider.mockOptions.shouldThrowError = true

      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        autoFallback: true,
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const request = MockDataGenerator.createModelRequest()

      await expect(ModelProviderFactory.executeRequest(request)).rejects.toThrow(ModelProviderError)
      expect(mockAnthropicProvider.getCallCount('sendRequest')).toBe(1)
      expect(mockBedrockProvider.getCallCount('sendRequest')).toBe(1)
    })
  })

  describe('Model Mapping Consistency', () => {
    test('should maintain consistent model mapping across providers', () => {
      const customMapping = {
        sonnet: {
          anthropic: 'claude-3-5-sonnet-20241022',
          bedrock: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        },
        haiku: {
          anthropic: 'claude-3-5-haiku-20241022',
          bedrock: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        },
        opus: {
          anthropic: 'claude-3-opus-20240229',
          bedrock: 'anthropic.claude-3-opus-20240229-v1:0',
        },
      }

      ModelProviderFactory.initialize({
        type: 'anthropic',
        modelMapping: customMapping,
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
      })

      const anthropicProvider = ModelProviderFactory.getPrimaryProvider()
      expect(anthropicProvider.mapModelId('sonnet')).toBe('claude-3-5-sonnet-20241022')

      // Switch to Bedrock
      ModelProviderFactory.switchProvider('bedrock', {
        region: 'us-east-1',
      })

      const bedrockProvider = ModelProviderFactory.getPrimaryProvider()
      expect(bedrockProvider.mapModelId('sonnet')).toBe('us.anthropic.claude-3-5-sonnet-20241022-v2:0')
    })

    test('should handle logical model names in requests across providers', async () => {
      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        autoFallback: true,
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const request = MockDataGenerator.createModelRequest({
        model: 'haiku', // Logical model name
      })

      // Primary provider (Anthropic) request
      await ModelProviderFactory.executeRequest(request)
      const anthropicCall = mockAnthropicProvider.getLastCall('sendRequest')
      expect(anthropicCall.args[0].model).toBe('haiku')

      // Configure primary to fail and test fallback
      mockAnthropicProvider.mockOptions.shouldThrowError = true
      mockAnthropicProvider.clearCallLog()
      mockBedrockProvider.clearCallLog()

      await ModelProviderFactory.executeRequest(request)
      const bedrockCall = mockBedrockProvider.getLastCall('sendRequest')
      expect(bedrockCall.args[0].model).toBe('haiku')
    })
  })

  describe('Health Monitoring During Switching', () => {
    test('should monitor health of all configured providers', async () => {
      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const healthStatus = await ModelProviderFactory.getProvidersHealth()

      expect(healthStatus.primary.isHealthy).toBe(true)
      expect(healthStatus.primary.provider).toBe('anthropic')
      expect(healthStatus.fallback?.isHealthy).toBe(true)
      expect(healthStatus.fallback?.provider).toBe('bedrock')
    })

    test('should trigger automatic switch on primary provider health failure', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowAuth = true

      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        autoFallback: true,
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const healthStatus = await ModelProviderFactory.getProvidersHealth()

      expect(healthStatus.primary.isHealthy).toBe(false)
      expect(healthStatus.fallback?.isHealthy).toBe(true)

      // Verify automatic failover occurs for subsequent requests
      const request = MockDataGenerator.createModelRequest()
      const response = await ModelProviderFactory.executeRequest(request)

      expect(response.content).toContain('Mock response from Bedrock')
    })
  })

  describe('Cost Comparison Across Providers', () => {
    test('should compare costs between providers for same request', () => {
      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const inputTokens = 1000
      const outputTokens = 500
      const model = 'sonnet'

      const costComparison = ModelProviderFactory.compareCosts(inputTokens, outputTokens, model)

      expect(costComparison.primary.provider).toBe('anthropic')
      expect(costComparison.primary.cost).toBeCloseTo(0.0105, 4) // Anthropic pricing

      expect(costComparison.fallback?.provider).toBe('bedrock')
      expect(costComparison.fallback?.cost).toBeCloseTo(0.01155, 4) // Bedrock pricing (10% markup)

      expect(costComparison.recommendation).toBe('primary') // Anthropic is cheaper
    })

    test('should recommend most cost-effective provider', () => {
      ModelProviderFactory.initialize({
        type: 'bedrock',
        fallbackProvider: 'anthropic',
        bedrock: { region: 'us-east-1' },
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
      })

      const costComparison = ModelProviderFactory.compareCosts(1000, 500, 'sonnet')

      expect(costComparison.recommendation).toBe('fallback') // Anthropic is cheaper than Bedrock
    })
  })

  describe('Configuration Persistence', () => {
    test('should maintain configuration after provider switch', () => {
      const originalConfig: ProviderFactoryConfig = {
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        autoFallback: true,
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY', timeout: 30000 },
        bedrock: { region: 'us-east-1', timeout: 45000 },
      }

      ModelProviderFactory.initialize(originalConfig)

      // Switch providers
      ModelProviderFactory.switchProvider('bedrock', {
        region: 'us-west-2',
        timeout: 60000,
      })

      const currentConfig = ModelProviderFactory.getConfiguration()

      expect(currentConfig.type).toBe('bedrock')
      expect(currentConfig.fallbackProvider).toBe('bedrock')
      expect(currentConfig.autoFallback).toBe(true)
      expect(currentConfig.bedrock?.timeout).toBe(60000)
      expect(currentConfig.anthropic?.timeout).toBe(30000) // Original fallback config preserved
    })

    test('should reset factory state', () => {
      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      expect(ModelProviderFactory.getPrimaryProvider()).toBeTruthy()
      expect(ModelProviderFactory.getFallbackProvider()).toBeTruthy()

      ModelProviderFactory.reset()

      expect(ModelProviderFactory.getPrimaryProvider()).toBeNull()
      expect(ModelProviderFactory.getFallbackProvider()).toBeNull()
    })
  })

  describe('Error Recovery Scenarios', () => {
    test('should recover from temporary provider failures', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowError = true

      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        autoFallback: true,
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const request = MockDataGenerator.createModelRequest()

      // First request should use fallback
      const response1 = await ModelProviderFactory.executeRequest(request)
      expect(response1.content).toContain('Bedrock')

      // Simulate recovery
      mockAnthropicProvider.mockOptions.shouldThrowError = false

      // Second request should try primary again (if configured to do so)
      const response2 = await ModelProviderFactory.executeRequest(request)
      expect(response2.content).toContain('Anthropic')
    })

    test('should handle authentication recovery', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowAuth = true

      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        autoFallback: true,
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const request = MockDataGenerator.createModelRequest()

      // Should fallback due to auth error
      const response = await ModelProviderFactory.executeRequest(request)
      expect(response.content).toContain('Bedrock')

      // Verify auth was attempted on primary
      expect(mockAnthropicProvider.getCallCount('sendRequest')).toBe(1)
    })
  })

  describe('Performance Characteristics', () => {
    test('should measure and compare provider latencies', async () => {
      mockAnthropicProvider.mockOptions.simulateLatency = 100
      mockBedrockProvider.mockOptions.simulateLatency = 150

      ModelProviderFactory.initialize({
        type: 'anthropic',
        fallbackProvider: 'bedrock',
        anthropic: { apiKeyEnv: 'ANTHROPIC_API_KEY' },
        bedrock: { region: 'us-east-1' },
      })

      const request = MockDataGenerator.createModelRequest()

      const start = Date.now()
      await ModelProviderFactory.executeRequest(request)
      const anthropicLatency = Date.now() - start

      // Force fallback
      mockAnthropicProvider.mockOptions.shouldThrowError = true
      mockAnthropicProvider.clearCallLog()

      const start2 = Date.now()
      await ModelProviderFactory.executeRequest(request)
      const bedrockLatency = Date.now() - start2

      expect(anthropicLatency).toBeLessThan(bedrockLatency)
    })
  })
})