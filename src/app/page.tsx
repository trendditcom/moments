'use client'

import { useState, useEffect } from 'react'
import { CatalogView } from '@/components/catalog-view'
import { CatalogDetail } from '@/components/catalog-detail'
import { MomentDetail } from '@/components/moment-detail'
import { MomentsView } from '@/components/moments-view'
import { StorageManager } from '@/components/storage-manager'
import { SettingsContent } from '@/components/settings-content'
import { CatalogStatus } from '@/components/catalog-status'
import { LoadingScreen } from '@/components/loading-screen'
import { CatalogSkeleton, CatalogHeaderSkeleton } from '@/components/catalog-skeleton'
import { useCatalogStore } from '@/store/catalog-store'
import { useMomentsStore } from '@/store/moments-store'
import { analyzeMomentsFromCatalog } from '@/store/moments-store'
import { useAppInitialization } from '@/hooks/use-app-initialization'
import { useMomentsHydration } from '@/hooks/use-moments-hydration'
import { Company, Technology } from '@/types/catalog'
import { PivotalMoment } from '@/types/moments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { 
  Cog6ToothIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  WrenchScrewdriverIcon 
} from '@heroicons/react/24/outline'
import { Zap } from 'lucide-react'

type ViewState = 
  | { type: 'catalog', tab: 'companies' | 'technologies' | 'moments' }
  | { type: 'detail', item: Company | Technology, itemType: 'company' | 'technology' }
  | { type: 'moment-detail', moment: PivotalMoment }

export default function HomePage() {
  const [showStorageManager, setShowStorageManager] = useState(false)
  const [settingsSection, setSettingsSection] = useState<'health' | 'data' | 'management'>('health')
  const { phase, status, error, progress, isInitializing, hasData, isLoading } = useAppInitialization()
  const { 
    isHydrating: isMomentsHydrating, 
    hydrationStatus: momentsHydrationStatus, 
    hydrationError: momentsHydrationError 
  } = useMomentsHydration()
  const { companies, technologies } = useCatalogStore()
  const { 
    moments, 
    isAnalyzing, 
    analysisError, 
    progress: analysisProgress,
    addMoments, 
    setAnalyzing, 
    setAnalysisError,
    clearMoments,
    getMomentStats,
    // Progress tracking actions
    updateProgress,
    addStep,
    addAgent,
    updateAgent,
    setCurrentPrompt,
    resetProgress,
    // Incremental analysis methods
    analyzeMomentsIncremental,
    getIncrementalStats,
    clearIncrementalCache
  } = useMomentsStore()
  
  const [viewState, setViewState] = useState<ViewState>({ type: 'catalog', tab: 'companies' })

  // Use hasData from initialization hook for more reliable state management
  const momentStats = getMomentStats()
  const incrementalStats = getIncrementalStats()
  
  const handleRetryInitialization = () => {
    window.location.reload()
  }
  
  // Navigation handlers
  const handleCatalogItemClick = (item: Company | Technology) => {
    const itemType = 'category' in item ? 'company' : 'technology'
    setViewState({ type: 'detail', item, itemType })
  }
  
  const handleBackToCatalog = () => {
    if (viewState.type === 'detail') {
      const tabMap = { company: 'companies' as const, technology: 'technologies' as const }
      setViewState({ type: 'catalog', tab: tabMap[viewState.itemType] })
    } else if (viewState.type === 'moment-detail') {
      setViewState({ type: 'catalog', tab: 'moments' })
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
    setViewState({ type: 'moment-detail', moment })
  }
  
  // Get active tab for navigation highlighting
  const activeTab = viewState.type === 'catalog' ? viewState.tab : 
    viewState.type === 'detail' ? (viewState.itemType === 'company' ? 'companies' : 'technologies') :
    viewState.type === 'moment-detail' ? 'moments' : 'companies'

  // Handle moment analysis
  const handleAnalyzeMoments = async () => {
    if (!hasData) {
      setAnalysisError('Please wait for catalogs to load first')
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
            
            // Extract moment count from step details if available
            const momentCountMatch = step.details?.match(/Found (\d+) moments so far/)
            const currentMomentCount = momentCountMatch ? parseInt(momentCountMatch[1]) : 0
            
            updateProgress({
              progressPercentage: overallProgress,
              stats: {
                totalItems: companies.length + technologies.length,
                processedItems: Math.round((overallProgress / 100) * (companies.length + technologies.length)),
                momentsExtracted: currentMomentCount,
                errorsEncountered: 0 // Will be updated when analysis completes
              }
            })
          },
          onAgentActivity: (agent) => {
            // Check if agent already exists
            const existingAgent = analysisProgress.activeAgents.find(a => a.agentId === agent.agentId)
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

  // Handle incremental moment analysis
  const handleAnalyzeIncremental = async () => {
    if (!hasData) {
      setAnalysisError('Please wait for catalogs to load first')
      return
    }

    try {
      await analyzeMomentsIncremental(companies, technologies, 'all', { forceFullAnalysis: false })
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Incremental analysis failed')
    }
  }

  // Handle force full analysis  
  const handleForceFullAnalysis = async () => {
    if (!hasData) {
      setAnalysisError('Please wait for catalogs to load first')
      return
    }

    try {
      await analyzeMomentsIncremental(companies, technologies, 'all', { forceFullAnalysis: true })
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Full analysis failed')
    }
  }

  // Handle clear incremental cache
  const handleClearIncrementalCache = () => {
    clearIncrementalCache()
  }

  // Show loading screen during initialization
  if (isInitializing || error) {
    return (
      <LoadingScreen 
        phase={phase}
        status={status}
        error={error}
        progress={progress}
        onRetry={error ? handleRetryInitialization : undefined}
      />
    )
  }
  
  // Settings sidebar state
  const isSettingsOpen = showStorageManager

  return (
    <div className="flex h-screen bg-background">
      {/* Settings Sidebar */}
      {isSettingsOpen && (
        <div className="w-80 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">Storage & Data Management</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStorageManager(false)}
                className="ml-4"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              <button
                onClick={() => setSettingsSection('health')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  settingsSection === 'health'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                <ShieldCheckIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Storage Health</span>
              </button>
              
              <button
                onClick={() => setSettingsSection('data')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  settingsSection === 'data'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Current Data</span>
              </button>
              
              <button
                onClick={() => setSettingsSection('management')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  settingsSection === 'management'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                <WrenchScrewdriverIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Storage Management</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Moments</h1>
                <p className="text-sm text-muted-foreground">
                  AI Business Intelligence Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {hasData ? (
                <CatalogStatus 
                  hydrationStatus={status} 
                  hydrationError={error}
                  isHydrating={isLoading}
                />
              ) : (
                <CatalogHeaderSkeleton />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStorageManager(!showStorageManager)}
                title="Settings"
                className={isSettingsOpen ? 'bg-muted' : ''}
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Settings Content or Main App Content */}
        {isSettingsOpen ? (
          <div className="flex-1 overflow-y-auto p-6">
            <SettingsContent section={settingsSection} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {!hasData ? (
              <CatalogSkeleton />
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
                
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <CatalogSkeleton />
                  ) : viewState.type === 'moment-detail' ? (
                    <MomentDetail
                      moment={viewState.moment}
                      allMoments={moments}
                      companies={companies}
                      technologies={technologies}
                      onBack={handleBackToCatalog}
                      onMomentSelect={handleMomentSelect}
                      onEntityClick={handleEntityClick}
                    />
                  ) : viewState.type === 'detail' ? (
                    <CatalogDetail
                      item={viewState.item}
                      type={viewState.itemType}
                      moments={moments}
                      onBack={handleBackToCatalog}
                      onMomentSelect={handleMomentSelect}
                      onEntityClick={handleEntityClick}
                    />
                  ) : viewState.tab === 'moments' ? (
                    <div className="p-6">
                      <MomentsView
                        moments={moments}
                        isLoading={isAnalyzing}
                        error={analysisError}
                        progress={analysisProgress}
                        onAnalyzeMoments={handleAnalyzeMoments}
                        onAnalyzeIncremental={handleAnalyzeIncremental}
                        onForceFullAnalysis={handleForceFullAnalysis}
                        onClearIncrementalCache={handleClearIncrementalCache}
                        incrementalStats={incrementalStats}
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
        )}
      </div>
    </div>
  )
}