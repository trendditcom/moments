'use client'

import React, { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  KnowledgeGrowthCard,
  TrendingFactorsCard,
  EntityNetworkCard,  
  MomentTimelineCard,
  CorrelationInsightsCard,
  AIInsightsCard,
  DashboardPlaceholder
} from '@/components/dashboard-components'
import { KnowledgeGrowthMetrics } from '@/components/dashboard-growth-metrics'
import { FactorDistributionAnalytics } from '@/components/dashboard-factor-analytics'
import { RelationshipMatrix } from '@/components/dashboard-relationship-matrix'
import { TemporalAnalysis } from '@/components/dashboard-temporal-analysis'
import { AIInsightsIntegration } from '@/components/ai-insights-integration'
import { AIInsightsEngine } from '@/lib/ai-insights-engine'
import { Company, Technology } from '@/types/catalog'
import { PivotalMoment } from '@/types/moments'
import { 
  ChartPieIcon,
  MapIcon,
  CalendarIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'

interface DashboardViewProps {
  companies: Company[]
  technologies: Technology[]
  moments: PivotalMoment[]
  isLoading?: boolean
}

export function DashboardView({ companies, technologies, moments, isLoading = false }: DashboardViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  const [analysisDepth, setAnalysisDepth] = useState<'strategic' | 'tactical' | 'operational'>('strategic')
  const [showAIInsightsModal, setShowAIInsightsModal] = useState(false)

  // Generate AI insights
  const aiInsights = useMemo(() => {
    if (moments.length === 0) return null
    
    const engine = AIInsightsEngine.getInstance()
    return {
      alerts: engine.generateAlerts(moments, companies, technologies),
      recommendations: engine.generateRecommendations(moments, companies, technologies)
    }
  }, [moments, companies, technologies])

  // Calculate dashboard metrics from actual data
  const dashboardMetrics = useMemo(() => {
    const totalMoments = moments.length
    const highImpactMoments = moments.filter(m => m.impact.score > 70).length
    const recentMoments = moments.filter(m => {
      const momentDate = new Date(m.timeline?.estimatedDate || m.extractedAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return momentDate > weekAgo
    }).length

    // Calculate factor distribution
    const factorCounts = moments.reduce((acc, moment) => {
      const factors = [...(moment.classification?.microFactors || []), ...(moment.classification?.macroFactors || [])]
      factors.forEach(factor => {
        acc[factor] = (acc[factor] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const trendingFactors = Object.entries(factorCounts)
      .map(([name, count]) => ({
        name,
        count,
        change: Math.floor(Math.random() * 40) - 10, // Simulated change for now
        impact: (count > 10 ? 'high' : count > 5 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate correlations (simplified for now)
    const correlationCount = Math.floor(totalMoments * 0.3) // 30% of moments have correlations

    return {
      knowledgeGrowth: {
        totalMoments,
        growth: totalMoments > 50 ? 25 : totalMoments > 20 ? 15 : 8,
        trend: 'up' as const,
        velocity: Math.round(totalMoments / 7) || 1
      },
      trendingFactors,
      entityCount: {
        companies: companies.length,
        technologies: technologies.length,
        concepts: Math.floor((companies.length + technologies.length) * 1.5) // Estimated concepts
      },
      recentMoments,
      correlationCount,
      insightCount: (aiInsights?.alerts.length || 0) + (aiInsights?.recommendations.length || 0)
    }
  }, [companies, technologies, moments])

  const systemHealth = {
    dataHealth: (moments.length > 10 ? 'healthy' : moments.length > 0 ? 'warning' : 'error') as 'healthy' | 'warning' | 'error',
    processing: isLoading ? 5 : 0,
    performance: 95
  }

  if (isLoading && moments.length === 0) {
    return (
      <DashboardLayout
        analysisDepth={analysisDepth}
        onAnalysisDepthChange={setAnalysisDepth}
        timeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
        systemHealth={systemHealth}
      >
        {/* Loading state placeholders */}
        <DashboardPlaceholder
          title="Loading Dashboard"
          description="Analyzing your data and preparing insights..."
          icon={CpuChipIcon}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      analysisDepth={analysisDepth}
      onAnalysisDepthChange={setAnalysisDepth}
      timeframe={selectedTimeframe}
      onTimeframeChange={setSelectedTimeframe}
      systemHealth={systemHealth}
    >
      {/* Operational Tier - Visible only at operational level - TOP PRIORITY */}
      {analysisDepth === 'operational' && (
        <>
          <FactorDistributionAnalytics />
          
          <RelationshipMatrix />
          
          <TemporalAnalysis />
          
          <AIInsightsIntegration
            moments={moments}
            companies={companies}
            technologies={technologies}
            isLoading={isLoading}
          />
        </>
      )}

      {/* Tactical Tier - Visible at tactical and operational levels - SECOND PRIORITY */}
      {(analysisDepth === 'tactical' || analysisDepth === 'operational') && (
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[280px]">
            <MomentTimelineCard recentMoments={dashboardMetrics.recentMoments} />
          </div>
          <div className="flex-1 min-w-[280px]">
            <CorrelationInsightsCard correlationCount={dashboardMetrics.correlationCount} />
          </div>
          <div className="flex-1 min-w-[280px]">
            <AIInsightsCard 
              insightCount={dashboardMetrics.insightCount}
              alerts={aiInsights?.alerts || []}
              recommendations={aiInsights?.recommendations || []}
              onViewDetails={() => setShowAIInsightsModal(true)}
            />
          </div>
        </div>
      )}

      {/* Strategic Tier - Always visible - BASE FOUNDATION */}
      <KnowledgeGrowthMetrics />
      
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <TrendingFactorsCard factors={dashboardMetrics.trendingFactors} />
        </div>
        <div className="flex-1 min-w-[300px]">
          <EntityNetworkCard entityCount={dashboardMetrics.entityCount} />
        </div>
      </div>
    </DashboardLayout>
  )
}