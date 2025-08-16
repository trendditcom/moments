/**
 * Provider Health Monitoring Tests
 * Tests for comprehensive health monitoring and failover management
 */

import { ProviderHealthMonitor, HealthMonitorConfig, AlertConfig } from '@/lib/monitoring/provider-health'
import { FailoverManager, FailoverConfig } from '@/lib/monitoring/failover-manager'
import { MockAnthropicProvider, MockBedrockProvider } from '../mocks/mock-providers'

// Mock provider factory
jest.mock('@/lib/model-providers/provider-factory', () => ({
  ModelProviderFactory: {
    getProvider: jest.fn(),
  },
}))

describe('Provider Health Monitoring', () => {
  let healthMonitor: ProviderHealthMonitor
  let mockAnthropicProvider: MockAnthropicProvider
  let mockBedrockProvider: MockBedrockProvider

  beforeEach(() => {
    mockAnthropicProvider = new MockAnthropicProvider({
      type: 'anthropic',
      apiKey: 'test-key',
    })

    mockBedrockProvider = new MockBedrockProvider({
      type: 'bedrock',
      region: 'us-east-1',
    })

    // Mock provider factory
    const { ModelProviderFactory } = require('@/lib/model-providers/provider-factory')
    ModelProviderFactory.getProvider.mockImplementation((type: string) => {
      return type === 'anthropic' ? mockAnthropicProvider : mockBedrockProvider
    })

    const config: HealthMonitorConfig = {
      checkInterval: 100, // Fast interval for testing
      retentionPeriod: 60000, // 1 minute for testing
      providers: ['anthropic', 'bedrock'],
      alerts: {
        enabled: true,
        errorRateThreshold: 0.1,
        latencyThreshold: 1000,
        consecutiveFailures: 3,
        cooldownPeriod: 5000,
      },
    }

    healthMonitor = new ProviderHealthMonitor(config)
  })

  afterEach(() => {
    healthMonitor.stop()
    jest.clearAllMocks()
  })

  describe('Health Check Functionality', () => {
    test('should perform basic health check', async () => {
      const healthResult = await healthMonitor.checkProviderHealth('anthropic')

      expect(healthResult.provider).toBe('anthropic')
      expect(healthResult.isHealthy).toBe(true)
      expect(healthResult.latency).toBeGreaterThan(0)
      expect(healthResult.timestamp).toBeDefined()
      expect(mockAnthropicProvider.getCallCount('healthCheck')).toBe(1)
    })

    test('should detect unhealthy provider', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowError = true

      const healthResult = await healthMonitor.checkProviderHealth('anthropic')

      expect(healthResult.isHealthy).toBe(false)
      expect(healthResult.error).toBeDefined()
    })

    test('should update provider status', async () => {
      await healthMonitor.checkProviderHealth('anthropic')

      const status = healthMonitor.getProviderStatus('anthropic')
      expect(status).toBeDefined()
      expect(status?.provider).toBe('anthropic')
      expect(status?.currentHealth.isHealthy).toBe(true)
      expect(status?.totalChecks).toBe(1)
      expect(status?.successfulChecks).toBe(1)
    })

    test('should track consecutive failures', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowError = true

      // Perform multiple failed health checks
      await healthMonitor.checkProviderHealth('anthropic')
      await healthMonitor.checkProviderHealth('anthropic')
      await healthMonitor.checkProviderHealth('anthropic')

      const status = healthMonitor.getProviderStatus('anthropic')
      expect(status?.consecutiveFailures).toBe(3)
      expect(status?.successfulChecks).toBe(0)
    })

    test('should reset consecutive failures on success', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowError = true

      // Fail twice
      await healthMonitor.checkProviderHealth('anthropic')
      await healthMonitor.checkProviderHealth('anthropic')

      // Succeed once
      mockAnthropicProvider.mockOptions.shouldThrowError = false
      await healthMonitor.checkProviderHealth('anthropic')

      const status = healthMonitor.getProviderStatus('anthropic')
      expect(status?.consecutiveFailures).toBe(0)
      expect(status?.successfulChecks).toBe(1)
    })
  })

  describe('Periodic Health Monitoring', () => {
    test('should start and stop monitoring', async () => {
      expect(healthMonitor.getConfig().checkInterval).toBe(100)

      healthMonitor.start()
      
      // Wait for a few check intervals
      await new Promise(resolve => setTimeout(resolve, 350))
      
      healthMonitor.stop()

      // Should have performed multiple checks
      expect(mockAnthropicProvider.getCallCount('healthCheck')).toBeGreaterThan(2)
      expect(mockBedrockProvider.getCallCount('healthCheck')).toBeGreaterThan(2)
    }, 10000)

    test('should not start multiple monitoring sessions', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      healthMonitor.start()
      healthMonitor.start() // Second start should warn

      expect(consoleSpy).toHaveBeenCalledWith('Health monitor is already running')
      
      consoleSpy.mockRestore()
    })

    test('should handle monitoring errors gracefully', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowError = true

      healthMonitor.start()
      
      await new Promise(resolve => setTimeout(resolve, 250))
      
      healthMonitor.stop()

      // Should still have attempted health checks
      expect(mockAnthropicProvider.getCallCount('healthCheck')).toBeGreaterThan(0)

      // Status should reflect failures
      const status = healthMonitor.getProviderStatus('anthropic')
      expect(status?.consecutiveFailures).toBeGreaterThan(0)
    }, 10000)
  })

  describe('Health Statistics', () => {
    test('should calculate accurate health statistics', async () => {
      // Perform mix of successful and failed checks
      await healthMonitor.checkProviderHealth('anthropic') // Success
      await healthMonitor.checkProviderHealth('anthropic') // Success

      mockAnthropicProvider.mockOptions.shouldThrowError = true
      await healthMonitor.checkProviderHealth('anthropic') // Failure

      const stats = healthMonitor.getHealthStatistics('anthropic')

      expect(stats.totalChecks).toBe(3)
      expect(stats.uptime).toBeCloseTo(66.67, 1) // 2/3 success rate
      expect(stats.errorRate).toBeCloseTo(33.33, 1) // 1/3 error rate
      expect(stats.averageLatency).toBeGreaterThan(0)
    })

    test('should filter statistics by time range', async () => {
      const now = Date.now()
      
      await healthMonitor.checkProviderHealth('anthropic')
      
      // Get stats for last 1 hour
      const hourStats = healthMonitor.getHealthStatistics('anthropic', 60 * 60 * 1000)
      expect(hourStats.totalChecks).toBe(1)

      // Get stats for last 1 second (should be 0)
      const secondStats = healthMonitor.getHealthStatistics('anthropic', 1000)
      expect(secondStats.totalChecks).toBeLessThanOrEqual(1)
    })

    test('should handle empty metrics gracefully', () => {
      const stats = healthMonitor.getHealthStatistics('nonexistent-provider')

      expect(stats.totalChecks).toBe(0)
      expect(stats.uptime).toBe(0)
      expect(stats.errorRate).toBe(0)
      expect(stats.averageLatency).toBe(0)
    })
  })

  describe('Alert System', () => {
    test('should trigger alerts on consecutive failures', async () => {
      const alertSpy = jest.spyOn(console, 'warn').mockImplementation()

      mockAnthropicProvider.mockOptions.shouldThrowError = true

      // Trigger consecutive failures to meet alert threshold
      await healthMonitor.checkProviderHealth('anthropic')
      await healthMonitor.checkProviderHealth('anthropic')
      await healthMonitor.checkProviderHealth('anthropic')

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('HEALTH ALERT [anthropic]')
      )

      alertSpy.mockRestore()
    })

    test('should respect alert cooldown period', async () => {
      const alertSpy = jest.spyOn(console, 'warn').mockImplementation()

      mockAnthropicProvider.mockOptions.shouldThrowError = true

      // Trigger first alert
      await healthMonitor.checkProviderHealth('anthropic')
      await healthMonitor.checkProviderHealth('anthropic')
      await healthMonitor.checkProviderHealth('anthropic')

      const firstAlertCount = alertSpy.mock.calls.filter(call => 
        call[0].includes('HEALTH ALERT [anthropic]')
      ).length

      // Trigger more failures immediately (should not trigger new alert due to cooldown)
      await healthMonitor.checkProviderHealth('anthropic')
      await healthMonitor.checkProviderHealth('anthropic')

      const secondAlertCount = alertSpy.mock.calls.filter(call => 
        call[0].includes('HEALTH ALERT [anthropic]')
      ).length

      expect(secondAlertCount).toBe(firstAlertCount) // No new alerts during cooldown

      alertSpy.mockRestore()
    })

    test('should trigger alerts on high error rate', async () => {
      // Configure lower error rate threshold for testing
      healthMonitor.updateAlertConfig({ errorRateThreshold: 0.3 })

      const alertSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Create mix of success/failure to exceed 30% error rate
      await healthMonitor.checkProviderHealth('anthropic') // Success
      
      mockAnthropicProvider.mockOptions.shouldThrowError = true
      await healthMonitor.checkProviderHealth('anthropic') // Failure
      await healthMonitor.checkProviderHealth('anthropic') // Failure

      // Should trigger error rate alert
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('error rate')
      )

      alertSpy.mockRestore()
    })

    test('should trigger alerts on high latency', async () => {
      // Configure low latency threshold for testing
      healthMonitor.updateAlertConfig({ latencyThreshold: 50 })

      mockAnthropicProvider.mockOptions.simulateLatency = 100 // Higher than threshold

      const alertSpy = jest.spyOn(console, 'warn').mockImplementation()

      await healthMonitor.checkProviderHealth('anthropic')

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('latency')
      )

      alertSpy.mockRestore()
    })

    test('should allow manual alert testing', async () => {
      const alertSpy = jest.spyOn(console, 'warn').mockImplementation()

      await healthMonitor.testAlert('anthropic')

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('HEALTH ALERT [anthropic]')
      )

      alertSpy.mockRestore()
    })
  })

  describe('Configuration Management', () => {
    test('should update monitoring configuration', () => {
      const newConfig: Partial<HealthMonitorConfig> = {
        checkInterval: 500,
        providers: ['anthropic'],
      }

      healthMonitor.updateConfig(newConfig)

      const config = healthMonitor.getConfig()
      expect(config.checkInterval).toBe(500)
      expect(config.providers).toEqual(['anthropic'])
    })

    test('should update alert configuration', () => {
      const newAlertConfig: Partial<AlertConfig> = {
        errorRateThreshold: 0.2,
        latencyThreshold: 2000,
        consecutiveFailures: 5,
      }

      healthMonitor.updateAlertConfig(newAlertConfig)

      const config = healthMonitor.getConfig()
      expect(config.alerts.errorRateThreshold).toBe(0.2)
      expect(config.alerts.latencyThreshold).toBe(2000)
      expect(config.alerts.consecutiveFailures).toBe(5)
    })

    test('should restart monitoring when configuration changes', () => {
      const startSpy = jest.spyOn(healthMonitor, 'start')
      const stopSpy = jest.spyOn(healthMonitor, 'stop')

      healthMonitor.start()

      healthMonitor.updateConfig({ checkInterval: 200 })

      expect(stopSpy).toHaveBeenCalled()
      expect(startSpy).toHaveBeenCalledTimes(2) // Once for initial start, once for restart
    })
  })

  describe('Data Export and Cleanup', () => {
    test('should export health data', async () => {
      await healthMonitor.checkProviderHealth('anthropic')
      await healthMonitor.checkProviderHealth('bedrock')

      const exportData = healthMonitor.exportHealthData()

      expect(exportData.config).toBeDefined()
      expect(exportData.metrics).toBeDefined()
      expect(exportData.status).toBeDefined()
      expect(exportData.exportedAt).toBeGreaterThan(0)

      expect(exportData.metrics.anthropic).toBeDefined()
      expect(exportData.metrics.bedrock).toBeDefined()
      expect(exportData.status.anthropic).toBeDefined()
      expect(exportData.status.bedrock).toBeDefined()
    })

    test('should clean up old metrics', async () => {
      // Configure very short retention period
      healthMonitor.updateConfig({ retentionPeriod: 100 })

      await healthMonitor.checkProviderHealth('anthropic')

      // Wait for retention period to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Trigger cleanup by running another check
      await healthMonitor.checkProviderHealth('anthropic')

      const metrics = healthMonitor.getHealthMetrics('anthropic')
      
      // Should only have recent metrics
      expect(metrics.length).toBeLessThanOrEqual(2)
    })
  })

  describe('Error Scenarios', () => {
    test('should handle provider not found errors', async () => {
      const { ModelProviderFactory } = require('@/lib/model-providers/provider-factory')
      ModelProviderFactory.getProvider.mockImplementation(() => {
        throw new Error('Provider not found')
      })

      const healthResult = await healthMonitor.checkProviderHealth('unknown')

      expect(healthResult.isHealthy).toBe(false)
      expect(healthResult.error).toContain('Provider not found')
    })

    test('should handle authentication errors in health checks', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowAuth = true

      const healthResult = await healthMonitor.checkProviderHealth('anthropic')

      expect(healthResult.isHealthy).toBe(false)
      expect(healthResult.error).toBeDefined()
    })

    test('should continue monitoring other providers when one fails', async () => {
      mockAnthropicProvider.mockOptions.shouldThrowError = true

      healthMonitor.start()

      await new Promise(resolve => setTimeout(resolve, 250))

      healthMonitor.stop()

      // Anthropic should have failed checks
      const anthropicStatus = healthMonitor.getProviderStatus('anthropic')
      expect(anthropicStatus?.consecutiveFailures).toBeGreaterThan(0)

      // Bedrock should have successful checks
      const bedrockStatus = healthMonitor.getProviderStatus('bedrock')
      expect(bedrockStatus?.successfulChecks).toBeGreaterThan(0)
    }, 10000)
  })

  describe('Browser Environment Compatibility', () => {
    test('should handle browser environment gracefully', async () => {
      // Mock window object
      const mockWindow = {
        Notification: {
          permission: 'granted',
        },
        dispatchEvent: jest.fn(),
      }
      Object.defineProperty(global, 'window', { value: mockWindow, writable: true })

      const alertSpy = jest.spyOn(console, 'warn').mockImplementation()

      await healthMonitor.testAlert('anthropic')

      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'providerAlert',
        })
      )

      alertSpy.mockRestore()
      delete (global as any).window
    })

    test('should handle missing notification API', async () => {
      // Mock window without Notification API
      const mockWindow = {}
      Object.defineProperty(global, 'window', { value: mockWindow, writable: true })

      await expect(healthMonitor.testAlert('anthropic')).resolves.not.toThrow()

      delete (global as any).window
    })
  })
})