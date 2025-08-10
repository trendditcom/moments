'use client'

import { useState } from 'react'
import { AnalysisProgress, AnalysisStep, AgentActivity } from '@/types/moments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { 
  CpuChipIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/solid'

interface ProgressIndicatorProps {
  progress: AnalysisProgress
}

export function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [showAgents, setShowAgents] = useState(true)
  const [showSteps, setShowSteps] = useState(true)

  if (!progress.isActive && progress.completedSteps.length === 0) {
    return null
  }

  const getStepStatusIcon = (status: AnalysisStep['status']) => {
    switch (status) {
      case 'running': return <PlayIcon className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'completed': return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'error': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      default: return <PauseIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getAgentStatusColor = (status: AgentActivity['status']) => {
    switch (status) {
      case 'spawning': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'waiting': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return 'Calculating...'
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${Math.round(remainingSeconds)}s`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CpuChipIcon className="h-5 w-5 text-blue-500" />
          Analysis Progress
          {progress.isActive && (
            <Badge variant="outline" className="animate-pulse">
              Processing...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {progress.progressPercentage}%
            </span>
          </div>
          <Progress value={progress.progressPercentage} className="w-full" />
          {progress.estimatedTimeRemaining && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="h-3 w-3" />
              Estimated time remaining: {formatTimeRemaining(progress.estimatedTimeRemaining)}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-blue-600">{progress.stats.processedItems}</div>
            <div className="text-muted-foreground">Processed</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">{progress.stats.momentsExtracted}</div>
            <div className="text-muted-foreground">Moments Found</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-orange-600">{progress.stats.totalItems}</div>
            <div className="text-muted-foreground">Total Items</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600">{progress.stats.errorsEncountered}</div>
            <div className="text-muted-foreground">Errors</div>
          </div>
        </div>

        {/* Current Step */}
        {progress.currentStep && (
          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              {getStepStatusIcon(progress.currentStep.status)}
              <span className="font-medium">{progress.currentStep.description}</span>
              {progress.currentStep.progress !== undefined && (
                <Badge variant="outline">{progress.currentStep.progress}%</Badge>
              )}
            </div>
            {progress.currentStep.details && (
              <div className="text-sm text-muted-foreground">
                {progress.currentStep.details}
              </div>
            )}
          </div>
        )}

        {/* Active Agents */}
        {progress.activeAgents.length > 0 && (
          <Collapsible open={showAgents} onOpenChange={setShowAgents}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
              {showAgents ? 
                <ChevronDownIcon className="h-4 w-4" /> : 
                <ChevronRightIcon className="h-4 w-4" />
              }
              <span className="font-medium">
                Active Agents ({progress.activeAgents.filter(a => a.status !== 'completed').length})
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {progress.activeAgents.map((agent) => (
                <div key={agent.agentId} className="p-2 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{agent.agentType}</span>
                    <Badge className={getAgentStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Model: {agent.model} | Processing: {agent.processingCount}
                  </div>
                  {agent.currentTask && (
                    <div className="text-xs text-muted-foreground">
                      {agent.currentTask}
                    </div>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Current Prompt */}
        {progress.currentPrompt && (
          <Collapsible open={showPrompt} onOpenChange={setShowPrompt}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
              {showPrompt ? 
                <ChevronDownIcon className="h-4 w-4" /> : 
                <ChevronRightIcon className="h-4 w-4" />
              }
              <span className="font-medium">Current Prompt</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="p-3 bg-gray-50 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {progress.currentPrompt}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Completed Steps */}
        {progress.completedSteps.length > 0 && (
          <Collapsible open={showSteps} onOpenChange={setShowSteps}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
              {showSteps ? 
                <ChevronDownIcon className="h-4 w-4" /> : 
                <ChevronRightIcon className="h-4 w-4" />
              }
              <span className="font-medium">
                Completed Steps ({progress.completedSteps.length})
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {progress.completedSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  {getStepStatusIcon(step.status)}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{step.description}</div>
                    {step.details && (
                      <div className="text-xs text-muted-foreground">{step.details}</div>
                    )}
                  </div>
                  {step.endTime && step.startTime && (
                    <div className="text-xs text-muted-foreground">
                      {Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000)}s
                    </div>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

export default ProgressIndicator