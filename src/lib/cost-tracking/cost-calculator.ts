/**
 * Cost Calculator for Multi-Provider Cost Analysis and Optimization
 * Provides detailed cost calculations, comparisons, and optimization recommendations
 */

import { ProviderType, LogicalModelName } from '@/types/model-provider'
import { UsageRecord, OptimizationSuggestion, getGlobalUsageTracker } from './usage-tracker'

export interface ModelPricing {
  inputTokenCost: number // Cost per 1M input tokens
  outputTokenCost: number // Cost per 1M output tokens
  currency: 'USD'
  lastUpdated: string
}

export interface ProviderPricing {
  [modelId: string]: ModelPricing
}

export interface CostComparison {
  provider: ProviderType
  model: string
  inputCost: number
  outputCost: number
  totalCost: number
  estimatedMonthlyCost: number
  costEfficiencyScore: number
}

export interface OptimizationReport {
  currentCosts: {
    daily: number
    weekly: number
    monthly: number
    projected: number
  }
  potentialSavings: {
    modelOptimization: number
    providerSwitching: number
    batchingImprovements: number
    cachingImprovements: number
    totalPotential: number
  }
  recommendations: OptimizationSuggestion[]
  costBreakdown: {
    byProvider: Record<ProviderType, number>
    byModel: Record<string, number>
    byOperation: Record<string, number>
  }
  trends: {
    costTrend: number // Percentage change
    usageTrend: number
    efficiencyTrend: number
  }
}

export interface BudgetProjection {
  currentPeriod: {
    spent: number
    budget: number
    remaining: number
    daysRemaining: number
    projectedSpend: number
    onTrack: boolean
  }
  recommendations: {
    dailyBudget: number
    weeklyBudget: number
    monthlyBudget: number
    adjustmentNeeded: number
  }
}

/**
 * Cost Calculator class for comprehensive cost analysis
 */
export class CostCalculator {
  private pricing: Record<ProviderType, ProviderPricing>
  private lastPricingUpdate: string

  constructor() {
    this.pricing = this.getLatestPricing()
    this.lastPricingUpdate = new Date().toISOString()
  }

  /**
   * Calculate cost for a specific request
   */
  calculateRequestCost(
    provider: ProviderType,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const modelPricing = this.getModelPricing(provider, model)
    if (!modelPricing) {
      console.warn(`Pricing not found for ${provider}:${model}`)
      return 0
    }

    const inputCost = (inputTokens / 1_000_000) * modelPricing.inputTokenCost
    const outputCost = (outputTokens / 1_000_000) * modelPricing.outputTokenCost

    return inputCost + outputCost
  }

  /**
   * Compare costs across providers for the same logical model
   */
  compareProviderCosts(
    logicalModel: LogicalModelName,
    inputTokens: number,
    outputTokens: number
  ): CostComparison[] {
    const comparisons: CostComparison[] = []
    
    // Get model mappings for each provider
    const modelMappings = this.getModelMappings()
    
    for (const provider of ['anthropic', 'bedrock'] as ProviderType[]) {
      const specificModel = modelMappings[logicalModel]?.[provider]
      if (!specificModel) continue

      const inputCost = this.calculateRequestCost(provider, specificModel, inputTokens, 0)
      const outputCost = this.calculateRequestCost(provider, specificModel, 0, outputTokens)
      const totalCost = inputCost + outputCost

      // Estimate monthly cost based on current usage patterns
      const usageTracker = getGlobalUsageTracker()
      const providerUsage = usageTracker.getProviderUsage(provider)
      const estimatedMonthlyCost = totalCost * (providerUsage.stats.requestsPerHour * 24 * 30)

      // Calculate cost efficiency score (lower cost = higher score)
      const maxCost = Math.max(...comparisons.map(c => c.totalCost), totalCost)
      const costEfficiencyScore = maxCost > 0 ? ((maxCost - totalCost) / maxCost) * 100 : 100

      comparisons.push({
        provider,
        model: specificModel,
        inputCost,
        outputCost,
        totalCost,
        estimatedMonthlyCost,
        costEfficiencyScore
      })
    }

    return comparisons.sort((a, b) => a.totalCost - b.totalCost)
  }

  /**
   * Generate comprehensive optimization report
   */
  generateOptimizationReport(): OptimizationReport {
    const usageTracker = getGlobalUsageTracker()
    const recentUsage = usageTracker.getUsageTrends()
    
    // Calculate current costs
    const currentCosts = this.calculateCurrentCosts()
    
    // Analyze potential savings
    const potentialSavings = this.analyzePotentialSavings()
    
    // Get optimization recommendations
    const recommendations = usageTracker.getOptimizationSuggestions()
    
    // Calculate cost breakdown
    const costBreakdown = this.calculateCostBreakdown()
    
    // Calculate trends
    const trends = {
      costTrend: recentUsage.monthlyTrend,
      usageTrend: this.calculateUsageTrend(),
      efficiencyTrend: this.calculateEfficiencyTrend()
    }

    return {
      currentCosts,
      potentialSavings,
      recommendations,
      costBreakdown,
      trends
    }
  }

  /**
   * Project budget requirements
   */
  projectBudget(currentBudget: number, period: 'daily' | 'weekly' | 'monthly'): BudgetProjection {
    const usageTracker = getGlobalUsageTracker()
    const trends = usageTracker.getUsageTrends()
    const budgetStatus = usageTracker.getBudgetStatus()
    
    let spent = 0
    let daysRemaining = 0
    
    switch (period) {
      case 'daily':
        spent = budgetStatus.currentSpend.daily || 0
        daysRemaining = 1
        break
      case 'weekly':
        spent = budgetStatus.currentSpend.weekly || 0
        daysRemaining = 7 - new Date().getDay()
        break
      case 'monthly':
        spent = budgetStatus.currentSpend.monthly || 0
        const now = new Date()
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        break
    }

    const remaining = Math.max(0, currentBudget - spent)
    const projectedSpend = spent + (trends.forecast.nextWeekCost / 7) * daysRemaining
    const onTrack = projectedSpend <= currentBudget

    // Calculate recommended budgets
    const dailyBurnRate = spent / Math.max(1, this.getDaysElapsedInPeriod(period))
    const adjustmentNeeded = onTrack ? 0 : projectedSpend - currentBudget

    const recommendations = {
      dailyBudget: dailyBurnRate * 1.1, // 10% buffer
      weeklyBudget: dailyBurnRate * 7 * 1.1,
      monthlyBudget: dailyBurnRate * 30 * 1.1,
      adjustmentNeeded
    }

    return {
      currentPeriod: {
        spent,
        budget: currentBudget,
        remaining,
        daysRemaining,
        projectedSpend,
        onTrack
      },
      recommendations
    }
  }

  /**
   * Get cost optimization suggestions for specific use case
   */
  getUseCaseOptimizations(
    useCase: 'analysis' | 'classification' | 'correlation' | 'generation',
    currentProvider: ProviderType,
    averageTokens: { input: number; output: number }
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    
    // Model recommendations based on use case
    const modelRecommendations = this.getModelRecommendations(useCase, averageTokens)
    
    // Provider switching recommendations
    const providerSwitchSuggestions = this.getProviderSwitchRecommendations(
      currentProvider,
      averageTokens
    )
    
    // Batching recommendations
    const batchingSuggestions = this.getBatchingRecommendations(useCase, averageTokens)
    
    return [
      ...modelRecommendations,
      ...providerSwitchSuggestions,
      ...batchingSuggestions
    ]
  }

  /**
   * Calculate ROI for different optimization strategies
   */
  calculateOptimizationROI(
    currentMonthlyCost: number,
    optimizationStrategies: Array<{
      name: string
      implementationCost: number
      monthlySavings: number
      complexityScore: number // 1-10
    }>
  ): Array<{
    strategy: string
    roi: number
    paybackPeriod: number // months
    riskAdjustedROI: number
    recommendation: 'high' | 'medium' | 'low'
  }> {
    return optimizationStrategies.map(strategy => {
      const roi = strategy.implementationCost > 0 
        ? (strategy.monthlySavings * 12 - strategy.implementationCost) / strategy.implementationCost * 100
        : Infinity

      const paybackPeriod = strategy.implementationCost / Math.max(strategy.monthlySavings, 0.01)
      
      // Adjust ROI based on complexity (higher complexity = higher risk)
      const riskMultiplier = Math.max(0.5, (11 - strategy.complexityScore) / 10)
      const riskAdjustedROI = roi * riskMultiplier

      let recommendation: 'high' | 'medium' | 'low' = 'low'
      if (riskAdjustedROI > 100 && paybackPeriod < 6) recommendation = 'high'
      else if (riskAdjustedROI > 50 && paybackPeriod < 12) recommendation = 'medium'

      return {
        strategy: strategy.name,
        roi,
        paybackPeriod,
        riskAdjustedROI,
        recommendation
      }
    }).sort((a, b) => b.riskAdjustedROI - a.riskAdjustedROI)
  }

  /**
   * Update pricing information
   */
  updatePricing(provider: ProviderType, pricing: ProviderPricing): void {
    this.pricing[provider] = pricing
    this.lastPricingUpdate = new Date().toISOString()
  }

  /**
   * Export cost analysis data
   */
  exportCostAnalysis(): string {
    const report = this.generateOptimizationReport()
    const usageTracker = getGlobalUsageTracker()
    const comparison = this.compareProviderCosts('sonnet', 1000, 1000)

    return JSON.stringify({
      report,
      providerComparison: comparison,
      pricing: this.pricing,
      lastUpdated: this.lastPricingUpdate,
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  // Private helper methods

  private getLatestPricing(): Record<ProviderType, ProviderPricing> {
    return {
      anthropic: {
        'claude-3-5-sonnet-20241022': {
          inputTokenCost: 3.00,
          outputTokenCost: 15.00,
          currency: 'USD',
          lastUpdated: '2024-11-01'
        },
        'claude-3-5-haiku-20241022': {
          inputTokenCost: 0.80,
          outputTokenCost: 4.00,
          currency: 'USD',
          lastUpdated: '2024-11-01'
        },
        'claude-3-opus-20240229': {
          inputTokenCost: 15.00,
          outputTokenCost: 75.00,
          currency: 'USD',
          lastUpdated: '2024-11-01'
        },
        'claude-sonnet-4-20250514': {
          inputTokenCost: 3.00,
          outputTokenCost: 15.00,
          currency: 'USD',
          lastUpdated: '2024-11-01'
        },
        'claude-3-5-haiku-latest': {
          inputTokenCost: 0.80,
          outputTokenCost: 4.00,
          currency: 'USD',
          lastUpdated: '2024-11-01'
        },
        'claude-opus-4-1-20250805': {
          inputTokenCost: 15.00,
          outputTokenCost: 75.00,
          currency: 'USD',
          lastUpdated: '2024-11-01'
        }
      },
      bedrock: {
        'us.anthropic.claude-3-7-sonnet-20250219-v1:0': {
          inputTokenCost: 3.30, // Slightly higher for Bedrock
          outputTokenCost: 16.50,
          currency: 'USD',
          lastUpdated: '2024-11-01'
        },
        'us.anthropic.claude-3-5-haiku-20241022-v1:0': {
          inputTokenCost: 0.88,
          outputTokenCost: 4.40,
          currency: 'USD',
          lastUpdated: '2024-11-01'
        },
        'us.anthropic.claude-opus-4-1-20250805-v1:0': {
          inputTokenCost: 16.50,
          outputTokenCost: 82.50,
          currency: 'USD',
          lastUpdated: '2024-11-01'
        },
        'anthropic.claude-3-opus-20240229-v1:0': {
          inputTokenCost: 16.50,
          outputTokenCost: 82.50,
          currency: 'USD',
          lastUpdated: '2024-11-01'
        }
      }
    }
  }

  private getModelPricing(provider: ProviderType, model: string): ModelPricing | null {
    return this.pricing[provider]?.[model] || null
  }

  private getModelMappings() {
    // This would typically come from config, but for now we'll use static mappings
    return {
      sonnet: {
        anthropic: 'claude-3-5-sonnet-20241022',
        bedrock: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0'
      },
      haiku: {
        anthropic: 'claude-3-5-haiku-20241022',
        bedrock: 'us.anthropic.claude-3-5-haiku-20241022-v1:0'
      },
      opus: {
        anthropic: 'claude-3-opus-20240229',
        bedrock: 'anthropic.claude-3-opus-20240229-v1:0'
      }
    }
  }

  private calculateCurrentCosts() {
    const usageTracker = getGlobalUsageTracker()
    const budgetStatus = usageTracker.getBudgetStatus()
    const trends = usageTracker.getUsageTrends()

    return {
      daily: budgetStatus.currentSpend.daily || 0,
      weekly: budgetStatus.currentSpend.weekly || 0,
      monthly: budgetStatus.currentSpend.monthly || 0,
      projected: trends.forecast.nextMonthCost
    }
  }

  private analyzePotentialSavings() {
    const usageTracker = getGlobalUsageTracker()
    const suggestions = usageTracker.getOptimizationSuggestions()

    const modelOptimization = suggestions
      .filter(s => s.type === 'model_recommendation')
      .reduce((sum, s) => sum + s.potentialSavings, 0)

    const batchingImprovements = suggestions
      .filter(s => s.type === 'batch_optimization')
      .reduce((sum, s) => sum + s.potentialSavings, 0)

    const cachingImprovements = suggestions
      .filter(s => s.type === 'caching_improvement')
      .reduce((sum, s) => sum + s.potentialSavings, 0)

    const providerSwitching = suggestions
      .filter(s => s.type === 'cost_reduction')
      .reduce((sum, s) => sum + s.potentialSavings, 0)

    return {
      modelOptimization,
      providerSwitching,
      batchingImprovements,
      cachingImprovements,
      totalPotential: modelOptimization + providerSwitching + batchingImprovements + cachingImprovements
    }
  }

  private calculateCostBreakdown() {
    const usageTracker = getGlobalUsageTracker()
    const anthropicUsage = usageTracker.getProviderUsage('anthropic')
    const bedrockUsage = usageTracker.getProviderUsage('bedrock')

    // Convert model breakdown to cost numbers
    const modelCosts: Record<string, number> = {}
    Object.entries(anthropicUsage.modelBreakdown).forEach(([model, stats]) => {
      modelCosts[model] = stats.totalCost
    })
    Object.entries(bedrockUsage.modelBreakdown).forEach(([model, stats]) => {
      modelCosts[model] = stats.totalCost
    })

    // Convert operation breakdown to cost numbers
    const operationCosts: Record<string, number> = {}
    Object.entries(anthropicUsage.operationBreakdown).forEach(([operation, stats]) => {
      operationCosts[operation] = (operationCosts[operation] || 0) + stats.totalCost
    })
    Object.entries(bedrockUsage.operationBreakdown).forEach(([operation, stats]) => {
      operationCosts[operation] = (operationCosts[operation] || 0) + stats.totalCost
    })

    return {
      byProvider: {
        anthropic: anthropicUsage.stats.totalCost,
        bedrock: bedrockUsage.stats.totalCost
      },
      byModel: modelCosts,
      byOperation: operationCosts
    }
  }

  private calculateUsageTrend(): number {
    const usageTracker = getGlobalUsageTracker()
    const trends = usageTracker.getUsageTrends()
    return trends.weeklyTrend
  }

  private calculateEfficiencyTrend(): number {
    // Calculate efficiency as cost per successful request
    const usageTracker = getGlobalUsageTracker()
    const anthropicUsage = usageTracker.getProviderUsage('anthropic')
    const bedrockUsage = usageTracker.getProviderUsage('bedrock')

    const totalRequests = anthropicUsage.stats.totalRequests + bedrockUsage.stats.totalRequests
    const totalCost = anthropicUsage.stats.totalCost + bedrockUsage.stats.totalCost
    
    // This is a simplified efficiency trend calculation
    return totalRequests > 0 ? (totalCost / totalRequests) * -1 : 0 // Negative because lower cost per request is better
  }

  private getDaysElapsedInPeriod(period: 'daily' | 'weekly' | 'monthly'): number {
    const now = new Date()
    
    switch (period) {
      case 'daily':
        return 1
      case 'weekly':
        return now.getDay() + 1
      case 'monthly':
        return now.getDate()
      default:
        return 1
    }
  }

  private getModelRecommendations(
    useCase: string,
    averageTokens: { input: number; output: number }
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    // Recommend Haiku for simple tasks
    if (averageTokens.input < 1000 && averageTokens.output < 500) {
      suggestions.push({
        type: 'model_recommendation',
        priority: 'high',
        title: 'Use Haiku for simple tasks',
        description: `Your ${useCase} tasks use ${averageTokens.input} input tokens on average. Haiku can handle this efficiently.`,
        potentialSavings: 50, // Estimated savings
        implementation: 'Switch to Haiku model for lightweight operations',
        impact: {
          costReduction: 75,
          performanceChange: 20,
          complexityIncrease: 5
        }
      })
    }

    return suggestions
  }

  private getProviderSwitchRecommendations(
    currentProvider: ProviderType,
    averageTokens: { input: number; output: number }
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    const comparison = this.compareProviderCosts('sonnet', averageTokens.input, averageTokens.output)
    
    const cheapestProvider = comparison[0]
    if (cheapestProvider.provider !== currentProvider) {
      const savings = comparison.find(c => c.provider === currentProvider)?.totalCost || 0
      const potentialSavings = savings - cheapestProvider.totalCost

      if (potentialSavings > 0.01) { // If savings is more than 1 cent
        suggestions.push({
          type: 'cost_reduction',
          priority: 'medium',
          title: `Consider switching to ${cheapestProvider.provider}`,
          description: `${cheapestProvider.provider} offers ${((potentialSavings / savings) * 100).toFixed(1)}% cost savings for your usage pattern.`,
          potentialSavings: potentialSavings * 1000, // Estimate monthly savings
          implementation: `Switch provider configuration to ${cheapestProvider.provider}`,
          impact: {
            costReduction: (potentialSavings / savings) * 100,
            performanceChange: 0,
            complexityIncrease: 10
          }
        })
      }
    }

    return suggestions
  }

  private getBatchingRecommendations(
    useCase: string,
    averageTokens: { input: number; output: number }
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    if (averageTokens.input < 500 && useCase === 'classification') {
      suggestions.push({
        type: 'batch_optimization',
        priority: 'medium',
        title: 'Batch classification requests',
        description: 'Small classification requests can be batched together for better efficiency.',
        potentialSavings: 25,
        implementation: 'Implement request batching for classification operations',
        impact: {
          costReduction: 20,
          performanceChange: 15,
          complexityIncrease: 30
        }
      })
    }

    return suggestions
  }
}

/**
 * Global cost calculator instance
 */
let globalCostCalculator: CostCalculator | null = null

export function getGlobalCostCalculator(): CostCalculator {
  if (!globalCostCalculator) {
    globalCostCalculator = new CostCalculator()
  }
  return globalCostCalculator
}

/**
 * Convenience function to calculate request cost
 */
export function calculateCost(
  provider: ProviderType,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const calculator = getGlobalCostCalculator()
  return calculator.calculateRequestCost(provider, model, inputTokens, outputTokens)
}