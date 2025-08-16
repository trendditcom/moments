'use client'

import { PivotalMoment, MomentCorrelation, Factor } from '@/types/moments'
import { Company, Technology } from '@/types/catalog'

// Statistical significance thresholds
const SIGNIFICANCE_LEVELS = {
  VERY_HIGH: 0.95,   // p < 0.05
  HIGH: 0.90,        // p < 0.10  
  MEDIUM: 0.80,      // p < 0.20
  LOW: 0.70          // p < 0.30
} as const

// Correlation strength categories
const CORRELATION_STRENGTH = {
  VERY_STRONG: 0.8,
  STRONG: 0.6,
  MODERATE: 0.4,
  WEAK: 0.2,
  VERY_WEAK: 0.1
} as const

// Entity pair correlation data structure
export interface EntityCorrelation {
  entity1: string
  entity2: string
  entity1Type: 'company' | 'technology' | 'concept' | 'person' | 'location'
  entity2Type: 'company' | 'technology' | 'concept' | 'person' | 'location'
  correlationCoefficient: number
  pValue: number
  significance: keyof typeof SIGNIFICANCE_LEVELS
  strength: keyof typeof CORRELATION_STRENGTH
  temporalStability: number
  cooccurrenceCount: number
  totalOccurrences1: number
  totalOccurrences2: number
  commonMoments: string[]
  sharedFactors: Factor[]
  impactCorrelation: number
  timeStabilityWindows: TemporalWindow[]
  lastUpdated: Date
}

// Temporal stability tracking
export interface TemporalWindow {
  windowStart: Date
  windowEnd: Date
  correlationInWindow: number
  momentCount: number
  significanceInWindow: number
}

// Hierarchical clustering result
export interface EntityCluster {
  clusterId: string
  entities: string[]
  clusterStrength: number
  averageCorrelation: number
  dominantType: 'company' | 'technology' | 'concept' | 'mixed'
  description: string
  members: {
    entity: string
    type: string
    centrality: number
  }[]
}

/**
 * Advanced Correlation Analysis Engine
 * 
 * Implements sophisticated correlation algorithms including:
 * - Pearson correlation coefficients
 * - Statistical significance testing (Chi-square, Fisher's exact test)
 * - Temporal stability analysis
 * - Hierarchical clustering
 * - Multi-dimensional correlation scoring
 */
export class CorrelationAnalysisEngine {
  private static instance: CorrelationAnalysisEngine
  
  private constructor() {}
  
  static getInstance(): CorrelationAnalysisEngine {
    if (!CorrelationAnalysisEngine.instance) {
      CorrelationAnalysisEngine.instance = new CorrelationAnalysisEngine()
    }
    return CorrelationAnalysisEngine.instance
  }

  /**
   * Calculate comprehensive correlation coefficient between two entities
   */
  calculateEntityCorrelation(
    entity1: string,
    entity2: string,
    moments: PivotalMoment[],
    temporalWindowDays: number = 30
  ): EntityCorrelation {
    // Get all moments containing each entity
    const entity1Moments = this.getMomentsContainingEntity(entity1, moments)
    const entity2Moments = this.getMomentsContainingEntity(entity2, moments)
    const commonMoments = entity1Moments.filter(m1 => 
      entity2Moments.some(m2 => m1.id === m2.id)
    )

    // Calculate basic co-occurrence statistics
    const cooccurrenceCount = commonMoments.length
    const totalOccurrences1 = entity1Moments.length
    const totalOccurrences2 = entity2Moments.length

    // Calculate Pearson correlation coefficient using impact scores
    const correlationCoefficient = this.calculatePearsonCorrelation(
      entity1Moments,
      entity2Moments,
      commonMoments
    )

    // Statistical significance testing
    const { pValue, significance } = this.calculateStatisticalSignificance(
      cooccurrenceCount,
      totalOccurrences1,
      totalOccurrences2,
      moments.length
    )

    // Determine correlation strength
    const strength = this.determineCorrelationStrength(Math.abs(correlationCoefficient))

    // Calculate temporal stability
    const timeStabilityWindows = this.calculateTemporalStability(
      entity1,
      entity2,
      moments,
      temporalWindowDays
    )
    const temporalStability = this.aggregateTemporalStability(timeStabilityWindows)

    // Find shared factors
    const sharedFactors = this.findSharedFactors(commonMoments)

    // Calculate impact correlation
    const impactCorrelation = this.calculateImpactCorrelation(commonMoments)

    // Determine entity types
    const entity1Type = this.determineEntityType(entity1, moments)
    const entity2Type = this.determineEntityType(entity2, moments)

    return {
      entity1,
      entity2,
      entity1Type,
      entity2Type,
      correlationCoefficient,
      pValue,
      significance,
      strength,
      temporalStability,
      cooccurrenceCount,
      totalOccurrences1,
      totalOccurrences2,
      commonMoments: commonMoments.map(m => m.id),
      sharedFactors,
      impactCorrelation,
      timeStabilityWindows,
      lastUpdated: new Date()
    }
  }

  /**
   * Calculate Pearson correlation coefficient between entity impact scores
   */
  private calculatePearsonCorrelation(
    entity1Moments: PivotalMoment[],
    entity2Moments: PivotalMoment[],
    commonMoments: PivotalMoment[]
  ): number {
    if (commonMoments.length < 2) return 0

    // Create aligned arrays of impact scores
    const impacts1: number[] = []
    const impacts2: number[] = []

    // Use all moments, filling with 0 for non-co-occurrence
    const allMomentIds = new Set([
      ...entity1Moments.map(m => m.id),
      ...entity2Moments.map(m => m.id)
    ])

    allMomentIds.forEach(momentId => {
      const moment1 = entity1Moments.find(m => m.id === momentId)
      const moment2 = entity2Moments.find(m => m.id === momentId)
      
      impacts1.push(moment1?.impact.score || 0)
      impacts2.push(moment2?.impact.score || 0)
    })

    return this.pearsonCorrelation(impacts1, impacts2)
  }

  /**
   * Calculate Pearson correlation coefficient for two arrays
   */
  private pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0

    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  /**
   * Calculate statistical significance using Fisher's exact test approximation
   */
  private calculateStatisticalSignificance(
    cooccurrence: number,
    total1: number,
    total2: number,
    totalMoments: number
  ): { pValue: number; significance: keyof typeof SIGNIFICANCE_LEVELS } {
    // Fisher's exact test approximation for co-occurrence significance
    const expected = (total1 * total2) / totalMoments
    const observed = cooccurrence
    
    // Chi-square approximation when expected > 5
    if (expected >= 5) {
      const chiSquare = Math.pow(observed - expected, 2) / expected
      const pValue = 1 - this.cumulativeChiSquare(chiSquare, 1)
      
      return {
        pValue,
        significance: this.classifySignificance(pValue)
      }
    } else {
      // For small expected values, use hypergeometric approximation
      const pValue = this.hypergeometricTest(cooccurrence, total1, total2, totalMoments)
      return {
        pValue,
        significance: this.classifySignificance(pValue)
      }
    }
  }

  /**
   * Approximate chi-square cumulative distribution function
   */
  private cumulativeChiSquare(x: number, df: number): number {
    // Approximation for df=1 (degrees of freedom = 1)
    if (df === 1) {
      return 2 * (1 - this.normalCDF(Math.sqrt(x)))
    }
    // Simple approximation - in production, use proper statistical library
    return Math.min(1, Math.max(0, 1 - Math.exp(-x / 2)))
  }

  /**
   * Approximate normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    // Approximation of standard normal CDF
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)))
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911

    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  /**
   * Hypergeometric test for small sample sizes
   */
  private hypergeometricTest(
    observed: number,
    sample1: number,
    sample2: number,
    population: number
  ): number {
    // Simplified hypergeometric p-value calculation
    // In production, use proper statistical library
    const expected = (sample1 * sample2) / population
    const variance = expected * (1 - sample2 / population) * (population - sample1) / (population - 1)
    
    if (variance === 0) return 1.0
    
    const z = (observed - expected) / Math.sqrt(variance)
    return 2 * (1 - this.normalCDF(Math.abs(z))) // Two-tailed test
  }

  /**
   * Classify statistical significance level
   */
  private classifySignificance(pValue: number): keyof typeof SIGNIFICANCE_LEVELS {
    if (pValue < 0.05) return 'VERY_HIGH'
    if (pValue < 0.10) return 'HIGH'
    if (pValue < 0.20) return 'MEDIUM'
    return 'LOW'
  }

  /**
   * Determine correlation strength category
   */
  private determineCorrelationStrength(absCorrelation: number): keyof typeof CORRELATION_STRENGTH {
    if (absCorrelation >= CORRELATION_STRENGTH.VERY_STRONG) return 'VERY_STRONG'
    if (absCorrelation >= CORRELATION_STRENGTH.STRONG) return 'STRONG'
    if (absCorrelation >= CORRELATION_STRENGTH.MODERATE) return 'MODERATE'
    if (absCorrelation >= CORRELATION_STRENGTH.WEAK) return 'WEAK'
    return 'VERY_WEAK'
  }

  /**
   * Calculate temporal stability across time windows
   */
  private calculateTemporalStability(
    entity1: string,
    entity2: string,
    moments: PivotalMoment[],
    windowDays: number
  ): TemporalWindow[] {
    const windows: TemporalWindow[] = []
    const sortedMoments = moments.sort((a, b) => 
      new Date(a.extractedAt).getTime() - new Date(b.extractedAt).getTime()
    )

    if (sortedMoments.length === 0) return windows

    const firstDate = new Date(sortedMoments[0].extractedAt)
    const lastDate = new Date(sortedMoments[sortedMoments.length - 1].extractedAt)
    
    let currentStart = new Date(firstDate)
    
    while (currentStart <= lastDate) {
      const windowEnd = new Date(currentStart)
      windowEnd.setDate(windowEnd.getDate() + windowDays)
      
      const windowMoments = sortedMoments.filter(moment => {
        const momentDate = new Date(moment.extractedAt)
        return momentDate >= currentStart && momentDate < windowEnd
      })

      if (windowMoments.length > 1) {
        const entity1WindowMoments = this.getMomentsContainingEntity(entity1, windowMoments)
        const entity2WindowMoments = this.getMomentsContainingEntity(entity2, windowMoments)
        const commonWindowMoments = entity1WindowMoments.filter(m1 => 
          entity2WindowMoments.some(m2 => m1.id === m2.id)
        )

        const correlationInWindow = this.calculatePearsonCorrelation(
          entity1WindowMoments,
          entity2WindowMoments,
          commonWindowMoments
        )

        const { pValue } = this.calculateStatisticalSignificance(
          commonWindowMoments.length,
          entity1WindowMoments.length,
          entity2WindowMoments.length,
          windowMoments.length
        )

        windows.push({
          windowStart: new Date(currentStart),
          windowEnd: new Date(windowEnd),
          correlationInWindow,
          momentCount: windowMoments.length,
          significanceInWindow: 1 - pValue
        })
      }

      currentStart.setDate(currentStart.getDate() + Math.floor(windowDays / 2)) // 50% overlap
    }

    return windows
  }

  /**
   * Aggregate temporal stability into single metric
   */
  private aggregateTemporalStability(windows: TemporalWindow[]): number {
    if (windows.length === 0) return 0

    // Calculate variance of correlations across windows
    const correlations = windows.map(w => w.correlationInWindow)
    const meanCorrelation = correlations.reduce((sum, c) => sum + c, 0) / correlations.length
    const variance = correlations.reduce((sum, c) => sum + Math.pow(c - meanCorrelation, 2), 0) / correlations.length
    
    // Stability = 1 - normalized_variance (higher stability = lower variance)
    const maxVariance = 1.0 // Maximum possible variance for correlations [-1, 1]
    return Math.max(0, 1 - (variance / maxVariance))
  }

  /**
   * Find shared factors between moments
   */
  private findSharedFactors(moments: PivotalMoment[]): Factor[] {
    const factorCounts = new Map<Factor, number>()
    
    moments.forEach(moment => {
      const allFactors = [
        ...(moment.classification?.microFactors || []),
        ...(moment.classification?.macroFactors || [])
      ]
      
      allFactors.forEach(factor => {
        factorCounts.set(factor, (factorCounts.get(factor) || 0) + 1)
      })
    })

    // Return factors appearing in at least 50% of common moments
    const threshold = Math.ceil(moments.length * 0.5)
    return Array.from(factorCounts.entries())
      .filter(([factor, count]) => count >= threshold)
      .map(([factor]) => factor)
  }

  /**
   * Calculate correlation between impact scores of co-occurring moments
   */
  private calculateImpactCorrelation(moments: PivotalMoment[]): number {
    if (moments.length < 2) return 0

    const impacts = moments.map(m => m.impact.score)
    const timeScores = moments.map(m => {
      // Convert date to numeric score based on recency
      const daysSinceExtraction = Math.floor(
        (Date.now() - new Date(m.extractedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return Math.max(0, 100 - daysSinceExtraction) // More recent = higher score
    })

    return this.pearsonCorrelation(impacts, timeScores)
  }

  /**
   * Get all moments containing a specific entity
   */
  private getMomentsContainingEntity(entity: string, moments: PivotalMoment[]): PivotalMoment[] {
    return moments.filter(moment => {
      const allEntities = [
        ...(moment.entities?.companies || []),
        ...(moment.entities?.technologies || []),
        ...(moment.entities?.people || []),
        ...(moment.entities?.locations || []),
        ...(moment.classification?.keywords || [])
      ]
      return allEntities.includes(entity) || 
             moment.source.name === entity ||
             moment.title.toLowerCase().includes(entity.toLowerCase()) ||
             moment.content.toLowerCase().includes(entity.toLowerCase())
    })
  }

  /**
   * Determine entity type based on moment data
   */
  private determineEntityType(
    entity: string, 
    moments: PivotalMoment[]
  ): 'company' | 'technology' | 'concept' | 'person' | 'location' {
    const relevantMoments = this.getMomentsContainingEntity(entity, moments)
    
    // Check if it appears in specific entity lists
    for (const moment of relevantMoments) {
      if (moment.entities?.companies?.includes(entity)) return 'company'
      if (moment.entities?.technologies?.includes(entity)) return 'technology'
      if (moment.entities?.people?.includes(entity)) return 'person'
      if (moment.entities?.locations?.includes(entity)) return 'location'
    }

    // Check if it's a source entity
    const isSourceEntity = relevantMoments.some(m => m.source.name === entity)
    if (isSourceEntity) {
      const sourceTypes = relevantMoments
        .filter(m => m.source.name === entity)
        .map(m => m.source.type)
      
      if (sourceTypes.includes('company')) return 'company'
      if (sourceTypes.includes('technology')) return 'technology'
    }

    // Default to concept for keywords and other entities
    return 'concept'
  }

  /**
   * Perform hierarchical clustering of entities based on correlations
   */
  performHierarchicalClustering(
    correlations: EntityCorrelation[],
    minClusterSize: number = 3,
    maxClusters: number = 10
  ): EntityCluster[] {
    // Get unique entities
    const entities = new Set<string>()
    correlations.forEach(corr => {
      entities.add(corr.entity1)
      entities.add(corr.entity2)
    })

    const entityArray = Array.from(entities)
    const clusters: EntityCluster[] = []

    // Build adjacency matrix
    const adjacencyMatrix = this.buildAdjacencyMatrix(entityArray, correlations)

    // Simple agglomerative clustering
    let currentClusters: string[][] = entityArray.map(entity => [entity])
    
    while (currentClusters.length > maxClusters) {
      const { cluster1Idx, cluster2Idx, strength } = this.findClosestClusters(
        currentClusters,
        adjacencyMatrix,
        entityArray
      )

      if (strength < CORRELATION_STRENGTH.WEAK) break

      // Merge clusters
      const mergedCluster = [...currentClusters[cluster1Idx], ...currentClusters[cluster2Idx]]
      currentClusters = currentClusters.filter((_, idx) => idx !== cluster1Idx && idx !== cluster2Idx)
      currentClusters.push(mergedCluster)
    }

    // Convert to EntityCluster format
    currentClusters
      .filter(cluster => cluster.length >= minClusterSize)
      .forEach((cluster, idx) => {
        const clusterCorrelations = this.getClusterCorrelations(cluster, correlations)
        const averageCorrelation = clusterCorrelations.length > 0
          ? clusterCorrelations.reduce((sum, corr) => sum + Math.abs(corr.correlationCoefficient), 0) / clusterCorrelations.length
          : 0

        const entityTypes = cluster.map(entity => 
          correlations.find(c => c.entity1 === entity || c.entity2 === entity)?.entity1Type || 'concept'
        )
        const dominantType = this.getDominantType(entityTypes)

        clusters.push({
          clusterId: `cluster_${idx + 1}`,
          entities: cluster,
          clusterStrength: averageCorrelation,
          averageCorrelation,
          dominantType,
          description: `${dominantType} cluster with ${cluster.length} entities`,
          members: cluster.map(entity => ({
            entity,
            type: entityTypes[cluster.indexOf(entity)],
            centrality: this.calculateCentrality(entity, cluster, correlations)
          }))
        })
      })

    return clusters.sort((a, b) => b.clusterStrength - a.clusterStrength)
  }

  /**
   * Build adjacency matrix for clustering
   */
  private buildAdjacencyMatrix(entities: string[], correlations: EntityCorrelation[]): number[][] {
    const size = entities.length
    const matrix = Array(size).fill(null).map(() => Array(size).fill(0))

    correlations.forEach(corr => {
      const idx1 = entities.indexOf(corr.entity1)
      const idx2 = entities.indexOf(corr.entity2)
      
      if (idx1 !== -1 && idx2 !== -1) {
        const strength = Math.abs(corr.correlationCoefficient)
        matrix[idx1][idx2] = strength
        matrix[idx2][idx1] = strength
      }
    })

    return matrix
  }

  /**
   * Find closest clusters for merging
   */
  private findClosestClusters(
    clusters: string[][],
    adjacencyMatrix: number[][],
    entityArray: string[]
  ): { cluster1Idx: number; cluster2Idx: number; strength: number } {
    let maxStrength = 0
    let bestPair = { cluster1Idx: 0, cluster2Idx: 1, strength: 0 }

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const strength = this.calculateClusterLinkage(
          clusters[i],
          clusters[j],
          adjacencyMatrix,
          entityArray
        )

        if (strength > maxStrength) {
          maxStrength = strength
          bestPair = { cluster1Idx: i, cluster2Idx: j, strength }
        }
      }
    }

    return bestPair
  }

  /**
   * Calculate average linkage between two clusters
   */
  private calculateClusterLinkage(
    cluster1: string[],
    cluster2: string[],
    adjacencyMatrix: number[][],
    entityArray: string[]
  ): number {
    let totalStrength = 0
    let pairCount = 0

    cluster1.forEach(entity1 => {
      cluster2.forEach(entity2 => {
        const idx1 = entityArray.indexOf(entity1)
        const idx2 = entityArray.indexOf(entity2)
        
        if (idx1 !== -1 && idx2 !== -1) {
          totalStrength += adjacencyMatrix[idx1][idx2]
          pairCount++
        }
      })
    })

    return pairCount > 0 ? totalStrength / pairCount : 0
  }

  /**
   * Get correlations within a cluster
   */
  private getClusterCorrelations(cluster: string[], correlations: EntityCorrelation[]): EntityCorrelation[] {
    return correlations.filter(corr => 
      cluster.includes(corr.entity1) && cluster.includes(corr.entity2)
    )
  }

  /**
   * Determine dominant entity type in cluster
   */
  private getDominantType(types: string[]): 'company' | 'technology' | 'concept' | 'mixed' {
    const typeCounts = types.reduce((counts, type) => {
      counts[type] = (counts[type] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    const dominantType = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]

    if (!dominantType || typeCounts[dominantType] < types.length * 0.6) {
      return 'mixed'
    }

    return dominantType as 'company' | 'technology' | 'concept'
  }

  /**
   * Calculate entity centrality within cluster
   */
  private calculateCentrality(entity: string, cluster: string[], correlations: EntityCorrelation[]): number {
    const entityCorrelations = correlations.filter(corr => 
      (corr.entity1 === entity && cluster.includes(corr.entity2)) ||
      (corr.entity2 === entity && cluster.includes(corr.entity1))
    )

    if (entityCorrelations.length === 0) return 0

    const avgCorrelation = entityCorrelations.reduce(
      (sum, corr) => sum + Math.abs(corr.correlationCoefficient), 0
    ) / entityCorrelations.length

    return avgCorrelation
  }

  /**
   * Generate comprehensive correlation discovery report
   */
  generateCorrelationReport(
    correlations: EntityCorrelation[],
    clusters: EntityCluster[]
  ): {
    summary: {
      totalCorrelations: number
      significantCorrelations: number
      averageStrength: number
      temporalStability: number
    }
    topCorrelations: EntityCorrelation[]
    strongestClusters: EntityCluster[]
    insights: string[]
  } {
    const significantCorrelations = correlations.filter(
      corr => corr.significance === 'VERY_HIGH' || corr.significance === 'HIGH'
    )

    const averageStrength = correlations.length > 0
      ? correlations.reduce((sum, corr) => sum + Math.abs(corr.correlationCoefficient), 0) / correlations.length
      : 0

    const averageTemporalStability = correlations.length > 0
      ? correlations.reduce((sum, corr) => sum + corr.temporalStability, 0) / correlations.length
      : 0

    const topCorrelations = correlations
      .sort((a, b) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient))
      .slice(0, 10)

    const strongestClusters = clusters
      .sort((a, b) => b.clusterStrength - a.clusterStrength)
      .slice(0, 5)

    const insights = this.generateInsights(correlations, clusters)

    return {
      summary: {
        totalCorrelations: correlations.length,
        significantCorrelations: significantCorrelations.length,
        averageStrength,
        temporalStability: averageTemporalStability
      },
      topCorrelations,
      strongestClusters,
      insights
    }
  }

  /**
   * Generate AI-powered insights from correlation data
   */
  private generateInsights(correlations: EntityCorrelation[], clusters: EntityCluster[]): string[] {
    const insights: string[] = []

    // Strength insights
    const strongCorrelations = correlations.filter(c => c.strength === 'VERY_STRONG' || c.strength === 'STRONG')
    if (strongCorrelations.length > 0) {
      insights.push(`Identified ${strongCorrelations.length} strong correlations indicating significant market relationships`)
    }

    // Cross-type insights
    const crossTypeCorrelations = correlations.filter(c => c.entity1Type !== c.entity2Type)
    const sameTypeCorrelations = correlations.filter(c => c.entity1Type === c.entity2Type)
    
    if (crossTypeCorrelations.length > sameTypeCorrelations.length) {
      insights.push('Cross-entity-type correlations dominate, suggesting diverse market interconnections')
    }

    // Temporal insights
    const stableCorrelations = correlations.filter(c => c.temporalStability > 0.7)
    if (stableCorrelations.length > correlations.length * 0.3) {
      insights.push('High temporal stability indicates persistent market relationships')
    }

    // Clustering insights
    const largeClusters = clusters.filter(c => c.entities.length > 5)
    if (largeClusters.length > 0) {
      insights.push(`Detected ${largeClusters.length} major entity clusters suggesting ecosystem formation`)
    }

    return insights
  }
}

// Export singleton instance
export const correlationAnalysisEngine = CorrelationAnalysisEngine.getInstance()

// Factory function for creating configured engines
export function createCorrelationAnalysisEngine() {
  return CorrelationAnalysisEngine.getInstance()
}