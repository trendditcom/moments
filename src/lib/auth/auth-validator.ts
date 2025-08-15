/**
 * Authentication Validator
 * Generic authentication validation for multiple providers
 */

import { BedrockAuth, BedrockAuthConfig, AuthValidationResult } from './bedrock-auth'
import { ModelProviderConfig } from '../model-providers/provider-interface'

export interface ProviderAuthResult {
  provider: 'anthropic' | 'bedrock'
  isValid: boolean
  authMethod?: string
  identity?: {
    arn?: string
    userId?: string
    account?: string
    apiKeyPrefix?: string
  }
  permissions?: {
    [key: string]: boolean
  }
  error?: string
  suggestions?: string[]
}

export interface AuthValidatorConfig {
  anthropic?: {
    apiKey?: string
    apiKeyEnv?: string
    baseUrl?: string
  }
  bedrock?: BedrockAuthConfig
}

export class AuthValidator {
  private config: AuthValidatorConfig

  constructor(config: AuthValidatorConfig = {}) {
    this.config = config
  }

  /**
   * Validate Anthropic API authentication
   */
  async validateAnthropicAuth(providerConfig?: ModelProviderConfig): Promise<ProviderAuthResult> {
    try {
      // Get API key from various sources
      const apiKey = providerConfig?.apiKey ||
        this.config.anthropic?.apiKey ||
        (providerConfig?.apiKeyEnv ? process.env[providerConfig.apiKeyEnv] : undefined) ||
        (this.config.anthropic?.apiKeyEnv ? process.env[this.config.anthropic.apiKeyEnv] : undefined) ||
        process.env.ANTHROPIC_API_KEY ||
        process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY

      if (!apiKey) {
        return {
          provider: 'anthropic',
          isValid: false,
          error: 'Anthropic API key not found',
          suggestions: [
            'Set ANTHROPIC_API_KEY environment variable',
            'Provide apiKey in provider configuration',
            'For browser environments, use NEXT_PUBLIC_ANTHROPIC_API_KEY'
          ]
        }
      }

      // Validate API key format
      if (!apiKey.startsWith('sk-ant-')) {
        return {
          provider: 'anthropic',
          isValid: false,
          error: 'Invalid Anthropic API key format',
          suggestions: [
            'Ensure API key starts with "sk-ant-"',
            'Check for typos in the API key',
            'Generate a new API key from Anthropic Console'
          ]
        }
      }

      // Test API key by making a minimal request
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const client = new Anthropic({
          apiKey,
          baseURL: providerConfig?.baseUrl || this.config.anthropic?.baseUrl,
          dangerouslyAllowBrowser: typeof window !== 'undefined'
        })

        await client.messages.create({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })

        return {
          provider: 'anthropic',
          isValid: true,
          authMethod: 'api_key',
          identity: {
            apiKeyPrefix: apiKey.substring(0, 12) + '...'
          }
        }
      } catch (error: any) {
        let suggestions: string[] = []
        
        if (error.status === 401) {
          suggestions = [
            'Verify API key is correct and active',
            'Check if API key has been revoked',
            'Generate a new API key from Anthropic Console'
          ]
        } else if (error.status === 429) {
          suggestions = [
            'API key is valid but rate limited',
            'Wait before retrying',
            'Consider upgrading API tier'
          ]
        } else {
          suggestions = [
            'Check network connectivity',
            'Verify API endpoint URL',
            'Check for proxy or firewall issues'
          ]
        }

        return {
          provider: 'anthropic',
          isValid: error.status !== 401, // 401 is definitely invalid auth
          error: error.message,
          suggestions
        }
      }
    } catch (error: any) {
      return {
        provider: 'anthropic',
        isValid: false,
        error: `Authentication validation failed: ${error.message}`,
        suggestions: [
          'Check API key configuration',
          'Verify network connectivity',
          'Ensure Anthropic SDK is properly installed'
        ]
      }
    }
  }

  /**
   * Validate AWS Bedrock authentication
   */
  async validateBedrockAuth(providerConfig?: ModelProviderConfig): Promise<ProviderAuthResult> {
    try {
      // Create Bedrock auth configuration
      const bedrockConfig: BedrockAuthConfig = {
        method: 'auto',
        region: providerConfig?.region,
        profile: providerConfig?.profile,
        bedrockApiKey: providerConfig?.apiKey,
        bedrockApiKeyEnv: providerConfig?.apiKeyEnv,
        ...this.config.bedrock
      }

      // Use Bedrock API key auth if configured
      if (providerConfig?.useBedrockApiKey || bedrockConfig.bedrockApiKey) {
        bedrockConfig.method = 'api_key'
      }

      const bedrockAuth = new BedrockAuth(bedrockConfig)
      const authResult = await bedrockAuth.validateBedrockPermissions()

      let suggestions: string[] = []
      
      if (!authResult.isValid) {
        suggestions = [
          'Configure AWS credentials using aws configure',
          'Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables',
          'Use AWS SSO authentication',
          'Configure Bedrock API keys',
          'Check IAM permissions for Bedrock access'
        ]
      } else if (authResult.permissions) {
        if (!authResult.permissions.canInvokeModel) {
          suggestions.push('Add bedrock:InvokeModel permission to IAM policy')
        }
        if (!authResult.permissions.canStreamModel) {
          suggestions.push('Add bedrock:InvokeModelWithResponseStream permission to IAM policy')
        }
      }

      return {
        provider: 'bedrock',
        isValid: authResult.isValid,
        authMethod: authResult.provider,
        identity: authResult.identity,
        permissions: authResult.permissions ? {
          'bedrock:InvokeModel': authResult.permissions.canInvokeModel,
          'bedrock:InvokeModelWithResponseStream': authResult.permissions.canStreamModel
        } : undefined,
        error: authResult.error,
        suggestions
      }
    } catch (error: any) {
      return {
        provider: 'bedrock',
        isValid: false,
        error: `Bedrock authentication validation failed: ${error.message}`,
        suggestions: [
          'Install AWS SDK dependencies',
          'Configure AWS credentials',
          'Check AWS region configuration',
          'Verify Bedrock service availability in region'
        ]
      }
    }
  }

  /**
   * Validate authentication for a specific provider
   */
  async validateProvider(
    providerType: 'anthropic' | 'bedrock',
    providerConfig?: ModelProviderConfig
  ): Promise<ProviderAuthResult> {
    switch (providerType) {
      case 'anthropic':
        return this.validateAnthropicAuth(providerConfig)
      case 'bedrock':
        return this.validateBedrockAuth(providerConfig)
      default:
        return {
          provider: providerType,
          isValid: false,
          error: `Unknown provider type: ${providerType}`,
          suggestions: ['Use "anthropic" or "bedrock" as provider type']
        }
    }
  }

  /**
   * Validate authentication for all configured providers
   */
  async validateAllProviders(providers: Array<{
    type: 'anthropic' | 'bedrock'
    config?: ModelProviderConfig
  }>): Promise<ProviderAuthResult[]> {
    const results = await Promise.all(
      providers.map(({ type, config }) => this.validateProvider(type, config))
    )

    return results
  }

  /**
   * Get authentication status summary
   */
  async getAuthStatus(providers?: Array<{
    type: 'anthropic' | 'bedrock'
    config?: ModelProviderConfig
  }>): Promise<{
    validProviders: string[]
    invalidProviders: string[]
    recommendations: string[]
    hasValidProvider: boolean
  }> {
    const defaultProviders = providers || [
      { type: 'anthropic' as const },
      { type: 'bedrock' as const }
    ]

    const results = await this.validateAllProviders(defaultProviders)
    
    const validProviders = results
      .filter(r => r.isValid)
      .map(r => r.provider)
    
    const invalidProviders = results
      .filter(r => !r.isValid)
      .map(r => r.provider)

    const recommendations = results
      .filter(r => !r.isValid && r.suggestions)
      .flatMap(r => r.suggestions!)

    return {
      validProviders,
      invalidProviders,
      recommendations,
      hasValidProvider: validProviders.length > 0
    }
  }

  /**
   * Get detailed authentication report
   */
  async getDetailedAuthReport(providers?: Array<{
    type: 'anthropic' | 'bedrock'
    config?: ModelProviderConfig
  }>): Promise<{
    summary: {
      totalProviders: number
      validProviders: number
      invalidProviders: number
      hasValidProvider: boolean
    }
    providers: ProviderAuthResult[]
    recommendations: {
      critical: string[]
      suggestions: string[]
    }
  }> {
    const defaultProviders = providers || [
      { type: 'anthropic' as const },
      { type: 'bedrock' as const }
    ]

    const results = await this.validateAllProviders(defaultProviders)
    
    const validCount = results.filter(r => r.isValid).length
    const invalidCount = results.filter(r => !r.isValid).length

    // Categorize recommendations
    const critical: string[] = []
    const suggestions: string[] = []

    results.forEach(result => {
      if (!result.isValid && result.suggestions) {
        critical.push(...result.suggestions.slice(0, 2)) // First 2 are critical
        suggestions.push(...result.suggestions.slice(2)) // Rest are suggestions
      }
    })

    return {
      summary: {
        totalProviders: results.length,
        validProviders: validCount,
        invalidProviders: invalidCount,
        hasValidProvider: validCount > 0
      },
      providers: results,
      recommendations: {
        critical: [...new Set(critical)], // Remove duplicates
        suggestions: [...new Set(suggestions)]
      }
    }
  }

  /**
   * Update validator configuration
   */
  updateConfig(config: Partial<AuthValidatorConfig>): void {
    this.config = { ...this.config, ...config }
  }
}