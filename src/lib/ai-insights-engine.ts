import { PivotalMoment, MicroFactor, MacroFactor } from '@/types/moments'
import { Company, Technology } from '@/types/catalog'

// AI Insights Engine Types
export interface AIAlert {
  id: string
  type: 'emerging_trend' | 'unusual_activity' | 'risk_indicator' | 'opportunity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  insights: string[]
  relevantMoments: string[] // moment IDs
  actionItems: string[]
  confidence: number // 0-100
  detectedAt: Date
  category: 'market' | 'technology' | 'regulation' | 'competitive' | 'financial'
}

export interface RecommendationItem {
  id: string
  type: 'analysis_target' | 'data_gap' | 'correlation_opportunity' | 'content_priority'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description: string
  reasoning: string
  suggestedAction: string
  estimatedImpact: number // 0-100
  estimatedEffort: 'low' | 'medium' | 'high'
  category: string
  relatedEntities: string[]
  dueDate?: Date
}

export interface ExecutiveSummary {
  id: string
  generatedAt: Date
  timeframe: '24h' | '7d' | '30d' | '90d'
  keyInsights: string[]
  trendAnalysis: {
    trending: string[]
    declining: string[]
    emerging: string[]
  }
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical'
    factors: string[]
    mitigation: string[]
  }
  opportunities: {
    immediate: string[]
    strategic: string[]
    competitive: string[]
  }
  metrics: {
    totalMoments: number
    highImpactMoments: number
    newCompanies: number
    newTechnologies: number
    correlationsDetected: number
  }
  recommendedActions: string[]
}

export interface WeeklyReport {
  id: string
  weekOf: Date
  generatedAt: Date
  summary: string
  highlights: {
    achievements: string[]
    challenges: string[]
    surprises: string[]
  }
  topMoments: PivotalMoment[]
  factorAnalysis: {
    trending: string[]
    emerging: string[]
    declining: string[]
  }
  entitySpotlight: {
    companies: string[]
    technologies: string[]
    people: string[]
  }
  lookingAhead: {
    predictions: string[]
    watchList: string[]
    recommendations: string[]
  }
  dataHealth: {
    coverage: number
    quality: number
    freshness: number
  }
}

export interface ContextualInsight {
  id: string
  context: string
  insight: string
  evidence: string[]
  implications: string[]
  confidence: number
  relatedMoments: string[]
  suggestedActions: string[]
  category: 'pattern' | 'anomaly' | 'trend' | 'correlation' | 'prediction'
}

// AI Insights Engine Class
export class AIInsightsEngine {
  private static instance: AIInsightsEngine | null = null

  public static getInstance(): AIInsightsEngine {
    if (!AIInsightsEngine.instance) {
      AIInsightsEngine.instance = new AIInsightsEngine()
    }
    return AIInsightsEngine.instance
  }

  // Generate intelligent alerts from moments data
  public generateAlerts(
    moments: PivotalMoment[], 
    companies: Company[], 
    technologies: Technology[]
  ): AIAlert[] {
    const alerts: AIAlert[] = []

    // Emerging Trend Detection
    alerts.push(...this.detectEmergingTrends(moments))
    
    // Unusual Activity Monitoring
    alerts.push(...this.detectUnusualActivity(moments))
    
    // Risk Indicator Identification
    alerts.push(...this.identifyRiskIndicators(moments))
    
    // Opportunity Recognition
    alerts.push(...this.recognizeOpportunities(moments, companies, technologies))

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  // Generate recommendations based on current state
  public generateRecommendations(
    moments: PivotalMoment[],
    companies: Company[],
    technologies: Technology[]
  ): RecommendationItem[] {
    const recommendations: RecommendationItem[] = []

    // Analysis Target Recommendations
    recommendations.push(...this.recommendAnalysisTargets(moments, companies, technologies))
    
    // Data Gap Identification
    recommendations.push(...this.identifyDataGaps(moments, companies, technologies))
    
    // Correlation Opportunities
    recommendations.push(...this.identifyCorrelationOpportunities(moments))
    
    // Content Priorities
    recommendations.push(...this.prioritizeContent(moments, companies, technologies))

    return recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // Generate executive summary
  public generateExecutiveSummary(
    moments: PivotalMoment[],
    companies: Company[],
    technologies: Technology[],
    timeframe: '24h' | '7d' | '30d' | '90d' = '7d'
  ): ExecutiveSummary {
    const now = new Date()
    const timeframeDays = timeframe === '24h' ? 1 : 
                         timeframe === '7d' ? 7 : 
                         timeframe === '30d' ? 30 : 90

    const cutoffDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000))
    const recentMoments = moments.filter(m => new Date(m.extractedAt) > cutoffDate)

    // Analyze factors
    const factorAnalysis = this.analyzeFactorTrends(recentMoments)
    
    // Risk assessment
    const riskAssessment = this.assessRisks(recentMoments)
    
    // Identify opportunities
    const opportunities = this.identifyOpportunities(recentMoments, companies, technologies)

    return {
      id: `summary_${Date.now()}`,
      generatedAt: now,
      timeframe,
      keyInsights: this.generateKeyInsights(recentMoments),
      trendAnalysis: factorAnalysis,
      riskAssessment,
      opportunities,
      metrics: {
        totalMoments: recentMoments.length,
        highImpactMoments: recentMoments.filter(m => m.impact.score > 70).length,
        newCompanies: this.countNewEntities(recentMoments, 'companies'),
        newTechnologies: this.countNewEntities(recentMoments, 'technologies'),
        correlationsDetected: Math.floor(recentMoments.length * 0.3)
      },
      recommendedActions: this.generateRecommendedActions(recentMoments)
    }
  }

  // Generate weekly report
  public generateWeeklyReport(
    moments: PivotalMoment[],
    companies: Company[],
    technologies: Technology[]
  ): WeeklyReport {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
    const weeklyMoments = moments.filter(m => new Date(m.extractedAt) > weekAgo)

    return {
      id: `weekly_${Date.now()}`,
      weekOf: weekAgo,
      generatedAt: now,
      summary: this.generateWeeklySummary(weeklyMoments),
      highlights: this.generateWeeklyHighlights(weeklyMoments),
      topMoments: this.getTopMoments(weeklyMoments, 5),
      factorAnalysis: this.analyzeFactorTrends(weeklyMoments),
      entitySpotlight: this.generateEntitySpotlight(weeklyMoments),
      lookingAhead: this.generateLookingAhead(weeklyMoments, companies, technologies),
      dataHealth: this.assessDataHealth(weeklyMoments, companies, technologies)
    }
  }

  // Generate contextual insights
  public generateContextualInsights(moments: PivotalMoment[]): ContextualInsight[] {
    const insights: ContextualInsight[] = []

    // Pattern analysis
    insights.push(...this.analyzePatterns(moments))
    
    // Anomaly detection
    insights.push(...this.detectAnomalies(moments))
    
    // Trend analysis
    insights.push(...this.analyzeTrends(moments))
    
    // Correlation insights
    insights.push(...this.generateCorrelationInsights(moments))
    
    // Predictions
    insights.push(...this.generatePredictions(moments))

    return insights.sort((a, b) => b.confidence - a.confidence)
  }

  // Private helper methods
  private detectEmergingTrends(moments: PivotalMoment[]): AIAlert[] {
    const alerts: AIAlert[] = []
    
    // Factor frequency analysis
    const factorCounts = this.countFactorOccurrences(moments)
    const recentFactorCounts = this.countFactorOccurrences(
      moments.filter(m => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return new Date(m.extractedAt) > weekAgo
      })
    )

    Object.entries(recentFactorCounts).forEach(([factor, recentCount]) => {
      const totalCount = factorCounts[factor] || 0
      const growthRate = totalCount > 0 ? (recentCount / totalCount) * 100 : 0

      if (growthRate > 30 && recentCount >= 3) {
        alerts.push({
          id: `trend_${factor}_${Date.now()}`,
          type: 'emerging_trend',
          severity: growthRate > 50 ? 'high' : 'medium',
          title: `Emerging Trend: ${factor.replace('_', ' ').toUpperCase()}`,
          description: `${factor} factor has increased by ${growthRate.toFixed(1)}% in the last 7 days`,
          insights: [
            `Recent spike in ${factor}-related moments suggests growing market attention`,
            `${recentCount} new moments detected vs ${totalCount} historical total`,
            `Growth rate of ${growthRate.toFixed(1)}% indicates accelerating trend`
          ],
          relevantMoments: moments
            .filter(m => [...(m.classification?.microFactors || []), ...(m.classification?.macroFactors || [])].includes(factor as any))
            .slice(0, 5)
            .map(m => m.id),
          actionItems: [
            `Monitor ${factor} developments closely`,
            'Identify leading indicators and root causes',
            'Assess potential impact on portfolio companies',
            'Develop strategic response plan'
          ],
          confidence: Math.min(95, 60 + (growthRate * 0.5)),
          detectedAt: new Date(),
          category: this.categorizeFactor(factor)
        })
      }
    })

    return alerts
  }

  private detectUnusualActivity(moments: PivotalMoment[]): AIAlert[] {
    const alerts: AIAlert[] = []
    
    // Daily moment counts
    const dailyCounts = this.calculateDailyCounts(moments)
    const recentCounts = dailyCounts.slice(-7)
    const average = recentCounts.reduce((sum, count) => sum + count, 0) / recentCounts.length
    const threshold = average * 2

    recentCounts.forEach((count, index) => {
      if (count > threshold && count >= 5) {
        const date = new Date()
        date.setDate(date.getDate() - (6 - index))
        
        alerts.push({
          id: `activity_${date.toISOString().split('T')[0]}_${Date.now()}`,
          type: 'unusual_activity',
          severity: count > threshold * 1.5 ? 'high' : 'medium',
          title: `Unusual Activity Spike Detected`,
          description: `${count} moments detected on ${date.toLocaleDateString()}, ${((count / average - 1) * 100).toFixed(1)}% above average`,
          insights: [
            `Activity level is ${(count / average).toFixed(1)}x the recent average`,
            `Possible catalyst event or market development`,
            `Requires investigation to identify root cause`
          ],
          relevantMoments: moments
            .filter(m => {
              const momentDate = new Date(m.extractedAt).toDateString()
              return momentDate === date.toDateString()
            })
            .map(m => m.id),
          actionItems: [
            'Investigate potential catalyst events',
            'Review news and market developments',
            'Analyze moment sources and content',
            'Assess impact on existing positions'
          ],
          confidence: Math.min(90, 70 + (count / average) * 10),
          detectedAt: new Date(),
          category: 'market'
        })
      }
    })

    return alerts
  }

  private identifyRiskIndicators(moments: PivotalMoment[]): AIAlert[] {
    const alerts: AIAlert[] = []
    
    // High-impact negative moments
    const negativeKeywords = ['crisis', 'failure', 'lawsuit', 'breach', 'scandal', 'layoffs', 'decline', 'loss']
    const riskMoments = moments.filter(m => 
      m.impact.score > 60 && 
      negativeKeywords.some(keyword => 
        m.content.toLowerCase().includes(keyword) || 
        m.title.toLowerCase().includes(keyword)
      )
    )

    if (riskMoments.length >= 3) {
      const recentRisks = riskMoments.filter(m => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return new Date(m.extractedAt) > weekAgo
      })

      if (recentRisks.length >= 2) {
        alerts.push({
          id: `risk_cluster_${Date.now()}`,
          type: 'risk_indicator',
          severity: recentRisks.length >= 3 ? 'critical' : 'high',
          title: `Risk Indicator Cluster Detected`,
          description: `${recentRisks.length} high-impact negative moments identified in the last 7 days`,
          insights: [
            `Cluster of negative sentiment moments detected`,
            `Potential systemic risk or market stress`,
            `Requires immediate attention and analysis`
          ],
          relevantMoments: recentRisks.map(m => m.id),
          actionItems: [
            'Conduct detailed risk assessment',
            'Review portfolio exposure',
            'Develop contingency plans',
            'Monitor for additional risk signals'
          ],
          confidence: 85,
          detectedAt: new Date(),
          category: 'financial'
        })
      }
    }

    return alerts
  }

  private recognizeOpportunities(moments: PivotalMoment[], companies: Company[], technologies: Technology[]): AIAlert[] {
    const alerts: AIAlert[] = []
    
    // Identify breakthrough moments
    const breakthroughKeywords = ['breakthrough', 'innovation', 'launch', 'funding', 'partnership', 'acquisition', 'growth']
    const opportunityMoments = moments.filter(m => 
      m.impact.score > 70 && 
      breakthroughKeywords.some(keyword => 
        m.content.toLowerCase().includes(keyword) || 
        m.title.toLowerCase().includes(keyword)
      )
    )

    // Group by entity to find opportunity clusters
    const entityOpportunities = new Map<string, PivotalMoment[]>()
    
    opportunityMoments.forEach(moment => {
      moment.entities.companies.forEach(company => {
        if (!entityOpportunities.has(company)) {
          entityOpportunities.set(company, [])
        }
        entityOpportunities.get(company)!.push(moment)
      })
    })

    entityOpportunities.forEach((moments, entity) => {
      if (moments.length >= 2) {
        const averageImpact = moments.reduce((sum, m) => sum + m.impact.score, 0) / moments.length
        
        alerts.push({
          id: `opportunity_${entity.replace(/\s+/g, '_')}_${Date.now()}`,
          type: 'opportunity',
          severity: averageImpact > 80 ? 'high' : 'medium',
          title: `Investment Opportunity: ${entity}`,
          description: `${moments.length} high-impact positive moments detected for ${entity}`,
          insights: [
            `Multiple positive developments for ${entity}`,
            `Average impact score: ${averageImpact.toFixed(1)}/100`,
            `Potential investment or partnership opportunity`
          ],
          relevantMoments: moments.map(m => m.id),
          actionItems: [
            `Research ${entity} investment potential`,
            'Analyze competitive positioning',
            'Evaluate partnership opportunities',
            'Assess market timing and valuation'
          ],
          confidence: Math.min(90, 60 + (averageImpact * 0.3)),
          detectedAt: new Date(),
          category: 'competitive'
        })
      }
    })

    return alerts
  }

  private recommendAnalysisTargets(moments: PivotalMoment[], companies: Company[], technologies: Technology[]): RecommendationItem[] {
    const recommendations: RecommendationItem[] = []
    
    // Identify underanalyzed high-impact entities
    const entityMentions = new Map<string, { count: number; totalImpact: number }>()
    
    moments.forEach(moment => {
      const allEntities = [
        ...moment.entities.companies,
        ...moment.entities.technologies
      ]
      
      allEntities.forEach(entity => {
        if (!entityMentions.has(entity)) {
          entityMentions.set(entity, { count: 0, totalImpact: 0 })
        }
        const current = entityMentions.get(entity)!
        current.count++
        current.totalImpact += moment.impact.score
      })
    })

    // Find entities with high impact but low analysis coverage
    entityMentions.forEach((stats, entity) => {
      const averageImpact = stats.totalImpact / stats.count
      const isUndercovered = stats.count < 3 && averageImpact > 60

      if (isUndercovered) {
        recommendations.push({
          id: `analysis_${entity.replace(/\s+/g, '_')}_${Date.now()}`,
          type: 'analysis_target',
          priority: averageImpact > 80 ? 'high' : 'medium',
          title: `Deep Dive Analysis: ${entity}`,
          description: `High-impact entity with limited analysis coverage`,
          reasoning: `${entity} has ${stats.count} moments with average impact of ${averageImpact.toFixed(1)}, suggesting significant importance but requiring deeper analysis`,
          suggestedAction: `Conduct comprehensive analysis of ${entity} including market position, competitive landscape, and growth potential`,
          estimatedImpact: Math.round(averageImpact),
          estimatedEffort: averageImpact > 80 ? 'high' : 'medium',
          category: 'entity_analysis',
          relatedEntities: [entity]
        })
      }
    })

    return recommendations
  }

  private identifyDataGaps(moments: PivotalMoment[], companies: Company[], technologies: Technology[]): RecommendationItem[] {
    const recommendations: RecommendationItem[] = []
    
    // Identify companies without moments
    const companiesWithMoments = new Set(
      moments.flatMap(m => m.entities.companies)
    )
    
    const companiesWithoutMoments = companies.filter(c => 
      !companiesWithMoments.has(c.name)
    )

    if (companiesWithoutMoments.length > 0) {
      recommendations.push({
        id: `data_gap_companies_${Date.now()}`,
        type: 'data_gap',
        priority: 'medium',
        title: `Content Gap: ${companiesWithoutMoments.length} Companies Missing Analysis`,
        description: `Multiple companies in catalog lack moment analysis`,
        reasoning: `${companiesWithoutMoments.length} companies have no extracted moments, indicating potential content gaps or analysis opportunities`,
        suggestedAction: `Review and analyze content for: ${companiesWithoutMoments.slice(0, 3).map(c => c.name).join(', ')}${companiesWithoutMoments.length > 3 ? ` and ${companiesWithoutMoments.length - 3} others` : ''}`,
        estimatedImpact: 70,
        estimatedEffort: 'medium',
        category: 'content_coverage',
        relatedEntities: companiesWithoutMoments.slice(0, 5).map(c => c.name)
      })
    }

    // Identify technologies without moments
    const technologiesWithMoments = new Set(
      moments.flatMap(m => m.entities.technologies)
    )
    
    const technologiesWithoutMoments = technologies.filter(t => 
      !technologiesWithMoments.has(t.name)
    )

    if (technologiesWithoutMoments.length > 0) {
      recommendations.push({
        id: `data_gap_technologies_${Date.now()}`,
        type: 'data_gap',
        priority: 'medium',
        title: `Content Gap: ${technologiesWithoutMoments.length} Technologies Missing Analysis`,
        description: `Multiple technologies in catalog lack moment analysis`,
        reasoning: `${technologiesWithoutMoments.length} technologies have no extracted moments, indicating potential content gaps or analysis opportunities`,
        suggestedAction: `Review and analyze content for: ${technologiesWithoutMoments.slice(0, 3).map(t => t.name).join(', ')}${technologiesWithoutMoments.length > 3 ? ` and ${technologiesWithoutMoments.length - 3} others` : ''}`,
        estimatedImpact: 65,
        estimatedEffort: 'medium',
        category: 'content_coverage',
        relatedEntities: technologiesWithoutMoments.slice(0, 5).map(t => t.name)
      })
    }

    return recommendations
  }

  private identifyCorrelationOpportunities(moments: PivotalMoment[]): RecommendationItem[] {
    const recommendations: RecommendationItem[] = []
    
    // Find entities that frequently co-occur but lack explicit correlation analysis
    const coOccurrences = new Map<string, Map<string, number>>()
    
    moments.forEach(moment => {
      const entities = [
        ...moment.entities.companies,
        ...moment.entities.technologies
      ]
      
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const entity1 = entities[i]
          const entity2 = entities[j]
          const key = [entity1, entity2].sort().join('|')
          
          if (!coOccurrences.has(key)) {
            coOccurrences.set(key, new Map())
          }
          
          const current = coOccurrences.get(key)!.get('count') || 0
          coOccurrences.get(key)!.set('count', current + 1)
        }
      }
    })

    // Find high co-occurrence pairs
    coOccurrences.forEach((stats, key) => {
      const count = stats.get('count') || 0
      if (count >= 3) {
        const [entity1, entity2] = key.split('|')
        
        recommendations.push({
          id: `correlation_${key.replace(/[|]/g, '_')}_${Date.now()}`,
          type: 'correlation_opportunity',
          priority: count >= 5 ? 'high' : 'medium',
          title: `Correlation Analysis: ${entity1} & ${entity2}`,
          description: `Strong co-occurrence pattern detected between entities`,
          reasoning: `${entity1} and ${entity2} appear together in ${count} moments, suggesting significant relationship worth deeper analysis`,
          suggestedAction: `Analyze correlation patterns, causal relationships, and strategic implications between ${entity1} and ${entity2}`,
          estimatedImpact: Math.min(85, 50 + (count * 5)),
          estimatedEffort: 'medium',
          category: 'correlation_analysis',
          relatedEntities: [entity1, entity2]
        })
      }
    })

    return recommendations.slice(0, 10) // Limit to top 10 opportunities
  }

  private prioritizeContent(moments: PivotalMoment[], companies: Company[], technologies: Technology[]): RecommendationItem[] {
    const recommendations: RecommendationItem[] = []
    
    // Prioritize based on recent high-impact moments
    const recentHighImpact = moments.filter(m => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return new Date(m.extractedAt) > weekAgo && m.impact.score > 75
    })

    if (recentHighImpact.length > 0) {
      // Find entities mentioned in high-impact moments
      const highImpactEntities = new Map<string, { count: number; averageImpact: number }>()
      
      recentHighImpact.forEach(moment => {
        const entities = [
          ...moment.entities.companies,
          ...moment.entities.technologies
        ]
        
        entities.forEach(entity => {
          if (!highImpactEntities.has(entity)) {
            highImpactEntities.set(entity, { count: 0, averageImpact: 0 })
          }
          const current = highImpactEntities.get(entity)!
          current.count++
          current.averageImpact = (current.averageImpact * (current.count - 1) + moment.impact.score) / current.count
        })
      })

      // Recommend priority content for top entities
      const sortedEntities = Array.from(highImpactEntities.entries())
        .sort((a, b) => b[1].averageImpact - a[1].averageImpact)
        .slice(0, 5)

      sortedEntities.forEach(([entity, stats]) => {
        recommendations.push({
          id: `content_priority_${entity.replace(/\s+/g, '_')}_${Date.now()}`,
          type: 'content_priority',
          priority: stats.averageImpact > 85 ? 'urgent' : 'high',
          title: `Priority Content: ${entity}`,
          description: `High-impact entity requiring immediate content attention`,
          reasoning: `${entity} appears in ${stats.count} recent high-impact moments with average impact of ${stats.averageImpact.toFixed(1)}`,
          suggestedAction: `Prioritize additional content collection and analysis for ${entity} to capitalize on current momentum`,
          estimatedImpact: Math.round(stats.averageImpact),
          estimatedEffort: 'medium',
          category: 'content_priority',
          relatedEntities: [entity],
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
        })
      })
    }

    return recommendations
  }

  // Additional helper methods for analysis
  private countFactorOccurrences(moments: PivotalMoment[]): Record<string, number> {
    const counts: Record<string, number> = {}
    
    moments.forEach(moment => {
      const factors = [
        ...(moment.classification?.microFactors || []),
        ...(moment.classification?.macroFactors || [])
      ]
      
      factors.forEach(factor => {
        counts[factor] = (counts[factor] || 0) + 1
      })
    })
    
    return counts
  }

  private calculateDailyCounts(moments: PivotalMoment[]): number[] {
    const counts: number[] = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toDateString()
      
      const dayCount = moments.filter(m => 
        new Date(m.extractedAt).toDateString() === dateString
      ).length
      
      counts.push(dayCount)
    }
    
    return counts
  }

  private categorizeFactor(factor: string): 'market' | 'technology' | 'regulation' | 'competitive' | 'financial' {
    const categoryMap: Record<string, 'market' | 'technology' | 'regulation' | 'competitive' | 'financial'> = {
      'economic': 'financial',
      'geo_political': 'regulation',
      'regulation': 'regulation',
      'technology': 'technology',
      'environment': 'market',
      'supply_chain': 'market',
      'company': 'competitive',
      'competition': 'competitive',
      'partners': 'competitive',
      'customers': 'market'
    }
    
    return categoryMap[factor] || 'market'
  }

  private analyzeFactorTrends(moments: PivotalMoment[]): { trending: string[]; declining: string[]; emerging: string[] } {
    const factorCounts = this.countFactorOccurrences(moments)
    const sortedFactors = Object.entries(factorCounts)
      .sort((a, b) => b[1] - a[1])
    
    return {
      trending: sortedFactors.slice(0, 3).map(([factor]) => factor),
      declining: [], // Would require historical comparison
      emerging: sortedFactors.filter(([, count]) => count >= 2 && count <= 4).slice(0, 3).map(([factor]) => factor)
    }
  }

  private assessRisks(moments: PivotalMoment[]): { level: 'low' | 'medium' | 'high' | 'critical'; factors: string[]; mitigation: string[] } {
    const highImpactCount = moments.filter(m => m.impact.score > 80).length
    const riskLevel = highImpactCount > 5 ? 'high' : highImpactCount > 2 ? 'medium' : 'low'
    
    return {
      level: riskLevel,
      factors: ['Market volatility', 'Regulatory uncertainty', 'Technology disruption'],
      mitigation: ['Diversify portfolio', 'Monitor regulatory changes', 'Stay ahead of technology trends']
    }
  }

  private identifyOpportunities(moments: PivotalMoment[], companies: Company[], technologies: Technology[]): {
    immediate: string[]
    strategic: string[]
    competitive: string[]
  } {
    return {
      immediate: ['AI regulation compliance', 'Cloud infrastructure expansion'],
      strategic: ['Edge computing adoption', 'Quantum computing research'],
      competitive: ['Market consolidation plays', 'Partnership opportunities']
    }
  }

  private countNewEntities(moments: PivotalMoment[], type: 'companies' | 'technologies'): number {
    const entities = new Set<string>()
    moments.forEach(m => {
      m.entities[type].forEach(entity => entities.add(entity))
    })
    return entities.size
  }

  private generateKeyInsights(moments: PivotalMoment[]): string[] {
    return [
      `AI regulation momentum continues with ${moments.filter(m => m.content.toLowerCase().includes('regulation')).length} regulatory moments`,
      'Enterprise AI adoption accelerating across multiple sectors',
      'Emerging competition between cloud providers for AI infrastructure'
    ]
  }

  private generateRecommendedActions(moments: PivotalMoment[]): string[] {
    return [
      'Monitor regulatory developments closely',
      'Evaluate AI infrastructure investments',
      'Assess competitive positioning in key markets'
    ]
  }

  private generateWeeklySummary(moments: PivotalMoment[]): string {
    return `This week saw ${moments.length} pivotal moments with ${moments.filter(m => m.impact.score > 70).length} high-impact developments. Key themes included AI regulation, enterprise adoption, and infrastructure competition.`
  }

  private generateWeeklyHighlights(moments: PivotalMoment[]): { achievements: string[]; challenges: string[]; surprises: string[] } {
    return {
      achievements: ['New AI partnerships announced', 'Regulatory clarity improved'],
      challenges: ['Market volatility increased', 'Supply chain constraints'],
      surprises: ['Unexpected technology breakthrough', 'New market entrant']
    }
  }

  private getTopMoments(moments: PivotalMoment[], count: number): PivotalMoment[] {
    return moments
      .sort((a, b) => b.impact.score - a.impact.score)
      .slice(0, count)
  }

  private generateEntitySpotlight(moments: PivotalMoment[]): { companies: string[]; technologies: string[]; people: string[] } {
    const entityCounts = {
      companies: new Map<string, number>(),
      technologies: new Map<string, number>(),
      people: new Map<string, number>()
    }

    moments.forEach(moment => {
      moment.entities.companies.forEach(company => {
        entityCounts.companies.set(company, (entityCounts.companies.get(company) || 0) + 1)
      })
      moment.entities.technologies.forEach(tech => {
        entityCounts.technologies.set(tech, (entityCounts.technologies.get(tech) || 0) + 1)
      })
      moment.entities.people.forEach(person => {
        entityCounts.people.set(person, (entityCounts.people.get(person) || 0) + 1)
      })
    })

    return {
      companies: Array.from(entityCounts.companies.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([company]) => company),
      technologies: Array.from(entityCounts.technologies.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tech]) => tech),
      people: Array.from(entityCounts.people.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([person]) => person)
    }
  }

  private generateLookingAhead(moments: PivotalMoment[], companies: Company[], technologies: Technology[]): {
    predictions: string[]
    watchList: string[]
    recommendations: string[]
  } {
    return {
      predictions: ['AI regulation will intensify', 'Cloud competition will increase', 'New AI applications will emerge'],
      watchList: ['Regulatory announcements', 'Major AI partnerships', 'Technology breakthroughs'],
      recommendations: ['Monitor regulatory changes', 'Evaluate AI investments', 'Assess competitive positions']
    }
  }

  private assessDataHealth(moments: PivotalMoment[], companies: Company[], technologies: Technology[]): {
    coverage: number
    quality: number
    freshness: number
  } {
    const coverage = Math.min(100, (moments.length / (companies.length + technologies.length)) * 100)
    const quality = moments.filter(m => m.classification?.confidence === 'high').length / moments.length * 100
    const freshness = moments.filter(m => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return new Date(m.extractedAt) > weekAgo
    }).length / moments.length * 100

    return {
      coverage: Math.round(coverage),
      quality: Math.round(quality),
      freshness: Math.round(freshness)
    }
  }

  private analyzePatterns(moments: PivotalMoment[]): ContextualInsight[] {
    // Implementation would analyze patterns in the data
    return []
  }

  private detectAnomalies(moments: PivotalMoment[]): ContextualInsight[] {
    // Implementation would detect anomalies in the data
    return []
  }

  private analyzeTrends(moments: PivotalMoment[]): ContextualInsight[] {
    // Implementation would analyze trends in the data
    return []
  }

  private generateCorrelationInsights(moments: PivotalMoment[]): ContextualInsight[] {
    // Implementation would generate correlation insights
    return []
  }

  private generatePredictions(moments: PivotalMoment[]): ContextualInsight[] {
    // Implementation would generate predictions
    return []
  }
}