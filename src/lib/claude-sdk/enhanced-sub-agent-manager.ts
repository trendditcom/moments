/**
 * Enhanced Sub-Agent Manager with Claude Code SDK Integration
 * Combines provider abstraction with Claude Code SDK capabilities for advanced agent workflows
 */

import { AgentConfig, SubAgentConfigs } from '@/types/moments'
import { PivotalMoment, MomentCorrelation } from '@/types/moments'
import { ContentItem } from '@/types/catalog'
import { ClaudeSDKClient, ClaudeSDKOptions, ClaudeQueryResult } from './client-wrapper'
import { SessionManager, SessionData, createSessionManager } from './session-manager'
import { PromptCache, getGlobalPromptCache } from './prompt-cache'
import { ProviderAdapter, createProviderAdapter } from './provider-adapter'
import { ModelProvider } from '../model-providers/provider-interface'
import { ModelProviderFactory } from '../model-providers/provider-factory'
import { loadConfigClient } from '../config-loader.client'

interface EnhancedAgentResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  processingTime: number
  provider?: string
  model?: string
  sessionId?: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  cost?: number
  cacheHit?: boolean
  metadata?: Record<string, any>
}

interface AgentSession {
  sessionId: string
  client: ClaudeSDKClient
  agentType: string
  createdAt: string
  lastActivity: string
  messageCount: number
}

interface WorkflowStep {
  agentType: string
  prompt: string
  expectedFormat?: 'json' | 'text' | 'markdown'
  dependencies?: string[]
  parallel?: boolean
}

interface WorkflowResult {
  success: boolean
  results: Map<string, EnhancedAgentResponse>
  totalTime: number
  totalCost: number
  totalTokens: number
  failedSteps: string[]
}

/**
 * Enhanced Sub-Agent Manager with Claude Code SDK Integration
 */
export class EnhancedSubAgentManager {
  private sessionManager: SessionManager
  private promptCache: PromptCache
  private providerAdapter: ProviderAdapter
  private configs!: SubAgentConfigs
  private activeSessions = new Map<string, AgentSession>()
  private workflowHistory: Array<{ workflowId: string; timestamp: string; result: WorkflowResult }> = []

  constructor() {
    this.sessionManager = createSessionManager({
      persistence: 'localStorage',
      defaultOptions: {
        max_turns: 10,
        temperature: 0.7,
        maxTokens: 4000,
        enableCaching: true
      }
    })
    
    this.promptCache = getGlobalPromptCache()
    this.providerAdapter = createProviderAdapter()
    
    this.initializeAsync()
  }

  /**
   * Initialize manager with configuration
   */
  private async initializeAsync(): Promise<void> {
    try {
      const config = await loadConfigClient()
      this.configs = config.agents
      
      // Initialize provider factory if not already done
      if (config.model_provider) {
        const provider = ModelProviderFactory.getPrimaryProvider()
        this.providerAdapter = createProviderAdapter(provider, { enableCache: true })
      }
      
      console.log('Enhanced Sub-Agent Manager initialized with Claude Code SDK')
    } catch (error) {
      console.error('Failed to initialize Enhanced Sub-Agent Manager:', error)
      this.configs = this.getDefaultConfigs()
    }
  }

  /**
   * Create a new agent session
   */
  async createAgentSession(
    agentType: string,
    options: Partial<ClaudeSDKOptions> = {}
  ): Promise<AgentSession> {
    const agentConfig = this.configs[agentType as keyof SubAgentConfigs]
    if (!agentConfig) {
      throw new Error(`Unknown agent type: ${agentType}`)
    }

    const mergedOptions: ClaudeSDKOptions = {
      temperature: agentConfig.temperature || 0.7,
      maxTokens: 4000,
      max_turns: 10,
      enableCaching: true,
      ...options
    }

    const { sessionId, client } = await this.sessionManager.createSession(mergedOptions)
    
    const session: AgentSession = {
      sessionId,
      client,
      agentType,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0
    }

    this.activeSessions.set(sessionId, session)
    return session
  }

  /**
   * Continue conversation with an agent
   */
  async continueAgentConversation(
    sessionId: string,
    message: string,
    options: Partial<ClaudeSDKOptions> = {}
  ): Promise<EnhancedAgentResponse> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const startTime = Date.now()
    
    try {
      const result = await session.client.query(message, options)
      const processingTime = Date.now() - startTime

      // Update session metadata
      session.lastActivity = new Date().toISOString()
      session.messageCount++

      // Update session in manager
      const history = session.client.getSessionHistory()
      await this.sessionManager.updateSession(
        sessionId,
        history,
        result.usage,
        result.cost
      )

      return {
        success: true,
        data: result.content,
        processingTime,
        provider: session.client.getProviderInfo().type,
        model: result.model,
        sessionId: result.sessionId,
        usage: result.usage,
        cost: result.cost,
        cacheHit: false // Would need to be implemented in ClaudeSDKClient
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
        sessionId
      }
    }
  }

  /**
   * Execute a workflow with multiple agents
   */
  async executeWorkflow(
    workflowSteps: WorkflowStep[],
    context: Record<string, any> = {}
  ): Promise<WorkflowResult> {
    const workflowId = this.generateWorkflowId()
    const startTime = Date.now()
    const results = new Map<string, EnhancedAgentResponse>()
    const failedSteps: string[] = []
    let totalCost = 0
    let totalTokens = 0

    // Separate parallel and sequential steps
    const parallelSteps = workflowSteps.filter(step => step.parallel)
    const sequentialSteps = workflowSteps.filter(step => !step.parallel)

    try {
      // Execute parallel steps
      if (parallelSteps.length > 0) {
        const parallelPromises = parallelSteps.map(async (step) => {
          const session = await this.createAgentSession(step.agentType)
          const prompt = this.interpolatePrompt(step.prompt, context, results)
          const result = await this.continueAgentConversation(session.sessionId, prompt)
          
          if (result.success) {
            results.set(step.agentType, result)
            if (result.cost) totalCost += result.cost
            if (result.usage) totalTokens += result.usage.totalTokens || 0
          } else {
            failedSteps.push(step.agentType)
          }

          // Close session
          await this.sessionManager.closeSession(session.sessionId)
          this.activeSessions.delete(session.sessionId)

          return { stepType: step.agentType, result }
        })

        await Promise.all(parallelPromises)
      }

      // Execute sequential steps
      for (const step of sequentialSteps) {
        // Check dependencies
        if (step.dependencies) {
          const missingDeps = step.dependencies.filter(dep => !results.has(dep))
          if (missingDeps.length > 0) {
            failedSteps.push(step.agentType)
            continue
          }
        }

        const session = await this.createAgentSession(step.agentType)
        const prompt = this.interpolatePrompt(step.prompt, context, results)
        const result = await this.continueAgentConversation(session.sessionId, prompt)
        
        if (result.success) {
          results.set(step.agentType, result)
          if (result.cost) totalCost += result.cost
          if (result.usage) totalTokens += result.usage.totalTokens || 0
        } else {
          failedSteps.push(step.agentType)
        }

        // Close session
        await this.sessionManager.closeSession(session.sessionId)
        this.activeSessions.delete(session.sessionId)
      }

      const workflowResult: WorkflowResult = {
        success: failedSteps.length === 0,
        results,
        totalTime: Date.now() - startTime,
        totalCost,
        totalTokens,
        failedSteps
      }

      // Store workflow history
      this.workflowHistory.push({
        workflowId,
        timestamp: new Date().toISOString(),
        result: workflowResult
      })

      return workflowResult

    } catch (error: any) {
      return {
        success: false,
        results,
        totalTime: Date.now() - startTime,
        totalCost,
        totalTokens,
        failedSteps: workflowSteps.map(s => s.agentType)
      }
    }
  }

  /**
   * Analyze content using multiple agents
   */
  async analyzeContent(
    content: ContentItem[],
    analysisType: 'moments' | 'classification' | 'correlation' = 'moments'
  ): Promise<EnhancedAgentResponse> {
    const workflow: WorkflowStep[] = []

    switch (analysisType) {
      case 'moments':
        workflow.push({
          agentType: 'content_analyzer',
          prompt: `Analyze the following content for pivotal moments:\n\n${this.formatContentForAnalysis(content)}`,
          expectedFormat: 'json'
        })
        break

      case 'classification':
        workflow.push(
          {
            agentType: 'content_analyzer',
            prompt: `Extract key information from:\n\n${this.formatContentForAnalysis(content)}`,
            expectedFormat: 'json'
          },
          {
            agentType: 'classification_agent',
            prompt: 'Classify the extracted information by factors',
            expectedFormat: 'json',
            dependencies: ['content_analyzer']
          }
        )
        break

      case 'correlation':
        workflow.push(
          {
            agentType: 'content_analyzer',
            prompt: `Analyze content:\n\n${this.formatContentForAnalysis(content)}`,
            expectedFormat: 'json'
          },
          {
            agentType: 'classification_agent',
            prompt: 'Classify extracted information',
            expectedFormat: 'json',
            dependencies: ['content_analyzer']
          },
          {
            agentType: 'correlation_engine',
            prompt: 'Identify correlations between classified information',
            expectedFormat: 'json',
            dependencies: ['classification_agent']
          }
        )
        break
    }

    const workflowResult = await this.executeWorkflow(workflow, { content })
    
    // Combine results into single response
    const combinedData = Array.from(workflowResult.results.values())
      .filter(r => r.success)
      .map(r => r.data)

    return {
      success: workflowResult.success,
      data: combinedData,
      processingTime: workflowResult.totalTime,
      usage: {
        inputTokens: 0, // Would need to be calculated
        outputTokens: 0,
        totalTokens: workflowResult.totalTokens
      },
      cost: workflowResult.totalCost,
      metadata: {
        workflowSteps: workflow.length,
        failedSteps: workflowResult.failedSteps,
        analysisType
      }
    }
  }

  /**
   * Stream responses from agent
   */
  async *streamAgentResponse(
    sessionId: string,
    message: string,
    options: Partial<ClaudeSDKOptions> = {}
  ): AsyncIterableIterator<{ type: 'chunk' | 'complete'; content: string; metadata?: any }> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    try {
      for await (const chunk of session.client.queryStream(message, options)) {
        if (chunk.type === 'text' && chunk.content) {
          yield {
            type: 'chunk',
            content: chunk.content,
            metadata: { sessionId, agentType: session.agentType }
          }
        } else if (chunk.type === 'error') {
          yield {
            type: 'complete',
            content: '',
            metadata: { error: chunk.error, sessionId }
          }
          return
        }
      }

      yield {
        type: 'complete',
        content: '',
        metadata: { sessionId, completed: true }
      }

    } catch (error: any) {
      yield {
        type: 'complete',
        content: '',
        metadata: { error: error.message, sessionId }
      }
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(): Promise<{
    totalSessions: number
    activeSessions: number
    totalCost: number
    totalTokens: number
    avgSessionLength: number
    topAgentTypes: Array<{ agentType: string; usageCount: number }>
  }> {
    const sessionStats = await this.sessionManager.getSessionStats()
    const activeSessionsCount = this.activeSessions.size
    
    // Analyze agent type usage
    const agentTypeUsage = new Map<string, number>()
    for (const session of this.activeSessions.values()) {
      const current = agentTypeUsage.get(session.agentType) || 0
      agentTypeUsage.set(session.agentType, current + 1)
    }

    const topAgentTypes = Array.from(agentTypeUsage.entries())
      .map(([agentType, usageCount]) => ({ agentType, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)

    return {
      totalSessions: sessionStats.totalSessions,
      activeSessions: activeSessionsCount,
      totalCost: sessionStats.totalCost,
      totalTokens: sessionStats.totalTokens,
      avgSessionLength: sessionStats.averageSessionLength,
      topAgentTypes
    }
  }

  /**
   * Cleanup old sessions and cache
   */
  async cleanup(maxAgeDays: number = 7): Promise<{
    deletedSessions: number
    cleanedCacheEntries: number
  }> {
    const deletedSessions = await this.sessionManager.cleanupOldSessions(maxAgeDays)
    const cleanedCacheEntries = this.promptCache.cleanup()

    return {
      deletedSessions,
      cleanedCacheEntries
    }
  }

  /**
   * Export workflow history for analysis
   */
  exportWorkflowHistory(): string {
    return JSON.stringify({
      workflows: this.workflowHistory,
      exportedAt: new Date().toISOString(),
      totalWorkflows: this.workflowHistory.length
    })
  }

  /**
   * Switch provider for all future operations
   */
  async switchProvider(provider: 'anthropic' | 'bedrock'): Promise<void> {
    const newProvider = ModelProviderFactory.getProvider(provider)
    this.providerAdapter.switchProvider(newProvider)
    
    // Close all active sessions as they may be using different provider
    for (const [sessionId, session] of this.activeSessions.entries()) {
      await this.sessionManager.closeSession(sessionId)
    }
    this.activeSessions.clear()
  }

  // Helper methods
  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private interpolatePrompt(
    template: string,
    context: Record<string, any>,
    results: Map<string, EnhancedAgentResponse>
  ): string {
    let prompt = template

    // Replace context variables
    for (const [key, value] of Object.entries(context)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }

    // Replace result references
    for (const [agentType, result] of results.entries()) {
      prompt = prompt.replace(
        new RegExp(`{{${agentType}.result}}`, 'g'),
        result.data || ''
      )
    }

    return prompt
  }

  private formatContentForAnalysis(content: ContentItem[]): string {
    return content.map(item => `
**${item.name}**
${item.content || 'No content'}
---
`).join('\n')
  }

  private getDefaultConfigs(): SubAgentConfigs {
    return {
      content_analyzer: {
        enabled: true,
        model: "sonnet",
        temperature: 0.7
      },
      classification_agent: {
        enabled: true,
        model: "sonnet",
        temperature: 0.5
      },
      correlation_engine: {
        enabled: true,
        model: "sonnet",
        temperature: 0.6
      },
      report_generator: {
        enabled: true,
        model: "sonnet",
        temperature: 0.4
      }
    }
  }
}

/**
 * Global enhanced sub-agent manager instance
 */
let globalEnhancedManager: EnhancedSubAgentManager | null = null

export function getGlobalEnhancedSubAgentManager(): EnhancedSubAgentManager {
  if (!globalEnhancedManager) {
    globalEnhancedManager = new EnhancedSubAgentManager()
  }
  return globalEnhancedManager
}

export function setGlobalEnhancedSubAgentManager(manager: EnhancedSubAgentManager): void {
  globalEnhancedManager = manager
}