'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  MomentState, 
  MomentActions, 
  PivotalMoment, 
  MomentCorrelation,
  MomentAnalysisResult,
  AnalysisProgress,
  AnalysisStep,
  AgentActivity
} from '@/types/moments'
import { Company, Technology, ContentItem } from '@/types/catalog'
import { MomentExtractor, createMomentExtractor } from '@/lib/moment-extractor'
import { 
  SubAgentManager, 
  createSubAgentManager,
  ProviderAwareSubAgentManager,
  createProviderAwareSubAgentManager
} from '@/lib/sub-agents'
import { createPersistStorage, createFileFirstStorage } from '@/lib/persistence'
import { momentFileProcessor } from '@/lib/moment-file-processor'
import { loadConfigClient } from '@/lib/config-loader.client'
import { incrementalMomentManager } from '@/lib/incremental-moment-manager'

interface MomentStore extends MomentState, MomentActions {
  // Additional helper methods
  getMomentsBySource: (sourceType: 'company' | 'technology', sourceId?: string) => PivotalMoment[]
  getMomentsByFactor: (factor: string) => PivotalMoment[]
  getHighImpactMoments: (threshold?: number) => PivotalMoment[]
  getMomentStats: () => {
    totalMoments: number
    highImpactCount: number
    averageImpact: number
    byConfidence: { high: number; medium: number; low: number }
    bySource: { company: number; technology: number }
  }
  // Incremental analysis methods
  analyzeMomentsIncremental: (
    companies: Company[],
    technologies: Technology[],
    sourceType?: 'companies' | 'technologies' | 'all',
    options?: { forceFullAnalysis?: boolean }
  ) => Promise<void>
  getIncrementalStats: () => {
    trackedContent: number
    lastUpdate: Date | null
    temporalWindowDays: number
  }
  clearIncrementalCache: () => void
  // Debug helper
  debugStoreState: () => MomentState
}

export const useMomentsStore = create<MomentStore>()(
  persist(
    (set, get) => ({
      // State
      moments: [],
      correlations: [],
      isAnalyzing: false,
      analysisError: null,
      lastAnalysisAt: null,
      processingStats: {
        totalContent: 0,
        processedContent: 0,
        momentsFound: 0,
      },
      progress: {
        isActive: false,
        currentStep: null,
        completedSteps: [],
        activeAgents: [],
        currentPrompt: undefined,
        progressPercentage: 0,
        estimatedTimeRemaining: undefined,
        stats: {
          totalItems: 0,
          processedItems: 0,
          momentsExtracted: 0,
          errorsEncountered: 0
        }
      },

      // Actions
      analyzeMoments: async (sourceType: 'companies' | 'technologies' | 'all') => {
        const { setAnalyzing, setAnalysisError, addMoments, updateProcessingStats } = get()
        
        try {
          setAnalyzing(true)
          setAnalysisError(null)

          // Get data from catalog store (we'll need to pass this as parameter in real usage)
          // For now, we'll create a placeholder implementation
          const extractor = createMomentExtractor()
          
          let result: MomentAnalysisResult

          // In a real implementation, we would get companies/technologies from the catalog store
          // This is a placeholder that shows the intended structure
          if (sourceType === 'companies') {
            // result = await extractor.analyzeCompanies(companies)
            result = { moments: [], totalProcessed: 0, processingTime: 0, errors: [] }
          } else if (sourceType === 'technologies') {
            // result = await extractor.analyzeTechnologies(technologies)
            result = { moments: [], totalProcessed: 0, processingTime: 0, errors: [] }
          } else {
            // Analyze both
            result = { moments: [], totalProcessed: 0, processingTime: 0, errors: [] }
          }

          // Update processing stats
          updateProcessingStats({
            totalContent: result.totalProcessed,
            processedContent: result.totalProcessed,
            momentsFound: result.moments.length
          })

          // Add discovered moments
          addMoments(result.moments)

          // Set analysis completion
          set({ lastAnalysisAt: new Date() })

          // If there were errors, set them
          if (result.errors.length > 0) {
            setAnalysisError(`Analysis completed with ${result.errors.length} errors: ${result.errors.slice(0, 3).join('; ')}`)
          }

        } catch (error) {
          setAnalysisError(error instanceof Error ? error.message : 'Analysis failed')
        } finally {
          setAnalyzing(false)
        }
      },

      addMoments: async (moments) => {
        set((state) => ({
          moments: [...state.moments, ...moments],
        }))
        
        // Auto-save to files if enabled
        try {
          const config = await loadConfigClient()
          if (config.catalogs.moments?.auto_save && moments.length > 0) {
            console.log(`Auto-saving ${moments.length} moments to files...`)
            const result = await momentFileProcessor.saveMoments(moments)
            console.log(`File save result: ${result.saved} saved, ${result.failed} failed`)
          }
        } catch (error) {
          console.error('Error auto-saving moments:', error)
          // Don't throw - file save errors shouldn't break the app
        }
      },

      addCorrelations: (correlations) =>
        set((state) => ({
          correlations: [...state.correlations, ...correlations],
        })),

      setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

      setAnalysisError: (error) => set({ analysisError: error }),

      clearMoments: () =>
        set({
          moments: [],
          correlations: [],
          analysisError: null,
          processingStats: {
            totalContent: 0,
            processedContent: 0,
            momentsFound: 0,
          },
          progress: {
            isActive: false,
            currentStep: null,
            completedSteps: [],
            activeAgents: [],
            currentPrompt: undefined,
            progressPercentage: 0,
            estimatedTimeRemaining: undefined,
            stats: {
              totalItems: 0,
              processedItems: 0,
              momentsExtracted: 0,
              errorsEncountered: 0
            }
          },
        }),

      updateProcessingStats: (stats) =>
        set((state) => ({
          processingStats: {
            ...state.processingStats,
            ...stats,
          },
        })),

      // File-based persistence methods
      hydrateFromFiles: async () => {
        try {
          console.log('Loading moments from files...')
          const fileMoments = await momentFileProcessor.loadMoments()
          
          if (fileMoments.length > 0) {
            set((state) => ({
              moments: [...fileMoments], // Replace with file-based moments
              lastAnalysisAt: new Date() // Update last analysis time
            }))
            
            console.log(`Hydrated ${fileMoments.length} moments from files`)
            return { loaded: fileMoments.length, errors: 0 }
          }
          
          return { loaded: 0, errors: 0 }
        } catch (error) {
          console.error('Error hydrating moments from files:', error)
          return { loaded: 0, errors: 1 }
        }
      },

      saveToFiles: async (moments) => {
        try {
          const currentState = get()
          const momentsToSave = moments || currentState.moments
          
          if (momentsToSave.length === 0) {
            console.warn('No moments found to save to files')
            return { saved: 0, failed: 0 }
          }
          
          console.log(`Saving ${momentsToSave.length} moments to files...`)
          const result = await momentFileProcessor.saveMoments(momentsToSave)
          console.log(`Save result: ${result.saved} saved, ${result.failed} failed`)
          return result
        } catch (error) {
          console.error('Error saving moments to files:', error)
          return { saved: 0, failed: 1 }
        }
      },

      deleteMomentFile: async (momentId) => {
        try {
          const success = await momentFileProcessor.deleteMoment(momentId)
          if (success) {
            // Also remove from memory
            set((state) => ({
              moments: state.moments.filter(m => m.id !== momentId)
            }))
          }
          return success
        } catch (error) {
          console.error(`Error deleting moment file ${momentId}:`, error)
          return false
        }
      },

      checkFileSystemStatus: async () => {
        try {
          const status = await momentFileProcessor.checkMomentsFolder()
          return {
            exists: status.exists,
            writable: status.writable,
            count: status.count
          }
        } catch (error) {
          console.error('Error checking file system status:', error)
          return { exists: false, writable: false, count: 0 }
        }
      },

      // Progress tracking actions
      updateProgress: (progress) =>
        set((state) => ({
          progress: {
            ...state.progress,
            ...progress,
          },
        })),

      addStep: (step) =>
        set((state) => ({
          progress: {
            ...state.progress,
            currentStep: step,
          },
        })),

      updateStep: (stepId, updates) =>
        set((state) => ({
          progress: {
            ...state.progress,
            currentStep: state.progress.currentStep?.id === stepId 
              ? { ...state.progress.currentStep, ...updates } 
              : state.progress.currentStep,
            completedSteps: state.progress.completedSteps.map(step => 
              step.id === stepId ? { ...step, ...updates } : step
            ),
          },
        })),

      addAgent: (agent) =>
        set((state) => ({
          progress: {
            ...state.progress,
            activeAgents: [...state.progress.activeAgents, agent],
          },
        })),

      updateAgent: (agentId, updates) =>
        set((state) => ({
          progress: {
            ...state.progress,
            activeAgents: state.progress.activeAgents.map(agent => 
              agent.agentId === agentId 
                ? { ...agent, ...updates, lastActivity: new Date() } 
                : agent
            ),
          },
        })),

      setCurrentPrompt: (prompt) =>
        set((state) => ({
          progress: {
            ...state.progress,
            currentPrompt: prompt,
          },
        })),

      resetProgress: () =>
        set((state) => ({
          progress: {
            isActive: false,
            currentStep: null,
            completedSteps: [],
            activeAgents: [],
            currentPrompt: undefined,
            progressPercentage: 0,
            estimatedTimeRemaining: undefined,
            stats: {
              totalItems: 0,
              processedItems: 0,
              momentsExtracted: 0,
              errorsEncountered: 0
            }
          },
        })),

      // Helper methods
      getMomentsBySource: (sourceType, sourceId) => {
        const { moments } = get()
        return moments.filter(moment => {
          if (moment.source.type !== sourceType) return false
          if (sourceId && moment.source.id !== sourceId) return false
          return true
        })
      },

      getMomentsByFactor: (factor) => {
        const { moments } = get()
        return moments.filter(moment => 
          moment.classification.microFactors.includes(factor as any) ||
          moment.classification.macroFactors.includes(factor as any)
        )
      },

      getHighImpactMoments: (threshold = 80) => {
        const { moments } = get()
        return moments.filter(moment => moment.impact.score >= threshold)
      },

      getMomentStats: () => {
        const { moments } = get()
        
        const totalMoments = moments.length
        const highImpactCount = moments.filter(m => m.impact.score >= 80).length
        const averageImpact = moments.length > 0 
          ? moments.reduce((sum, m) => sum + m.impact.score, 0) / moments.length
          : 0

        const byConfidence = {
          high: moments.filter(m => m.classification.confidence === 'high').length,
          medium: moments.filter(m => m.classification.confidence === 'medium').length,
          low: moments.filter(m => m.classification.confidence === 'low').length,
        }

        const bySource = {
          company: moments.filter(m => m.source.type === 'company').length,
          technology: moments.filter(m => m.source.type === 'technology').length,
        }

        return {
          totalMoments,
          highImpactCount,
          averageImpact,
          byConfidence,
          bySource
        }
      },

      // Incremental analysis methods
      analyzeMomentsIncremental: async (companies, technologies, sourceType = 'all', options = {}) => {
        const { 
          setAnalyzing, 
          setAnalysisError, 
          updateProcessingStats, 
          updateProgress,
          addStep,
          updateStep,
          addAgent,
          updateAgent,
          setCurrentPrompt,
          resetProgress
        } = get()
        
        try {
          setAnalyzing(true)
          setAnalysisError(null)
          resetProgress()

          // Start progress tracking
          set({
            progress: {
              isActive: true,
              currentStep: null,
              completedSteps: [],
              activeAgents: [],
              currentPrompt: undefined,
              progressPercentage: 0,
              estimatedTimeRemaining: undefined,
              stats: {
                totalItems: companies.length + technologies.length,
                processedItems: 0,
                momentsExtracted: 0,
                errorsEncountered: 0
              }
            }
          })

          // Run incremental analysis with progress callbacks
          const result = await incrementalMomentManager.analyzeIncrementally(
            companies,
            technologies,
            sourceType,
            {
              forceFullAnalysis: options.forceFullAnalysis,
              onProgress: (step) => {
                addStep(step)
                if (step.progress) {
                  set((state) => ({
                    progress: {
                      ...state.progress,
                      progressPercentage: step.progress!,
                      currentStep: step
                    }
                  }))
                }
              },
              onAgentActivity: (agent) => {
                const existingAgentIndex = get().progress.activeAgents.findIndex(a => a.agentId === agent.agentId)
                if (existingAgentIndex >= 0) {
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

          // Update processing stats
          updateProcessingStats({
            totalContent: result.totalProcessed,
            processedContent: result.totalProcessed,
            momentsFound: result.moments.length
          })

          // Replace moments with incremental results
          set({ 
            moments: result.moments,
            lastAnalysisAt: new Date(),
            progress: {
              ...get().progress,
              isActive: false,
              progressPercentage: 100,
              stats: {
                ...get().progress.stats,
                processedItems: result.totalProcessed,
                momentsExtracted: result.moments.length,
                errorsEncountered: result.errors.length
              }
            }
          })

          // Auto-save to files if enabled
          try {
            const config = await loadConfigClient()
            if (config.catalogs.moments?.auto_save && result.moments.length > 0) {
              console.log(`Auto-saving ${result.moments.length} moments to files...`)
              const saveResult = await momentFileProcessor.saveMoments(result.moments)
              console.log(`File save result: ${saveResult.saved} saved, ${saveResult.failed} failed`)
            }
          } catch (error) {
            console.error('Error auto-saving moments:', error)
          }

          // Set analysis completion
          if (result.errors.length > 0) {
            setAnalysisError(`Incremental analysis completed with ${result.errors.length} errors`)
          }

          console.log(`[MomentsStore] Incremental analysis completed: ${result.moments.length} moments, ${result.errors.length} errors`)

        } catch (error) {
          console.error('[MomentsStore] Incremental analysis error:', error)
          setAnalysisError(error instanceof Error ? error.message : 'Incremental analysis failed')
          
          set((state) => ({
            progress: {
              ...state.progress,
              isActive: false,
              stats: {
                ...state.progress.stats,
                errorsEncountered: state.progress.stats.errorsEncountered + 1
              }
            }
          }))
        } finally {
          setAnalyzing(false)
        }
      },

      getIncrementalStats: () => {
        return incrementalMomentManager.getIncrementalStats()
      },

      clearIncrementalCache: () => {
        incrementalMomentManager.clearContentHashes()
        console.log('[MomentsStore] Incremental cache cleared - next analysis will be full')
      },

      // Debug helper to check store state
      debugStoreState: () => {
        const state = get()
        console.log('=== MOMENTS STORE DEBUG ===')
        console.log('Moments count:', state.moments.length)
        console.log('Sample moments:', state.moments.slice(0, 3).map(m => ({ id: m.id, title: m.title })))
        console.log('Last analysis:', state.lastAnalysisAt)
        console.log('Is analyzing:', state.isAnalyzing)
        console.log('Analysis error:', state.analysisError)
        console.log('Processing stats:', state.processingStats)
        console.log('=== END DEBUG ===')
        return state
      },
    }),
    {
      name: 'moments-store',
      version: 1,
      storage: createJSONStorage(() => {
        // Use file-first storage for moments
        try {
          return createFileFirstStorage('moments', 'moments')
        } catch (error) {
          console.warn('[MomentsStore] Falling back to localStorage-only persistence:', error)
          return createPersistStorage('moments-store')
        }
      }),
      partialize: (state) => ({
        moments: state.moments,
        correlations: state.correlations,
        lastAnalysisAt: state.lastAnalysisAt,
      }),
      migrate: (persistedState: any, version: number) => {
        console.log(`[MomentsStore] Migrating from version ${version} to 1`)
        if (version === 0) {
          // Version 0 to 1: no structural changes needed, just version bump
          return persistedState
        }
        return persistedState
      },
      onRehydrateStorage: () => (state) => {
        console.log('[MomentsStore] Rehydration complete', {
          moments: state?.moments?.length || 0,
          correlations: state?.correlations?.length || 0,
          lastAnalysisAt: state?.lastAnalysisAt
        })
      },
    }
  )
)

// Helper function to analyze items with progress tracking
async function analyzeWithProgressTracking(
  extractor: any,
  type: 'companies' | 'technologies',
  items: (Company | Technology)[],
  onMomentsFound: (moments: PivotalMoment[]) => void
): Promise<MomentAnalysisResult> {
  const allMoments: PivotalMoment[] = []
  const allErrors: string[] = []
  let totalProcessed = 0
  const startTime = Date.now()

  for (const item of items) {
    try {
      const result = await extractor.analyzeContent(
        item.content,
        type === 'companies' ? 'company' : 'technology',
        item.name
      )
      
      // Report progress with newly found moments
      if (result.moments.length > 0) {
        onMomentsFound(result.moments)
      }
      
      allMoments.push(...result.moments)
      allErrors.push(...result.errors)
      totalProcessed += result.totalProcessed
    } catch (error) {
      const errorMessage = `Failed to analyze ${type.slice(0, -1)} ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      allErrors.push(errorMessage)
    }
  }

  return {
    moments: allMoments,
    totalProcessed,
    processingTime: Date.now() - startTime,
    errors: allErrors
  }
}

// Helper function for parallel content processing within a single extractor
async function analyzeContentInParallel(
  extractor: any,
  content: ContentItem[],
  sourceType: 'company' | 'technology',
  sourceName: string,
  maxConcurrent: number = 3
): Promise<MomentAnalysisResult> {
  const results: Promise<PivotalMoment[]>[] = []
  const errors: string[] = []
  const startTime = Date.now()

  // Process content in parallel batches
  for (let i = 0; i < content.length; i += maxConcurrent) {
    const batch = content.slice(i, i + maxConcurrent)
    const batchPromises = batch.map(async (item) => {
      try {
        const result = await extractor.extractMomentsFromText(item.content || '', {
          sourceType,
          sourceName,
          contentId: item.id,
          filePath: item.path,
          contentName: item.name
        })
        return result
      } catch (error) {
        errors.push(`Failed to analyze ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return []
      }
    })
    
    results.push(...batchPromises)
  }

  const allMoments = (await Promise.all(results)).flat()
  
  return {
    moments: allMoments,
    totalProcessed: content.length,
    processingTime: Date.now() - startTime,
    errors
  }
}

// Parallel analysis function for multiple sources
async function analyzeSourcesInParallel(
  sources: Array<{items: (Company | Technology)[], type: 'companies' | 'technologies'}>,
  extractor: any,
  onMomentsFound: (moments: PivotalMoment[], sourceType: string, sourceName: string) => void
): Promise<MomentAnalysisResult[]> {
  const analysisPromises = sources.map(async ({items, type}) => {
    const typeResults: MomentAnalysisResult[] = []
    
    // Process all items of this type in parallel
    const itemPromises = items.map(async (item) => {
      try {
        const result = await extractor.analyzeContent(
          item.content,
          type === 'companies' ? 'company' : 'technology',
          item.name,
          true, // Enable parallel processing within each item
          3     // Max concurrent content per item
        )
        
        // Report progress with newly found moments
        if (result.moments.length > 0) {
          onMomentsFound(result.moments, type, item.name)
        }
        
        return result
      } catch (error) {
        const errorResult: MomentAnalysisResult = {
          moments: [],
          totalProcessed: 0,
          processingTime: 0,
          errors: [`Failed to analyze ${type.slice(0, -1)} ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }
        return errorResult
      }
    })
    
    const results = await Promise.all(itemPromises)
    return results
  })
  
  const allTypeResults = await Promise.all(analysisPromises)
  return allTypeResults.flat()
}

// Sequential analysis function for fallback processing
async function analyzeSourcesSequentially(
  sources: Array<{items: (Company | Technology)[], type: 'companies' | 'technologies'}>,
  extractor: any,
  onMomentsFound: (moments: PivotalMoment[], sourceType: string, sourceName: string) => void
): Promise<MomentAnalysisResult[]> {
  const allResults: MomentAnalysisResult[] = []
  
  for (const {items, type} of sources) {
    for (const item of items) {
      try {
        const result = await extractor.analyzeContent(
          item.content,
          type === 'companies' ? 'company' : 'technology',
          item.name,
          false, // Disable parallel processing within each item
          1      // Sequential processing
        )
        
        // Report progress with newly found moments
        if (result.moments.length > 0) {
          onMomentsFound(result.moments, type, item.name)
        }
        
        allResults.push(result)
      } catch (error) {
        const errorResult: MomentAnalysisResult = {
          moments: [],
          totalProcessed: 0,
          processingTime: 0,
          errors: [`Failed to analyze ${type.slice(0, -1)} ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }
        allResults.push(errorResult)
      }
    }
  }
  
  return allResults
}

// Standalone function to analyze moments from catalog data with parallel processing
export async function analyzeMomentsFromCatalog(
  companies: Company[], 
  technologies: Technology[],
  sourceType: 'companies' | 'technologies' | 'all' = 'all',
  progressCallbacks?: {
    onProgress?: (step: AnalysisStep) => void
    onAgentActivity?: (agent: AgentActivity) => void  
    onPrompt?: (prompt: string) => void
  }
): Promise<MomentAnalysisResult> {
  console.log('Starting parallel moment analysis...')
  console.log('Companies:', companies.length, 'Technologies:', technologies.length)
  console.log('Source type:', sourceType)
  
  // Track running totals for real-time progress
  let runningMomentCount = 0
  let processedCount = 0
  const totalItems = (sourceType === 'companies' ? companies.length : 0) + 
                    (sourceType === 'technologies' ? technologies.length : 0) + 
                    (sourceType === 'all' ? companies.length + technologies.length : 0)
  
  // Enhanced progress callback that tracks moment count
  const enhancedOnProgress = (step: AnalysisStep, momentCount?: number) => {
    if (momentCount !== undefined) {
      runningMomentCount = momentCount
    }
    
    // Update progress with current moment count
    const enhancedStep: AnalysisStep = {
      ...step,
      details: step.details || `Found ${runningMomentCount} moments so far`
    }
    
    progressCallbacks?.onProgress?.(enhancedStep)
  }
  
  // Create multiple extractors for parallel processing
  const createExtractorWithCallbacks = () => createMomentExtractor({
    onProgress: enhancedOnProgress,
    onAgentActivity: progressCallbacks?.onAgentActivity,
    onPrompt: progressCallbacks?.onPrompt
  })
  
  // Use provider-aware sub-agent manager for enhanced multi-provider support
  const subAgents = await createProviderAwareSubAgentManager()
  
  try {
    // Load configuration first (await is needed)
    const config = await loadConfigClient()
    
    // Extract parallel processing settings from loaded config
    const parallelConfig = config.app.processing.parallel_processing
    const isParallelEnabled = parallelConfig?.enabled ?? true
    const maxConcurrentSources = parallelConfig?.max_concurrent_sources ?? 4
    const maxConcurrentContent = parallelConfig?.max_concurrent_content_per_source ?? 3
    const enableSubAgentParallel = parallelConfig?.enable_sub_agent_parallelization ?? true
    
    console.log(`[ParallelAnalysis] Parallel processing ${isParallelEnabled ? 'enabled' : 'disabled'}`, {
      maxConcurrentSources,
      maxConcurrentContent,
      enableSubAgentParallel
    })
    
    // Prepare sources for parallel processing
    const sources: Array<{items: (Company | Technology)[], type: 'companies' | 'technologies'}> = []
    
    if (sourceType === 'companies' || sourceType === 'all') {
      if (companies.length > 0) {
        sources.push({ items: companies, type: 'companies' })
      }
    }
    
    if (sourceType === 'technologies' || sourceType === 'all') {
      if (technologies.length > 0) {
        sources.push({ items: technologies, type: 'technologies' })
      }
    }

    console.log(`[ParallelAnalysis] Processing ${sources.length} source types in parallel`)
    
    // Enhanced callback that reports moment counts in real-time
    const onMomentsFound = (moments: PivotalMoment[], sourceType: string, sourceName: string) => {
      runningMomentCount += moments.length
      processedCount++
      enhancedOnProgress({
        id: `parallel-${sourceType}`,
        type: 'content_analysis',
        status: 'running',
        startTime: new Date(),
        description: `Analyzing ${sourceType} ${isParallelEnabled ? 'in parallel' : 'sequentially'} (${sourceName})`,
        details: `Found ${runningMomentCount} moments so far`,
        progress: Math.round((processedCount / totalItems) * 100)
      }, runningMomentCount)
    }
    
    // Process all sources based on parallel configuration
    const allResults = isParallelEnabled 
      ? await analyzeSourcesInParallel(
          sources,
          createExtractorWithCallbacks(),
          onMomentsFound
        )
      : await analyzeSourcesSequentially(
          sources,
          createExtractorWithCallbacks(),
          onMomentsFound
        )

    // Combine results
    const allMoments: PivotalMoment[] = []
    const allErrors: string[] = []
    let totalProcessed = 0
    let maxProcessingTime = 0
    
    for (const result of allResults) {
      allMoments.push(...result.moments)
      allErrors.push(...result.errors)
      totalProcessed += result.totalProcessed
      maxProcessingTime = Math.max(maxProcessingTime, result.processingTime)
    }
    
    console.log(`[ParallelAnalysis] Combined results: ${allMoments.length} moments, ${allErrors.length} errors`)
    
    // Enhance classifications using sub-agents in parallel (if enabled)
    try {
      const subAgentPromises = []
      
      // Run sub-agents based on parallel configuration
      if (allMoments.length > 0) {
        const batchSize = parallelConfig?.sub_agent_batch_size ?? 10
        
        if (enableSubAgentParallel) {
          // Run classification and correlation in parallel
          subAgentPromises.push(
            subAgents.classifyMoments(allMoments, batchSize, true).then(result => {
              if (result.success) {
                console.log('[SubAgents] Parallel classification completed:', result.data?.classifications?.length || 0)
              }
              return result
            })
          )
          
          subAgentPromises.push(
            subAgents.findCorrelations(allMoments, batchSize + 5, true).then(result => {
              if (result.success) {
                console.log('[SubAgents] Parallel correlation analysis completed:', result.data?.correlations?.length || 0)
              }
              return result
            })
          )
          
          // Wait for all sub-agents to complete in parallel
          await Promise.all(subAgentPromises)
          console.log(`[ParallelAnalysis] Sub-agent enhancement completed in parallel`)
        } else {
          // Run sub-agents sequentially
          const classificationResult = await subAgents.classifyMoments(allMoments, batchSize, false)
          if (classificationResult.success) {
            console.log('[SubAgents] Sequential classification completed:', classificationResult.data?.classifications?.length || 0)
          }
          
          const correlationResult = await subAgents.findCorrelations(allMoments, batchSize + 5, false)
          if (correlationResult.success) {
            console.log('[SubAgents] Sequential correlation analysis completed:', correlationResult.data?.correlations?.length || 0)
          }
          
          console.log(`[ParallelAnalysis] Sub-agent enhancement completed sequentially`)
        }
      }
      
    } catch (error) {
      console.warn('[ParallelAnalysis] Sub-agent enhancement failed:', error)
    }

    return {
      moments: allMoments,
      totalProcessed,
      processingTime: maxProcessingTime,
      errors: allErrors
    }
  } catch (error) {
    throw new Error(`Failed to analyze moments: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}