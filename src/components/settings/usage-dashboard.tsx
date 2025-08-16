'use client'

/**
 * Usage Dashboard Component
 * Comprehensive cost tracking and optimization dashboard for multi-provider usage
 */

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  getGlobalUsageTracker,
  UsageStats,
  ProviderUsageSummary,
  BudgetAlert,
  OptimizationSuggestion
} from '@/lib/cost-tracking/usage-tracker'
import { 
  getGlobalCostCalculator,
  CostCalculator,
  OptimizationReport
} from '@/lib/cost-tracking/cost-calculator'
import { ProviderType } from '@/types/model-provider'

interface DashboardState {
  usageData: Record<ProviderType, ProviderUsageSummary>
  budgetAlerts: BudgetAlert[]
  optimizationReport: OptimizationReport
  selectedProvider: ProviderType | 'all'
  timeRange: '24h' | '7d' | '30d' | '90d'
  budgetLimits: Record<string, number>
  isLoading: boolean
}

export function UsageDashboard() {
  const [state, setState] = useState<DashboardState>({
    usageData: {} as Record<ProviderType, ProviderUsageSummary>,
    budgetAlerts: [],
    optimizationReport: {} as OptimizationReport,
    selectedProvider: 'all',
    timeRange: '7d',
    budgetLimits: { daily: 10, weekly: 50, monthly: 200 },
    isLoading: true
  })

  const [showOptimizations, setShowOptimizations] = useState(false)
  const [newBudget, setNewBudget] = useState({ period: 'monthly', amount: 200 })

  // Load usage data
  useEffect(() => {
    loadUsageData()
  }, [state.timeRange])

  const loadUsageData = async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const usageTracker = getGlobalUsageTracker()
      const costCalculator = getGlobalCostCalculator()

      // Set budget limits
      Object.entries(state.budgetLimits).forEach(([period, amount]) => {
        usageTracker.setBudgetLimit(period as any, amount)
      })

      // Get time range
      const timeRange = getTimeRange(state.timeRange)

      // Load provider usage data
      const anthropicUsage = usageTracker.getProviderUsage('anthropic', timeRange)
      const bedrockUsage = usageTracker.getProviderUsage('bedrock', timeRange)

      // Get budget status
      const budgetStatus = usageTracker.getBudgetStatus()

      // Generate optimization report
      const optimizationReport = costCalculator.generateOptimizationReport()

      setState(prev => ({
        ...prev,
        usageData: {
          anthropic: anthropicUsage,
          bedrock: bedrockUsage
        },
        budgetAlerts: budgetStatus.alerts,
        optimizationReport,
        isLoading: false
      }))
    } catch (error) {
      console.error('Failed to load usage data:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const getTimeRange = (range: string) => {
    const end = new Date()
    const start = new Date()
    
    switch (range) {
      case '24h':
        start.setDate(start.getDate() - 1)
        break
      case '7d':
        start.setDate(start.getDate() - 7)
        break
      case '30d':
        start.setDate(start.getDate() - 30)
        break
      case '90d':
        start.setDate(start.getDate() - 90)
        break
    }
    
    return { start, end }
  }

  const updateBudgetLimit = () => {
    const usageTracker = getGlobalUsageTracker()
    usageTracker.setBudgetLimit(newBudget.period as any, newBudget.amount)
    
    setState(prev => ({
      ...prev,
      budgetLimits: {
        ...prev.budgetLimits,
        [newBudget.period]: newBudget.amount
      }
    }))
    
    loadUsageData() // Refresh data
  }

  const exportData = () => {
    const costCalculator = getGlobalCostCalculator()
    const data = costCalculator.exportCostAnalysis()
    
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage-analysis-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTotalStats = (): UsageStats => {
    const providers = Object.values(state.usageData)
    
    return {
      totalRequests: providers.reduce((sum, p) => sum + p.stats.totalRequests, 0),
      totalTokens: providers.reduce((sum, p) => sum + p.stats.totalTokens, 0),
      totalCost: providers.reduce((sum, p) => sum + p.stats.totalCost, 0),
      averageLatency: providers.length > 0 ? 
        providers.reduce((sum, p) => sum + p.stats.averageLatency, 0) / providers.length : 0,
      successRate: providers.length > 0 ?
        providers.reduce((sum, p) => sum + p.stats.successRate, 0) / providers.length : 0,
      requestsPerHour: providers.reduce((sum, p) => sum + p.stats.requestsPerHour, 0),
      costPerRequest: providers.length > 0 ?
        providers.reduce((sum, p) => sum + p.stats.costPerRequest, 0) / providers.length : 0,
      tokensPerRequest: providers.length > 0 ?
        providers.reduce((sum, p) => sum + p.stats.tokensPerRequest, 0) / providers.length : 0
    }
  }

  if (state.isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const totalStats = getTotalStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Usage Dashboard</h2>
        <div className="flex gap-2">
          <select
            value={state.timeRange}
            onChange={(e) => setState(prev => ({ ...prev, timeRange: e.target.value as any }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={exportData} variant="outline">
            Export Data
          </Button>
        </div>
      </div>

      {/* Budget Alerts */}
      {state.budgetAlerts.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3 text-red-600">Budget Alerts</h3>
          <div className="space-y-2">
            {state.budgetAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-md border ${
                  alert.triggered ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{alert.message}</span>
                  <Badge variant={alert.triggered ? "destructive" : "secondary"}>
                    {alert.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={Math.min(alert.percentage, 100)} 
                  className="mt-2"
                />
                {alert.recommendations.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Recommendations:</strong>
                    <ul className="list-disc list-inside">
                      {alert.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
          <p className="text-2xl font-bold">{totalStats.totalRequests.toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            {totalStats.requestsPerHour.toFixed(1)}/hour
          </p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Cost</h3>
          <p className="text-2xl font-bold">${totalStats.totalCost.toFixed(2)}</p>
          <p className="text-xs text-gray-500">
            ${totalStats.costPerRequest.toFixed(4)}/request
          </p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Tokens</h3>
          <p className="text-2xl font-bold">{totalStats.totalTokens.toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            {totalStats.tokensPerRequest.toFixed(0)}/request
          </p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
          <p className="text-2xl font-bold">{(totalStats.successRate * 100).toFixed(1)}%</p>
          <p className="text-xs text-gray-500">
            Avg latency: {totalStats.averageLatency.toFixed(0)}ms
          </p>
        </Card>
      </div>

      {/* Provider Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Provider Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(state.usageData).map(([provider, data]) => (
            <div key={provider} className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium capitalize">{provider}</h4>
                <Badge variant="outline">
                  ${data.stats.totalCost.toFixed(2)}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Requests:</span>
                  <span>{data.stats.totalRequests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tokens:</span>
                  <span>{data.stats.totalTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span>{(data.stats.successRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Latency:</span>
                  <span>{data.stats.averageLatency.toFixed(0)}ms</span>
                </div>
              </div>

              {/* Model Breakdown */}
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Model Usage</h5>
                {Object.entries(data.modelBreakdown).map(([model, stats]) => (
                  <div key={model} className="flex justify-between text-xs py-1">
                    <span className="truncate max-w-[150px]" title={model}>
                      {model.split('-').slice(-2).join('-')}
                    </span>
                    <span>${stats.totalCost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Budget Management */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Budget Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Current Budgets</h4>
            <div className="space-y-2">
              {Object.entries(state.budgetLimits).map(([period, limit]) => {
                const spent = state.optimizationReport.currentCosts?.[period as keyof typeof state.optimizationReport.currentCosts] || 0
                const percentage = (spent / limit) * 100
                
                return (
                  <div key={period} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{period}:</span>
                      <span>${spent.toFixed(2)} / ${limit.toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} />
                  </div>
                )
              })}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Set Budget Limit</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="budget-period">Period</Label>
                <select
                  id="budget-period"
                  value={newBudget.period}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, period: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="budget-amount">Amount ($)</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <Button onClick={updateBudgetLimit} className="w-full">
                Update Budget
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Optimization Suggestions */}
      {state.optimizationReport.recommendations && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Optimization Opportunities</h3>
            <Button 
              variant="outline" 
              onClick={() => setShowOptimizations(!showOptimizations)}
            >
              {showOptimizations ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          {state.optimizationReport.potentialSavings && (
            <div className="mb-4 p-4 bg-green-50 rounded-md">
              <h4 className="font-medium text-green-800">Potential Monthly Savings</h4>
              <p className="text-2xl font-bold text-green-600">
                ${state.optimizationReport.potentialSavings.totalPotential.toFixed(2)}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-gray-600">Model optimization:</span>
                  <span className="font-medium"> ${state.optimizationReport.potentialSavings.modelOptimization.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Provider switching:</span>
                  <span className="font-medium"> ${state.optimizationReport.potentialSavings.providerSwitching.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Batching:</span>
                  <span className="font-medium"> ${state.optimizationReport.potentialSavings.batchingImprovements.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Caching:</span>
                  <span className="font-medium"> ${state.optimizationReport.potentialSavings.cachingImprovements.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {showOptimizations && state.optimizationReport.recommendations && (
            <div className="space-y-3">
              {state.optimizationReport.recommendations.map((suggestion: OptimizationSuggestion, idx: number) => (
                <div key={idx} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium">{suggestion.title}</h5>
                    <Badge 
                      variant={
                        suggestion.priority === 'high' ? 'destructive' :
                        suggestion.priority === 'medium' ? 'secondary' : 'outline'
                      }
                    >
                      {suggestion.priority} priority
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Potential savings:</span>
                      <p className="font-medium">${suggestion.potentialSavings.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost reduction:</span>
                      <p className="font-medium">{suggestion.impact.costReduction}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Implementation:</span>
                      <p className="font-medium">Complexity +{suggestion.impact.complexityIncrease}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <strong>Implementation:</strong> {suggestion.implementation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Cost Trends */}
      {state.optimizationReport.trends && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Trends</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">Cost Trend</h4>
              <p className={`text-xl font-bold ${
                state.optimizationReport.trends.costTrend > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {state.optimizationReport.trends.costTrend > 0 ? '+' : ''}
                {state.optimizationReport.trends.costTrend.toFixed(1)}%
              </p>
            </div>
            
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">Usage Trend</h4>
              <p className={`text-xl font-bold ${
                state.optimizationReport.trends.usageTrend > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {state.optimizationReport.trends.usageTrend > 0 ? '+' : ''}
                {state.optimizationReport.trends.usageTrend.toFixed(1)}%
              </p>
            </div>
            
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">Efficiency Trend</h4>
              <p className={`text-xl font-bold ${
                state.optimizationReport.trends.efficiencyTrend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {state.optimizationReport.trends.efficiencyTrend > 0 ? '+' : ''}
                {state.optimizationReport.trends.efficiencyTrend.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}