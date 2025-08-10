'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CatalogState, CatalogActions, Company, Technology } from '@/types/catalog'
import { processFolder } from '@/lib/content-processor'
import { createPersistStorage } from '@/lib/persistence'

interface CatalogStore extends CatalogState, CatalogActions {}

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

          // Clear existing catalogs to prevent duplicates
          clearCatalogs()

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
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to process folders')
        } finally {
          setLoading(false)
        }
      },
    }),
    {
      name: 'moments-catalog-store',
      version: 1,
      storage: createJSONStorage(() => createPersistStorage('moments-catalog-store')),
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