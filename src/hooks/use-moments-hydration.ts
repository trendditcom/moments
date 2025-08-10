'use client'

import { useEffect, useState } from 'react'
import { useMomentsStore } from '@/store/moments-store'
import { loadConfigClient } from '@/lib/config-loader.client'

export function useMomentsHydration() {
  const [isHydrating, setIsHydrating] = useState(false)
  const [hydrationStatus, setHydrationStatus] = useState<string | null>(null)
  const [hydrationError, setHydrationError] = useState<string | null>(null)
  
  const { 
    moments,
    hydrateFromFiles,
    checkFileSystemStatus
  } = useMomentsStore()

  useEffect(() => {
    // Only run on client side after initial mount
    if (typeof window === 'undefined') return
    
    const performMomentsHydration = async () => {
      try {
        // Load configuration to check if moments hydration is enabled
        const config = await loadConfigClient()
        
        if (!config?.catalogs?.moments) {
          console.log('[MomentsHydration] Moments catalog not configured, skipping hydration')
          return
        }

        const momentsConfig = config.catalogs.moments
        
        // Check if bidirectional sync is enabled
        if (momentsConfig.sync_mode !== 'bidirectional') {
          console.log('[MomentsHydration] Bidirectional sync not enabled, skipping file hydration')
          return
        }

        // Check file system status first
        setHydrationStatus('Checking moments folder...')
        const status = await checkFileSystemStatus()
        
        if (!status.exists) {
          console.log('[MomentsHydration] Moments folder does not exist, skipping file hydration')
          setHydrationStatus('Moments folder not found')
          return
        }

        if (status.count === 0) {
          console.log('[MomentsHydration] No moment files found, skipping hydration')
          setHydrationStatus('No moment files found')
          return
        }

        // Skip if we already have moments in memory and they match file count
        if (moments.length >= status.count) {
          console.log('[MomentsHydration] Moments already loaded in memory, skipping hydration')
          setHydrationStatus(`${moments.length} moments loaded`)
          return
        }

        console.log(`[MomentsHydration] Found ${status.count} moment files, starting hydration`)
        setIsHydrating(true)
        setHydrationStatus('Loading moments from files...')
        
        // Hydrate moments from files
        const result = await hydrateFromFiles()
        
        if (result.loaded > 0) {
          console.log(`[MomentsHydration] Successfully loaded ${result.loaded} moments from files`)
          setHydrationStatus(`Loaded ${result.loaded} moments from files`)
        } else {
          console.log('[MomentsHydration] No moments loaded from files')
          setHydrationStatus('No moments loaded')
        }

        if (result.errors > 0) {
          console.warn(`[MomentsHydration] ${result.errors} errors occurred during hydration`)
          setHydrationError(`${result.errors} files failed to load`)
        }
        
      } catch (error) {
        console.error('[MomentsHydration] Error during auto-hydration:', error)
        setHydrationError(error instanceof Error ? error.message : 'Failed to hydrate moments')
      } finally {
        setIsHydrating(false)
      }
    }
    
    // Delay hydration slightly to allow the app to initialize
    const timer = setTimeout(performMomentsHydration, 1000)
    return () => clearTimeout(timer)
    
  }, []) // Only run once on mount

  return {
    isHydrating,
    hydrationStatus,
    hydrationError,
    clearError: () => setHydrationError(null)
  }
}