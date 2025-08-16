'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  checkStorageHealth, 
  backupStorage, 
  restoreStorage, 
  clearAppStorage, 
  inspectStorage 
} from '@/lib/persistence'
import { useCatalogStore } from '@/store/catalog-store'
import { useMomentsStore } from '@/store/moments-store'
import { ProviderConfig } from '@/components/settings/provider-config'
import { ProviderTest } from '@/components/settings/provider-test'
import { CacheManagement } from '@/components/settings/cache-management'
import type { ModelProviderConfig } from '@/lib/config-types'
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  onClick: () => void
  variant?: 'outline' | 'destructive' | 'default'
  disabled?: boolean
}

function ActionButton({ icon: Icon, label, description, onClick, variant = 'outline', disabled }: ActionButtonProps) {
  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="flex items-center gap-2 w-full justify-start"
      >
        <Icon className="w-4 h-4" />
        {label}
      </Button>
      <p className="text-xs text-muted-foreground leading-relaxed px-1">
        {description}
      </p>
    </div>
  )
}

interface StorageMetricProps {
  label: string
  value: string | React.ReactNode
  description: string
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

function StorageMetric({ label, value, description, variant = 'default' }: StorageMetricProps) {
  const variantStyles = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-amber-600',
    destructive: 'text-red-600'
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`text-sm font-mono ${variantStyles[variant]}`}>
          {value}
        </span>
      </div>
      <p className="text-xs text-muted-foreground/80 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

interface SettingsContentProps {
  section: 'health' | 'data' | 'management' | 'provider' | 'cache'
}

export function SettingsContent({ section }: SettingsContentProps) {
  const [storageHealth, setStorageHealth] = useState<any>(null)
  const [showInspectionResults, setShowInspectionResults] = useState(false)
  const [inspectionResults, setInspectionResults] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false)
  const [providerConfig, setProviderConfig] = useState<ModelProviderConfig | undefined>(undefined)

  const { companies, technologies } = useCatalogStore()
  const { moments, lastAnalysisAt } = useMomentsStore()

  useEffect(() => {
    checkHealth()
    loadProviderConfig()
  }, [])

  const checkHealth = async () => {
    setIsRunningHealthCheck(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const health = checkStorageHealth()
      setStorageHealth(health)
      setMessage({ type: 'success', text: 'Storage health check completed successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to check storage health' })
    } finally {
      setIsRunningHealthCheck(false)
    }
  }

  const loadProviderConfig = async () => {
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const config = await response.json()
        setProviderConfig(config.model_provider)
      }
    } catch (error) {
      console.error('Failed to load provider configuration:', error)
    }
  }

  const handleSaveProviderConfig = async (config: ModelProviderConfig) => {
    try {
      const response = await fetch('/api/provider/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      
      if (response.ok) {
        setProviderConfig(config)
        setMessage({ type: 'success', text: 'Provider configuration saved successfully' })
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save provider configuration' })
      throw error
    }
  }

  const handleTestProviderConfig = async (config: ModelProviderConfig) => {
    try {
      const response = await fetch('/api/provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          model: 'haiku',
          prompt: 'Test connection',
        }),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        return {
          success: true,
          message: 'Provider connection successful',
          details: result,
        }
      } else {
        return {
          success: false,
          message: result.error || 'Connection test failed',
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  const handleBackup = () => {
    try {
      const data = backupStorage()
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `moments-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        setMessage({ type: 'success', text: 'Backup file downloaded successfully. Keep it in a safe place!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to create backup. Check console for details.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Backup creation failed. Your data might be corrupted.' })
    }
  }

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setMessage({ type: 'error', text: 'Please select a valid JSON backup file.' })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid backup format')
        }
        
        const success = restoreStorage(data)
        if (success) {
          setMessage({ type: 'success', text: 'Backup restored successfully! Refreshing page in 3 seconds...' })
          setTimeout(() => {
            window.location.reload()
          }, 3000)
        } else {
          setMessage({ type: 'error', text: 'Failed to restore backup. The file might be corrupted.' })
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid backup file format. Please select a valid Moments backup.' })
      }
    }
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Failed to read the backup file.' })
    }
    reader.readAsText(file)
  }

  const handleInspect = () => {
    try {
      const originalConsoleLog = console.log
      let capturedData = ''
      
      console.log = (...args) => {
        capturedData += args.join(' ') + '\n'
        originalConsoleLog(...args)
      }
      
      inspectStorage()
      console.log = originalConsoleLog
      
      setInspectionResults(capturedData || 'Inspection completed. Check browser console for detailed logs.')
      setShowInspectionResults(true)
      setMessage({ type: 'info', text: 'Storage inspection completed. Results shown below and in browser console.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to inspect storage. Check browser permissions.' })
    }
  }

  const handleClear = () => {
    const totalItems = companies.length + technologies.length + moments.length
    const confirmMessage = totalItems > 0 
      ? `This will permanently delete ${companies.length} companies, ${technologies.length} technologies, and ${moments.length} moments. This cannot be undone. Are you sure?`
      : 'Are you sure you want to clear all stored data? This cannot be undone.'
      
    if (confirm(confirmMessage)) {
      try {
        clearAppStorage()
        setMessage({ type: 'info', text: 'All storage cleared. Refreshing page in 3 seconds...' })
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to clear storage. Try refreshing the page manually.' })
      }
    }
  }

  const handleReload = () => {
    if (confirm('This will reload the page and any unsaved changes will be lost. Continue?')) {
      window.location.reload()
    }
  }

  const handleSaveToFiles = async () => {
    try {
      setMessage({ type: 'info', text: 'Saving moments to files...' })
      
      const store = useMomentsStore.getState()
      const result = await store.saveToFiles()
      
      if (result.saved > 0) {
        setMessage({ 
          type: 'success', 
          text: `Successfully saved ${result.saved} moments to files${result.failed > 0 ? ` (${result.failed} failed)` : ''}.` 
        })
      } else {
        setMessage({ type: 'info', text: `No moments to save. Store has ${store.moments.length} moments.` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save moments to files.' })
      console.error('Error saving to files:', error)
    }
  }

  const handleLoadFromFiles = async () => {
    try {
      const confirmMessage = moments.length > 0 
        ? `This will replace your current ${moments.length} moments with data from files. Continue?`
        : 'Load moments from filesystem files?'
        
      if (!confirm(confirmMessage)) return

      setMessage({ type: 'info', text: 'Loading moments from files...' })
      
      const { hydrateFromFiles } = useMomentsStore.getState()
      const result = await hydrateFromFiles()
      
      if (result.loaded > 0) {
        setMessage({ 
          type: 'success', 
          text: `Successfully loaded ${result.loaded} moments from files${result.errors > 0 ? ` (${result.errors} errors)` : ''}.` 
        })
      } else {
        setMessage({ type: 'info', text: 'No moment files found to load.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load moments from files.' })
      console.error('Error loading from files:', error)
    }
  }

  const handleDebugStore = () => {
    try {
      const { debugStoreState } = useMomentsStore.getState()
      const state = debugStoreState()
      setMessage({ 
        type: 'info', 
        text: `Debug info logged to console. Store has ${state.moments.length} moments.` 
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to debug store state.' })
      console.error('Error debugging store:', error)
    }
  }


  const getStorageStatus = () => {
    if (!storageHealth) return { variant: 'default' as const, text: 'Unknown' }
    if (!storageHealth.available) return { variant: 'destructive' as const, text: 'Unavailable' }
    if (storageHealth.percentUsed > 80) return { variant: 'warning' as const, text: 'High Usage' }
    if (storageHealth.percentUsed > 50) return { variant: 'warning' as const, text: 'Moderate Usage' }
    return { variant: 'success' as const, text: 'Healthy' }
  }

  const storageStatus = getStorageStatus()
  const totalItems = companies.length + technologies.length + moments.length

  if (section === 'health') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Storage Health</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Monitor your browser&apos;s local storage capacity and health. All data is stored locally on your device.
          </p>
        </div>

        {storageHealth && (
          <div className="space-y-4">
            <StorageMetric
              label="Storage Status"
              value={
                <Badge variant={storageStatus.variant === 'success' ? 'default' : 'destructive'}>
                  {storageStatus.text}
                </Badge>
              }
              description="Overall health of your browser's storage system and capacity"
              variant={storageStatus.variant}
            />
            
            {storageHealth.available && (
              <>
                <StorageMetric
                  label="Space Usage"
                  value={`${Math.round(storageHealth.usedSpace / 1024)}KB / ${Math.round(storageHealth.estimatedMaxSpace / 1024 / 1024)}MB`}
                  description="How much storage space Moments is using versus your browser's total capacity"
                  variant={storageHealth.percentUsed > 80 ? 'warning' : 'default'}
                />
                
                <StorageMetric
                  label="Usage Percentage"
                  value={`${storageHealth.percentUsed.toFixed(1)}%`}
                  description="Percentage of estimated browser storage capacity currently in use"
                  variant={storageHealth.percentUsed > 80 ? 'warning' : storageHealth.percentUsed > 50 ? 'warning' : 'success'}
                />
                
                <StorageMetric
                  label="Storage Keys"
                  value={storageHealth.keys?.length || 0}
                  description="Number of individual data items stored by Moments in your browser"
                />
              </>
            )}
            
            {storageHealth.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700 font-medium">Storage Error</p>
                <p className="text-sm text-red-600 mt-1">{storageHealth.error}</p>
                <p className="text-xs text-red-500 mt-2">
                  Try clearing browser cache, disabling private mode, or freeing disk space.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="pt-4">
          <ActionButton
            icon={ArrowPathIcon}
            label={isRunningHealthCheck ? "Checking..." : "Run Health Check"}
            description="Refresh storage capacity and health information"
            onClick={checkHealth}
            disabled={isRunningHealthCheck}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-md border ${
            message.type === 'error' ? 'bg-red-50 border-red-200' : 
            message.type === 'success' ? 'bg-green-50 border-green-200' : 
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {message.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />}
              {message.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />}
              {message.type === 'info' && <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {message.type === 'error' ? 'Error' : message.type === 'success' ? 'Success' : 'Information'}
                </p>
                <p className="text-sm mt-1">{message.text}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (section === 'data') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Current Data</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Overview of your stored catalogs and moments data.
          </p>
        </div>

        <div className="space-y-4">
          <StorageMetric
            label="Companies"
            value={companies.length}
            description="AI companies and enterprises in your catalog"
          />
          <StorageMetric
            label="Technologies"
            value={technologies.length}
            description="AI technologies and frameworks in your catalog"
          />
          <StorageMetric
            label="Moments"
            value={moments.length}
            description="Pivotal business moments extracted from your content"
          />
          <StorageMetric
            label="Last Analysis"
            value={lastAnalysisAt ? new Date(lastAnalysisAt).toLocaleString() : 'Never'}
            description="When you last ran AI analysis to extract moments"
          />
          <StorageMetric
            label="File System Status"
            value={
              <Badge variant="outline" className="text-blue-600">
                File Persistence Enabled
              </Badge>
            }
            description="Moments are automatically saved to filesystem as markdown files"
          />
        </div>

      </div>
    )
  }

  if (section === 'management') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Storage Management</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Backup your data, restore from previous backups, and manage storage health.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Management */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Data Management
            </h4>
            
            <ActionButton
              icon={ArrowDownTrayIcon}
              label="Create Backup"
              description="Download a complete backup of your catalogs and moments data as a JSON file"
              onClick={handleBackup}
            />
            
            <div className="space-y-2">
              <label htmlFor="restore-input">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex items-center gap-2 w-full justify-start"
                >
                  <span>
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    Restore Backup
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
              <p className="text-xs text-muted-foreground leading-relaxed px-1">
                Upload a previous backup file to restore your data (will replace current data)
              </p>
            </div>
          </div>
          
          {/* System Management */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              System Diagnostics
            </h4>
            
            <ActionButton
              icon={MagnifyingGlassIcon}
              label="Inspect Storage"
              description="View detailed storage contents and structure for troubleshooting"
              onClick={handleInspect}
            />
            
            <ActionButton
              icon={ArrowPathIcon}
              label="Reload Application"
              description="Refresh the entire application to resolve display or loading issues"
              onClick={handleReload}
            />
          </div>
          
          {/* File Management */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              File Management
            </h4>
            
            <ActionButton
              icon={ArrowDownTrayIcon}
              label="Save to Files"
              description="Save all current moments to filesystem as markdown files"
              onClick={handleSaveToFiles}
            />
            
            <ActionButton
              icon={ArrowUpTrayIcon}
              label="Load from Files"
              description="Load moments from filesystem markdown files"
              onClick={handleLoadFromFiles}
            />
            
            <ActionButton
              icon={MagnifyingGlassIcon}
              label="Debug Store State"
              description="Log current moments store state to browser console for debugging"
              onClick={handleDebugStore}
            />
          </div>
        </div>
        
        {/* Danger Zone */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-sm text-destructive uppercase tracking-wide mb-4">
            Danger Zone
          </h4>
          <ActionButton
            icon={TrashIcon}
            label={`Clear All Data${totalItems > 0 ? ` (${totalItems} items)` : ''}`}
            description="Permanently delete all stored data including catalogs and moments (cannot be undone)"
            onClick={handleClear}
            variant="destructive"
          />
        </div>

        {/* Inspection Results */}
        {showInspectionResults && (
          <Collapsible open={showInspectionResults} onOpenChange={setShowInspectionResults}>
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <MagnifyingGlassIcon className="w-4 h-4" />
                      Storage Inspection Results
                    </span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                      {inspectionResults}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    This shows the internal structure of your stored data. 
                    Use this information when reporting bugs or troubleshooting issues.
                  </p>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {message && (
          <div className={`p-3 rounded-md border ${
            message.type === 'error' ? 'bg-red-50 border-red-200' : 
            message.type === 'success' ? 'bg-green-50 border-green-200' : 
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {message.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />}
              {message.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />}
              {message.type === 'info' && <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {message.type === 'error' ? 'Error' : message.type === 'success' ? 'Success' : 'Information'}
                </p>
                <p className="text-sm mt-1">{message.text}</p>
                {message.type === 'error' && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Troubleshooting suggestions:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Try refreshing the page</li>
                      <li>• Check if you have sufficient disk space</li>
                      <li>• Disable private/incognito browsing mode</li>
                      <li>• Clear browser cache if issues persist</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (section === 'provider') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <CpuChipIcon className="w-5 h-5" />
            Model Provider Configuration
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configure AI model providers for the Moments application. Choose between Anthropic API for simple setup or Amazon Bedrock for enterprise features.
          </p>
        </div>

        <ProviderConfig
          config={providerConfig}
          onSave={handleSaveProviderConfig}
          onTest={handleTestProviderConfig}
        />

        <div className="border-t pt-6">
          <h3 className="text-base font-semibold mb-4">Provider Testing</h3>
          <ProviderTest config={providerConfig} />
        </div>

        {message && (
          <div className={`p-3 rounded-md border ${
            message.type === 'error' ? 'bg-red-50 border-red-200' : 
            message.type === 'success' ? 'bg-green-50 border-green-200' : 
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {message.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />}
              {message.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />}
              {message.type === 'info' && <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {message.type === 'error' ? 'Error' : message.type === 'success' ? 'Success' : 'Information'}
                </p>
                <p className="text-sm mt-1">{message.text}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (section === 'cache') {
    return <CacheManagement />
  }

  return null
}