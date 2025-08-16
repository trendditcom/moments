'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  ChartBarIcon,
  ClockIcon,
  BeakerIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { useMomentsStore } from '@/store/moments-store'
import { useCatalogStore } from '@/store/catalog-store'
import { 
  correlationAnalysisEngine,
  EntityCorrelation,
  EntityCluster,
  TemporalWindow
} from '@/lib/correlation-analysis'
import { PivotalMoment } from '@/types/moments'

// Color scales for diverging heatmap
const DIVERGING_COLOR_SCALE = {
  NEGATIVE_STRONG: '#b91c1c',     // Red-600 for strong negative correlation
  NEGATIVE_MEDIUM: '#dc2626',     // Red-500 for medium negative correlation  
  NEGATIVE_WEAK: '#f87171',       // Red-400 for weak negative correlation
  NEUTRAL: '#f3f4f6',             // Gray-100 for neutral/no correlation
  POSITIVE_WEAK: '#60a5fa',       // Blue-400 for weak positive correlation
  POSITIVE_MEDIUM: '#3b82f6',     // Blue-500 for medium positive correlation
  POSITIVE_STRONG: '#1d4ed8'      // Blue-600 for strong positive correlation
} as const

// Significance annotation colors
const SIGNIFICANCE_COLORS = {
  VERY_HIGH: '#10b981', // Green-500 for p < 0.05
  HIGH: '#f59e0b',      // Amber-500 for p < 0.10
  MEDIUM: '#f97316',    // Orange-500 for p < 0.20
  LOW: '#6b7280'        // Gray-500 for p < 0.30
} as const

interface CorrelationHeatmapProps {
  correlations: EntityCorrelation[]
  selectedCorrelations: Set<string>
  onCorrelationSelect: (correlationId: string) => void
  onCellClick: (entity1: string, entity2: string) => void
  strengthThreshold: number
  significanceFilter: string[]
  maxEntities: number
}

interface CorrelationFilters {
  strengthThreshold: number
  significanceFilter: string[]
  entityTypeFilter: string[]
  temporalStabilityThreshold: number
  showClusters: boolean
  maxEntities: number
}

// Correlation strength heatmap component
function CorrelationHeatmap({
  correlations,
  selectedCorrelations,
  onCorrelationSelect,
  onCellClick,
  strengthThreshold,
  significanceFilter,
  maxEntities
}: CorrelationHeatmapProps) {
  // Get unique entities and build matrix
  const { entities, matrix, entityTypes } = useMemo(() => {
    const entitySet = new Set<string>()
    
    // Filter correlations by strength and significance
    const filteredCorrelations = correlations.filter(corr => 
      Math.abs(corr.correlationCoefficient) >= strengthThreshold &&
      significanceFilter.includes(corr.significance)
    )

    filteredCorrelations.forEach(corr => {
      entitySet.add(corr.entity1)
      entitySet.add(corr.entity2)
    })

    const entityArray = Array.from(entitySet).slice(0, maxEntities)
    const size = entityArray.length
    const correlationMatrix: (EntityCorrelation | null)[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null))
    
    const entityTypeMap: Record<string, string> = {}

    // Fill matrix with correlations
    filteredCorrelations.forEach(corr => {
      const idx1 = entityArray.indexOf(corr.entity1)
      const idx2 = entityArray.indexOf(corr.entity2)
      
      if (idx1 !== -1 && idx2 !== -1) {
        correlationMatrix[idx1][idx2] = corr
        correlationMatrix[idx2][idx1] = corr
        entityTypeMap[corr.entity1] = corr.entity1Type
        entityTypeMap[corr.entity2] = corr.entity2Type
      }
    })

    return {
      entities: entityArray,
      matrix: correlationMatrix,
      entityTypes: entityTypeMap
    }
  }, [correlations, strengthThreshold, significanceFilter, maxEntities])

  // Get cell color based on correlation coefficient (diverging scale)
  const getCellColor = useCallback((correlation: EntityCorrelation | null): string => {
    if (!correlation) return DIVERGING_COLOR_SCALE.NEUTRAL

    const coeff = correlation.correlationCoefficient
    const absCoeff = Math.abs(coeff)

    if (coeff > 0) {
      // Positive correlations (blue scale)
      if (absCoeff >= 0.7) return DIVERGING_COLOR_SCALE.POSITIVE_STRONG
      if (absCoeff >= 0.4) return DIVERGING_COLOR_SCALE.POSITIVE_MEDIUM
      return DIVERGING_COLOR_SCALE.POSITIVE_WEAK
    } else {
      // Negative correlations (red scale)
      if (absCoeff >= 0.7) return DIVERGING_COLOR_SCALE.NEGATIVE_STRONG
      if (absCoeff >= 0.4) return DIVERGING_COLOR_SCALE.NEGATIVE_MEDIUM
      return DIVERGING_COLOR_SCALE.NEGATIVE_WEAK
    }
  }, [])

  // Get significance annotation style
  const getSignificanceStyle = useCallback((correlation: EntityCorrelation | null) => {
    if (!correlation) return {}
    
    return {
      borderColor: SIGNIFICANCE_COLORS[correlation.significance],
      borderWidth: correlation.significance === 'VERY_HIGH' ? 3 : correlation.significance === 'HIGH' ? 2 : 1
    }
  }, [])

  // Get entity type color
  const getEntityTypeColor = useCallback((entityType: string) => {
    switch (entityType) {
      case 'company': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'technology': return 'bg-green-100 text-green-800 border-green-300'
      case 'concept': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'person': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'location': return 'bg-pink-100 text-pink-800 border-pink-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }, [])

  if (entities.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <BeakerIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No correlations found with current filter criteria.</p>
        <p className="text-sm mt-2">Try adjusting the strength threshold or significance filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Color scale legend */}
      <div className="flex items-center justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <span>Strong Negative</span>
          <div className="w-4 h-4 rounded" style={{ backgroundColor: DIVERGING_COLOR_SCALE.NEGATIVE_STRONG }}></div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: DIVERGING_COLOR_SCALE.NEGATIVE_MEDIUM }}></div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: DIVERGING_COLOR_SCALE.NEGATIVE_WEAK }}></div>
        </div>
        <div className="flex items-center space-x-1">
          <span>Neutral</span>
          <div className="w-4 h-4 rounded border" style={{ backgroundColor: DIVERGING_COLOR_SCALE.NEUTRAL }}></div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: DIVERGING_COLOR_SCALE.POSITIVE_WEAK }}></div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: DIVERGING_COLOR_SCALE.POSITIVE_MEDIUM }}></div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: DIVERGING_COLOR_SCALE.POSITIVE_STRONG }}></div>
          <span>Strong Positive</span>
        </div>
      </div>

      {/* Heatmap matrix */}
      <div className="overflow-x-auto overflow-y-auto max-h-96 w-full border rounded-lg">
        <div className="min-w-max">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                <th className="p-2 border text-left w-32 bg-muted sticky left-0 z-10">Entity</th>
                {entities.map((entity, colIndex) => (
                  <th key={colIndex} className="p-1 border text-center w-16 bg-muted">
                    <div className="transform -rotate-45 origin-center">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getEntityTypeColor(entityTypes[entity])}`}
                      >
                        {entity.length > 8 ? entity.substring(0, 6) + '..' : entity}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entities.map((rowEntity, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="p-2 border bg-muted sticky left-0 z-10 w-32">
                    <Badge 
                      variant="outline"
                      className={`${getEntityTypeColor(entityTypes[rowEntity])} truncate block`}
                      title={rowEntity}
                    >
                      {rowEntity.length > 12 ? rowEntity.substring(0, 10) + '..' : rowEntity}
                    </Badge>
                  </td>
                {entities.map((colEntity, colIndex) => {
                  const correlation = matrix[rowIndex][colIndex]
                  const correlationId = correlation ? `${correlation.entity1}-${correlation.entity2}` : ''
                  const isSelected = selectedCorrelations.has(correlationId)
                  
                  return (
                    <td 
                      key={colIndex}
                      className={`
                        p-1 border text-center cursor-pointer relative transition-all w-16
                        ${isSelected ? 'ring-2 ring-blue-500' : 'hover:opacity-80'}
                        ${rowIndex === colIndex ? 'bg-gray-200' : ''}
                      `}
                      style={{
                        backgroundColor: rowIndex === colIndex ? '#e5e7eb' : getCellColor(correlation),
                        ...getSignificanceStyle(correlation)
                      }}
                      onClick={() => {
                        if (correlation) {
                          onCorrelationSelect(correlationId)
                          onCellClick(rowEntity, colEntity)
                        }
                      }}
                      title={correlation ? 
                        `${rowEntity} ↔ ${colEntity}\nCorrelation: ${correlation.correlationCoefficient.toFixed(3)}\nSignificance: ${correlation.significance}\nStability: ${(correlation.temporalStability * 100).toFixed(1)}%` 
                        : 'No correlation'
                      }
                    >
                      {rowIndex === colIndex ? (
                        <span className="text-gray-500">—</span>
                      ) : correlation ? (
                        <div className="flex flex-col items-center">
                          <span className="font-mono text-xs">
                            {correlation.correlationCoefficient.toFixed(2)}
                          </span>
                          {correlation.significance === 'VERY_HIGH' && (
                            <div className="w-1 h-1 rounded-full bg-green-500 mt-0.5"></div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Significance legend */}
      <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded border-2" style={{ borderColor: SIGNIFICANCE_COLORS.VERY_HIGH }}></div>
          <span>p &lt; 0.05</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded border-2" style={{ borderColor: SIGNIFICANCE_COLORS.HIGH }}></div>
          <span>p &lt; 0.10</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded border" style={{ borderColor: SIGNIFICANCE_COLORS.MEDIUM }}></div>
          <span>p &lt; 0.20</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded border" style={{ borderColor: SIGNIFICANCE_COLORS.LOW }}></div>
          <span>p &lt; 0.30</span>
        </div>
      </div>
    </div>
  )
}

// Main correlation discovery interface component
export function CorrelationDiscoveryInterface() {
  const { moments } = useMomentsStore()
  const { companies, technologies } = useCatalogStore()
  
  // State management
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [correlations, setCorrelations] = useState<EntityCorrelation[]>([])
  const [clusters, setClusters] = useState<EntityCluster[]>([])
  const [selectedCorrelations, setSelectedCorrelations] = useState<Set<string>>(new Set())
  const [selectedEntity1, setSelectedEntity1] = useState<string>('')
  const [selectedEntity2, setSelectedEntity2] = useState<string>('')
  const [analysisReport, setAnalysisReport] = useState<any>(null)
  
  // Filter state
  const [filters, setFilters] = useState<CorrelationFilters>({
    strengthThreshold: 0.3,
    significanceFilter: ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW'],
    entityTypeFilter: ['company', 'technology', 'concept', 'person', 'location'],
    temporalStabilityThreshold: 0.5,
    showClusters: true,
    maxEntities: 15
  })

  // Filter correlations based on current filters
  const filteredCorrelations = useMemo(() => {
    return correlations.filter(corr => 
      Math.abs(corr.correlationCoefficient) >= filters.strengthThreshold &&
      filters.significanceFilter.includes(corr.significance) &&
      filters.entityTypeFilter.includes(corr.entity1Type) &&
      filters.entityTypeFilter.includes(corr.entity2Type) &&
      corr.temporalStability >= filters.temporalStabilityThreshold
    )
  }, [correlations, filters])

  // Get current selected correlation details
  const selectedCorrelationDetails = useMemo(() => {
    if (selectedEntity1 && selectedEntity2) {
      return correlations.find(corr => 
        (corr.entity1 === selectedEntity1 && corr.entity2 === selectedEntity2) ||
        (corr.entity1 === selectedEntity2 && corr.entity2 === selectedEntity1)
      )
    }
    return null
  }, [correlations, selectedEntity1, selectedEntity2])

  // Analyze correlations
  const analyzeCorrelations = useCallback(async () => {
    if (moments.length === 0) return

    setIsAnalyzing(true)
    try {
      // Extract unique entities from moments
      const entities = new Set<string>()
      
      moments.forEach(moment => {
        // Add all entities from moments
        moment.entities?.companies?.forEach(entity => entities.add(entity))
        moment.entities?.technologies?.forEach(entity => entities.add(entity))
        moment.entities?.people?.forEach(entity => entities.add(entity))
        moment.entities?.locations?.forEach(entity => entities.add(entity))
        moment.classification?.keywords?.forEach(keyword => entities.add(keyword))
        
        // Add source entities
        entities.add(moment.source.name)
      })

      // Calculate correlations for all entity pairs
      const entityArray = Array.from(entities).slice(0, 50) // Limit for performance
      const newCorrelations: EntityCorrelation[] = []

      console.log(`[CorrelationDiscovery] Analyzing ${entityArray.length} entities for correlations...`)

      for (let i = 0; i < entityArray.length; i++) {
        for (let j = i + 1; j < entityArray.length; j++) {
          const correlation = correlationAnalysisEngine.calculateEntityCorrelation(
            entityArray[i],
            entityArray[j],
            moments,
            30 // 30-day temporal windows
          )

          // Only include correlations with some significance
          if (Math.abs(correlation.correlationCoefficient) > 0.1 || 
              correlation.cooccurrenceCount > 1) {
            newCorrelations.push(correlation)
          }
        }
      }

      console.log(`[CorrelationDiscovery] Found ${newCorrelations.length} correlations`)

      // Perform hierarchical clustering
      const newClusters = correlationAnalysisEngine.performHierarchicalClustering(
        newCorrelations,
        3, // Min cluster size
        8  // Max clusters
      )

      console.log(`[CorrelationDiscovery] Identified ${newClusters.length} entity clusters`)

      // Generate analysis report
      const report = correlationAnalysisEngine.generateCorrelationReport(
        newCorrelations,
        newClusters
      )

      setCorrelations(newCorrelations)
      setClusters(newClusters)
      setAnalysisReport(report)

    } catch (error) {
      console.error('[CorrelationDiscovery] Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [moments])

  // Handle correlation selection
  const handleCorrelationSelect = useCallback((correlationId: string) => {
    const newSelection = new Set(selectedCorrelations)
    if (newSelection.has(correlationId)) {
      newSelection.delete(correlationId)
    } else {
      newSelection.add(correlationId)
    }
    setSelectedCorrelations(newSelection)
  }, [selectedCorrelations])

  // Handle cell click for detailed analysis
  const handleCellClick = useCallback((entity1: string, entity2: string) => {
    setSelectedEntity1(entity1)
    setSelectedEntity2(entity2)
  }, [])

  // Export functionality
  const handleExport = useCallback(async () => {
    const exportData = {
      correlations: filteredCorrelations,
      clusters: clusters,
      analysisReport: analysisReport,
      filters: filters,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `correlation-analysis-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredCorrelations, clusters, analysisReport, filters])

  // Run initial analysis when moments change
  useEffect(() => {
    if (moments.length > 0 && correlations.length === 0) {
      analyzeCorrelations()
    }
  }, [moments.length, correlations.length, analyzeCorrelations])

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold flex items-center">
              <BeakerIcon className="w-5 h-5 mr-2" />
              Correlation Discovery Interface
            </CardTitle>
            <CardDescription>
              Advanced correlation analysis with statistical significance testing and temporal stability metrics
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            <Badge variant="secondary">
              <ChartBarIcon className="w-3 h-3 mr-1" />
              {filteredCorrelations.length} Correlations
            </Badge>
            {clusters.length > 0 && (
              <Badge variant="secondary">
                {clusters.length} Clusters
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeCorrelations}
              disabled={isAnalyzing || moments.length === 0}
            >
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredCorrelations.length === 0}
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 max-w-full overflow-hidden">
        {/* Filter Controls */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Analysis Filters</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Strength threshold */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Correlation Strength ≥</label>
              <select
                value={filters.strengthThreshold}
                onChange={(e) => setFilters(prev => ({ ...prev, strengthThreshold: parseFloat(e.target.value) }))}
                className="w-full text-xs border rounded px-2 py-1"
              >
                <option value={0.1}>0.1 (Very Weak)</option>
                <option value={0.2}>0.2 (Weak)</option>
                <option value={0.3}>0.3 (Moderate)</option>
                <option value={0.4}>0.4 (Moderate-Strong)</option>
                <option value={0.6}>0.6 (Strong)</option>
                <option value={0.8}>0.8 (Very Strong)</option>
              </select>
            </div>

            {/* Significance filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Statistical Significance</label>
              <select
                value={filters.significanceFilter.join(',')}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  significanceFilter: e.target.value.split(',').filter(Boolean)
                }))}
                className="w-full text-xs border rounded px-2 py-1"
              >
                <option value="VERY_HIGH">Very High (p &lt; 0.05)</option>
                <option value="VERY_HIGH,HIGH">High+ (p &lt; 0.10)</option>
                <option value="VERY_HIGH,HIGH,MEDIUM">Medium+ (p &lt; 0.20)</option>
                <option value="VERY_HIGH,HIGH,MEDIUM,LOW">All Levels</option>
              </select>
            </div>

            {/* Temporal stability */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Temporal Stability ≥</label>
              <select
                value={filters.temporalStabilityThreshold}
                onChange={(e) => setFilters(prev => ({ ...prev, temporalStabilityThreshold: parseFloat(e.target.value) }))}
                className="w-full text-xs border rounded px-2 py-1"
              >
                <option value={0.0}>0% (Any)</option>
                <option value={0.3}>30% (Somewhat Stable)</option>
                <option value={0.5}>50% (Moderately Stable)</option>
                <option value={0.7}>70% (Highly Stable)</option>
                <option value={0.9}>90% (Very Stable)</option>
              </select>
            </div>

            {/* Max entities */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Max Entities</label>
              <select
                value={filters.maxEntities}
                onChange={(e) => setFilters(prev => ({ ...prev, maxEntities: parseInt(e.target.value) }))}
                className="w-full text-xs border rounded px-2 py-1"
              >
                <option value={10}>10 entities</option>
                <option value={15}>15 entities</option>
                <option value={20}>20 entities</option>
                <option value={25}>25 entities</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isAnalyzing && (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Analyzing entity correlations...</p>
          </div>
        )}

        {/* Correlation heatmap */}
        {!isAnalyzing && filteredCorrelations.length > 0 && (
          <div className="space-y-4 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Correlation Strength Heatmap</h3>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{selectedCorrelations.size} selected</span>
                {selectedCorrelations.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCorrelations(new Set())}
                    className="text-xs h-6"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="w-full max-w-full overflow-hidden">
              <CorrelationHeatmap
                correlations={filteredCorrelations}
                selectedCorrelations={selectedCorrelations}
                onCorrelationSelect={handleCorrelationSelect}
                onCellClick={handleCellClick}
                strengthThreshold={filters.strengthThreshold}
                significanceFilter={filters.significanceFilter}
                maxEntities={filters.maxEntities}
              />
            </div>
          </div>
        )}

        {/* Selected correlation details */}
        {selectedCorrelationDetails && (
          <div className="p-4 bg-blue-50 rounded-lg w-full max-w-full overflow-hidden">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 space-y-3 min-w-0 flex-1">
                <div className="font-medium break-words">
                  Detailed Correlation Analysis: {selectedEntity1} ↔ {selectedEntity2}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="text-blue-600 font-medium">Correlation</div>
                    <div className="font-mono text-lg">
                      {selectedCorrelationDetails.correlationCoefficient.toFixed(3)}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {selectedCorrelationDetails.strength}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="text-blue-600 font-medium">Significance</div>
                    <div>p = {selectedCorrelationDetails.pValue.toFixed(4)}</div>
                    <Badge 
                      variant="outline" 
                      className="text-xs mt-1"
                      style={{ 
                        borderColor: SIGNIFICANCE_COLORS[selectedCorrelationDetails.significance],
                        color: SIGNIFICANCE_COLORS[selectedCorrelationDetails.significance]
                      }}
                    >
                      {selectedCorrelationDetails.significance}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="text-blue-600 font-medium">Temporal Stability</div>
                    <div>{(selectedCorrelationDetails.temporalStability * 100).toFixed(1)}%</div>
                    <div className="text-xs text-blue-700 mt-1">
                      {selectedCorrelationDetails.timeStabilityWindows.length} time windows
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-blue-600 font-medium">Co-occurrence</div>
                    <div>{selectedCorrelationDetails.cooccurrenceCount} moments</div>
                    <div className="text-xs text-blue-700 mt-1">
                      {selectedCorrelationDetails.sharedFactors.length} shared factors
                    </div>
                  </div>
                </div>

                {selectedCorrelationDetails.sharedFactors.length > 0 && (
                  <div className="w-full max-w-full overflow-hidden">
                    <div className="text-blue-600 font-medium mb-2">Shared Factors</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedCorrelationDetails.sharedFactors.map(factor => (
                        <Badge key={factor} variant="secondary" className="text-xs">
                          {factor.length > 15 ? factor.substring(0, 13) + '...' : factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analysis summary */}
        {analysisReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full max-w-full overflow-hidden">
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Analysis Summary</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Total Correlations: {analysisReport.summary.totalCorrelations}</div>
                <div>Significant: {analysisReport.summary.significantCorrelations}</div>
                <div>Avg Strength: {analysisReport.summary.averageStrength.toFixed(3)}</div>
                <div>Temporal Stability: {(analysisReport.summary.temporalStability * 100).toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Top Correlations</div>
              <div className="space-y-1 text-xs">
                {analysisReport.topCorrelations.slice(0, 3).map((corr: EntityCorrelation, idx: number) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="truncate min-w-0 flex-1">
                      {corr.entity1} ↔ {corr.entity2}
                    </span>
                    <span className="font-mono shrink-0">{corr.correlationCoefficient.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Insights</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {analysisReport.insights.slice(0, 2).map((insight: string, idx: number) => (
                  <div key={idx} className="break-words">{insight}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isAnalyzing && moments.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <BeakerIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No moments available for correlation analysis.</p>
            <p className="text-sm mt-2">Generate some moments first to discover correlations.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}