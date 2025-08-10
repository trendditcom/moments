'use client'

import { useState, useEffect } from 'react'
import { FolderSelection } from '@/components/folder-selection'
import { CatalogView } from '@/components/catalog-view'
import { MomentsView } from '@/components/moments-view'
import { useCatalogStore } from '@/store/catalog-store'
import { useMomentsStore } from '@/store/moments-store'
import { analyzeMomentsFromCatalog } from '@/store/moments-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const { companies, technologies } = useCatalogStore()
  const { 
    moments, 
    isAnalyzing, 
    analysisError, 
    progress,
    addMoments, 
    setAnalyzing, 
    setAnalysisError,
    clearMoments,
    getMomentStats,
    // Progress tracking actions
    updateProgress,
    addStep,
    updateStep,
    addAgent,
    updateAgent,
    setCurrentPrompt,
    resetProgress
  } = useMomentsStore()
  
  const [activeTab, setActiveTab] = useState<'companies' | 'technologies' | 'moments'>('companies')

  const hasData = companies.length > 0 || technologies.length > 0
  const momentStats = getMomentStats()

  // Handle moment analysis
  const handleAnalyzeMoments = async () => {
    if (!hasData) {
      setAnalysisError('Please load catalog data first')
      return
    }

    try {
      setAnalyzing(true)
      setAnalysisError(null)
      resetProgress()
      
      // Initialize progress
      updateProgress({
        isActive: true,
        progressPercentage: 0,
        stats: {
          totalItems: companies.length + technologies.length,
          processedItems: 0,
          momentsExtracted: 0,
          errorsEncountered: 0
        }
      })
      
      const result = await analyzeMomentsFromCatalog(
        companies, 
        technologies, 
        'all',
        {
          onProgress: (step) => {
            addStep(step)
            // Calculate overall progress based on step progress
            const overallProgress = step.progress || 0
            updateProgress({
              progressPercentage: overallProgress,
              stats: {
                totalItems: companies.length + technologies.length,
                processedItems: Math.round((overallProgress / 100) * (companies.length + technologies.length)),
                momentsExtracted: moments.length,
                errorsEncountered: result?.errors?.length || 0
              }
            })
          },
          onAgentActivity: (agent) => {
            // Check if agent already exists
            const existingAgent = progress.activeAgents.find(a => a.agentId === agent.agentId)
            if (existingAgent) {
              updateAgent(agent.agentId, agent)
            } else {
              addAgent(agent)
            }
          },
          onPrompt: (prompt) => {
            setCurrentPrompt(prompt)
          }
        }
      )
      
      // Clear existing moments and add new ones
      clearMoments()
      addMoments(result.moments)
      
      // Mark analysis complete
      updateProgress({
        isActive: false,
        progressPercentage: 100,
        stats: {
          totalItems: companies.length + technologies.length,
          processedItems: companies.length + technologies.length,
          momentsExtracted: result.moments.length,
          errorsEncountered: result.errors.length
        }
      })
      
      if (result.errors.length > 0) {
        console.log('Analysis warnings:', result.errors)
        const errorDetails = result.errors.slice(0, 3).join('\n• ')
        const remainingCount = result.errors.length > 3 ? ` and ${result.errors.length - 3} more...` : ''
        setAnalysisError(`Analysis completed with ${result.errors.length} warnings:\n• ${errorDetails}${remainingCount}`)
      }
    } catch (error) {
      updateProgress({ isActive: false })
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Moments</h1>
            <p className="text-sm text-muted-foreground">
              AI Business Intelligence Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <FolderSelection />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {!hasData ? (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Welcome to Moments</CardTitle>
                <CardDescription>
                  Get started by selecting your companies and technologies folders to hydrate your catalogs.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <FolderSelection />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="border-b border-border">
              <nav className="flex space-x-8 px-6 py-2">
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'companies'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Companies ({companies.length})
                </button>
                <button
                  onClick={() => setActiveTab('technologies')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'technologies'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Technologies ({technologies.length})
                </button>
                <button
                  onClick={() => setActiveTab('moments')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'moments'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Moments ({momentStats.totalMoments})
                  {momentStats.highImpactCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                      {momentStats.highImpactCount} high impact
                    </span>
                  )}
                </button>
              </nav>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {activeTab === 'moments' ? (
                <div className="h-full overflow-y-auto p-6">
                  <MomentsView
                    moments={moments}
                    isLoading={isAnalyzing}
                    error={analysisError}
                    progress={progress}
                    onAnalyzeMoments={handleAnalyzeMoments}
                  />
                </div>
              ) : (
                <CatalogView key={activeTab} type={activeTab} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}