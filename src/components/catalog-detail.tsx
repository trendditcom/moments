'use client'

import { useState, useMemo } from 'react'
import { Company, Technology } from '@/types/catalog'
import { PivotalMoment } from '@/types/moments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MomentCard } from './moment-card'
import { 
  ArrowLeft, 
  Building, 
  Globe, 
  FileText, 
  Image, 
  Calendar,
  TrendingUp,
  Users,
  MapPin,
  Lightbulb
} from 'lucide-react'

interface CatalogDetailProps {
  item: Company | Technology
  type: 'company' | 'technology'
  moments: PivotalMoment[]
  onBack: () => void
  onMomentSelect?: (moment: PivotalMoment) => void
  onEntityClick?: (entity: string, type: 'company' | 'technology') => void
}

export function CatalogDetail({ 
  item, 
  type, 
  moments, 
  onBack, 
  onMomentSelect,
  onEntityClick 
}: CatalogDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'moments'>('overview')

  // Filter moments related to this catalog item
  const relatedMoments = useMemo(() => {
    return moments.filter(moment => {
      const entityList = type === 'company' ? moment.entities.companies : moment.entities.technologies
      return entityList.some(entity => 
        entity.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(entity.toLowerCase())
      ) || moment.source.name === item.name
    })
  }, [moments, item.name, type])

  // Generate insights from related moments
  const insights = useMemo(() => {
    if (relatedMoments.length === 0) return null

    const highImpactMoments = relatedMoments.filter(m => m.impact.score >= 80)
    const averageImpact = relatedMoments.reduce((sum, m) => sum + m.impact.score, 0) / relatedMoments.length
    
    const factorCounts = relatedMoments.reduce((acc, moment) => {
      [...moment.classification.microFactors, ...moment.classification.macroFactors].forEach(factor => {
        acc[factor] = (acc[factor] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const topFactors = Object.entries(factorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    return {
      totalMoments: relatedMoments.length,
      highImpactMoments: highImpactMoments.length,
      averageImpact: Math.round(averageImpact),
      topFactors
    }
  }, [relatedMoments])

  const getIcon = () => {
    return type === 'company' ? <Building className="w-6 h-6" /> : <Globe className="w-6 h-6" />
  }

  const handleKeywordClick = (keyword: string) => {
    // This could trigger a search in the parent component
    console.log('Keyword clicked:', keyword)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3 flex-1">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{item.name}</h1>
            <p className="text-muted-foreground">
              {item.description || `${type === 'company' ? 'Company' : 'Technology'} details`}
            </p>
          </div>
          <Badge variant="secondary">
            {'category' in item ? item.category : 'Technology'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-6 py-2">
          {(['overview', 'content', 'moments'] as const).map((tab) => (
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
              {tab === 'content' && ` (${item.content.length})`}
              {tab === 'moments' && ` (${relatedMoments.length})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Type:</span>
                    <div className="capitalize">{type}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Updated:</span>
                    <div>{new Date(item.updatedAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Content Items:</span>
                    <div>{item.content.length}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Path:</span>
                    <div className="truncate" title={item.path}>{item.path}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            {insights && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    AI Insights
                  </CardTitle>
                  <CardDescription>
                    Intelligence extracted from {insights.totalMoments} related moments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{insights.totalMoments}</div>
                        <div className="text-xs text-muted-foreground">Total Moments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{insights.highImpactMoments}</div>
                        <div className="text-xs text-muted-foreground">High Impact</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{insights.averageImpact}</div>
                        <div className="text-xs text-muted-foreground">Avg Impact</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{insights.topFactors.length}</div>
                        <div className="text-xs text-muted-foreground">Key Factors</div>
                      </div>
                    </div>
                    
                    {insights.topFactors.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Most Relevant Factors</h4>
                        <div className="flex flex-wrap gap-2">
                          {insights.topFactors.map(([factor, count]) => (
                            <Badge key={factor} variant="outline">
                              {factor.replace('_', ' ')} ({count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Content Files</h2>
              <Badge variant="secondary">{item.content.length} items</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {item.content.map((content) => (
                <Card key={content.id} className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {content.type === 'markdown' ? (
                        <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                      ) : (
                        <Image className="w-5 h-5 text-green-500 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{content.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {content.type === 'markdown' ? 'Markdown File' : 'Image File'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {content.content && (
                        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md max-h-24 overflow-y-auto">
                          {content.content.substring(0, 200)}
                          {content.content.length > 200 && '...'}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Type: {content.type}</span>
                        <span className="truncate ml-2" title={content.path}>{content.path.split('/').pop()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'moments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Related Moments</h2>
              <Badge variant="secondary">{relatedMoments.length} moments</Badge>
            </div>
            
            {relatedMoments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Related Moments</h3>
                  <p className="text-muted-foreground">
                    No pivotal moments have been detected for {item.name} yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {relatedMoments.map((moment) => (
                  <MomentCard
                    key={moment.id}
                    moment={moment}
                    onSelect={onMomentSelect}
                    onKeywordClick={handleKeywordClick}
                    onEntityClick={onEntityClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CatalogDetail