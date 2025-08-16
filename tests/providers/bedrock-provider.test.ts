/**
 * Unit Tests for BedrockProvider
 * Comprehensive testing of Amazon Bedrock provider implementation
 */

import { BedrockProvider } from '@/lib/model-providers/bedrock-provider'
import {
  ModelProviderConfig,
  ModelRequest,
  ModelProviderError,
  ModelProviderAuthError,
  ModelProviderRateLimitError,
} from '@/lib/model-providers/provider-interface'
import { MockDataGenerator } from '../mocks/mock-providers'

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  InvokeModelCommand: jest.fn(),
  InvokeModelWithResponseStreamCommand: jest.fn(),
}))

// Mock BedrockAuth
jest.mock('@/lib/auth/bedrock-auth', () => ({
  BedrockAuth: jest.fn().mockImplementation(() => ({
    getCredentials: jest.fn().mockResolvedValue({
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      sessionToken: 'test-session-token',
    }),
    validateCredentials: jest.fn().mockResolvedValue(true),
  })),
}))

describe('BedrockProvider', () => {
  let provider: BedrockProvider
  let mockConfig: ModelProviderConfig
  let mockBedrockClient: any

  beforeEach(() => {
    mockConfig = {
      type: 'bedrock',
      region: 'us-east-1',
      timeout: 30000,
      maxRetries: 3,
    }

    // Mock the Bedrock client
    const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime')
    mockBedrockClient = {
      send: jest.fn(),
    }
    BedrockRuntimeClient.mockImplementation(() => mockBedrockClient)

    provider = new BedrockProvider(mockConfig)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor and Initialization', () => {
    test('should initialize with valid config', async () => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Wait for async initialization

      expect(provider).toBeInstanceOf(BedrockProvider)
      expect(provider.getType()).toBe('bedrock')
      expect(provider.getConfig()).toEqual(mockConfig)
    })

    test('should use default region when not specified', async () => {
      const configWithoutRegion = { ...mockConfig }
      delete configWithoutRegion.region

      const providerWithoutRegion = new BedrockProvider(configWithoutRegion)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(providerWithoutRegion.getConfig().region).toBeUndefined()
    })

    test('should handle AWS profile configuration', async () => {
      const configWithProfile = {
        ...mockConfig,
        profile: 'test-profile',
      }

      const providerWithProfile = new BedrockProvider(configWithProfile)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(providerWithProfile.getConfig().profile).toBe('test-profile')
    })

    test('should handle Bedrock API key configuration', async () => {
      const configWithApiKey = {
        ...mockConfig,
        useBedrockApiKey: true,
        apiKey: 'test-bedrock-api-key',
      }

      const providerWithApiKey = new BedrockProvider(configWithApiKey)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(providerWithApiKey.getConfig().useBedrockApiKey).toBe(true)
    })

    test('should initialize with custom model mapping', async () => {
      const customMapping = {
        sonnet: {
          anthropic: 'claude-3-5-sonnet-20241022',
          bedrock: 'custom-bedrock-sonnet',
        },
        haiku: {
          anthropic: 'claude-3-5-haiku-20241022',
          bedrock: 'custom-bedrock-haiku',
        },
        opus: {
          anthropic: 'claude-3-opus-20240229',
          bedrock: 'custom-bedrock-opus',
        },
      }

      const providerWithMapping = new BedrockProvider(mockConfig, customMapping)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(providerWithMapping.mapModelId('sonnet')).toBe('custom-bedrock-sonnet')
    })
  })

  describe('sendRequest', () => {
    test('should send request successfully', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      const mockResponse = {
        body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            content: [{ text: 'Test response from Bedrock' }],
            usage: { input_tokens: 25, output_tokens: 50 },
            model: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
            stop_reason: 'end_turn',
          })),
        },
        $metadata: {
          httpStatusCode: 200,
        },
      }

      mockBedrockClient.send.mockResolvedValue(mockResponse)

      const result = await provider.sendRequest(mockRequest)

      expect(result).toEqual({
        content: 'Test response from Bedrock',
        usage: {
          inputTokens: 25,
          outputTokens: 50,
          totalTokens: 75,
        },
        model: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        stopReason: 'end_turn',
      })
    })

    test('should handle authentication errors', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      const authError = new Error('UnauthorizedOperation')
      authError.name = 'UnauthorizedOperation'
      mockBedrockClient.send.mockRejectedValue(authError)

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderAuthError)
    })

    test('should handle throttling errors', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      const throttleError = new Error('ThrottlingException')
      throttleError.name = 'ThrottlingException'
      mockBedrockClient.send.mockRejectedValue(throttleError)

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderRateLimitError)
    })

    test('should handle service quota exceeded', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      const quotaError = new Error('ServiceQuotaExceededException')
      quotaError.name = 'ServiceQuotaExceededException'
      mockBedrockClient.send.mockRejectedValue(quotaError)

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderRateLimitError)
    })

    test('should handle general errors', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      const generalError = new Error('InternalServerException')
      generalError.name = 'InternalServerException'
      mockBedrockClient.send.mockRejectedValue(generalError)

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderError)
    })

    test('should map logical model names correctly', async () => {
      const mockRequest = MockDataGenerator.createModelRequest({
        model: 'haiku',
      })
      
      const mockResponse = {
        body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            content: [{ text: 'Test response' }],
            usage: { input_tokens: 25, output_tokens: 50 },
            model: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
            stop_reason: 'end_turn',
          })),
        },
        $metadata: { httpStatusCode: 200 },
      }

      mockBedrockClient.send.mockResolvedValue(mockResponse)

      await provider.sendRequest(mockRequest)

      // Verify the command was created with the correct model ID
      const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime')
      expect(InvokeModelCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        })
      )
    })

    test('should format request body correctly for Bedrock', async () => {
      const mockRequest = MockDataGenerator.createModelRequest({
        system: 'You are a helpful assistant.',
        maxTokens: 200,
        temperature: 0.8,
      })
      
      const mockResponse = {
        body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            content: [{ text: 'Test response' }],
            usage: { input_tokens: 25, output_tokens: 50 },
            model: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
            stop_reason: 'end_turn',
          })),
        },
        $metadata: { httpStatusCode: 200 },
      }

      mockBedrockClient.send.mockResolvedValue(mockResponse)

      await provider.sendRequest(mockRequest)

      const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime')
      const commandCall = InvokeModelCommand.mock.calls[0][0]
      
      expect(commandCall).toMatchObject({
        modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        contentType: 'application/json',
        accept: 'application/json',
      })

      const requestBody = JSON.parse(commandCall.body)
      expect(requestBody).toMatchObject({
        anthropic_version: 'bedrock-2023-05-31',
        system: 'You are a helpful assistant.',
        max_tokens: 200,
        temperature: 0.8,
        messages: [{ role: 'user', content: 'Test prompt for the AI model' }],
      })
    })
  })

  describe('streamRequest', () => {
    test('should stream request successfully', async () => {
      const mockRequest = MockDataGenerator.createModelRequest({ stream: true })
      const chunks: any[] = []
      
      const mockStreamResponse = {
        body: {
          async *[Symbol.asyncIterator]() {
            yield {
              chunk: {
                bytes: new TextEncoder().encode(JSON.stringify({
                  type: 'content_block_delta',
                  delta: { text: 'Hello' }
                }))
              }
            }
            yield {
              chunk: {
                bytes: new TextEncoder().encode(JSON.stringify({
                  type: 'content_block_delta',
                  delta: { text: ' from Bedrock' }
                }))
              }
            }
            yield {
              chunk: {
                bytes: new TextEncoder().encode(JSON.stringify({
                  type: 'message_delta',
                  delta: { stop_reason: 'end_turn' },
                  usage: { output_tokens: 50 }
                }))
              }
            }
          }
        },
        $metadata: { httpStatusCode: 200 },
      }

      mockBedrockClient.send.mockResolvedValue(mockStreamResponse)

      await provider.streamRequest(mockRequest, (chunk) => {
        chunks.push(chunk)
      })

      expect(chunks).toEqual([
        { type: 'text', content: 'Hello' },
        { type: 'text', content: ' from Bedrock' },
        { 
          type: 'metadata', 
          metadata: { 
            stopReason: 'end_turn',
            usage: { outputTokens: 50 }
          }
        },
      ])
    })

    test('should handle streaming authentication errors', async () => {
      const mockRequest = MockDataGenerator.createModelRequest({ stream: true })
      
      const authError = new Error('UnauthorizedOperation')
      authError.name = 'UnauthorizedOperation'
      mockBedrockClient.send.mockRejectedValue(authError)

      await expect(
        provider.streamRequest(mockRequest, () => {})
      ).rejects.toThrow(ModelProviderAuthError)
    })

    test('should handle malformed streaming data', async () => {
      const mockRequest = MockDataGenerator.createModelRequest({ stream: true })
      
      const mockStreamResponse = {
        body: {
          async *[Symbol.asyncIterator]() {
            yield {
              chunk: {
                bytes: new TextEncoder().encode('invalid json')
              }
            }
          }
        },
        $metadata: { httpStatusCode: 200 },
      }

      mockBedrockClient.send.mockResolvedValue(mockStreamResponse)

      const chunks: any[] = []
      await provider.streamRequest(mockRequest, (chunk) => {
        chunks.push(chunk)
      })

      // Should handle malformed data gracefully
      expect(chunks.length).toBe(0)
    })
  })

  describe('healthCheck', () => {
    test('should return healthy status', async () => {
      const mockResponse = {
        body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            content: [{ text: 'Health check response' }],
            usage: { input_tokens: 10, output_tokens: 5 },
            model: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
            stop_reason: 'end_turn',
          })),
        },
        $metadata: { httpStatusCode: 200 },
      }

      mockBedrockClient.send.mockResolvedValue(mockResponse)

      const health = await provider.healthCheck()

      expect(health.isHealthy).toBe(true)
      expect(health.provider).toBe('bedrock')
      expect(health.latency).toBeGreaterThan(0)
      expect(health.lastChecked).toBeInstanceOf(Date)
    })

    test('should return unhealthy status on error', async () => {
      const error = new Error('Service unavailable')
      mockBedrockClient.send.mockRejectedValue(error)

      const health = await provider.healthCheck()

      expect(health.isHealthy).toBe(false)
      expect(health.error).toBe('Service unavailable')
    })

    test('should include model availability in health check', async () => {
      const mockResponse = {
        body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            content: [{ text: 'Health check' }],
            usage: { input_tokens: 10, output_tokens: 5 },
            model: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
            stop_reason: 'end_turn',
          })),
        },
        $metadata: { httpStatusCode: 200 },
      }

      mockBedrockClient.send.mockResolvedValue(mockResponse)

      const health = await provider.healthCheck()

      expect(health.modelAvailability).toBeDefined()
      expect(health.modelAvailability!['us.anthropic.claude-3-5-haiku-20241022-v1:0']).toBe(true)
    })
  })

  describe('validateAuth', () => {
    test('should validate authentication successfully', async () => {
      const mockResponse = {
        body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            content: [{ text: 'Auth test' }],
            usage: { input_tokens: 5, output_tokens: 2 },
            model: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
            stop_reason: 'end_turn',
          })),
        },
        $metadata: { httpStatusCode: 200 },
      }

      mockBedrockClient.send.mockResolvedValue(mockResponse)

      const isValid = await provider.validateAuth()
      expect(isValid).toBe(true)
    })

    test('should return false for invalid authentication', async () => {
      const authError = new Error('UnauthorizedOperation')
      authError.name = 'UnauthorizedOperation'
      mockBedrockClient.send.mockRejectedValue(authError)

      const isValid = await provider.validateAuth()
      expect(isValid).toBe(false)
    })
  })

  describe('getAvailableModels', () => {
    test('should return available Bedrock models', async () => {
      const models = await provider.getAvailableModels()
      
      expect(models).toEqual([
        'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        'anthropic.claude-3-opus-20240229-v1:0',
      ])
    })
  })

  describe('estimateCost', () => {
    test('should calculate cost for Bedrock sonnet model', () => {
      const cost = provider.estimateCost(1000, 500, 'us.anthropic.claude-3-5-sonnet-20241022-v2:0')
      
      // Expected: Bedrock has 10% markup over Anthropic
      // (1000/1000000 * 3.3) + (500/1000000 * 16.5) = 0.0033 + 0.00825 = 0.01155
      expect(cost).toBeCloseTo(0.01155, 4)
    })

    test('should calculate cost for Bedrock haiku model', () => {
      const cost = provider.estimateCost(1000, 500, 'us.anthropic.claude-3-5-haiku-20241022-v1:0')
      
      // Expected: (1000/1000000 * 0.88) + (500/1000000 * 4.4) = 0.00088 + 0.0022 = 0.00308
      expect(cost).toBeCloseTo(0.00308, 4)
    })

    test('should calculate cost for Bedrock opus model', () => {
      const cost = provider.estimateCost(1000, 500, 'anthropic.claude-3-opus-20240229-v1:0')
      
      // Expected: (1000/1000000 * 16.5) + (500/1000000 * 82.5) = 0.0165 + 0.04125 = 0.05775
      expect(cost).toBeCloseTo(0.05775, 4)
    })

    test('should use default pricing for unknown model', () => {
      const cost = provider.estimateCost(1000, 500, 'unknown-bedrock-model')
      const defaultCost = provider.estimateCost(1000, 500, 'us.anthropic.claude-3-5-sonnet-20241022-v2:0')
      
      expect(cost).toBe(defaultCost)
    })
  })

  describe('getRateLimits', () => {
    test('should return Bedrock rate limits', () => {
      const limits = provider.getRateLimits()
      
      expect(limits).toEqual({
        requestsPerMinute: 50,
        tokensPerMinute: 100000,
        concurrentRequests: 5,
      })
    })
  })

  describe('mapModelId', () => {
    test('should map logical model names to Bedrock model IDs', () => {
      expect(provider.mapModelId('sonnet')).toBe('us.anthropic.claude-3-5-sonnet-20241022-v2:0')
      expect(provider.mapModelId('haiku')).toBe('us.anthropic.claude-3-5-haiku-20241022-v1:0')
      expect(provider.mapModelId('opus')).toBe('anthropic.claude-3-opus-20240229-v1:0')
    })

    test('should return original ID for non-logical names', () => {
      expect(provider.mapModelId('us.anthropic.claude-3-5-sonnet-20241022-v2:0')).toBe('us.anthropic.claude-3-5-sonnet-20241022-v2:0')
      expect(provider.mapModelId('custom-bedrock-model')).toBe('custom-bedrock-model')
    })
  })

  describe('AWS-Specific Features', () => {
    test('should handle inference profiles', async () => {
      const configWithProfile = {
        ...mockConfig,
        inferenceProfile: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0:cross-region',
      }

      const providerWithProfile = new BedrockProvider(configWithProfile)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(providerWithProfile.getConfig().inferenceProfile).toBe('us.anthropic.claude-3-5-sonnet-20241022-v2:0:cross-region')
    })

    test('should handle different AWS regions', async () => {
      const configWithRegion = {
        ...mockConfig,
        region: 'us-west-2',
      }

      const providerWithRegion = new BedrockProvider(configWithRegion)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(providerWithRegion.getConfig().region).toBe('us-west-2')
    })

    test('should handle Bedrock-specific errors', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      const bedrockError = new Error('ModelNotReadyException')
      bedrockError.name = 'ModelNotReadyException'
      mockBedrockClient.send.mockRejectedValue(bedrockError)

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderError)
    })
  })

  describe('Error Handling', () => {
    test('should handle network timeouts', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      const timeoutError = new Error('TimeoutError')
      timeoutError.name = 'TimeoutError'
      mockBedrockClient.send.mockRejectedValue(timeoutError)

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderError)
    })

    test('should handle invalid model IDs', async () => {
      const mockRequest = MockDataGenerator.createModelRequest({
        model: 'invalid-model-id',
      })
      
      const validationError = new Error('ValidationException')
      validationError.name = 'ValidationException'
      mockBedrockClient.send.mockRejectedValue(validationError)

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderError)
    })

    test('should handle resource not found errors', async () => {
      const mockRequest = MockDataGenerator.createModelRequest()
      
      const notFoundError = new Error('ResourceNotFoundException')
      notFoundError.name = 'ResourceNotFoundException'
      mockBedrockClient.send.mockRejectedValue(notFoundError)

      await expect(provider.sendRequest(mockRequest)).rejects.toThrow(ModelProviderError)
    })
  })

  describe('Configuration Updates', () => {
    test('should update model mapping', () => {
      const newMapping = {
        sonnet: {
          anthropic: 'claude-3-5-sonnet-20241022',
          bedrock: 'new-bedrock-sonnet-model',
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
      expect(provider.mapModelId('sonnet')).toBe('new-bedrock-sonnet-model')
    })

    test('should return configuration copy', () => {
      const config = provider.getConfig()
      expect(config).toEqual(mockConfig)
      
      // Verify it's a copy, not reference
      config.region = 'eu-west-1'
      expect(provider.getConfig().region).toBe('us-east-1')
    })
  })
})