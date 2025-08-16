'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  SparklesIcon,
  LightBulbIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BeakerIcon,
  ArrowTrendingUpIcon,
  CircleStackIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { useMomentsStore } from '@/store/moments-store'
import { useCatalogStore } from '@/store/catalog-store'
import { PivotalMoment } from '@/types/moments'
import { correlationAnalysisEngine, EntityCorrelation, EntityCluster } from '@/lib/correlation-analysis'

// Pattern types with AI confidence scoring
export interface PatternInsight {
  id: string
  type: 'cluster' | 'trend_correlation' | 'temporal_pattern' | 'surprise_connection'
  title: string
  description: string
  confidence: number // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical'
  entities: string[]
  timeframe?: {
    start: Date
    end: Date
    period: string
  }
  metrics: {
    strength: number
    significance: number
    frequency: number
    impact_score: number
  }
  evidence: {
    moments: string[]
    correlations: string[]
    patterns: string[]
  }
  aiInsights: string[]
  actionableRecommendations: string[]
}

// Cluster detection result
export interface EntityClusterPattern {
  clusterId: string
  entities: string[]
  clusterType: 'technology_ecosystem' | 'competitive_group' | 'partnership_network' | 'market_segment'
  strength: number
  coherence: number
  description: string
  keyConnections: Array<{
    entity1: string
    entity2: string
    relationship: string
    strength: number
  }>
}

// Temporal pattern detection
export interface TemporalPattern {
  patternId: string
  type: 'cyclical' | 'seasonal' | 'trend' | 'anomaly' | 'cascade'
  period: string // e.g., "weekly", "monthly", "quarterly"
  entities: string[]
  timeWindows: Array<{
    start: Date
    end: Date
    intensity: number
    events: number
  }>
  strength: number
  predictability: number
  nextExpected?: Date
}

// Surprise connection identification
export interface SurpriseConnection {
  connectionId: string
  entity1: string
  entity2: string
  unexpectedness: number // 0-100
  significance: number
  connectionType: 'cross_industry' | 'unexpected_partnership' | 'competitive_shift' | 'technological_leap'
  explanation: string
  supportingEvidence: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

// Trend correlation analysis
export interface TrendCorrelation {
  correlationId: string
  factors: string[]
  correlationType: 'positive' | 'negative' | 'lagged' | 'bidirectional'
  strength: number
  lagDays?: number
  confidence: number
  description: string
  implications: string[]
}

interface PatternDiscoveryPanelProps {
  moments?: PivotalMoment[]
  className?: string
}

/**
 * AI-Powered Pattern Discovery Engine
 * 
 * Implements advanced pattern recognition including:
 * - Automated cluster detection for entity groupings
 * - Trend correlation analysis for co-occurring factors
 * - Temporal pattern discovery for time-based relationships
 * - Surprise connection identification for unexpected correlations
 * - AI-powered insights with confidence scoring
 */
export class PatternDiscoveryEngine {
  private static instance: PatternDiscoveryEngine
  
  private constructor() {}
  
  static getInstance(): PatternDiscoveryEngine {
    if (!PatternDiscoveryEngine.instance) {
      PatternDiscoveryEngine.instance = new PatternDiscoveryEngine()
    }
    return PatternDiscoveryEngine.instance
  }

  /**
   * Discover entity clusters using advanced algorithms
   */
  discoverEntityClusters(moments: PivotalMoment[]): EntityClusterPattern[] {
    // Extract all entities
    const entityConnections = this.buildEntityConnectionGraph(moments)
    
    // Apply clustering algorithms
    const clusters = this.performAdvancedClustering(entityConnections)
    
    return clusters.map(cluster => this.analyzeClusterPattern(cluster, moments))
  }

  /**
   * Detect temporal patterns in moment sequences
   */
  detectTemporalPatterns(moments: PivotalMoment[]): TemporalPattern[] {
    const sortedMoments = [...moments].sort((a, b) => 
      new Date(a.extractedAt).getTime() - new Date(b.extractedAt).getTime()
    )

    const patterns: TemporalPattern[] = []
    
    // Detect cyclical patterns
    patterns.push(...this.detectCyclicalPatterns(sortedMoments))
    
    // Detect cascading events
    patterns.push(...this.detectCascadePatterns(sortedMoments))
    
    // Detect trend patterns
    patterns.push(...this.detectTrendPatterns(sortedMoments))
    
    // Detect anomalies
    patterns.push(...this.detectAnomalyPatterns(sortedMoments))
    
    return patterns.filter(p => p.strength > 0.3) // Filter out weak patterns
  }

  /**
   * Identify surprising/unexpected connections
   */
  identifySurpriseConnections(moments: PivotalMoment[]): SurpriseConnection[] {
    const connections: SurpriseConnection[] = []
    const entityPairs = this.getAllEntityPairs(moments)
    
    entityPairs.forEach(({ entity1, entity2, cooccurrences }) => {
      const unexpectedness = this.calculateUnexpectedness(entity1, entity2, moments)
      
      if (unexpectedness > 70) { // High threshold for surprise
        const connection = this.analyzeSurpriseConnection(entity1, entity2, cooccurrences, moments)
        connections.push(connection)
      }
    })
    
    return connections.sort((a, b) => b.unexpectedness - a.unexpectedness)
  }

  /**
   * Analyze trend correlations between factors
   */
  analyzeTrendCorrelations(moments: PivotalMoment[]): TrendCorrelation[] {
    const correlations: TrendCorrelation[] = []
    const factors = this.extractAllFactors(moments)
    
    // Analyze pairwise factor correlations over time
    for (let i = 0; i < factors.length; i++) {
      for (let j = i + 1; j < factors.length; j++) {
        const correlation = this.calculateFactorCorrelation(factors[i], factors[j], moments)
        if (correlation.strength > 0.4) {
          correlations.push(correlation)
        }
      }
    }
    
    return correlations.sort((a, b) => b.strength - a.strength)
  }

  /**
   * Generate comprehensive AI insights from all patterns
   */
  generateAIInsights(
    clusters: EntityClusterPattern[],
    temporal: TemporalPattern[],
    surprises: SurpriseConnection[],
    trends: TrendCorrelation[]
  ): PatternInsight[] {
    const insights: PatternInsight[] = []
    
    // Generate cluster insights
    clusters.forEach(cluster => {
      insights.push(this.createClusterInsight(cluster))
    })
    
    // Generate temporal insights
    temporal.forEach(pattern => {
      insights.push(this.createTemporalInsight(pattern))
    })
    
    // Generate surprise connection insights
    surprises.forEach(surprise => {
      insights.push(this.createSurpriseInsight(surprise))
    })
    
    // Generate trend correlation insights
    trends.forEach(trend => {
      insights.push(this.createTrendInsight(trend))
    })
    
    return insights.sort((a, b) => b.confidence - a.confidence)
  }

  // Private helper methods
  private buildEntityConnectionGraph(moments: PivotalMoment[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>()
    
    moments.forEach(moment => {
      const entities = this.extractEntitiesFromMoment(moment)
      
      entities.forEach(entity1 => {
        if (!graph.has(entity1)) graph.set(entity1, new Set())
        
        entities.forEach(entity2 => {
          if (entity1 !== entity2) {
            graph.get(entity1)!.add(entity2)
          }
        })
      })
    })
    
    return graph
  }

  private performAdvancedClustering(connections: Map<string, Set<string>>): EntityCluster[] {
    // Implement density-based clustering (DBSCAN-like)
    const clusters: EntityCluster[] = []
    const visited = new Set<string>()
    const entities = Array.from(connections.keys())
    
    entities.forEach(entity => {
      if (!visited.has(entity)) {
        const cluster = this.expandCluster(entity, connections, visited)
        if (cluster.entities.length >= 3) { // Minimum cluster size
          clusters.push(cluster)
        }
      }
    })
    
    return clusters
  }

  private expandCluster(
    entity: string, 
    connections: Map<string, Set<string>>, 
    visited: Set<string>
  ): EntityCluster {
    const clusterEntities = new Set([entity])
    const queue = [entity]
    visited.add(entity)
    
    while (queue.length > 0) {
      const current = queue.shift()!
      const neighbors = connections.get(current) || new Set()
      
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          clusterEntities.add(neighbor)
          queue.push(neighbor)
        }
      })
    }
    
    return {
      clusterId: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entities: Array.from(clusterEntities),
      clusterStrength: this.calculateClusterStrength(clusterEntities, connections),
      averageCorrelation: 0.7, // Placeholder
      dominantType: 'mixed',
      description: `Entity cluster with ${clusterEntities.size} members`,
      members: Array.from(clusterEntities).map(e => ({
        entity: e,
        type: 'unknown',
        centrality: this.calculateCentrality(e, clusterEntities, connections)
      }))
    }
  }

  private calculateClusterStrength(entities: Set<string>, connections: Map<string, Set<string>>): number {
    let totalConnections = 0
    let possibleConnections = 0
    
    entities.forEach(entity1 => {
      entities.forEach(entity2 => {
        if (entity1 !== entity2) {
          possibleConnections++
          if (connections.get(entity1)?.has(entity2)) {
            totalConnections++
          }
        }
      })
    })
    
    return possibleConnections > 0 ? totalConnections / possibleConnections : 0
  }

  private calculateCentrality(entity: string, cluster: Set<string>, connections: Map<string, Set<string>>): number {
    const entityConnections = connections.get(entity) || new Set()
    const clusterConnections = Array.from(cluster).filter(e => e !== entity && entityConnections.has(e))
    return cluster.size > 1 ? clusterConnections.length / (cluster.size - 1) : 0
  }

  private analyzeClusterPattern(cluster: EntityCluster, moments: PivotalMoment[]): EntityClusterPattern {
    // Determine cluster type based on entity analysis
    const clusterType = this.determineClusterType(cluster.entities, moments)
    
    return {
      clusterId: cluster.clusterId,
      entities: cluster.entities,
      clusterType,
      strength: cluster.clusterStrength,
      coherence: cluster.averageCorrelation,
      description: this.generateClusterDescription(cluster.entities, clusterType),
      keyConnections: this.identifyKeyConnections(cluster.entities, moments)
    }
  }

  private determineClusterType(entities: string[], moments: PivotalMoment[]): EntityClusterPattern['clusterType'] {
    // Simple heuristic - in production would use more sophisticated analysis
    const hasMultipleCompanies = entities.filter(e => this.isCompany(e, moments)).length > 2
    const hasTechnologies = entities.some(e => this.isTechnology(e, moments))
    
    if (hasMultipleCompanies && hasTechnologies) {
      return 'technology_ecosystem'
    } else if (hasMultipleCompanies) {
      return 'competitive_group'
    } else {
      return 'market_segment'
    }
  }

  private generateClusterDescription(entities: string[], type: EntityClusterPattern['clusterType']): string {
    switch (type) {
      case 'technology_ecosystem':
        return `Technology ecosystem involving ${entities.length} entities with strong interconnections`
      case 'competitive_group':
        return `Competitive group of ${entities.length} companies with similar market positioning`
      case 'partnership_network':
        return `Partnership network connecting ${entities.length} entities through strategic alliances`
      default:
        return `Market segment cluster with ${entities.length} related entities`
    }
  }

  private identifyKeyConnections(entities: string[], moments: PivotalMoment[]): Array<{
    entity1: string
    entity2: string
    relationship: string
    strength: number
  }> {
    const connections: Array<{entity1: string, entity2: string, relationship: string, strength: number}> = []
    
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const strength = this.calculateConnectionStrength(entities[i], entities[j], moments)
        if (strength > 0.5) {
          connections.push({
            entity1: entities[i],
            entity2: entities[j],
            relationship: this.inferRelationshipType(entities[i], entities[j], moments),
            strength
          })
        }
      }
    }
    
    return connections.sort((a, b) => b.strength - a.strength).slice(0, 5)
  }

  private calculateConnectionStrength(entity1: string, entity2: string, moments: PivotalMoment[]): number {
    const cooccurrences = moments.filter(moment => 
      this.momentContainsEntity(moment, entity1) && this.momentContainsEntity(moment, entity2)
    )
    
    const totalMoments = moments.length
    return totalMoments > 0 ? cooccurrences.length / Math.sqrt(totalMoments) : 0
  }

  private inferRelationshipType(entity1: string, entity2: string, moments: PivotalMoment[]): string {
    // Simple heuristic - would use NLP in production
    const commonMoments = moments.filter(moment => 
      this.momentContainsEntity(moment, entity1) && this.momentContainsEntity(moment, entity2)
    )
    
    const contentText = commonMoments.map(m => m.content || '').join(' ').toLowerCase()
    
    if (contentText.includes('partnership') || contentText.includes('collaboration')) {
      return 'partnership'
    } else if (contentText.includes('competition') || contentText.includes('rival')) {
      return 'competition'
    } else if (contentText.includes('acquisition') || contentText.includes('merger')) {
      return 'acquisition'
    } else {
      return 'association'
    }
  }

  private detectCyclicalPatterns(moments: PivotalMoment[]): TemporalPattern[] {
    // Detect weekly/monthly/quarterly patterns
    const patterns: TemporalPattern[] = []
    
    // Group moments by time periods
    const weeklyGroups = this.groupMomentsByPeriod(moments, 'week')
    const monthlyGroups = this.groupMomentsByPeriod(moments, 'month')
    
    // Analyze for cyclical behavior
    if (this.hasCyclicalBehavior(weeklyGroups)) {
      patterns.push(this.createCyclicalPattern(weeklyGroups, 'weekly'))
    }
    
    if (this.hasCyclicalBehavior(monthlyGroups)) {
      patterns.push(this.createCyclicalPattern(monthlyGroups, 'monthly'))
    }
    
    return patterns
  }

  private detectCascadePatterns(moments: PivotalMoment[]): TemporalPattern[] {
    // Detect cascading events (one event triggering others)
    const patterns: TemporalPattern[] = []
    const timeWindow = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    
    moments.forEach((moment, index) => {
      const cascadeEvents = moments.filter((other, otherIndex) => {
        if (otherIndex <= index) return false
        
        const timeDiff = new Date(other.extractedAt).getTime() - new Date(moment.extractedAt).getTime()
        return timeDiff > 0 && timeDiff <= timeWindow
      })
      
      if (cascadeEvents.length >= 3) { // Minimum cascade size
        patterns.push({
          patternId: `cascade_${moment.id}`,
          type: 'cascade',
          period: '7-day window',
          entities: this.extractEntitiesFromMoment(moment),
          timeWindows: [{
            start: new Date(moment.extractedAt),
            end: new Date(Math.max(...cascadeEvents.map(e => new Date(e.extractedAt).getTime()))),
            intensity: cascadeEvents.length,
            events: cascadeEvents.length + 1
          }],
          strength: Math.min(cascadeEvents.length / 10, 1), // Normalize to 0-1
          predictability: 0.6 // Moderate predictability for cascades
        })
      }
    })
    
    return patterns
  }

  private detectTrendPatterns(moments: PivotalMoment[]): TemporalPattern[] {
    // Detect trending topics/entities over time
    const patterns: TemporalPattern[] = []
    const entities = this.getAllUniqueEntities(moments)
    
    entities.forEach(entity => {
      const entityMoments = moments.filter(m => this.momentContainsEntity(m, entity))
      if (entityMoments.length < 3) return
      
      const trendStrength = this.calculateTrendStrength(entityMoments)
      if (trendStrength > 0.4) {
        patterns.push({
          patternId: `trend_${entity}`,
          type: 'trend',
          period: 'ongoing',
          entities: [entity],
          timeWindows: this.createTrendWindows(entityMoments),
          strength: trendStrength,
          predictability: 0.7,
          nextExpected: this.predictNextOccurrence(entityMoments)
        })
      }
    })
    
    return patterns
  }

  private detectAnomalyPatterns(moments: PivotalMoment[]): TemporalPattern[] {
    // Detect unusual activity spikes
    const patterns: TemporalPattern[] = []
    const dailyGroups = this.groupMomentsByPeriod(moments, 'day')
    
    const avgDaily = Object.values(dailyGroups).reduce((sum, group) => sum + group.length, 0) / Object.keys(dailyGroups).length
    const threshold = avgDaily * 2 // Anomaly threshold
    
    Object.entries(dailyGroups).forEach(([date, dayMoments]) => {
      if (dayMoments.length > threshold) {
        patterns.push({
          patternId: `anomaly_${date}`,
          type: 'anomaly',
          period: 'single day',
          entities: [...new Set(dayMoments.flatMap(m => this.extractEntitiesFromMoment(m)))],
          timeWindows: [{
            start: new Date(date),
            end: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
            intensity: dayMoments.length / avgDaily,
            events: dayMoments.length
          }],
          strength: Math.min(dayMoments.length / threshold, 1),
          predictability: 0.2 // Low predictability for anomalies
        })
      }
    })
    
    return patterns
  }

  private calculateUnexpectedness(entity1: string, entity2: string, moments: PivotalMoment[]): number {
    // Calculate how unexpected the connection is based on entity types and typical associations
    const entity1Type = this.inferEntityType(entity1, moments)
    const entity2Type = this.inferEntityType(entity2, moments)
    
    // Cross-industry connections are more unexpected
    if (entity1Type !== entity2Type) {
      return 80 + Math.random() * 20 // 80-100% unexpected
    }
    
    // Same-type entities with low historical association
    const historicalAssociation = this.calculateHistoricalAssociation(entity1, entity2, moments)
    return Math.max(0, 70 - historicalAssociation * 100)
  }

  private analyzeSurpriseConnection(
    entity1: string, 
    entity2: string, 
    cooccurrences: PivotalMoment[], 
    allMoments: PivotalMoment[]
  ): SurpriseConnection {
    const connectionType = this.determineSurpriseConnectionType(entity1, entity2, cooccurrences)
    
    return {
      connectionId: `surprise_${entity1}_${entity2}`,
      entity1,
      entity2,
      unexpectedness: this.calculateUnexpectedness(entity1, entity2, allMoments),
      significance: cooccurrences.length / allMoments.length * 100,
      connectionType,
      explanation: this.generateConnectionExplanation(entity1, entity2, connectionType, cooccurrences),
      supportingEvidence: cooccurrences.map(m => m.content || '').filter(Boolean),
      riskLevel: this.assessConnectionRisk(connectionType, cooccurrences)
    }
  }

  private determineSurpriseConnectionType(
    entity1: string, 
    entity2: string, 
    moments: PivotalMoment[]
  ): SurpriseConnection['connectionType'] {
    const contentText = moments.map(m => m.content || '').join(' ').toLowerCase()
    
    if (contentText.includes('partnership') || contentText.includes('alliance')) {
      return 'unexpected_partnership'
    } else if (contentText.includes('technology') || contentText.includes('innovation')) {
      return 'technological_leap'
    } else if (contentText.includes('market') || contentText.includes('industry')) {
      return 'cross_industry'
    } else {
      return 'competitive_shift'
    }
  }

  private generateConnectionExplanation(
    entity1: string, 
    entity2: string, 
    type: SurpriseConnection['connectionType'], 
    moments: PivotalMoment[]
  ): string {
    switch (type) {
      case 'unexpected_partnership':
        return `${entity1} and ${entity2} have formed an unexpected strategic partnership`
      case 'technological_leap':
        return `${entity1} and ${entity2} are connected through breakthrough technology development`
      case 'cross_industry':
        return `${entity1} and ${entity2} represent a surprising cross-industry connection`
      default:
        return `${entity1} and ${entity2} show an unexpected competitive dynamic shift`
    }
  }

  private assessConnectionRisk(type: SurpriseConnection['connectionType'], moments: PivotalMoment[]): SurpriseConnection['riskLevel'] {
    const avgImpact = moments.reduce((sum, m) => sum + m.impact.score, 0) / moments.length
    
    if (avgImpact > 80) return 'high'
    if (avgImpact > 60) return 'medium'
    return 'low'
  }

  private calculateFactorCorrelation(factor1: string, factor2: string, moments: PivotalMoment[]): TrendCorrelation {
    const factor1Moments = moments.filter(m => this.momentContainsFactor(m, factor1))
    const factor2Moments = moments.filter(m => this.momentContainsFactor(m, factor2))
    
    // Calculate temporal correlation
    const correlation = correlationAnalysisEngine.calculateEntityCorrelation(factor1, factor2, moments)
    
    return {
      correlationId: `trend_${factor1}_${factor2}`,
      factors: [factor1, factor2],
      correlationType: correlation.correlationCoefficient > 0 ? 'positive' : 'negative',
      strength: Math.abs(correlation.correlationCoefficient),
      confidence: correlation.significance === 'VERY_HIGH' ? 95 : 
                  correlation.significance === 'HIGH' ? 85 : 
                  correlation.significance === 'MEDIUM' ? 70 : 50,
      description: `${factor1} and ${factor2} show ${correlation.correlationCoefficient > 0 ? 'positive' : 'negative'} correlation`,
      implications: [
        `Changes in ${factor1} may predict changes in ${factor2}`,
        `Joint monitoring of these factors recommended`
      ]
    }
  }

  private createClusterInsight(cluster: EntityClusterPattern): PatternInsight {
    return {
      id: cluster.clusterId,
      type: 'cluster',
      title: `${cluster.clusterType.replace('_', ' ').toUpperCase()}: ${cluster.entities.length} Entity Cluster`,
      description: cluster.description,
      confidence: Math.round(cluster.strength * 100),
      severity: cluster.strength > 0.8 ? 'high' : cluster.strength > 0.6 ? 'medium' : 'low',
      entities: cluster.entities,
      metrics: {
        strength: cluster.strength,
        significance: cluster.coherence,
        frequency: cluster.keyConnections.length,
        impact_score: cluster.keyConnections.reduce((sum, conn) => sum + conn.strength, 0) / cluster.keyConnections.length || 0
      },
      evidence: {
        moments: [],
        correlations: cluster.keyConnections.map(conn => `${conn.entity1}-${conn.entity2}`),
        patterns: [cluster.clusterType]
      },
      aiInsights: [
        `This ${cluster.clusterType} shows strong internal connectivity (${(cluster.strength * 100).toFixed(1)}%)`,
        `Key relationships include ${cluster.keyConnections.slice(0, 2).map(c => `${c.entity1}-${c.entity2}`).join(', ')}`,
        `Cluster coherence indicates ${cluster.coherence > 0.7 ? 'stable' : 'emerging'} market dynamics`
      ],
      actionableRecommendations: [
        `Monitor cluster evolution for market trend indicators`,
        `Analyze competitive positioning within this cluster`,
        `Investigate partnership opportunities among cluster entities`
      ]
    }
  }

  private createTemporalInsight(pattern: TemporalPattern): PatternInsight {
    return {
      id: pattern.patternId,
      type: 'temporal_pattern',
      title: `${pattern.type.toUpperCase()}: ${pattern.period} Pattern`,
      description: `${pattern.type} pattern involving ${pattern.entities.length} entities`,
      confidence: Math.round(pattern.predictability * 100),
      severity: pattern.strength > 0.8 ? 'critical' : pattern.strength > 0.6 ? 'high' : 'medium',
      entities: pattern.entities,
      timeframe: pattern.timeWindows[0] ? {
        start: pattern.timeWindows[0].start,
        end: pattern.timeWindows[pattern.timeWindows.length - 1].end,
        period: pattern.period
      } : undefined,
      metrics: {
        strength: pattern.strength,
        significance: pattern.predictability,
        frequency: pattern.timeWindows.length,
        impact_score: pattern.timeWindows.reduce((sum, w) => sum + w.intensity, 0) / pattern.timeWindows.length
      },
      evidence: {
        moments: [],
        correlations: [],
        patterns: [pattern.type]
      },
      aiInsights: [
        `${pattern.type} pattern detected with ${(pattern.strength * 100).toFixed(1)}% strength`,
        `Pattern ${pattern.predictability > 0.7 ? 'highly' : 'moderately'} predictable`,
        pattern.nextExpected ? `Next occurrence expected around ${pattern.nextExpected.toLocaleDateString()}` : 'Timing uncertain'
      ],
      actionableRecommendations: [
        `Use pattern timing for strategic planning`,
        `Monitor pattern continuation/disruption`,
        `Prepare contingency plans for pattern breaks`
      ]
    }
  }

  private createSurpriseInsight(surprise: SurpriseConnection): PatternInsight {
    return {
      id: surprise.connectionId,
      type: 'surprise_connection',
      title: `SURPRISE: ${surprise.entity1} ↔ ${surprise.entity2}`,
      description: surprise.explanation,
      confidence: Math.round(surprise.unexpectedness),
      severity: surprise.riskLevel === 'high' ? 'critical' : surprise.riskLevel === 'medium' ? 'high' : 'medium',
      entities: [surprise.entity1, surprise.entity2],
      metrics: {
        strength: surprise.significance / 100,
        significance: surprise.unexpectedness / 100,
        frequency: 1, // Single connection
        impact_score: surprise.riskLevel === 'high' ? 0.9 : surprise.riskLevel === 'medium' ? 0.6 : 0.3
      },
      evidence: {
        moments: [],
        correlations: [surprise.connectionId],
        patterns: [surprise.connectionType]
      },
      aiInsights: [
        `Highly unexpected connection (${surprise.unexpectedness.toFixed(1)}% surprise level)`,
        `Connection type: ${surprise.connectionType.replace('_', ' ')}`,
        `Risk assessment: ${surprise.riskLevel} level`
      ],
      actionableRecommendations: [
        `Investigate connection implications immediately`,
        `Monitor for additional unexpected developments`,
        `Assess competitive/strategic impact`
      ]
    }
  }

  private createTrendInsight(trend: TrendCorrelation): PatternInsight {
    return {
      id: trend.correlationId,
      type: 'trend_correlation',
      title: `TREND: ${trend.factors.join(' ↔ ')}`,
      description: trend.description,
      confidence: trend.confidence,
      severity: trend.strength > 0.8 ? 'high' : trend.strength > 0.6 ? 'medium' : 'low',
      entities: trend.factors,
      metrics: {
        strength: trend.strength,
        significance: trend.confidence / 100,
        frequency: 1,
        impact_score: trend.strength
      },
      evidence: {
        moments: [],
        correlations: [trend.correlationId],
        patterns: [trend.correlationType]
      },
      aiInsights: [
        `${trend.correlationType} correlation with ${(trend.strength * 100).toFixed(1)}% strength`,
        `Confidence level: ${trend.confidence}%`,
        trend.lagDays ? `${trend.lagDays}-day lag detected` : 'Simultaneous correlation'
      ],
      actionableRecommendations: trend.implications
    }
  }

  // Helper methods
  private extractEntitiesFromMoment(moment: PivotalMoment): string[] {
    const entities: string[] = []
    
    entities.push(...(moment.entities?.companies || []))
    entities.push(...(moment.entities?.technologies || []))
    entities.push(...(moment.entities?.people || []))
    entities.push(...(moment.entities?.locations || []))
    entities.push(...(moment.classification?.keywords || []))
    entities.push(moment.source.name)
    
    return [...new Set(entities)] // Remove duplicates
  }

  private extractAllFactors(moments: PivotalMoment[]): string[] {
    const factors = new Set<string>()
    
    moments.forEach(moment => {
      moment.classification?.microFactors?.forEach(f => factors.add(f))
      moment.classification?.macroFactors?.forEach(f => factors.add(f))
    })
    
    return Array.from(factors)
  }

  private getAllUniqueEntities(moments: PivotalMoment[]): string[] {
    const entities = new Set<string>()
    
    moments.forEach(moment => {
      this.extractEntitiesFromMoment(moment).forEach(entity => entities.add(entity))
    })
    
    return Array.from(entities)
  }

  private getAllEntityPairs(moments: PivotalMoment[]): Array<{entity1: string, entity2: string, cooccurrences: PivotalMoment[]}> {
    const pairs: Array<{entity1: string, entity2: string, cooccurrences: PivotalMoment[]}> = []
    const entities = this.getAllUniqueEntities(moments)
    
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const cooccurrences = moments.filter(moment => 
          this.momentContainsEntity(moment, entities[i]) && 
          this.momentContainsEntity(moment, entities[j])
        )
        
        if (cooccurrences.length > 0) {
          pairs.push({
            entity1: entities[i],
            entity2: entities[j],
            cooccurrences
          })
        }
      }
    }
    
    return pairs
  }

  private momentContainsEntity(moment: PivotalMoment, entity: string): boolean {
    return this.extractEntitiesFromMoment(moment).includes(entity)
  }

  private momentContainsFactor(moment: PivotalMoment, factor: string): boolean {
    return [...(moment.classification?.microFactors || []), ...(moment.classification?.macroFactors || [])].includes(factor as any)
  }

  private isCompany(entity: string, moments: PivotalMoment[]): boolean {
    return moments.some(m => m.entities?.companies?.includes(entity))
  }

  private isTechnology(entity: string, moments: PivotalMoment[]): boolean {
    return moments.some(m => m.entities?.technologies?.includes(entity))
  }

  private inferEntityType(entity: string, moments: PivotalMoment[]): string {
    if (this.isCompany(entity, moments)) return 'company'
    if (this.isTechnology(entity, moments)) return 'technology'
    return 'concept'
  }

  private groupMomentsByPeriod(moments: PivotalMoment[], period: 'day' | 'week' | 'month'): Record<string, PivotalMoment[]> {
    const groups: Record<string, PivotalMoment[]> = {}
    
    moments.forEach(moment => {
      const date = new Date(moment.extractedAt)
      let key: string
      
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
      }
      
      if (!groups[key]) groups[key] = []
      groups[key].push(moment)
    })
    
    return groups
  }

  private hasCyclicalBehavior(groups: Record<string, PivotalMoment[]>): boolean {
    // Simple heuristic - check if there's repeating patterns
    const counts = Object.values(groups).map(group => group.length)
    const avg = counts.reduce((sum, c) => sum + c, 0) / counts.length
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length
    
    // Low variance indicates cyclical behavior
    return variance < avg * 0.5
  }

  private createCyclicalPattern(groups: Record<string, PivotalMoment[]>, period: string): TemporalPattern {
    const timeWindows = Object.entries(groups).map(([date, moments]) => ({
      start: new Date(date),
      end: new Date(new Date(date).getTime() + (period === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000),
      intensity: moments.length,
      events: moments.length
    }))
    
    return {
      patternId: `cyclical_${period}`,
      type: 'cyclical',
      period,
      entities: [...new Set(Object.values(groups).flat().flatMap(m => this.extractEntitiesFromMoment(m)))],
      timeWindows,
      strength: 0.7, // Moderate strength for detected cycles
      predictability: 0.8 // High predictability for cycles
    }
  }

  private calculateTrendStrength(moments: PivotalMoment[]): number {
    if (moments.length < 3) return 0
    
    // Simple trend calculation based on moment frequency over time
    const sortedMoments = moments.sort((a, b) => 
      new Date(a.extractedAt).getTime() - new Date(b.extractedAt).getTime()
    )
    
    const firstHalf = sortedMoments.slice(0, Math.floor(sortedMoments.length / 2))
    const secondHalf = sortedMoments.slice(Math.floor(sortedMoments.length / 2))
    
    const firstHalfRate = firstHalf.length
    const secondHalfRate = secondHalf.length
    
    // Positive trend if second half has more moments
    return secondHalfRate > firstHalfRate ? (secondHalfRate - firstHalfRate) / firstHalfRate : 0
  }

  private createTrendWindows(moments: PivotalMoment[]): TemporalPattern['timeWindows'] {
    const sortedMoments = moments.sort((a, b) => 
      new Date(a.extractedAt).getTime() - new Date(b.extractedAt).getTime()
    )
    
    if (sortedMoments.length === 0) return []
    
    return [{
      start: new Date(sortedMoments[0].extractedAt),
      end: new Date(sortedMoments[sortedMoments.length - 1].extractedAt),
      intensity: moments.length,
      events: moments.length
    }]
  }

  private predictNextOccurrence(moments: PivotalMoment[]): Date | undefined {
    if (moments.length < 2) return undefined
    
    const sortedMoments = moments.sort((a, b) => 
      new Date(a.extractedAt).getTime() - new Date(b.extractedAt).getTime()
    )
    
    // Calculate average interval
    let totalInterval = 0
    for (let i = 1; i < sortedMoments.length; i++) {
      totalInterval += new Date(sortedMoments[i].extractedAt).getTime() - 
                     new Date(sortedMoments[i-1].extractedAt).getTime()
    }
    
    const avgInterval = totalInterval / (sortedMoments.length - 1)
    const lastMoment = new Date(sortedMoments[sortedMoments.length - 1].extractedAt)
    
    return new Date(lastMoment.getTime() + avgInterval)
  }

  private calculateHistoricalAssociation(entity1: string, entity2: string, moments: PivotalMoment[]): number {
    const cooccurrences = moments.filter(moment => 
      this.momentContainsEntity(moment, entity1) && this.momentContainsEntity(moment, entity2)
    )
    
    const entity1Count = moments.filter(m => this.momentContainsEntity(m, entity1)).length
    const entity2Count = moments.filter(m => this.momentContainsEntity(m, entity2)).length
    
    if (entity1Count === 0 || entity2Count === 0) return 0
    
    return cooccurrences.length / Math.min(entity1Count, entity2Count)
  }
}

// Initialize singleton instance
const patternDiscoveryEngine = PatternDiscoveryEngine.getInstance()

export function PatternDiscoveryPanel({ moments, className }: PatternDiscoveryPanelProps) {
  const { moments: storeMoments } = useMomentsStore()
  const { companies, technologies } = useCatalogStore()
  
  const activeMoments = moments || storeMoments
  
  // State management
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [clusters, setClusters] = useState<EntityClusterPattern[]>([])
  const [temporalPatterns, setTemporalPatterns] = useState<TemporalPattern[]>([])
  const [surpriseConnections, setSurpriseConnections] = useState<SurpriseConnection[]>([])
  const [trendCorrelations, setTrendCorrelations] = useState<TrendCorrelation[]>([])
  const [insights, setInsights] = useState<PatternInsight[]>([])
  const [selectedInsight, setSelectedInsight] = useState<PatternInsight | null>(null)
  
  // Filter settings
  const [enableClusterDetection, setEnableClusterDetection] = useState(true)
  const [enableTemporalAnalysis, setEnableTemporalAnalysis] = useState(true)
  const [enableSurpriseDetection, setEnableSurpriseDetection] = useState(true)
  const [enableTrendAnalysis, setEnableTrendAnalysis] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState(60)

  // Pattern discovery analysis
  const runPatternDiscovery = useCallback(async () => {
    if (activeMoments.length === 0) return
    
    setIsAnalyzing(true)
    
    try {
      console.log('[PatternDiscovery] Starting comprehensive pattern analysis...')
      
      const results = await Promise.all([
        enableClusterDetection ? patternDiscoveryEngine.discoverEntityClusters(activeMoments) : [],
        enableTemporalAnalysis ? patternDiscoveryEngine.detectTemporalPatterns(activeMoments) : [],
        enableSurpriseDetection ? patternDiscoveryEngine.identifySurpriseConnections(activeMoments) : [],
        enableTrendAnalysis ? patternDiscoveryEngine.analyzeTrendCorrelations(activeMoments) : []
      ])
      
      const [clusterResults, temporalResults, surpriseResults, trendResults] = results
      
      setClusters(clusterResults)
      setTemporalPatterns(temporalResults)
      setSurpriseConnections(surpriseResults)
      setTrendCorrelations(trendResults)
      
      // Generate AI insights
      const allInsights = patternDiscoveryEngine.generateAIInsights(
        clusterResults,
        temporalResults,
        surpriseResults,
        trendResults
      )
      
      setInsights(allInsights.filter(insight => insight.confidence >= confidenceThreshold))
      
      console.log(`[PatternDiscovery] Analysis complete: ${clusterResults.length} clusters, ${temporalResults.length} temporal patterns, ${surpriseResults.length} surprises, ${trendResults.length} trends`)
      
    } catch (error) {
      console.error('[PatternDiscovery] Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [activeMoments, enableClusterDetection, enableTemporalAnalysis, enableSurpriseDetection, enableTrendAnalysis, confidenceThreshold])

  // Run analysis when moments change
  useEffect(() => {
    if (activeMoments.length > 0) {
      runPatternDiscovery()
    }
  }, [activeMoments.length, runPatternDiscovery])

  // Filter insights by confidence
  const filteredInsights = useMemo(() => {
    return insights.filter(insight => insight.confidence >= confidenceThreshold)
      .sort((a, b) => {
        // Sort by severity first, then confidence
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
        return severityDiff !== 0 ? severityDiff : b.confidence - a.confidence
      })
  }, [insights, confidenceThreshold])

  const getSeverityIcon = (severity: PatternInsight['severity']) => {
    switch (severity) {
      case 'critical': return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
      case 'high': return <BoltIcon className="w-4 h-4 text-orange-600" />
      case 'medium': return <LightBulbIcon className="w-4 h-4 text-yellow-600" />
      default: return <SparklesIcon className="w-4 h-4 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: PatternInsight['severity']) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50'
      case 'high': return 'border-orange-200 bg-orange-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      default: return 'border-blue-200 bg-blue-50'
    }
  }

  const getTypeIcon = (type: PatternInsight['type']) => {
    switch (type) {
      case 'cluster': return <CircleStackIcon className="w-4 h-4" />
      case 'temporal_pattern': return <ClockIcon className="w-4 h-4" />
      case 'surprise_connection': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'trend_correlation': return <ArrowTrendingUpIcon className="w-4 h-4" />
    }
  }

  return (
    <Card className={`w-full max-w-full overflow-hidden ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold flex items-center">
              <SparklesIcon className="w-5 h-5 mr-2" />
              Pattern Discovery Panel
            </CardTitle>
            <CardDescription>
              AI-powered pattern recognition with automated insights and emerging trend detection
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            <Badge variant="secondary">
              <BeakerIcon className="w-3 h-3 mr-1" />
              {filteredInsights.length} Insights
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={runPatternDiscovery}
              disabled={isAnalyzing || activeMoments.length === 0}
            >
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 max-w-full overflow-hidden">
        {/* Analysis Controls */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <div className="flex items-center space-x-4">
            <SparklesIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Pattern Detection Settings</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={enableClusterDetection}
                onCheckedChange={setEnableClusterDetection}
              />
              <span className="text-sm">Entity Clustering</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={enableTemporalAnalysis}
                onCheckedChange={setEnableTemporalAnalysis}
              />
              <span className="text-sm">Temporal Patterns</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={enableSurpriseDetection}
                onCheckedChange={setEnableSurpriseDetection}
              />
              <span className="text-sm">Surprise Connections</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={enableTrendAnalysis}
                onCheckedChange={setEnableTrendAnalysis}
              />
              <span className="text-sm">Trend Correlations</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium">Confidence Threshold</label>
              <select
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                className="w-full text-xs border rounded px-2 py-1"
              >
                <option value={40}>40% (Show All)</option>
                <option value={60}>60% (Medium+)</option>
                <option value={80}>80% (High Only)</option>
                <option value={90}>90% (Very High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        {!isAnalyzing && (clusters.length > 0 || temporalPatterns.length > 0 || surpriseConnections.length > 0 || trendCorrelations.length > 0) && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <div className="text-lg font-semibold text-blue-600">{clusters.length}</div>
              <div className="text-xs text-muted-foreground">Entity Clusters</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-lg font-semibold text-green-600">{temporalPatterns.length}</div>
              <div className="text-xs text-muted-foreground">Temporal Patterns</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-lg font-semibold text-orange-600">{surpriseConnections.length}</div>
              <div className="text-xs text-muted-foreground">Surprise Connections</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-lg font-semibold text-purple-600">{trendCorrelations.length}</div>
              <div className="text-xs text-muted-foreground">Trend Correlations</div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isAnalyzing && (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Discovering patterns and generating insights...</p>
          </div>
        )}

        {/* Pattern Insights */}
        {!isAnalyzing && filteredInsights.length > 0 && (
          <div className="space-y-4 w-full max-w-full overflow-hidden">
            <h3 className="font-medium flex items-center">
              <LightBulbIcon className="w-4 h-4 mr-2" />
              AI-Generated Insights ({filteredInsights.length})
            </h3>
            
            <div className="space-y-3">
              {filteredInsights.slice(0, 8).map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${getSeverityColor(insight.severity)} max-w-full overflow-hidden`}
                  onClick={() => setSelectedInsight(insight)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap">
                        {getSeverityIcon(insight.severity)}
                        {getTypeIcon(insight.type)}
                        <span className="font-medium text-sm break-words">{insight.title}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {insight.entities.slice(0, 4).map(entity => (
                          <Badge key={entity} variant="secondary" className="text-xs">
                            {entity.length > 20 ? entity.substring(0, 18) + '...' : entity}
                          </Badge>
                        ))}
                        {insight.entities.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{insight.entities.length - 4} more
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Key Insight:</span> {insight.aiInsights[0]}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground mb-1">Impact</div>
                      <div className="text-sm font-mono">
                        {(insight.metrics.impact_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Insight Details */}
        {selectedInsight && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-medium text-blue-900">{selectedInsight.title}</h4>
                <p className="text-sm text-blue-700 mt-1">{selectedInsight.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedInsight(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm font-medium text-blue-900 mb-2">AI Insights</div>
                <ul className="text-sm text-blue-700 space-y-1">
                  {selectedInsight.aiInsights.map((insight, idx) => (
                    <li key={idx}>• {insight}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <div className="text-sm font-medium text-blue-900 mb-2">Recommendations</div>
                <ul className="text-sm text-blue-700 space-y-1">
                  {selectedInsight.actionableRecommendations.map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm font-medium text-blue-900">Strength</div>
                <div className="text-lg font-mono text-blue-700">
                  {(selectedInsight.metrics.strength * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-900">Significance</div>
                <div className="text-lg font-mono text-blue-700">
                  {(selectedInsight.metrics.significance * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-900">Frequency</div>
                <div className="text-lg font-mono text-blue-700">
                  {selectedInsight.metrics.frequency}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-900">Impact</div>
                <div className="text-lg font-mono text-blue-700">
                  {(selectedInsight.metrics.impact_score * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isAnalyzing && activeMoments.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <SparklesIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No moments available for pattern discovery.</p>
            <p className="text-sm mt-2">Generate some moments first to discover emerging patterns.</p>
          </div>
        )}

        {/* No patterns found */}
        {!isAnalyzing && activeMoments.length > 0 && filteredInsights.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <BeakerIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No significant patterns detected with current settings.</p>
            <p className="text-sm mt-2">Try lowering the confidence threshold or adjusting detection settings.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}