'use client'

import { useEffect, useState } from 'react'
import { useCatalogStore } from '@/store/catalog-store'
import { useMomentsStore } from '@/store/moments-store'
import { inspectStorage, checkStorageHealth } from '@/lib/persistence'

export function useAutoRecovery() {
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null)
  
  const { 
    companies, 
    technologies, 
    folderSelection, 
    hydrateCatalogs 
  } = useCatalogStore()
  
  const { moments } = useMomentsStore()

  useEffect(() => {
    // Only run on client side after initial mount
    if (typeof window === 'undefined') return
    
    const performRecovery = async () => {
      setIsRecovering(true)
      console.log('[AutoRecovery] Starting recovery check...')
      
      try {
        // Check storage health
        const health = checkStorageHealth()
        console.log('[AutoRecovery] Storage health:', health)
        
        if (!health.available) {
          console.error('[AutoRecovery] Storage not available:', health.error)
          setRecoveryStatus('Storage unavailable')
          return
        }
        
        // Inspect current storage state
        inspectStorage()
        
        // Log current state
        console.log('[AutoRecovery] Current state:', {
          companies: companies.length,
          technologies: technologies.length,
          moments: moments.length,
          folderSelection
        })
        
        // If we have folder selections but no catalog data, try to rehydrate
        if (folderSelection.companiesPath || folderSelection.technologiesPath) {
          if (companies.length === 0 && technologies.length === 0) {
            console.log('[AutoRecovery] Folder selections found but catalogs empty, rehydrating...')
            setRecoveryStatus('Rehydrating catalogs...')
            
            try {
              await hydrateCatalogs(
                folderSelection.companiesPath || undefined,
                folderSelection.technologiesPath || undefined
              )
              console.log('[AutoRecovery] Catalogs rehydrated successfully')
              setRecoveryStatus('Recovery complete')
            } catch (error) {
              console.error('[AutoRecovery] Failed to rehydrate catalogs:', error)
              setRecoveryStatus('Recovery failed')
            }
          } else {
            console.log('[AutoRecovery] Data already loaded, no recovery needed')
            setRecoveryStatus('Data loaded')
          }
        } else {
          console.log('[AutoRecovery] No folder selections found, fresh start')
          setRecoveryStatus('Ready')
        }
      } catch (error) {
        console.error('[AutoRecovery] Recovery error:', error)
        setRecoveryStatus('Recovery error')
      } finally {
        setIsRecovering(false)
      }
    }
    
    // Delay recovery to ensure stores are fully hydrated
    const timer = setTimeout(() => {
      performRecovery()
    }, 500)
    
    return () => clearTimeout(timer)
  }, []) // Only run once on mount
  
  return {
    isRecovering,
    recoveryStatus
  }
}