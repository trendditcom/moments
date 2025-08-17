import { QueryProcessor, QueryIntent, QueryResults, QueryContext, NLQuery } from '@/types/natural-language-query'
import { PivotalMoment } from '@/types/moments'
import { Company, Technology } from '@/types/catalog'
import { QueryParser } from './query-parser'
import { QueryExecutor } from './query-executor'
import { v4 as uuidv4 } from 'uuid'

/**
 * Natural Language Query Processor
 * Main interface for processing natural language queries
 */
export class NaturalLanguageQueryProcessor implements QueryProcessor {
  private parser: QueryParser
  private executor: QueryExecutor | null = null

  constructor() {
    this.parser = new QueryParser()
  }

  /**
   * Update data for the query executor
   */
  updateData(moments: PivotalMoment[], companies: Company[], technologies: Technology[]): void {
    this.executor = new QueryExecutor(moments, companies, technologies)
  }

  /**
   * Parse a natural language query into structured intent
   */
  async parseQuery(query: string, context: QueryContext): Promise<QueryIntent> {
    return this.parser.parseQuery(query, context)
  }

  /**
   * Execute a parsed query intent
   */
  async executeQuery(intent: QueryIntent, context: QueryContext): Promise<QueryResults> {
    if (!this.executor) {
      return {
        type: 'summary',
        data: {
          summary: 'Query system not initialized. Please wait for data to load.'
        },
        explanation: 'The query system needs data to process your request. Please try again after the application has loaded.',
        confidence: 0,
        processingTime: 0
      }
    }

    return this.executor.executeQuery(intent, context)
  }

  /**
   * Generate visualization for query results
   */
  async generateVisualization(results: QueryResults, intent: QueryIntent): Promise<QueryResults> {
    // Visualization generation is handled within the executor
    return results
  }

  /**
   * Process a complete natural language query
   */
  async processQuery(query: string, context: QueryContext): Promise<NLQuery> {
    const queryId = uuidv4()
    const timestamp = new Date()

    const nlQuery: NLQuery = {
      id: queryId,
      query,
      timestamp,
      isLoading: true
    }

    try {
      // Parse the query
      const intent = await this.parseQuery(query, context)
      nlQuery.parsedIntent = intent

      // Execute the query
      const results = await this.executeQuery(intent, context)
      nlQuery.results = results
      nlQuery.isLoading = false

    } catch (error) {
      nlQuery.error = error instanceof Error ? error.message : 'Unknown error occurred'
      nlQuery.isLoading = false
    }

    return nlQuery
  }
}

/**
 * Conversation History Manager
 */
export class ConversationHistory {
  private queries: NLQuery[] = []
  private maxHistory: number = 50

  addQuery(query: NLQuery): void {
    this.queries.unshift(query) // Add to beginning
    
    // Trim history if needed
    if (this.queries.length > this.maxHistory) {
      this.queries = this.queries.slice(0, this.maxHistory)
    }
  }

  updateQuery(id: string, updates: Partial<NLQuery>): void {
    const index = this.queries.findIndex(q => q.id === id)
    if (index !== -1) {
      this.queries[index] = { ...this.queries[index], ...updates }
    }
  }

  clearHistory(): void {
    this.queries = []
  }

  getRecentQueries(limit: number = 10): NLQuery[] {
    return this.queries.slice(0, limit)
  }

  getAllQueries(): NLQuery[] {
    return [...this.queries]
  }

  getSuccessfulQueries(limit: number = 5): NLQuery[] {
    return this.queries
      .filter(q => !q.isLoading && !q.error && q.results)
      .slice(0, limit)
  }

  getQuerySuggestions(): string[] {
    const successfulQueries = this.getSuccessfulQueries()
    const suggestions: string[] = []

    // Extract patterns from successful queries
    for (const query of successfulQueries) {
      if (query.parsedIntent && query.results) {
        // Generate similar queries based on successful patterns
        if (query.parsedIntent.entities.companies.length > 0) {
          suggestions.push(`Show me trends for ${query.parsedIntent.entities.companies[0]}`)
        }
        
        if (query.parsedIntent.entities.technologies.length > 0) {
          suggestions.push(`Analysis of ${query.parsedIntent.entities.technologies[0]} developments`)
        }
        
        if (query.parsedIntent.timeframe) {
          suggestions.push(`What happened ${query.parsedIntent.timeframe.relative}?`)
        }
      }
    }

    // Add default suggestions
    suggestions.push(
      "Show me all high impact moments",
      "What are the trending technologies?", 
      "Compare OpenAI and Anthropic",
      "Moments related to AI regulation",
      "Analysis of Q4 2024 activity"
    )

    // Remove duplicates and return top suggestions
    return Array.from(new Set(suggestions)).slice(0, 8)
  }
}

/**
 * Query Context Builder
 */
export class QueryContextBuilder {
  static build(
    activeTab: string,
    moments: PivotalMoment[],
    companies: Company[],
    technologies: Technology[],
    selectedEntities?: string[],
    currentTimeframe?: string,
    history?: ConversationHistory
  ): QueryContext {
    const momentDates = moments.map(m => new Date(m.extractedAt))
    const earliest = momentDates.length > 0 ? new Date(Math.min(...momentDates.map(d => d.getTime()))) : new Date()
    const latest = momentDates.length > 0 ? new Date(Math.max(...momentDates.map(d => d.getTime()))) : new Date()

    return {
      activeTab: activeTab as any,
      selectedEntities,
      currentTimeframe,
      lastQueries: history?.getRecentQueries() || [],
      availableData: {
        totalMoments: moments.length,
        companiesCount: companies.length,
        technologiesCount: technologies.length,
        dateRange: {
          earliest,
          latest
        }
      }
    }
  }
}

// Export everything for easy importing
export * from './query-parser'
export * from './query-executor'
export { QueryParser, QueryExecutor }

// Create singleton instances for global use
export const naturalLanguageQueryProcessor = new NaturalLanguageQueryProcessor()
export const conversationHistory = new ConversationHistory()