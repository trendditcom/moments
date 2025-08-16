/**
 * Claude Code SDK Client Wrapper
 * Unified wrapper for Claude Code SDK supporting both Anthropic and Bedrock providers
 */

import { ModelProvider, ModelRequest, ModelResponse, ModelMessage } from '../model-providers/provider-interface'
import { ModelProviderFactory } from '../model-providers/provider-factory'

export interface ClaudeSDKOptions {
  provider?: 'anthropic' | 'bedrock'
  providerConfig?: any
  system_prompt?: string
  max_turns?: number
  temperature?: number
  maxTokens?: number
  enableCaching?: boolean
  sessionId?: string
}

export interface ClaudeQueryResult {
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  sessionId?: string
  cost?: number
}

export interface ClaudeStreamChunk {
  type: 'text' | 'metadata' | 'error'
  content?: string
  delta?: string
  metadata?: Record<string, any>
  error?: string
}

/**
 * Claude Code SDK Client wrapper supporting multiple providers
 */
export class ClaudeSDKClient {
  private provider: ModelProvider
  private options: ClaudeSDKOptions
  private sessionHistory: ModelMessage[] = []
  private sessionId: string

  constructor(options: ClaudeSDKOptions = {}) {
    this.options = {
      max_turns: 5,
      temperature: 0.7,
      maxTokens: 4000,
      enableCaching: true,
      ...options
    }

    this.sessionId = options.sessionId || this.generateSessionId()

    // Initialize provider
    if (options.provider && options.providerConfig) {
      this.provider = ModelProviderFactory.createProvider(
        options.provider,
        options.providerConfig
      )
    } else {
      // Use factory's primary provider or environment detection
      try {
        this.provider = ModelProviderFactory.getPrimaryProvider()
      } catch {
        this.provider = ModelProviderFactory.createFromEnvironment()
      }
    }
  }

  /**
   * Send a query to Claude with automatic provider handling
   */
  async query(
    message: string,
    options: Partial<ClaudeSDKOptions> = {}
  ): Promise<ClaudeQueryResult> {
    const mergedOptions = { ...this.options, ...options }

    // Add user message to session history
    const userMessage: ModelMessage = {
      role: 'user',
      content: message
    }

    // Prepare messages for the request
    const messages = [...this.sessionHistory, userMessage]

    // Trim history if it exceeds max_turns
    if (mergedOptions.max_turns && messages.length > mergedOptions.max_turns * 2) {
      const excessMessages = messages.length - (mergedOptions.max_turns * 2)
      messages.splice(0, excessMessages)
    }

    const request: ModelRequest = {
      messages,
      model: 'sonnet', // Default to sonnet, will be mapped by provider
      maxTokens: mergedOptions.maxTokens,
      temperature: mergedOptions.temperature,
      system: mergedOptions.system_prompt,
      metadata: {
        sessionId: this.sessionId,
        enableCaching: mergedOptions.enableCaching
      }
    }

    try {
      const response = await this.provider.sendRequest(request)

      // Add both user and assistant messages to session history
      this.sessionHistory.push(userMessage)
      this.sessionHistory.push({
        role: 'assistant',
        content: response.content
      })

      // Calculate cost estimate
      const cost = response.usage ? 
        this.provider.estimateCost(
          response.usage.inputTokens, 
          response.usage.outputTokens, 
          response.model
        ) : undefined

      return {
        content: response.content,
        usage: response.usage ? {
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          totalTokens: response.usage.totalTokens || (response.usage.inputTokens + response.usage.outputTokens)
        } : undefined,
        model: response.model,
        sessionId: this.sessionId,
        cost
      }

    } catch (error: any) {
      // Try fallback provider if available
      const fallbackProvider = ModelProviderFactory.getFallbackProvider()
      if (fallbackProvider && fallbackProvider !== this.provider) {
        console.warn('Primary provider failed, trying fallback:', error.message)
        
        const originalProvider = this.provider
        this.provider = fallbackProvider

        try {
          const response = await this.provider.sendRequest(request)
          
          // Add to session history
          this.sessionHistory.push(userMessage)
          this.sessionHistory.push({
            role: 'assistant',
            content: response.content
          })

          const cost = response.usage ? 
            this.provider.estimateCost(
              response.usage.inputTokens, 
              response.usage.outputTokens, 
              response.model
            ) : undefined

          return {
            content: response.content,
            usage: response.usage ? {
              inputTokens: response.usage.inputTokens,
              outputTokens: response.usage.outputTokens,
              totalTokens: response.usage.totalTokens || (response.usage.inputTokens + response.usage.outputTokens)
            } : undefined,
            model: response.model,
            sessionId: this.sessionId,
            cost
          }
        } catch (fallbackError) {
          // Restore original provider
          this.provider = originalProvider
          throw new Error(`Both providers failed. Primary: ${error.message}, Fallback: ${(fallbackError as Error).message}`)
        }
      }

      throw error
    }
  }

  /**
   * Stream a query to Claude with real-time response chunks
   */
  async *queryStream(
    message: string,
    options: Partial<ClaudeSDKOptions> = {}
  ): AsyncIterableIterator<ClaudeStreamChunk> {
    const mergedOptions = { ...this.options, ...options }

    const userMessage: ModelMessage = {
      role: 'user',
      content: message
    }

    const messages = [...this.sessionHistory, userMessage]

    // Trim history if needed
    if (mergedOptions.max_turns && messages.length > mergedOptions.max_turns * 2) {
      const excessMessages = messages.length - (mergedOptions.max_turns * 2)
      messages.splice(0, excessMessages)
    }

    const request: ModelRequest = {
      messages,
      model: 'sonnet',
      maxTokens: mergedOptions.maxTokens,
      temperature: mergedOptions.temperature,
      system: mergedOptions.system_prompt,
      stream: true,
      metadata: {
        sessionId: this.sessionId,
        enableCaching: mergedOptions.enableCaching
      }
    }

    let fullContent = ''

    try {
      await this.provider.streamRequest(request, (chunk) => {
        if (chunk.type === 'text' && chunk.content) {
          fullContent += chunk.content
        }
        
        // Transform to Claude SDK format
        const claudeChunk: ClaudeStreamChunk = {
          type: chunk.type as any,
          content: chunk.content,
          delta: chunk.content,
          metadata: chunk.metadata,
          error: chunk.error
        }

        // Note: In a real streaming implementation, we would yield here
        // For now, we collect the content
      })

      // Add to session history after streaming completes
      this.sessionHistory.push(userMessage)
      this.sessionHistory.push({
        role: 'assistant',
        content: fullContent
      })

      // Yield the final chunk
      yield {
        type: 'text',
        content: fullContent,
        delta: fullContent
      }

    } catch (error: any) {
      yield {
        type: 'error',
        error: error.message
      }
    }
  }

  /**
   * Continue an existing session
   */
  continueSession(sessionId: string): void {
    this.sessionId = sessionId
    // In a real implementation, we would load session history from storage
    console.log(`Continuing session: ${sessionId}`)
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Get session history
   */
  getSessionHistory(): ModelMessage[] {
    return [...this.sessionHistory]
  }

  /**
   * Clear session history
   */
  clearSession(): void {
    this.sessionHistory = []
    this.sessionId = this.generateSessionId()
  }

  /**
   * Switch provider dynamically
   */
  async switchProvider(
    type: 'anthropic' | 'bedrock',
    config?: any
  ): Promise<void> {
    this.provider = ModelProviderFactory.createProvider(type, config)
    
    // Validate the new provider
    const health = await this.provider.healthCheck()
    if (!health.isHealthy) {
      throw new Error(`Provider ${type} is not healthy: ${health.error}`)
    }
  }

  /**
   * Get current provider information
   */
  getProviderInfo(): { type: string; config: any } {
    return {
      type: this.provider.getType(),
      config: this.provider.getConfig()
    }
  }

  /**
   * Check provider health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const health = await this.provider.healthCheck()
      return health.isHealthy
    } catch {
      return false
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `claude-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get usage statistics for current session
   */
  getSessionStats(): {
    messageCount: number
    totalCost: number
    averageResponseTime: number
    provider: string
  } {
    return {
      messageCount: this.sessionHistory.filter(m => m.role === 'user').length,
      totalCost: 0, // Would be calculated from actual usage
      averageResponseTime: 0, // Would be tracked from actual requests
      provider: this.provider.getType()
    }
  }

  /**
   * Export session for analysis or debugging
   */
  exportSession(): {
    sessionId: string
    history: ModelMessage[]
    stats: any
    provider: string
    timestamp: string
  } {
    return {
      sessionId: this.sessionId,
      history: this.sessionHistory,
      stats: this.getSessionStats(),
      provider: this.provider.getType(),
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Convenience function for one-shot queries without session management
 */
export async function claudeQuery(
  message: string, 
  options: ClaudeSDKOptions = {}
): Promise<ClaudeQueryResult> {
  const client = new ClaudeSDKClient(options)
  return await client.query(message)
}

/**
 * Factory function for creating Claude SDK clients
 */
export function createClaudeClient(options: ClaudeSDKOptions = {}): ClaudeSDKClient {
  return new ClaudeSDKClient(options)
}