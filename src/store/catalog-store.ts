'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CatalogState, CatalogActions, Company, Technology } from '@/types/catalog'
import { processFolder } from '@/lib/content-processor'
import { createPersistStorage, createFileFirstStorage } from '@/lib/persistence'
import { catalogFileProcessor } from '@/lib/catalog-file-processor'
import { loadConfigClient } from '@/lib/config-loader.client'

interface CatalogStore extends CatalogState, CatalogActions {
  // File-first persistence methods
  hydrateFromFiles: () => Promise<{ loaded: number; errors: number }>
  checkFileSystemStatus: () => Promise<{ 
    companies: { exists: boolean; count: number; path: string }
    technologies: { exists: boolean; count: number; path: string }
    totalItems: number
    ready: boolean 
  }>
}

export const useCatalogStore = create<CatalogStore>()(
  persist(
    (set, get) => ({
      // State
      companies: [],
      technologies: [],
      folderSelection: {
        companiesPath: null,
        technologiesPath: null,
        lastUpdated: null,
      },
      isLoading: false,
      error: null,

      // Actions
      setFolderSelection: (selection) =>
        set((state) => ({
          folderSelection: {
            ...state.folderSelection,
            ...selection,
            lastUpdated: new Date(),
          },
        })),

      addCompanies: (companies) =>
        set(() => ({
          companies: companies,
        })),

      addTechnologies: (technologies) =>
        set(() => ({
          technologies: technologies,
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearCatalogs: () =>
        set({
          companies: [],
          technologies: [],
          error: null,
        }),

      hydrateCatalogs: async (companiesPath, technologiesPath) => {
        const { setLoading, setError, addCompanies, addTechnologies, setFolderSelection, clearCatalogs } = get()
        
        try {
          setLoading(true)
          setError(null)

          // Check if we should use file-first persistence
          const config = await loadConfigClient()
          const persistenceStrategy = config.persistence?.strategy || 'file_system_first'
          
          // Clear existing catalogs to prevent duplicates
          clearCatalogs()

          if (persistenceStrategy === 'file_system_first') {
            console.log('[CatalogStore] Using file-first hydration strategy')
            
            // Load from files using the file processor
            const result = await catalogFileProcessor.loadAllCatalogData()
            
            // Update state with file data
            addCompanies(result.companies)
            addTechnologies(result.technologies)
            
            // Update folder selections to match file sources
            setFolderSelection({
              companiesPath: result.sources.companies,
              technologiesPath: result.sources.technologies
            })
            
            if (result.errors.length > 0) {
              console.warn('[CatalogStore] File hydration errors:', result.errors)
              setError(`Loaded catalogs with ${result.errors.length} warnings`)
            }
            
            console.log(`[CatalogStore] File-first hydration completed: ${result.companies.length} companies, ${result.technologies.length} technologies`)
          } else {
            // Fallback to original folder processing (legacy mode)
            console.log('[CatalogStore] Using legacy folder processing')
            
            // Update folder selection
            if (companiesPath || technologiesPath) {
              setFolderSelection({
                ...(companiesPath && { companiesPath }),
                ...(technologiesPath && { technologiesPath }),
              })
            }

            const currentSelection = get().folderSelection

            // Process companies folder
            if (companiesPath || currentSelection.companiesPath) {
              const path = companiesPath || currentSelection.companiesPath!
              const companies = await processFolder(path, 'companies') as Company[]
              addCompanies(companies)
            }

            // Process technologies folder
            if (technologiesPath || currentSelection.technologiesPath) {
              const path = technologiesPath || currentSelection.technologiesPath!
              const technologies = await processFolder(path, 'technologies') as Technology[]
              addTechnologies(technologies)
            }
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to process folders')
        } finally {
          setLoading(false)
        }
      },

      // File-first persistence methods
      hydrateFromFiles: async () => {
        try {
          console.log('[CatalogStore] Loading catalogs from file system...')
          const { setLoading, addCompanies, addTechnologies, setFolderSelection } = get()
          
          setLoading(true)
          
          const result = await catalogFileProcessor.loadAllCatalogData()
          
          if (result.companies.length > 0 || result.technologies.length > 0) {
            // Replace existing data with file data
            addCompanies(result.companies)
            addTechnologies(result.technologies)
            
            // Update folder selections
            setFolderSelection({
              companiesPath: result.sources.companies,
              technologiesPath: result.sources.technologies,
              lastUpdated: new Date()
            })
            
            console.log(`[CatalogStore] Hydrated ${result.companies.length} companies, ${result.technologies.length} technologies from files`)
            return { loaded: result.companies.length + result.technologies.length, errors: result.errors.length }
          }
          
          return { loaded: 0, errors: result.errors.length }
        } catch (error) {
          console.error('[CatalogStore] Error hydrating from files:', error)
          return { loaded: 0, errors: 1 }
        } finally {
          set({ isLoading: false })
        }
      },

      checkFileSystemStatus: async () => {
        try {
          const status = await catalogFileProcessor.getCatalogStatus()
          return status
        } catch (error) {
          console.error('[CatalogStore] Error checking file system status:', error)
          return {
            companies: { exists: false, count: 0, path: './companies' },
            technologies: { exists: false, count: 0, path: './technologies' },
            totalItems: 0,
            ready: false
          }
        }
      },
    }),
    {
      name: 'moments-catalog-store',
      version: 1,
      storage: createJSONStorage(() => {
        // Determine storage strategy based on environment or config
        // For now, we'll default to file-first but can be overridden
        try {
          return createFileFirstStorage('catalog', 'companies') // Will handle both companies and technologies
        } catch (error) {
          console.warn('[CatalogStore] Falling back to localStorage-only persistence:', error)
          return createPersistStorage('moments-catalog-store')
        }
      }),
      partialize: (state) => ({
        folderSelection: state.folderSelection,
        companies: state.companies,
        technologies: state.technologies,
      }),
      migrate: (persistedState: any, version: number) => {
        console.log(`[CatalogStore] Migrating from version ${version} to 1`)
        if (version === 0) {
          // Version 0 to 1: no structural changes needed, just version bump
          return persistedState
        }
        return persistedState
      },
      onRehydrateStorage: () => (state) => {
        console.log('[CatalogStore] Rehydration complete', {
          companies: state?.companies?.length || 0,
          technologies: state?.technologies?.length || 0,
          folderSelection: state?.folderSelection
        })
      },
    }
  )
)