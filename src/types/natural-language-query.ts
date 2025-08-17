import { PivotalMoment, MicroFactor, MacroFactor } from './moments'
import { Company, Technology } from './catalog'

// Natural Language Query Types
export interface NLQuery {
  id: string
  query: string
  timestamp: Date
  isLoading: boolean
  parsedIntent?: QueryIntent
  results?: QueryResults
  error?: string
}

export interface QueryIntent {
  type: 'search' | 'analysis' | 'comparison' | 'trend' | 'pattern' | 'filter' | 'aggregate' | 'temporal'
  entities: {
    companies: string[]
    technologies: string[]
    people: string[]
    locations: string[]
    concepts: string[]
  }
  timeframe?: {
    start?: Date
    end?: Date
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year'
    relative?: string // e.g., "last 3 months", "Q4", "this year"
  }
  factors?: {
    micro: MicroFactor[]
    macro: MacroFactor[]
  }
  metrics?: string[] // e.g., "impact", "count", "average", "growth"
  filters?: {
    impactThreshold?: number
    confidenceLevel?: 'low' | 'medium' | 'high'
    sourceType?: 'company' | 'technology'
  }
  aggregation?: 'count' | 'sum' | 'average' | 'max' | 'min' | 'group_by'
  visualization?: 'table' | 'chart' | 'timeline' | 'network' | 'heatmap' | 'cards'
  confidence: number // 0-100
}

export interface QueryResults {
  type: 'moments' | 'summary' | 'insights' | 'visualization' | 'comparison'
  data: {
    moments?: PivotalMoment[]
    summary?: string
    insights?: string[]
    metrics?: Record<string, number | string>
    entities?: {
      companies: Company[]
      technologies: Technology[]
    }
    correlations?: Array<{
      entity1: string
      entity2: string
      strength: number
      type: string
    }>
  }
  visualization?: {
    type: 'timeline' | 'bar' | 'line' | 'heatmap' | 'network' | 'table'
    config: Record<string, any>
    data: any
  }
  explanation: string
  confidence: number
  processingTime: number
}

export interface QueryContext {
  activeTab?: 'companies' | 'technologies' | 'moments' | 'dashboard' | 'graph' | 'patterns'
  selectedEntities?: string[]
  currentTimeframe?: string
  lastQueries: NLQuery[]
  availableData: {
    totalMoments: number
    companiesCount: number
    technologiesCount: number
    dateRange: {
      earliest: Date
      latest: Date
    }
  }
}

// Query processing types
export interface QueryProcessor {
  parseQuery: (query: string, context: QueryContext) => Promise<QueryIntent>
  executeQuery: (intent: QueryIntent, context: QueryContext) => Promise<QueryResults>
  generateVisualization: (results: QueryResults, intent: QueryIntent) => Promise<QueryResults>
}

// Query patterns for intent recognition
export interface QueryPattern {
  pattern: RegExp
  intentType: QueryIntent['type']
  extractEntities: (match: RegExpMatchArray) => Partial<QueryIntent>
  confidence: number
}

// Conversation history
export interface ConversationHistory {
  queries: NLQuery[]
  addQuery: (query: NLQuery) => void
  updateQuery: (id: string, updates: Partial<NLQuery>) => void
  clearHistory: () => void
  getRecentQueries: (limit?: number) => NLQuery[]
}