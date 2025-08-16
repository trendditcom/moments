/**
 * Usage Tracker for Provider and Model-Specific Cost Tracking
 * Tracks token usage, costs, and performance metrics across different providers and models
 */

import { ProviderType, LogicalModelName } from '@/types/model-provider'

export interface UsageRecord {
  id: string
  timestamp: string
  provider: ProviderType
  model: string
  logicalModel?: LogicalModelName
  operation: 'analysis' | 'classification' | 'correlation' | 'generation' | 'other'
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  cost: number
  latency: number
  success: boolean
  error?: string
  context?: {
    agentType?: string
    batchSize?: number
    contentType?: string
    userRequest?: string
  }
}

export interface UsageStats {
  totalRequests: number
  totalTokens: number
  totalCost: number
  averageLatency: number
  successRate: number
  requestsPerHour: number
  costPerRequest: number
  tokensPerRequest: number
}

export interface ProviderUsageSummary {
  provider: ProviderType
  stats: UsageStats
  modelBreakdown: Record<string, UsageStats>
  operationBreakdown: Record<string, UsageStats>
  timeSeriesData: Array<{
    timestamp: string
    requests: number
    tokens: number
    cost: number
  }>
}

export interface BudgetAlert {
  id: string
  type: 'daily' | 'monthly' | 'weekly'
  threshold: number
  currentUsage: number
  percentage: number
  triggered: boolean
  message: string
  recommendations: string[]
}

export interface OptimizationSuggestion {
  type: 'model_recommendation' | 'batch_optimization' | 'caching_improvement' | 'cost_reduction'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  potentialSavings: number
  implementation: string
  impact: {
    costReduction: number
    performanceChange: number
    complexityIncrease: number
  }
}

/**
 * Usage Tracker class for comprehensive cost and usage monitoring
 */
export class UsageTracker {
  private records: UsageRecord[] = []
  private budgetLimits: Record<string, number> = {}
  private persistenceKey = 'moments-usage-tracking'
  private maxRecords = 10000 // Keep last 10k records
  
  constructor() {
    this.loadFromStorage()
    this.setupPeriodicSave()
  }

  /**
   * Track a new usage record
   */
  trackUsage(record: Omit<UsageRecord, 'id' | 'timestamp'>): string {
    const usageRecord: UsageRecord = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...record
    }

    this.records.push(usageRecord)
    this.trimRecords()
    this.saveToStorage()

    // Check for budget alerts
    this.checkBudgetAlerts()

    return usageRecord.id
  }

  /**
   * Get usage statistics for a specific provider
   */
  getProviderUsage(
    provider: ProviderType,
    timeRange?: { start: Date; end: Date }
  ): ProviderUsageSummary {
    const filteredRecords = this.filterRecords(provider, timeRange)
    
    const stats = this.calculateStats(filteredRecords)
    const modelBreakdown = this.calculateModelBreakdown(filteredRecords)
    const operationBreakdown = this.calculateOperationBreakdown(filteredRecords)
    const timeSeriesData = this.generateTimeSeries(filteredRecords)

    return {
      provider,
      stats,
      modelBreakdown,
      operationBreakdown,
      timeSeriesData
    }
  }

  /**
   * Compare usage between providers
   */
  compareProviders(
    timeRange?: { start: Date; end: Date }
  ): Record<ProviderType, ProviderUsageSummary> {
    const comparison: Record<ProviderType, ProviderUsageSummary> = {} as any

    const providers: ProviderType[] = ['anthropic', 'bedrock']
    
    for (const provider of providers) {
      comparison[provider] = this.getProviderUsage(provider, timeRange)
    }

    return comparison
  }

  /**
   * Get current budget status and alerts
   */
  getBudgetStatus(): {
    alerts: BudgetAlert[]
    currentSpend: Record<string, number>
    remainingBudget: Record<string, number>
  } {
    const alerts = this.generateBudgetAlerts()
    const currentSpend = this.getCurrentSpend()
    const remainingBudget: Record<string, number> = {}

    for (const [period, limit] of Object.entries(this.budgetLimits)) {
      remainingBudget[period] = Math.max(0, limit - (currentSpend[period] || 0))
    }

    return {
      alerts,
      currentSpend,
      remainingBudget
    }
  }

  /**
   * Get optimization suggestions based on usage patterns
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    const recentRecords = this.getRecentRecords(7) // Last 7 days

    // Suggest model optimizations
    suggestions.push(...this.analyzeModelUsage(recentRecords))
    
    // Suggest batching optimizations
    suggestions.push(...this.analyzeBatchingOpportunities(recentRecords))
    
    // Suggest caching improvements
    suggestions.push(...this.analyzeCachingOpportunities(recentRecords))
    
    // Suggest cost reduction opportunities
    suggestions.push(...this.analyzeCostReduction(recentRecords))

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Set budget limits
   */
  setBudgetLimit(period: 'daily' | 'weekly' | 'monthly', amount: number): void {
    this.budgetLimits[period] = amount
    this.saveToStorage()
  }

  /**
   * Export usage data for analysis
   */
  exportUsageData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCsv()
    }

    return JSON.stringify({
      records: this.records,
      budgetLimits: this.budgetLimits,
      summary: this.getOverallSummary(),
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Clear usage data
   */
  clearUsageData(olderThan?: Date): void {
    if (olderThan) {
      this.records = this.records.filter(record => 
        new Date(record.timestamp) > olderThan
      )
    } else {
      this.records = []
    }
    
    this.saveToStorage()
  }

  /**
   * Get usage trends and forecasting
   */
  getUsageTrends(): {
    dailyTrend: number
    weeklyTrend: number
    monthlyTrend: number
    forecast: {
      nextWeekCost: number
      nextMonthCost: number
      confidence: number
    }
  } {
    const last30Days = this.getRecentRecords(30)
    const last7Days = this.getRecentRecords(7)
    const yesterday = this.getRecentRecords(1)

    const dailyAvg = this.calculateDailyAverage(last7Days)
    const weeklyAvg = this.calculateWeeklyAverage(last30Days)
    const monthlyAvg = this.calculateMonthlyAverage(this.records)

    const forecast = this.forecastUsage(last30Days)

    return {
      dailyTrend: this.calculateTrend(last7Days, 'daily'),
      weeklyTrend: this.calculateTrend(last30Days, 'weekly'),
      monthlyTrend: this.calculateTrend(this.records, 'monthly'),
      forecast
    }
  }

  // Private helper methods

  private filterRecords(
    provider?: ProviderType,
    timeRange?: { start: Date; end: Date }
  ): UsageRecord[] {
    return this.records.filter(record => {
      if (provider && record.provider !== provider) return false
      
      if (timeRange) {
        const recordTime = new Date(record.timestamp)
        if (recordTime < timeRange.start || recordTime > timeRange.end) return false
      }
      
      return true
    })
  }

  private calculateStats(records: UsageRecord[]): UsageStats {
    if (records.length === 0) {
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageLatency: 0,
        successRate: 0,
        requestsPerHour: 0,
        costPerRequest: 0,
        tokensPerRequest: 0
      }
    }

    const totalRequests = records.length
    const totalTokens = records.reduce((sum, r) => sum + r.usage.totalTokens, 0)
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0)
    const averageLatency = records.reduce((sum, r) => sum + r.latency, 0) / totalRequests
    const successfulRequests = records.filter(r => r.success).length
    const successRate = successfulRequests / totalRequests

    // Calculate requests per hour
    const timeSpan = this.getTimeSpanHours(records)
    const requestsPerHour = timeSpan > 0 ? totalRequests / timeSpan : 0

    return {
      totalRequests,
      totalTokens,
      totalCost,
      averageLatency,
      successRate,
      requestsPerHour,
      costPerRequest: totalCost / totalRequests,
      tokensPerRequest: totalTokens / totalRequests
    }
  }

  private calculateModelBreakdown(records: UsageRecord[]): Record<string, UsageStats> {
    const breakdown: Record<string, UsageStats> = {}
    const modelGroups = this.groupRecordsByField(records, 'model')

    for (const [model, modelRecords] of Object.entries(modelGroups)) {
      breakdown[model] = this.calculateStats(modelRecords)
    }

    return breakdown
  }

  private calculateOperationBreakdown(records: UsageRecord[]): Record<string, UsageStats> {
    const breakdown: Record<string, UsageStats> = {}
    const operationGroups = this.groupRecordsByField(records, 'operation')

    for (const [operation, operationRecords] of Object.entries(operationGroups)) {
      breakdown[operation] = this.calculateStats(operationRecords)
    }

    return breakdown
  }

  private generateTimeSeries(records: UsageRecord[]): Array<{
    timestamp: string
    requests: number
    tokens: number
    cost: number
  }> {
    const hourlyData: Record<string, { requests: number; tokens: number; cost: number }> = {}

    for (const record of records) {
      const hour = new Date(record.timestamp).toISOString().slice(0, 13) + ':00:00.000Z'
      
      if (!hourlyData[hour]) {
        hourlyData[hour] = { requests: 0, tokens: 0, cost: 0 }
      }

      hourlyData[hour].requests += 1
      hourlyData[hour].tokens += record.usage.totalTokens
      hourlyData[hour].cost += record.cost
    }

    return Object.entries(hourlyData)
      .map(([timestamp, data]) => ({ timestamp, ...data }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  private analyzeModelUsage(records: UsageRecord[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    const modelStats = this.calculateModelBreakdown(records)

    // Check if expensive models are being used for simple tasks
    for (const [model, stats] of Object.entries(modelStats)) {
      if (model.includes('opus') && stats.tokensPerRequest < 500) {
        suggestions.push({
          type: 'model_recommendation',
          priority: 'high',
          title: 'Consider using Haiku for simple tasks',
          description: `You're using Claude Opus for requests with low token counts (avg: ${Math.round(stats.tokensPerRequest)} tokens). Haiku could handle these tasks at lower cost.`,
          potentialSavings: stats.totalCost * 0.8, // Potential 80% savings
          implementation: 'Switch to Haiku model for tasks under 1000 tokens',
          impact: {
            costReduction: 80,
            performanceChange: -5,
            complexityIncrease: 10
          }
        })
      }
    }

    return suggestions
  }

  private analyzeBatchingOpportunities(records: UsageRecord[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    
    // Look for patterns where batching could be beneficial
    const smallRequests = records.filter(r => r.usage.inputTokens < 1000)
    
    if (smallRequests.length > 10) {
      const potentialSavings = smallRequests.length * 0.1 // 10% overhead per request
      
      suggestions.push({
        type: 'batch_optimization',
        priority: 'medium',
        title: 'Batch small requests for efficiency',
        description: `Found ${smallRequests.length} small requests that could be batched together to reduce overhead.`,
        potentialSavings,
        implementation: 'Implement request batching for inputs under 1000 tokens',
        impact: {
          costReduction: 15,
          performanceChange: 10,
          complexityIncrease: 25
        }
      })
    }

    return suggestions
  }

  private analyzeCachingOpportunities(records: UsageRecord[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    
    // Look for repeated patterns that could benefit from caching
    const contentHashes: Record<string, number> = {}
    
    for (const record of records) {
      const hash = this.simpleHash(record.context?.userRequest || '')
      contentHashes[hash] = (contentHashes[hash] || 0) + 1
    }

    const duplicates = Object.values(contentHashes).filter(count => count > 1)
    
    if (duplicates.length > 0) {
      const duplicateCount = duplicates.reduce((sum, count) => sum + count - 1, 0)
      const potentialSavings = duplicateCount * 0.5 // Average cost per request
      
      suggestions.push({
        type: 'caching_improvement',
        priority: 'medium',
        title: 'Enable caching for repeated requests',
        description: `Found ${duplicateCount} duplicate requests that could be served from cache.`,
        potentialSavings,
        implementation: 'Enable response caching with appropriate TTL',
        impact: {
          costReduction: 70,
          performanceChange: 50,
          complexityIncrease: 15
        }
      })
    }

    return suggestions
  }

  private analyzeCostReduction(records: UsageRecord[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0)

    // General cost reduction suggestions
    if (totalCost > 100) { // If spending more than $100 in the period
      suggestions.push({
        type: 'cost_reduction',
        priority: 'high',
        title: 'Consider provider cost comparison',
        description: `Current spending is $${totalCost.toFixed(2)}. Compare provider costs for potential savings.`,
        potentialSavings: totalCost * 0.2, // Potential 20% savings
        implementation: 'Use provider comparison dashboard to find cost-effective alternatives',
        impact: {
          costReduction: 20,
          performanceChange: 0,
          complexityIncrease: 5
        }
      })
    }

    return suggestions
  }

  private generateBudgetAlerts(): BudgetAlert[] {
    const alerts: BudgetAlert[] = []
    const currentSpend = this.getCurrentSpend()

    for (const [period, limit] of Object.entries(this.budgetLimits)) {
      const usage = currentSpend[period] || 0
      const percentage = (usage / limit) * 100

      if (percentage >= 80) {
        alerts.push({
          id: `alert-${period}-${Date.now()}`,
          type: period as any,
          threshold: limit,
          currentUsage: usage,
          percentage,
          triggered: percentage >= 100,
          message: percentage >= 100 
            ? `${period} budget exceeded! Used $${usage.toFixed(2)} of $${limit.toFixed(2)}`
            : `${period} budget at ${percentage.toFixed(1)}% - $${usage.toFixed(2)} of $${limit.toFixed(2)}`,
          recommendations: this.getBudgetRecommendations(period, percentage)
        })
      }
    }

    return alerts
  }

  private getCurrentSpend(): Record<string, number> {
    const now = new Date()
    const spend: Record<string, number> = {}

    // Daily spend
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    spend.daily = this.calculateSpendInRange(startOfDay, now)

    // Weekly spend
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    spend.weekly = this.calculateSpendInRange(startOfWeek, now)

    // Monthly spend
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    spend.monthly = this.calculateSpendInRange(startOfMonth, now)

    return spend
  }

  private calculateSpendInRange(start: Date, end: Date): number {
    return this.records
      .filter(record => {
        const recordTime = new Date(record.timestamp)
        return recordTime >= start && recordTime <= end
      })
      .reduce((sum, record) => sum + record.cost, 0)
  }

  private getBudgetRecommendations(period: string, percentage: number): string[] {
    const recommendations: string[] = []

    if (percentage >= 100) {
      recommendations.push('Consider upgrading your budget limit')
      recommendations.push('Review recent high-cost operations')
      recommendations.push('Enable cost optimization suggestions')
    } else if (percentage >= 80) {
      recommendations.push('Monitor usage more closely')
      recommendations.push('Consider using more cost-effective models')
      recommendations.push('Enable request batching to reduce overhead')
    }

    return recommendations
  }

  private getRecentRecords(days: number): UsageRecord[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    
    return this.records.filter(record => 
      new Date(record.timestamp) > cutoff
    )
  }

  private getOverallSummary(): UsageStats {
    return this.calculateStats(this.records)
  }

  private groupRecordsByField(records: UsageRecord[], field: keyof UsageRecord): Record<string, UsageRecord[]> {
    const groups: Record<string, UsageRecord[]> = {}
    
    for (const record of records) {
      const key = String(record[field])
      if (!groups[key]) groups[key] = []
      groups[key].push(record)
    }
    
    return groups
  }

  private getTimeSpanHours(records: UsageRecord[]): number {
    if (records.length === 0) return 0
    
    const timestamps = records.map(r => new Date(r.timestamp).getTime())
    const earliest = Math.min(...timestamps)
    const latest = Math.max(...timestamps)
    
    return (latest - earliest) / (1000 * 60 * 60) // Convert to hours
  }

  private calculateDailyAverage(records: UsageRecord[]): number {
    if (records.length === 0) return 0
    return records.reduce((sum, r) => sum + r.cost, 0) / Math.max(1, this.getTimeSpanHours(records) / 24)
  }

  private calculateWeeklyAverage(records: UsageRecord[]): number {
    if (records.length === 0) return 0
    return records.reduce((sum, r) => sum + r.cost, 0) / Math.max(1, this.getTimeSpanHours(records) / (24 * 7))
  }

  private calculateMonthlyAverage(records: UsageRecord[]): number {
    if (records.length === 0) return 0
    return records.reduce((sum, r) => sum + r.cost, 0) / Math.max(1, this.getTimeSpanHours(records) / (24 * 30))
  }

  private calculateTrend(records: UsageRecord[], period: 'daily' | 'weekly' | 'monthly'): number {
    // Simple trend calculation - could be improved with more sophisticated algorithms
    if (records.length < 2) return 0
    
    const sortedRecords = records.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    const firstHalf = sortedRecords.slice(0, Math.floor(sortedRecords.length / 2))
    const secondHalf = sortedRecords.slice(Math.floor(sortedRecords.length / 2))
    
    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.cost, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.cost, 0) / secondHalf.length
    
    return ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 // Percentage change
  }

  private forecastUsage(records: UsageRecord[]): {
    nextWeekCost: number
    nextMonthCost: number
    confidence: number
  } {
    if (records.length === 0) {
      return { nextWeekCost: 0, nextMonthCost: 0, confidence: 0 }
    }

    const dailyAvg = this.calculateDailyAverage(records)
    const trend = this.calculateTrend(records, 'daily')
    
    // Simple linear projection
    const trendMultiplier = 1 + (trend / 100)
    const nextWeekCost = dailyAvg * 7 * trendMultiplier
    const nextMonthCost = dailyAvg * 30 * trendMultiplier
    
    // Confidence based on data consistency
    const confidence = Math.min(100, records.length * 2) // Higher confidence with more data
    
    return {
      nextWeekCost,
      nextMonthCost,
      confidence
    }
  }

  private exportToCsv(): string {
    const headers = [
      'timestamp', 'provider', 'model', 'operation', 'inputTokens', 
      'outputTokens', 'totalTokens', 'cost', 'latency', 'success', 'error'
    ]
    
    const rows = this.records.map(record => [
      record.timestamp,
      record.provider,
      record.model,
      record.operation,
      record.usage.inputTokens,
      record.usage.outputTokens,
      record.usage.totalTokens,
      record.cost,
      record.latency,
      record.success,
      record.error || ''
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private checkBudgetAlerts(): void {
    const alerts = this.generateBudgetAlerts()
    
    // In a real implementation, this could trigger notifications
    if (alerts.some(alert => alert.triggered)) {
      console.warn('Budget alerts triggered:', alerts.filter(a => a.triggered))
    }
  }

  private generateId(): string {
    return `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  private trimRecords(): void {
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords) // Keep most recent records
    }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          records: this.records,
          budgetLimits: this.budgetLimits,
          lastSaved: new Date().toISOString()
        }
        localStorage.setItem(this.persistenceKey, JSON.stringify(data))
      } catch (error) {
        console.warn('Failed to save usage data to localStorage:', error)
      }
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(this.persistenceKey)
        if (data) {
          const parsed = JSON.parse(data)
          this.records = parsed.records || []
          this.budgetLimits = parsed.budgetLimits || {}
        }
      } catch (error) {
        console.warn('Failed to load usage data from localStorage:', error)
      }
    }
  }

  private setupPeriodicSave(): void {
    // Save every 5 minutes to prevent data loss
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.saveToStorage()
      }, 5 * 60 * 1000)
    }
  }
}

/**
 * Global usage tracker instance
 */
let globalUsageTracker: UsageTracker | null = null

export function getGlobalUsageTracker(): UsageTracker {
  if (!globalUsageTracker) {
    globalUsageTracker = new UsageTracker()
  }
  return globalUsageTracker
}

/**
 * Convenience function to track usage
 */
export function trackUsage(
  provider: ProviderType,
  model: string,
  operation: UsageRecord['operation'],
  usage: UsageRecord['usage'],
  cost: number,
  latency: number,
  success: boolean,
  context?: UsageRecord['context']
): string {
  const tracker = getGlobalUsageTracker()
  return tracker.trackUsage({
    provider,
    model,
    operation,
    usage,
    cost,
    latency,
    success,
    context
  })
}