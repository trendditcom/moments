/**
 * Mock Providers Tests
 * Basic tests to verify mock provider functionality
 */

import { MockAnthropicProvider, MockBedrockProvider, MockProviderFactory, MockDataGenerator } from './mock-providers'

describe('Mock Providers', () => {
  describe('MockAnthropicProvider', () => {
    test('should create and respond successfully', async () => {
      const provider = MockProviderFactory.createAnthropicProvider()
      const request = MockDataGenerator.createModelRequest()

      const response = await provider.sendRequest(request)

      expect(response.content).toContain('Mock response from Anthropic')
      expect(response.usage?.inputTokens).toBeGreaterThan(0)
      expect(response.usage?.outputTokens).toBeGreaterThan(0)
    })

    test('should track method calls', async () => {
      const provider = MockProviderFactory.createAnthropicProvider()
      const request = MockDataGenerator.createModelRequest()

      await provider.sendRequest(request)

      expect(provider.getCallCount('sendRequest')).toBe(1)
      const lastCall = provider.getLastCall('sendRequest')
      expect(lastCall.args[0]).toEqual(request)
    })

    test('should simulate errors when configured', async () => {
      const provider = MockProviderFactory.createFailingProvider('anthropic', 'auth')
      const request = MockDataGenerator.createModelRequest()

      await expect(provider.sendRequest(request)).rejects.toThrow()
    })
  })

  describe('MockBedrockProvider', () => {
    test('should create and respond successfully', async () => {
      const provider = MockProviderFactory.createBedrockProvider()
      const request = MockDataGenerator.createModelRequest()

      const response = await provider.sendRequest(request)

      expect(response.content).toContain('Mock response from Bedrock')
      expect(response.usage?.inputTokens).toBeGreaterThan(0)
      expect(response.usage?.outputTokens).toBeGreaterThan(0)
    })
  })

  describe('MockDataGenerator', () => {
    test('should generate valid model requests', () => {
      const request = MockDataGenerator.createModelRequest()

      expect(request.messages).toHaveLength(1)
      expect(request.model).toBeDefined()
      expect(request.maxTokens).toBeGreaterThan(0)
    })

    test('should generate valid model responses', () => {
      const response = MockDataGenerator.createModelResponse()

      expect(response.content).toBeDefined()
      expect(response.usage?.totalTokens).toBeGreaterThan(0)
    })

    test('should generate valid health checks', () => {
      const health = MockDataGenerator.createHealthCheck()

      expect(health.isHealthy).toBe(true)
      expect(health.provider).toBeDefined()
      expect(health.lastChecked).toBeInstanceOf(Date)
    })
  })
})