'use client'

/**
 * Provider Status Component
 * Real-time health monitoring and failover management for AI model providers
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { 
  getGlobalHealthMonitor,
  initializeGlobalHealthMonitor,
  ProviderStatus as ProviderStatusType,
  HealthMetrics,
  AlertConfig
} from '@/lib/monitoring/provider-health'
import { 
  getGlobalFailoverManager,
  initializeGlobalFailoverManager,
  ProviderState,
  FailoverEvent,
  FailoverConfig
} from '@/lib/monitoring/failover-manager'

interface StatusDashboardState {
  providerStatuses: Record<string, ProviderStatusType>
  providerStates: Record<string, ProviderState>
  failoverEvents: FailoverEvent[]
  currentProvider: string
  monitoringEnabled: boolean
  failoverEnabled: boolean
  alertConfig: AlertConfig
  selectedTimeRange: '1h' | '6h' | '24h' | '7d'
  refreshInterval: number
  isLoading: boolean
  lastUpdate: number
}

export function ProviderStatusDashboard() {
  const [state, setState] = useState<StatusDashboardState>({
    providerStatuses: {},
    providerStates: {},
    failoverEvents: [],
    currentProvider: 'anthropic',
    monitoringEnabled: false,
    failoverEnabled: false,
    alertConfig: {
      enabled: true,
      errorRateThreshold: 0.1,
      latencyThreshold: 5000,
      consecutiveFailures: 3,
      cooldownPeriod: 30 * 60 * 1000,
      emailEnabled: false
    },
    selectedTimeRange: '24h',
    refreshInterval: 30000,
    isLoading: true,
    lastUpdate: 0
  })

  const [testingProvider, setTestingProvider] = useState<string | null>(null)

  /**
   * Initialize monitoring systems
   */
  const initializeMonitoring = useCallback(() => {
    try {
      // Initialize health monitor
      const healthMonitor = initializeGlobalHealthMonitor({
        checkInterval: state.refreshInterval,
        providers: ['anthropic', 'bedrock'],
        alerts: state.alertConfig
      })

      // Initialize failover manager
      const failoverManager = initializeGlobalFailoverManager(healthMonitor, {
        enabled: state.failoverEnabled,
        primaryProvider: 'anthropic',
        fallbackProviders: ['bedrock']
      })

      return { healthMonitor, failoverManager }
    } catch (error) {
      console.error('Failed to initialize monitoring:', error)
      return null
    }
  }, [state.refreshInterval, state.alertConfig, state.failoverEnabled])

  /**
   * Load current status data
   */
  const loadStatusData = useCallback(async () => {
    try {
      const healthMonitor = getGlobalHealthMonitor()
      const failoverManager = getGlobalFailoverManager()

      if (!healthMonitor || !failoverManager) {
        console.warn('Monitoring systems not initialized')
        return
      }

      // Get provider statuses
      const statuses = healthMonitor.getProviderStatuses()
      const providerStatusObj: Record<string, ProviderStatusType> = {}
      statuses.forEach((status, provider) => {
        providerStatusObj[provider] = status
      })

      // Get provider states
      const states = failoverManager.getProviderStates()
      const providerStateObj: Record<string, ProviderState> = {}
      states.forEach((state, provider) => {
        providerStateObj[provider] = state
      })

      // Get failover events
      const events = failoverManager.getFailoverEvents()
      const currentProvider = failoverManager.getCurrentProvider()

      setState(prev => ({
        ...prev,
        providerStatuses: providerStatusObj,
        providerStates: providerStateObj,
        failoverEvents: events.slice(-50), // Keep last 50 events
        currentProvider,
        isLoading: false,
        lastUpdate: Date.now()
      }))
    } catch (error) {
      console.error('Failed to load status data:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  /**
   * Toggle health monitoring
   */
  const toggleMonitoring = async (enabled: boolean) => {
    try {
      const healthMonitor = getGlobalHealthMonitor()
      
      if (enabled) {
        await healthMonitor.start()
      } else {
        healthMonitor.stop()
      }

      setState(prev => ({ ...prev, monitoringEnabled: enabled }))
    } catch (error) {
      console.error('Failed to toggle monitoring:', error)
    }
  }

  /**
   * Manual provider health check
   */
  const testProviderHealth = async (provider: string) => {
    setTestingProvider(provider)
    
    try {
      const healthMonitor = getGlobalHealthMonitor()
      await healthMonitor.checkProviderHealth(provider)
      await loadStatusData()
    } catch (error) {
      console.error(`Failed to test ${provider}:`, error)
    } finally {
      setTestingProvider(null)
    }
  }

  /**
   * Manual failover
   */
  const triggerManualFailover = async (targetProvider: string) => {
    try {
      const failoverManager = getGlobalFailoverManager()
      if (failoverManager) {
        const success = await failoverManager.manualFailover(targetProvider)
        if (success) {
          await loadStatusData()
        }
      }
    } catch (error) {
      console.error('Manual failover failed:', error)
    }
  }

  /**
   * Update alert configuration
   */
  const updateAlerts = (newConfig: Partial<AlertConfig>) => {
    const updatedConfig = { ...state.alertConfig, ...newConfig }
    
    setState(prev => ({ ...prev, alertConfig: updatedConfig }))
    
    const healthMonitor = getGlobalHealthMonitor()
    healthMonitor.updateAlertConfig(updatedConfig)
  }

  /**
   * Get status badge color
   */
  const getStatusBadge = (isHealthy: boolean, consecutiveFailures: number = 0) => {
    if (!isHealthy) return 'destructive'
    if (consecutiveFailures > 0) return 'secondary'
    return 'default'
  }

  /**
   * Get uptime color
   */
  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return 'text-green-600'
    if (uptime >= 95) return 'text-yellow-600'
    return 'text-red-600'
  }

  /**
   * Format time duration
   */
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  /**
   * Get time range in milliseconds
   */
  const getTimeRangeMs = (range: string) => {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }
    return ranges[range as keyof typeof ranges] || ranges['24h']
  }

  // Initialize monitoring on component mount
  useEffect(() => {
    const systems = initializeMonitoring()
    if (systems) {
      loadStatusData()
      
      // Set up auto-refresh
      const interval = setInterval(loadStatusData, state.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [initializeMonitoring, loadStatusData, state.refreshInterval])

  // Listen for provider alerts
  useEffect(() => {
    const handleAlert = (event: CustomEvent) => {
      console.log('Provider alert received:', event.detail)
      loadStatusData() // Refresh data when alert is received
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('providerAlert', handleAlert as EventListener)
      return () => window.removeEventListener('providerAlert', handleAlert as EventListener)
    }
  }, [loadStatusData])

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Provider Health Monitoring</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="monitoring-toggle">Monitoring</Label>
              <Switch
                id="monitoring-toggle"
                checked={state.monitoringEnabled}
                onCheckedChange={toggleMonitoring}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="failover-toggle">Auto Failover</Label>
              <Switch
                id="failover-toggle"
                checked={state.failoverEnabled}
                onCheckedChange={(enabled) => setState(prev => ({ ...prev, failoverEnabled: enabled }))}
              />
            </div>
            
            <Button onClick={loadStatusData} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="time-range">Time Range</Label>
            <Select
              value={state.selectedTimeRange}
              onValueChange={(value: any) => setState(prev => ({ ...prev, selectedTimeRange: value }))}
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="refresh-interval">Refresh Interval (ms)</Label>
            <Input
              id="refresh-interval"
              type="number"
              value={state.refreshInterval}
              onChange={(e) => setState(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) || 30000 }))}
              min="5000"
              max="300000"
              step="5000"
            />
          </div>
          
          <div className="flex items-end">
            <Badge variant={state.monitoringEnabled ? 'default' : 'secondary'}>
              {state.monitoringEnabled ? 'Monitoring Active' : 'Monitoring Stopped'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(state.providerStatuses).map(([provider, status]) => {
          const providerState = state.providerStates[provider]
          const isCurrentProvider = provider === state.currentProvider
          
          return (
            <Card key={provider} className={`p-6 ${isCurrentProvider ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold capitalize">{provider}</h3>
                  <Badge variant={getStatusBadge(status.currentHealth.isHealthy, status.consecutiveFailures)}>
                    {status.currentHealth.isHealthy ? 'Healthy' : 'Unhealthy'}
                  </Badge>
                  {isCurrentProvider && (
                    <Badge variant="outline">Current</Badge>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProviderHealth(provider)}
                    disabled={testingProvider === provider}
                  >
                    {testingProvider === provider ? 'Testing...' : 'Test'}
                  </Button>
                  
                  {!isCurrentProvider && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerManualFailover(provider)}
                    >
                      Switch To
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Uptime</div>
                  <div className={`text-lg font-semibold ${getUptimeColor(status.uptime)}`}>
                    {status.uptime.toFixed(1)}%
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Avg Latency</div>
                  <div className="text-lg font-semibold">
                    {status.averageLatency.toFixed(0)}ms
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Error Rate</div>
                  <div className="text-lg font-semibold">
                    {status.errorRate.toFixed(1)}%
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Consecutive Failures</div>
                  <div className="text-lg font-semibold">
                    {status.consecutiveFailures}
                  </div>
                </div>
              </div>

              {providerState && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{((providerState.successfulRequests / Math.max(providerState.totalRequests, 1)) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(providerState.successfulRequests / Math.max(providerState.totalRequests, 1)) * 100} 
                    className="h-2"
                  />
                  
                  {providerState.circuitBreakerOpen && (
                    <Badge variant="destructive" className="w-full justify-center">
                      Circuit Breaker Open
                    </Badge>
                  )}
                  
                  {providerState.backoffUntil > Date.now() && (
                    <div className="text-sm text-yellow-600">
                      Backoff until: {formatDuration(providerState.backoffUntil - Date.now())}
                    </div>
                  )}
                </div>
              )}

              {status.currentHealth.error && (
                <div className="mt-4 p-3 bg-red-50 rounded-md">
                  <div className="text-sm text-red-800">
                    <strong>Last Error:</strong> {status.currentHealth.error}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Recent Failover Events */}
      {state.failoverEvents.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Failover Events</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {state.failoverEvents.slice(-10).reverse().map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <Badge variant={
                    event.type === 'failover' ? 'destructive' :
                    event.type === 'recovery' ? 'default' :
                    'secondary'
                  }>
                    {event.type.replace('_', ' ')}
                  </Badge>
                  
                  {event.fromProvider && event.toProvider && (
                    <span className="text-sm">
                      {event.fromProvider} → {event.toProvider}
                    </span>
                  )}
                  
                  <span className="text-sm text-gray-600">{event.reason}</span>
                </div>
                
                <div className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Alert Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Alert Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="error-threshold">Error Rate Threshold (%)</Label>
            <Input
              id="error-threshold"
              type="number"
              value={state.alertConfig.errorRateThreshold * 100}
              onChange={(e) => updateAlerts({ 
                errorRateThreshold: parseFloat(e.target.value) / 100 
              })}
              min="0"
              max="100"
              step="1"
            />
          </div>
          
          <div>
            <Label htmlFor="latency-threshold">Latency Threshold (ms)</Label>
            <Input
              id="latency-threshold"
              type="number"
              value={state.alertConfig.latencyThreshold}
              onChange={(e) => updateAlerts({ 
                latencyThreshold: parseInt(e.target.value) || 5000 
              })}
              min="100"
              max="60000"
              step="100"
            />
          </div>
          
          <div>
            <Label htmlFor="consecutive-failures">Consecutive Failures</Label>
            <Input
              id="consecutive-failures"
              type="number"
              value={state.alertConfig.consecutiveFailures}
              onChange={(e) => updateAlerts({ 
                consecutiveFailures: parseInt(e.target.value) || 3 
              })}
              min="1"
              max="10"
              step="1"
            />
          </div>
          
          <div>
            <Label htmlFor="cooldown-period">Cooldown Period (minutes)</Label>
            <Input
              id="cooldown-period"
              type="number"
              value={state.alertConfig.cooldownPeriod / (60 * 1000)}
              onChange={(e) => updateAlerts({ 
                cooldownPeriod: (parseInt(e.target.value) || 30) * 60 * 1000 
              })}
              min="1"
              max="1440"
              step="1"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={state.alertConfig.enabled}
              onCheckedChange={(enabled) => updateAlerts({ enabled })}
            />
            <Label>Enable Alerts</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={state.alertConfig.emailEnabled || false}
              onCheckedChange={(emailEnabled) => updateAlerts({ emailEnabled })}
            />
            <Label>Email Notifications</Label>
          </div>
        </div>
      </Card>

      {/* Status Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {state.lastUpdate > 0 ? new Date(state.lastUpdate).toLocaleString() : 'Never'}
      </div>
    </div>
  )
}