'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  MomentState, 
  MomentActions, 
  PivotalMoment, 
  MomentCorrelation,
  MomentAnalysisResult
} from '@/types/moments'
import { Company, Technology } from '@/types/catalog'
import { MomentExtractor, createMomentExtractor } from '@/lib/moment-extractor'
import { SubAgentManager, createSubAgentManager } from '@/lib/sub-agents'

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
        }),

      updateProcessingStats: (stats) =>
        set((state) => ({
          processingStats: {
            ...state.processingStats,
            ...stats,
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
      partialize: (state) => ({
        moments: state.moments,
        correlations: state.correlations,
        lastAnalysisAt: state.lastAnalysisAt,
      }),
    }
  )
)

// Standalone function to analyze moments from catalog data
export async function analyzeMomentsFromCatalog(
  companies: Company[], 
  technologies: Technology[],
  sourceType: 'companies' | 'technologies' | 'all' = 'all'
): Promise<MomentAnalysisResult> {
  const extractor = createMomentExtractor()
  const subAgents = createSubAgentManager()
  
  try {
    let companiesResult: MomentAnalysisResult = { moments: [], totalProcessed: 0, processingTime: 0, errors: [] }
    let technologiesResult: MomentAnalysisResult = { moments: [], totalProcessed: 0, processingTime: 0, errors: [] }

    // Analyze companies if requested
    if (sourceType === 'companies' || sourceType === 'all') {
      if (companies.length > 0) {
        companiesResult = await extractor.analyzeCompanies(companies)
      }
    }

    // Analyze technologies if requested  
    if (sourceType === 'technologies' || sourceType === 'all') {
      if (technologies.length > 0) {
        technologiesResult = await extractor.analyzeTechnologies(technologies)
      }
    }

    // Combine results
    const allMoments = [...companiesResult.moments, ...technologiesResult.moments]
    
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
      errors: [...companiesResult.errors, ...technologiesResult.errors]
    }
  } catch (error) {
    throw new Error(`Failed to analyze moments: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}