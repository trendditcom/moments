'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CalendarIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useCatalogStore } from '@/store/catalog-store'
import { useMomentsStore } from '@/store/moments-store'

// Types for growth metrics
interface TimeSeriesData {
  date: string
  moments: number
  companies: number
  technologies: number
  highImpact: number
  correlations: number
}

interface HealthMetric {
  label: string
  value: number
  max: number
  status: 'healthy' | 'warning' | 'critical'
  unit?: string
}

interface QualityScore {
  completeness: number
  accuracy: number
  freshness: number
  coverage: number
  overall: number
}

// Generate mock time-series data based on actual moments
function generateTimeSeriesData(moments: any[], companies: any[], technologies: any[]): TimeSeriesData[] {
  const now = new Date()
  const data: TimeSeriesData[] = []
  
  // Generate data for last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Calculate cumulative values up to this date
    const momentsToDate = moments.filter(m => {
      const momentDate = m.timeline?.date ? new Date(m.timeline.date) : new Date()
      return momentDate <= date
    })
    
    const highImpactToDate = momentsToDate.filter(m => m.impact >= 0.7)
    
    // Simulate growth pattern
    const growthFactor = (30 - i) / 30
    
    data.push({
      date: dateStr,
      moments: Math.round(momentsToDate.length * growthFactor) || Math.round(Math.random() * 10 + i),
      companies: Math.round(companies.length * growthFactor) || Math.round(Math.random() * 5 + i/6),
      technologies: Math.round(technologies.length * growthFactor) || Math.round(Math.random() * 3 + i/10),
      highImpact: Math.round(highImpactToDate.length * growthFactor) || Math.round(Math.random() * 2 + i/15),
      correlations: Math.round(Math.random() * 15 + i/2)
    })
  }
  
  return data
}

// Generate health metrics
function generateHealthMetrics(moments: any[], companies: any[], technologies: any[]): HealthMetric[] {
  const totalEntities = companies.length + technologies.length
  const avgVelocity = moments.length / 30 // Average per day over 30 days
  const dataQuality = moments.filter(m => m.confidence >= 0.7).length / Math.max(moments.length, 1)
  const coverage = totalEntities / 100 // Assuming 100 is target
  
  return [
    {
      label: 'Total Moments',
      value: moments.length,
      max: 1000,
      status: moments.length > 50 ? 'healthy' : moments.length > 20 ? 'warning' : 'critical',
      unit: 'items'
    },
    {
      label: 'Analysis Velocity',
      value: Math.round(avgVelocity * 10) / 10,
      max: 10,
      status: avgVelocity > 2 ? 'healthy' : avgVelocity > 1 ? 'warning' : 'critical',
      unit: '/day'
    },
    {
      label: 'Data Quality',
      value: Math.round(dataQuality * 100),
      max: 100,
      status: dataQuality > 0.7 ? 'healthy' : dataQuality > 0.5 ? 'warning' : 'critical',
      unit: '%'
    },
    {
      label: 'Industry Coverage',
      value: Math.round(coverage * 100),
      max: 100,
      status: coverage > 0.7 ? 'healthy' : coverage > 0.4 ? 'warning' : 'critical',
      unit: '%'
    }
  ]
}

// Generate quality scores
function generateQualityScores(moments: any[]): QualityScore {
  const completeness = moments.filter(m => m.content && m.entities && m.classification).length / Math.max(moments.length, 1)
  const accuracy = moments.filter(m => m.confidence >= 0.7).length / Math.max(moments.length, 1)
  const freshness = moments.filter(m => {
    const date = m.timeline?.date ? new Date(m.timeline.date) : new Date()
    const daysSince = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    return daysSince <= 7
  }).length / Math.max(moments.length, 1)
  const coverage = Math.min(moments.length / 100, 1) // Target 100 moments
  
  const overall = (completeness + accuracy + freshness + coverage) / 4
  
  return {
    completeness: Math.round(completeness * 100),
    accuracy: Math.round(accuracy * 100),
    freshness: Math.round(freshness * 100),
    coverage: Math.round(coverage * 100),
    overall: Math.round(overall * 100)
  }
}

// Time window selector component
function TimeWindowSelector({ 
  selected, 
  onChange 
}: { 
  selected: string
  onChange: (window: string) => void 
}) {
  const windows = [
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '1y', label: '1Y' }
  ]
  
  return (
    <div className="flex space-x-1 bg-muted p-1 rounded-lg">
      {windows.map(window => (
        <button
          key={window.value}
          onClick={() => onChange(window.value)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            selected === window.value 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {window.label}
        </button>
      ))}
    </div>
  )
}

// Growth Velocity Chart Component
export function GrowthVelocityChart() {
  const [timeWindow, setTimeWindow] = useState('30d')
  const { moments } = useMomentsStore()
  const { companies, technologies } = useCatalogStore()
  
  const timeSeriesData = useMemo(() => 
    generateTimeSeriesData(moments, companies, technologies),
    [moments, companies, technologies]
  )
  
  // Filter data based on time window
  const filteredData = useMemo(() => {
    const days = timeWindow === '24h' ? 1 : 
                 timeWindow === '7d' ? 7 : 
                 timeWindow === '30d' ? 30 : 
                 timeWindow === '90d' ? 90 : 365
    return timeSeriesData.slice(-days)
  }, [timeSeriesData, timeWindow])
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Growth Velocity</CardTitle>
          <CardDescription className="text-xs">Knowledge base expansion over time</CardDescription>
        </div>
        <TimeWindowSelector selected={timeWindow} onChange={setTimeWindow} />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorMoments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorTech" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorHighImpact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              labelFormatter={(value) => {
                const date = new Date(value as string)
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="moments" 
              stroke="#3b82f6" 
              fillOpacity={1}
              fill="url(#colorMoments)"
              strokeWidth={2}
              name="Moments"
            />
            <Area 
              type="monotone" 
              dataKey="companies" 
              stroke="#10b981" 
              fillOpacity={1}
              fill="url(#colorCompanies)"
              strokeWidth={2}
              name="Companies"
            />
            <Area 
              type="monotone" 
              dataKey="technologies" 
              stroke="#f59e0b" 
              fillOpacity={1}
              fill="url(#colorTech)"
              strokeWidth={2}
              name="Technologies"
            />
            <Area 
              type="monotone" 
              dataKey="highImpact" 
              stroke="#ef4444" 
              fillOpacity={1}
              fill="url(#colorHighImpact)"
              strokeWidth={2}
              name="High Impact"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total Growth</div>
            <div className="text-lg font-bold text-blue-600">
              +{Math.round((filteredData[filteredData.length - 1]?.moments || 0) / Math.max((filteredData[0]?.moments || 1), 1) * 100 - 100)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Avg Daily</div>
            <div className="text-lg font-bold">
              {Math.round(moments.length / Math.max(filteredData.length, 1))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Peak Day</div>
            <div className="text-lg font-bold">
              {Math.max(...filteredData.map(d => d.moments - (filteredData[filteredData.indexOf(d) - 1]?.moments || 0)))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Projection</div>
            <div className="text-lg font-bold text-green-600">
              {Math.round(moments.length * 1.5)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Health Indicator Gauge Component
function HealthGauge({ metric }: { metric: HealthMetric }) {
  const percentage = (metric.value / metric.max) * 100
  const rotation = (percentage / 100) * 180 - 90
  
  const getStatusColor = () => {
    switch (metric.status) {
      case 'healthy': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'critical': return '#ef4444'
    }
  }
  
  const getStatusIcon = () => {
    switch (metric.status) {
      case 'healthy': return <CheckCircleIcon className="w-4 h-4" />
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'critical': return <XCircleIcon className="w-4 h-4" />
    }
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke={getStatusColor()}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${(percentage / 100) * 226} 226`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold">{metric.value}</div>
            {metric.unit && <div className="text-xs text-muted-foreground">{metric.unit}</div>}
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs font-medium text-center">{metric.label}</div>
      <div className={`flex items-center space-x-1 mt-1`} style={{ color: getStatusColor() }}>
        {getStatusIcon()}
        <span className="text-xs capitalize">{metric.status}</span>
      </div>
    </div>
  )
}

// Knowledge Base Health Indicators Component (Horizontal Layout)
export function KnowledgeBaseHealthIndicators() {
  const { moments } = useMomentsStore()
  const { companies, technologies } = useCatalogStore()
  
  const healthMetrics = useMemo(() => 
    generateHealthMetrics(moments, companies, technologies),
    [moments, companies, technologies]
  )
  
  const qualityScores = useMemo(() => 
    generateQualityScores(moments),
    [moments]
  )
  
  const overallHealth = healthMetrics.filter(m => m.status === 'healthy').length / healthMetrics.length * 100
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Knowledge Base Health</CardTitle>
        <CardDescription className="text-xs">Quality metrics and system status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Overall Health Score */}
          <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold" style={{ 
              color: overallHealth >= 70 ? '#10b981' : overallHealth >= 40 ? '#f59e0b' : '#ef4444' 
            }}>
              {Math.round(overallHealth)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Overall Health</div>
          </div>
          
          {/* Health Metrics Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              {healthMetrics.map((metric, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="relative w-16 h-16">
                    <svg className="transform -rotate-90 w-16 h-16">
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        stroke="#e5e7eb"
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        stroke={metric.status === 'healthy' ? '#10b981' : metric.status === 'warning' ? '#f59e0b' : '#ef4444'}
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${(metric.value / metric.max) * 150} 150`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-xs font-bold">{metric.value}{metric.unit}</div>
                    </div>
                  </div>
                  <div className="text-xs font-medium mt-1">{metric.label}</div>
                  <div className={`text-xs mt-0.5 ${
                    metric.status === 'healthy' ? 'text-green-600' : 
                    metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metric.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Quality Scores & Industry Coverage */}
          <div className="space-y-4">
            {/* Quality Scores */}
            <div>
              <div className="text-xs font-medium mb-2">Quality Scores</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Completeness</span>
                  <span className="text-xs font-medium">{qualityScores.completeness}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${qualityScores.completeness}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Accuracy</span>
                  <span className="text-xs font-medium">{qualityScores.accuracy}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${qualityScores.accuracy}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Freshness</span>
                  <span className="text-xs font-medium">{qualityScores.freshness}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-yellow-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${qualityScores.freshness}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Coverage</span>
                  <span className="text-xs font-medium">{qualityScores.coverage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${qualityScores.coverage}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Industry Coverage */}
            <div>
              <div className="text-xs font-medium mb-2">Industry Coverage</div>
              <div className="grid grid-cols-2 gap-1">
                {['AI/ML', 'Enterprise', 'Security', 'Cloud', 'Data', 'DevOps'].map((sector, i) => (
                  <div 
                    key={sector}
                    className={`text-xs px-1.5 py-0.5 rounded text-center ${
                      i < 2 ? 'bg-green-100 text-green-800' : 
                      i < 4 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sector}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Knowledge Growth Metrics Component
export function KnowledgeGrowthMetrics() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <GrowthVelocityChart />
      <KnowledgeBaseHealthIndicators />
    </div>
  )
}