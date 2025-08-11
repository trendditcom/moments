'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ClockIcon,
  LinkIcon,
  LightBulbIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// Types for dashboard metrics
interface KnowledgeGrowthMetrics {
  totalMoments: number
  growth: number
  trend: 'up' | 'down' | 'stable'
  velocity: number
}

interface TrendingFactorData {
  name: string
  count: number
  change: number
  impact: 'high' | 'medium' | 'low'
}

// 1. Knowledge Base Growth Metrics Component
export function KnowledgeGrowthCard({ metrics }: { metrics: KnowledgeGrowthMetrics }) {
  const TrendIcon = metrics.trend === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
  const trendColor = metrics.trend === 'up' ? 'text-green-600' : 
                    metrics.trend === 'down' ? 'text-red-600' : 'text-gray-600'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Knowledge Base Growth</CardTitle>
        <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">{metrics.totalMoments.toLocaleString()}</div>
            <Badge variant="outline" className={`flex items-center space-x-1 ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              <span className="text-xs">{Math.abs(metrics.growth)}%</span>
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Total moments in knowledge base
          </p>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Analysis Velocity:</span>
              <span className="font-medium">{metrics.velocity}/day</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 2. Trending Factors Card Component
export function TrendingFactorsCard({ factors }: { factors: TrendingFactorData[] }) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'  
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Trending Factors</CardTitle>
        <CardDescription>Most active factor categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {factors.slice(0, 5).map((factor, index) => (
            <div key={factor.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-medium truncate">{factor.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getImpactColor(factor.impact)}`}>
                  {factor.count}
                </Badge>
                <Badge variant="outline" className={`text-xs ${
                  factor.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {factor.change > 0 ? '+' : ''}{factor.change}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 3. Entity Network Overview Component
export function EntityNetworkCard({ entityCount }: { entityCount: { companies: number, technologies: number, concepts: number } }) {
  const totalEntities = entityCount.companies + entityCount.technologies + entityCount.concepts

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Entity Network</CardTitle>
        <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">{totalEntities}</div>
          <p className="text-xs text-muted-foreground">
            Connected entities in network
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Companies:</span>
              <span className="font-medium">{entityCount.companies}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Technologies:</span>
              <span className="font-medium">{entityCount.technologies}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Concepts:</span>
              <span className="font-medium">{entityCount.concepts}</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="w-full mt-2">
            View Network Graph
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 4. Moment Timeline Overview Component
export function MomentTimelineCard({ recentMoments }: { recentMoments: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        <ClockIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">{recentMoments}</div>
          <p className="text-xs text-muted-foreground">
            Moments in last 7 days
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Today:</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">This Week:</span>
              <span className="font-medium">{recentMoments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average/Day:</span>
              <span className="font-medium">{Math.round(recentMoments / 7)}</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="w-full mt-2">
            View Timeline
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 5. Correlation Insights Card Component  
export function CorrelationInsightsCard({ correlationCount }: { correlationCount: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Correlation Insights</CardTitle>
        <LinkIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">{correlationCount}</div>
          <p className="text-xs text-muted-foreground">
            Strong correlations discovered
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm">High Impact: 8</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm">Medium Impact: 15</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm">Emerging: 7</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="w-full mt-2">
            Explore Correlations
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 6. AI Insights Alert Component
export function AIInsightsCard({ insightCount }: { insightCount: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
        <LightBulbIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">{insightCount}</div>
          <p className="text-xs text-muted-foreground">
            New insights generated
          </p>
          
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-900">
                    Emerging Trend Detected
                  </p>
                  <p className="text-xs text-blue-700">
                    AI regulation moments increased 40% this week
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="w-full mt-2">
            View All Insights
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Analysis Depth Control Component
export function AnalysisDepthSelector({ 
  currentDepth, 
  onDepthChange 
}: { 
  currentDepth: 'strategic' | 'tactical' | 'operational'
  onDepthChange: (depth: 'strategic' | 'tactical' | 'operational') => void 
}) {
  const depths = [
    { value: 'strategic' as const, label: 'Strategic Overview', description: 'Executive KPIs and trends' },
    { value: 'tactical' as const, label: 'Tactical Insights', description: 'Analysis for strategists' },  
    { value: 'operational' as const, label: 'Operational Details', description: 'Granular data analysis' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Analysis Depth</CardTitle>
        <CardDescription>Adjust information density and detail level</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {depths.map((depth) => (
            <button
              key={depth.value}
              onClick={() => onDepthChange(depth.value)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentDepth === depth.value
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground'
              }`}
            >
              <div className="font-medium text-sm">{depth.label}</div>
              <div className="text-xs opacity-70">{depth.description}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Empty State Component for future dashboard widgets
export function DashboardPlaceholder({ title, description, icon: Icon }: {
  title: string
  description: string  
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Icon className="w-8 h-8 text-muted-foreground mb-4" />
        <h3 className="text-sm font-medium text-center mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground text-center mb-4 max-w-xs">
          {description}
        </p>
        <Button variant="outline" size="sm">
          Coming Soon
        </Button>
      </CardContent>
    </Card>
  )
}