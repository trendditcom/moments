/**
 * AWS Bedrock Authentication Helper
 * Comprehensive authentication support for AWS Bedrock integration
 */

import { fromIni, fromEnv, fromSSO, fromWebToken } from '@aws-sdk/credential-providers'
import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types'
import { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } from '@aws-sdk/client-sts'
import { ModelProviderAuthError } from '../model-providers/provider-interface'

export interface BedrockAuthConfig {
  // Authentication method
  method: 'cli' | 'env' | 'sso' | 'api_key' | 'role' | 'auto'
  
  // AWS CLI configuration
  profile?: string
  credentialsFile?: string
  
  // Environment variables
  accessKeyId?: string
  secretAccessKey?: string
  sessionToken?: string
  
  // SSO configuration
  ssoStartUrl?: string
  ssoAccountId?: string
  ssoRoleName?: string
  ssoRegion?: string
  ssoSession?: string
  
  // Bedrock API keys
  bedrockApiKey?: string
  bedrockApiKeyEnv?: string
  
  // IAM role assumption
  roleArn?: string
  roleSessionName?: string
  externalId?: string
  
  // AWS region
  region?: string
}

export interface AuthValidationResult {
  isValid: boolean
  provider: 'aws-credentials' | 'bedrock-api-key' | 'assumed-role'
  identity?: {
    arn?: string
    userId?: string
    account?: string
  }
  permissions?: {
    canInvokeModel: boolean
    canStreamModel: boolean
    checkedPermissions: string[]
  }
  error?: string
}

export class BedrockAuth {
  private config: BedrockAuthConfig
  private credentials?: AwsCredentialIdentityProvider
  private region: string

  constructor(config: BedrockAuthConfig) {
    this.config = config
    this.region = config.region || process.env.AWS_REGION || 'us-east-1'
  }

  /**
   * Initialize authentication based on configuration
   */
  async initialize(): Promise<AwsCredentialIdentityProvider> {
    switch (this.config.method) {
      case 'cli':
        return this.initializeCLIAuth()
      case 'env':
        return this.initializeEnvAuth()
      case 'sso':
        return this.initializeSSOAuth()
      case 'api_key':
        return this.initializeApiKeyAuth()
      case 'role':
        return this.initializeRoleAuth()
      case 'auto':
      default:
        return this.initializeAutoAuth()
    }
  }

  /**
   * AWS CLI configuration authentication
   */
  private async initializeCLIAuth(): Promise<AwsCredentialIdentityProvider> {
    try {
      const options: any = {}
      
      if (this.config.profile) {
        options.profile = this.config.profile
      }
      
      if (this.config.credentialsFile) {
        options.filepath = this.config.credentialsFile
      }

      return fromIni(options)
    } catch (error: any) {
      throw new ModelProviderAuthError(
        `Failed to initialize AWS CLI authentication: ${error.message}`,
        'bedrock'
      )
    }
  }

  /**
   * Environment variables authentication
   */
  private async initializeEnvAuth(): Promise<AwsCredentialIdentityProvider> {
    try {
      // Check if credentials are provided in config or environment
      const accessKeyId = this.config.accessKeyId || 
        process.env.AWS_ACCESS_KEY_ID
      const secretAccessKey = this.config.secretAccessKey || 
        process.env.AWS_SECRET_ACCESS_KEY
      const sessionToken = this.config.sessionToken || 
        process.env.AWS_SESSION_TOKEN

      if (!accessKeyId || !secretAccessKey) {
        throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required')
      }

      // Return static credentials provider if provided in config
      if (this.config.accessKeyId && this.config.secretAccessKey) {
        return async (): Promise<AwsCredentialIdentity> => ({
          accessKeyId: this.config.accessKeyId!,
          secretAccessKey: this.config.secretAccessKey!,
          sessionToken: this.config.sessionToken
        })
      }

      // Use environment variable provider
      return fromEnv()
    } catch (error: any) {
      throw new ModelProviderAuthError(
        `Failed to initialize environment variable authentication: ${error.message}`,
        'bedrock'
      )
    }
  }

  /**
   * AWS SSO authentication
   */
  private async initializeSSOAuth(): Promise<AwsCredentialIdentityProvider> {
    try {
      if (!this.config.ssoStartUrl) {
        throw new Error('SSO start URL is required for SSO authentication')
      }

      const options: any = {
        ssoStartUrl: this.config.ssoStartUrl,
        ssoAccountId: this.config.ssoAccountId,
        ssoRegion: this.config.ssoRegion || this.region,
        ssoRoleName: this.config.ssoRoleName
      }

      if (this.config.ssoSession) {
        options.ssoSession = this.config.ssoSession
      }

      return fromSSO(options)
    } catch (error: any) {
      throw new ModelProviderAuthError(
        `Failed to initialize SSO authentication: ${error.message}`,
        'bedrock'
      )
    }
  }

  /**
   * Bedrock API key authentication
   */
  private async initializeApiKeyAuth(): Promise<AwsCredentialIdentityProvider> {
    try {
      const apiKey = this.config.bedrockApiKey || 
        (this.config.bedrockApiKeyEnv ? process.env[this.config.bedrockApiKeyEnv] : undefined) ||
        process.env.BEDROCK_API_KEY

      if (!apiKey) {
        throw new Error('Bedrock API key not found')
      }

      // Return credentials provider for Bedrock API keys
      return async (): Promise<AwsCredentialIdentity> => ({
        accessKeyId: apiKey,
        secretAccessKey: apiKey
      })
    } catch (error: any) {
      throw new ModelProviderAuthError(
        `Failed to initialize Bedrock API key authentication: ${error.message}`,
        'bedrock'
      )
    }
  }

  /**
   * IAM role assumption authentication
   */
  private async initializeRoleAuth(): Promise<AwsCredentialIdentityProvider> {
    try {
      if (!this.config.roleArn) {
        throw new Error('Role ARN is required for role assumption')
      }

      // First, get base credentials to assume the role
      const baseCredentials = await this.initializeAutoAuth()

      // Create STS client with base credentials
      const stsClient = new STSClient({
        region: this.region,
        credentials: baseCredentials
      })

      // Create role assumption provider
      return async (): Promise<AwsCredentialIdentity> => {
        const command = new AssumeRoleCommand({
          RoleArn: this.config.roleArn!,
          RoleSessionName: this.config.roleSessionName || 'bedrock-auth-session',
          ExternalId: this.config.externalId
        })

        const response = await stsClient.send(command)
        
        if (!response.Credentials) {
          throw new Error('Failed to assume role: No credentials returned')
        }

        return {
          accessKeyId: response.Credentials.AccessKeyId!,
          secretAccessKey: response.Credentials.SecretAccessKey!,
          sessionToken: response.Credentials.SessionToken!,
          expiration: response.Credentials.Expiration
        }
      }
    } catch (error: any) {
      throw new ModelProviderAuthError(
        `Failed to initialize role assumption authentication: ${error.message}`,
        'bedrock'
      )
    }
  }

  /**
   * Automatic authentication (tries multiple methods)
   */
  private async initializeAutoAuth(): Promise<AwsCredentialIdentityProvider> {
    // Try authentication methods in order of preference
    const methods = [
      // 1. Environment variables (explicit)
      () => process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY 
        ? this.initializeEnvAuth() : null,
      
      // 2. Bedrock API key
      () => (this.config.bedrockApiKey || process.env.BEDROCK_API_KEY) 
        ? this.initializeApiKeyAuth() : null,
      
      // 3. AWS CLI profile
      () => this.config.profile 
        ? this.initializeCLIAuth() : null,
      
      // 4. Default AWS credential chain
      () => fromEnv()
    ]

    for (const method of methods) {
      try {
        const result = method()
        if (result) {
          return await result
        }
      } catch (error) {
        // Continue to next method
        continue
      }
    }

    throw new ModelProviderAuthError(
      'No valid AWS credentials found. Please configure authentication.',
      'bedrock'
    )
  }

  /**
   * Validate authentication and permissions
   */
  async validateAuthentication(): Promise<AuthValidationResult> {
    try {
      // Initialize credentials
      this.credentials = await this.initialize()
      
      // Test authentication by getting caller identity
      const stsClient = new STSClient({
        region: this.region,
        credentials: this.credentials
      })

      const identity = await stsClient.send(new GetCallerIdentityCommand({}))
      
      // Determine authentication provider type
      let provider: AuthValidationResult['provider'] = 'aws-credentials'
      if (this.config.method === 'api_key' || this.config.bedrockApiKey) {
        provider = 'bedrock-api-key'
      } else if (this.config.method === 'role' || this.config.roleArn) {
        provider = 'assumed-role'
      }

      return {
        isValid: true,
        provider,
        identity: {
          arn: identity.Arn,
          userId: identity.UserId,
          account: identity.Account
        }
      }
    } catch (error: any) {
      return {
        isValid: false,
        provider: 'aws-credentials',
        error: error.message
      }
    }
  }

  /**
   * Test Bedrock-specific permissions
   */
  async validateBedrockPermissions(modelId?: string): Promise<AuthValidationResult> {
    try {
      const authResult = await this.validateAuthentication()
      if (!authResult.isValid) {
        return authResult
      }

      // Import Bedrock client dynamically to avoid circular dependencies
      const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime')
      
      const client = new BedrockRuntimeClient({
        region: this.region,
        credentials: this.credentials!
      })

      const testModelId = modelId || 'anthropic.claude-3-haiku-20240307-v1:0'
      const permissions = {
        canInvokeModel: false,
        canStreamModel: false,
        checkedPermissions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream']
      }

      // Test bedrock:InvokeModel permission
      try {
        const command = new InvokeModelCommand({
          modelId: testModelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: Buffer.from(JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          }))
        })

        await client.send(command)
        permissions.canInvokeModel = true
      } catch (error: any) {
        if (error.name === 'AccessDeniedException') {
          permissions.canInvokeModel = false
        } else {
          // Other errors (like throttling) don't necessarily mean no permission
          permissions.canInvokeModel = true
        }
      }

      // Test bedrock:InvokeModelWithResponseStream permission
      try {
        const { InvokeModelWithResponseStreamCommand } = await import('@aws-sdk/client-bedrock-runtime')
        
        const streamCommand = new InvokeModelWithResponseStreamCommand({
          modelId: testModelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: Buffer.from(JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          }))
        })

        const response = await client.send(streamCommand)
        // If we get a response, we have permission
        permissions.canStreamModel = true
        
        // Clean up the stream
        if (response.body) {
          for await (const chunk of response.body) {
            break // Just test the first chunk
          }
        }
      } catch (error: any) {
        if (error.name === 'AccessDeniedException') {
          permissions.canStreamModel = false
        } else {
          permissions.canStreamModel = true
        }
      }

      return {
        ...authResult,
        permissions
      }
    } catch (error: any) {
      return {
        isValid: false,
        provider: 'aws-credentials',
        error: `Permission validation failed: ${error.message}`
      }
    }
  }

  /**
   * Get current credentials provider
   */
  async getCredentials(): Promise<AwsCredentialIdentityProvider> {
    if (!this.credentials) {
      this.credentials = await this.initialize()
    }
    return this.credentials as AwsCredentialIdentityProvider
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BedrockAuthConfig>): void {
    this.config = { ...this.config, ...config }
    this.credentials = undefined // Reset credentials to force re-initialization
  }

  /**
   * Get available authentication methods
   */
  static getAvailableMethods(): Array<{ method: string; description: string; requirements: string[] }> {
    return [
      {
        method: 'cli',
        description: 'AWS CLI configuration (~/.aws/credentials)',
        requirements: ['AWS CLI installed and configured', 'Valid AWS profile']
      },
      {
        method: 'env',
        description: 'Environment variables',
        requirements: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
      },
      {
        method: 'sso',
        description: 'AWS SSO',
        requirements: ['SSO start URL', 'SSO account ID', 'SSO role name']
      },
      {
        method: 'api_key',
        description: 'Bedrock API keys',
        requirements: ['Bedrock API key']
      },
      {
        method: 'role',
        description: 'IAM role assumption',
        requirements: ['Base credentials', 'Role ARN']
      },
      {
        method: 'auto',
        description: 'Automatic detection',
        requirements: ['Any of the above methods configured']
      }
    ]
  }
}