/**
 * Failover Manager
 * Intelligent provider failover with backoff strategies and automatic recovery
 */

import { ModelProvider, ModelRequest, ModelResponse } from '../model-providers/provider-interface'
import { ModelProviderFactory } from '../model-providers/provider-factory'
import { ProviderHealthMonitor, ProviderStatus } from './provider-health'

export interface FailoverStrategy {
  mode: 'immediate' | 'gradual' | 'health_based'
  healthThreshold: number // 0-100 percentage
  maxFailures: number
  backoffMultiplier: number
  maxBackoffTime: number // milliseconds
  recoveryThreshold: number // consecutive successes needed for recovery
}

export interface FailoverConfig {
  enabled: boolean
  primaryProvider: string
  fallbackProviders: string[]
  strategy: FailoverStrategy
  circuitBreaker: {
    enabled: boolean
    failureThreshold: number
    resetTimeout: number // milliseconds
  }
}

export interface ProviderState {
  provider: string
  isActive: boolean
  consecutiveFailures: number
  lastFailureTime: number
  backoffUntil: number
  consecutiveSuccesses: number
  totalRequests: number
  successfulRequests: number
  circuitBreakerOpen: boolean
  lastCircuitBreakerReset: number
}

export interface FailoverEvent {
  timestamp: number
  type: 'failover' | 'recovery' | 'circuit_breaker_open' | 'circuit_breaker_closed'
  fromProvider?: string
  toProvider?: string
  reason: string
  healthScore?: number
}

/**
 * Intelligent failover manager with circuit breaker and health-based switching
 */
export class FailoverManager {
  private config: FailoverConfig
  private healthMonitor: ProviderHealthMonitor
  private providerStates: Map<string, ProviderState> = new Map()
  private currentProvider: string
  private failoverEvents: FailoverEvent[] = new Array(100) // Circular buffer
  private eventIndex: number = 0

  constructor(
    healthMonitor: ProviderHealthMonitor,
    config?: Partial<FailoverConfig>
  ) {
    this.healthMonitor = healthMonitor
    this.config = this.mergeWithDefaults(config)
    this.currentProvider = this.config.primaryProvider
    this.initializeProviderStates()
  }

  /**
   * Execute a request with automatic failover
   */
  async executeWithFailover(request: ModelRequest): Promise<{
    response: ModelResponse
    provider: string
    failoverOccurred: boolean
    attempts: number
  }> {
    let attempts = 0
    let failoverOccurred = false
    let lastError: Error | null = null

    // Try providers in order of preference
    const providers = this.getAvailableProviders()
    
    for (const providerName of providers) {
      attempts++
      
      try {
        const provider = ModelProviderFactory.getProvider(providerName as any)
        const response = await this.executeRequest(provider, request, providerName)
        
        // Record success
        this.recordSuccess(providerName)
        
        // Update current provider if this wasn't the original choice
        if (providerName !== this.currentProvider) {
          failoverOccurred = true
          this.handleFailover(this.currentProvider, providerName, 'successful_fallback')
        }

        return {
          response,
          provider: providerName,
          failoverOccurred,
          attempts
        }
      } catch (error: any) {
        lastError = error
        this.recordFailure(providerName, error)
        
        // Check if we should trigger circuit breaker
        this.updateCircuitBreaker(providerName)
        
        console.warn(`Request failed on ${providerName}:`, error.message)
        
        // If this was our primary provider, record failover
        if (providerName === this.currentProvider && providers.length > 1) {
          failoverOccurred = true
        }
      }
    }

    // All providers failed
    throw new Error(
      `All providers failed. Last error: ${lastError?.message || 'Unknown error'}`
    )
  }

  /**
   * Get the current active provider
   */
  getCurrentProvider(): string {
    return this.currentProvider
  }

  /**
   * Get all provider states
   */
  getProviderStates(): Map<string, ProviderState> {
    return new Map(this.providerStates)
  }

  /**
   * Get state for a specific provider
   */
  getProviderState(provider: string): ProviderState | undefined {
    return this.providerStates.get(provider)
  }

  /**
   * Manually trigger failover to a specific provider
   */
  async manualFailover(targetProvider: string): Promise<boolean> {
    if (!this.isProviderAvailable(targetProvider)) {
      console.warn(`Cannot failover to ${targetProvider}: provider not available`)
      return false
    }

    const previousProvider = this.currentProvider
    this.currentProvider = targetProvider
    
    this.recordFailoverEvent({
      timestamp: Date.now(),
      type: 'failover',
      fromProvider: previousProvider,
      toProvider: targetProvider,
      reason: 'manual_failover'
    })

    console.info(`Manual failover from ${previousProvider} to ${targetProvider}`)
    return true
  }

  /**
   * Check for automatic recovery opportunities
   */
  async checkRecoveryOpportunities(): Promise<void> {
    if (!this.config.enabled) return

    const primaryState = this.providerStates.get(this.config.primaryProvider)
    if (!primaryState || primaryState.isActive) return

    // Check if primary provider has recovered
    if (this.shouldAttemptRecovery(this.config.primaryProvider)) {
      await this.attemptRecovery(this.config.primaryProvider)
    }
  }

  /**
   * Get failover events history
   */
  getFailoverEvents(): FailoverEvent[] {
    // Return events in chronological order
    const events = [...this.failoverEvents]
    const validEvents = events.filter(e => e.timestamp > 0)
    return validEvents.sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Get failover statistics
   */
  getFailoverStatistics(): {
    totalFailovers: number
    recoveries: number
    circuitBreakerTrips: number
    currentProviderUptime: number
    meanTimeToFailover: number
    meanTimeToRecovery: number
  } {
    const events = this.getFailoverEvents()
    const failovers = events.filter(e => e.type === 'failover')
    const recoveries = events.filter(e => e.type === 'recovery')
    const circuitBreakers = events.filter(e => e.type === 'circuit_breaker_open')

    const currentState = this.providerStates.get(this.currentProvider)
    const currentUptime = currentState ? 
      (currentState.successfulRequests / Math.max(currentState.totalRequests, 1)) * 100 : 0

    // Calculate mean times
    let totalFailoverTime = 0
    let totalRecoveryTime = 0
    
    for (let i = 1; i < events.length; i++) {
      const current = events[i]
      const previous = events[i - 1]
      
      if (current.type === 'failover') {
        totalFailoverTime += current.timestamp - previous.timestamp
      } else if (current.type === 'recovery') {
        totalRecoveryTime += current.timestamp - previous.timestamp
      }
    }

    return {
      totalFailovers: failovers.length,
      recoveries: recoveries.length,
      circuitBreakerTrips: circuitBreakers.length,
      currentProviderUptime: currentUptime,
      meanTimeToFailover: failovers.length > 0 ? totalFailoverTime / failovers.length : 0,
      meanTimeToRecovery: recoveries.length > 0 ? totalRecoveryTime / recoveries.length : 0
    }
  }

  /**
   * Update failover configuration
   */
  updateConfig(config: Partial<FailoverConfig>): void {
    this.config = this.mergeWithDefaults(config)
    
    // Reinitialize provider states if providers changed
    if (config.primaryProvider || config.fallbackProviders) {
      this.initializeProviderStates()
    }
  }

  /**
   * Reset circuit breakers for all providers
   */
  resetCircuitBreakers(): void {
    this.providerStates.forEach((state, provider) => {
      state.circuitBreakerOpen = false
      state.lastCircuitBreakerReset = Date.now()
      
      this.recordFailoverEvent({
        timestamp: Date.now(),
        type: 'circuit_breaker_closed',
        reason: 'manual_reset'
      })
    })
  }

  /**
   * Export failover data for analysis
   */
  exportFailoverData(): {
    config: FailoverConfig
    states: Record<string, ProviderState>
    events: FailoverEvent[]
    statistics: {
      totalFailovers: number
      recoveries: number
      circuitBreakerTrips: number
      currentProviderUptime: number
      meanTimeToFailover: number
      meanTimeToRecovery: number
    }
    exportedAt: number
  } {
    const statesObj: Record<string, ProviderState> = {}
    this.providerStates.forEach((state, provider) => {
      statesObj[provider] = { ...state }
    })

    return {
      config: this.config,
      states: statesObj,
      events: this.getFailoverEvents(),
      statistics: this.getFailoverStatistics(),
      exportedAt: Date.now()
    }
  }

  // Private helper methods

  private mergeWithDefaults(config?: Partial<FailoverConfig>): FailoverConfig {
    const defaults: FailoverConfig = {
      enabled: true,
      primaryProvider: 'anthropic',
      fallbackProviders: ['bedrock'],
      strategy: {
        mode: 'health_based',
        healthThreshold: 80, // 80%
        maxFailures: 3,
        backoffMultiplier: 2,
        maxBackoffTime: 5 * 60 * 1000, // 5 minutes
        recoveryThreshold: 3
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        resetTimeout: 60 * 1000 // 1 minute
      }
    }

    return {
      ...defaults,
      ...config,
      strategy: { ...defaults.strategy, ...config?.strategy },
      circuitBreaker: { ...defaults.circuitBreaker, ...config?.circuitBreaker }
    }
  }

  private initializeProviderStates(): void {
    const allProviders = [this.config.primaryProvider, ...this.config.fallbackProviders]
    
    allProviders.forEach(provider => {
      if (!this.providerStates.has(provider)) {
        this.providerStates.set(provider, {
          provider,
          isActive: provider === this.config.primaryProvider,
          consecutiveFailures: 0,
          lastFailureTime: 0,
          backoffUntil: 0,
          consecutiveSuccesses: 0,
          totalRequests: 0,
          successfulRequests: 0,
          circuitBreakerOpen: false,
          lastCircuitBreakerReset: Date.now()
        })
      }
    })
  }

  private getAvailableProviders(): string[] {
    const now = Date.now()
    const allProviders = [this.config.primaryProvider, ...this.config.fallbackProviders]
    
    // Filter providers based on availability and circuit breaker state
    const availableProviders = allProviders.filter(provider => {
      const state = this.providerStates.get(provider)
      if (!state) return false

      // Check circuit breaker
      if (state.circuitBreakerOpen) {
        // Check if reset timeout has elapsed
        if (now - state.lastCircuitBreakerReset > this.config.circuitBreaker.resetTimeout) {
          state.circuitBreakerOpen = false
          state.lastCircuitBreakerReset = now
          this.recordFailoverEvent({
            timestamp: now,
            type: 'circuit_breaker_closed',
            reason: 'timeout_reset'
          })
        } else {
          return false
        }
      }

      // Check backoff period
      return now >= state.backoffUntil
    })

    // Sort providers by preference and health
    return availableProviders.sort((a, b) => {
      // Primary provider has highest priority
      if (a === this.config.primaryProvider) return -1
      if (b === this.config.primaryProvider) return 1

      // Sort by health score
      const healthA = this.getProviderHealthScore(a)
      const healthB = this.getProviderHealthScore(b)
      
      return healthB - healthA
    })
  }

  private isProviderAvailable(provider: string): boolean {
    const state = this.providerStates.get(provider)
    if (!state) return false

    const now = Date.now()
    return !state.circuitBreakerOpen && now >= state.backoffUntil
  }

  private getProviderHealthScore(provider: string): number {
    const status = this.healthMonitor.getProviderStatus(provider)
    if (!status) return 0

    // Combine multiple factors into a health score
    const uptimeScore = status.uptime
    const latencyScore = Math.max(0, 100 - (status.averageLatency / 100)) // Penalize high latency
    const errorScore = Math.max(0, 100 - status.errorRate)

    return (uptimeScore * 0.5) + (latencyScore * 0.3) + (errorScore * 0.2)
  }

  private async executeRequest(
    provider: ModelProvider, 
    request: ModelRequest, 
    providerName: string
  ): Promise<ModelResponse> {
    const state = this.providerStates.get(providerName)
    if (state) {
      state.totalRequests++
    }

    return await provider.sendRequest(request)
  }

  private recordSuccess(provider: string): void {
    const state = this.providerStates.get(provider)
    if (!state) return

    state.successfulRequests++
    state.consecutiveSuccesses++
    state.consecutiveFailures = 0

    // Check for recovery if this provider was inactive
    if (!state.isActive && state.consecutiveSuccesses >= this.config.strategy.recoveryThreshold) {
      this.handleRecovery(provider)
    }
  }

  private recordFailure(provider: string, error: Error): void {
    const state = this.providerStates.get(provider)
    if (!state) return

    state.consecutiveFailures++
    state.consecutiveSuccesses = 0
    state.lastFailureTime = Date.now()

    // Calculate backoff time
    const backoffTime = Math.min(
      1000 * Math.pow(this.config.strategy.backoffMultiplier, state.consecutiveFailures - 1),
      this.config.strategy.maxBackoffTime
    )
    state.backoffUntil = Date.now() + backoffTime

    // Check if we should mark this provider as inactive
    if (state.consecutiveFailures >= this.config.strategy.maxFailures) {
      state.isActive = false
    }
  }

  private updateCircuitBreaker(provider: string): void {
    if (!this.config.circuitBreaker.enabled) return

    const state = this.providerStates.get(provider)
    if (!state) return

    if (state.consecutiveFailures >= this.config.circuitBreaker.failureThreshold) {
      state.circuitBreakerOpen = true
      state.lastCircuitBreakerReset = Date.now()
      
      this.recordFailoverEvent({
        timestamp: Date.now(),
        type: 'circuit_breaker_open',
        reason: `Consecutive failures: ${state.consecutiveFailures}`
      })
    }
  }

  private handleFailover(fromProvider: string, toProvider: string, reason: string): void {
    this.currentProvider = toProvider
    
    // Update provider states
    const fromState = this.providerStates.get(fromProvider)
    const toState = this.providerStates.get(toProvider)
    
    if (fromState) fromState.isActive = false
    if (toState) toState.isActive = true

    this.recordFailoverEvent({
      timestamp: Date.now(),
      type: 'failover',
      fromProvider,
      toProvider,
      reason,
      healthScore: this.getProviderHealthScore(toProvider)
    })

    console.info(`Failover: ${fromProvider} → ${toProvider} (${reason})`)
  }

  private handleRecovery(provider: string): void {
    const state = this.providerStates.get(provider)
    if (!state) return

    state.isActive = true
    state.consecutiveFailures = 0
    state.backoffUntil = 0

    // If this is the primary provider, switch back to it
    if (provider === this.config.primaryProvider && this.currentProvider !== provider) {
      const previousProvider = this.currentProvider
      this.currentProvider = provider
      
      this.recordFailoverEvent({
        timestamp: Date.now(),
        type: 'recovery',
        fromProvider: previousProvider,
        toProvider: provider,
        reason: 'primary_recovery',
        healthScore: this.getProviderHealthScore(provider)
      })

      console.info(`Recovery: ${previousProvider} → ${provider} (primary provider recovered)`)
    }
  }

  private shouldAttemptRecovery(provider: string): boolean {
    const state = this.providerStates.get(provider)
    if (!state || state.isActive) return false

    const healthScore = this.getProviderHealthScore(provider)
    return healthScore >= this.config.strategy.healthThreshold
  }

  private async attemptRecovery(provider: string): Promise<void> {
    try {
      const providerInstance = ModelProviderFactory.getProvider(provider as any)
      const healthCheck = await providerInstance.healthCheck()
      
      if (healthCheck.isHealthy) {
        this.handleRecovery(provider)
      }
    } catch (error) {
      console.warn(`Recovery attempt failed for ${provider}:`, error)
    }
  }

  private recordFailoverEvent(event: FailoverEvent): void {
    this.failoverEvents[this.eventIndex] = event
    this.eventIndex = (this.eventIndex + 1) % this.failoverEvents.length
  }
}

/**
 * Global failover manager instance
 */
let globalFailoverManager: FailoverManager | null = null

export function getGlobalFailoverManager(): FailoverManager | null {
  return globalFailoverManager
}

export function initializeGlobalFailoverManager(
  healthMonitor: ProviderHealthMonitor,
  config?: Partial<FailoverConfig>
): FailoverManager {
  globalFailoverManager = new FailoverManager(healthMonitor, config)
  return globalFailoverManager
}