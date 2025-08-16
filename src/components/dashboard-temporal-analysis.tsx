'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CalendarIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  EyeIcon,
  RectangleStackIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  CursorArrowRaysIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  Brush
} from 'recharts'
import { format, parseISO, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, 
         startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth,
         addDays, addWeeks, addMonths, subDays, subWeeks, subMonths,
         differenceInDays, differenceInWeeks, differenceInMonths,
         isWithinInterval } from 'date-fns'
import { PivotalMoment } from '@/types/moments'
import { useMomentsStore } from '@/store/moments-store'

// Types for temporal analysis
type TimeGranularity = 'hour' | 'day' | 'week' | 'month'
type ViewMode = 'timeline' | 'calendar' | 'streamgraph' | 'density'
type LayerType = 'events' | 'impact' | 'trends' | 'annotations' | 'predictions'

interface TimeSeriesDataPoint {
  date: string
  timestamp: number
  momentCount: number
  averageImpact: number
  highImpactCount: number
  mediumImpactCount: number
  lowImpactCount: number
  microFactorCount: number
  macroFactorCount: number
  companyMoments: number
  technologyMoments: number
  totalImpact: number
  density: number
  moments: PivotalMoment[]
}

interface EventAnnotation {
  date: string
  timestamp: number
  title: string
  description: string
  type: 'significant' | 'cluster' | 'anomaly' | 'prediction'
  impact: 'high' | 'medium' | 'low'
  moments: PivotalMoment[]
}

interface TrendData {
  date: string
  timestamp: number
  value: number
  trend: 'up' | 'down' | 'stable'
  momentum: number
  velocity: number
  acceleration: number
  seasonality?: number
  seasonalPattern: 'peak' | 'valley' | 'rising' | 'declining' | 'stable'
  forecast?: number
  confidence?: number
  anomalyScore: number
  isAnomaly: boolean
  anomalyExplanation?: string
}

interface MomentumIndicator {
  type: 'velocity' | 'acceleration' | 'momentum'
  value: number
  trend: 'up' | 'down' | 'stable'
  significance: 'low' | 'medium' | 'high'
  change: number
}

interface SeasonalPattern {
  pattern: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  strength: number
  phase: 'peak' | 'valley' | 'rising' | 'declining' | 'stable'
  nextExpected: Date
  confidence: number
}

interface AnomalyDetection {
  timestamp: number
  score: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'spike' | 'drop' | 'trend_break' | 'seasonal_deviation'
  explanation: string
  aiInsight: string
  affectedMetrics: string[]
}

interface TemporalAnalysisProps {
  className?: string
}

export function TemporalAnalysis({ className }: TemporalAnalysisProps) {
  const { moments } = useMomentsStore()
  
  // View controls
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('day')
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')
  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(new Set(['events', 'impact', 'trends'] as LayerType[]))
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesDataPoint | null>(null)

  // Calculate time range
  const timeRange = useMemo(() => {
    const now = new Date()
    let start: Date
    
    switch (selectedTimeRange) {
      case '7d':
        start = subDays(now, 7)
        break
      case '30d':
        start = subDays(now, 30)
        break
      case '90d':
        start = subDays(now, 90)
        break
      case '1y':
        start = subDays(now, 365)
        break
      case 'all':
      default:
        // Find earliest moment
        const dates = moments.map(m => new Date(m.timeline?.estimatedDate || m.extractedAt))
        start = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : subDays(now, 30)
        break
    }
    
    return { start, end: selectedDateRange?.end || now }
  }, [selectedTimeRange, selectedDateRange, moments])

  // Process temporal data
  const timeSeriesData = useMemo(() => {
    if (!moments.length) return []

    // Filter moments by time range
    const filteredMoments = moments.filter(moment => {
      const momentDate = new Date(moment.timeline?.estimatedDate || moment.extractedAt)
      return isWithinInterval(momentDate, timeRange)
    })

    // Generate time intervals based on granularity
    let intervals: Date[]
    switch (timeGranularity) {
      case 'hour':
        // For demonstration, we'll aggregate by day but could extend to hourly
        intervals = eachDayOfInterval(timeRange)
        break
      case 'day':
        intervals = eachDayOfInterval(timeRange)
        break
      case 'week':
        intervals = eachWeekOfInterval(timeRange)
        break
      case 'month':
        intervals = eachMonthOfInterval(timeRange)
        break
    }

    // Process each interval
    return intervals.map(intervalStart => {
      let intervalEnd: Date
      switch (timeGranularity) {
        case 'hour':
        case 'day':
          intervalEnd = endOfDay(intervalStart)
          break
        case 'week':
          intervalEnd = endOfWeek(intervalStart)
          break
        case 'month':
          intervalEnd = endOfMonth(intervalStart)
          break
      }

      // Find moments in this interval
      const intervalMoments = filteredMoments.filter(moment => {
        const momentDate = new Date(moment.timeline?.estimatedDate || moment.extractedAt)
        return isWithinInterval(momentDate, { start: intervalStart, end: intervalEnd })
      })

      // Calculate metrics
      const momentCount = intervalMoments.length
      const averageImpact = momentCount > 0 
        ? intervalMoments.reduce((sum, m) => sum + m.impact.score, 0) / momentCount 
        : 0
      
      const highImpactCount = intervalMoments.filter(m => m.impact.score > 70).length
      const mediumImpactCount = intervalMoments.filter(m => m.impact.score >= 40 && m.impact.score <= 70).length
      const lowImpactCount = intervalMoments.filter(m => m.impact.score < 40).length
      
      const microFactorCount = intervalMoments.reduce((sum, m) => 
        sum + (m.classification?.microFactors?.length || 0), 0)
      const macroFactorCount = intervalMoments.reduce((sum, m) => 
        sum + (m.classification?.macroFactors?.length || 0), 0)
      
      const companyMoments = intervalMoments.filter(m => m.source.type === 'company').length
      const technologyMoments = intervalMoments.filter(m => m.source.type === 'technology').length
      
      const totalImpact = intervalMoments.reduce((sum, m) => sum + m.impact.score, 0)
      
      // Calculate density (moments per day in interval)
      const intervalDays = Math.max(1, differenceInDays(intervalEnd, intervalStart) + 1)
      const density = momentCount / intervalDays

      return {
        date: format(intervalStart, timeGranularity === 'month' ? 'MMM yyyy' : 
                    timeGranularity === 'week' ? 'MMM dd' : 'MMM dd'),
        timestamp: intervalStart.getTime(),
        momentCount,
        averageImpact: Math.round(averageImpact),
        highImpactCount,
        mediumImpactCount,
        lowImpactCount,
        microFactorCount,
        macroFactorCount,
        companyMoments,
        technologyMoments,
        totalImpact,
        density: Math.round(density * 10) / 10,
        moments: intervalMoments
      }
    })
  }, [moments, timeRange, timeGranularity])

  // Generate event annotations
  const eventAnnotations = useMemo(() => {
    const annotations: EventAnnotation[] = []
    
    timeSeriesData.forEach(dataPoint => {
      // Significant events (high activity days)
      if (dataPoint.momentCount >= 5) {
        annotations.push({
          date: dataPoint.date,
          timestamp: dataPoint.timestamp,
          title: `High Activity`,
          description: `${dataPoint.momentCount} moments discovered`,
          type: 'significant',
          impact: dataPoint.averageImpact > 70 ? 'high' : dataPoint.averageImpact > 40 ? 'medium' : 'low',
          moments: dataPoint.moments
        })
      }

      // Anomaly detection (unusual patterns)
      if (dataPoint.density > 2) {
        annotations.push({
          date: dataPoint.date,
          timestamp: dataPoint.timestamp,
          title: `High Density`,
          description: `${dataPoint.density} moments/day`,
          type: 'anomaly',
          impact: 'medium',
          moments: dataPoint.moments
        })
      }

      // Cluster detection (multiple high-impact moments)
      if (dataPoint.highImpactCount >= 3) {
        annotations.push({
          date: dataPoint.date,
          timestamp: dataPoint.timestamp,
          title: `Impact Cluster`,
          description: `${dataPoint.highImpactCount} high-impact moments`,
          type: 'cluster',
          impact: 'high',
          moments: dataPoint.moments.filter(m => m.impact.score > 70)
        })
      }
    })

    return annotations
  }, [timeSeriesData])

  // Advanced momentum indicators calculation
  const momentumIndicators = useMemo((): MomentumIndicator[] => {
    if (timeSeriesData.length < 5) return []

    const values = timeSeriesData.map(d => d.momentCount)
    const recent = values.slice(-5)
    const previous = values.slice(-10, -5)

    // Calculate velocity (first derivative)
    const velocity = recent.length > 1 ? 
      (recent[recent.length - 1] - recent[0]) / (recent.length - 1) : 0
    
    const prevVelocity = previous.length > 1 ? 
      (previous[previous.length - 1] - previous[0]) / (previous.length - 1) : 0

    // Calculate acceleration (second derivative)
    const acceleration = velocity - prevVelocity

    // Calculate overall momentum
    const momentum = recent.reduce((sum, val, idx) => {
      if (idx === 0) return sum
      return sum + (val - recent[idx - 1])
    }, 0) / (recent.length - 1)

    // Determine trend significance
    const velocitySignificance = Math.abs(velocity) > 2 ? 'high' : Math.abs(velocity) > 1 ? 'medium' : 'low'
    const accelerationSignificance = Math.abs(acceleration) > 1 ? 'high' : Math.abs(acceleration) > 0.5 ? 'medium' : 'low'
    const momentumSignificance = Math.abs(momentum) > 1.5 ? 'high' : Math.abs(momentum) > 0.75 ? 'medium' : 'low'

    return [
      {
        type: 'velocity',
        value: Math.round(velocity * 100) / 100,
        trend: velocity > 0.1 ? 'up' : velocity < -0.1 ? 'down' : 'stable',
        significance: velocitySignificance,
        change: Math.round((velocity - prevVelocity) * 100) / 100
      },
      {
        type: 'acceleration',
        value: Math.round(acceleration * 100) / 100,
        trend: acceleration > 0.05 ? 'up' : acceleration < -0.05 ? 'down' : 'stable',
        significance: accelerationSignificance,
        change: acceleration
      },
      {
        type: 'momentum',
        value: Math.round(momentum * 100) / 100,
        trend: momentum > 0.1 ? 'up' : momentum < -0.1 ? 'down' : 'stable',
        significance: momentumSignificance,
        change: momentum
      }
    ]
  }, [timeSeriesData])

  // Advanced seasonal pattern recognition
  const seasonalPatterns = useMemo((): SeasonalPattern[] => {
    if (timeSeriesData.length < 14) return []

    const values = timeSeriesData.map(d => d.momentCount)
    const patterns: SeasonalPattern[] = []

    // Weekly pattern analysis (7-day cycle)
    if (timeGranularity === 'day' && values.length >= 14) {
      const weeklyPattern = analyzeSeasonalPattern(values, 7)
      if (weeklyPattern.strength > 0.3) {
        patterns.push({
          pattern: 'weekly',
          strength: weeklyPattern.strength,
          phase: weeklyPattern.phase,
          nextExpected: addDays(new Date(), 7 - new Date().getDay()),
          confidence: weeklyPattern.strength * 100
        })
      }
    }

    // Monthly pattern analysis
    if (values.length >= 30) {
      const monthlyPattern = analyzeSeasonalPattern(values, 30)
      if (monthlyPattern.strength > 0.25) {
        patterns.push({
          pattern: 'monthly',
          strength: monthlyPattern.strength,
          phase: monthlyPattern.phase,
          nextExpected: addMonths(new Date(), 1),
          confidence: monthlyPattern.strength * 100
        })
      }
    }

    // Quarterly business cycle analysis
    if (values.length >= 90) {
      const quarterlyPattern = analyzeSeasonalPattern(values, 90)
      if (quarterlyPattern.strength > 0.2) {
        patterns.push({
          pattern: 'quarterly',
          strength: quarterlyPattern.strength,
          phase: quarterlyPattern.phase,
          nextExpected: addMonths(new Date(), 3),
          confidence: quarterlyPattern.strength * 100
        })
      }
    }

    return patterns.sort((a, b) => b.strength - a.strength)
  }, [timeSeriesData, timeGranularity])

  // Advanced anomaly detection with AI explanations
  const anomalyDetection = useMemo((): AnomalyDetection[] => {
    if (timeSeriesData.length < 7) return []

    const anomalies: AnomalyDetection[] = []
    const values = timeSeriesData.map(d => d.momentCount)
    const impactValues = timeSeriesData.map(d => d.averageImpact)
    
    // Calculate statistical thresholds
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    timeSeriesData.forEach((dataPoint, index) => {
      const zScore = (dataPoint.momentCount - mean) / stdDev
      let anomalyScore = Math.abs(zScore)
      let explanation = ''
      let aiInsight = ''
      let anomalyType: 'spike' | 'drop' | 'trend_break' | 'seasonal_deviation' = 'spike'
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
      const affectedMetrics: string[] = []

      // Spike detection
      if (zScore > 2.5) {
        anomalyType = 'spike'
        severity = zScore > 3.5 ? 'critical' : zScore > 3 ? 'high' : 'medium'
        explanation = `Unusual spike detected: ${dataPoint.momentCount} moments (${Math.round(zScore * 10) / 10}σ above normal)`
        aiInsight = generateAIInsight('spike', dataPoint, timeSeriesData, index)
        affectedMetrics.push('moment_count')
        
        if (dataPoint.averageImpact > 70) {
          affectedMetrics.push('high_impact')
          explanation += ' with high-impact moments'
        }
      }
      
      // Drop detection
      else if (zScore < -2.5) {
        anomalyType = 'drop'
        severity = zScore < -3.5 ? 'critical' : zScore < -3 ? 'high' : 'medium'
        explanation = `Significant drop detected: ${dataPoint.momentCount} moments (${Math.round(Math.abs(zScore) * 10) / 10}σ below normal)`
        aiInsight = generateAIInsight('drop', dataPoint, timeSeriesData, index)
        affectedMetrics.push('moment_count')
      }
      
      // Trend break detection
      else if (index >= 3) {
        const recentTrend = values.slice(index - 3, index + 1)
        const trendBreak = detectTrendBreak(recentTrend)
        if (trendBreak.significance > 0.7) {
          anomalyType = 'trend_break'
          severity = trendBreak.significance > 0.9 ? 'high' : 'medium'
          anomalyScore = trendBreak.significance
          explanation = `Trend reversal detected: ${trendBreak.direction} pattern broken`
          aiInsight = generateAIInsight('trend_break', dataPoint, timeSeriesData, index)
          affectedMetrics.push('trend_momentum')
        }
      }
      
      // Seasonal deviation detection
      if (seasonalPatterns.length > 0) {
        const expectedSeasonal = predictSeasonalValue(index, seasonalPatterns[0])
        const seasonalDeviation = Math.abs(dataPoint.momentCount - expectedSeasonal) / Math.max(expectedSeasonal, 1)
        
        if (seasonalDeviation > 0.5) {
          anomalyType = 'seasonal_deviation'
          severity = seasonalDeviation > 0.8 ? 'high' : 'medium'
          anomalyScore = Math.max(anomalyScore, seasonalDeviation)
          explanation = `Seasonal pattern deviation: ${Math.round(seasonalDeviation * 100)}% off expected value`
          aiInsight = generateAIInsight('seasonal_deviation', dataPoint, timeSeriesData, index)
          affectedMetrics.push('seasonal_pattern')
        }
      }

      // Only add significant anomalies
      if (anomalyScore > 1.5) {
        anomalies.push({
          timestamp: dataPoint.timestamp,
          score: Math.round(anomalyScore * 100) / 100,
          severity,
          type: anomalyType,
          explanation,
          aiInsight,
          affectedMetrics
        })
      }
    })

    return anomalies.sort((a, b) => b.score - a.score)
  }, [timeSeriesData, seasonalPatterns])

  // Enhanced trend data with momentum indicators and anomaly detection
  const trendData = useMemo(() => {
    if (timeSeriesData.length < 3) return []

    return timeSeriesData.map((dataPoint, index) => {
      // Enhanced momentum calculation
      let momentum = 0
      let velocity = 0
      let acceleration = 0
      
      if (index > 0) {
        const prev = timeSeriesData[index - 1]
        momentum = dataPoint.momentCount - prev.momentCount
        
        // Calculate velocity (rate of change)
        if (index >= 2) {
          const prevPrev = timeSeriesData[index - 2]
          const currentVelocity = dataPoint.momentCount - prev.momentCount
          const previousVelocity = prev.momentCount - prevPrev.momentCount
          velocity = currentVelocity
          acceleration = currentVelocity - previousVelocity
        }
      }

      // Enhanced trend classification using momentum indicators
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (velocity > 1 || (momentum > 0.5 && acceleration >= 0)) trend = 'up'
      else if (velocity < -1 || (momentum < -0.5 && acceleration <= 0)) trend = 'down'

      // Advanced seasonality detection
      let seasonality = 0
      let seasonalPattern: 'peak' | 'valley' | 'rising' | 'declining' | 'stable' = 'stable'
      
      if (seasonalPatterns.length > 0) {
        const primaryPattern = seasonalPatterns[0]
        seasonality = calculateSeasonalValue(index, primaryPattern)
        seasonalPattern = primaryPattern.phase
      }

      // Machine learning forecast with confidence bands
      let forecast: number | undefined
      let confidence: number | undefined
      
      if (index >= timeSeriesData.length - 3) {
        const forecastResult = generateMLForecast(timeSeriesData, index, momentumIndicators, seasonalPatterns)
        forecast = forecastResult.value
        confidence = forecastResult.confidence
      }

      // Anomaly detection for this data point
      const anomaly = anomalyDetection.find(a => a.timestamp === dataPoint.timestamp)
      const anomalyScore = anomaly ? anomaly.score : 0
      const isAnomaly = anomalyScore > 1.5
      const anomalyExplanation = anomaly ? anomaly.aiInsight : undefined

      return {
        date: dataPoint.date,
        timestamp: dataPoint.timestamp,
        value: dataPoint.momentCount,
        trend,
        momentum,
        velocity,
        acceleration,
        seasonality,
        seasonalPattern,
        forecast,
        confidence,
        anomalyScore,
        isAnomaly,
        anomalyExplanation
      }
    })
  }, [timeSeriesData, momentumIndicators, seasonalPatterns, anomalyDetection])

  // Helper functions for advanced analytics
  function analyzeSeasonalPattern(values: number[], cycle: number) {
    let maxCorrelation = 0
    let phase: 'peak' | 'valley' | 'rising' | 'declining' | 'stable' = 'stable'
    
    if (values.length < cycle * 2) {
      return { strength: 0, phase }
    }

    // Calculate autocorrelation at cycle lag
    const correlation = calculateAutocorrelation(values, cycle)
    maxCorrelation = Math.abs(correlation)
    
    // Determine phase based on recent trend within cycle
    const recentCycleData = values.slice(-cycle)
    const cycleQuarter = Math.floor(cycle / 4)
    const firstQuarter = recentCycleData.slice(0, cycleQuarter)
    const lastQuarter = recentCycleData.slice(-cycleQuarter)
    
    const firstAvg = firstQuarter.reduce((sum, val) => sum + val, 0) / firstQuarter.length
    const lastAvg = lastQuarter.reduce((sum, val) => sum + val, 0) / lastQuarter.length
    
    if (lastAvg > firstAvg * 1.2) phase = 'rising'
    else if (lastAvg < firstAvg * 0.8) phase = 'declining'
    else {
        const midPoint = Math.floor(recentCycleData.length / 2)
      const firstHalf = recentCycleData.slice(0, midPoint).reduce((sum, val) => sum + val, 0) / midPoint
      const secondHalf = recentCycleData.slice(midPoint).reduce((sum, val) => sum + val, 0) / (recentCycleData.length - midPoint)
      
      if (Math.abs(secondHalf - firstHalf) / Math.max(firstHalf, secondHalf, 1) < 0.1) {
        phase = 'stable'
      } else {
        phase = secondHalf > firstHalf ? 'peak' : 'valley'
      }
    }
    
    return { strength: maxCorrelation, phase }
  }

  function calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length <= lag) return 0
    
    const n = values.length - lag
    const mean1 = values.slice(0, n).reduce((sum, val) => sum + val, 0) / n
    const mean2 = values.slice(lag).reduce((sum, val) => sum + val, 0) / n
    
    let numerator = 0
    let denom1 = 0
    let denom2 = 0
    
    for (let i = 0; i < n; i++) {
      const diff1 = values[i] - mean1
      const diff2 = values[i + lag] - mean2
      numerator += diff1 * diff2
      denom1 += diff1 * diff1
      denom2 += diff2 * diff2
    }
    
    return numerator / Math.sqrt(denom1 * denom2)
  }

  function detectTrendBreak(recentValues: number[]) {
    if (recentValues.length < 4) return { significance: 0, direction: 'none' }
    
    const firstHalf = recentValues.slice(0, 2)
    const secondHalf = recentValues.slice(2)
    
    const firstTrend = firstHalf[1] - firstHalf[0]
    const secondTrend = secondHalf[1] - secondHalf[0]
    
    const trendChange = Math.abs(secondTrend - firstTrend)
    const maxValue = Math.max(...recentValues)
    const significance = maxValue > 0 ? trendChange / maxValue : 0
    
    let direction = 'none'
    if (firstTrend > 0 && secondTrend < 0) direction = 'up_to_down'
    else if (firstTrend < 0 && secondTrend > 0) direction = 'down_to_up'
    
    return { significance: Math.min(significance, 1), direction }
  }

  function predictSeasonalValue(index: number, pattern: SeasonalPattern): number {
    const cycleLength = pattern.pattern === 'weekly' ? 7 : 
                      pattern.pattern === 'monthly' ? 30 : 
                      pattern.pattern === 'quarterly' ? 90 : 365
    
    const cyclePosition = index % cycleLength
    const baseValue = timeSeriesData.reduce((sum, d) => sum + d.momentCount, 0) / timeSeriesData.length
    
    // Simple sinusoidal model for seasonal prediction
    // Adjust phase based on detected pattern phase
    let phaseAdjustment = 0
    if (pattern.phase === 'peak') phaseAdjustment = Math.PI / 2
    else if (pattern.phase === 'valley') phaseAdjustment = -Math.PI / 2
    else if (pattern.phase === 'declining') phaseAdjustment = Math.PI
    // 'rising' and 'stable' use default phase (0)
    
    const seasonalMultiplier = 1 + pattern.strength * Math.sin(2 * Math.PI * cyclePosition / cycleLength + phaseAdjustment)
    return baseValue * seasonalMultiplier
  }

  function calculateSeasonalValue(index: number, pattern: SeasonalPattern): number {
    const cycleLength = pattern.pattern === 'weekly' ? 7 : 
                      pattern.pattern === 'monthly' ? 30 : 
                      pattern.pattern === 'quarterly' ? 90 : 365
    
    const cyclePosition = index % cycleLength
    
    // Adjust phase based on detected pattern phase
    let phaseAdjustment = 0
    if (pattern.phase === 'peak') phaseAdjustment = Math.PI / 2
    else if (pattern.phase === 'valley') phaseAdjustment = -Math.PI / 2
    else if (pattern.phase === 'declining') phaseAdjustment = Math.PI
    // 'rising' and 'stable' use default phase (0)
    
    return pattern.strength * Math.sin(2 * Math.PI * cyclePosition / cycleLength + phaseAdjustment)
  }

  function generateMLForecast(
    data: TimeSeriesDataPoint[], 
    index: number, 
    momentum: MomentumIndicator[], 
    patterns: SeasonalPattern[]
  ) {
    const recentData = data.slice(-7) // Use last 7 data points
    const values = recentData.map(d => d.momentCount)
    
    // Linear regression with momentum weighting
    const n = values.length
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
    
    values.forEach((y, x) => {
      sumX += x
      sumY += y
      sumXY += x * y
      sumXX += x * x
    })
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Adjust for momentum
    const velocityAdjustment = momentum.find(m => m.type === 'velocity')?.value || 0
    const accelerationAdjustment = momentum.find(m => m.type === 'acceleration')?.value || 0
    
    let forecast = intercept + slope * n + velocityAdjustment + accelerationAdjustment * 0.5
    
    // Adjust for seasonal patterns
    if (patterns.length > 0) {
      const seasonalAdjustment = predictSeasonalValue(index + 1, patterns[0]) - 
                                predictSeasonalValue(index, patterns[0])
      forecast += seasonalAdjustment * patterns[0].strength
    }
    
    // Calculate confidence based on recent volatility and pattern strength
    const recentVolatility = calculateVolatility(values)
    const patternStrength = patterns.length > 0 ? patterns[0].strength : 0
    const momentumConsistency = Math.abs(velocityAdjustment) < 1 ? 0.8 : 0.6
    
    const confidence = Math.max(20, Math.min(95, 
      70 + patternStrength * 20 + momentumConsistency * 10 - recentVolatility * 30
    ))
    
    return {
      value: Math.max(0, Math.round(forecast * 100) / 100),
      confidence: Math.round(confidence)
    }
  }

  function calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return Math.sqrt(variance) / Math.max(mean, 1)
  }

  function generateAIInsight(
    type: 'spike' | 'drop' | 'trend_break' | 'seasonal_deviation',
    dataPoint: TimeSeriesDataPoint,
    allData: TimeSeriesDataPoint[],
    index: number
  ): string {
    const contextualFactors = []
    
    // Analyze contributing factors
    if (dataPoint.highImpactCount > 0) {
      contextualFactors.push(`${dataPoint.highImpactCount} high-impact moments`)
    }
    
    if (dataPoint.microFactorCount > dataPoint.macroFactorCount * 2) {
      contextualFactors.push('company-specific factors dominating')
    } else if (dataPoint.macroFactorCount > dataPoint.microFactorCount * 1.5) {
      contextualFactors.push('market-wide factors dominating')
    }
    
    if (dataPoint.companyMoments > dataPoint.technologyMoments * 2) {
      contextualFactors.push('company developments driving activity')
    } else if (dataPoint.technologyMoments > dataPoint.companyMoments * 1.5) {
      contextualFactors.push('technology innovations driving activity')
    }
    
    const insights = {
      spike: `Unusual activity surge detected. ${contextualFactors.length > 0 ? 
        'Contributing factors: ' + contextualFactors.join(', ') + '.' : 
        'This appears to be an isolated event with no clear pattern precedent.'} ` +
        `Consider investigating external events or announcements during this period.`,
      
      drop: `Significant activity decline observed. ${contextualFactors.length > 0 ? 
        'Context: ' + contextualFactors.join(', ') + '.' : 
        'This may indicate market pause or external disruption.'} ` +
        `Monitor for recovery patterns or sustained trend change.`,
      
      trend_break: `Trend reversal detected at this point. ${contextualFactors.length > 0 ? 
        'Driving factors: ' + contextualFactors.join(', ') + '.' : 
        'This represents a significant shift in activity patterns.'} ` +
        `This could signal market transition or strategic pivot in AI industry focus.`,
      
      seasonal_deviation: `Activity deviates significantly from expected seasonal pattern. ` +
        `${contextualFactors.length > 0 ? 
          'Unusual factors: ' + contextualFactors.join(', ') + '.' : 
          'This suggests external disruption to normal business cycles.'} ` +
        `Consider industry events or regulatory changes affecting normal patterns.`
    }
    
    return insights[type]
  }

  // Layer toggle handlers
  const toggleLayer = (layer: LayerType) => {
    const newLayers = new Set(activeLayers)
    if (newLayers.has(layer)) {
      newLayers.delete(layer)
    } else {
      newLayers.add(layer)
    }
    setActiveLayers(newLayers)
  }

  // Enhanced custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload as TimeSeriesDataPoint
    const trendPoint = trendData.find(t => t.timestamp === data.timestamp)
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
        <p className="font-medium text-gray-900">{label}</p>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{data.momentCount}</span> moments
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{data.averageImpact}%</span> avg impact
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{data.density}</span> density
          </p>
          {data.highImpactCount > 0 && (
            <p className="text-sm text-red-600">
              <span className="font-medium">{data.highImpactCount}</span> high impact
            </p>
          )}
          
          {trendPoint && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Momentum Analysis:</p>
              <div className="space-y-1">
                <p className="text-xs text-blue-600">
                  Velocity: <span className="font-medium">{trendPoint.velocity > 0 ? '+' : ''}{trendPoint.velocity}</span>
                </p>
                <p className="text-xs text-green-600">
                  Acceleration: <span className="font-medium">{trendPoint.acceleration > 0 ? '+' : ''}{trendPoint.acceleration}</span>
                </p>
                {trendPoint.isAnomaly && (
                  <p className="text-xs text-red-600 font-medium">
                    ⚠ Anomaly detected (score: {trendPoint.anomalyScore})
                  </p>
                )}
                {trendPoint.forecast && (
                  <p className="text-xs text-orange-600">
                    Forecast: <span className="font-medium">{trendPoint.forecast}</span> ({trendPoint.confidence}% confidence)
                  </p>
                )}
                {trendPoint.seasonalPattern !== 'stable' && (
                  <p className="text-xs text-purple-600">
                    Seasonal: <span className="font-medium capitalize">{trendPoint.seasonalPattern}</span>
                  </p>
                )}
              </div>
              {trendPoint.anomalyExplanation && (
                <p className="text-xs text-gray-600 mt-2 italic">
                  {trendPoint.anomalyExplanation.length > 100 ? 
                    trendPoint.anomalyExplanation.substring(0, 100) + '...' :
                    trendPoint.anomalyExplanation
                  }
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Animation controls
  const handlePlayPause = () => {
    setIsAnimating(!isAnimating)
  }

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(3, prev * 1.2))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.5, prev / 1.2))
  const handleZoomReset = () => setZoomLevel(1)

  if (!moments.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Temporal Analysis
          </CardTitle>
          <CardDescription>
            Time-series analysis with trend detection and forecasting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No moments available for temporal analysis</p>
              <p className="text-sm mt-1">Start analyzing content to see timeline data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Temporal Analysis
            </CardTitle>
            <CardDescription>
              {timeSeriesData.length} data points • {moments.length} total moments
            </CardDescription>
          </div>
          
          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-200 rounded-lg">
              {(['timeline', 'calendar', 'streamgraph', 'density'] as ViewMode[]).map((mode) => {
                const icons = {
                  timeline: ChartBarIcon,
                  calendar: CalendarIcon,
                  streamgraph: RectangleStackIcon,
                  density: FunnelIcon
                }
                const Icon = icons[mode]
                return (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className="rounded-none first:rounded-l-md last:rounded-r-md border-0"
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between mt-4">
          {/* Time Granularity */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Granularity:</span>
            <div className="flex border border-gray-200 rounded-md">
              {(['day', 'week', 'month'] as TimeGranularity[]).map((granularity) => (
                <Button
                  key={granularity}
                  variant={timeGranularity === granularity ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeGranularity(granularity)}
                  className="rounded-none first:rounded-l-md last:rounded-r-md border-0 capitalize"
                >
                  {granularity}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Range:</span>
            <div className="flex border border-gray-200 rounded-md">
              {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTimeRange(range)}
                  className="rounded-none first:rounded-l-md last:rounded-r-md border-0"
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              <MagnifyingGlassMinusIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomReset}>
              <span className="text-xs">{Math.round(zoomLevel * 100)}%</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              <MagnifyingGlassPlusIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Layers:</span>
            <div className="flex gap-1">
              {(['events', 'impact', 'trends', 'annotations', 'predictions'] as LayerType[]).map((layer) => {
                const layerLabels = {
                  events: 'Events',
                  impact: 'Impact',
                  trends: 'Trends',
                  annotations: 'Notes',
                  predictions: 'Forecast'
                }
                return (
                  <Button
                    key={layer}
                    variant={activeLayers.has(layer) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLayer(layer)}
                    className="h-7 px-2 text-xs"
                  >
                    {layerLabels[layer]}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Animation Controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handlePlayPause}>
              {isAnimating ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm">
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Main Visualization */}
        <div className="h-96 w-full">
          {viewMode === 'timeline' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {activeLayers.has('events') && (
                  <Area
                    type="monotone"
                    dataKey="momentCount"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Moment Count"
                  />
                )}
                
                {activeLayers.has('impact') && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="highImpactCount"
                      stackId="2"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.8}
                      name="High Impact"
                    />
                    <Area
                      type="monotone"
                      dataKey="mediumImpactCount"
                      stackId="2"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.6}
                      name="Medium Impact"
                    />
                    <Area
                      type="monotone"
                      dataKey="lowImpactCount"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.4}
                      name="Low Impact"
                    />
                  </>
                )}

                {activeLayers.has('trends') && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="averageImpact"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={false}
                      name="Avg Impact Trend"
                    />
                    {/* Momentum Overlay */}
                    <Line
                      type="monotone"
                      dataKey="velocity"
                      stroke="#059669"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Velocity"
                    />
                  </>
                )}

                {/* Anomaly Points */}
                {activeLayers.has('annotations') && (
                  <ScatterChart data={trendData.filter(d => d.isAnomaly)}>
                    <Scatter
                      dataKey="value"
                      fill="#EF4444"
                      name="Anomalies"
                    />
                  </ScatterChart>
                )}

                {/* Forecast Layer */}
                {activeLayers.has('predictions') && (
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{ fill: '#F59E0B', r: 3 }}
                    name="ML Forecast"
                    connectNulls={false}
                  />
                )}

                {/* Annotations */}
                {activeLayers.has('annotations') && eventAnnotations.map((annotation, index) => {
                  const dataPoint = timeSeriesData.find(d => d.timestamp === annotation.timestamp)
                  if (!dataPoint) return null
                  
                  return (
                    <ReferenceLine
                      key={index}
                      x={annotation.date}
                      stroke={annotation.impact === 'high' ? '#EF4444' : 
                            annotation.impact === 'medium' ? '#F59E0B' : '#10B981'}
                      strokeDasharray="5 5"
                      label={{
                        value: annotation.title,
                        position: 'top',
                        style: { fontSize: '10px', fill: '#374151' }
                      }}
                    />
                  )
                })}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {viewMode === 'density' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Bar
                  dataKey="density"
                  fill="#06B6D4"
                  name="Event Density"
                  radius={[2, 2, 0, 0]}
                />
                
                {activeLayers.has('impact') && (
                  <Bar
                    dataKey="averageImpact"
                    fill="#F59E0B"
                    name="Avg Impact"
                    radius={[2, 2, 0, 0]}
                    opacity={0.7}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}

          {(viewMode === 'calendar' || viewMode === 'streamgraph') && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">{viewMode === 'calendar' ? 'Calendar View' : 'Streamgraph View'}</p>
                <p className="text-sm mt-1">Coming soon - Advanced visualization mode</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Statistics and Momentum Indicators */}
        <div className="mt-6 space-y-6">
          {/* Momentum Indicators Panel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              Momentum Indicators
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {momentumIndicators.map((indicator) => {
                const trendColor = indicator.trend === 'up' ? 'text-green-600' : 
                                 indicator.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                const significanceColor = indicator.significance === 'high' ? 'bg-red-100 text-red-800' :
                                        indicator.significance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-600'
                
                return (
                  <div key={indicator.type} className="text-center">
                    <div className={`text-lg font-bold ${trendColor}`}>
                      {indicator.value > 0 ? '+' : ''}{indicator.value}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">{indicator.type}</div>
                    <Badge className={`text-xs mt-1 ${significanceColor}`}>
                      {indicator.significance}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Seasonal Patterns */}
          {seasonalPatterns.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Seasonal Patterns Detected
              </h4>
              <div className="space-y-2">
                {seasonalPatterns.slice(0, 2).map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium capitalize">{pattern.pattern}</span>
                      <span className="text-xs text-gray-500 ml-2">({pattern.phase} phase)</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{Math.round(pattern.confidence)}% confidence</div>
                      <div className="text-xs text-gray-500">Strength: {Math.round(pattern.strength * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anomaly Detection */}
          {anomalyDetection.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Anomalies Detected ({anomalyDetection.length})
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {anomalyDetection.slice(0, 3).map((anomaly, index) => {
                  const severityColor = anomaly.severity === 'critical' ? 'bg-red-500' :
                                      anomaly.severity === 'high' ? 'bg-orange-500' :
                                      anomaly.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                  
                  const correspondingData = timeSeriesData.find(d => d.timestamp === anomaly.timestamp)
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${severityColor}`} />
                          <span className="text-sm font-medium capitalize">{anomaly.type.replace('_', ' ')}</span>
                          <Badge variant="outline" className="text-xs">
                            Score: {anomaly.score}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {correspondingData ? format(new Date(correspondingData.timestamp), 'MMM dd') : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{anomaly.explanation}</p>
                      <p className="text-xs text-blue-700 italic">{anomaly.aiInsight}</p>
                      {anomaly.affectedMetrics.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {anomaly.affectedMetrics.map((metric, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {metric.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                {anomalyDetection.length > 3 && (
                  <div className="text-center text-xs text-gray-500 pt-2">
                    +{anomalyDetection.length - 3} more anomalies detected
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Core Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {timeSeriesData.reduce((sum, d) => sum + d.momentCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(timeSeriesData.reduce((sum, d) => sum + d.averageImpact, 0) / timeSeriesData.length) || 0}%
              </div>
              <div className="text-sm text-gray-600">Avg Impact</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(timeSeriesData.reduce((sum, d) => sum + d.density, 0) / timeSeriesData.length * 10) / 10}
              </div>
              <div className="text-sm text-gray-600">Avg Density</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {trendData.filter(d => d.isAnomaly).length}
              </div>
              <div className="text-sm text-gray-600">Anomalies</div>
            </div>
          </div>
        </div>

        {/* Event Annotations List */}
        {activeLayers.has('annotations') && eventAnnotations.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Significant Events</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {eventAnnotations.slice(0, 5).map((annotation, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    annotation.impact === 'high' ? 'bg-red-500' :
                    annotation.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{annotation.title}</div>
                    <div className="text-xs text-gray-600">{annotation.description}</div>
                  </div>
                  <Badge variant={annotation.impact === 'high' ? 'destructive' : 'secondary'}>
                    {annotation.date}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}