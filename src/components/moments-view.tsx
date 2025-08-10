'use client'

import { useState, useMemo } from 'react'
import { PivotalMoment, Factor, ConfidenceLevel, AnalysisProgress } from '@/types/moments'
import { MomentCard } from './moment-card'
import { ProgressIndicator } from './progress-indicator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar,
  TrendingUp,
  Eye,
  Search,
  BarChart3,
  AlertCircle,
  RefreshCw,
  WifiIcon
} from 'lucide-react'
import { getAllFactors } from '@/lib/factor-classifier'

interface MomentsViewProps {
  moments: PivotalMoment[]
  isLoading?: boolean
  error?: string | null
  progress?: AnalysisProgress
  onAnalyzeMoments?: () => void
  onAnalyzeIncremental?: () => void
  onForceFullAnalysis?: () => void
  onClearIncrementalCache?: () => void
  incrementalStats?: {
    trackedContent: number
    lastUpdate: Date | null
    temporalWindowDays: number
  }
  onMomentSelect?: (moment: PivotalMoment) => void
  onEntityClick?: (entity: string, type: 'company' | 'technology') => void
  onRefreshMoments?: () => Promise<any>
  isRefreshing?: boolean
  lastRefresh?: Date | null
}

type SortOption = 'impact' | 'date' | 'confidence' | 'title'
type SortDirection = 'asc' | 'desc'

export function MomentsView({ 
  moments, 
  isLoading = false, 
  error = null,
  progress,
  onAnalyzeMoments,
  onAnalyzeIncremental,
  onForceFullAnalysis,
  onClearIncrementalCache,
  incrementalStats,
  onMomentSelect,
  onEntityClick,
  onRefreshMoments,
  isRefreshing = false,
  lastRefresh = null
}: MomentsViewProps) {
  const [sortBy, setSortBy] = useState<SortOption>('impact')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterFactors, setFilterFactors] = useState<Set<Factor>>(new Set())
  const [filterConfidence, setFilterConfidence] = useState<Set<ConfidenceLevel>>(new Set())
  const [filterSource, setFilterSource] = useState<Set<'company' | 'technology'>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const allFactors = getAllFactors()

  // Filter and sort moments
  const filteredAndSortedMoments = useMemo(() => {
    let filtered = moments

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(moment =>
        moment.title.toLowerCase().includes(query) ||
        moment.description.toLowerCase().includes(query) ||
        moment.classification.keywords.some(keyword => 
          keyword.toLowerCase().includes(query)
        ) ||
        moment.source.name.toLowerCase().includes(query)
      )
    }

    // Apply factor filter
    if (filterFactors.size > 0) {
      filtered = filtered.filter(moment => {
        const momentFactors = [
          ...moment.classification.microFactors,
          ...moment.classification.macroFactors
        ]
        return Array.from(filterFactors).some(factor => momentFactors.includes(factor))
      })
    }

    // Apply confidence filter
    if (filterConfidence.size > 0) {
      filtered = filtered.filter(moment => 
        filterConfidence.has(moment.classification.confidence)
      )
    }

    // Apply source filter
    if (filterSource.size > 0) {
      filtered = filtered.filter(moment => 
        filterSource.has(moment.source.type)
      )
    }

    // Sort moments
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'impact':
          comparison = a.impact.score - b.impact.score
          break
        case 'date':
          const dateA = a.timeline.estimatedDate || a.extractedAt
          const dateB = b.timeline.estimatedDate || b.extractedAt
          comparison = dateA.getTime() - dateB.getTime()
          break
        case 'confidence':
          const confidenceValues = { low: 1, medium: 2, high: 3 }
          comparison = confidenceValues[a.classification.confidence] - confidenceValues[b.classification.confidence]
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [moments, searchQuery, filterFactors, filterConfidence, filterSource, sortBy, sortDirection])

  // Statistics
  const stats = useMemo(() => {
    // Impact statistics should reflect the filtered moments, not all moments
    const highImpact = filteredAndSortedMoments.filter(m => m.impact.score >= 80).length
    const mediumImpact = filteredAndSortedMoments.filter(m => m.impact.score >= 60 && m.impact.score < 80).length
    const lowImpact = filteredAndSortedMoments.filter(m => m.impact.score < 60).length
    
    // Confidence statistics should also reflect filtered moments for consistency
    const byConfidence = {
      high: filteredAndSortedMoments.filter(m => m.classification.confidence === 'high').length,
      medium: filteredAndSortedMoments.filter(m => m.classification.confidence === 'medium').length,
      low: filteredAndSortedMoments.filter(m => m.classification.confidence === 'low').length
    }

    return {
      total: moments.length,
      filtered: filteredAndSortedMoments.length,
      highImpact,
      mediumImpact,
      lowImpact,
      byConfidence
    }
  }, [moments, filteredAndSortedMoments])

  const handleFactorToggle = (factor: Factor) => {
    const newFilters = new Set(filterFactors)
    if (newFilters.has(factor)) {
      newFilters.delete(factor)
    } else {
      newFilters.add(factor)
    }
    setFilterFactors(newFilters)
  }

  const handleConfidenceToggle = (confidence: ConfidenceLevel) => {
    const newFilters = new Set(filterConfidence)
    if (newFilters.has(confidence)) {
      newFilters.delete(confidence)
    } else {
      newFilters.add(confidence)
    }
    setFilterConfidence(newFilters)
  }

  const handleSourceToggle = (source: 'company' | 'technology') => {
    const newFilters = new Set(filterSource)
    if (newFilters.has(source)) {
      newFilters.delete(source)
    } else {
      newFilters.add(source)
    }
    setFilterSource(newFilters)
  }

  const clearFilters = () => {
    setFilterFactors(new Set())
    setFilterConfidence(new Set())
    setFilterSource(new Set())
    setSearchQuery('')
  }
  
  const handleKeywordClick = (keyword: string) => {
    // Add keyword to search query
    if (!searchQuery.includes(keyword)) {
      const newQuery = searchQuery ? `${searchQuery} ${keyword}` : keyword
      setSearchQuery(newQuery)
    }
  }

  if (error) {
    const isWarning = error.includes('warnings:')
    const iconColor = isWarning ? 'text-orange-500' : 'text-red-500'
    const titleColor = isWarning ? 'text-orange-600' : 'text-red-600'
    const title = isWarning ? 'Analysis Warnings' : 'Analysis Error'
    
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className={`w-12 h-12 ${iconColor}`} />
            </div>
            <CardTitle className={titleColor}>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap text-left bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
              {error}
            </pre>
            {onAnalyzeMoments && (
              <div className="text-center">
                <Button onClick={onAnalyzeMoments} variant="outline">
                  {isWarning ? 'Analyze Again' : 'Try Again'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {progress && (
          <ProgressIndicator progress={progress} />
        )}
        {!progress && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <div>
                <p className="text-lg font-medium">Analyzing Moments</p>
                <p className="text-muted-foreground">AI agents are processing your content...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (moments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <BarChart3 className="w-12 h-12 text-muted-foreground" />
            </div>
            <CardTitle>No Moments Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Run moment analysis to discover pivotal business intelligence insights.
            </p>
            <div className="flex flex-col gap-2">
              {onAnalyzeIncremental && (
                <Button onClick={onAnalyzeIncremental} className="w-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analyze Moments (Incremental)
                </Button>
              )}
              {onAnalyzeMoments && (
                <Button onClick={onAnalyzeMoments} variant="outline" className="w-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Full Analysis
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pivotal Moments</h2>
          <p className="text-muted-foreground">
            {stats.filtered} of {stats.total} moments
            {stats.filtered !== stats.total && ' (filtered)'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Statistics badges */}
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              {stats.highImpact} High Impact
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {stats.mediumImpact} Medium Impact
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {stats.lowImpact} Low Impact
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {onRefreshMoments && (
              <Button 
                onClick={onRefreshMoments} 
                variant="ghost" 
                size="sm"
                disabled={isRefreshing}
                className="text-muted-foreground hover:text-foreground"
                title="Reload moments from filesystem files"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Reloading...' : 'Reload from Files'}
              </Button>
            )}
            {onAnalyzeIncremental && (
              <Button 
                onClick={onAnalyzeIncremental} 
                variant="default"
                title="Analyze only new or changed content"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Smart Update
              </Button>
            )}
            {onForceFullAnalysis && (
              <Button 
                onClick={onForceFullAnalysis} 
                variant="outline" 
                size="sm"
                title="Re-analyze all content from scratch"
              >
                Analyze All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="flex gap-4">
        {/* Refresh Status */}
        {lastRefresh && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Last refreshed: {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Incremental Analysis Status */}
        {incrementalStats && (
          <Card className="bg-blue-50 border-blue-200 flex-1">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Incremental Analysis Active
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 space-x-4">
                    <span>Tracking: {incrementalStats.trackedContent} items</span>
                    <span>Window: {incrementalStats.temporalWindowDays} days</span>
                    {incrementalStats.lastUpdate && (
                      <span>
                        Last update: {incrementalStats.lastUpdate.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {onClearIncrementalCache && (
                  <Button 
                    onClick={onClearIncrementalCache} 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    Reset Cache
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search moments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={filterFactors.size > 0 || filterConfidence.size > 0 || filterSource.size > 0 ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {(filterFactors.size + filterConfidence.size + filterSource.size > 0) && (
              <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                {filterFactors.size + filterConfidence.size + filterSource.size}
              </Badge>
            )}
          </Button>

          <div className="flex items-center border border-border rounded-md">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-transparent border-none focus:outline-none"
            >
              <option value="impact">Impact</option>
              <option value="date">Date</option>
              <option value="confidence">Confidence</option>
              <option value="title">Title</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-2"
            >
              {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Factor Filters */}
            <div>
              <h4 className="font-medium mb-2">Factors</h4>
              <div className="flex flex-wrap gap-2">
                {allFactors.map((factor) => (
                  <Badge
                    key={factor}
                    variant={filterFactors.has(factor) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleFactorToggle(factor)}
                  >
                    {factor.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Confidence Filters */}
            <div>
              <h4 className="font-medium mb-2">Confidence</h4>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as ConfidenceLevel[]).map((confidence) => (
                  <Badge
                    key={confidence}
                    variant={filterConfidence.has(confidence) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleConfidenceToggle(confidence)}
                  >
                    {confidence} ({stats.byConfidence[confidence]})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Source Filters */}
            <div>
              <h4 className="font-medium mb-2">Source Type</h4>
              <div className="flex gap-2">
                {(['company', 'technology'] as const).map((source) => (
                  <Badge
                    key={source}
                    variant={filterSource.has(source) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleSourceToggle(source)}
                  >
                    {source} ({moments.filter(m => m.source.type === source).length})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedMoments.map((moment) => (
          <MomentCard
            key={moment.id}
            moment={moment}
            onSelect={onMomentSelect}
            onKeywordClick={handleKeywordClick}
            onEntityClick={onEntityClick}
          />
        ))}
      </div>

      {filteredAndSortedMoments.length === 0 && moments.length > 0 && (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No moments match your filters</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}

export default MomentsView