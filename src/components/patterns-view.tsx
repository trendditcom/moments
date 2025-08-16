'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  SparklesIcon,
  BeakerIcon,
  ArrowDownTrayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { PatternDiscoveryPanel } from '@/components/pattern-discovery-panel'
import { CorrelationDiscoveryInterface } from '@/components/correlation-discovery-interface'
import { useMomentsStore } from '@/store/moments-store'
import { useCatalogStore } from '@/store/catalog-store'
import { Company, Technology } from '@/types/catalog'
import { PivotalMoment } from '@/types/moments'

interface PatternsViewProps {
  companies: Company[]
  technologies: Technology[]
  moments: PivotalMoment[]
  isLoading?: boolean
}



// Main Patterns View Component
export function PatternsView({ companies, technologies, moments, isLoading = false }: PatternsViewProps) {
  const [analysisMode, setAnalysisMode] = useState<'patterns' | 'correlations' | 'both'>('both')
  const [containerHeight, setContainerHeight] = useState(600)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSwitchingMode, setIsSwitchingMode] = useState(false)

  // Calculate container height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      const vh = window.innerHeight
      const headerHeight = 60 // Approximate header height
      const padding = 40 // Some padding
      setContainerHeight(vh - headerHeight - padding)
    }
    
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Handle initial loading - show for brief moment then hide
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 800) // Brief delay to show loading state

    return () => clearTimeout(timer)
  }, [])

  // Handle analysis mode change with simple loading
  const handleAnalysisModeChange = (newMode: 'patterns' | 'correlations' | 'both') => {
    if (newMode !== analysisMode) {
      setIsSwitchingMode(true)
      
      // Brief loading state for mode switching
      setTimeout(() => {
        setAnalysisMode(newMode)
        setTimeout(() => {
          setIsSwitchingMode(false)
        }, 400) // Short delay for smooth transition
      }, 100)
    }
  }

  return (
    <div className="h-full overflow-hidden w-full">
      {/* Main Patterns Area */}
      <div className="flex flex-col h-full min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card shrink-0">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">Pattern Discovery & Correlation Analysis</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered pattern recognition and statistical correlation analysis for business intelligence
              </p>
            </div>
            
            <div className="flex items-center space-x-2 shrink-0">
              <Button
                variant={analysisMode === 'patterns' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAnalysisModeChange('patterns')}
                className="text-xs"
                disabled={isSwitchingMode}
              >
                {isSwitchingMode ? (
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <SparklesIcon className="w-3 h-3 mr-1" />
                )}
                Patterns
              </Button>
              <Button
                variant={analysisMode === 'correlations' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAnalysisModeChange('correlations')}
                className="text-xs"
                disabled={isSwitchingMode}
              >
                {isSwitchingMode ? (
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <BeakerIcon className="w-3 h-3 mr-1" />
                )}
                Correlations
              </Button>
              <Button
                variant={analysisMode === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAnalysisModeChange('both')}
                className="text-xs"
                disabled={isSwitchingMode}
              >
                {isSwitchingMode ? (
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <ChartBarIcon className="w-3 h-3 mr-1" />
                )}
                Both
              </Button>
              
              {/* Additional spacing and Export button */}
              <div className="w-4"></div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Export functionality - would integrate with correlation interface
                  console.log('Export patterns data...')
                }}
                className="text-xs"
                disabled={moments.length === 0}
              >
                <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
          
          
          {/* Statistics Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {moments.length} Moments
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {moments.filter(m => m.impact.score > 70).length} High Impact
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {moments.filter(m => 
                (m.entities?.companies?.length || 0) + 
                (m.entities?.technologies?.length || 0) > 0
              ).length} With Entities
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {companies.length + technologies.length} Catalog Items
            </Badge>
          </div>
        </div>
        
        {/* Patterns Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 min-h-0 w-full max-w-full">
          {isInitializing ? (
            /* Initial Loading Skeleton */
            <div className="space-y-6 w-full max-w-full overflow-hidden">
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <div className="h-6 bg-gray-200 rounded w-64 animate-pulse mb-4"></div>
                <div className="grid grid-cols-8 gap-2">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : isSwitchingMode ? (
            /* Mode Switching Spinner */
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm text-muted-foreground">Switching analysis mode...</div>
              </div>
            </div>
          ) : (
            /* Actual Content */
            <div className="space-y-6 w-full max-w-full overflow-hidden">
              {/* Pattern Discovery Panel */}
              {(analysisMode === 'patterns' || analysisMode === 'both') && (
                <div className="w-full overflow-hidden">
                  <PatternDiscoveryPanel moments={moments} className="w-full overflow-hidden" />
                </div>
              )}
              
              {/* Correlation Discovery Interface */}
              {(analysisMode === 'correlations' || analysisMode === 'both') && (
                <div className="w-full overflow-hidden">
                  <CorrelationDiscoveryInterface />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}