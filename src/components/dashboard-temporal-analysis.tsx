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
  seasonality?: number
  forecast?: number
  confidence?: number
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

  // Generate trend data with forecasting
  const trendData = useMemo(() => {
    if (timeSeriesData.length < 3) return []

    return timeSeriesData.map((dataPoint, index) => {
      // Calculate momentum (rate of change)
      let momentum = 0
      if (index > 0) {
        const prev = timeSeriesData[index - 1]
        momentum = dataPoint.momentCount - prev.momentCount
      }

      // Simple trend classification
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (momentum > 1) trend = 'up'
      else if (momentum < -1) trend = 'down'

      // Basic seasonality detection (simplified)
      const seasonality = Math.sin((index / timeSeriesData.length) * 2 * Math.PI) * 2

      // Simple forecast (next period prediction)
      let forecast: number | undefined
      let confidence: number | undefined
      
      if (index >= timeSeriesData.length - 3) {
        // Basic linear regression for last few points
        const recentData = timeSeriesData.slice(-5)
        const avgGrowth = recentData.length > 1 
          ? (recentData[recentData.length - 1].momentCount - recentData[0].momentCount) / (recentData.length - 1)
          : 0
        
        forecast = Math.max(0, dataPoint.momentCount + avgGrowth)
        confidence = Math.min(90, Math.max(10, 70 - Math.abs(momentum) * 5))
      }

      return {
        date: dataPoint.date,
        timestamp: dataPoint.timestamp,
        value: dataPoint.momentCount,
        trend,
        momentum,
        seasonality,
        forecast,
        confidence
      }
    })
  }, [timeSeriesData])

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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload as TimeSeriesDataPoint
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
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
              {(['events', 'impact', 'trends', 'annotations'] as LayerType[]).map((layer) => {
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
                  <Line
                    type="monotone"
                    dataKey="averageImpact"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={false}
                    name="Avg Impact Trend"
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

        {/* Statistics and Insights */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
              {eventAnnotations.length}
            </div>
            <div className="text-sm text-gray-600">Key Events</div>
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