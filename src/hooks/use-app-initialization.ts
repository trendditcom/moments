'use client'

import { useEffect, useState } from 'react'
import { useCatalogStore } from '@/store/catalog-store'
import { loadConfigClient } from '@/lib/config-loader.client'
import { checkStorageHealth, inspectStorage } from '@/lib/persistence'
import { Config } from '@/lib/config-types'

export type InitializationPhase = 
  | 'starting'
  | 'checking-storage' 
  | 'loading-config'
  | 'hydrating-from-storage'
  | 'hydrating-from-config'
  | 'ready'
  | 'error'

export function useAppInitialization() {
  const [phase, setPhase] = useState<InitializationPhase>('starting')
  const [status, setStatus] = useState<string>('Initializing...')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  
  const { 
    companies, 
    technologies, 
    folderSelection,
    hydrateCatalogs,
    setFolderSelection,
    isLoading
  } = useCatalogStore()

  useEffect(() => {
    // Only run on client side after initial mount
    if (typeof window === 'undefined') return
    
    const initializeApp = async () => {
      try {
        // Phase 1: Check storage health
        setPhase('checking-storage')
        setStatus('Checking storage...')
        setProgress(10)
        
        const health = checkStorageHealth()
        if (!health.available) {
          throw new Error(`Storage unavailable: ${health.error}`)
        }
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 150))
        
        // Phase 2: Load configuration
        setPhase('loading-config')
        setStatus('Loading configuration...')
        setProgress(25)
        
        const config: Config = await loadConfigClient()
        if (!config || !config.catalogs) {
          throw new Error('Invalid configuration: missing catalogs')
        }
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Phase 3: Check if we need to hydrate from storage or fresh load
        setPhase('hydrating-from-storage')
        setStatus('Checking stored data...')
        setProgress(40)
        
        inspectStorage()
        
        // Wait a moment for store hydration to complete
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const hasExistingData = companies.length > 0 || technologies.length > 0
        const hasStoredSelection = folderSelection.companiesPath || folderSelection.technologiesPath
        
        if (hasExistingData) {
          // Data already loaded from storage
          setPhase('ready')
          setStatus('Catalogs loaded from storage')
          setProgress(100)
          console.log('[AppInit] Using existing data from storage')
          return
        }
        
        if (hasStoredSelection && !hasExistingData) {
          // We have folder selections but no data - recovery scenario
          setPhase('hydrating-from-storage')
          setStatus('Restoring from stored selections...')
          setProgress(60)
          
          await hydrateCatalogs(
            folderSelection.companiesPath || undefined,
            folderSelection.technologiesPath || undefined
          )
          
          setPhase('ready')
          setStatus('Catalogs restored')
          setProgress(100)
          console.log('[AppInit] Restored catalogs from stored selections')
          return
        }
        
        // Phase 4: Fresh hydration from config
        setPhase('hydrating-from-config')
        setStatus('Loading catalogs from configuration...')
        setProgress(70)
        
        const companiesPath = config.catalogs.companies?.default_folder || './companies'
        const technologiesPath = config.catalogs.technologies?.default_folder || './technologies'
        
        console.log('[AppInit] Fresh hydration from config paths:', {
          companies: companiesPath,
          technologies: technologiesPath
        })
        
        // Set folder selections
        setFolderSelection({
          companiesPath,
          technologiesPath
        })
        
        setProgress(80)
        setStatus('Processing content...')
        
        // Hydrate catalogs
        await hydrateCatalogs(companiesPath, technologiesPath)
        
        // Phase 5: Complete
        setPhase('ready')
        setStatus('Catalogs ready')
        setProgress(100)
        setError(null)
        
        console.log('[AppInit] Initialization completed successfully')
        
      } catch (initError) {
        console.error('[AppInit] Initialization failed:', initError)
        setError(initError instanceof Error ? initError.message : 'Initialization failed')
        setPhase('error')
        setStatus('Failed to initialize')
        setProgress(0)
      }
    }
    
    // Start initialization after a brief delay for smooth UX
    const timer = setTimeout(initializeApp, 50)
    return () => clearTimeout(timer)
  }, []) // Only run once on mount
  
  // Update progress when store loading state changes
  useEffect(() => {
    if (isLoading && phase === 'hydrating-from-config') {
      // Animate progress during actual catalog processing
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev
          return prev + 1
        })
      }, 100)
      
      return () => clearInterval(interval)
    }
  }, [isLoading, phase])
  
  const isInitializing = phase !== 'ready' && phase !== 'error'
  const hasData = companies.length > 0 || technologies.length > 0
  
  return {
    phase,
    status,
    error,
    progress,
    isInitializing,
    hasData,
    isLoading: isLoading || isInitializing
  }
}