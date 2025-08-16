/**
 * Unit Tests for AnthropicProvider
 * Comprehensive testing of Anthropic provider implementation
 */

import { AnthropicProvider } from '@/lib/model-providers/anthropic-provider'
import {
  ModelProviderConfig,
  ModelRequest,
  ModelProviderError,
  ModelProviderAuthError,
  ModelProviderRateLimitError,
} from '@/lib/model-providers/provider-interface'
import { MockDataGenerator } from '../mocks/mock-providers'

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
      stream: jest.fn(),
    },
  }))
})

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider
  let mockConfig: ModelProviderConfig
  let mockAnthropicClient: any

  beforeEach(() => {
    mockConfig = {
      type: 'anthropic',
      apiKey: 'test-anthropic-key',
      baseUrl: 'https://api.anthropic.com',
      timeout: 30000,
      maxRetries: 2,
    }

    // Mock the Anthropic client
    const Anthropic = require('@anthropic-ai/sdk')
    mockAnthropicClient = {
      messages: {
        create: jest.fn(),
        stream: jest.fn(),
      },
    }
    Anthropic.mockImplementation(() => mockAnthropicClient)

    provider = new AnthropicProvider(mockConfig)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor and Initialization', () => {
    test('should initialize with valid config', () => {
      expect(provider).toBeInstanceOf(AnthropicProvider)
      expect(provider.getType()).toBe('anthropic')
      expect(provider.getConfig()).toEqual(mockConfig)
    })

    test('should throw auth error when API key is missing', () => {
      const configWithoutKey = { ...mockConfig }
      delete configWithoutKey.apiKey
      
      // Clear environment variables
      delete process.env.ANTHROPIC_API_KEY
      delete process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY

      expect(() => new AnthropicProvider(configWithoutKey)).toThrow(ModelProviderAuthError)
    })

    test('should use environment variable for API key', () => {
      const configWithoutKey = { ...mockConfig }
      delete configWithoutKey.apiKey
      
      process.env.ANTHROPIC_API_KEY = 'env-test-key'

      expect(() => new AnthropicProvider(configWithoutKey)).not.toThrow()
    })

    test('should initialize with custom model mapping', () => {
      const customMapping = {
        sonnet: {
          anthropic: 'custom-sonnet-model',
          bedrock: 'custom-bedrock-model',
        },
        haiku: {
          anthropic: 'custom-haiku-model',
          bedrock: 'custom-bedrock-haiku',
        },
        opus: {
          anthropic: 'custom-opus-model',
          bedrock: 'custom-bedrock-opus',
        },
      }

      const providerWithMapping = new AnthropicProvider(mockConfig, customMapping)
      expect(providerWithMapping.mapModelId('sonnet')).toBe('custom-sonnet-model')
    })
  })

  describe('sendRequest', () => {
    test('should send request successfully', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      const mockResponse = {
        content: [{ text: 'Test response' }],
        usage: { input_tokens: 25, output_tokens: 50 },
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn',
      }

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse)

      const result = await provider.sendRequest(mockRequest)

      expect(result).toEqual({
        content: 'Test response',
        usage: {
          inputTokens: 25,
          outputTokens: 50,
          totalTokens: 75,
        },
        model: 'claude-3-5-sonnet-20241022',
        stopReason: 'end_turn',
      })

      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        temperature: 0.7,
        messages: [{ role: 'user', content: 'Test prompt for the AI model' }],
      })
    })

    test('should handle authentication errors', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      mockAnthropicClient.messages.create.mockRejectedValue({
        status: 401,
        message: 'Invalid API key',
      })

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderAuthError)
    })

    test('should handle rate limiting errors', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      mockAnthropicClient.messages.create.mockRejectedValue({
        status: 429,
        message: 'Rate limited',
        headers: { 'retry-after': '60' },
      })

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderRateLimitError)
    })

    test('should handle general errors', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      mockAnthropicClient.messages.create.mockRejectedValue({
        status: 500,
        message: 'Internal server error',
      })

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderError)
    })

    test('should map logical model names correctly', async () => {
      const mockRequest = MockDataGenerator.createModelRequest({
        model: 'haiku',
      })
      
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{ text: 'Test response' }],
        usage: { input_tokens: 25, output_tokens: 50 },
        model: 'claude-3-5-haiku-20241022',
        stop_reason: 'end_turn',
      })

      await provider.sendRequest(mockRequest)

      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-5-haiku-20241022',
        })
      )
    })

    test('should include system prompt when provided', async () => {
      const mockRequest = MockDataGenerator.createModelRequest({
        system: 'You are a helpful assistant.',
      })
      
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{ text: 'Test response' }],
        usage: { input_tokens: 25, output_tokens: 50 },
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn',
      })

      await provider.sendRequest(mockRequest)

      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are a helpful assistant.',
        })
      )
    })
  })

  describe('streamRequest', () => {
    test('should stream request successfully', async () => {
      const mockRequest = MockDataGenerator.createModelRequest({ stream: true })
      const chunks: any[] = []
      
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: 'Hello' } }
          yield { type: 'content_block_delta', delta: { text: ' world' } }
          yield { 
            type: 'message_delta', 
            delta: { stop_reason: 'end_turn' },
            usage: { output_tokens: 50 }
          }
        }
      }

      mockAnthropicClient.messages.stream.mockResolvedValue(mockStream)

      await provider.streamRequest(mockRequest, (chunk) => {
        chunks.push(chunk)
      })

      expect(chunks).toEqual([
        { type: 'text', content: 'Hello' },
        { type: 'text', content: ' world' },
        { 
          type: 'metadata', 
          metadata: { 
            stopReason: 'end_turn',
            usage: { outputTokens: 50 }
          }
        },
      ])
    })

    test('should handle streaming errors', async () => {
      const mockRequest = MockDataGenerator.createModelRequest({ stream: true })
      
      mockAnthropicClient.messages.stream.mockRejectedValue({
        status: 401,
        message: 'Invalid API key',
      })

      await expect(
        provider.streamRequest(mockRequest, () => {})
      ).rejects.toThrow(ModelProviderAuthError)
    })
  })

  describe('healthCheck', () => {
    test('should return healthy status', async () => {
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{ text: 'Health check response' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-3-5-haiku-20241022',
        stop_reason: 'end_turn',
      })

      const health = await provider.healthCheck()

      expect(health.isHealthy).toBe(true)
      expect(health.provider).toBe('anthropic')
      expect(health.latency).toBeGreaterThan(0)
      expect(health.lastChecked).toBeInstanceOf(Date)
    })

    test('should return unhealthy status on error', async () => {
      mockAnthropicClient.messages.create.mockRejectedValue(new Error('Connection failed'))

      const health = await provider.healthCheck()

      expect(health.isHealthy).toBe(false)
      expect(health.error).toBe('Connection failed')
    })
  })

  describe('validateAuth', () => {
    test('should validate authentication successfully', async () => {
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{ text: 'Auth test' }],
        usage: { input_tokens: 5, output_tokens: 2 },
        model: 'claude-3-5-haiku-20241022',
        stop_reason: 'end_turn',
      })

      const isValid = await provider.validateAuth()
      expect(isValid).toBe(true)
    })

    test('should return false for invalid authentication', async () => {
      mockAnthropicClient.messages.create.mockRejectedValue({
        status: 401,
        message: 'Invalid API key',
      })

      const isValid = await provider.validateAuth()
      expect(isValid).toBe(false)
    })
  })

  describe('getAvailableModels', () => {
    test('should return available models', async () => {
      const models = await provider.getAvailableModels()
      
      expect(models).toEqual([
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
      ])
    })
  })

  describe('estimateCost', () => {
    test('should calculate cost for sonnet model', () => {
      const cost = provider.estimateCost(1000, 500, 'claude-3-5-sonnet-20241022')
      
      // Expected: (1000/1000000 * 3) + (500/1000000 * 15) = 0.003 + 0.0075 = 0.0105
      expect(cost).toBeCloseTo(0.0105, 4)
    })

    test('should calculate cost for haiku model', () => {
      const cost = provider.estimateCost(1000, 500, 'claude-3-5-haiku-20241022')
      
      // Expected: (1000/1000000 * 0.8) + (500/1000000 * 4) = 0.0008 + 0.002 = 0.0028
      expect(cost).toBeCloseTo(0.0028, 4)
    })

    test('should calculate cost for opus model', () => {
      const cost = provider.estimateCost(1000, 500, 'claude-3-opus-20240229')
      
      // Expected: (1000/1000000 * 15) + (500/1000000 * 75) = 0.015 + 0.0375 = 0.0525
      expect(cost).toBeCloseTo(0.0525, 4)
    })

    test('should use default pricing for unknown model', () => {
      const cost = provider.estimateCost(1000, 500, 'unknown-model')
      const defaultCost = provider.estimateCost(1000, 500, 'claude-3-5-sonnet-20241022')
      
      expect(cost).toBe(defaultCost)
    })
  })

  describe('getRateLimits', () => {
    test('should return rate limits', () => {
      const limits = provider.getRateLimits()
      
      expect(limits).toEqual({
        requestsPerMinute: 100,
        tokensPerMinute: 150000,
        concurrentRequests: 10,
      })
    })
  })

  describe('mapModelId', () => {
    test('should map logical model names to Anthropic model IDs', () => {
      expect(provider.mapModelId('sonnet')).toBe('claude-3-5-sonnet-20241022')
      expect(provider.mapModelId('haiku')).toBe('claude-3-5-haiku-20241022')
      expect(provider.mapModelId('opus')).toBe('claude-3-opus-20240229')
    })

    test('should return original ID for non-logical names', () => {
      expect(provider.mapModelId('claude-3-5-sonnet-20241022')).toBe('claude-3-5-sonnet-20241022')
      expect(provider.mapModelId('custom-model-id')).toBe('custom-model-id')
    })
  })

  describe('Configuration Management', () => {
    test('should update model mapping', () => {
      const newMapping = {
        sonnet: {
          anthropic: 'new-sonnet-model',
          bedrock: 'new-bedrock-model',
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

      provider.updateModelMapping(newMapping)
      expect(provider.mapModelId('sonnet')).toBe('new-sonnet-model')
    })

    test('should return configuration copy', () => {
      const config = provider.getConfig()
      expect(config).toEqual(mockConfig)
      
      // Verify it's a copy, not reference
      config.timeout = 99999
      expect(provider.getConfig().timeout).toBe(30000)
    })
  })

  describe('Error Handling', () => {
    test('should handle network timeouts', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      mockAnthropicClient.messages.create.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Timeout',
      })

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderError)
    })

    test('should handle invalid request format', async () => {
      const invalidRequest = {
        ...MockDataGenerator.createModelRequest(),
        messages: [], // Empty messages array
      }
      
      mockAnthropicClient.messages.create.mockRejectedValue({
        status: 400,
        message: 'Invalid request format',
      })

      await expect(provider.sendRequest(invalidRequest)).rejects.toThrow(ModelProviderError)
    })

    test('should handle service unavailable', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      mockAnthropicClient.messages.create.mockRejectedValue({
        status: 503,
        message: 'Service unavailable',
      })

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderError)
    })
  })

  describe('Browser Environment Compatibility', () => {
    test('should handle browser environment settings', () => {
      // Mock window object to simulate browser environment
      const mockWindow = {} as any
      Object.defineProperty(global, 'window', { value: mockWindow, writable: true })

      const browserProvider = new AnthropicProvider(mockConfig)
      expect(browserProvider).toBeInstanceOf(AnthropicProvider)

      // Clean up
      delete (global as any).window
    })
  })
})