'use client'

import { useState } from 'react'
import { useMomentsStore } from '@/store/moments-store'

export function useMomentsRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  
  const { hydrateFromFiles } = useMomentsStore()

  // Manual refresh function
  const refreshMoments = async () => {
    if (isRefreshing) return
    
    try {
      setIsRefreshing(true)
      console.log('[MomentsRefresh] Manual refresh triggered')
      
      const result = await hydrateFromFiles()
      
      if (result.loaded > 0) {
        console.log(`[MomentsRefresh] Refreshed ${result.loaded} moments`)
        setLastRefresh(new Date())
      }
      
      return result
    } catch (error) {
      console.error('[MomentsRefresh] Error refreshing moments:', error)
      throw error
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    isRefreshing,
    lastRefresh,
    refreshMoments
  }
}