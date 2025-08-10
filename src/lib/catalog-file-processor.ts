'use client'

import { Company, Technology } from '@/types/catalog'
import { loadConfigClient } from '@/lib/config-loader.client'

/**
 * File system processor for catalog data (companies and technologies)
 * Handles loading from and saving to filesystem with local storage as cache
 */
export class CatalogFileProcessor {
  private static instance: CatalogFileProcessor
  
  private constructor() {}
  
  static getInstance(): CatalogFileProcessor {
    if (!CatalogFileProcessor.instance) {
      CatalogFileProcessor.instance = new CatalogFileProcessor()
    }
    return CatalogFileProcessor.instance
  }

  /**
   * Load companies from filesystem
   */
  async loadCompanies(folderPath?: string): Promise<{
    companies: Company[]
    errors: string[]
    source: string
  }> {
    try {
      console.log('[CatalogFileProcessor] Loading companies from filesystem...')
      
      // Use provided path or get from config
      let companiesPath = folderPath
      if (!companiesPath) {
        const config = await loadConfigClient()
        companiesPath = config.catalogs.companies?.default_folder || './companies'
      }
      
      const response = await fetch(`/api/companies/load?folderPath=${encodeURIComponent(companiesPath)}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load companies')
      }
      
      console.log(`[CatalogFileProcessor] Loaded ${result.data.length} companies from ${result.source}`)
      
      return {
        companies: result.data,
        errors: [],
        source: result.source
      }
      
    } catch (error) {
      console.error('[CatalogFileProcessor] Error loading companies:', error)
      return {
        companies: [],
        errors: [error instanceof Error ? error.message : 'Unknown error loading companies'],
        source: folderPath || './companies'
      }
    }
  }

  /**
   * Load technologies from filesystem
   */
  async loadTechnologies(folderPath?: string): Promise<{
    technologies: Technology[]
    errors: string[]
    source: string
  }> {
    try {
      console.log('[CatalogFileProcessor] Loading technologies from filesystem...')
      
      // Use provided path or get from config
      let technologiesPath = folderPath
      if (!technologiesPath) {
        const config = await loadConfigClient()
        technologiesPath = config.catalogs.technologies?.default_folder || './technologies'
      }
      
      const response = await fetch(`/api/technologies/load?folderPath=${encodeURIComponent(technologiesPath)}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load technologies')
      }
      
      console.log(`[CatalogFileProcessor] Loaded ${result.data.length} technologies from ${result.source}`)
      
      return {
        technologies: result.data,
        errors: [],
        source: result.source
      }
      
    } catch (error) {
      console.error('[CatalogFileProcessor] Error loading technologies:', error)
      return {
        technologies: [],
        errors: [error instanceof Error ? error.message : 'Unknown error loading technologies'],
        source: folderPath || './technologies'
      }
    }
  }

  /**
   * Check companies folder status
   */
  async checkCompaniesFolder(folderPath?: string): Promise<{
    exists: boolean
    writable: boolean
    count: number
    path: string
  }> {
    try {
      let companiesPath = folderPath
      if (!companiesPath) {
        const config = await loadConfigClient()
        companiesPath = config.catalogs.companies?.default_folder || './companies'
      }
      
      const response = await fetch(`/api/companies/status?folderPath=${encodeURIComponent(companiesPath)}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to check companies folder')
      }
      
      return {
        exists: result.exists,
        writable: result.writable,
        count: result.count,
        path: result.path
      }
      
    } catch (error) {
      console.error('[CatalogFileProcessor] Error checking companies folder:', error)
      return {
        exists: false,
        writable: false,
        count: 0,
        path: folderPath || './companies'
      }
    }
  }

  /**
   * Check technologies folder status
   */
  async checkTechnologiesFolder(folderPath?: string): Promise<{
    exists: boolean
    writable: boolean
    count: number
    path: string
  }> {
    try {
      let technologiesPath = folderPath
      if (!technologiesPath) {
        const config = await loadConfigClient()
        technologiesPath = config.catalogs.technologies?.default_folder || './technologies'
      }
      
      const response = await fetch(`/api/technologies/status?folderPath=${encodeURIComponent(technologiesPath)}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to check technologies folder')
      }
      
      return {
        exists: result.exists,
        writable: result.writable,
        count: result.count,
        path: result.path
      }
      
    } catch (error) {
      console.error('[CatalogFileProcessor] Error checking technologies folder:', error)
      return {
        exists: false,
        writable: false,
        count: 0,
        path: folderPath || './technologies'
      }
    }
  }

  /**
   * Get overall catalog status
   */
  async getCatalogStatus(): Promise<{
    companies: { exists: boolean; writable: boolean; count: number; path: string }
    technologies: { exists: boolean; writable: boolean; count: number; path: string }
    totalItems: number
    ready: boolean
  }> {
    const [companiesStatus, technologiesStatus] = await Promise.all([
      this.checkCompaniesFolder(),
      this.checkTechnologiesFolder()
    ])
    
    return {
      companies: companiesStatus,
      technologies: technologiesStatus,
      totalItems: companiesStatus.count + technologiesStatus.count,
      ready: companiesStatus.exists && technologiesStatus.exists
    }
  }

  /**
   * Load all catalog data from filesystem
   */
  async loadAllCatalogData(): Promise<{
    companies: Company[]
    technologies: Technology[]
    errors: string[]
    sources: { companies: string; technologies: string }
  }> {
    console.log('[CatalogFileProcessor] Loading all catalog data from filesystem...')
    
    const [companiesResult, technologiesResult] = await Promise.all([
      this.loadCompanies(),
      this.loadTechnologies()
    ])
    
    const allErrors = [...companiesResult.errors, ...technologiesResult.errors]
    
    console.log(`[CatalogFileProcessor] Loaded ${companiesResult.companies.length} companies, ${technologiesResult.technologies.length} technologies`)
    if (allErrors.length > 0) {
      console.warn(`[CatalogFileProcessor] ${allErrors.length} errors occurred during loading:`, allErrors)
    }
    
    return {
      companies: companiesResult.companies,
      technologies: technologiesResult.technologies,
      errors: allErrors,
      sources: {
        companies: companiesResult.source,
        technologies: technologiesResult.source
      }
    }
  }
}

// Export singleton instance
export const catalogFileProcessor = CatalogFileProcessor.getInstance()