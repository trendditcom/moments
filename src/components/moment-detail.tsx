'use client'

import { useState, useMemo } from 'react'
import { PivotalMoment } from '@/types/moments'
import { Company, Technology } from '@/types/catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MomentCard } from './moment-card'
import { getFactorColor, getConfidenceColor } from '@/lib/factor-classifier'
import { 
  ArrowLeft, 
  Lightbulb,
  FileText, 
  Calendar,
  TrendingUp,
  Users,
  Building,
  Globe,
  AlertTriangle,
  Link,
  Clock,
  Target,
  Brain
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MomentDetailProps {
  moment: PivotalMoment
  allMoments: PivotalMoment[]
  companies: Company[]
  technologies: Technology[]
  onBack: () => void
  onMomentSelect?: (moment: PivotalMoment) => void
  onEntityClick?: (entity: string, type: 'company' | 'technology') => void
}

export function MomentDetail({ 
  moment, 
  allMoments,
  companies,
  technologies,
  onBack, 
  onMomentSelect,
  onEntityClick 
}: MomentDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'related' | 'source' | 'timeline'>('overview')

  // Find related moments based on shared factors, entities, or source
  const relatedMoments = useMemo(() => {
    return allMoments
      .filter(m => m.id !== moment.id)
      .map(m => {
        let score = 0
        let reasons: string[] = []

        // Check for shared micro factors
        const sharedMicroFactors = m.classification.microFactors.filter(factor => 
          moment.classification.microFactors.includes(factor)
        )
        if (sharedMicroFactors.length > 0) {
          score += sharedMicroFactors.length * 15
          reasons.push(`Shared micro factors: ${sharedMicroFactors.join(', ')}`)
        }

        // Check for shared macro factors
        const sharedMacroFactors = m.classification.macroFactors.filter(factor => 
          moment.classification.macroFactors.includes(factor)
        )
        if (sharedMacroFactors.length > 0) {
          score += sharedMacroFactors.length * 10
          reasons.push(`Shared macro factors: ${sharedMacroFactors.join(', ')}`)
        }

        // Check for shared entities
        const sharedCompanies = m.entities.companies.filter(company => 
          moment.entities.companies.includes(company)
        )
        const sharedTechnologies = m.entities.technologies.filter(tech => 
          moment.entities.technologies.includes(tech)
        )
        if (sharedCompanies.length > 0) {
          score += sharedCompanies.length * 20
          reasons.push(`Shared companies: ${sharedCompanies.join(', ')}`)
        }
        if (sharedTechnologies.length > 0) {
          score += sharedTechnologies.length * 20
          reasons.push(`Shared technologies: ${sharedTechnologies.join(', ')}`)
        }

        // Check for same source
        if (m.source.name === moment.source.name) {
          score += 25
          reasons.push(`Same source: ${m.source.name}`)
        }

        // Check for similar keywords
        const sharedKeywords = m.classification.keywords.filter(keyword => 
          moment.classification.keywords.includes(keyword)
        )
        if (sharedKeywords.length > 0) {
          score += sharedKeywords.length * 5
          reasons.push(`Shared keywords: ${sharedKeywords.slice(0, 3).join(', ')}${sharedKeywords.length > 3 ? '...' : ''}`)
        }

        return { moment: m, score, reasons }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }, [allMoments, moment])

  // Source analysis
  const sourceAnalysis = useMemo(() => {
    const sourceEntity = moment.source.type === 'company' 
      ? companies.find(c => c.name === moment.source.name)
      : technologies.find(t => t.name === moment.source.name)
    
    const sourceMoments = allMoments.filter(m => m.source.name === moment.source.name)
    
    return {
      entity: sourceEntity,
      totalMoments: sourceMoments.length,
      averageImpact: sourceMoments.length > 0 
        ? Math.round(sourceMoments.reduce((sum, m) => sum + m.impact.score, 0) / sourceMoments.length)
        : 0,
      highImpactMoments: sourceMoments.filter(m => m.impact.score >= 80).length
    }
  }, [moment, allMoments, companies, technologies])

  const getImpactColor = (score: number): string => {
    if (score >= 80) return 'text-red-600 bg-red-50 border-red-200'
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getImpactIcon = (score: number) => {
    if (score >= 80) return <AlertTriangle className="w-5 h-5" />
    return <TrendingUp className="w-5 h-5" />
  }

  const getSourceIcon = () => {
    return moment.source.type === 'company' ? <Building className="w-5 h-5" /> : <Globe className="w-5 h-5" />
  }

  const handleKeywordClick = (keyword: string) => {
    // This could trigger a search in the parent component
    console.log('Keyword clicked:', keyword)
  }

  // Safe date formatting helper
  const formatDate = (date: Date | string | undefined, fallback: string = 'Not specified'): string => {
    if (!date) return fallback
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString()
      }
      return fallback
    } catch {
      return fallback
    }
  }

  const formatDateTime = (date: Date | string | undefined): string => {
    if (!date) return 'Unknown'
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        return `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString()}`
      }
      return 'Unknown'
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border ${getImpactColor(moment.impact.score)}`}>
              {getImpactIcon(moment.impact.score)}
              <span>Impact {moment.impact.score}/100</span>
            </div>
            <Badge variant="secondary" className={getConfidenceColor(moment.classification.confidence)}>
              {moment.classification.confidence.toUpperCase()} CONFIDENCE
            </Badge>
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight mb-2">{moment.title}</h1>
            <p className="text-muted-foreground text-lg">{moment.description}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {getSourceIcon()}
              <span>{moment.source.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {moment.timeline.estimatedDate 
                  ? formatDistanceToNow(moment.timeline.estimatedDate, { addSuffix: true })
                  : moment.timeline.timeframe || 'Timeline unknown'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Detected {formatDistanceToNow(moment.extractedAt, { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-6 py-2">
          {(['overview', 'related', 'source', 'timeline'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {tab === 'related' && ` (${relatedMoments.length})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Classification Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Factor Classification
                </CardTitle>
                <CardDescription>
                  AI analysis of business factors impacting this moment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Micro Factors */}
                {moment.classification.microFactors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Micro Factors</h4>
                    <div className="flex flex-wrap gap-2">
                      {moment.classification.microFactors.map((factor) => (
                        <Badge
                          key={factor}
                          variant="secondary"
                          className={`${getFactorColor(factor)}`}
                        >
                          {factor.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Macro Factors */}
                {moment.classification.macroFactors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Macro Factors</h4>
                    <div className="flex flex-wrap gap-2">
                      {moment.classification.macroFactors.map((factor) => (
                        <Badge
                          key={factor}
                          variant="outline"
                          className={`${getFactorColor(factor)}`}
                        >
                          {factor.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Classification Reasoning */}
                {moment.classification.reasoning && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Classification Reasoning</h4>
                    <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                      {moment.classification.reasoning}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Impact Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Impact Analysis
                </CardTitle>
                <CardDescription>
                  AI assessment of business impact and significance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      moment.impact.score >= 80 ? 'text-red-600' :
                      moment.impact.score >= 60 ? 'text-orange-600' :
                      moment.impact.score >= 40 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {moment.impact.score}
                    </div>
                    <div className="text-sm text-muted-foreground">Impact Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {moment.classification.confidence.toUpperCase()}
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {moment.classification.microFactors.length + moment.classification.macroFactors.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Factors</div>
                  </div>
                </div>
                
                {moment.impact.reasoning && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Impact Reasoning</h4>
                    <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                      {moment.impact.reasoning}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Entities */}
            {Object.values(moment.entities).some(arr => arr.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Related Entities
                  </CardTitle>
                  <CardDescription>
                    Companies, technologies, people, and locations mentioned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {moment.entities.companies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Companies ({moment.entities.companies.length})
                        </h4>
                        <div className="space-y-2">
                          {moment.entities.companies.map((company) => (
                            <button
                              key={company}
                              onClick={() => onEntityClick?.(company, 'company')}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left block transition-colors"
                            >
                              {company}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {moment.entities.technologies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Technologies ({moment.entities.technologies.length})
                        </h4>
                        <div className="space-y-2">
                          {moment.entities.technologies.map((tech) => (
                            <button
                              key={tech}
                              onClick={() => onEntityClick?.(tech, 'technology')}
                              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline text-left block transition-colors"
                            >
                              {tech}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {moment.entities.people.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          People ({moment.entities.people.length})
                        </h4>
                        <div className="space-y-1">
                          {moment.entities.people.map((person) => (
                            <div key={person} className="text-sm text-purple-600">{person}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {moment.entities.locations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Locations ({moment.entities.locations.length})</h4>
                        <div className="space-y-1">
                          {moment.entities.locations.map((location) => (
                            <div key={location} className="text-sm text-green-600">{location}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Keywords */}
            {moment.classification.keywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Key Terms
                  </CardTitle>
                  <CardDescription>
                    Important keywords extracted from the content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {moment.classification.keywords.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => handleKeywordClick(keyword)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'related' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Related Moments</h2>
              <Badge variant="secondary">{relatedMoments.length} moments</Badge>
            </div>
            
            {relatedMoments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Link className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Related Moments</h3>
                  <p className="text-muted-foreground">
                    No similar or connected moments have been found yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {relatedMoments.map(({ moment: relatedMoment, score, reasons }) => (
                  <div key={relatedMoment.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        Similarity Score: {score}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {reasons.slice(0, 2).join(' • ')}
                      </div>
                    </div>
                    <MomentCard
                      moment={relatedMoment}
                      onSelect={onMomentSelect}
                      onKeywordClick={handleKeywordClick}
                      onEntityClick={onEntityClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'source' && (
          <div className="space-y-6">
            {/* Source Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getSourceIcon()}
                  Source Details
                </CardTitle>
                <CardDescription>
                  Information about the source of this moment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Source Name:</span>
                    <div className="text-sm">{moment.source.name}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Source Type:</span>
                    <div className="text-sm capitalize">{moment.source.type}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">File Path:</span>
                    <div className="text-sm font-mono text-muted-foreground break-all">{moment.source.filePath}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Content ID:</span>
                    <div className="text-sm font-mono text-muted-foreground">{moment.source.contentId}</div>
                  </div>
                </div>

                {/* Source Analytics */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Source Analytics</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{sourceAnalysis.totalMoments}</div>
                      <div className="text-xs text-muted-foreground">Total Moments</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{sourceAnalysis.highImpactMoments}</div>
                      <div className="text-xs text-muted-foreground">High Impact</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{sourceAnalysis.averageImpact}</div>
                      <div className="text-xs text-muted-foreground">Avg Impact</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Full Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Original Content
                </CardTitle>
                <CardDescription>
                  Full text content from which this moment was extracted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md max-h-96 overflow-y-auto whitespace-pre-wrap">
                  {moment.content}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {/* Timeline Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline Context
                </CardTitle>
                <CardDescription>
                  Temporal information about this moment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Estimated Date:</span>
                    <div className="text-sm">
                      {formatDate(moment.timeline.estimatedDate)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Timeframe:</span>
                    <div className="text-sm">{moment.timeline.timeframe || 'Not specified'}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Historical:</span>
                    <div className="text-sm">{moment.timeline.isHistorical ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Extracted:</span>
                  <div className="text-sm">
                    {formatDateTime(moment.extractedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Future: Timeline visualization could be added here */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline Visualization</CardTitle>
                <CardDescription>
                  Visual representation of this moment in context
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <p>Timeline visualization coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default MomentDetail