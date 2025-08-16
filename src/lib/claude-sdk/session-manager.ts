/**
 * Session Manager for Claude Code SDK
 * Manages multi-turn conversations, session persistence, and context preservation
 */

import { ModelMessage } from '../model-providers/provider-interface'
import { ClaudeSDKClient, ClaudeSDKOptions } from './client-wrapper'
import { ProviderAdapter } from './provider-adapter'

export interface SessionData {
  sessionId: string
  messages: ModelMessage[]
  metadata: {
    createdAt: string
    lastActivity: string
    totalTokens: number
    totalCost: number
    messageCount: number
    provider: string
    systemPrompt?: string
  }
  options: ClaudeSDKOptions
}

export interface SessionPersistence {
  save(sessionId: string, data: SessionData): Promise<void>
  load(sessionId: string): Promise<SessionData | null>
  delete(sessionId: string): Promise<void>
  list(): Promise<string[]>
  clear(): Promise<void>
}

/**
 * Local Storage persistence implementation
 */
class LocalStoragePersistence implements SessionPersistence {
  private prefix = 'claude-session-'

  async save(sessionId: string, data: SessionData): Promise<void> {
    const key = this.prefix + sessionId
    localStorage.setItem(key, JSON.stringify(data))
  }

  async load(sessionId: string): Promise<SessionData | null> {
    const key = this.prefix + sessionId
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }

  async delete(sessionId: string): Promise<void> {
    const key = this.prefix + sessionId
    localStorage.removeItem(key)
  }

  async list(): Promise<string[]> {
    const sessions: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        sessions.push(key.replace(this.prefix, ''))
      }
    }
    return sessions
  }

  async clear(): Promise<void> {
    const keys = await this.list()
    for (const sessionId of keys) {
      await this.delete(sessionId)
    }
  }
}

/**
 * Memory-only persistence (no persistence)
 */
class MemoryPersistence implements SessionPersistence {
  private sessions = new Map<string, SessionData>()

  async save(sessionId: string, data: SessionData): Promise<void> {
    this.sessions.set(sessionId, data)
  }

  async load(sessionId: string): Promise<SessionData | null> {
    return this.sessions.get(sessionId) || null
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
  }

  async list(): Promise<string[]> {
    return Array.from(this.sessions.keys())
  }

  async clear(): Promise<void> {
    this.sessions.clear()
  }
}

/**
 * Session Manager class for managing Claude conversations
 */
export class SessionManager {
  private persistence: SessionPersistence
  private activeSessions = new Map<string, ClaudeSDKClient>()
  private defaultOptions: ClaudeSDKOptions

  constructor(
    options: {
      persistence?: SessionPersistence
      defaultOptions?: ClaudeSDKOptions
    } = {}
  ) {
    this.persistence = options.persistence || new LocalStoragePersistence()
    this.defaultOptions = {
      max_turns: 10,
      temperature: 0.7,
      maxTokens: 4000,
      enableCaching: true,
      ...options.defaultOptions
    }
  }

  /**
   * Create a new session
   */
  async createSession(
    options: ClaudeSDKOptions = {}
  ): Promise<{ sessionId: string; client: ClaudeSDKClient }> {
    const sessionId = this.generateSessionId()
    const mergedOptions = { ...this.defaultOptions, ...options, sessionId }
    
    const client = new ClaudeSDKClient(mergedOptions)
    this.activeSessions.set(sessionId, client)

    // Save initial session data
    const sessionData: SessionData = {
      sessionId,
      messages: [],
      metadata: {
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        totalTokens: 0,
        totalCost: 0,
        messageCount: 0,
        provider: client.getProviderInfo().type,
        systemPrompt: options.system_prompt
      },
      options: mergedOptions
    }

    await this.persistence.save(sessionId, sessionData)

    return { sessionId, client }
  }

  /**
   * Resume an existing session
   */
  async resumeSession(sessionId: string): Promise<ClaudeSDKClient | null> {
    // Check if session is already active
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId)!
    }

    // Load session data from persistence
    const sessionData = await this.persistence.load(sessionId)
    if (!sessionData) {
      return null
    }

    // Create new client with session options
    const client = new ClaudeSDKClient(sessionData.options)
    
    // Restore session history (this would need implementation in ClaudeSDKClient)
    // For now, we'll just track it in the session manager
    
    this.activeSessions.set(sessionId, client)

    // Update last activity
    sessionData.metadata.lastActivity = new Date().toISOString()
    await this.persistence.save(sessionId, sessionData)

    return client
  }

  /**
   * Get session data
   */
  async getSessionData(sessionId: string): Promise<SessionData | null> {
    return await this.persistence.load(sessionId)
  }

  /**
   * Update session after interaction
   */
  async updateSession(
    sessionId: string,
    messages: ModelMessage[],
    usage?: { inputTokens: number; outputTokens: number },
    cost?: number
  ): Promise<void> {
    const sessionData = await this.persistence.load(sessionId)
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`)
    }

    sessionData.messages = messages
    sessionData.metadata.lastActivity = new Date().toISOString()
    sessionData.metadata.messageCount = messages.filter(m => m.role === 'user').length
    
    if (usage) {
      sessionData.metadata.totalTokens += usage.inputTokens + usage.outputTokens
    }
    
    if (cost) {
      sessionData.metadata.totalCost += cost
    }

    await this.persistence.save(sessionId, sessionData)
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<SessionData[]> {
    const sessionIds = await this.persistence.list()
    const sessions: SessionData[] = []

    for (const sessionId of sessionIds) {
      const sessionData = await this.persistence.load(sessionId)
      if (sessionData) {
        sessions.push(sessionData)
      }
    }

    // Sort by last activity (most recent first)
    return sessions.sort((a, b) => 
      new Date(b.metadata.lastActivity).getTime() - 
      new Date(a.metadata.lastActivity).getTime()
    )
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId)
    await this.persistence.delete(sessionId)
  }

  /**
   * Clear all sessions
   */
  async clearAllSessions(): Promise<void> {
    this.activeSessions.clear()
    await this.persistence.clear()
  }

  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size
  }

  /**
   * Close an active session (removes from memory but keeps in persistence)
   */
  async closeSession(sessionId: string): Promise<void> {
    const client = this.activeSessions.get(sessionId)
    if (client) {
      // Update session with final state
      const history = client.getSessionHistory()
      await this.updateSession(sessionId, history)
      
      // Remove from active sessions
      this.activeSessions.delete(sessionId)
    }
  }

  /**
   * Continue conversation in a session
   */
  async continueConversation(
    sessionId: string,
    message: string,
    options: Partial<ClaudeSDKOptions> = {}
  ): Promise<{
    response: string
    usage?: { inputTokens: number; outputTokens: number; totalTokens: number }
    cost?: number
  }> {
    const client = await this.resumeSession(sessionId)
    if (!client) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const result = await client.query(message, options)
    
    // Update session data
    await this.updateSession(
      sessionId,
      client.getSessionHistory(),
      result.usage,
      result.cost
    )

    return {
      response: result.content,
      usage: result.usage,
      cost: result.cost
    }
  }

  /**
   * Export session for analysis
   */
  async exportSession(sessionId: string): Promise<{
    sessionData: SessionData
    analysis: {
      averageResponseLength: number
      totalInteractions: number
      conversationDuration: string
      costPerMessage: number
      tokensPerMessage: number
    }
  } | null> {
    const sessionData = await this.persistence.load(sessionId)
    if (!sessionData) {
      return null
    }

    const assistantMessages = sessionData.messages.filter(m => m.role === 'assistant')
    const userMessages = sessionData.messages.filter(m => m.role === 'user')
    
    const averageResponseLength = assistantMessages.length > 0 ?
      assistantMessages.reduce((sum, m) => sum + m.content.length, 0) / assistantMessages.length : 0

    const startTime = new Date(sessionData.metadata.createdAt)
    const endTime = new Date(sessionData.metadata.lastActivity)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationMinutes = Math.round(durationMs / 60000)

    return {
      sessionData,
      analysis: {
        averageResponseLength,
        totalInteractions: userMessages.length,
        conversationDuration: `${durationMinutes} minutes`,
        costPerMessage: userMessages.length > 0 ? 
          sessionData.metadata.totalCost / userMessages.length : 0,
        tokensPerMessage: userMessages.length > 0 ? 
          sessionData.metadata.totalTokens / userMessages.length : 0
      }
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalSessions: number
    activeSessions: number
    totalMessages: number
    totalCost: number
    totalTokens: number
    averageSessionLength: number
  }> {
    const sessions = await this.listSessions()
    
    const totalMessages = sessions.reduce((sum, s) => sum + s.metadata.messageCount, 0)
    const totalCost = sessions.reduce((sum, s) => sum + s.metadata.totalCost, 0)
    const totalTokens = sessions.reduce((sum, s) => sum + s.metadata.totalTokens, 0)
    const averageSessionLength = sessions.length > 0 ? totalMessages / sessions.length : 0

    return {
      totalSessions: sessions.length,
      activeSessions: this.activeSessions.size,
      totalMessages,
      totalCost,
      totalTokens,
      averageSessionLength
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clean up old sessions (remove sessions older than specified days)
   */
  async cleanupOldSessions(maxAgeDays: number = 30): Promise<number> {
    const sessions = await this.listSessions()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays)

    let deletedCount = 0
    for (const session of sessions) {
      const lastActivity = new Date(session.metadata.lastActivity)
      if (lastActivity < cutoffDate) {
        await this.deleteSession(session.sessionId)
        deletedCount++
      }
    }

    return deletedCount
  }
}

/**
 * Create a session manager with default configuration
 */
export function createSessionManager(options: {
  persistence?: 'localStorage' | 'memory'
  defaultOptions?: ClaudeSDKOptions
} = {}): SessionManager {
  const persistence = options.persistence === 'memory' ? 
    new MemoryPersistence() : 
    new LocalStoragePersistence()

  return new SessionManager({
    persistence,
    defaultOptions: options.defaultOptions
  })
}

/**
 * Global session manager instance
 */
let globalSessionManager: SessionManager | null = null

export function getGlobalSessionManager(): SessionManager {
  if (!globalSessionManager) {
    globalSessionManager = createSessionManager()
  }
  return globalSessionManager
}

export function setGlobalSessionManager(manager: SessionManager): void {
  globalSessionManager = manager
}