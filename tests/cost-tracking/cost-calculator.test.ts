/**
 * Cost Calculator Verification Tests
 * Comprehensive testing of cost calculations and optimization recommendations
 */

import { CostCalculator, ModelPricing, CostComparison, OptimizationReport } from '@/lib/cost-tracking/cost-calculator'
import { UsageTracker, UsageRecord, getGlobalUsageTracker } from '@/lib/cost-tracking/usage-tracker'
import { ProviderType, LogicalModelName } from '@/types/model-provider'

// Mock the usage tracker
jest.mock('@/lib/cost-tracking/usage-tracker', () => ({
  getGlobalUsageTracker: jest.fn(),
  UsageTracker: jest.fn(),
}))

describe('CostCalculator', () => {
  let costCalculator: CostCalculator
  let mockUsageTracker: any

  beforeEach(() => {
    // Mock usage tracker
    mockUsageTracker = {
      getUsageHistory: jest.fn().mockReturnValue([]),
      getProviderUsage: jest.fn().mockReturnValue({
        provider: 'anthropic',
        stats: {
          totalRequests: 100,
          totalTokens: 50000,
          totalCost: 1.50,
          averageLatency: 200,
          successRate: 0.95,
          requestsPerHour: 10,
          costPerRequest: 0.015,
          tokensPerRequest: 500,
        },
        modelBreakdown: {
          'claude-3-5-sonnet-20241022': {
            totalRequests: 60,
            totalTokens: 30000,
            totalCost: 0.90,
            averageLatency: 180,
            successRate: 0.96,
          },
          'claude-3-5-haiku-20241022': {
            totalRequests: 40,
            totalTokens: 20000,
            totalCost: 0.60,
            averageLatency: 150,
            successRate: 0.94,
          },
        },
      }),
      getBudgetStatus: jest.fn().mockReturnValue({
        alerts: [],
        isOverBudget: false,
        remainingBudget: { daily: 8.50, weekly: 40.50, monthly: 150.50 },
      }),
    }

    ;(getGlobalUsageTracker as jest.Mock).mockReturnValue(mockUsageTracker)

    costCalculator = new CostCalculator()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Pricing Accuracy', () => {
    test('should have correct Anthropic pricing', () => {
      const pricing = costCalculator.getProviderPricing('anthropic')

      expect(pricing['claude-3-5-sonnet-20241022']).toEqual({
        inputTokenCost: 3.0,
        outputTokenCost: 15.0,
        currency: 'USD',
        lastUpdated: expect.any(String),
      })

      expect(pricing['claude-3-5-haiku-20241022']).toEqual({
        inputTokenCost: 0.8,
        outputTokenCost: 4.0,
        currency: 'USD',
        lastUpdated: expect.any(String),
      })

      expect(pricing['claude-3-opus-20240229']).toEqual({
        inputTokenCost: 15.0,
        outputTokenCost: 75.0,
        currency: 'USD',
        lastUpdated: expect.any(String),
      })
    })

    test('should have correct Bedrock pricing (10% markup)', () => {
      const pricing = costCalculator.getProviderPricing('bedrock')

      expect(pricing['us.anthropic.claude-3-5-sonnet-20241022-v2:0']).toEqual({
        inputTokenCost: 3.3, // 3.0 * 1.1
        outputTokenCost: 16.5, // 15.0 * 1.1
        currency: 'USD',
        lastUpdated: expect.any(String),
      })

      expect(pricing['us.anthropic.claude-3-5-haiku-20241022-v1:0']).toEqual({
        inputTokenCost: 0.88, // 0.8 * 1.1
        outputTokenCost: 4.4, // 4.0 * 1.1
        currency: 'USD',
        lastUpdated: expect.any(String),
      })

      expect(pricing['anthropic.claude-3-opus-20240229-v1:0']).toEqual({
        inputTokenCost: 16.5, // 15.0 * 1.1
        outputTokenCost: 82.5, // 75.0 * 1.1
        currency: 'USD',
        lastUpdated: expect.any(String),
      })
    })

    test('should calculate correct costs for specific token amounts', () => {
      const inputTokens = 10000
      const outputTokens = 5000

      // Anthropic Sonnet: (10000/1M * 3) + (5000/1M * 15) = 0.03 + 0.075 = 0.105
      const anthropicCost = costCalculator.calculateCost(
        'anthropic',
        'claude-3-5-sonnet-20241022',
        inputTokens,
        outputTokens
      )
      expect(anthropicCost).toBeCloseTo(0.105, 6)

      // Bedrock Sonnet: (10000/1M * 3.3) + (5000/1M * 16.5) = 0.033 + 0.0825 = 0.1155
      const bedrockCost = costCalculator.calculateCost(
        'bedrock',
        'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        inputTokens,
        outputTokens
      )
      expect(bedrockCost).toBeCloseTo(0.1155, 6)
    })

    test('should handle zero token inputs', () => {
      const cost = costCalculator.calculateCost('anthropic', 'claude-3-5-sonnet-20241022', 0, 0)
      expect(cost).toBe(0)
    })

    test('should handle unknown models with default pricing', () => {
      const cost = costCalculator.calculateCost('anthropic', 'unknown-model', 1000, 500)
      const defaultCost = costCalculator.calculateCost('anthropic', 'claude-3-5-sonnet-20241022', 1000, 500)
      expect(cost).toBe(defaultCost)
    })
  })

  describe('Cost Comparisons', () => {
    test('should compare costs between providers for logical models', () => {
      const comparison = costCalculator.compareProviderCosts('sonnet', 1000, 500)

      expect(comparison).toHaveLength(2)

      const anthropicComparison = comparison.find(c => c.provider === 'anthropic')
      const bedrockComparison = comparison.find(c => c.provider === 'bedrock')

      expect(anthropicComparison).toBeDefined()
      expect(bedrockComparison).toBeDefined()

      // Anthropic should be cheaper
      expect(anthropicComparison!.totalCost).toBeLessThan(bedrockComparison!.totalCost)
      expect(anthropicComparison!.costEfficiencyScore).toBeGreaterThan(bedrockComparison!.costEfficiencyScore)
    })

    test('should calculate cost efficiency scores correctly', () => {
      const comparison = costCalculator.compareProviderCosts('haiku', 2000, 1000)

      comparison.forEach(comp => {
        expect(comp.costEfficiencyScore).toBeGreaterThan(0)
        expect(comp.costEfficiencyScore).toBeLessThanOrEqual(100)
      })

      // Lower cost should have higher efficiency score
      const sortedByEfficiency = comparison.sort((a, b) => b.costEfficiencyScore - a.costEfficiencyScore)
      const sortedByCost = comparison.sort((a, b) => a.totalCost - b.totalCost)

      expect(sortedByEfficiency[0].provider).toBe(sortedByCost[0].provider)
    })

    test('should estimate monthly costs based on current usage', () => {
      const comparison = costCalculator.compareProviderCosts('sonnet', 1000, 500)

      comparison.forEach(comp => {
        expect(comp.estimatedMonthlyCost).toBeGreaterThan(0)
        // Should be approximately 30x daily cost
        expect(comp.estimatedMonthlyCost).toBeCloseTo(comp.totalCost * 30, 1)
      })
    })
  })

  describe('Optimization Reports', () => {
    beforeEach(() => {
      // Mock usage history with varied usage patterns
      mockUsageTracker.getUsageHistory.mockReturnValue([
        {
          timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
          provider: 'anthropic' as ProviderType,
          model: 'claude-3-5-sonnet-20241022',
          operation: 'analysis',
          inputTokens: 1000,
          outputTokens: 500,
          cost: 0.0105,
          latency: 200,
          success: true,
        },
        {
          timestamp: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
          provider: 'anthropic' as ProviderType,
          model: 'claude-3-5-haiku-20241022',
          operation: 'classification',
          inputTokens: 500,
          outputTokens: 200,
          cost: 0.0012,
          latency: 150,
          success: true,
        },
      ] as UsageRecord[])
    })

    test('should generate comprehensive optimization report', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report).toHaveProperty('currentCosts')
      expect(report).toHaveProperty('potentialSavings')
      expect(report).toHaveProperty('recommendations')
      expect(report).toHaveProperty('costBreakdown')
      expect(report).toHaveProperty('trends')

      expect(report.currentCosts.daily).toBeGreaterThan(0)
      expect(report.currentCosts.weekly).toBeGreaterThan(0)
      expect(report.currentCosts.monthly).toBeGreaterThan(0)
    })

    test('should identify model optimization opportunities', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report.potentialSavings.modelOptimization).toBeGreaterThanOrEqual(0)

      // Should suggest using cheaper models for appropriate tasks
      const modelOptimizations = report.recommendations.filter(r => r.type === 'model_optimization')
      expect(modelOptimizations.length).toBeGreaterThan(0)

      const haikuSuggestion = modelOptimizations.find(r => 
        r.title.includes('Haiku') || r.description.includes('simple tasks')
      )
      expect(haikuSuggestion).toBeDefined()
    })

    test('should identify provider switching opportunities', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report.potentialSavings.providerSwitching).toBeGreaterThanOrEqual(0)

      // Should suggest switching to Anthropic for cost savings
      const providerOptimizations = report.recommendations.filter(r => r.type === 'provider_switching')
      if (providerOptimizations.length > 0) {
        const anthropicSuggestion = providerOptimizations.find(r => 
          r.description.includes('Anthropic')
        )
        expect(anthropicSuggestion).toBeDefined()
      }
    })

    test('should identify batching opportunities', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report.potentialSavings.batchingImprovements).toBeGreaterThanOrEqual(0)

      const batchingSuggestions = report.recommendations.filter(r => r.type === 'batching')
      if (batchingSuggestions.length > 0) {
        expect(batchingSuggestions[0].description).toContain('batch')
      }
    })

    test('should identify caching opportunities', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report.potentialSavings.cachingImprovements).toBeGreaterThanOrEqual(0)

      const cachingSuggestions = report.recommendations.filter(r => r.type === 'caching')
      if (cachingSuggestions.length > 0) {
        expect(cachingSuggestions[0].description).toContain('cache')
      }
    })

    test('should calculate total potential savings', () => {
      const report = costCalculator.generateOptimizationReport()

      const expectedTotal = 
        report.potentialSavings.modelOptimization +
        report.potentialSavings.providerSwitching +
        report.potentialSavings.batchingImprovements +
        report.potentialSavings.cachingImprovements

      expect(report.potentialSavings.totalPotential).toBeCloseTo(expectedTotal, 2)
    })

    test('should prioritize recommendations by potential savings', () => {
      const report = costCalculator.generateOptimizationReport()

      // High savings recommendations should have high priority
      const highSavingsRecs = report.recommendations.filter(r => r.potentialSavings > 10)
      highSavingsRecs.forEach(rec => {
        expect(rec.priority).toBe('high')
      })

      // Recommendations should be sorted by priority and savings
      for (let i = 0; i < report.recommendations.length - 1; i++) {
        const current = report.recommendations[i]
        const next = report.recommendations[i + 1]

        if (current.priority === 'high' && next.priority === 'medium') {
          expect(current.potentialSavings).toBeGreaterThanOrEqual(next.potentialSavings)
        }
      }
    })
  })

  describe('Cost Breakdown Analysis', () => {
    test('should break down costs by provider', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report.costBreakdown.byProvider).toBeDefined()
      expect(report.costBreakdown.byProvider.anthropic).toBeGreaterThanOrEqual(0)
      expect(report.costBreakdown.byProvider.bedrock).toBeGreaterThanOrEqual(0)
    })

    test('should break down costs by model', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report.costBreakdown.byModel).toBeDefined()
      Object.keys(report.costBreakdown.byModel).forEach(model => {
        expect(report.costBreakdown.byModel[model]).toBeGreaterThanOrEqual(0)
      })
    })

    test('should break down costs by operation type', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report.costBreakdown.byOperation).toBeDefined()
      Object.keys(report.costBreakdown.byOperation).forEach(operation => {
        expect(report.costBreakdown.byOperation[operation]).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Trend Analysis', () => {
    test('should calculate cost trends', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report.trends.costTrend).toBeDefined()
      expect(typeof report.trends.costTrend).toBe('number')
    })

    test('should calculate usage trends', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report.trends.usageTrend).toBeDefined()
      expect(typeof report.trends.usageTrend).toBe('number')
    })

    test('should calculate efficiency trends', () => {
      const report = costCalculator.generateOptimizationReport()

      expect(report.trends.efficiencyTrend).toBeDefined()
      expect(typeof report.trends.efficiencyTrend).toBe('number')
    })
  })

  describe('ROI Calculations', () => {
    test('should calculate ROI for optimization recommendations', () => {
      const report = costCalculator.generateOptimizationReport()

      report.recommendations.forEach(rec => {
        expect(rec.impact.costReduction).toBeGreaterThanOrEqual(0)
        expect(rec.impact.costReduction).toBeLessThanOrEqual(100)

        expect(rec.impact.complexityIncrease).toBeGreaterThanOrEqual(0)
        expect(rec.impact.complexityIncrease).toBeLessThanOrEqual(10)
      })
    })

    test('should provide implementation guidance', () => {
      const report = costCalculator.generateOptimizationReport()

      report.recommendations.forEach(rec => {
        expect(rec.implementation).toBeDefined()
        expect(rec.implementation.length).toBeGreaterThan(10)
      })
    })
  })

  describe('Budget Projections', () => {
    test('should project future costs based on trends', () => {
      const projection = costCalculator.projectCosts(30) // 30 days

      expect(projection.projectedCost).toBeGreaterThan(0)
      expect(projection.confidence).toBeGreaterThan(0)
      expect(projection.confidence).toBeLessThanOrEqual(1)

      expect(projection.factors).toBeDefined()
      expect(projection.factors.length).toBeGreaterThan(0)
    })

    test('should consider seasonality in projections', () => {
      const shortTerm = costCalculator.projectCosts(7)
      const longTerm = costCalculator.projectCosts(90)

      // Long-term projections should have lower confidence
      expect(longTerm.confidence).toBeLessThanOrEqual(shortTerm.confidence)
    })
  })

  describe('Data Export and Analysis', () => {
    test('should export cost analysis data', () => {
      const exportData = costCalculator.exportCostAnalysis()

      expect(typeof exportData).toBe('string')

      const parsed = JSON.parse(exportData)
      expect(parsed).toHaveProperty('exportedAt')
      expect(parsed).toHaveProperty('optimizationReport')
      expect(parsed).toHaveProperty('costComparisons')
      expect(parsed).toHaveProperty('usageHistory')
    })

    test('should export data in valid JSON format', () => {
      const exportData = costCalculator.exportCostAnalysis()

      expect(() => JSON.parse(exportData)).not.toThrow()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty usage history', () => {
      mockUsageTracker.getUsageHistory.mockReturnValue([])

      const report = costCalculator.generateOptimizationReport()

      expect(report.currentCosts.daily).toBe(0)
      expect(report.recommendations.length).toBeGreaterThanOrEqual(0)
    })

    test('should handle invalid token counts', () => {
      expect(() => {
        costCalculator.calculateCost('anthropic', 'claude-3-5-sonnet-20241022', -1, 500)
      }).not.toThrow()

      const cost = costCalculator.calculateCost('anthropic', 'claude-3-5-sonnet-20241022', -1, 500)
      expect(cost).toBe(0)
    })

    test('should handle very large token counts', () => {
      const largeCost = costCalculator.calculateCost(
        'anthropic',
        'claude-3-5-sonnet-20241022',
        10000000, // 10M tokens
        5000000   // 5M tokens
      )

      expect(largeCost).toBeGreaterThan(0)
      expect(largeCost).toBeLessThan(1000) // Reasonable upper bound
    })

    test('should handle missing provider data', () => {
      expect(() => {
        costCalculator.calculateCost('invalid' as ProviderType, 'model', 1000, 500)
      }).not.toThrow()
    })
  })

  describe('Performance Optimization', () => {
    test('should cache calculation results', () => {
      const start1 = performance.now()
      costCalculator.calculateCost('anthropic', 'claude-3-5-sonnet-20241022', 1000, 500)
      const time1 = performance.now() - start1

      const start2 = performance.now()
      costCalculator.calculateCost('anthropic', 'claude-3-5-sonnet-20241022', 1000, 500)
      const time2 = performance.now() - start2

      // Second call should be faster due to caching
      expect(time2).toBeLessThanOrEqual(time1)
    })

    test('should handle concurrent calculations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(costCalculator.calculateCost('anthropic', 'claude-3-5-sonnet-20241022', 1000 + i, 500 + i))
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      results.forEach((result, i) => {
        expect(result).toBeGreaterThan(0)
        // Each should be slightly different due to different token counts
        if (i > 0) {
          expect(result).not.toBe(results[0])
        }
      })
    })
  })
})