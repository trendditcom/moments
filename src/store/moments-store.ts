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
import { Company, Technology } from '@/types/catalog'
import { MomentExtractor, createMomentExtractor } from '@/lib/moment-extractor'
import { SubAgentManager, createSubAgentManager } from '@/lib/sub-agents'
import { createPersistStorage } from '@/lib/persistence'
import { momentFileProcessor } from '@/lib/moment-file-processor'
import { loadConfigClient } from '@/lib/config-loader.client'

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
          const momentsToSave = moments || get().moments
          if (momentsToSave.length === 0) {
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
    }),
    {
      name: 'moments-store',
      version: 1,
      storage: createJSONStorage(() => createPersistStorage('moments-store')),
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

// Standalone function to analyze moments from catalog data
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
  console.log('Starting moment analysis...')
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
  
  const extractor = createMomentExtractor({
    onProgress: enhancedOnProgress,
    onAgentActivity: progressCallbacks?.onAgentActivity,
    onPrompt: progressCallbacks?.onPrompt
  })
  const subAgents = createSubAgentManager()
  
  try {
    let companiesResult: MomentAnalysisResult = { moments: [], totalProcessed: 0, processingTime: 0, errors: [] }
    let technologiesResult: MomentAnalysisResult = { moments: [], totalProcessed: 0, processingTime: 0, errors: [] }

    // Analyze companies if requested
    if (sourceType === 'companies' || sourceType === 'all') {
      if (companies.length > 0) {
        console.log('Analyzing companies:', companies.map(c => c.name))
        
        // Create enhanced analyzer that reports moment counts
        const enhancedCompaniesResult = await analyzeWithProgressTracking(
          extractor, 
          'companies', 
          companies, 
          (newMoments) => {
            runningMomentCount += newMoments.length
            processedCount++
            enhancedOnProgress({
              id: `companies-progress`,
              type: 'content_analysis',
              status: 'running',
              startTime: new Date(),
              description: `Analyzing companies (${processedCount}/${companies.length})`,
              details: `Found ${runningMomentCount} moments so far`,
              progress: Math.round((processedCount / totalItems) * 100)
            }, runningMomentCount)
          }
        )
        companiesResult = enhancedCompaniesResult
        console.log('Companies analysis result:', companiesResult.moments.length, 'moments,', companiesResult.errors.length, 'errors')
      }
    }

    // Analyze technologies if requested  
    if (sourceType === 'technologies' || sourceType === 'all') {
      if (technologies.length > 0) {
        console.log('Analyzing technologies:', technologies.map(t => t.name))
        
        // Create enhanced analyzer that reports moment counts
        const enhancedTechnologiesResult = await analyzeWithProgressTracking(
          extractor, 
          'technologies', 
          technologies, 
          (newMoments) => {
            runningMomentCount += newMoments.length
            processedCount++
            enhancedOnProgress({
              id: `technologies-progress`,
              type: 'content_analysis',
              status: 'running',
              startTime: new Date(),
              description: `Analyzing technologies (${processedCount - companies.length}/${technologies.length})`,
              details: `Found ${runningMomentCount} moments so far`,
              progress: Math.round((processedCount / totalItems) * 100)
            }, runningMomentCount)
          }
        )
        technologiesResult = enhancedTechnologiesResult
        console.log('Technologies analysis result:', technologiesResult.moments.length, 'moments,', technologiesResult.errors.length, 'errors')
      }
    }

    // Combine results
    const allMoments = [...companiesResult.moments, ...technologiesResult.moments]
    const allErrors = [...companiesResult.errors, ...technologiesResult.errors]
    
    console.log('Combined analysis result:', allMoments.length, 'total moments,', allErrors.length, 'total errors')
    if (allErrors.length > 0) {
      console.log('All errors:', allErrors)
    }
    
    // Enhance classifications using sub-agents if available
    try {
      const classificationResult = await subAgents.classifyMoments(allMoments)
      if (classificationResult.success && classificationResult.data) {
        // Apply enhanced classifications (this would be more sophisticated in practice)
        console.log('Enhanced classifications available:', classificationResult.data.classifications.length)
      }
    } catch (error) {
      console.warn('Sub-agent classification failed:', error)
    }

    return {
      moments: allMoments,
      totalProcessed: companiesResult.totalProcessed + technologiesResult.totalProcessed,
      processingTime: Math.max(companiesResult.processingTime, technologiesResult.processingTime),
      errors: allErrors
    }
  } catch (error) {
    throw new Error(`Failed to analyze moments: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}