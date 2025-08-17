import { QueryIntent, QueryPattern, QueryContext, NLQuery } from '@/types/natural-language-query'
import { MicroFactor, MacroFactor } from '@/types/moments'

/**
 * Natural Language Query Parser
 * Interprets user queries and extracts structured intent
 */
export class QueryParser {
  private patterns: QueryPattern[] = []
  private entityPatterns: Map<string, RegExp> = new Map()
  private temporalPatterns: Map<string, RegExp> = new Map()

  constructor() {
    this.initializePatterns()
    this.initializeEntityPatterns()
    this.initializeTemporalPatterns()
  }

  /**
   * Parse a natural language query into structured intent
   */
  async parseQuery(query: string, context: QueryContext): Promise<QueryIntent> {
    const normalizedQuery = query.toLowerCase().trim()
    
    // Try to match against patterns
    let bestMatch: { pattern: QueryPattern; match: RegExpMatchArray; confidence: number } | null = null
    
    for (const pattern of this.patterns) {
      const match = normalizedQuery.match(pattern.pattern)
      if (match) {
        const confidence = this.calculateConfidence(pattern, match, context)
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { pattern, match, confidence }
        }
      }
    }

    if (bestMatch) {
      const intent = bestMatch.pattern.extractEntities(bestMatch.match)
      
      // Enhance with entity extraction
      const entities = this.extractEntities(normalizedQuery, context)
      const timeframe = this.extractTimeframe(normalizedQuery)
      const factors = this.extractFactors(normalizedQuery)
      const metrics = this.extractMetrics(normalizedQuery)
      const filters = this.extractFilters(normalizedQuery)
      const visualization = this.inferVisualization(bestMatch.pattern.intentType, normalizedQuery)

      return {
        type: bestMatch.pattern.intentType,
        entities: { ...entities, ...intent.entities },
        timeframe: timeframe || intent.timeframe,
        factors: factors || intent.factors,
        metrics: metrics || intent.metrics,
        filters: filters || intent.filters,
        visualization: visualization || intent.visualization,
        confidence: bestMatch.confidence,
        ...intent
      }
    }

    // Fallback: general search intent
    return {
      type: 'search',
      entities: this.extractEntities(normalizedQuery, context),
      timeframe: this.extractTimeframe(normalizedQuery),
      factors: this.extractFactors(normalizedQuery),
      metrics: this.extractMetrics(normalizedQuery),
      filters: this.extractFilters(normalizedQuery),
      visualization: 'cards',
      confidence: 50
    }
  }

  /**
   * Initialize query patterns for intent recognition
   */
  private initializePatterns(): void {
    this.patterns = [
      // Search patterns
      {
        pattern: /(?:show|find|get|display|list)\s+(?:me\s+)?(?:all\s+)?(?:the\s+)?moments?\s+(?:related\s+to|about|for|concerning|regarding)\s+(.+)/i,
        intentType: 'search',
        extractEntities: (match) => {
          const parsedEntities = this.parseEntityString(match[1])
          return {
            entities: {
              companies: parsedEntities.companies || [],
              technologies: parsedEntities.technologies || [],
              people: parsedEntities.people || [],
              locations: parsedEntities.locations || [],
              concepts: parsedEntities.concepts || []
            }
          }
        },
        confidence: 85
      },
      
      // Analysis patterns
      {
        pattern: /(?:what|how)\s+(?:are\s+)?(?:the\s+)?(?:patterns?|trends?)\s+(?:emerged?|appeared?|developed?)\s+(?:after|following|since)\s+(.+)/i,
        intentType: 'analysis',
        extractEntities: (match) => {
          const parsedEntities = this.parseEntityString(match[1])
          return {
            entities: {
              companies: parsedEntities.companies || [],
              technologies: parsedEntities.technologies || [],
              people: parsedEntities.people || [],
              locations: parsedEntities.locations || [],
              concepts: parsedEntities.concepts || []
            },
            type: 'pattern'
          }
        },
        confidence: 90
      },

      // Temporal analysis
      {
        pattern: /(?:show|analyze|track)\s+(?:me\s+)?(?:activity|moments|trends)\s+(?:in|during|for)\s+(.+)/i,
        intentType: 'temporal',
        extractEntities: (match) => ({
          timeframe: this.parseTimeframeString(match[1])
        }),
        confidence: 80
      },

      // Comparison patterns
      {
        pattern: /(?:compare|contrast)\s+(.+?)\s+(?:and|vs|versus|with)\s+(.+)/i,
        intentType: 'comparison',
        extractEntities: (match) => {
          const entities1 = this.parseEntityString(match[1])
          const entities2 = this.parseEntityString(match[2])
          return {
            entities: {
              companies: [...(entities1.companies || []), ...(entities2.companies || [])],
              technologies: [...(entities1.technologies || []), ...(entities2.technologies || [])],
              people: [...(entities1.people || []), ...(entities2.people || [])],
              locations: [...(entities1.locations || []), ...(entities2.locations || [])],
              concepts: [...(entities1.concepts || []), ...(entities2.concepts || [])]
            }
          }
        },
        confidence: 85
      },

      // Aggregation patterns
      {
        pattern: /(?:how\s+many|count|total|sum)\s+(.+)/i,
        intentType: 'aggregate',
        extractEntities: (match) => {
          const parsedEntities = this.parseEntityString(match[1])
          return {
            aggregation: 'count',
            entities: {
              companies: parsedEntities.companies || [],
              technologies: parsedEntities.technologies || [],
              people: parsedEntities.people || [],
              locations: parsedEntities.locations || [],
              concepts: parsedEntities.concepts || []
            }
          }
        },
        confidence: 80
      },

      // Filter patterns
      {
        pattern: /(?:moments?\s+with|high\s+impact|significant)\s+(.+)/i,
        intentType: 'filter',
        extractEntities: (match) => {
          const parsedEntities = this.parseEntityString(match[1])
          return {
            filters: { impactThreshold: 70 },
            entities: {
              companies: parsedEntities.companies || [],
              technologies: parsedEntities.technologies || [],
              people: parsedEntities.people || [],
              locations: parsedEntities.locations || [],
              concepts: parsedEntities.concepts || []
            }
          }
        },
        confidence: 75
      },

      // Trend patterns
      {
        pattern: /(?:trending|emerging|growing|declining)\s+(.+)/i,
        intentType: 'trend',
        extractEntities: (match) => {
          const parsedEntities = this.parseEntityString(match[1])
          return {
            entities: {
              companies: parsedEntities.companies || [],
              technologies: parsedEntities.technologies || [],
              people: parsedEntities.people || [],
              locations: parsedEntities.locations || [],
              concepts: parsedEntities.concepts || []
            }
          }
        },
        confidence: 80
      }
    ]
  }

  /**
   * Initialize entity recognition patterns
   */
  private initializeEntityPatterns(): void {
    // Company patterns
    this.entityPatterns.set('companies', /(?:companies?|corporations?|firms?|businesses?|startups?)\s+(?:like\s+)?([^,\s]+(?:\s+[^,\s]+)*)/gi)
    
    // Technology patterns  
    this.entityPatterns.set('technologies', /(?:technologies?|tech|AI|artificial\s+intelligence|machine\s+learning|ML|neural\s+networks?|algorithms?)\s+(?:like\s+)?([^,\s]+(?:\s+[^,\s]+)*)/gi)
    
    // People patterns
    this.entityPatterns.set('people', /(?:CEO|founder|executive|leader|person|people)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi)
    
    // Location patterns
    this.entityPatterns.set('locations', /(?:in|from|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi)
  }

  /**
   * Initialize temporal pattern recognition
   */
  private initializeTemporalPatterns(): void {
    this.temporalPatterns.set('relative', /(?:last|past|previous)\s+(\d+)\s+(days?|weeks?|months?|quarters?|years?)/gi)
    this.temporalPatterns.set('specific', /(Q[1-4])\s+(\d{4})|(\d{4})/gi)
    this.temporalPatterns.set('range', /(?:from|since)\s+(.+?)\s+(?:to|until)\s+(.+)/gi)
    this.temporalPatterns.set('period', /(today|yesterday|this\s+week|this\s+month|this\s+year)/gi)
  }

  /**
   * Extract entities from query text
   */
  private extractEntities(query: string, context: QueryContext): QueryIntent['entities'] {
    const entities: QueryIntent['entities'] = {
      companies: [],
      technologies: [],
      people: [],
      locations: [],
      concepts: []
    }

    // Extract using patterns
    for (const [type, pattern] of this.entityPatterns) {
      const matches = Array.from(query.matchAll(pattern))
      for (const match of matches) {
        if (match[1]) {
          const entity = match[1].trim()
          if (type === 'companies' || type === 'technologies' || type === 'people' || type === 'locations') {
            entities[type as keyof typeof entities].push(entity)
          }
        }
      }
    }

    // Extract known entities from context
    if (context.availableData) {
      entities.companies.push(...this.extractKnownEntities(query, 'company'))
      entities.technologies.push(...this.extractKnownEntities(query, 'technology'))
    }

    // Extract general concepts
    entities.concepts = this.extractConcepts(query)

    return entities
  }

  /**
   * Extract timeframe information
   */
  private extractTimeframe(query: string): QueryIntent['timeframe'] | undefined {
    // Check for relative timeframes
    const relativeMatch = query.match(/(?:last|past|previous)\s+(\d+)\s+(days?|weeks?|months?|quarters?|years?)/i)
    if (relativeMatch) {
      return {
        relative: `${relativeMatch[1]} ${relativeMatch[2]}`
      }
    }

    // Check for specific periods
    const periodMatch = query.match(/(Q[1-4])\s+(\d{4})/i)
    if (periodMatch) {
      return {
        relative: `${periodMatch[1]} ${periodMatch[2]}`
      }
    }

    // Check for current periods
    const currentMatch = query.match(/(today|yesterday|this\s+week|this\s+month|this\s+year)/i)
    if (currentMatch) {
      return {
        relative: currentMatch[1]
      }
    }

    return undefined
  }

  /**
   * Extract factor classifications
   */
  private extractFactors(query: string): QueryIntent['factors'] | undefined {
    const microFactors: MicroFactor[] = []
    const macroFactors: MacroFactor[] = []

    // Micro factors
    if (/compan(y|ies)|firm|business|startup/i.test(query)) microFactors.push('company')
    if (/compet|rival|versus|vs/i.test(query)) microFactors.push('competition')
    if (/partner|alliance|collaboration/i.test(query)) microFactors.push('partners')
    if (/customer|client|user/i.test(query)) microFactors.push('customers')

    // Macro factors
    if (/economic|financial|market|revenue|funding/i.test(query)) macroFactors.push('economic')
    if (/regulation|law|legal|compliance|policy/i.test(query)) macroFactors.push('regulation')
    if (/technolog|AI|innovation|breakthrough/i.test(query)) macroFactors.push('technology')
    if (/geopolit|international|global|country/i.test(query)) macroFactors.push('geo_political')
    if (/environment|sustainability|climate/i.test(query)) macroFactors.push('environment')
    if (/supply|chain|logistics|production/i.test(query)) macroFactors.push('supply_chain')

    if (microFactors.length > 0 || macroFactors.length > 0) {
      return { micro: microFactors, macro: macroFactors }
    }

    return undefined
  }

  /**
   * Extract metrics from query
   */
  private extractMetrics(query: string): string[] {
    const metrics: string[] = []

    if (/impact|importance|significant/i.test(query)) metrics.push('impact')
    if (/count|number|total|how\s+many/i.test(query)) metrics.push('count')
    if (/average|mean/i.test(query)) metrics.push('average')
    if (/growth|increase|trend/i.test(query)) metrics.push('growth')
    if (/confidence|certainty/i.test(query)) metrics.push('confidence')

    return metrics
  }

  /**
   * Extract filter criteria
   */
  private extractFilters(query: string): QueryIntent['filters'] | undefined {
    const filters: QueryIntent['filters'] = {}

    // Impact threshold
    if (/high\s+impact|significant|important/i.test(query)) {
      filters.impactThreshold = 70
    } else if (/medium\s+impact|moderate/i.test(query)) {
      filters.impactThreshold = 40
    } else if (/low\s+impact|minor/i.test(query)) {
      filters.impactThreshold = 20
    }

    // Confidence level
    if (/high\s+confidence|certain|sure/i.test(query)) {
      filters.confidenceLevel = 'high'
    } else if (/medium\s+confidence|likely/i.test(query)) {
      filters.confidenceLevel = 'medium'
    } else if (/low\s+confidence|uncertain/i.test(query)) {
      filters.confidenceLevel = 'low'
    }

    // Source type
    if (/compan(y|ies)/i.test(query) && !/technolog/i.test(query)) {
      filters.sourceType = 'company'
    } else if (/technolog/i.test(query) && !/compan/i.test(query)) {
      filters.sourceType = 'technology'
    }

    return Object.keys(filters).length > 0 ? filters : undefined
  }

  /**
   * Infer visualization type based on intent and query
   */
  private inferVisualization(intentType: QueryIntent['type'], query: string): QueryIntent['visualization'] {
    // Explicit visualization requests
    if (/chart|graph/i.test(query)) return 'chart'
    if (/timeline|chronolog|time\s+series/i.test(query)) return 'timeline'
    if (/network|connection|relationship/i.test(query)) return 'network'
    if (/table|list/i.test(query)) return 'table'
    if (/heatmap|matrix/i.test(query)) return 'heatmap'

    // Intent-based inference
    switch (intentType) {
      case 'temporal': return 'timeline'
      case 'comparison': return 'chart'
      case 'aggregate': return 'chart'
      case 'trend': return 'chart'
      case 'pattern': return 'network'
      default: return 'cards'
    }
  }

  /**
   * Helper methods
   */
  private parseEntityString(entityString: string): Partial<QueryIntent['entities']> {
    // Simple entity parsing - can be enhanced with NER
    const entities: Partial<QueryIntent['entities']> = {
      companies: [],
      technologies: [],
      concepts: []
    }

    // Split by common delimiters
    const parts = entityString.split(/[,\s+and\s+|\s+or\s+|&]/i)
    
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed.length > 0) {
        // Simple heuristic classification
        if (/AI|artificial\s+intelligence|machine\s+learning|ML|algorithm|neural|deep\s+learning/i.test(trimmed)) {
          entities.technologies?.push(trimmed)
        } else if (/Inc\.|Corp\.|LLC|Ltd\.|Company/i.test(trimmed) || /^[A-Z][a-z]+$/.test(trimmed)) {
          entities.companies?.push(trimmed)
        } else {
          entities.concepts?.push(trimmed)
        }
      }
    }

    return entities
  }

  private parseTimeframeString(timeString: string): QueryIntent['timeframe'] {
    return {
      relative: timeString.trim()
    }
  }

  private extractKnownEntities(query: string, type: 'company' | 'technology'): string[] {
    // This would integrate with the catalog to find known entities
    // For now, return empty array - to be enhanced with catalog integration
    return []
  }

  private extractConcepts(query: string): string[] {
    const concepts: string[] = []
    
    // Extract key domain concepts
    const conceptPatterns = [
      /AI\s+regulation/gi,
      /machine\s+learning/gi,
      /artificial\s+intelligence/gi,
      /deep\s+learning/gi,
      /neural\s+networks?/gi,
      /data\s+privacy/gi,
      /cybersecurity/gi,
      /cloud\s+computing/gi,
      /quantum\s+computing/gi,
      /blockchain/gi,
      /cryptocurrency/gi,
      /fintech/gi,
      /healthtech/gi,
      /edtech/gi
    ]

    for (const pattern of conceptPatterns) {
      const matches = Array.from(query.matchAll(pattern))
      for (const match of matches) {
        concepts.push(match[0])
      }
    }

    return concepts
  }

  private calculateConfidence(pattern: QueryPattern, match: RegExpMatchArray, context: QueryContext): number {
    let baseConfidence = pattern.confidence
    
    // Boost confidence based on context
    if (context.activeTab && this.isRelevantToTab(pattern.intentType, context.activeTab)) {
      baseConfidence += 10
    }
    
    // Reduce confidence for very short matches
    if (match[0].length < 10) {
      baseConfidence -= 15
    }
    
    return Math.min(100, Math.max(0, baseConfidence))
  }

  private isRelevantToTab(intentType: QueryIntent['type'], tab: string): boolean {
    const relevanceMap: Record<string, QueryIntent['type'][]> = {
      'moments': ['search', 'filter', 'temporal'],
      'dashboard': ['analysis', 'aggregate', 'trend'],
      'graph': ['pattern', 'comparison'],
      'patterns': ['pattern', 'analysis']
    }
    
    return relevanceMap[tab]?.includes(intentType) || false
  }
}