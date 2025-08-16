'use client'

import { useState, useEffect } from 'react'
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
import {
  Input,
  InputGroup,
  InputLeftAddon,
} from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  CloudIcon,
  KeyIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import type { ModelProviderConfig } from '@/lib/config-types'

interface ProviderConfigProps {
  config: ModelProviderConfig | undefined
  onSave: (config: ModelProviderConfig) => Promise<void>
  onTest: (config: ModelProviderConfig) => Promise<{ success: boolean; message: string; details?: any }>
}

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
]

const DEFAULT_CONFIG: ModelProviderConfig = {
  type: 'anthropic',
  anthropic: {
    api_key_env: 'ANTHROPIC_API_KEY',
    base_url: 'https://api.anthropic.com',
  },
  bedrock: {
    aws_region: 'us-east-1',
    aws_profile: undefined,
    use_bedrock_api_key: false,
    inference_profile: null,
  },
  model_mapping: {
    sonnet: {
      anthropic: 'claude-3-5-sonnet-20241022',
      bedrock: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    },
    haiku: {
      anthropic: 'claude-3-5-haiku-20241022',
      bedrock: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
    },
    opus: {
      anthropic: 'claude-3-opus-20240229',
      bedrock: 'anthropic.claude-3-opus-20240229-v1:0',
    },
  },
}

export function ProviderConfig({ config, onSave, onTest }: ProviderConfigProps) {
  const [providerConfig, setProviderConfig] = useState<ModelProviderConfig>(
    config || DEFAULT_CONFIG
  )
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (config) {
      setProviderConfig(config)
    }
  }, [config])

  const handleProviderTypeChange = (type: 'anthropic' | 'bedrock') => {
    setProviderConfig(prev => ({ ...prev, type }))
    setHasChanges(true)
    setTestResult(null)
  }

  const handleAnthropicConfigChange = (field: keyof typeof providerConfig.anthropic, value: string) => {
    setProviderConfig(prev => ({
      ...prev,
      anthropic: {
        ...prev.anthropic,
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  const handleBedrockConfigChange = (field: keyof typeof providerConfig.bedrock, value: any) => {
    setProviderConfig(prev => ({
      ...prev,
      bedrock: {
        ...prev.bedrock,
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  const handleModelMappingChange = (
    model: 'sonnet' | 'haiku' | 'opus',
    provider: 'anthropic' | 'bedrock',
    value: string
  ) => {
    setProviderConfig(prev => ({
      ...prev,
      model_mapping: {
        ...prev.model_mapping,
        [model]: {
          ...prev.model_mapping[model],
          [provider]: value,
        },
      },
    }))
    setHasChanges(true)
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const result = await onTest(providerConfig)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(providerConfig)
      setHasChanges(false)
      setTestResult({
        success: true,
        message: 'Configuration saved successfully',
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save configuration',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CpuChipIcon className="w-5 h-5" />
            Model Provider
          </CardTitle>
          <CardDescription>
            Choose between Anthropic API (simpler setup) or Amazon Bedrock (enterprise features)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider-type">Provider Type</Label>
              <Select
                value={providerConfig.type}
                onValueChange={(value) => handleProviderTypeChange(value as 'anthropic' | 'bedrock')}
              >
                <SelectTrigger id="provider-type" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic">
                    <div className="flex items-center gap-2">
                      <CloudIcon className="w-4 h-4" />
                      <span>Anthropic API</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bedrock">
                    <div className="flex items-center gap-2">
                      <CpuChipIcon className="w-4 h-4" />
                      <span>Amazon Bedrock</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">
                {providerConfig.type === 'anthropic'
                  ? 'Direct API access with simple API key authentication'
                  : 'AWS-managed service with enterprise security and compliance'}
              </p>
            </div>

            {/* Current Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current Status:</span>
              {testResult ? (
                <Badge variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? 'Connected' : 'Not Connected'}
                </Badge>
              ) : (
                <Badge variant="outline">Not Tested</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anthropic Configuration */}
      {providerConfig.type === 'anthropic' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudIcon className="w-5 h-5" />
              Anthropic Configuration
            </CardTitle>
            <CardDescription>
              Configure Anthropic API settings for direct Claude model access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key-env">API Key Environment Variable</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <KeyIcon className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="api-key-env"
                    value={providerConfig.anthropic.api_key_env}
                    onChange={(e) => handleAnthropicConfigChange('api_key_env', e.target.value)}
                    placeholder="ANTHROPIC_API_KEY"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Name of the environment variable containing your Anthropic API key
                </p>
              </div>

              <div>
                <Label htmlFor="base-url">Base URL</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <GlobeAltIcon className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="base-url"
                    value={providerConfig.anthropic.base_url}
                    onChange={(e) => handleAnthropicConfigChange('base_url', e.target.value)}
                    placeholder="https://api.anthropic.com"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Anthropic API endpoint URL (use default unless you have a custom endpoint)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bedrock Configuration */}
      {providerConfig.type === 'bedrock' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CpuChipIcon className="w-5 h-5" />
              Amazon Bedrock Configuration
            </CardTitle>
            <CardDescription>
              Configure AWS Bedrock settings for enterprise Claude model access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="aws-region">AWS Region</Label>
                <Select
                  value={providerConfig.bedrock.aws_region}
                  onValueChange={(value) => handleBedrockConfigChange('aws_region', value)}
                >
                  <SelectTrigger id="aws-region" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AWS_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  AWS region where Bedrock models are deployed
                </p>
              </div>

              <div>
                <Label htmlFor="aws-profile">AWS Profile (Optional)</Label>
                <Input
                  id="aws-profile"
                  value={providerConfig.bedrock.aws_profile || ''}
                  onChange={(e) => handleBedrockConfigChange('aws_profile', e.target.value || undefined)}
                  placeholder="default"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  AWS CLI profile name for authentication (leave empty to use default)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use-bedrock-api-key">Use Bedrock API Keys</Label>
                  <p className="text-xs text-muted-foreground">
                    Use Bedrock API keys instead of AWS IAM credentials
                  </p>
                </div>
                <Switch
                  id="use-bedrock-api-key"
                  checked={providerConfig.bedrock.use_bedrock_api_key}
                  onCheckedChange={(checked) => handleBedrockConfigChange('use_bedrock_api_key', checked)}
                />
              </div>

              <div>
                <Label htmlFor="inference-profile">Inference Profile (Optional)</Label>
                <Input
                  id="inference-profile"
                  value={providerConfig.bedrock.inference_profile || ''}
                  onChange={(e) => handleBedrockConfigChange('inference_profile', e.target.value || null)}
                  placeholder="Leave empty for default"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Cross-region inference profile for optimized performance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Mapping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentCheckIcon className="w-5 h-5" />
            Model Mapping
          </CardTitle>
          <CardDescription>
            Map logical model names to provider-specific model IDs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(['sonnet', 'haiku', 'opus'] as const).map((model) => (
              <div key={model} className="space-y-2">
                <Label className="capitalize">{model} Model</Label>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Anthropic:</span>
                    <Input
                      value={providerConfig.model_mapping[model].anthropic}
                      onChange={(e) => handleModelMappingChange(model, 'anthropic', e.target.value)}
                      placeholder="Model ID"
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Bedrock:</span>
                    <Input
                      value={providerConfig.model_mapping[model].bedrock}
                      onChange={(e) => handleModelMappingChange(model, 'bedrock', e.target.value)}
                      placeholder="Model ID"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions and Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={handleTest}
                variant="outline"
                disabled={isTesting || isSaving}
                className="flex items-center gap-2"
              >
                {isTesting ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving || isTesting}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <DocumentCheckIcon className="w-4 h-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600">
                Unsaved Changes
              </Badge>
            )}
          </div>

          {/* Test Result Display */}
          {testResult && (
            <div
              className={`mt-4 p-3 rounded-md border ${
                testResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {testResult.success ? 'Success' : 'Error'}
                  </p>
                  <p className="text-sm mt-1">{testResult.message}</p>
                  {testResult.details && (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}