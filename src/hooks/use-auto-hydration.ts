'use client'

import { useEffect, useState } from 'react'
import { useCatalogStore } from '@/store/catalog-store'
import { loadConfigClient } from '@/lib/config-loader.client'
import { Config } from '@/lib/config-types'

export function useAutoHydration() {
  const [isHydrating, setIsHydrating] = useState(false)
  const [hydrationStatus, setHydrationStatus] = useState<string | null>(null)
  const [hydrationError, setHydrationError] = useState<string | null>(null)
  
  const { 
    companies, 
    technologies, 
    hydrateCatalogs,
    setFolderSelection 
  } = useCatalogStore()

  useEffect(() => {
    // Only run on client side after initial mount
    if (typeof window === 'undefined') return
    
    const performAutoHydration = async () => {
      // Skip if already have data
      if (companies.length > 0 || technologies.length > 0) {
        console.log('[AutoHydration] Catalogs already loaded, skipping auto-hydration')
        setHydrationStatus('Catalogs loaded')
        return
      }
      
      setIsHydrating(true)
      setHydrationStatus('Loading configuration...')
      console.log('[AutoHydration] Starting auto-hydration from config.yml')
      
      try {
        // Load configuration
        const config: Config = await loadConfigClient()
        
        if (!config || !config.catalogs) {
          throw new Error('Invalid configuration: missing catalogs')
        }
        
        // Get folder paths from config
        const companiesPath = config.catalogs.companies?.default_folder || './companies'
        const technologiesPath = config.catalogs.technologies?.default_folder || './technologies'
        
        console.log('[AutoHydration] Using configured paths:', {
          companies: companiesPath,
          technologies: technologiesPath
        })
        
        setHydrationStatus('Loading catalogs...')
        
        // Set folder selections to match config
        setFolderSelection({
          companiesPath,
          technologiesPath
        })
        
        // Hydrate catalogs from configured folders
        await hydrateCatalogs(companiesPath, technologiesPath)
        
        console.log('[AutoHydration] Auto-hydration completed successfully')
        setHydrationStatus('Catalogs ready')
        setHydrationError(null)
      } catch (error) {
        console.error('[AutoHydration] Failed to auto-hydrate:', error)
        setHydrationError(error instanceof Error ? error.message : 'Auto-hydration failed')
        setHydrationStatus('Failed to load catalogs')
      } finally {
        setIsHydrating(false)
      }
    }
    
    // Delay to ensure stores are ready
    const timer = setTimeout(() => {
      performAutoHydration()
    }, 100)
    
    return () => clearTimeout(timer)
  }, []) // Only run once on mount
  
  return {
    isHydrating,
    hydrationStatus,
    hydrationError
  }
}