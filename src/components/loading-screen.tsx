'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Database, Settings, RefreshCw } from 'lucide-react'
import { InitializationPhase } from '@/hooks/use-app-initialization'
import { Button } from '@/components/ui/button'

interface LoadingScreenProps {
  phase: InitializationPhase
  status: string
  error?: string | null
  progress: number
  onRetry?: () => void
}

const phaseConfig = {
  starting: { icon: Settings, color: 'text-muted-foreground', label: 'Starting' },
  'checking-storage': { icon: Database, color: 'text-blue-500', label: 'Storage Check' },
  'loading-config': { icon: Settings, color: 'text-blue-500', label: 'Configuration' },
  'hydrating-from-storage': { icon: Database, color: 'text-green-500', label: 'Storage Recovery' },
  'hydrating-from-config': { icon: RefreshCw, color: 'text-green-500', label: 'Content Loading' },
  ready: { icon: Database, color: 'text-green-500', label: 'Ready' },
  error: { icon: AlertCircle, color: 'text-destructive', label: 'Error' }
}

export function LoadingScreen({ phase, status, error, progress, onRetry }: LoadingScreenProps) {
  const config = phaseConfig[phase]
  const Icon = config.icon
  
  return (
    <div className="flex items-center justify-center h-full bg-background/95 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center">
                <Icon className={`w-8 h-8 ${config.color} ${phase === 'hydrating-from-config' ? 'animate-spin' : ''}`} />
              </div>
              
              {progress > 0 && progress < 100 && (
                <div className="absolute inset-0 rounded-full border-2 border-transparent">
                  <svg
                    className="w-16 h-16 transform -rotate-90"
                    viewBox="0 0 64 64"
                  >
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${(progress / 100) * 188.4} 188.4`}
                      className="text-primary transition-all duration-300 ease-out"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {error ? 'Initialization Failed' : 'Moments'}
          </CardTitle>
          
          <CardDescription className="text-base">
            {error ? (
              <span className="text-destructive">
                {error}
              </span>
            ) : (
              'AI Business Intelligence Dashboard'
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!error && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{config.label}</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                
                <Progress 
                  value={progress} 
                  className="h-2 transition-all duration-300 ease-out"
                />
                
                <p className="text-sm text-muted-foreground text-center">
                  {status}
                </p>
              </div>
              
              {phase === 'hydrating-from-config' && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Database className="w-4 h-4" />
                    <span>Processing company and technology content...</span>
                  </div>
                </div>
              )}
            </>
          )}
          
          {error && onRetry && (
            <div className="text-center">
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Initialization
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}