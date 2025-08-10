'use client'

import { useState, useEffect } from 'react'
import { CatalogView } from '@/components/catalog-view'
import { CatalogDetail } from '@/components/catalog-detail'
import { MomentsView } from '@/components/moments-view'
import { StorageManager } from '@/components/storage-manager'
import { CatalogStatus } from '@/components/catalog-status'
import { useCatalogStore } from '@/store/catalog-store'
import { useMomentsStore } from '@/store/moments-store'
import { analyzeMomentsFromCatalog } from '@/store/moments-store'
import { useAutoRecovery } from '@/hooks/use-auto-recovery'
import { useAutoHydration } from '@/hooks/use-auto-hydration'
import { Company, Technology } from '@/types/catalog'
import { PivotalMoment } from '@/types/moments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Cog6ToothIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

type ViewState = 
  | { type: 'catalog', tab: 'companies' | 'technologies' | 'moments' }
  | { type: 'detail', item: Company | Technology, itemType: 'company' | 'technology' }

export default function HomePage() {
  const [showStorageManager, setShowStorageManager] = useState(false)
  const { isRecovering, recoveryStatus } = useAutoRecovery()
  const { isHydrating, hydrationStatus, hydrationError } = useAutoHydration()
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
  
  const [viewState, setViewState] = useState<ViewState>({ type: 'catalog', tab: 'companies' })

  const hasData = companies.length > 0 || technologies.length > 0
  const momentStats = getMomentStats()
  
  // Navigation handlers
  const handleCatalogItemClick = (item: Company | Technology) => {
    const itemType = 'category' in item ? 'company' : 'technology'
    setViewState({ type: 'detail', item, itemType })
  }
  
  const handleBackToCatalog = () => {
    if (viewState.type === 'detail') {
      const tabMap = { company: 'companies' as const, technology: 'technologies' as const }
      setViewState({ type: 'catalog', tab: tabMap[viewState.itemType] })
    } else {
      setViewState({ type: 'catalog', tab: 'companies' })
    }
  }
  
  const handleTabChange = (tab: 'companies' | 'technologies' | 'moments') => {
    setViewState({ type: 'catalog', tab })
  }
  
  const handleEntityClick = (entity: string, type: 'company' | 'technology') => {
    // Find matching catalog item
    const searchList = type === 'company' ? companies : technologies
    const matchingItem = searchList.find(item => 
      item.name.toLowerCase().includes(entity.toLowerCase()) ||
      entity.toLowerCase().includes(item.name.toLowerCase())
    )
    
    if (matchingItem) {
      setViewState({ type: 'detail', item: matchingItem, itemType: type })
    } else {
      // Could show a "create new catalog entry" dialog here
      console.log(`No catalog entry found for ${entity}. Could create new ${type} entry.`)
      // For now, just switch to the appropriate catalog tab to show the option
      const tabMap = { company: 'companies' as const, technology: 'technologies' as const }
      setViewState({ type: 'catalog', tab: tabMap[type] })
    }
  }
  
  const handleMomentSelect = (moment: PivotalMoment) => {
    // Could open a modal or navigate to moment detail view
    console.log('Moment selected:', moment)
  }
  
  // Get active tab for navigation highlighting
  const activeTab = viewState.type === 'catalog' ? viewState.tab : 
    viewState.type === 'detail' ? (viewState.itemType === 'company' ? 'companies' : 'technologies') : 'companies'

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
                errorsEncountered: 0 // Will be updated when analysis completes
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
            <CatalogStatus 
              hydrationStatus={hydrationStatus} 
              hydrationError={hydrationError}
              isHydrating={isHydrating}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowStorageManager(!showStorageManager)}
              title="Storage Manager"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <Collapsible open={showStorageManager} onOpenChange={setShowStorageManager}>
        <CollapsibleContent className="border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="p-6">
            <StorageManager />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex-1 overflow-hidden">
        {!hasData ? (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Welcome to Moments</CardTitle>
                <CardDescription>
                  {isHydrating ? (
                    <>Loading your catalogs from configuration...</>
                  ) : hydrationError ? (
                    <>Failed to load catalogs. Check configuration and try refreshing.</>
                  ) : (
                    <>Catalogs are loading automatically from your configuration.</>  
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <CatalogStatus 
                  hydrationStatus={hydrationStatus} 
                  hydrationError={hydrationError}
                  isHydrating={isHydrating}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {viewState.type === 'catalog' && (
              <div className="border-b border-border">
                <nav className="flex space-x-8 px-6 py-2">
                  <button
                    onClick={() => handleTabChange('companies')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'companies'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Companies ({companies.length})
                  </button>
                  <button
                    onClick={() => handleTabChange('technologies')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'technologies'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Technologies ({technologies.length})
                  </button>
                  <button
                    onClick={() => handleTabChange('moments')}
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
            )}
            
            <div className="flex-1 overflow-hidden">
              {viewState.type === 'detail' ? (
                <CatalogDetail
                  item={viewState.item}
                  type={viewState.itemType}
                  moments={moments}
                  onBack={handleBackToCatalog}
                  onMomentSelect={handleMomentSelect}
                  onEntityClick={handleEntityClick}
                />
              ) : viewState.tab === 'moments' ? (
                <div className="h-full overflow-y-auto p-6">
                  <MomentsView
                    moments={moments}
                    isLoading={isAnalyzing}
                    error={analysisError}
                    progress={progress}
                    onAnalyzeMoments={handleAnalyzeMoments}
                    onMomentSelect={handleMomentSelect}
                    onEntityClick={handleEntityClick}
                  />
                </div>
              ) : (
                <CatalogView 
                  key={viewState.tab} 
                  type={viewState.tab} 
                  onItemClick={handleCatalogItemClick}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}