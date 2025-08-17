import { QueryIntent, QueryResults, QueryContext } from '@/types/natural-language-query'
import { PivotalMoment, MicroFactor, MacroFactor } from '@/types/moments'
import { Company, Technology } from '@/types/catalog'
import { format, parseISO, isAfter, isBefore, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

/**
 * Natural Language Query Executor
 * Processes parsed query intents and generates results
 */
export class QueryExecutor {
  private moments: PivotalMoment[] = []
  private companies: Company[] = []
  private technologies: Technology[] = []

  constructor(moments: PivotalMoment[], companies: Company[], technologies: Technology[]) {
    this.moments = moments
    this.companies = companies
    this.technologies = technologies
  }

  /**
   * Execute a parsed query intent and generate results
   */
  async executeQuery(intent: QueryIntent, context: QueryContext): Promise<QueryResults> {
    const startTime = Date.now()
    
    try {
      let results: QueryResults

      switch (intent.type) {
        case 'search':
          results = await this.executeSearch(intent, context)
          break
        case 'analysis':
          results = await this.executeAnalysis(intent, context)
          break
        case 'comparison':
          results = await this.executeComparison(intent, context)
          break
        case 'trend':
          results = await this.executeTrend(intent, context)
          break
        case 'pattern':
          results = await this.executePattern(intent, context)
          break
        case 'filter':
          results = await this.executeFilter(intent, context)
          break
        case 'aggregate':
          results = await this.executeAggregate(intent, context)
          break
        case 'temporal':
          results = await this.executeTemporal(intent, context)
          break
        default:
          results = await this.executeSearch(intent, context)
      }

      results.processingTime = Date.now() - startTime
      return results

    } catch (error) {
      return {
        type: 'summary',
        data: {
          summary: `Error processing query: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        explanation: 'An error occurred while processing your query. Please try rephrasing your question.',
        confidence: 0,
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Execute search query
   */
  private async executeSearch(intent: QueryIntent, context: QueryContext): Promise<QueryResults> {
    let filteredMoments = [...this.moments]

    // Apply entity filters
    filteredMoments = this.filterByEntities(filteredMoments, intent.entities)
    
    // Apply timeframe filter
    if (intent.timeframe) {
      filteredMoments = this.filterByTimeframe(filteredMoments, intent.timeframe)
    }

    // Apply factor filters
    if (intent.factors) {
      filteredMoments = this.filterByFactors(filteredMoments, intent.factors)
    }

    // Apply general filters
    if (intent.filters) {
      filteredMoments = this.applyFilters(filteredMoments, intent.filters)
    }

    // Sort by relevance (impact score, then date)
    filteredMoments.sort((a, b) => {
      if (a.impact.score !== b.impact.score) {
        return b.impact.score - a.impact.score
      }
      return new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime()
    })

    // Generate explanation
    const explanation = this.generateSearchExplanation(intent, filteredMoments.length)

    return {
      type: 'moments',
      data: {
        moments: filteredMoments,
        metrics: {
          totalFound: filteredMoments.length,
          averageImpact: this.calculateAverageImpact(filteredMoments),
          highImpactCount: filteredMoments.filter(m => m.impact.score >= 70).length
        }
      },
      visualization: this.generateVisualization(intent, filteredMoments),
      explanation,
      confidence: intent.confidence,
      processingTime: 0 // Will be set by executor
    }
  }

  /**
   * Execute analysis query
   */
  private async executeAnalysis(intent: QueryIntent, context: QueryContext): Promise<QueryResults> {
    let filteredMoments = [...this.moments]

    // Apply filters
    filteredMoments = this.filterByEntities(filteredMoments, intent.entities)
    if (intent.timeframe) {
      filteredMoments = this.filterByTimeframe(filteredMoments, intent.timeframe)
    }

    // Generate insights
    const insights = this.generateInsights(filteredMoments, intent)
    const correlations = this.findCorrelations(filteredMoments)
    const patterns = this.identifyPatterns(filteredMoments)

    const explanation = `Analysis of ${filteredMoments.length} moments revealed ${insights.length} key insights and ${correlations.length} correlations.`

    return {
      type: 'insights',
      data: {
        moments: filteredMoments,
        insights: [...insights, ...patterns],
        correlations,
        metrics: {
          totalAnalyzed: filteredMoments.length,
          insightsGenerated: insights.length,
          correlationsFound: correlations.length
        }
      },
      visualization: this.generateVisualization(intent, filteredMoments),
      explanation,
      confidence: intent.confidence,
      processingTime: 0 // Will be set by executor
    }
  }

  /**
   * Execute comparison query
   */
  private async executeComparison(intent: QueryIntent, context: QueryContext): Promise<QueryResults> {
    const entities = intent.entities
    const comparisonData: Record<string, any> = {}

    // Compare entities across different dimensions
    for (const entityType of ['companies', 'technologies'] as const) {
      if (entities[entityType].length >= 2) {
        for (const entity of entities[entityType]) {
          const entityMoments = this.filterByEntityName(this.moments, entity, entityType)
          comparisonData[entity] = {
            momentCount: entityMoments.length,
            averageImpact: this.calculateAverageImpact(entityMoments),
            highImpactCount: entityMoments.filter(m => m.impact.score >= 70).length,
            recentActivity: entityMoments.filter(m => 
              isAfter(new Date(m.extractedAt), subDays(new Date(), 30))
            ).length,
            topFactors: this.getTopFactors(entityMoments)
          }
        }
      }
    }

    const explanation = `Compared ${Object.keys(comparisonData).length} entities across multiple dimensions including impact, activity, and key factors.`

    return {
      type: 'comparison',
      data: {
        metrics: comparisonData,
        insights: this.generateComparisonInsights(comparisonData)
      },
      visualization: {
        type: 'bar',
        config: { comparison: true },
        data: Object.entries(comparisonData).map(([entity, data]) => ({
          entity,
          ...data
        }))
      },
      explanation,
      confidence: intent.confidence,
      processingTime: 0 // Will be set by executor
    }
  }

  /**
   * Execute trend analysis
   */
  private async executeTrend(intent: QueryIntent, context: QueryContext): Promise<QueryResults> {
    let filteredMoments = this.filterByEntities(this.moments, intent.entities)
    
    if (intent.timeframe) {
      filteredMoments = this.filterByTimeframe(filteredMoments, intent.timeframe)
    }

    // Group moments by time periods
    const trendData = this.groupMomentsByTimePeriod(filteredMoments, 'week')
    const trendInsights = this.analyzeTrends(trendData)

    const explanation = `Trend analysis of ${filteredMoments.length} moments shows ${trendInsights.length} significant trends over time.`

    return {
      type: 'insights',
      data: {
        moments: filteredMoments,
        insights: trendInsights,
        metrics: {
          totalPeriods: Object.keys(trendData).length,
          peakActivity: Math.max(...Object.values(trendData).map(d => d.count)),
          averageActivity: Object.values(trendData).reduce((sum, d) => sum + d.count, 0) / Object.keys(trendData).length
        }
      },
      visualization: {
        type: 'line',
        config: { trend: true },
        data: Object.entries(trendData).map(([period, data]) => ({
          period,
          count: data.count,
          averageImpact: data.averageImpact
        }))
      },
      explanation,
      confidence: intent.confidence,
      processingTime: 0 // Will be set by executor
    }
  }

  /**
   * Execute pattern discovery
   */
  private async executePattern(intent: QueryIntent, context: QueryContext): Promise<QueryResults> {
    let filteredMoments = this.filterByEntities(this.moments, intent.entities)
    
    const patterns = this.identifyPatterns(filteredMoments)
    const clusters = this.findClusters(filteredMoments)
    const sequences = this.findSequentialPatterns(filteredMoments)

    const allInsights = [...patterns, ...clusters, ...sequences]
    const explanation = `Pattern analysis discovered ${allInsights.length} significant patterns in ${filteredMoments.length} moments.`

    return {
      type: 'insights',
      data: {
        moments: filteredMoments,
        insights: allInsights,
        metrics: {
          patternsFound: patterns.length,
          clustersIdentified: clusters.length,
          sequencesDetected: sequences.length
        }
      },
      visualization: {
        type: 'network',
        config: { patterns: true },
        data: this.generateNetworkData(filteredMoments)
      },
      explanation,
      confidence: intent.confidence,
      processingTime: 0 // Will be set by executor
    }
  }

  /**
   * Execute filter query
   */
  private async executeFilter(intent: QueryIntent, context: QueryContext): Promise<QueryResults> {
    let filteredMoments = [...this.moments]

    // Apply all filters
    filteredMoments = this.filterByEntities(filteredMoments, intent.entities)
    
    if (intent.timeframe) {
      filteredMoments = this.filterByTimeframe(filteredMoments, intent.timeframe)
    }
    
    if (intent.factors) {
      filteredMoments = this.filterByFactors(filteredMoments, intent.factors)
    }
    
    if (intent.filters) {
      filteredMoments = this.applyFilters(filteredMoments, intent.filters)
    }

    const explanation = `Applied filters and found ${filteredMoments.length} matching moments out of ${this.moments.length} total.`

    return {
      type: 'moments',
      data: {
        moments: filteredMoments,
        metrics: {
          totalFound: filteredMoments.length,
          filterEffectiveness: (filteredMoments.length / this.moments.length) * 100
        }
      },
      visualization: this.generateVisualization(intent, filteredMoments),
      explanation,
      confidence: intent.confidence,
      processingTime: 0 // Will be set by executor
    }
  }

  /**
   * Execute aggregation query
   */
  private async executeAggregate(intent: QueryIntent, context: QueryContext): Promise<QueryResults> {
    let filteredMoments = this.filterByEntities(this.moments, intent.entities)
    
    if (intent.timeframe) {
      filteredMoments = this.filterByTimeframe(filteredMoments, intent.timeframe)
    }

    const aggregations = this.calculateAggregations(filteredMoments, intent.aggregation || 'count')
    const explanation = `Aggregated ${filteredMoments.length} moments using ${intent.aggregation || 'count'} operation.`

    return {
      type: 'summary',
      data: {
        summary: this.formatAggregationSummary(aggregations),
        metrics: aggregations
      },
      visualization: {
        type: 'bar',
        config: { aggregation: true },
        data: Object.entries(aggregations).map(([key, value]) => ({ key, value }))
      },
      explanation,
      confidence: intent.confidence,
      processingTime: 0 // Will be set by executor
    }
  }

  /**
   * Execute temporal analysis
   */
  private async executeTemporal(intent: QueryIntent, context: QueryContext): Promise<QueryResults> {
    let filteredMoments = this.filterByEntities(this.moments, intent.entities)
    
    if (intent.timeframe) {
      filteredMoments = this.filterByTimeframe(filteredMoments, intent.timeframe)
    }

    // Sort by time
    filteredMoments.sort((a, b) => new Date(a.extractedAt).getTime() - new Date(b.extractedAt).getTime())

    const timelineData = this.generateTimelineData(filteredMoments)
    const temporalInsights = this.generateTemporalInsights(filteredMoments)

    const explanation = `Temporal analysis of ${filteredMoments.length} moments across ${timelineData.length} time periods.`

    return {
      type: 'insights',
      data: {
        moments: filteredMoments,
        insights: temporalInsights,
        metrics: {
          timeSpan: this.calculateTimeSpan(filteredMoments),
          activityPeaks: this.findActivityPeaks(filteredMoments).length
        }
      },
      visualization: {
        type: 'timeline',
        config: { temporal: true },
        data: timelineData
      },
      explanation,
      confidence: intent.confidence,
      processingTime: 0 // Will be set by executor
    }
  }

  /**
   * Helper methods for filtering and analysis
   */
  private filterByEntities(moments: PivotalMoment[], entities: QueryIntent['entities']): PivotalMoment[] {
    return moments.filter(moment => {
      // Check companies
      const hasCompany = entities.companies.length === 0 || 
        entities.companies.some(company => 
          moment.entities.companies.some(c => 
            c.toLowerCase().includes(company.toLowerCase()) ||
            company.toLowerCase().includes(c.toLowerCase())
          ) ||
          moment.source.name.toLowerCase().includes(company.toLowerCase()) ||
          moment.content.toLowerCase().includes(company.toLowerCase())
        )

      // Check technologies
      const hasTechnology = entities.technologies.length === 0 || 
        entities.technologies.some(tech => 
          moment.entities.technologies.some(t => 
            t.toLowerCase().includes(tech.toLowerCase()) ||
            tech.toLowerCase().includes(t.toLowerCase())
          ) ||
          moment.content.toLowerCase().includes(tech.toLowerCase())
        )

      // Check concepts
      const hasConcept = entities.concepts.length === 0 || 
        entities.concepts.some(concept => 
          moment.content.toLowerCase().includes(concept.toLowerCase()) ||
          moment.title.toLowerCase().includes(concept.toLowerCase()) ||
          moment.description.toLowerCase().includes(concept.toLowerCase())
        )

      // Check people
      const hasPerson = entities.people.length === 0 || 
        entities.people.some(person => 
          moment.entities.people.some(p => 
            p.toLowerCase().includes(person.toLowerCase())
          ) ||
          moment.content.toLowerCase().includes(person.toLowerCase())
        )

      // Check locations
      const hasLocation = entities.locations.length === 0 || 
        entities.locations.some(location => 
          moment.entities.locations.some(l => 
            l.toLowerCase().includes(location.toLowerCase())
          ) ||
          moment.content.toLowerCase().includes(location.toLowerCase())
        )

      return hasCompany && hasTechnology && hasConcept && hasPerson && hasLocation
    })
  }

  private filterByEntityName(moments: PivotalMoment[], entityName: string, entityType: 'companies' | 'technologies'): PivotalMoment[] {
    return moments.filter(moment => {
      if (entityType === 'companies') {
        return moment.entities.companies.some(c => 
          c.toLowerCase().includes(entityName.toLowerCase())
        ) || moment.source.name.toLowerCase().includes(entityName.toLowerCase())
      } else {
        return moment.entities.technologies.some(t => 
          t.toLowerCase().includes(entityName.toLowerCase())
        )
      }
    })
  }

  private filterByTimeframe(moments: PivotalMoment[], timeframe: QueryIntent['timeframe']): PivotalMoment[] {
    if (!timeframe?.relative) return moments

    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    const relative = timeframe.relative.toLowerCase()

    if (relative.includes('today')) {
      startDate = startOfDay(now)
      endDate = endOfDay(now)
    } else if (relative.includes('yesterday')) {
      startDate = startOfDay(subDays(now, 1))
      endDate = endOfDay(subDays(now, 1))
    } else if (relative.includes('this week')) {
      startDate = startOfWeek(now)
      endDate = endOfWeek(now)
    } else if (relative.includes('this month')) {
      startDate = startOfMonth(now)
      endDate = endOfMonth(now)
    } else if (relative.includes('this year')) {
      startDate = startOfYear(now)
      endDate = endOfYear(now)
    } else if (relative.match(/(\d+)\s+(days?|weeks?|months?|years?)/)) {
      const match = relative.match(/(\d+)\s+(days?|weeks?|months?|years?)/)!
      const amount = parseInt(match[1])
      const unit = match[2]

      if (unit.startsWith('day')) {
        startDate = subDays(now, amount)
      } else if (unit.startsWith('week')) {
        startDate = subWeeks(now, amount)
      } else if (unit.startsWith('month')) {
        startDate = subMonths(now, amount)
      } else {
        startDate = subYears(now, amount)
      }
    } else if (relative.match(/q[1-4]\s+\d{4}/i)) {
      // Handle quarters (simplified)
      const match = relative.match(/q([1-4])\s+(\d{4})/i)!
      const quarter = parseInt(match[1])
      const year = parseInt(match[2])
      startDate = new Date(year, (quarter - 1) * 3, 1)
      endDate = new Date(year, quarter * 3, 0)
    } else {
      return moments // No valid timeframe found
    }

    return moments.filter(moment => {
      const momentDate = new Date(moment.extractedAt)
      return isAfter(momentDate, startDate) && isBefore(momentDate, endDate)
    })
  }

  private filterByFactors(moments: PivotalMoment[], factors: QueryIntent['factors']): PivotalMoment[] {
    if (!factors) return moments
    
    return moments.filter(moment => {
      const hasMatchingMicro = factors.micro.length === 0 || 
        factors.micro.some(factor => moment.classification.microFactors.includes(factor))
      
      const hasMatchingMacro = factors.macro.length === 0 || 
        factors.macro.some(factor => moment.classification.macroFactors.includes(factor))

      return hasMatchingMicro && hasMatchingMacro
    })
  }

  private applyFilters(moments: PivotalMoment[], filters: QueryIntent['filters']): PivotalMoment[] {
    if (!filters) return moments
    
    return moments.filter(moment => {
      if (filters.impactThreshold && moment.impact.score < filters.impactThreshold) {
        return false
      }
      
      if (filters.confidenceLevel && moment.classification.confidence !== filters.confidenceLevel) {
        return false
      }
      
      if (filters.sourceType && moment.source.type !== filters.sourceType) {
        return false
      }

      return true
    })
  }

  /**
   * Analysis helper methods
   */
  private generateInsights(moments: PivotalMoment[], intent: QueryIntent): string[] {
    const insights: string[] = []

    if (moments.length === 0) {
      insights.push("No moments found matching your criteria.")
      return insights
    }

    // Impact analysis
    const highImpactMoments = moments.filter(m => m.impact.score >= 70)
    if (highImpactMoments.length > 0) {
      insights.push(`${highImpactMoments.length} high-impact moments identified (score ≥70)`)
    }

    // Factor analysis
    const factorCounts = this.countFactors(moments)
    const topFactor = Object.entries(factorCounts).sort(([,a], [,b]) => b - a)[0]
    if (topFactor) {
      insights.push(`Most common factor: ${topFactor[0]} (${topFactor[1]} occurrences)`)
    }

    // Temporal insights
    const recentMoments = moments.filter(m => 
      isAfter(new Date(m.extractedAt), subDays(new Date(), 7))
    )
    if (recentMoments.length > 0) {
      insights.push(`${recentMoments.length} moments from the past week`)
    }

    return insights
  }

  private findCorrelations(moments: PivotalMoment[]) {
    const correlations = []
    
    // Simple entity co-occurrence analysis
    const entityPairs = new Map<string, number>()
    
    for (const moment of moments) {
      const allEntities = [
        ...moment.entities.companies,
        ...moment.entities.technologies,
        ...moment.entities.people
      ]
      
      for (let i = 0; i < allEntities.length; i++) {
        for (let j = i + 1; j < allEntities.length; j++) {
          const pair = [allEntities[i], allEntities[j]].sort().join('|')
          entityPairs.set(pair, (entityPairs.get(pair) || 0) + 1)
        }
      }
    }
    
    // Convert to correlation format
    for (const [pairKey, count] of entityPairs) {
      if (count >= 2) { // Minimum threshold
        const [entity1, entity2] = pairKey.split('|')
        correlations.push({
          entity1,
          entity2,
          strength: Math.min(count / 5, 1), // Normalize strength
          type: 'co-occurrence'
        })
      }
    }
    
    return correlations.slice(0, 10) // Top 10 correlations
  }

  private identifyPatterns(moments: PivotalMoment[]): string[] {
    const patterns: string[] = []

    // Temporal clustering
    const clusters = this.groupMomentsByTimePeriod(moments, 'day')
    const highActivityDays = Object.entries(clusters).filter(([, data]) => data.count >= 3)
    
    if (highActivityDays.length > 0) {
      patterns.push(`${highActivityDays.length} days with high activity (3+ moments)`)
    }

    // Factor patterns
    const factorCounts = this.countFactors(moments)
    const dominantFactors = Object.entries(factorCounts).filter(([, count]) => count >= moments.length * 0.3)
    
    if (dominantFactors.length > 0) {
      patterns.push(`Dominant factors: ${dominantFactors.map(([factor]) => factor).join(', ')}`)
    }

    return patterns
  }

  private findClusters(moments: PivotalMoment[]): string[] {
    // Simple clustering based on entity overlap
    const clusters: string[] = []
    
    // Group by common entities
    const entityGroups = new Map<string, PivotalMoment[]>()
    
    for (const moment of moments) {
      const key = [...moment.entities.companies, ...moment.entities.technologies].sort().join('|')
      if (!entityGroups.has(key)) {
        entityGroups.set(key, [])
      }
      entityGroups.get(key)!.push(moment)
    }
    
    for (const [entities, groupMoments] of entityGroups) {
      if (groupMoments.length >= 2) {
        const entityList = entities.split('|').filter(e => e.length > 0)
        if (entityList.length > 0) {
          clusters.push(`Cluster around ${entityList.slice(0, 2).join(' & ')}: ${groupMoments.length} moments`)
        }
      }
    }
    
    return clusters.slice(0, 5)
  }

  private findSequentialPatterns(moments: PivotalMoment[]): string[] {
    const patterns: string[] = []
    
    // Sort by date
    const sortedMoments = [...moments].sort((a, b) => 
      new Date(a.extractedAt).getTime() - new Date(b.extractedAt).getTime()
    )
    
    // Look for sequences of related moments
    for (let i = 0; i < sortedMoments.length - 1; i++) {
      const current = sortedMoments[i]
      const next = sortedMoments[i + 1]
      
      // Check if moments are related (share entities or factors)
      const sharedEntities = this.findSharedEntities(current, next)
      const sharedFactors = this.findSharedFactors(current, next)
      
      if (sharedEntities.length > 0 || sharedFactors.length > 0) {
        const daysDiff = Math.floor(
          (new Date(next.extractedAt).getTime() - new Date(current.extractedAt).getTime()) / 
          (1000 * 60 * 60 * 24)
        )
        
        if (daysDiff <= 7) { // Within a week
          patterns.push(`Sequential pattern: ${current.title.slice(0, 30)}... → ${next.title.slice(0, 30)}... (${daysDiff} days apart)`)
        }
      }
    }
    
    return patterns.slice(0, 3)
  }

  private generateVisualization(intent: QueryIntent, moments: PivotalMoment[]) {
    const visualizationType = intent.visualization || 'cards'
    
    switch (visualizationType) {
      case 'timeline':
        return {
          type: 'timeline' as const,
          config: { showImpact: true },
          data: this.generateTimelineData(moments)
        }
      case 'chart':
        return {
          type: 'bar' as const,
          config: { metric: 'impact' },
          data: this.generateChartData(moments)
        }
      case 'network':
        return {
          type: 'network' as const,
          config: { showRelationships: true },
          data: this.generateNetworkData(moments)
        }
      case 'heatmap':
        return {
          type: 'heatmap' as const,
          config: { factors: true },
          data: this.generateHeatmapData(moments)
        }
      default:
        return undefined
    }
  }

  /**
   * Utility methods
   */
  private calculateAverageImpact(moments: PivotalMoment[]): number {
    if (moments.length === 0) return 0
    return Math.round(moments.reduce((sum, m) => sum + m.impact.score, 0) / moments.length)
  }

  private countFactors(moments: PivotalMoment[]): Record<string, number> {
    const counts: Record<string, number> = {}
    
    for (const moment of moments) {
      for (const factor of [...moment.classification.microFactors, ...moment.classification.macroFactors]) {
        counts[factor] = (counts[factor] || 0) + 1
      }
    }
    
    return counts
  }

  private getTopFactors(moments: PivotalMoment[]): string[] {
    const factorCounts = this.countFactors(moments)
    return Object.entries(factorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([factor]) => factor)
  }

  private groupMomentsByTimePeriod(moments: PivotalMoment[], period: 'day' | 'week' | 'month') {
    const groups: Record<string, { count: number; averageImpact: number; moments: PivotalMoment[] }> = {}
    
    for (const moment of moments) {
      let key: string
      const date = new Date(moment.extractedAt)
      
      switch (period) {
        case 'day':
          key = format(date, 'yyyy-MM-dd')
          break
        case 'week':
          key = format(startOfWeek(date), 'yyyy-MM-dd')
          break
        case 'month':
          key = format(date, 'yyyy-MM')
          break
      }
      
      if (!groups[key]) {
        groups[key] = { count: 0, averageImpact: 0, moments: [] }
      }
      
      groups[key].count++
      groups[key].moments.push(moment)
    }
    
    // Calculate average impact for each group
    for (const key of Object.keys(groups)) {
      groups[key].averageImpact = this.calculateAverageImpact(groups[key].moments)
    }
    
    return groups
  }

  private generateSearchExplanation(intent: QueryIntent, resultCount: number): string {
    const parts: string[] = []
    
    if (intent.entities.companies.length > 0) {
      parts.push(`companies: ${intent.entities.companies.join(', ')}`)
    }
    
    if (intent.entities.technologies.length > 0) {
      parts.push(`technologies: ${intent.entities.technologies.join(', ')}`)
    }
    
    if (intent.entities.concepts.length > 0) {
      parts.push(`concepts: ${intent.entities.concepts.join(', ')}`)
    }
    
    if (intent.timeframe?.relative) {
      parts.push(`timeframe: ${intent.timeframe.relative}`)
    }
    
    const criteria = parts.length > 0 ? ` matching ${parts.join(', ')}` : ''
    return `Found ${resultCount} moments${criteria}.`
  }

  private generateComparisonInsights(comparisonData: Record<string, any>): string[] {
    const insights: string[] = []
    const entities = Object.keys(comparisonData)
    
    if (entities.length >= 2) {
      // Find entity with highest impact
      const highestImpact = entities.reduce((prev, current) => 
        comparisonData[current].averageImpact > comparisonData[prev].averageImpact ? current : prev
      )
      insights.push(`${highestImpact} has the highest average impact score`)
      
      // Find most active entity
      const mostActive = entities.reduce((prev, current) => 
        comparisonData[current].momentCount > comparisonData[prev].momentCount ? current : prev
      )
      insights.push(`${mostActive} has the most moments (${comparisonData[mostActive].momentCount})`)
    }
    
    return insights
  }

  private analyzeTrends(trendData: Record<string, { count: number; averageImpact: number }>): string[] {
    const insights: string[] = []
    const periods = Object.keys(trendData).sort()
    
    if (periods.length >= 2) {
      const recent = trendData[periods[periods.length - 1]]
      const previous = trendData[periods[periods.length - 2]]
      
      if (recent.count > previous.count) {
        insights.push(`Activity increased recently: ${recent.count} vs ${previous.count} moments`)
      } else if (recent.count < previous.count) {
        insights.push(`Activity decreased recently: ${recent.count} vs ${previous.count} moments`)
      }
      
      if (recent.averageImpact > previous.averageImpact) {
        insights.push(`Impact trending up: ${recent.averageImpact} vs ${previous.averageImpact}`)
      }
    }
    
    return insights
  }

  private calculateAggregations(moments: PivotalMoment[], operation: string): Record<string, number> {
    const aggregations: Record<string, number> = {}
    
    switch (operation) {
      case 'count':
        aggregations.totalMoments = moments.length
        aggregations.highImpactMoments = moments.filter(m => m.impact.score >= 70).length
        aggregations.uniqueCompanies = new Set(moments.flatMap(m => m.entities.companies)).size
        aggregations.uniqueTechnologies = new Set(moments.flatMap(m => m.entities.technologies)).size
        break
        
      case 'average':
        aggregations.averageImpactScore = this.calculateAverageImpact(moments)
        break
        
      case 'max':
        aggregations.maxImpactScore = Math.max(...moments.map(m => m.impact.score))
        break
        
      case 'min':
        aggregations.minImpactScore = Math.min(...moments.map(m => m.impact.score))
        break
    }
    
    return aggregations
  }

  private formatAggregationSummary(aggregations: Record<string, number>): string {
    return Object.entries(aggregations)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  }

  private generateTimelineData(moments: PivotalMoment[]) {
    return moments
      .sort((a, b) => new Date(a.extractedAt).getTime() - new Date(b.extractedAt).getTime())
      .map(moment => ({
        date: moment.extractedAt,
        title: moment.title,
        impact: moment.impact.score,
        entities: [...moment.entities.companies, ...moment.entities.technologies]
      }))
  }

  private generateChartData(moments: PivotalMoment[]) {
    const entityCounts = new Map<string, number>()
    
    for (const moment of moments) {
      for (const entity of [...moment.entities.companies, ...moment.entities.technologies]) {
        entityCounts.set(entity, (entityCounts.get(entity) || 0) + 1)
      }
    }
    
    return Array.from(entityCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([entity, count]) => ({ entity, count }))
  }

  private generateNetworkData(moments: PivotalMoment[]) {
    const nodes = new Set<string>()
    const links: Array<{ source: string; target: string; weight: number }> = []
    
    for (const moment of moments) {
      const entities = [...moment.entities.companies, ...moment.entities.technologies]
      
      // Add nodes
      entities.forEach(entity => nodes.add(entity))
      
      // Add links between entities in the same moment
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          links.push({
            source: entities[i],
            target: entities[j],
            weight: moment.impact.score / 100
          })
        }
      }
    }
    
    return {
      nodes: Array.from(nodes).map(id => ({ id, group: 1 })),
      links: links.slice(0, 50) // Limit for performance
    }
  }

  private generateHeatmapData(moments: PivotalMoment[]) {
    const factorEntityMatrix: Record<string, Record<string, number>> = {}
    
    for (const moment of moments) {
      const factors = [...moment.classification.microFactors, ...moment.classification.macroFactors]
      const entities = [...moment.entities.companies, ...moment.entities.technologies]
      
      for (const factor of factors) {
        if (!factorEntityMatrix[factor]) {
          factorEntityMatrix[factor] = {}
        }
        
        for (const entity of entities) {
          factorEntityMatrix[factor][entity] = (factorEntityMatrix[factor][entity] || 0) + 1
        }
      }
    }
    
    return factorEntityMatrix
  }

  private generateTemporalInsights(moments: PivotalMoment[]): string[] {
    const insights: string[] = []
    
    if (moments.length === 0) return insights
    
    const timeSpan = this.calculateTimeSpan(moments)
    insights.push(`Analysis spans ${timeSpan}`)
    
    const peaks = this.findActivityPeaks(moments)
    if (peaks.length > 0) {
      insights.push(`${peaks.length} activity peaks identified`)
    }
    
    return insights
  }

  private calculateTimeSpan(moments: PivotalMoment[]): string {
    if (moments.length === 0) return '0 days'
    
    const dates = moments.map(m => new Date(m.extractedAt).getTime())
    const earliest = Math.min(...dates)
    const latest = Math.max(...dates)
    const days = Math.floor((latest - earliest) / (1000 * 60 * 60 * 24))
    
    return `${days} days`
  }

  private findActivityPeaks(moments: PivotalMoment[]): Array<{ date: string; count: number }> {
    const dailyCounts = this.groupMomentsByTimePeriod(moments, 'day')
    const counts = Object.values(dailyCounts).map(d => d.count)
    const averageCount = counts.reduce((sum, c) => sum + c, 0) / counts.length
    
    return Object.entries(dailyCounts)
      .filter(([, data]) => data.count > averageCount * 1.5) // 50% above average
      .map(([date, data]) => ({ date, count: data.count }))
  }

  private findSharedEntities(moment1: PivotalMoment, moment2: PivotalMoment): string[] {
    const entities1 = new Set([...moment1.entities.companies, ...moment1.entities.technologies, ...moment1.entities.people])
    const entities2 = new Set([...moment2.entities.companies, ...moment2.entities.technologies, ...moment2.entities.people])
    
    return Array.from(entities1).filter(entity => entities2.has(entity))
  }

  private findSharedFactors(moment1: PivotalMoment, moment2: PivotalMoment): string[] {
    const factors1 = new Set([...moment1.classification.microFactors, ...moment1.classification.macroFactors])
    const factors2 = new Set([...moment2.classification.microFactors, ...moment2.classification.macroFactors])
    
    return Array.from(factors1).filter(factor => factors2.has(factor))
  }
}