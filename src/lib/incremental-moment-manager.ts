'use client'

import { PivotalMoment, MomentAnalysisResult, AnalysisStep, AgentActivity } from '@/types/moments'
import { Company, Technology, ContentItem } from '@/types/catalog'
import { momentFileProcessor } from '@/lib/moment-file-processor'
import { createMomentExtractor } from '@/lib/moment-extractor'
import { loadConfigClient } from '@/lib/config-loader.client'
import crypto from 'crypto'

interface ContentHash {
  contentId: string
  filePath: string
  lastModified: Date
  contentHash: string
  sourceType: 'company' | 'technology'
  sourceName: string
}

interface IncrementalAnalysisConfig {
  onProgress?: (step: AnalysisStep) => void
  onAgentActivity?: (agent: AgentActivity) => void
  onPrompt?: (prompt: string) => void
  temporalWindowDays?: number
  forceFullAnalysis?: boolean
  correlationThreshold?: number
}

interface ChangeAssessment {
  newContent: ContentItem[]
  modifiedContent: ContentItem[]
  unchangedContent: ContentItem[]
  affectedMoments: PivotalMoment[]
  impactedTimeWindows: Set<string>
}

/**
 * Incremental Moments Manager - Efficiently processes only new/changed content
 * and updates correlations and impact scores for affected moment clusters
 */
export class IncrementalMomentManager {
  private static instance: IncrementalMomentManager
  private contentHashes: Map<string, ContentHash> = new Map()
  private temporalWindowDays: number = 14
  
  private constructor() {
    this.loadContentHashes()
  }
  
  static getInstance(): IncrementalMomentManager {
    if (!IncrementalMomentManager.instance) {
      IncrementalMomentManager.instance = new IncrementalMomentManager()
    }
    return IncrementalMomentManager.instance
  }

  /**
   * Load existing content hashes from localStorage for change detection
   */
  private loadContentHashes(): void {
    try {
      const stored = localStorage.getItem('moments-content-hashes')
      if (stored) {
        const hashData = JSON.parse(stored)
        this.contentHashes = new Map(
          hashData.map((item: any) => [
            item.contentId,
            {
              ...item,
              lastModified: new Date(item.lastModified)
            }
          ])
        )
        console.log(`[IncrementalManager] Loaded ${this.contentHashes.size} content hashes`)
      }
    } catch (error) {
      console.warn('[IncrementalManager] Error loading content hashes:', error)
      this.contentHashes.clear()
    }
  }

  /**
   * Save content hashes to localStorage for persistence
   */
  private saveContentHashes(): void {
    try {
      const hashData = Array.from(this.contentHashes.values()).map(hash => ({
        ...hash,
        lastModified: hash.lastModified.toISOString()
      }))
      localStorage.setItem('moments-content-hashes', JSON.stringify(hashData))
      console.log(`[IncrementalManager] Saved ${hashData.length} content hashes`)
    } catch (error) {
      console.error('[IncrementalManager] Error saving content hashes:', error)
    }
  }

  /**
   * Generate hash for content item
   */
  private generateContentHash(content: ContentItem): string {
    // Handle both Date objects and string dates from persistence
    let updatedAtString = ''
    if (content.updatedAt) {
      if (content.updatedAt instanceof Date) {
        updatedAtString = content.updatedAt.toISOString()
      } else if (typeof content.updatedAt === 'string') {
        updatedAtString = content.updatedAt
      } else {
        // Handle case where updatedAt might be serialized in another format
        updatedAtString = new Date(content.updatedAt).toISOString()
      }
    }
    
    const hashSource = `${content.id}:${content.path}:${updatedAtString}:${content.content?.substring(0, 1000) || ''}`
    return crypto.createHash('md5').update(hashSource).digest('hex')
  }

  /**
   * Assess what content has changed since last analysis
   */
  private async assessContentChanges(
    companies: Company[],
    technologies: Technology[]
  ): Promise<ChangeAssessment> {
    const newContent: ContentItem[] = []
    const modifiedContent: ContentItem[] = []
    const unchangedContent: ContentItem[] = []
    const affectedMoments: PivotalMoment[] = []
    const impactedTimeWindows: Set<string> = new Set()

    // Process companies
    for (const company of companies) {
      for (const item of company.content) {
        const contentHash = this.generateContentHash(item)
        const existing = this.contentHashes.get(item.id)
        
        if (!existing) {
          newContent.push(item)
          console.log(`[IncrementalManager] New content: ${item.name}`)
        } else if (existing.contentHash !== contentHash) {
          modifiedContent.push(item)
          console.log(`[IncrementalManager] Modified content: ${item.name}`)
        } else {
          unchangedContent.push(item)
        }
        
        // Update hash record - ensure lastModified is always a Date object
        const lastModified = item.updatedAt instanceof Date 
          ? item.updatedAt 
          : item.updatedAt 
            ? new Date(item.updatedAt) 
            : new Date()

        this.contentHashes.set(item.id, {
          contentId: item.id,
          filePath: item.path,
          lastModified,
          contentHash,
          sourceType: 'company',
          sourceName: company.name
        })
      }
    }

    // Process technologies
    for (const technology of technologies) {
      for (const item of technology.content) {
        const contentHash = this.generateContentHash(item)
        const existing = this.contentHashes.get(item.id)
        
        if (!existing) {
          newContent.push(item)
          console.log(`[IncrementalManager] New content: ${item.name}`)
        } else if (existing.contentHash !== contentHash) {
          modifiedContent.push(item)
          console.log(`[IncrementalManager] Modified content: ${item.name}`)
        } else {
          unchangedContent.push(item)
        }
        
        // Update hash record - ensure lastModified is always a Date object
        const lastModified = item.updatedAt instanceof Date 
          ? item.updatedAt 
          : item.updatedAt 
            ? new Date(item.updatedAt) 
            : new Date()

        this.contentHashes.set(item.id, {
          contentId: item.id,
          filePath: item.path,
          lastModified,
          contentHash,
          sourceType: 'technology',
          sourceName: technology.name
        })
      }
    }

    // Find moments affected by changed content
    if (newContent.length > 0 || modifiedContent.length > 0) {
      const existingMoments = await momentFileProcessor.loadMoments()
      const changedContentIds = [...newContent, ...modifiedContent].map(item => item.id)
      
      for (const moment of existingMoments) {
        if (changedContentIds.includes(moment.source.contentId)) {
          affectedMoments.push(moment)
          
          // Add to temporal window for correlation updates
          const momentDate = typeof moment.extractedAt === 'string' 
            ? new Date(moment.extractedAt) 
            : moment.extractedAt
          const windowKey = this.getTemporalWindowKey(momentDate)
          impactedTimeWindows.add(windowKey)
        }
      }
    }

    this.saveContentHashes()

    return {
      newContent,
      modifiedContent,
      unchangedContent,
      affectedMoments,
      impactedTimeWindows
    }
  }

  /**
   * Generate temporal window key for grouping moments
   */
  private getTemporalWindowKey(date: Date): string {
    const windowStart = new Date(date)
    windowStart.setUTCHours(0, 0, 0, 0)
    windowStart.setUTCDate(windowStart.getUTCDate() - (windowStart.getUTCDate() % this.temporalWindowDays))
    return windowStart.toISOString().split('T')[0]
  }

  /**
   * Correlate moments within temporal windows
   */
  private async correlateMomentsInWindow(
    moments: PivotalMoment[],
    windowKey: string
  ): Promise<PivotalMoment[]> {
    const windowStart = new Date(windowKey)
    const windowEnd = new Date(windowStart)
    windowEnd.setUTCDate(windowEnd.getUTCDate() + this.temporalWindowDays)
    
    // Filter moments to this temporal window
    const windowMoments = moments.filter(moment => {
      const momentDate = typeof moment.extractedAt === 'string' 
        ? new Date(moment.extractedAt) 
        : moment.extractedAt
      return momentDate >= windowStart && momentDate <= windowEnd
    })

    // Apply correlation logic
    for (let i = 0; i < windowMoments.length; i++) {
      for (let j = i + 1; j < windowMoments.length; j++) {
        const correlation = this.calculateCorrelation(windowMoments[i], windowMoments[j])
        if (correlation.strength >= 0.6) {
          // Update impact scores based on correlation
          windowMoments[i].impact.score = Math.min(100, windowMoments[i].impact.score + correlation.impactBoost)
          windowMoments[j].impact.score = Math.min(100, windowMoments[j].impact.score + correlation.impactBoost)
          
          console.log(`[IncrementalManager] High correlation (${correlation.strength}) between "${windowMoments[i].title}" and "${windowMoments[j].title}"`)
        }
      }
    }

    return windowMoments
  }

  /**
   * Calculate correlation strength between two moments
   */
  private calculateCorrelation(moment1: PivotalMoment, moment2: PivotalMoment): {
    strength: number
    impactBoost: number
    reasons: string[]
  } {
    const reasons: string[] = []
    let strength = 0
    
    // Entity overlap (companies, technologies, people, locations)
    const entities1 = new Set([
      ...moment1.entities.companies,
      ...moment1.entities.technologies,
      ...moment1.entities.people,
      ...moment1.entities.locations
    ])
    const entities2 = new Set([
      ...moment2.entities.companies,
      ...moment2.entities.technologies,
      ...moment2.entities.people,
      ...moment2.entities.locations
    ])
    
    const entityOverlap = this.calculateJaccardSimilarity(entities1, entities2)
    if (entityOverlap > 0.2) {
      strength += entityOverlap * 0.4
      reasons.push(`Entity overlap: ${Math.round(entityOverlap * 100)}%`)
    }
    
    // Factor alignment
    const factors1 = new Set([...moment1.classification.microFactors, ...moment1.classification.macroFactors])
    const factors2 = new Set([...moment2.classification.microFactors, ...moment2.classification.macroFactors])
    
    const factorOverlap = this.calculateJaccardSimilarity(factors1, factors2)
    if (factorOverlap > 0.1) {
      strength += factorOverlap * 0.3
      reasons.push(`Factor alignment: ${Math.round(factorOverlap * 100)}%`)
    }
    
    // Keyword similarity
    const keywords1 = new Set(moment1.classification.keywords)
    const keywords2 = new Set(moment2.classification.keywords)
    
    const keywordOverlap = this.calculateJaccardSimilarity(keywords1, keywords2)
    if (keywordOverlap > 0.15) {
      strength += keywordOverlap * 0.2
      reasons.push(`Keyword similarity: ${Math.round(keywordOverlap * 100)}%`)
    }
    
    // Source relationship (same company/technology)
    if (moment1.source.name === moment2.source.name) {
      strength += 0.1
      reasons.push('Same source entity')
    }
    
    const impactBoost = Math.round(strength * 10) // Convert to 0-10 point boost
    
    return {
      strength: Math.min(1, strength),
      impactBoost,
      reasons
    }
  }

  /**
   * Calculate Jaccard similarity between two sets
   */
  private calculateJaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)))
    const union = new Set([...Array.from(set1), ...Array.from(set2)])
    return union.size === 0 ? 0 : intersection.size / union.size
  }

  /**
   * Main incremental analysis method
   */
  async analyzeIncrementally(
    companies: Company[],
    technologies: Technology[],
    sourceType: 'companies' | 'technologies' | 'all' = 'all',
    config: IncrementalAnalysisConfig = {}
  ): Promise<MomentAnalysisResult> {
    const startTime = Date.now()
    
    // Load configuration
    const appConfig = await loadConfigClient()
    this.temporalWindowDays = config.temporalWindowDays || 14

    config.onProgress?.({
      id: 'incremental-assessment',
      type: 'content_analysis', 
      status: 'running',
      startTime: new Date(),
      description: 'Assessing content changes',
      details: 'Comparing current content with previous analysis',
      progress: 10
    })

    // Assess what has changed
    const assessment = await this.assessContentChanges(companies, technologies)
    
    console.log(`[IncrementalManager] Content assessment:`, {
      new: assessment.newContent.length,
      modified: assessment.modifiedContent.length,
      unchanged: assessment.unchangedContent.length,
      affectedMoments: assessment.affectedMoments.length,
      impactedWindows: assessment.impactedTimeWindows.size
    })

    // If nothing changed and not forcing full analysis, return existing moments
    if (!config.forceFullAnalysis && 
        assessment.newContent.length === 0 && 
        assessment.modifiedContent.length === 0) {
      
      config.onProgress?.({
        id: 'incremental-complete',
        type: 'content_analysis',
        status: 'completed',
        startTime: new Date(startTime),
        endTime: new Date(),
        description: 'No changes detected',
        details: 'All content unchanged since last analysis',
        progress: 100
      })

      const existingMoments = await momentFileProcessor.loadMoments()
      return {
        moments: existingMoments,
        totalProcessed: assessment.unchangedContent.length,
        processingTime: Date.now() - startTime,
        errors: []
      }
    }

    // Process only changed content
    const contentToProcess = [...assessment.newContent, ...assessment.modifiedContent]
    const newMoments: PivotalMoment[] = []
    const errors: string[] = []

    if (contentToProcess.length > 0) {
      config.onProgress?.({
        id: 'incremental-processing',
        type: 'content_analysis',
        status: 'running',
        startTime: new Date(startTime),
        description: `Processing ${contentToProcess.length} changed items`,
        details: `${assessment.newContent.length} new, ${assessment.modifiedContent.length} modified`,
        progress: 30
      })

      // Create moment extractor for changed content
      const extractor = createMomentExtractor({
        onProgress: config.onProgress,
        onAgentActivity: config.onAgentActivity,
        onPrompt: config.onPrompt
      })

      // Group content by source for efficient processing
      const contentBySource = new Map<string, {items: ContentItem[], sourceType: 'company' | 'technology'}>()
      
      for (const item of contentToProcess) {
        const hash = this.contentHashes.get(item.id)
        if (hash) {
          const key = `${hash.sourceType}:${hash.sourceName}`
          if (!contentBySource.has(key)) {
            contentBySource.set(key, {items: [], sourceType: hash.sourceType})
          }
          contentBySource.get(key)!.items.push(item)
        }
      }

      // Process each source group
      let processedSources = 0
      for (const [sourceKey, sourceData] of Array.from(contentBySource.entries())) {
        const [sourceType, sourceName] = sourceKey.split(':')
        
        try {
          const result = await extractor.analyzeContent(
            sourceData.items,
            sourceData.sourceType,
            sourceName
          )
          
          newMoments.push(...result.moments)
          errors.push(...result.errors)
          
          processedSources++
          config.onProgress?.({
            id: 'incremental-processing',
            type: 'content_analysis',
            status: 'running',
            startTime: new Date(startTime),
            description: `Processing changed content`,
            details: `Completed ${sourceName} (${processedSources}/${contentBySource.size})`,
            progress: 30 + Math.round((processedSources / contentBySource.size) * 40)
          })
          
        } catch (error) {
          errors.push(`Failed to process ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    config.onProgress?.({
      id: 'correlation-update',
      type: 'correlation',
      status: 'running',
      startTime: new Date(startTime),
      description: 'Updating correlations',
      details: `Processing ${assessment.impactedTimeWindows.size} temporal windows`,
      progress: 75
    })

    // Load all existing moments and combine with new ones
    const existingMoments = await momentFileProcessor.loadMoments()
    
    // Remove affected moments that will be replaced
    const affectedMomentIds = new Set(assessment.affectedMoments.map(m => m.id))
    const unaffectedExistingMoments = existingMoments.filter(m => !affectedMomentIds.has(m.id))
    
    // Combine all moments
    const allMoments = [...unaffectedExistingMoments, ...newMoments]

    // Update correlations for impacted temporal windows
    for (const windowKey of Array.from(assessment.impactedTimeWindows)) {
      await this.correlateMomentsInWindow(allMoments, windowKey)
    }

    config.onProgress?.({
      id: 'incremental-complete',
      type: 'content_analysis',
      status: 'completed',
      startTime: new Date(startTime),
      endTime: new Date(),
      description: 'Incremental analysis complete',
      details: `Processed ${contentToProcess.length} items, found ${newMoments.length} new moments`,
      progress: 100
    })

    return {
      moments: allMoments,
      totalProcessed: contentToProcess.length,
      processingTime: Date.now() - startTime,
      errors
    }
  }

  /**
   * Clear content hashes to force full re-analysis
   */
  clearContentHashes(): void {
    this.contentHashes.clear()
    localStorage.removeItem('moments-content-hashes')
    console.log('[IncrementalManager] Content hashes cleared - next analysis will be full')
  }

  /**
   * Get incremental analysis statistics
   */
  getIncrementalStats(): {
    trackedContent: number
    lastUpdate: Date | null
    temporalWindowDays: number
  } {
    const lastUpdate = this.contentHashes.size > 0 
      ? new Date(Math.max(...Array.from(this.contentHashes.values()).map(h => h.lastModified.getTime())))
      : null
    
    return {
      trackedContent: this.contentHashes.size,
      lastUpdate,
      temporalWindowDays: this.temporalWindowDays
    }
  }
}

// Export singleton instance
export const incrementalMomentManager = IncrementalMomentManager.getInstance()

// Factory function for creating configured managers
export function createIncrementalMomentManager(config: Partial<IncrementalAnalysisConfig> = {}) {
  const manager = IncrementalMomentManager.getInstance()
  return {
    analyzeIncrementally: (
      companies: Company[],
      technologies: Technology[],
      sourceType: 'companies' | 'technologies' | 'all' = 'all'
    ) => manager.analyzeIncrementally(companies, technologies, sourceType, config),
    clearContentHashes: () => manager.clearContentHashes(),
    getStats: () => manager.getIncrementalStats()
  }
}