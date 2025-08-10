'use client'

import { StateStorage } from 'zustand/middleware'
import { loadConfigClient } from '@/lib/config-loader.client'
import { catalogFileProcessor } from '@/lib/catalog-file-processor'
import { momentFileProcessor } from '@/lib/moment-file-processor'

// Storage version for handling migrations
const STORAGE_VERSION = 1

// Custom storage wrapper with error handling and versioning
export const createPersistStorage = (name: string): StateStorage => {
  return {
    getItem: (key: string) => {
      try {
        if (typeof window === 'undefined') {
          return null
        }
        
        const item = localStorage.getItem(key)
        if (!item) {
          console.log(`[Persistence] No data found for ${key}`)
          return null
        }
        
        const parsed = JSON.parse(item)
        
        // Check version and handle migrations
        if (parsed.version !== STORAGE_VERSION) {
          console.log(`[Persistence] Version mismatch for ${key}. Expected ${STORAGE_VERSION}, got ${parsed.version || 0}`)
          // Let Zustand handle migration via its migrate function
          // We'll pass through the data and let the store decide
        }
        
        console.log(`[Persistence] Loaded ${key} with ${Object.keys(parsed.state || {}).length} state keys`)
        return item
      } catch (error) {
        console.error(`[Persistence] Failed to load ${key}:`, error)
        // Clear corrupted data
        try {
          localStorage.removeItem(key)
        } catch (e) {
          console.error(`[Persistence] Failed to clear corrupted data for ${key}:`, e)
        }
        return null
      }
    },
    
    setItem: (key: string, value: string) => {
      try {
        if (typeof window === 'undefined') {
          return
        }
        
        // Add version to stored data
        const parsed = JSON.parse(value)
        const versioned = {
          ...parsed,
          version: STORAGE_VERSION,
          lastUpdated: new Date().toISOString()
        }
        
        localStorage.setItem(key, JSON.stringify(versioned))
        console.log(`[Persistence] Saved ${key} with ${Object.keys(parsed.state || {}).length} state keys`)
      } catch (error) {
        console.error(`[Persistence] Failed to save ${key}:`, error)
        
        // Check if it's a quota exceeded error
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('[Persistence] LocalStorage quota exceeded. Attempting to clear old data...')
          // Could implement LRU cache or cleanup logic here
        }
      }
    },
    
    removeItem: (key: string) => {
      try {
        if (typeof window === 'undefined') {
          return
        }
        
        localStorage.removeItem(key)
        console.log(`[Persistence] Removed ${key}`)
      } catch (error) {
        console.error(`[Persistence] Failed to remove ${key}:`, error)
      }
    }
  }
}

// Hook to check if client-side hydration is complete
export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    setHydrated(true)
  }, [])
  
  return hydrated
}

// Storage health check utility
export const checkStorageHealth = () => {
  if (typeof window === 'undefined') {
    return { available: false, error: 'Server-side environment' }
  }
  
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    
    // Check available space (rough estimate)
    let usedSpace = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        usedSpace += localStorage[key].length + key.length
      }
    }
    
    // localStorage typically has a 5-10MB limit
    const estimatedMaxSpace = 5 * 1024 * 1024 // 5MB in bytes
    const percentUsed = (usedSpace / estimatedMaxSpace) * 100
    
    return {
      available: true,
      usedSpace,
      estimatedMaxSpace,
      percentUsed,
      keys: Object.keys(localStorage).filter(k => k.includes('moments'))
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Storage unavailable'
    }
  }
}

// Migration utilities for future schema changes
export const migrateStorage = (oldVersion: number, newVersion: number, data: any): any => {
  console.log(`[Persistence] Migrating from version ${oldVersion} to ${newVersion}`)
  
  // Migration from v0 to v1: no structural changes needed
  if (oldVersion === 0 && newVersion === 1) {
    console.log('[Persistence] Migrating v0 to v1: version bump only')
    return data
  }
  
  // Future migrations would go here
  if (oldVersion < 1 && newVersion >= 1) {
    // Add any necessary transformations here
  }
  
  return data
}

// Backup and restore utilities
export const backupStorage = () => {
  if (typeof window === 'undefined') return null
  
  const backup: Record<string, any> = {}
  const keys = ['moments-catalog-store', 'moments-store']
  
  for (const key of keys) {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        backup[key] = JSON.parse(item)
      }
    } catch (error) {
      console.error(`[Persistence] Failed to backup ${key}:`, error)
    }
  }
  
  return backup
}

export const restoreStorage = (backup: Record<string, any>) => {
  if (typeof window === 'undefined') return false
  
  try {
    for (const [key, value] of Object.entries(backup)) {
      localStorage.setItem(key, JSON.stringify(value))
    }
    console.log('[Persistence] Storage restored successfully')
    return true
  } catch (error) {
    console.error('[Persistence] Failed to restore storage:', error)
    return false
  }
}

// Clear all app storage
export const clearAppStorage = () => {
  if (typeof window === 'undefined') return
  
  const keys = ['moments-catalog-store', 'moments-store']
  keys.forEach(key => {
    try {
      localStorage.removeItem(key)
      console.log(`[Persistence] Cleared ${key}`)
    } catch (error) {
      console.error(`[Persistence] Failed to clear ${key}:`, error)
    }
  })
}

// Debug helper to inspect storage
export const inspectStorage = () => {
  if (typeof window === 'undefined') {
    console.log('[Persistence] Cannot inspect storage on server-side')
    return
  }
  
  const keys = ['moments-catalog-store', 'moments-store']
  
  keys.forEach(key => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        const parsed = JSON.parse(item)
        console.log(`[Persistence] ${key}:`, {
          version: parsed.version,
          lastUpdated: parsed.lastUpdated,
          stateKeys: Object.keys(parsed.state || {}),
          state: parsed.state
        })
      } else {
        console.log(`[Persistence] ${key}: No data`)
      }
    } catch (error) {
      console.error(`[Persistence] Failed to inspect ${key}:`, error)
    }
  })
}

import { useState, useEffect } from 'react'

/**
 * File-first persistence storage that uses filesystem as primary source of truth
 * and localStorage only for caching and performance optimization
 */
export const createFileFirstStorage = (storeName: string, catalogType?: 'companies' | 'technologies' | 'moments'): StateStorage => {
  return {
    getItem: async (key: string) => {
      try {
        if (typeof window === 'undefined') {
          return null
        }
        
        // Load configuration to check persistence strategy
        const config = await loadConfigClient()
        const persistenceStrategy = config.persistence?.strategy || 'file_system_first'
        
        if (persistenceStrategy === 'file_system_first') {
          console.log(`[FileFirstStorage] Loading ${storeName} from file system first`)
          
          // Try to load from filesystem first
          let fileData: any = null
          
          if (catalogType === 'companies') {
            const result = await catalogFileProcessor.loadCompanies()
            if (result.companies.length > 0) {
              fileData = {
                state: {
                  companies: result.companies,
                  technologies: [], // Will be loaded separately
                  folderSelection: {
                    companiesPath: result.source,
                    technologiesPath: null,
                    lastUpdated: new Date()
                  }
                },
                version: STORAGE_VERSION,
                lastUpdated: new Date().toISOString(),
                source: 'filesystem'
              }
            }
          } else if (catalogType === 'technologies') {
            const result = await catalogFileProcessor.loadTechnologies()
            if (result.technologies.length > 0) {
              fileData = {
                state: {
                  companies: [], // Will be loaded separately
                  technologies: result.technologies,
                  folderSelection: {
                    companiesPath: null,
                    technologiesPath: result.source,
                    lastUpdated: new Date()
                  }
                },
                version: STORAGE_VERSION,
                lastUpdated: new Date().toISOString(),
                source: 'filesystem'
              }
            }
          } else if (catalogType === 'moments') {
            const fileMoments = await momentFileProcessor.loadMoments()
            if (fileMoments.length > 0) {
              fileData = {
                state: {
                  moments: fileMoments,
                  correlations: [],
                  lastAnalysisAt: new Date()
                },
                version: STORAGE_VERSION,
                lastUpdated: new Date().toISOString(),
                source: 'filesystem'
              }
            }
          }
          
          if (fileData) {
            // Cache in localStorage for performance
            try {
              localStorage.setItem(key, JSON.stringify({
                ...fileData,
                cached: true,
                cacheTimestamp: new Date().toISOString()
              }))
              console.log(`[FileFirstStorage] Cached ${storeName} data in localStorage`)
            } catch (cacheError) {
              console.warn(`[FileFirstStorage] Failed to cache ${storeName}:`, cacheError)
            }
            
            return JSON.stringify(fileData)
          }
        }
        
        // Fallback to localStorage (legacy behavior or when configured)
        console.log(`[FileFirstStorage] Loading ${storeName} from localStorage fallback`)
        const item = localStorage.getItem(key)
        if (!item) {
          console.log(`[FileFirstStorage] No data found for ${key}`)
          return null
        }
        
        const parsed = JSON.parse(item)
        
        // Check version and handle migrations
        if (parsed.version !== STORAGE_VERSION) {
          console.log(`[FileFirstStorage] Version mismatch for ${key}. Expected ${STORAGE_VERSION}, got ${parsed.version || 0}`)
        }
        
        console.log(`[FileFirstStorage] Loaded ${key} from localStorage with ${Object.keys(parsed.state || {}).length} state keys`)
        return item
        
      } catch (error) {
        console.error(`[FileFirstStorage] Failed to load ${key}:`, error)
        return null
      }
    },
    
    setItem: async (key: string, value: string) => {
      try {
        if (typeof window === 'undefined') {
          return
        }
        
        const config = await loadConfigClient()
        const persistenceStrategy = config.persistence?.strategy || 'file_system_first'
        
        // Always store in localStorage for immediate access
        const parsed = JSON.parse(value)
        const versioned = {
          ...parsed,
          version: STORAGE_VERSION,
          lastUpdated: new Date().toISOString(),
          cached: true
        }
        
        localStorage.setItem(key, JSON.stringify(versioned))
        console.log(`[FileFirstStorage] Cached ${key} in localStorage`)
        
        // If file_system_first, also save to filesystem
        if (persistenceStrategy === 'file_system_first') {
          try {
            // Note: File system saves are handled by the stores themselves
            // This is to avoid circular dependencies and to give stores control
            // over when and how they save to files
            console.log(`[FileFirstStorage] File system persistence handled by store for ${storeName}`)
          } catch (fileError) {
            console.error(`[FileFirstStorage] File save failed for ${storeName}, using localStorage only:`, fileError)
          }
        }
        
      } catch (error) {
        console.error(`[FileFirstStorage] Failed to save ${key}:`, error)
      }
    },
    
    removeItem: (key: string) => {
      try {
        if (typeof window === 'undefined') {
          return
        }
        
        // Remove from localStorage
        localStorage.removeItem(key)
        console.log(`[FileFirstStorage] Removed ${key} from cache`)
        
        // Note: File system cleanup would be handled separately by stores
        
      } catch (error) {
        console.error(`[FileFirstStorage] Failed to remove ${key}:`, error)
      }
    }
  }
}

/**
 * Enhanced storage health check that includes file system status
 */
export const checkEnhancedStorageHealth = async () => {
  const basicHealth = checkStorageHealth()
  
  try {
    // Check file system status for all catalog types
    const [companiesStatus, technologiesStatus, momentsStatus] = await Promise.all([
      catalogFileProcessor.checkCompaniesFolder(),
      catalogFileProcessor.checkTechnologiesFolder(),
      momentFileProcessor.checkMomentsFolder()
    ])
    
    return {
      ...basicHealth,
      filesystem: {
        companies: companiesStatus,
        technologies: technologiesStatus,
        moments: momentsStatus,
        totalFiles: companiesStatus.count + technologiesStatus.count + momentsStatus.count,
        allFoldersReady: companiesStatus.exists && technologiesStatus.exists && momentsStatus.exists
      }
    }
  } catch (error) {
    return {
      ...basicHealth,
      filesystem: {
        error: error instanceof Error ? error.message : 'Failed to check file system status'
      }
    }
  }
}