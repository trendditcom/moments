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

      addMoments: (moments) =>
        set((state) => ({
          moments: [...state.moments, ...moments],
        })),

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
  
  const extractor = createMomentExtractor({
    onProgress: progressCallbacks?.onProgress,
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
        companiesResult = await extractor.analyzeCompanies(companies)
        console.log('Companies analysis result:', companiesResult.moments.length, 'moments,', companiesResult.errors.length, 'errors')
      }
    }

    // Analyze technologies if requested  
    if (sourceType === 'technologies' || sourceType === 'all') {
      if (technologies.length > 0) {
        console.log('Analyzing technologies:', technologies.map(t => t.name))
        technologiesResult = await extractor.analyzeTechnologies(technologies)
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