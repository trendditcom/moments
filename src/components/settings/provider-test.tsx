'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  PlayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BoltIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import type { ModelProviderConfig } from '@/lib/config-types'

interface ProviderTestProps {
  config: ModelProviderConfig | undefined
}

interface TestResult {
  provider: string
  model: string
  success: boolean
  latency?: number
  tokens?: {
    input: number
    output: number
  }
  cost?: {
    input: number
    output: number
    total: number
  }
  error?: string
  response?: string
}

export function ProviderTest({ config }: ProviderTestProps) {
  const [selectedModel, setSelectedModel] = useState<'sonnet' | 'haiku' | 'opus'>('haiku')
  const [testPrompt, setTestPrompt] = useState('What is 2+2? Answer with just the number.')
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [activeTest, setActiveTest] = useState<string | null>(null)

  const runTest = async () => {
    if (!config) {
      setTestResults([{
        provider: 'unknown',
        model: 'unknown',
        success: false,
        error: 'No provider configuration found'
      }])
      return
    }

    setIsRunning(true)
    setTestResults([])
    setActiveTest(`${config.type}-${selectedModel}`)

    try {
      // Test with the configured provider
      const response = await fetch('/api/provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          model: selectedModel,
          prompt: testPrompt,
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        setTestResults([{
          provider: config.type,
          model: selectedModel,
          success: true,
          latency: result.latency,
          tokens: result.tokens,
          cost: result.cost,
          response: result.response,
        }])
      } else {
        setTestResults([{
          provider: config.type,
          model: selectedModel,
          success: false,
          error: result.error || 'Test failed',
        }])
      }
    } catch (error) {
      setTestResults([{
        provider: config.type,
        model: selectedModel,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }])
    } finally {
      setIsRunning(false)
      setActiveTest(null)
    }
  }

  const runComparisonTest = async () => {
    if (!config) {
      setTestResults([{
        provider: 'unknown',
        model: 'unknown',
        success: false,
        error: 'No provider configuration found'
      }])
      return
    }

    setIsRunning(true)
    setTestResults([])

    // Test both providers for comparison
    const providers: ('anthropic' | 'bedrock')[] = ['anthropic', 'bedrock']
    const results: TestResult[] = []

    for (const providerType of providers) {
      setActiveTest(`${providerType}-${selectedModel}`)
      
      try {
        const testConfig = { ...config, type: providerType }
        const response = await fetch('/api/provider/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: testConfig,
            model: selectedModel,
            prompt: testPrompt,
          }),
        })

        const result = await response.json()
        
        if (response.ok) {
          results.push({
            provider: providerType,
            model: selectedModel,
            success: true,
            latency: result.latency,
            tokens: result.tokens,
            cost: result.cost,
            response: result.response,
          })
        } else {
          results.push({
            provider: providerType,
            model: selectedModel,
            success: false,
            error: result.error || 'Test failed',
          })
        }
      } catch (error) {
        results.push({
          provider: providerType,
          model: selectedModel,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    setTestResults(results)
    setIsRunning(false)
    setActiveTest(null)
  }

  const formatCost = (cost: number) => {
    if (cost < 0.001) return '<$0.001'
    return `$${cost.toFixed(4)}`
  }

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BoltIcon className="w-5 h-5" />
            Provider Testing
          </CardTitle>
          <CardDescription>
            Test your provider configuration with real API calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-model">Test Model</Label>
              <Select
                value={selectedModel}
                onValueChange={(value) => setSelectedModel(value as 'sonnet' | 'haiku' | 'opus')}
              >
                <SelectTrigger id="test-model" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="haiku">
                    <div className="flex items-center justify-between w-full">
                      <span>Claude Haiku</span>
                      <span className="text-xs text-muted-foreground ml-2">(Fastest, Cheapest)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sonnet">
                    <div className="flex items-center justify-between w-full">
                      <span>Claude Sonnet</span>
                      <span className="text-xs text-muted-foreground ml-2">(Balanced)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="opus">
                    <div className="flex items-center justify-between w-full">
                      <span>Claude Opus</span>
                      <span className="text-xs text-muted-foreground ml-2">(Most Capable)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="test-prompt">Test Prompt</Label>
              <Textarea
                id="test-prompt"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter a test prompt..."
                className="mt-1.5 font-mono text-sm"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Use a simple prompt for quick testing. Complex prompts will use more tokens and cost more.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={runTest}
                disabled={isRunning || !config || !testPrompt}
                className="flex items-center gap-2"
              >
                {isRunning && activeTest?.startsWith(config?.type || '') ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4" />
                    Test Current Provider
                  </>
                )}
              </Button>
              <Button
                onClick={runComparisonTest}
                variant="outline"
                disabled={isRunning || !config || !testPrompt}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4" />
                    Compare Both Providers
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Test Results
          </h3>
          
          {testResults.map((result, index) => (
            <Card key={index} className={result.success ? '' : 'border-red-200'}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="capitalize">{result.provider}</span>
                    <Badge variant="outline" className="text-xs">
                      {result.model}
                    </Badge>
                  </CardTitle>
                  {result.success ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {result.success ? (
                  <div className="space-y-3">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Latency</p>
                          <p className="text-sm font-medium">
                            {result.latency ? formatLatency(result.latency) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <InformationCircleIcon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tokens</p>
                          <p className="text-sm font-medium">
                            {result.tokens 
                              ? `${result.tokens.input}/${result.tokens.output}`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Cost</p>
                          <p className="text-sm font-medium">
                            {result.cost ? formatCost(result.cost.total) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Response */}
                    {result.response && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Response:</p>
                        <p className="text-sm font-mono">{result.response}</p>
                      </div>
                    )}

                    {/* Cost Breakdown */}
                    {result.cost && (
                      <div className="text-xs text-muted-foreground">
                        Cost breakdown: Input {formatCost(result.cost.input)} + 
                        Output {formatCost(result.cost.output)} = 
                        Total {formatCost(result.cost.total)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">{result.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Comparison Summary */}
          {testResults.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Comparison Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {testResults.every(r => r.success) && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fastest Provider:</span>
                        <span className="font-medium capitalize">
                          {testResults.reduce((prev, curr) => 
                            (curr.latency || Infinity) < (prev.latency || Infinity) ? curr : prev
                          ).provider}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cheapest Provider:</span>
                        <span className="font-medium capitalize">
                          {testResults.reduce((prev, curr) => 
                            (curr.cost?.total || Infinity) < (prev.cost?.total || Infinity) ? curr : prev
                          ).provider}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="font-medium">
                      {testResults.filter(r => r.success).length}/{testResults.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}