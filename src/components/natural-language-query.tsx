'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  naturalLanguageQueryProcessor, 
  conversationHistory, 
  QueryContextBuilder 
} from '@/lib/natural-language-query'
import type { NLQuery, QueryResults, QueryIntent } from '@/types/natural-language-query'
import { PivotalMoment } from '@/types/moments'
import { Company, Technology } from '@/types/catalog'
import { MomentCard } from '@/components/moment-card'
import { 
  MagnifyingGlassIcon,
  SparklesIcon,
  ClockIcon,
  ChartBarIcon,
  TableCellsIcon,
  ShareIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'

interface NaturalLanguageQueryProps {
  moments: PivotalMoment[]
  companies: Company[]
  technologies: Technology[]
  activeTab?: string
  isLoading?: boolean
  onMomentSelect?: (moment: PivotalMoment) => void
  onEntityClick?: (entity: string, type: 'company' | 'technology') => void
}

export function NaturalLanguageQuery({
  moments,
  companies,
  technologies,
  activeTab = 'moments',
  isLoading = false,
  onMomentSelect,
  onEntityClick
}: NaturalLanguageQueryProps) {
  const [query, setQuery] = useState('')
  const [queries, setQueries] = useState<NLQuery[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Initialize data and update processor
  useEffect(() => {
    naturalLanguageQueryProcessor.updateData(moments, companies, technologies)
    setSuggestions(conversationHistory.getQuerySuggestions())
  }, [moments, companies, technologies])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Scroll to results when new query is processed
  useEffect(() => {
    if (queries.length > 0 && !queries[0].isLoading) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [queries])

  const handleSubmitQuery = async (queryText: string = query) => {
    if (!queryText.trim() || isProcessing) return

    setIsProcessing(true)
    setQuery('')

    try {
      // Build context
      const context = QueryContextBuilder.build(
        activeTab,
        moments,
        companies,
        technologies,
        undefined,
        undefined,
        conversationHistory
      )

      // Process query
      const nlQuery = await naturalLanguageQueryProcessor.processQuery(queryText, context)
      
      // Add to history and state
      conversationHistory.addQuery(nlQuery)
      setQueries(prev => [nlQuery, ...prev])
      setSelectedQueryId(nlQuery.id)
      
      // Update suggestions
      setSuggestions(conversationHistory.getQuerySuggestions())

    } catch (error) {
      console.error('Query processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSubmitQuery(suggestion)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitQuery()
    }
  }

  const clearHistory = () => {
    conversationHistory.clearHistory()
    setQueries([])
    setSelectedQueryId(null)
    setSuggestions(conversationHistory.getQuerySuggestions())
  }

  const retryQuery = (failedQuery: NLQuery) => {
    handleSubmitQuery(failedQuery.query)
  }

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-primary" />
            Ask Moments AI
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask questions about your moments in natural language. Try asking about trends, comparisons, or specific events.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Show me all moments related to AI regulation in Q4"
                className="pl-10"
                disabled={isProcessing || isLoading}
              />
            </div>
            <Button 
              onClick={() => handleSubmitQuery()}
              disabled={!query.trim() || isProcessing || isLoading}
              className="px-6"
            >
              {isProcessing ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                'Ask'
              )}
            </Button>
          </div>

          {/* Query Suggestions */}
          {suggestions.length > 0 && queries.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <LightBulbIcon className="w-3 h-3" />
                Try these suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 6).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs h-7"
                    disabled={isProcessing || isLoading}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* History Actions */}
          {queries.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {queries.length} {queries.length === 1 ? 'query' : 'queries'} in history
              </p>
              <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs h-7">
                Clear History
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Results */}
      <div ref={resultsRef} className="space-y-4">
        {queries.map((nlQuery) => (
          <QueryResultCard
            key={nlQuery.id}
            query={nlQuery}
            isSelected={selectedQueryId === nlQuery.id}
            onSelect={() => setSelectedQueryId(nlQuery.id)}
            onRetry={() => retryQuery(nlQuery)}
            onMomentSelect={onMomentSelect}
            onEntityClick={onEntityClick}
          />
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span>Loading data...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface QueryResultCardProps {
  query: NLQuery
  isSelected: boolean
  onSelect: () => void
  onRetry: () => void
  onMomentSelect?: (moment: PivotalMoment) => void
  onEntityClick?: (entity: string, type: 'company' | 'technology') => void
}

function QueryResultCard({
  query,
  isSelected,
  onSelect,
  onRetry,
  onMomentSelect,
  onEntityClick
}: QueryResultCardProps) {
  const [showFullResults, setShowFullResults] = useState(false)

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{query.query}</h3>
              {query.parsedIntent && (
                <Badge variant="secondary" className="text-xs">
                  {query.parsedIntent.type}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ClockIcon className="w-3 h-3" />
              {query.timestamp.toLocaleTimeString()}
              {query.results && (
                <>
                  <span>•</span>
                  <span>{query.results.processingTime}ms</span>
                </>
              )}
              {query.parsedIntent && (
                <>
                  <span>•</span>
                  <span>{query.parsedIntent.confidence}% confidence</span>
                </>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onSelect}>
            {isSelected ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Loading State */}
        {query.isLoading && (
          <div className="flex items-center justify-center py-8 space-x-2 text-muted-foreground">
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            <span>Processing query...</span>
          </div>
        )}

        {/* Error State */}
        {query.error && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <ExclamationCircleIcon className="w-4 h-4" />
              <span className="text-sm">Error: {query.error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        )}

        {/* Results */}
        {query.results && !query.isLoading && !query.error && (
          <QueryResults
            results={query.results}
            intent={query.parsedIntent}
            isExpanded={isSelected}
            showFullResults={showFullResults}
            onShowFullResults={() => setShowFullResults(!showFullResults)}
            onMomentSelect={onMomentSelect}
            onEntityClick={onEntityClick}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface QueryResultsProps {
  results: QueryResults
  intent?: QueryIntent
  isExpanded: boolean
  showFullResults: boolean
  onShowFullResults: () => void
  onMomentSelect?: (moment: PivotalMoment) => void
  onEntityClick?: (entity: string, type: 'company' | 'technology') => void
}

function QueryResults({
  results,
  intent,
  isExpanded,
  showFullResults,
  onShowFullResults,
  onMomentSelect,
  onEntityClick
}: QueryResultsProps) {
  // Always show explanation
  const explanationSection = (
    <div className="space-y-2">
      <p className="text-sm text-foreground">{results.explanation}</p>
      
      {/* Metrics Summary */}
      {results.data.metrics && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(results.data.metrics).map(([key, value]) => (
            <Badge key={key} variant="outline" className="text-xs">
              {key}: {typeof value === 'number' ? value.toLocaleString() : value}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )

  if (!isExpanded) {
    return explanationSection
  }

  return (
    <div className="space-y-4">
      {explanationSection}

      {/* Insights */}
      {results.data.insights && results.data.insights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" />
            Key Insights
          </h4>
          <ul className="space-y-1">
            {results.data.insights.slice(0, showFullResults ? undefined : 3).map((insight, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                {insight}
              </li>
            ))}
          </ul>
          {results.data.insights.length > 3 && (
            <Button variant="ghost" size="sm" onClick={onShowFullResults} className="text-xs h-6">
              {showFullResults ? 'Show Less' : `Show ${results.data.insights.length - 3} More`}
            </Button>
          )}
        </div>
      )}

      {/* Visualization */}
      {results.visualization && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4" />
            Visualization
          </h4>
          <div className="h-64 w-full">
            <QueryVisualization
              visualization={results.visualization}
              intent={intent}
            />
          </div>
        </div>
      )}

      {/* Moments Results */}
      {results.data.moments && results.data.moments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TableCellsIcon className="w-4 h-4" />
              Moments ({results.data.moments.length})
            </h4>
            {results.data.moments.length > 3 && (
              <Button variant="ghost" size="sm" onClick={onShowFullResults} className="text-xs h-6">
                {showFullResults ? 'Show Less' : 'Show All'}
              </Button>
            )}
          </div>
          <div className="grid gap-3">
            {results.data.moments
              .slice(0, showFullResults ? undefined : 3)
              .map((moment) => (
                <MomentCard
                  key={moment.id}
                  moment={moment}
                  onSelect={() => onMomentSelect?.(moment)}
                  onEntityClick={onEntityClick}
                />
              ))}
          </div>
        </div>
      )}

      {/* Correlations */}
      {results.data.correlations && results.data.correlations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <ShareIcon className="w-4 h-4" />
            Correlations
          </h4>
          <div className="space-y-1">
            {results.data.correlations.slice(0, 5).map((correlation, index) => (
              <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-primary">•</span>
                <span className="font-medium">{correlation.entity1}</span>
                <span>↔</span>
                <span className="font-medium">{correlation.entity2}</span>
                <Badge variant="outline" className="text-xs">
                  {Math.round(correlation.strength * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface QueryVisualizationProps {
  visualization: NonNullable<QueryResults['visualization']>
  intent?: QueryIntent
}

function QueryVisualization({ visualization, intent }: QueryVisualizationProps) {
  switch (visualization.type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visualization.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="entity" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      )

    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visualization.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )

    case 'timeline':
      return (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {visualization.data.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-3 p-2 border rounded">
              <div className="text-xs text-muted-foreground">
                {new Date(item.date).toLocaleDateString()}
              </div>
              <div className="flex-1 text-sm">{item.title}</div>
              <Badge variant="outline" className="text-xs">
                Impact: {item.impact}
              </Badge>
            </div>
          ))}
        </div>
      )

    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Visualization not available</p>
        </div>
      )
  }
}