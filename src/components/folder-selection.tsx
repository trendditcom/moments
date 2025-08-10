'use client'

import { useState } from 'react'
import { Folder, RefreshCw, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCatalogStore } from '@/store/catalog-store'

export function FolderSelection() {
  const { folderSelection, isLoading, hydrateCatalogs, setFolderSelection } = useCatalogStore()
  const [selectedCompaniesPath, setSelectedCompaniesPath] = useState(
    folderSelection.companiesPath || ''
  )
  const [selectedTechnologiesPath, setSelectedTechnologiesPath] = useState(
    folderSelection.technologiesPath || ''
  )

  const handleFolderSelect = async (type: 'companies' | 'technologies') => {
    // For demo purposes, we'll use predefined paths
    // In a real app, this would open a folder picker dialog
    const predefinedPaths = {
      companies: './companies',
      technologies: './technologies'
    }

    const path = predefinedPaths[type]
    
    if (type === 'companies') {
      setSelectedCompaniesPath(path)
      setFolderSelection({ companiesPath: path })
    } else {
      setSelectedTechnologiesPath(path)
      setFolderSelection({ technologiesPath: path })
    }
  }

  const handleHydrateCatalogs = async () => {
    await hydrateCatalogs(
      selectedCompaniesPath || undefined,
      selectedTechnologiesPath || undefined
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Companies Folder
          </label>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFolderSelect('companies')}
              className="flex items-center space-x-2"
            >
              <Folder className="w-4 h-4" />
              <span>Select Folder</span>
            </Button>
          </div>
          {selectedCompaniesPath && (
            <p className="text-xs text-muted-foreground">
              Selected: {selectedCompaniesPath}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Technologies Folder
          </label>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFolderSelect('technologies')}
              className="flex items-center space-x-2"
            >
              <Folder className="w-4 h-4" />
              <span>Select Folder</span>
            </Button>
          </div>
          {selectedTechnologiesPath && (
            <p className="text-xs text-muted-foreground">
              Selected: {selectedTechnologiesPath}
            </p>
          )}
        </div>
      </div>

      {(selectedCompaniesPath || selectedTechnologiesPath) && (
        <Button
          onClick={handleHydrateCatalogs}
          disabled={isLoading}
          className="w-full sm:w-auto flex items-center space-x-2"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Database className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Processing...' : 'Hydrate Catalogs'}</span>
        </Button>
      )}

      {folderSelection.lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Last updated: {folderSelection.lastUpdated.toLocaleString()}
        </p>
      )}
    </div>
  )
}

