'use client'

import { PivotalMoment } from '@/types/moments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getFactorColor, getConfidenceColor } from '@/lib/factor-classifier'
import { Calendar, TrendingUp, Users, Building, Globe, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MomentCardProps {
  moment: PivotalMoment
  onSelect?: (moment: PivotalMoment) => void
  showDetails?: boolean
  className?: string
}

export function MomentCard({ moment, onSelect, showDetails = true, className = '' }: MomentCardProps) {
  const handleClick = () => {
    onSelect?.(moment)
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

              {/* Keywords */}
              {moment.classification.keywords.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Key Terms</div>
                  <div className="flex flex-wrap gap-1">
                    {moment.classification.keywords.slice(0, 5).map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                      >
                        {keyword}
                      </span>
                    ))}
                    {moment.classification.keywords.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{moment.classification.keywords.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Entities */}
              {Object.values(moment.entities).some(arr => arr.length > 0) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {moment.entities.companies.length > 0 && (
                    <div>
                      <div className="font-medium text-muted-foreground mb-1">Companies</div>
                      <div className="space-y-1">
                        {moment.entities.companies.slice(0, 3).map((company) => (
                          <div key={company} className="text-blue-600">{company}</div>
                        ))}
                        {moment.entities.companies.length > 3 && (
                          <div className="text-muted-foreground">+{moment.entities.companies.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {moment.entities.technologies.length > 0 && (
                    <div>
                      <div className="font-medium text-muted-foreground mb-1">Technologies</div>
                      <div className="space-y-1">
                        {moment.entities.technologies.slice(0, 3).map((tech) => (
                          <div key={tech} className="text-indigo-600">{tech}</div>
                        ))}
                        {moment.entities.technologies.length > 3 && (
                          <div className="text-muted-foreground">+{moment.entities.technologies.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default MomentCard