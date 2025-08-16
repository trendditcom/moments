/**
 * Provider Performance Benchmark Tests
 * Comprehensive performance testing and comparison between providers
 */

import { MockAnthropicProvider, MockBedrockProvider, MockDataGenerator } from '../mocks/mock-providers'
import { ModelRequest, ModelResponse } from '@/lib/model-providers/provider-interface'
import { performance } from 'perf_hooks'

interface PerformanceMetrics {
  requestsPerSecond: number
  averageLatency: number
  medianLatency: number
  p95Latency: number
  p99Latency: number
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
  }
  errorRate: number
  throughput: number
}

interface BenchmarkResult {
  provider: string
  testName: string
  metrics: PerformanceMetrics
  duration: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
}

describe('Provider Performance Benchmarks', () => {
  let anthropicProvider: MockAnthropicProvider
  let bedrockProvider: MockBedrockProvider

  beforeEach(() => {
    anthropicProvider = new MockAnthropicProvider({
      type: 'anthropic',
      apiKey: 'test-key',
    }, undefined, {
      simulateLatency: 150, // Base latency for Anthropic
    })

    bedrockProvider = new MockBedrockProvider({
      type: 'bedrock',
      region: 'us-east-1',
    }, undefined, {
      simulateLatency: 200, // Base latency for Bedrock
    })
  })

  afterEach(() => {
    anthropicProvider.clearCallLog()
    bedrockProvider.clearCallLog()
  })

  /**
   * Helper function to measure performance metrics
   */
  async function measurePerformance(
    provider: MockAnthropicProvider | MockBedrockProvider,
    testName: string,
    requestGenerator: () => ModelRequest,
    requestCount: number = 100,
    concurrency: number = 1
  ): Promise<BenchmarkResult> {
    const latencies: number[] = []
    const errors: Error[] = []
    const startTime = performance.now()
    let memoryBefore = process.memoryUsage()

    const executeRequest = async (): Promise<void> => {
      const requestStart = performance.now()
      try {
        await provider.sendRequest(requestGenerator())
        const requestEnd = performance.now()
        latencies.push(requestEnd - requestStart)
      } catch (error) {
        errors.push(error as Error)
        latencies.push(0) // Record failed requests
      }
    }

    // Execute requests with specified concurrency
    const batches = Math.ceil(requestCount / concurrency)
    for (let i = 0; i < batches; i++) {
      const batchSize = Math.min(concurrency, requestCount - i * concurrency)
      const promises = Array.from({ length: batchSize }, () => executeRequest())
      await Promise.all(promises)
    }

    const endTime = performance.now()
    const memoryAfter = process.memoryUsage()
    const totalDuration = endTime - startTime

    // Calculate metrics
    const validLatencies = latencies.filter(l => l > 0)
    validLatencies.sort((a, b) => a - b)

    const metrics: PerformanceMetrics = {
      requestsPerSecond: (requestCount / totalDuration) * 1000,
      averageLatency: validLatencies.length > 0 ? validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length : 0,
      medianLatency: validLatencies.length > 0 ? validLatencies[Math.floor(validLatencies.length / 2)] : 0,
      p95Latency: validLatencies.length > 0 ? validLatencies[Math.floor(validLatencies.length * 0.95)] : 0,
      p99Latency: validLatencies.length > 0 ? validLatencies[Math.floor(validLatencies.length * 0.99)] : 0,
      memoryUsage: {
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
        heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
        external: memoryAfter.external - memoryBefore.external,
      },
      errorRate: (errors.length / requestCount) * 100,
      throughput: (validLatencies.length / totalDuration) * 1000,
    }

    return {
      provider: provider.getType(),
      testName,
      metrics,
      duration: totalDuration,
      totalRequests: requestCount,
      successfulRequests: validLatencies.length,
      failedRequests: errors.length,
    }
  }

  describe('Basic Request Performance', () => {
    test('should benchmark simple text generation', async () => {
      const simpleRequest = () => MockDataGenerator.createModelRequest({
        messages: [{ role: 'user', content: 'Generate a simple response.' }],
        model: 'sonnet',
        maxTokens: 100,
      })

      const anthropicResult = await measurePerformance(
        anthropicProvider,
        'Simple Text Generation',
        simpleRequest,
        50
      )

      const bedrockResult = await measurePerformance(
        bedrockProvider,
        'Simple Text Generation',
        simpleRequest,
        50
      )

      expect(anthropicResult.metrics.errorRate).toBe(0)
      expect(bedrockResult.metrics.errorRate).toBe(0)

      expect(anthropicResult.metrics.averageLatency).toBeGreaterThan(100)
      expect(bedrockResult.metrics.averageLatency).toBeGreaterThan(100)

      // Anthropic should be faster based on our mock latencies
      expect(anthropicResult.metrics.averageLatency).toBeLessThan(bedrockResult.metrics.averageLatency)

      console.log('Simple Text Generation Benchmark:')
      console.log(`Anthropic: ${anthropicResult.metrics.averageLatency.toFixed(2)}ms avg, ${anthropicResult.metrics.requestsPerSecond.toFixed(2)} req/s`)
      console.log(`Bedrock: ${bedrockResult.metrics.averageLatency.toFixed(2)}ms avg, ${bedrockResult.metrics.requestsPerSecond.toFixed(2)} req/s`)
    }, 30000)

    test('should benchmark complex analysis tasks', async () => {
      const complexRequest = () => MockDataGenerator.createModelRequest({
        messages: [{ 
          role: 'user', 
          content: 'Analyze this complex business scenario and provide detailed recommendations with supporting evidence and risk assessment.' 
        }],
        model: 'sonnet',
        maxTokens: 1000,
        temperature: 0.7,
      })

      const anthropicResult = await measurePerformance(
        anthropicProvider,
        'Complex Analysis',
        complexRequest,
        30
      )

      const bedrockResult = await measurePerformance(
        bedrockProvider,
        'Complex Analysis',
        complexRequest,
        30
      )

      expect(anthropicResult.metrics.errorRate).toBe(0)
      expect(bedrockResult.metrics.errorRate).toBe(0)

      // Complex tasks should have higher latency
      expect(anthropicResult.metrics.averageLatency).toBeGreaterThan(100)
      expect(bedrockResult.metrics.averageLatency).toBeGreaterThan(100)

      console.log('Complex Analysis Benchmark:')
      console.log(`Anthropic: ${anthropicResult.metrics.averageLatency.toFixed(2)}ms avg, ${anthropicResult.metrics.requestsPerSecond.toFixed(2)} req/s`)
      console.log(`Bedrock: ${bedrockResult.metrics.averageLatency.toFixed(2)}ms avg, ${bedrockResult.metrics.requestsPerSecond.toFixed(2)} req/s`)
    }, 30000)
  })

  describe('Concurrency Performance', () => {
    test('should benchmark concurrent requests', async () => {
      const concurrentRequest = () => MockDataGenerator.createModelRequest({
        messages: [{ role: 'user', content: 'Concurrent test request.' }],
        model: 'haiku',
        maxTokens: 50,
      })

      const sequentialResult = await measurePerformance(
        anthropicProvider,
        'Sequential Requests',
        concurrentRequest,
        20,
        1 // Sequential
      )

      anthropicProvider.clearCallLog()

      const concurrentResult = await measurePerformance(
        anthropicProvider,
        'Concurrent Requests',
        concurrentRequest,
        20,
        5 // 5 concurrent
      )

      // Concurrent should be faster overall
      expect(concurrentResult.duration).toBeLessThan(sequentialResult.duration)
      expect(concurrentResult.metrics.requestsPerSecond).toBeGreaterThan(sequentialResult.metrics.requestsPerSecond)

      console.log('Concurrency Benchmark:')
      console.log(`Sequential: ${sequentialResult.duration.toFixed(2)}ms total, ${sequentialResult.metrics.requestsPerSecond.toFixed(2)} req/s`)
      console.log(`Concurrent: ${concurrentResult.duration.toFixed(2)}ms total, ${concurrentResult.metrics.requestsPerSecond.toFixed(2)} req/s`)
    }, 30000)

    test('should handle high concurrency loads', async () => {
      const highConcurrencyRequest = () => MockDataGenerator.createModelRequest({
        model: 'haiku',
        maxTokens: 50,
      })

      const result = await measurePerformance(
        anthropicProvider,
        'High Concurrency Load',
        highConcurrencyRequest,
        100,
        10 // 10 concurrent
      )

      expect(result.metrics.errorRate).toBe(0)
      expect(result.metrics.requestsPerSecond).toBeGreaterThan(0)

      console.log('High Concurrency Benchmark:')
      console.log(`100 requests, 10 concurrent: ${result.metrics.averageLatency.toFixed(2)}ms avg, ${result.metrics.requestsPerSecond.toFixed(2)} req/s`)
    }, 45000)
  })

  describe('Model Performance Comparison', () => {
    test('should compare performance across different models', async () => {
      const models = ['haiku', 'sonnet', 'opus']
      const results: BenchmarkResult[] = []

      for (const model of models) {
        const modelRequest = () => MockDataGenerator.createModelRequest({
          model,
          maxTokens: 200,
        })

        const result = await measurePerformance(
          anthropicProvider,
          `Model ${model}`,
          modelRequest,
          20
        )

        results.push(result)
      }

      // Haiku should be fastest (smallest model)
      const haikuResult = results.find(r => r.testName === 'Model haiku')!
      const sonnetResult = results.find(r => r.testName === 'Model sonnet')!
      const opusResult = results.find(r => r.testName === 'Model opus')!

      expect(haikuResult.metrics.averageLatency).toBeLessThanOrEqual(sonnetResult.metrics.averageLatency)
      expect(sonnetResult.metrics.averageLatency).toBeLessThanOrEqual(opusResult.metrics.averageLatency)

      console.log('Model Performance Comparison:')
      results.forEach(result => {
        console.log(`${result.testName}: ${result.metrics.averageLatency.toFixed(2)}ms avg, ${result.metrics.requestsPerSecond.toFixed(2)} req/s`)
      })
    }, 30000)
  })

  describe('Error Handling Performance', () => {
    test('should benchmark error handling performance', async () => {
      const errorProvider = new MockAnthropicProvider({
        type: 'anthropic',
        apiKey: 'test-key',
      }, undefined, {
        shouldThrowError: true,
        simulateLatency: 50,
      })

      const errorRequest = () => MockDataGenerator.createModelRequest()

      const result = await measurePerformance(
        errorProvider,
        'Error Handling',
        errorRequest,
        50
      )

      expect(result.metrics.errorRate).toBe(100) // All requests should fail
      expect(result.failedRequests).toBe(50)
      expect(result.successfulRequests).toBe(0)

      // Error handling should still be reasonably fast
      expect(result.duration).toBeLessThan(10000) // Less than 10 seconds for 50 requests

      console.log('Error Handling Benchmark:')
      console.log(`50 error requests: ${result.duration.toFixed(2)}ms total, ${result.metrics.errorRate}% error rate`)
    }, 15000)

    test('should benchmark partial failure scenarios', async () => {
      let requestCount = 0
      const partialFailureProvider = new MockAnthropicProvider({
        type: 'anthropic',
        apiKey: 'test-key',
      }, undefined, {
        simulateLatency: 100,
      })

      // Override sendRequest to fail every 3rd request
      const originalSendRequest = partialFailureProvider.sendRequest.bind(partialFailureProvider)
      partialFailureProvider.sendRequest = async function(request: ModelRequest) {
        requestCount++
        if (requestCount % 3 === 0) {
          throw new Error('Simulated partial failure')
        }
        return originalSendRequest(request)
      }

      const partialFailureRequest = () => MockDataGenerator.createModelRequest()

      const result = await measurePerformance(
        partialFailureProvider,
        'Partial Failures',
        partialFailureRequest,
        30
      )

      expect(result.metrics.errorRate).toBeCloseTo(33.33, 1) // ~33% failure rate
      expect(result.successfulRequests).toBe(20)
      expect(result.failedRequests).toBe(10)

      console.log('Partial Failure Benchmark:')
      console.log(`${result.successfulRequests} success, ${result.failedRequests} failures, ${result.metrics.errorRate.toFixed(1)}% error rate`)
    }, 15000)
  })

  describe('Memory Usage Analysis', () => {
    test('should monitor memory usage during sustained load', async () => {
      const memoryTestRequest = () => MockDataGenerator.createModelRequest({
        maxTokens: 1000,
      })

      const result = await measurePerformance(
        anthropicProvider,
        'Memory Usage Test',
        memoryTestRequest,
        200
      )

      expect(result.metrics.memoryUsage.heapUsed).toBeGreaterThanOrEqual(0)
      expect(result.metrics.errorRate).toBe(0)

      console.log('Memory Usage Benchmark:')
      console.log(`Heap used: ${(result.metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`)
      console.log(`Heap total: ${(result.metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`)
    }, 30000)

    test('should detect memory leaks in long-running tests', async () => {
      const initialMemory = process.memoryUsage()

      for (let i = 0; i < 5; i++) {
        await measurePerformance(
          anthropicProvider,
          `Memory Leak Test Batch ${i}`,
          () => MockDataGenerator.createModelRequest(),
          50
        )

        anthropicProvider.clearCallLog()

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)

      console.log('Memory Leak Test:')
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`)
    }, 45000)
  })

  describe('Throughput Analysis', () => {
    test('should measure sustained throughput', async () => {
      const throughputResults: number[] = []

      // Measure throughput over multiple batches
      for (let i = 0; i < 5; i++) {
        const result = await measurePerformance(
          anthropicProvider,
          `Throughput Batch ${i}`,
          () => MockDataGenerator.createModelRequest({ model: 'haiku', maxTokens: 100 }),
          50,
          5
        )

        throughputResults.push(result.metrics.requestsPerSecond)
        await new Promise(resolve => setTimeout(resolve, 100)) // Brief pause between batches
      }

      const averageThroughput = throughputResults.reduce((a, b) => a + b, 0) / throughputResults.length
      const throughputVariance = throughputResults.reduce((sum, rate) => sum + Math.pow(rate - averageThroughput, 2), 0) / throughputResults.length
      const throughputStdDev = Math.sqrt(throughputVariance)

      expect(averageThroughput).toBeGreaterThan(0)
      
      // Throughput should be relatively stable (coefficient of variation < 50%)
      const coefficientOfVariation = (throughputStdDev / averageThroughput) * 100
      expect(coefficientOfVariation).toBeLessThan(50)

      console.log('Sustained Throughput Analysis:')
      console.log(`Average: ${averageThroughput.toFixed(2)} req/s`)
      console.log(`Std Dev: ${throughputStdDev.toFixed(2)} req/s`)
      console.log(`CV: ${coefficientOfVariation.toFixed(1)}%`)
    }, 30000)
  })

  describe('Latency Distribution Analysis', () => {
    test('should analyze latency distribution patterns', async () => {
      const distributionRequest = () => MockDataGenerator.createModelRequest({
        model: 'sonnet',
        maxTokens: 200,
      })

      const result = await measurePerformance(
        anthropicProvider,
        'Latency Distribution',
        distributionRequest,
        100
      )

      const { averageLatency, medianLatency, p95Latency, p99Latency } = result.metrics

      expect(averageLatency).toBeGreaterThan(0)
      expect(medianLatency).toBeGreaterThan(0)
      expect(p95Latency).toBeGreaterThan(0)
      expect(p99Latency).toBeGreaterThan(0)

      // P95 should be greater than median, P99 should be greater than P95
      expect(p95Latency).toBeGreaterThanOrEqual(medianLatency)
      expect(p99Latency).toBeGreaterThanOrEqual(p95Latency)

      console.log('Latency Distribution Analysis:')
      console.log(`Median: ${medianLatency.toFixed(2)}ms`)
      console.log(`Average: ${averageLatency.toFixed(2)}ms`)
      console.log(`P95: ${p95Latency.toFixed(2)}ms`)
      console.log(`P99: ${p99Latency.toFixed(2)}ms`)
    }, 20000)
  })

  describe('Provider Performance Comparison', () => {
    test('should compare overall provider performance', async () => {
      const comparisonRequest = () => MockDataGenerator.createModelRequest({
        model: 'sonnet',
        maxTokens: 500,
      })

      const anthropicResult = await measurePerformance(
        anthropicProvider,
        'Provider Comparison',
        comparisonRequest,
        100,
        3
      )

      const bedrockResult = await measurePerformance(
        bedrockProvider,
        'Provider Comparison',
        comparisonRequest,
        100,
        3
      )

      // Both should have zero errors
      expect(anthropicResult.metrics.errorRate).toBe(0)
      expect(bedrockResult.metrics.errorRate).toBe(0)

      // Compare key metrics
      const anthropicScore = calculatePerformanceScore(anthropicResult.metrics)
      const bedrockScore = calculatePerformanceScore(bedrockResult.metrics)

      console.log('Provider Performance Comparison:')
      console.log('Anthropic:')
      console.log(`  Latency: ${anthropicResult.metrics.averageLatency.toFixed(2)}ms`)
      console.log(`  Throughput: ${anthropicResult.metrics.requestsPerSecond.toFixed(2)} req/s`)
      console.log(`  Score: ${anthropicScore.toFixed(2)}`)
      console.log('Bedrock:')
      console.log(`  Latency: ${bedrockResult.metrics.averageLatency.toFixed(2)}ms`)
      console.log(`  Throughput: ${bedrockResult.metrics.requestsPerSecond.toFixed(2)} req/s`)
      console.log(`  Score: ${bedrockScore.toFixed(2)}`)

      expect(anthropicScore).toBeGreaterThan(0)
      expect(bedrockScore).toBeGreaterThan(0)
    }, 45000)
  })

  /**
   * Calculate a composite performance score
   */
  function calculatePerformanceScore(metrics: PerformanceMetrics): number {
    // Lower latency and higher throughput = better score
    const latencyScore = Math.max(0, 1000 - metrics.averageLatency) / 10
    const throughputScore = metrics.requestsPerSecond * 10
    const reliabilityScore = (100 - metrics.errorRate) * 2

    return (latencyScore + throughputScore + reliabilityScore) / 3
  }
})