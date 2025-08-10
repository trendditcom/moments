'use client'

import { useEffect, useState } from 'react'
import { Database, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCatalogStore } from '@/store/catalog-store'
import { loadConfigClient } from '@/lib/config-loader.client'
import { Config } from '@/lib/config-types'

interface CatalogStatusProps {
  hydrationStatus?: string | null
  hydrationError?: string | null
  isHydrating?: boolean
}

export function CatalogStatus({ hydrationStatus, hydrationError, isHydrating }: CatalogStatusProps) {
  const { companies, technologies, folderSelection, hydrateCatalogs, isLoading } = useCatalogStore()
  const [config, setConfig] = useState<Config | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadConfigClient().then(setConfig)
  }, [])

  const handleRefresh = async () => {
    if (!config) return
    
    setIsRefreshing(true)
    try {
      const companiesPath = config.catalogs.companies?.default_folder || './companies'
      const technologiesPath = config.catalogs.technologies?.default_folder || './technologies'
      
      await hydrateCatalogs(companiesPath, technologiesPath)
    } catch (error) {
      console.error('Failed to refresh catalogs:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const totalItems = companies.length + technologies.length
  const isLoadingAny = isLoading || isHydrating || isRefreshing
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {isLoadingAny ? (
          <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : hydrationError ? (
          <AlertCircle className="w-4 h-4 text-destructive" />
        ) : totalItems > 0 ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <Database className="w-4 h-4 text-muted-foreground" />
        )}
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Catalogs</span>
            {totalItems > 0 && (
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {companies.length} {config?.catalogs.companies?.name || 'Companies'}
                </Badge>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {technologies.length} {config?.catalogs.technologies?.name || 'Technologies'}
                </Badge>
              </div>
            )}
          </div>
          
          {hydrationStatus && (
            <span className="text-xs text-muted-foreground">
              {hydrationStatus}
            </span>
          )}
          
          {hydrationError && (
            <span className="text-xs text-destructive">
              {hydrationError}
            </span>
          )}
        </div>
      </div>

      {totalItems > 0 && !isLoadingAny && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          title="Refresh catalogs"
          className="h-8 w-8"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}