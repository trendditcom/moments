/**
 * Provider Health Monitoring System
 * Comprehensive health monitoring with periodic checks, error tracking, and alerting
 */

import { ModelProvider, ProviderHealthCheck } from '../model-providers/provider-interface'
import { ModelProviderFactory } from '../model-providers/provider-factory'

export interface HealthMetrics {
  timestamp: number
  isHealthy: boolean
  latency: number
  error?: string
  provider: string
  checksRun: number
  successRate: number
}

export interface AlertConfig {
  enabled: boolean
  errorRateThreshold: number // 0-1 (e.g., 0.1 = 10% error rate)
  latencyThreshold: number // milliseconds
  consecutiveFailures: number // trigger alert after N failures
  cooldownPeriod: number // milliseconds between alerts
  webhookUrl?: string
  emailEnabled?: boolean
}

export interface ProviderStatus {
  provider: string
  currentHealth: ProviderHealthCheck
  errorRate: number
  averageLatency: number
  uptime: number // percentage
  lastAlert?: number
  consecutiveFailures: number
  totalChecks: number
  successfulChecks: number
}

export interface HealthMonitorConfig {
  checkInterval: number // milliseconds
  retentionPeriod: number // milliseconds
  providers: string[]
  alerts: AlertConfig
}

/**
 * Comprehensive provider health monitoring system
 */
export class ProviderHealthMonitor {
  private config: HealthMonitorConfig
  private metrics: Map<string, HealthMetrics[]> = new Map()
  private status: Map<string, ProviderStatus> = new Map()
  private intervalId?: NodeJS.Timeout
  private alertCooldowns: Map<string, number> = new Map()
  private isRunning: boolean = false

  constructor(config?: Partial<HealthMonitorConfig>) {
    this.config = this.mergeWithDefaults(config)
    this.initializeProviders()
  }

  /**
   * Start periodic health monitoring
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Health monitor is already running')
      return
    }

    console.info(`Starting health monitor with ${this.config.checkInterval}ms interval`)
    this.isRunning = true

    // Run initial health check
    this.runHealthChecks()

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.runHealthChecks()
    }, this.config.checkInterval)
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.info('Stopping health monitor')
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  /**
   * Run health checks on all configured providers
   */
  async runHealthChecks(): Promise<void> {
    const promises = this.config.providers.map(provider => 
      this.checkProviderHealth(provider)
    )

    await Promise.allSettled(promises)
    this.cleanupOldMetrics()
  }

  /**
   * Check health of a specific provider
   */
  async checkProviderHealth(providerType: string): Promise<HealthMetrics> {
    const startTime = Date.now()
    
    try {
      const provider = ModelProviderFactory.getProvider(providerType as any)
      const healthCheck = await provider.healthCheck()
      
      const metrics: HealthMetrics = {
        timestamp: startTime,
        isHealthy: healthCheck.isHealthy,
        latency: healthCheck.latency || (Date.now() - startTime),
        error: healthCheck.error,
        provider: providerType,
        checksRun: 0,
        successRate: 0
      }

      this.recordMetrics(providerType, metrics)
      this.updateProviderStatus(providerType, healthCheck)
      this.checkAlerts(providerType)

      return metrics
    } catch (error: any) {
      const metrics: HealthMetrics = {
        timestamp: startTime,
        isHealthy: false,
        latency: Date.now() - startTime,
        error: error.message,
        provider: providerType,
        checksRun: 0,
        successRate: 0
      }

      this.recordMetrics(providerType, metrics)
      this.updateProviderStatus(providerType, {
        isHealthy: false,
        provider: providerType,
        latency: metrics.latency,
        error: error.message,
        lastChecked: new Date()
      })
      this.checkAlerts(providerType)

      return metrics
    }
  }

  /**
   * Get current status for all providers
   */
  getProviderStatuses(): Map<string, ProviderStatus> {
    return new Map(this.status)
  }

  /**
   * Get status for a specific provider
   */
  getProviderStatus(provider: string): ProviderStatus | undefined {
    return this.status.get(provider)
  }

  /**
   * Get health metrics for a provider within a time range
   */
  getHealthMetrics(
    provider: string, 
    timeRange?: { start: number; end: number }
  ): HealthMetrics[] {
    const metrics = this.metrics.get(provider) || []
    
    if (!timeRange) {
      return [...metrics]
    }

    return metrics.filter(m => 
      m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    )
  }

  /**
   * Get aggregated health statistics
   */
  getHealthStatistics(provider: string, timeRangeMs: number = 24 * 60 * 60 * 1000): {
    uptime: number
    averageLatency: number
    errorRate: number
    totalChecks: number
    availability: number
  } {
    const now = Date.now()
    const metrics = this.getHealthMetrics(provider, {
      start: now - timeRangeMs,
      end: now
    })

    if (metrics.length === 0) {
      return {
        uptime: 0,
        averageLatency: 0,
        errorRate: 0,
        totalChecks: 0,
        availability: 0
      }
    }

    const healthyChecks = metrics.filter(m => m.isHealthy).length
    const totalChecks = metrics.length
    const totalLatency = metrics.reduce((sum, m) => sum + m.latency, 0)

    return {
      uptime: (healthyChecks / totalChecks) * 100,
      averageLatency: totalLatency / totalChecks,
      errorRate: ((totalChecks - healthyChecks) / totalChecks) * 100,
      totalChecks,
      availability: (healthyChecks / totalChecks) * 100
    }
  }

  /**
   * Manually trigger an alert test
   */
  async testAlert(provider: string): Promise<void> {
    await this.triggerAlert(provider, 'Manual alert test')
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.config.alerts = { ...this.config.alerts, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): HealthMonitorConfig {
    return { ...this.config }
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<HealthMonitorConfig>): void {
    const wasRunning = this.isRunning
    
    if (wasRunning) {
      this.stop()
    }

    this.config = this.mergeWithDefaults(config)
    
    if (wasRunning) {
      this.start()
    }
  }

  /**
   * Export health data for analysis
   */
  exportHealthData(): {
    config: HealthMonitorConfig
    metrics: Record<string, HealthMetrics[]>
    status: Record<string, ProviderStatus>
    exportedAt: number
  } {
    const metricsObj: Record<string, HealthMetrics[]> = {}
    const statusObj: Record<string, ProviderStatus> = {}

    this.metrics.forEach((metrics, provider) => {
      metricsObj[provider] = [...metrics]
    })

    this.status.forEach((status, provider) => {
      statusObj[provider] = { ...status }
    })

    return {
      config: this.config,
      metrics: metricsObj,
      status: statusObj,
      exportedAt: Date.now()
    }
  }

  // Private helper methods

  private mergeWithDefaults(config?: Partial<HealthMonitorConfig>): HealthMonitorConfig {
    const defaults: HealthMonitorConfig = {
      checkInterval: 60000, // 1 minute
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      providers: ['anthropic', 'bedrock'],
      alerts: {
        enabled: true,
        errorRateThreshold: 0.1, // 10%
        latencyThreshold: 5000, // 5 seconds
        consecutiveFailures: 3,
        cooldownPeriod: 30 * 60 * 1000, // 30 minutes
        webhookUrl: undefined,
        emailEnabled: false
      }
    }

    return {
      ...defaults,
      ...config,
      alerts: { ...defaults.alerts, ...config?.alerts }
    }
  }

  private initializeProviders(): void {
    this.config.providers.forEach(provider => {
      if (!this.metrics.has(provider)) {
        this.metrics.set(provider, [])
      }
      
      if (!this.status.has(provider)) {
        this.status.set(provider, {
          provider,
          currentHealth: {
            isHealthy: false,
            provider,
            lastChecked: new Date()
          },
          errorRate: 0,
          averageLatency: 0,
          uptime: 0,
          consecutiveFailures: 0,
          totalChecks: 0,
          successfulChecks: 0
        })
      }
    })
  }

  private recordMetrics(provider: string, metrics: HealthMetrics): void {
    const providerMetrics = this.metrics.get(provider) || []
    
    // Calculate success rate based on recent metrics
    const recentMetrics = providerMetrics.slice(-99) // Last 99 + current = 100
    recentMetrics.push(metrics)
    const successfulChecks = recentMetrics.filter(m => m.isHealthy).length
    
    metrics.checksRun = recentMetrics.length
    metrics.successRate = successfulChecks / recentMetrics.length

    providerMetrics.push(metrics)
    this.metrics.set(provider, providerMetrics)
  }

  private updateProviderStatus(provider: string, healthCheck: ProviderHealthCheck): void {
    const status = this.status.get(provider)
    if (!status) return

    const wasHealthy = status.currentHealth.isHealthy
    status.currentHealth = healthCheck
    status.totalChecks++

    if (healthCheck.isHealthy) {
      status.successfulChecks++
      status.consecutiveFailures = 0
    } else {
      status.consecutiveFailures++
    }

    // Calculate rolling metrics
    const stats = this.getHealthStatistics(provider)
    status.errorRate = stats.errorRate
    status.averageLatency = stats.averageLatency
    status.uptime = stats.uptime

    this.status.set(provider, status)
  }

  private async checkAlerts(provider: string): Promise<void> {
    if (!this.config.alerts.enabled) return

    const status = this.status.get(provider)
    if (!status) return

    const now = Date.now()
    const lastAlert = this.alertCooldowns.get(provider) || 0

    // Check if we're in cooldown period
    if (now - lastAlert < this.config.alerts.cooldownPeriod) {
      return
    }

    let shouldAlert = false
    let alertMessage = ''

    // Check consecutive failures
    if (status.consecutiveFailures >= this.config.alerts.consecutiveFailures) {
      shouldAlert = true
      alertMessage = `Provider ${provider} has failed ${status.consecutiveFailures} consecutive health checks`
    }

    // Check error rate
    if (status.errorRate > this.config.alerts.errorRateThreshold * 100) {
      shouldAlert = true
      alertMessage = `Provider ${provider} error rate (${status.errorRate.toFixed(1)}%) exceeds threshold`
    }

    // Check latency
    if (status.averageLatency > this.config.alerts.latencyThreshold) {
      shouldAlert = true
      alertMessage = `Provider ${provider} latency (${status.averageLatency.toFixed(0)}ms) exceeds threshold`
    }

    if (shouldAlert) {
      await this.triggerAlert(provider, alertMessage)
      this.alertCooldowns.set(provider, now)
    }
  }

  private async triggerAlert(provider: string, message: string): Promise<void> {
    console.warn(`HEALTH ALERT [${provider}]: ${message}`)

    const status = this.status.get(provider)
    if (status) {
      status.lastAlert = Date.now()
    }

    // Webhook alert
    if (this.config.alerts.webhookUrl) {
      try {
        await fetch(this.config.alerts.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            message,
            timestamp: Date.now(),
            status: status?.currentHealth
          })
        })
      } catch (error) {
        console.error('Failed to send webhook alert:', error)
      }
    }

    // Browser notification (if available)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`Provider Alert: ${provider}`, {
          body: message,
          icon: '/favicon.ico'
        })
      }
    }

    // Custom event for UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('providerAlert', {
        detail: { provider, message, status }
      }))
    }
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod

    this.metrics.forEach((metrics, provider) => {
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime)
      this.metrics.set(provider, filteredMetrics)
    })
  }
}

/**
 * Global health monitor instance
 */
let globalHealthMonitor: ProviderHealthMonitor | null = null

export function getGlobalHealthMonitor(): ProviderHealthMonitor {
  if (!globalHealthMonitor) {
    globalHealthMonitor = new ProviderHealthMonitor()
  }
  return globalHealthMonitor
}

export function initializeGlobalHealthMonitor(config?: Partial<HealthMonitorConfig>): ProviderHealthMonitor {
  if (globalHealthMonitor) {
    globalHealthMonitor.stop()
  }
  globalHealthMonitor = new ProviderHealthMonitor(config)
  return globalHealthMonitor
}