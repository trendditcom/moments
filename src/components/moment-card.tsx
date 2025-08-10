'use client'

import { PivotalMoment } from '@/types/moments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getFactorColor, getConfidenceColor } from '@/lib/factor-classifier'
import { Calendar, TrendingUp, Users, Building, Globe, AlertTriangle, ChevronDown, ChevronUp, Filter, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

interface MomentCardProps {
  moment: PivotalMoment
  onSelect?: (moment: PivotalMoment) => void
  onKeywordClick?: (keyword: string) => void
  onEntityClick?: (entity: string, type: 'company' | 'technology') => void
  showDetails?: boolean
  className?: string
}

export function MomentCard({ moment, onSelect, onKeywordClick, onEntityClick, showDetails = true, className = '' }: MomentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const handleClick = () => {
    onSelect?.(moment)
  }
  
  const handleKeywordClick = (e: React.MouseEvent, keyword: string) => {
    e.stopPropagation()
    onKeywordClick?.(keyword)
  }
  
  const handleEntityClick = (e: React.MouseEvent, entity: string, type: 'company' | 'technology') => {
    e.stopPropagation()
    onEntityClick?.(entity, type)
  }
  
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const getImpactColor = (score: number): string => {
    if (score >= 80) return 'text-red-600 bg-red-50'
    if (score >= 60) return 'text-orange-600 bg-orange-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getImpactIcon = (score: number) => {
    if (score >= 80) return <AlertTriangle className="w-4 h-4" />
    return <TrendingUp className="w-4 h-4" />
  }

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'company': return <Building className="w-4 h-4" />
      case 'technology': return <Globe className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  return (
    <Card 
      className={`hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 ${
        moment.impact.score >= 80 ? 'border-l-red-500' :
        moment.impact.score >= 60 ? 'border-l-orange-500' :
        moment.impact.score >= 40 ? 'border-l-yellow-500' :
        'border-l-green-500'
      } ${className}`}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight mb-2 line-clamp-2">
              {moment.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {moment.description}
            </CardDescription>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getImpactColor(moment.impact.score)}`}>
              {getImpactIcon(moment.impact.score)}
              <span>{moment.impact.score}</span>
            </div>
            <div className={`text-sm font-medium ${getConfidenceColor(moment.classification.confidence)}`}>
              {moment.classification.confidence.toUpperCase()}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Factor Classification */}
          <div className="space-y-2">
            {moment.classification.microFactors.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Micro Factors</div>
                <div className="flex flex-wrap gap-1">
                  {moment.classification.microFactors.map((factor) => (
                    <Badge
                      key={factor}
                      variant="secondary"
                      className={`text-xs ${getFactorColor(factor)}`}
                    >
                      {factor.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {moment.classification.macroFactors.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Macro Factors</div>
                <div className="flex flex-wrap gap-1">
                  {moment.classification.macroFactors.map((factor) => (
                    <Badge
                      key={factor}
                      variant="outline"
                      className={`text-xs ${getFactorColor(factor)}`}
                    >
                      {factor.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showDetails && (
            <>
              {/* Timeline & Source Info */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  {getSourceIcon(moment.source.type)}
                  <span className="truncate">{moment.source.name}</span>
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
              </div>

              {/* Keywords - Interactive */}
              {moment.classification.keywords.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    Key Terms (click to filter)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {moment.classification.keywords.slice(0, isExpanded ? undefined : 5).map((keyword) => (
                      <button
                        key={keyword}
                        onClick={(e) => handleKeywordClick(e, keyword)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                        title={`Click to filter by "${keyword}"`}
                      >
                        {keyword}
                      </button>
                    ))}
                    {!isExpanded && moment.classification.keywords.length > 5 && (
                      <button
                        onClick={toggleExpanded}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        +{moment.classification.keywords.length - 5} more
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Entities - Interactive */}
              {Object.values(moment.entities).some(arr => arr.length > 0) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {moment.entities.companies.length > 0 && (
                    <div>
                      <div className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        Companies
                      </div>
                      <div className="space-y-1">
                        {moment.entities.companies.slice(0, isExpanded ? undefined : 3).map((company) => (
                          <button
                            key={company}
                            onClick={(e) => handleEntityClick(e, company, 'company')}
                            className="text-blue-600 hover:text-blue-800 hover:underline text-left flex items-center gap-1 transition-colors"
                            title={`View ${company} details`}
                          >
                            {company}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ))}
                        {!isExpanded && moment.entities.companies.length > 3 && (
                          <button
                            onClick={toggleExpanded}
                            className="text-muted-foreground hover:text-foreground underline"
                          >
                            +{moment.entities.companies.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {moment.entities.technologies.length > 0 && (
                    <div>
                      <div className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Technologies
                      </div>
                      <div className="space-y-1">
                        {moment.entities.technologies.slice(0, isExpanded ? undefined : 3).map((tech) => (
                          <button
                            key={tech}
                            onClick={(e) => handleEntityClick(e, tech, 'technology')}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline text-left flex items-center gap-1 transition-colors"
                            title={`View ${tech} details`}
                          >
                            {tech}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ))}
                        {!isExpanded && moment.entities.technologies.length > 3 && (
                          <button
                            onClick={toggleExpanded}
                            className="text-muted-foreground hover:text-foreground underline"
                          >
                            +{moment.entities.technologies.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Additional Details - Expandable */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {/* Classification Reasoning */}
                  {moment.classification.reasoning && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Classification Reasoning</div>
                      <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                        {moment.classification.reasoning}
                      </div>
                    </div>
                  )}
                  
                  {/* Impact Analysis */}
                  {moment.impact.reasoning && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Impact Analysis (Score: {moment.impact.score}/100)
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                        {moment.impact.reasoning}
                      </div>
                    </div>
                  )}
                  
                  {/* Full Content Extract */}
                  {moment.content && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Content Extract</div>
                      <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                        {moment.content}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Entities */}
                  {(moment.entities.people.length > 0 || moment.entities.locations.length > 0) && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {moment.entities.people.length > 0 && (
                        <div>
                          <div className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            People
                          </div>
                          <div className="space-y-1">
                            {moment.entities.people.map((person) => (
                              <div key={person} className="text-purple-600">{person}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {moment.entities.locations.length > 0 && (
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Locations</div>
                          <div className="space-y-1">
                            {moment.entities.locations.map((location) => (
                              <div key={location} className="text-green-600">{location}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Expand/Collapse Toggle */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={toggleExpanded}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? (
                    <>
                      Show Less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Show More <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default MomentCard