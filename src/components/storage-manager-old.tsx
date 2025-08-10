'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  checkStorageHealth, 
  backupStorage, 
  restoreStorage, 
  clearAppStorage, 
  inspectStorage 
} from '@/lib/persistence'
import { useCatalogStore } from '@/store/catalog-store'
import { useMomentsStore } from '@/store/moments-store'
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export function StorageManager() {
  const [storageHealth, setStorageHealth] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [backup, setBackup] = useState<any>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const { companies, technologies, folderSelection } = useCatalogStore()
  const { moments, lastAnalysisAt } = useMomentsStore()

  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = () => {
    const health = checkStorageHealth()
    setStorageHealth(health)
  }

  const handleBackup = () => {
    const data = backupStorage()
    if (data) {
      setBackup(data)
      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `moments-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Backup created and downloaded successfully' })
    } else {
      setMessage({ type: 'error', text: 'Failed to create backup' })
    }
  }

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        const success = restoreStorage(data)
        if (success) {
          setMessage({ type: 'success', text: 'Storage restored successfully. Please refresh the page.' })
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        } else {
          setMessage({ type: 'error', text: 'Failed to restore storage' })
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid backup file' })
      }
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all stored data? This cannot be undone.')) {
      clearAppStorage()
      setMessage({ type: 'info', text: 'Storage cleared. Please refresh the page.' })
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  }

  const handleInspect = () => {
    inspectStorage()
    setMessage({ type: 'info', text: 'Check browser console for storage details' })
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Storage Health
            {storageHealth?.available ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>
            Monitor and manage local storage persistence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageHealth && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Storage Available</span>
                <Badge variant={storageHealth.available ? 'default' : 'destructive'}>
                  {storageHealth.available ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              {storageHealth.available && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Space Used</span>
                    <span className="text-sm font-mono">
                      {Math.round(storageHealth.usedSpace / 1024)}KB / {Math.round(storageHealth.estimatedMaxSpace / 1024 / 1024)}MB
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Usage</span>
                    <span className="text-sm font-mono">
                      {storageHealth.percentUsed.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">App Keys</span>
                    <span className="text-sm font-mono">
                      {storageHealth.keys?.length || 0}
                    </span>
                  </div>
                </>
              )}
              
              {storageHealth.error && (
                <div className="text-sm text-red-500">
                  Error: {storageHealth.error}
                </div>
              )}
            </div>
          )}
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Current State</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Companies</span>
                <span>{companies.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Technologies</span>
                <span>{technologies.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Moments</span>
                <span>{moments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Analysis</span>
                <span>{lastAnalysisAt ? new Date(lastAnalysisAt).toLocaleString() : 'Never'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Companies Folder</span>
                <span className="truncate max-w-[200px] font-mono text-xs">
                  {folderSelection.companiesPath || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Technologies Folder</span>
                <span className="truncate max-w-[200px] font-mono text-xs">
                  {folderSelection.technologiesPath || 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage Actions</CardTitle>
          <CardDescription>
            Backup, restore, or manage your stored data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackup}
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Backup
            </Button>
            
            <label htmlFor="restore-input">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex items-center gap-2 w-full"
              >
                <span>
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Restore
                </span>
              </Button>
              <input
                id="restore-input"
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="hidden"
              />
            </label>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleInspect}
              className="flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              Inspect
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Check Health
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh Page
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
              className="flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {message && (
        <Card className={
          message.type === 'error' ? 'border-red-500' : 
          message.type === 'success' ? 'border-green-500' : 
          'border-blue-500'
        }>
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              {message.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />}
              {message.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />}
              {message.type === 'info' && <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />}
              <p className="text-sm">{message.text}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}