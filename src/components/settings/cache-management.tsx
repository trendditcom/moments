'use client'

/**
 * Cache Management UI Component
 * Comprehensive interface for managing provider-agnostic caching system
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  getGlobalCacheManager, 
  CacheManager, 
  CacheManagerConfig,
  CacheAnalytics,
  CacheWarning
} from '@/lib/caching/cache-manager'
import { CacheStats } from '@/lib/caching/response-cache'
import { Trash2, Download, Upload, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface CacheManagementProps {
  onConfigChange?: (config: Partial<CacheManagerConfig>) => void
}

export function CacheManagement({ onConfigChange }: CacheManagementProps) {
  const [cacheManager] = useState<CacheManager>(() => getGlobalCacheManager())
  const [config, setConfig] = useState<CacheManagerConfig>()
  const [stats, setStats] = useState<CacheStats>()
  const [analytics, setAnalytics] = useState<CacheAnalytics>()
  const [warnings, setWarnings] = useState<CacheWarning[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'analytics' | 'manage'>('overview')

  // Load initial data
  useEffect(() => {
    refreshData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const currentStats = cacheManager.getStats()
      const currentAnalytics = cacheManager.getAnalytics()
      const currentWarnings = cacheManager.getWarnings()
      const currentRecommendations = cacheManager.getOptimizationRecommendations()
      
      setStats(currentStats)
      setAnalytics(currentAnalytics)
      setWarnings(currentWarnings)
      setRecommendations(currentRecommendations)
    } catch (error) {
      console.error('Failed to refresh cache data:', error)
    }
    setIsRefreshing(false)
  }, [cacheManager])

  const handleConfigUpdate = useCallback((updates: Partial<CacheManagerConfig>) => {
    cacheManager.updateConfig(updates)
    setConfig(prev => prev ? { ...prev, ...updates } : undefined)
    onConfigChange?.(updates)
    refreshData()
  }, [cacheManager, onConfigChange, refreshData])

  const handleClearCache = useCallback((provider?: 'anthropic' | 'bedrock') => {
    if (provider) {
      const cleared = cacheManager.clearProvider(provider)
      console.log(`Cleared ${cleared} entries for ${provider}`)
    } else {
      cacheManager.clearAll()
      console.log('Cleared all cache entries')
    }
    refreshData()
  }, [cacheManager, refreshData])

  const handleExport = useCallback(async () => {
    try {
      const filename = await cacheManager.exportToFile()
      console.log(`Cache exported to ${filename}`)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [cacheManager])

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const success = await cacheManager.importFromFile(file)
      if (success) {
        console.log('Cache imported successfully')
        refreshData()
      } else {
        console.error('Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
    }
    
    // Reset file input
    event.target.value = ''
  }, [cacheManager, refreshData])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
    return `${(ms / 3600000).toFixed(1)}h`
  }

  const getTrendIcon = (value: number, threshold: number) => {
    if (value > threshold) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (value < threshold * 0.8) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-yellow-500" />
  }

  const getWarningBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive'
      case 'warning': return 'default'
      default: return 'secondary'
    }
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading cache data...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Cache Management</h2>
          <p className="text-muted-foreground">Manage provider-agnostic response caching</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-orange-900">Cache Warnings</h3>
          </div>
          <div className="space-y-2">
            {warnings.slice(0, 3).map((warning, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-orange-800">{warning.message}</span>
                <Badge variant={getWarningBadgeVariant(warning.severity)}>
                  {warning.severity}
                </Badge>
              </div>
            ))}
            {warnings.length > 3 && (
              <p className="text-sm text-orange-600">
                +{warnings.length - 3} more warnings
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'config', label: 'Configuration' },
          { id: 'analytics', label: 'Analytics' },
          { id: 'manage', label: 'Management' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Cache Statistics */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Cache Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Entries</span>
                <span className="font-medium">{stats.totalEntries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hit Rate</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(stats.hitRate, 0.5)}
                  <span className="font-medium">{formatPercentage(stats.hitRate)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Memory Usage</span>
                <span className="font-medium">{formatBytes(stats.memoryUsage)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Hits</span>
                <span className="font-medium">{stats.totalHits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Misses</span>
                <span className="font-medium">{stats.totalMisses}</span>
              </div>
            </div>
          </Card>

          {/* Provider Breakdown */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Provider Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Anthropic</span>
                  <span className="text-sm">{stats.entriesByProvider.anthropic || 0} entries</span>
                </div>
                <Progress 
                  value={stats.totalEntries > 0 ? (stats.entriesByProvider.anthropic || 0) / stats.totalEntries * 100 : 0} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {stats.hitsByProvider.anthropic || 0} hits
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Bedrock</span>
                  <span className="text-sm">{stats.entriesByProvider.bedrock || 0} entries</span>
                </div>
                <Progress 
                  value={stats.totalEntries > 0 ? (stats.entriesByProvider.bedrock || 0) / stats.totalEntries * 100 : 0} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {stats.hitsByProvider.bedrock || 0} hits
                </div>
              </div>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Performance</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Entry Size</span>
                <span className="font-medium">{formatBytes(stats.averageEntrySize)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cleanups</span>
                <span className="font-medium">{stats.cleanupCount}</span>
              </div>
              {stats.lastCleanup && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Cleanup</span>
                  <span className="font-medium">
                    {formatDuration(Date.now() - stats.lastCleanup)} ago
                  </span>
                </div>
              )}
              {analytics?.providerPerformance && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-1">Estimated Savings</div>
                  <div className="text-sm font-medium">
                    ${(analytics.providerPerformance.anthropic.costSavings + 
                       analytics.providerPerformance.bedrock.costSavings).toFixed(4)}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Global Cache Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cache-enabled">Enable Caching</Label>
                <Switch
                  id="cache-enabled"
                  checked={config?.enabled ?? true}
                  onCheckedChange={(enabled) => handleConfigUpdate({ enabled })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analytics-enabled">Enable Analytics</Label>
                <Switch
                  id="analytics-enabled"
                  checked={config?.global?.analyticsEnabled ?? true}
                  onCheckedChange={(analyticsEnabled) => 
                    handleConfigUpdate({ 
                      global: { ...config?.global, analyticsEnabled } 
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-memory">Max Total Memory (MB)</Label>
                <Input
                  id="max-memory"
                  type="number"
                  value={config?.global?.maxTotalMemory ? Math.round(config.global.maxTotalMemory / (1024 * 1024)) : 100}
                  onChange={(e) => {
                    const maxTotalMemory = parseInt(e.target.value) * 1024 * 1024
                    handleConfigUpdate({
                      global: { ...config?.global, maxTotalMemory }
                    })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="export-schedule">Export Schedule</Label>
                <Select
                  value={config?.global?.exportSchedule || 'weekly'}
                  onValueChange={(exportSchedule: 'daily' | 'weekly' | 'never') =>
                    handleConfigUpdate({
                      global: { ...config?.global, exportSchedule }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Anthropic Configuration */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Anthropic Cache Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="anthropic-enabled">Enable Anthropic Caching</Label>
                  <Switch
                    id="anthropic-enabled"
                    checked={config?.providers?.anthropic?.enabled ?? true}
                    onCheckedChange={(enabled) =>
                      handleConfigUpdate({
                        providers: {
                          ...config?.providers,
                          anthropic: { ...config?.providers?.anthropic, enabled }
                        }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anthropic-ttl">TTL (hours)</Label>
                  <Input
                    id="anthropic-ttl"
                    type="number"
                    value={config?.providers?.anthropic?.defaultTtl ? config.providers.anthropic.defaultTtl / (60 * 60 * 1000) : 2}
                    onChange={(e) => {
                      const defaultTtl = parseFloat(e.target.value) * 60 * 60 * 1000
                      handleConfigUpdate({
                        providers: {
                          ...config?.providers,
                          anthropic: { ...config?.providers?.anthropic, defaultTtl }
                        }
                      })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anthropic-max-entries">Max Entries</Label>
                  <Input
                    id="anthropic-max-entries"
                    type="number"
                    value={config?.providers?.anthropic?.maxEntries || 500}
                    onChange={(e) => {
                      const maxEntries = parseInt(e.target.value)
                      handleConfigUpdate({
                        providers: {
                          ...config?.providers,
                          anthropic: { ...config?.providers?.anthropic, maxEntries }
                        }
                      })
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Bedrock Configuration */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Bedrock Cache Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrock-enabled">Enable Bedrock Caching</Label>
                  <Switch
                    id="bedrock-enabled"
                    checked={config?.providers?.bedrock?.enabled ?? true}
                    onCheckedChange={(enabled) =>
                      handleConfigUpdate({
                        providers: {
                          ...config?.providers,
                          bedrock: { ...config?.providers?.bedrock, enabled }
                        }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrock-ttl">TTL (hours)</Label>
                  <Input
                    id="bedrock-ttl"
                    type="number"
                    value={config?.providers?.bedrock?.defaultTtl ? config.providers.bedrock.defaultTtl / (60 * 60 * 1000) : 4}
                    onChange={(e) => {
                      const defaultTtl = parseFloat(e.target.value) * 60 * 60 * 1000
                      handleConfigUpdate({
                        providers: {
                          ...config?.providers,
                          bedrock: { ...config?.providers?.bedrock, defaultTtl }
                        }
                      })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrock-max-entries">Max Entries</Label>
                  <Input
                    id="bedrock-max-entries"
                    type="number"
                    value={config?.providers?.bedrock?.maxEntries || 500}
                    onChange={(e) => {
                      const maxEntries = parseInt(e.target.value)
                      handleConfigUpdate({
                        providers: {
                          ...config?.providers,
                          bedrock: { ...config?.providers?.bedrock, maxEntries }
                        }
                      })
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Time Series Chart Placeholder */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Cache Performance Over Time</h3>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Time series chart would go here</p>
                <p className="text-sm text-muted-foreground">
                  Hit Rate: {formatPercentage(analytics.overallHitRate)} | 
                  Total Requests: {analytics.totalRequests}
                </p>
              </div>
            </div>
          </Card>

          {/* Provider Performance Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Anthropic Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Requests</span>
                  <span className="font-medium">{analytics.providerPerformance.anthropic.requests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hit Rate</span>
                  <span className="font-medium">{formatPercentage(analytics.providerPerformance.anthropic.hitRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cost Savings</span>
                  <span className="font-medium">${analytics.providerPerformance.anthropic.costSavings.toFixed(4)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Bedrock Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Requests</span>
                  <span className="font-medium">{analytics.providerPerformance.bedrock.requests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hit Rate</span>
                  <span className="font-medium">{formatPercentage(analytics.providerPerformance.bedrock.hitRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cost Savings</span>
                  <span className="font-medium">${analytics.providerPerformance.bedrock.costSavings.toFixed(4)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Optimization Recommendations */}
          {recommendations.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Optimization Recommendations</h3>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <p className="text-sm"><strong>Implementation:</strong> {rec.implementation}</p>
                    <p className="text-sm text-green-600"><strong>Impact:</strong> {rec.estimatedImpact}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Management Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Cache Operations */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Cache Operations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => handleClearCache('anthropic')}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Anthropic Cache
              </Button>
              <Button
                variant="outline"
                onClick={() => handleClearCache('bedrock')}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Bedrock Cache
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleClearCache()}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Cache
              </Button>
            </div>
          </Card>

          {/* Import/Export */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Import/Export</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Button
                  onClick={handleExport}
                  className="w-full flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Cache Data
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Download cache data, analytics, and configuration as JSON
                </p>
              </div>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                  id="cache-import"
                />
                <Label htmlFor="cache-import" asChild>
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Import Cache Data
                  </Button>
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  Restore cache from previously exported JSON file
                </p>
              </div>
            </div>
          </Card>

          {/* Cache Entries Preview */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Recent Cache Entries</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.totalEntries > 0 ? (
                <div className="text-sm text-muted-foreground">
                  Cache contains {stats.totalEntries} entries across both providers.
                  Use export functionality to view detailed cache contents.
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No cache entries found. Cache responses will appear here once providers start caching.
                </div>
              )}
            </div>
          </Card>

          {/* System Information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium mb-1">Cache Version</div>
                <div className="text-muted-foreground">1.0</div>
              </div>
              <div>
                <div className="font-medium mb-1">Storage Type</div>
                <div className="text-muted-foreground">
                  {config?.providers?.anthropic?.persistToDisk ? 'Persistent' : 'Memory Only'}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Compression</div>
                <div className="text-muted-foreground">
                  {config?.providers?.anthropic?.compressionEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Auto Export</div>
                <div className="text-muted-foreground">
                  {config?.global?.exportSchedule || 'Weekly'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}