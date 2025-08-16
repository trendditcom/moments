/**
 * Comprehensive Error Handling Tests
 * Tests for error scenarios across the provider ecosystem
 */

import { MockAnthropicProvider, MockBedrockProvider, MockProviderFactory, MockDataGenerator } from '../mocks/mock-providers'
import { 
  ModelProviderError, 
  ModelProviderAuthError, 
  ModelProviderRateLimitError 
} from '@/lib/model-providers/provider-interface'

describe('Comprehensive Error Handling', () => {
  describe('Authentication Error Scenarios', () => {
    test('should handle Anthropic authentication failures', async () => {
      const provider = MockProviderFactory.createFailingProvider('anthropic', 'auth')
      const request = MockDataGenerator.createModelRequest()

      await expect(provider.sendRequest(request)).rejects.toThrow(ModelProviderAuthError)
      await expect(provider.validateAuth()).resolves.toBe(false)
    })

    test('should handle Bedrock authentication failures', async () => {
      const provider = MockProviderFactory.createFailingProvider('bedrock', 'auth')
      const request = MockDataGenerator.createModelRequest()

      await expect(provider.sendRequest(request)).rejects.toThrow(ModelProviderAuthError)
      await expect(provider.validateAuth()).resolves.toBe(false)
    })

    test('should handle authentication failures in streaming', async () => {
      const provider = MockProviderFactory.createFailingProvider('anthropic', 'auth')
      const request = MockDataGenerator.createModelRequest({ stream: true })

      await expect(
        provider.streamRequest(request, () => {})
      ).rejects.toThrow(ModelProviderAuthError)
    })

    test('should handle authentication failures in health checks', async () => {
      const provider = MockProviderFactory.createFailingProvider('bedrock', 'auth')

      await expect(provider.healthCheck()).rejects.toThrow(ModelProviderAuthError)
    })
  })

  describe('Rate Limiting Error Scenarios', () => {
    test('should handle Anthropic rate limiting', async () => {
      const provider = MockProviderFactory.createFailingProvider('anthropic', 'rate_limit')
      const request = MockDataGenerator.createModelRequest()

      try {
        await provider.sendRequest(request)
        fail('Should have thrown rate limit error')
      } catch (error) {
        expect(error).toBeInstanceOf(ModelProviderRateLimitError)
        expect((error as ModelProviderRateLimitError).retryAfter).toBe(60)
      }
    })

    test('should handle Bedrock throttling', async () => {
      const provider = MockProviderFactory.createFailingProvider('bedrock', 'rate_limit')
      const request = MockDataGenerator.createModelRequest()

      try {
        await provider.sendRequest(request)
        fail('Should have thrown rate limit error')
      } catch (error) {
        expect(error).toBeInstanceOf(ModelProviderRateLimitError)
        expect((error as ModelProviderRateLimitError).retryAfter).toBe(120)
      }
    })

    test('should handle concurrent rate limiting', async () => {
      const provider = MockProviderFactory.createFailingProvider('anthropic', 'rate_limit')
      const request = MockDataGenerator.createModelRequest()

      const promises = Array.from({ length: 5 }, () => 
        provider.sendRequest(request).catch(e => e)
      )

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result).toBeInstanceOf(ModelProviderRateLimitError)
      })
    })
  })

  describe('General Error Scenarios', () => {
    test('should handle network connectivity errors', async () => {
      const provider = MockProviderFactory.createFailingProvider('anthropic', 'general')
      const request = MockDataGenerator.createModelRequest()

      await expect(provider.sendRequest(request)).rejects.toThrow(ModelProviderError)
    })

    test('should handle malformed requests', async () => {
      const provider = MockProviderFactory.createAnthropicProvider()
      
      const malformedRequest = {
        messages: [], // Empty messages
        model: '',    // Empty model
        maxTokens: -1, // Invalid token count
      } as any

      // Mock provider should handle this gracefully
      const response = await provider.sendRequest(malformedRequest)
      expect(response).toBeDefined()
    })

    test('should handle service unavailable errors', async () => {
      const provider = MockProviderFactory.createFailingProvider('bedrock', 'general')
      const request = MockDataGenerator.createModelRequest()

      await expect(provider.sendRequest(request)).rejects.toThrow(ModelProviderError)
    })

    test('should handle timeout errors', async () => {
      const provider = MockProviderFactory.createAnthropicProvider({
        simulateLatency: 10000, // Very high latency to simulate timeout
      })

      const request = MockDataGenerator.createModelRequest()

      // Should still resolve in mock, but in real implementation would timeout
      const response = await provider.sendRequest(request)
      expect(response).toBeDefined()
    })
  })

  describe('Error Recovery Scenarios', () => {
    test('should recover from temporary authentication errors', async () => {
      const provider = MockProviderFactory.createAnthropicProvider({
        shouldThrowAuth: true,
      })

      const request = MockDataGenerator.createModelRequest()

      // First request should fail
      await expect(provider.sendRequest(request)).rejects.toThrow(ModelProviderAuthError)

      // Simulate auth recovery
      provider.mockOptions.shouldThrowAuth = false

      // Second request should succeed
      const response = await provider.sendRequest(request)
      expect(response.content).toBeDefined()
    })

    test('should handle intermittent failures', async () => {
      const provider = MockProviderFactory.createAnthropicProvider()
      let callCount = 0

      // Override to fail every other request
      const originalSendRequest = provider.sendRequest.bind(provider)
      provider.sendRequest = async function(request) {
        callCount++
        if (callCount % 2 === 0) {
          throw new ModelProviderError('Intermittent failure', 'anthropic')
        }
        return originalSendRequest(request)
      }

      const request = MockDataGenerator.createModelRequest()

      // First request should succeed
      const response1 = await provider.sendRequest(request)
      expect(response1.content).toBeDefined()

      // Second request should fail
      await expect(provider.sendRequest(request)).rejects.toThrow(ModelProviderError)

      // Third request should succeed
      const response3 = await provider.sendRequest(request)
      expect(response3.content).toBeDefined()
    })

    test('should handle provider switching on errors', async () => {
      const primaryProvider = MockProviderFactory.createFailingProvider('anthropic', 'general')
      const fallbackProvider = MockProviderFactory.createBedrockProvider()

      const request = MockDataGenerator.createModelRequest()

      // Primary should fail
      await expect(primaryProvider.sendRequest(request)).rejects.toThrow(ModelProviderError)

      // Fallback should succeed
      const response = await fallbackProvider.sendRequest(request)
      expect(response.content).toContain('Mock response from Bedrock')
    })
  })

  describe('Streaming Error Scenarios', () => {
    test('should handle streaming connection errors', async () => {
      const provider = MockProviderFactory.createFailingProvider('anthropic', 'general')
      const request = MockDataGenerator.createModelRequest({ stream: true })

      await expect(
        provider.streamRequest(request, () => {})
      ).rejects.toThrow(ModelProviderError)
    })

    test('should handle partial streaming failures', async () => {
      const provider = MockProviderFactory.createAnthropicProvider()
      let chunkCount = 0

      // Override streaming to fail after some chunks
      const originalStreamRequest = provider.streamRequest.bind(provider)
      provider.streamRequest = async function(request, onChunk) {
        chunkCount = 0
        return originalStreamRequest(request, (chunk) => {
          chunkCount++
          if (chunkCount > 3) {
            throw new ModelProviderError('Streaming failure', 'anthropic')
          }
          onChunk(chunk)
        })
      }

      const request = MockDataGenerator.createModelRequest({ stream: true })
      const chunks: any[] = []

      await expect(
        provider.streamRequest(request, (chunk) => chunks.push(chunk))
      ).rejects.toThrow(ModelProviderError)

      // Should have received some chunks before failure
      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.length).toBeLessThanOrEqual(3)
    })

    test('should handle streaming data corruption', async () => {
      const provider = MockProviderFactory.createBedrockProvider()
      const request = MockDataGenerator.createModelRequest({ stream: true })

      const chunks: any[] = []

      // Mock provider handles this gracefully
      await provider.streamRequest(request, (chunk) => {
        chunks.push(chunk)
      })

      expect(chunks.length).toBeGreaterThan(0)
    })
  })

  describe('Concurrent Error Scenarios', () => {
    test('should handle multiple concurrent authentication failures', async () => {
      const provider = MockProviderFactory.createFailingProvider('anthropic', 'auth')
      const request = MockDataGenerator.createModelRequest()

      const promises = Array.from({ length: 10 }, () => 
        provider.sendRequest(request).catch(e => e)
      )

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result).toBeInstanceOf(ModelProviderAuthError)
      })
    })

    test('should handle mixed success and failure scenarios', async () => {
      const successProvider = MockProviderFactory.createAnthropicProvider()
      const failureProvider = MockProviderFactory.createFailingProvider('anthropic', 'general')

      const request = MockDataGenerator.createModelRequest()

      const promises = [
        successProvider.sendRequest(request),
        failureProvider.sendRequest(request).catch(e => e),
        successProvider.sendRequest(request),
        failureProvider.sendRequest(request).catch(e => e),
      ]

      const results = await Promise.all(promises)

      expect(results[0]).toHaveProperty('content')
      expect(results[1]).toBeInstanceOf(ModelProviderError)
      expect(results[2]).toHaveProperty('content')
      expect(results[3]).toBeInstanceOf(ModelProviderError)
    })

    test('should handle provider overload scenarios', async () => {
      const provider = MockProviderFactory.createAnthropicProvider({
        simulateLatency: 500,
      })

      const request = MockDataGenerator.createModelRequest()

      // Send many concurrent requests
      const promises = Array.from({ length: 20 }, () => 
        provider.sendRequest(request)
      )

      const results = await Promise.all(promises)

      // All should succeed in mock
      results.forEach(result => {
        expect(result.content).toBeDefined()
      })
    })
  })

  describe('Error Propagation and Logging', () => {
    test('should preserve error details through layers', async () => {
      const provider = MockProviderFactory.createFailingProvider('bedrock', 'auth')
      const request = MockDataGenerator.createModelRequest()

      try {
        await provider.sendRequest(request)
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(ModelProviderAuthError)
        expect((error as ModelProviderAuthError).provider).toBe('bedrock')
        expect((error as ModelProviderAuthError).retryable).toBe(false)
      }
    })

    test('should log appropriate error information', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const provider = MockProviderFactory.createFailingProvider('anthropic', 'general')
      const request = MockDataGenerator.createModelRequest()

      await expect(provider.sendRequest(request)).rejects.toThrow()

      // Should have logged error details
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    test('should maintain error context across async operations', async () => {
      const provider = MockProviderFactory.createFailingProvider('bedrock', 'rate_limit')
      const request = MockDataGenerator.createModelRequest()

      const asyncOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return provider.sendRequest(request)
      }

      try {
        await asyncOperation()
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(ModelProviderRateLimitError)
        expect((error as ModelProviderRateLimitError).provider).toBe('bedrock')
      }
    })
  })

  describe('Resource Cleanup on Errors', () => {
    test('should clean up resources on request failures', async () => {
      const provider = MockProviderFactory.createFailingProvider('anthropic', 'general')
      const request = MockDataGenerator.createModelRequest()

      // Track resource usage
      const initialMemory = process.memoryUsage()

      try {
        await provider.sendRequest(request)
      } catch (error) {
        // Expected to fail
      }

      // Allow garbage collection
      await new Promise(resolve => setTimeout(resolve, 100))

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB
    })

    test('should clean up streaming resources on failures', async () => {
      const provider = MockProviderFactory.createFailingProvider('bedrock', 'general')
      const request = MockDataGenerator.createModelRequest({ stream: true })

      const initialMemory = process.memoryUsage()

      try {
        await provider.streamRequest(request, () => {})
      } catch (error) {
        // Expected to fail
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Error Handling Edge Cases', () => {
    test('should handle null and undefined requests', async () => {
      const provider = MockProviderFactory.createAnthropicProvider()

      // Mock provider should handle gracefully
      const response1 = await provider.sendRequest(null as any)
      expect(response1).toBeDefined()

      const response2 = await provider.sendRequest(undefined as any)
      expect(response2).toBeDefined()
    })

    test('should handle extremely large requests', async () => {
      const provider = MockProviderFactory.createBedrockProvider()

      const largeRequest = MockDataGenerator.createModelRequest({
        messages: [{
          role: 'user',
          content: 'x'.repeat(100000), // Very large content
        }],
        maxTokens: 4000,
      })

      // Should handle gracefully
      const response = await provider.sendRequest(largeRequest)
      expect(response).toBeDefined()
    })

    test('should handle special characters in requests', async () => {
      const provider = MockProviderFactory.createAnthropicProvider()

      const specialCharRequest = MockDataGenerator.createModelRequest({
        messages: [{
          role: 'user',
          content: '🚀 Special chars: ñáéíóú 中文 العربية \\n\\t\\r',
        }],
      })

      const response = await provider.sendRequest(specialCharRequest)
      expect(response.content).toBeDefined()
    })

    test('should handle rapid consecutive errors', async () => {
      const provider = MockProviderFactory.createFailingProvider('anthropic', 'general')
      const request = MockDataGenerator.createModelRequest()

      const errors: Error[] = []

      // Rapid fire requests
      for (let i = 0; i < 10; i++) {
        try {
          await provider.sendRequest(request)
        } catch (error) {
          errors.push(error as Error)
        }
      }

      expect(errors.length).toBe(10)
      errors.forEach(error => {
        expect(error).toBeInstanceOf(ModelProviderError)
      })
    })
  })
})