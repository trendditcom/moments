'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AIInsightsEngine, type AIAlert, type RecommendationItem, type ExecutiveSummary, type WeeklyReport } from '@/lib/ai-insights-engine'
import { PivotalMoment } from '@/types/moments'
import { Company, Technology } from '@/types/catalog'
import { 
  LightBulbIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon,
  BeakerIcon,
  ChatBubbleLeftIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  ChartBarIcon,
  CpuChipIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface AIInsightsIntegrationProps {
  moments: PivotalMoment[]
  companies: Company[]
  technologies: Technology[]
  isLoading?: boolean
}

// AI Insights Card - Enhanced version to replace basic AIInsightsCard
export function AIInsightsCard({ insightCount, alerts, recommendations, onViewDetails }: {
  insightCount: number
  alerts: AIAlert[]
  recommendations: RecommendationItem[]
  onViewDetails: () => void
}) {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
  const highPriorityRecommendations = recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high').length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium">AI Insights</CardTitle>
        <SparklesIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">{insightCount}</div>
          <p className="text-xs text-muted-foreground">
            New insights generated
          </p>
          
          <div className="space-y-2">
            {/* Alert Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BellIcon className="w-4 h-4 text-orange-500" />
                <span className="text-sm">Active Alerts</span>
              </div>
              <Badge variant={criticalAlerts > 0 ? "destructive" : "secondary"}>
                {alerts.length}
              </Badge>
            </div>

            {/* Recommendation Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <LightBulbIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Recommendations</span>
              </div>
              <Badge variant={highPriorityRecommendations > 0 ? "default" : "secondary"}>
                {recommendations.length}
              </Badge>
            </div>
            
            {/* Latest Alert Preview */}
            {alerts.length > 0 && (
              <div className="p-2 bg-orange-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-orange-900">
                      {alerts[0].title}
                    </p>
                    <p className="text-xs text-orange-700">
                      {alerts[0].description.slice(0, 80)}...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={onViewDetails}>
            View All Insights
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main AI Insights Integration Component
export function AIInsightsIntegration({ moments, companies, technologies, isLoading = false }: AIInsightsIntegrationProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'recommendations' | 'summary' | 'reports'>('alerts')
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('7d')

  // Generate insights using AI engine
  const insights = useMemo(() => {
    if (moments.length === 0) return null
    
    const engine = AIInsightsEngine.getInstance()
    
    return {
      alerts: engine.generateAlerts(moments, companies, technologies),
      recommendations: engine.generateRecommendations(moments, companies, technologies),
      executiveSummary: engine.generateExecutiveSummary(moments, companies, technologies, selectedTimeframe),
      weeklyReport: engine.generateWeeklyReport(moments, companies, technologies)
    }
  }, [moments, companies, technologies, selectedTimeframe])

  if (isLoading || !insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Insights Integration</CardTitle>
          <CardDescription>Intelligent alerts and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin">
              <CpuChipIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <span className="ml-2 text-sm text-muted-foreground">
              {isLoading ? 'Analyzing data...' : 'Loading insights...'}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSeverityIcon = (severity: AIAlert['severity']) => {
    switch (severity) {
      case 'critical': return <ShieldExclamationIcon className="w-4 h-4 text-red-500" />
      case 'high': return <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
      case 'medium': return <InformationCircleIcon className="w-4 h-4 text-yellow-500" />
      case 'low': return <CheckCircleIcon className="w-4 h-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: AIAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getPriorityColor = (priority: RecommendationItem['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getTypeIcon = (type: AIAlert['type']) => {
    switch (type) {
      case 'emerging_trend': return <ArrowTrendingUpIcon className="w-4 h-4" />
      case 'unusual_activity': return <BellIcon className="w-4 h-4" />
      case 'risk_indicator': return <ShieldExclamationIcon className="w-4 h-4" />
      case 'opportunity': return <LightBulbIcon className="w-4 h-4" />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">AI Insights Integration</CardTitle>
            <CardDescription>Intelligent alerts, recommendations, and executive insights</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {insights.alerts.length} alerts
            </Badge>
            <Badge variant="outline" className="text-xs">
              {insights.recommendations.length} recommendations
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'alerts'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <BellIcon className="w-4 h-4" />
              <span>Alerts ({insights.alerts.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'recommendations'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <LightBulbIcon className="w-4 h-4" />
              <span>Recommendations ({insights.recommendations.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'summary'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <DocumentTextIcon className="w-4 h-4" />
              <span>Executive Summary</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'reports'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <DocumentDuplicateIcon className="w-4 h-4" />
              <span>Reports</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Intelligent Alerts</h3>
              <Badge variant="outline">
                {insights.alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} high priority
              </Badge>
            </div>
            
            {insights.alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No active alerts</p>
                <p className="text-xs text-muted-foreground">All systems operating normally</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.alerts.map((alert) => (
                  <Collapsible
                    key={alert.id}
                    open={expandedAlert === alert.id}
                    onOpenChange={(open) => setExpandedAlert(open ? alert.id : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${getSeverityColor(alert.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getSeverityIcon(alert.severity)}
                            <div>
                              <div className="flex items-center space-x-2">
                                {getTypeIcon(alert.type)}
                                <h4 className="text-sm font-medium">{alert.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {alert.category}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {alert.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-muted-foreground">Confidence:</span>
                                  <span className="text-xs font-medium">{alert.confidence}%</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <ClockIcon className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {alert.detectedAt.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            {expandedAlert === alert.id ? (
                              <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-3 ml-7 space-y-3">
                        {/* Insights */}
                        <div>
                          <h5 className="text-xs font-medium mb-2">Key Insights</h5>
                          <ul className="space-y-1">
                            {alert.insights.map((insight, index) => (
                              <li key={index} className="text-xs text-muted-foreground flex items-start space-x-2">
                                <span className="text-primary">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Items */}
                        <div>
                          <h5 className="text-xs font-medium mb-2">Recommended Actions</h5>
                          <ul className="space-y-1">
                            {alert.actionItems.map((action, index) => (
                              <li key={index} className="text-xs text-muted-foreground flex items-start space-x-2">
                                <ArrowRightIcon className="w-3 h-3 text-primary mt-0.5" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Related Moments */}
                        {alert.relevantMoments.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium mb-2">Related Moments</h5>
                            <div className="flex flex-wrap gap-1">
                              {alert.relevantMoments.slice(0, 3).map((momentId) => (
                                <Badge key={momentId} variant="outline" className="text-xs">
                                  Moment #{momentId.slice(-4)}
                                </Badge>
                              ))}
                              {alert.relevantMoments.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{alert.relevantMoments.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">AI Recommendations</h3>
              <Badge variant="outline">
                {insights.recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high').length} high priority
              </Badge>
            </div>
            
            {insights.recommendations.length === 0 ? (
              <div className="text-center py-8">
                <LightBulbIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No recommendations available</p>
                <p className="text-xs text-muted-foreground">Analysis complete, all opportunities identified</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.recommendations.map((recommendation) => (
                  <Collapsible
                    key={recommendation.id}
                    open={expandedRecommendation === recommendation.id}
                    onOpenChange={(open) => setExpandedRecommendation(open ? recommendation.id : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${getPriorityColor(recommendation.priority)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <LightBulbIcon className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium">{recommendation.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {recommendation.category}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {recommendation.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-muted-foreground">Impact:</span>
                                  <span className="text-xs font-medium">{recommendation.estimatedImpact}%</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-muted-foreground">Effort:</span>
                                  <span className="text-xs font-medium">{recommendation.estimatedEffort}</span>
                                </div>
                                {recommendation.dueDate && (
                                  <div className="flex items-center space-x-1">
                                    <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {recommendation.dueDate.toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(recommendation.priority)}>
                              {recommendation.priority}
                            </Badge>
                            {expandedRecommendation === recommendation.id ? (
                              <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-3 ml-7 space-y-3">
                        {/* Reasoning */}
                        <div>
                          <h5 className="text-xs font-medium mb-2">Reasoning</h5>
                          <p className="text-xs text-muted-foreground">{recommendation.reasoning}</p>
                        </div>

                        {/* Suggested Action */}
                        <div>
                          <h5 className="text-xs font-medium mb-2">Suggested Action</h5>
                          <p className="text-xs text-muted-foreground">{recommendation.suggestedAction}</p>
                        </div>

                        {/* Related Entities */}
                        {recommendation.relatedEntities.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium mb-2">Related Entities</h5>
                            <div className="flex flex-wrap gap-1">
                              {recommendation.relatedEntities.map((entity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {entity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Executive Summary</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as '24h' | '7d' | '30d' | '90d')}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-900">{insights.executiveSummary.metrics.totalMoments}</div>
                <div className="text-xs text-blue-700">Total Moments</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-900">{insights.executiveSummary.metrics.highImpactMoments}</div>
                <div className="text-xs text-red-700">High Impact</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-900">{insights.executiveSummary.metrics.newCompanies}</div>
                <div className="text-xs text-green-700">New Companies</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-900">{insights.executiveSummary.metrics.newTechnologies}</div>
                <div className="text-xs text-purple-700">New Technologies</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-900">{insights.executiveSummary.metrics.correlationsDetected}</div>
                <div className="text-xs text-orange-700">Correlations</div>
              </div>
            </div>

            {/* Key Insights */}
            <div>
              <h4 className="text-sm font-medium mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {insights.executiveSummary.keyInsights.map((insight, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trend Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                  <span>Trending</span>
                </h4>
                <ul className="space-y-1">
                  {insights.executiveSummary.trendAnalysis.trending.map((item, index) => (
                    <li key={index} className="text-xs text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                  <span>Declining</span>
                </h4>
                <ul className="space-y-1">
                  {insights.executiveSummary.trendAnalysis.declining.map((item, index) => (
                    <li key={index} className="text-xs text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                  <SparklesIcon className="w-4 h-4 text-blue-500" />
                  <span>Emerging</span>
                </h4>
                <ul className="space-y-1">
                  {insights.executiveSummary.trendAnalysis.emerging.map((item, index) => (
                    <li key={index} className="text-xs text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                <ShieldExclamationIcon className="w-4 h-4 text-orange-500" />
                <span>Risk Assessment</span>
                <Badge className={`ml-2 ${
                  insights.executiveSummary.riskAssessment.level === 'critical' ? 'bg-red-100 text-red-800' :
                  insights.executiveSummary.riskAssessment.level === 'high' ? 'bg-orange-100 text-orange-800' :
                  insights.executiveSummary.riskAssessment.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {insights.executiveSummary.riskAssessment.level}
                </Badge>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-medium mb-2">Risk Factors</h5>
                  <ul className="space-y-1">
                    {insights.executiveSummary.riskAssessment.factors.map((factor, index) => (
                      <li key={index} className="text-xs text-muted-foreground">• {factor}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-medium mb-2">Mitigation Strategies</h5>
                  <ul className="space-y-1">
                    {insights.executiveSummary.riskAssessment.mitigation.map((strategy, index) => (
                      <li key={index} className="text-xs text-muted-foreground">• {strategy}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <h4 className="text-sm font-medium mb-3">Recommended Actions</h4>
              <ul className="space-y-2">
                {insights.executiveSummary.recommendedActions.map((action, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                    <ArrowRightIcon className="w-4 h-4 text-primary mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Weekly Report</h3>
              <Badge variant="outline">
                Week of {insights.weeklyReport.weekOf.toLocaleDateString()}
              </Badge>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Weekly Summary</h4>
              <p className="text-sm text-muted-foreground">{insights.weeklyReport.summary}</p>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span>Achievements</span>
                </h4>
                <ul className="space-y-1">
                  {insights.weeklyReport.highlights.achievements.map((achievement, index) => (
                    <li key={index} className="text-xs text-muted-foreground">• {achievement}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                  <span>Challenges</span>
                </h4>
                <ul className="space-y-1">
                  {insights.weeklyReport.highlights.challenges.map((challenge, index) => (
                    <li key={index} className="text-xs text-muted-foreground">• {challenge}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                  <SparklesIcon className="w-4 h-4 text-blue-500" />
                  <span>Surprises</span>
                </h4>
                <ul className="space-y-1">
                  {insights.weeklyReport.highlights.surprises.map((surprise, index) => (
                    <li key={index} className="text-xs text-muted-foreground">• {surprise}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Entity Spotlight */}
            <div>
              <h4 className="text-sm font-medium mb-3">Entity Spotlight</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <h5 className="text-xs font-medium mb-2">Top Companies</h5>
                  <div className="flex flex-wrap gap-1">
                    {insights.weeklyReport.entitySpotlight.companies.map((company, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-medium mb-2">Top Technologies</h5>
                  <div className="flex flex-wrap gap-1">
                    {insights.weeklyReport.entitySpotlight.technologies.map((tech, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-medium mb-2">Key People</h5>
                  <div className="flex flex-wrap gap-1">
                    {insights.weeklyReport.entitySpotlight.people.map((person, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {person}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Health */}
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium mb-3">Data Health</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{insights.weeklyReport.dataHealth.coverage}%</div>
                  <div className="text-xs text-muted-foreground">Coverage</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{insights.weeklyReport.dataHealth.quality}%</div>
                  <div className="text-xs text-muted-foreground">Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{insights.weeklyReport.dataHealth.freshness}%</div>
                  <div className="text-xs text-muted-foreground">Freshness</div>
                </div>
              </div>
            </div>

            {/* Looking Ahead */}
            <div>
              <h4 className="text-sm font-medium mb-3">Looking Ahead</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <h5 className="text-xs font-medium mb-2">Predictions</h5>
                  <ul className="space-y-1">
                    {insights.weeklyReport.lookingAhead.predictions.map((prediction, index) => (
                      <li key={index} className="text-xs text-muted-foreground">• {prediction}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-medium mb-2">Watch List</h5>
                  <ul className="space-y-1">
                    {insights.weeklyReport.lookingAhead.watchList.map((item, index) => (
                      <li key={index} className="text-xs text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-medium mb-2">Recommendations</h5>
                  <ul className="space-y-1">
                    {insights.weeklyReport.lookingAhead.recommendations.map((rec, index) => (
                      <li key={index} className="text-xs text-muted-foreground">• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export/Action Buttons */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <DocumentTextIcon className="w-4 h-4 mr-1" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
              Ask AI
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}