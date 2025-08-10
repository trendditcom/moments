import { 
  MicroFactor, 
  MacroFactor, 
  Factor,
  PivotalMoment,
  MomentClassification,
  ConfidenceLevel
} from '@/types/moments'

export interface FactorDefinition {
  factor: Factor
  category: 'micro' | 'macro'
  description: string
  examples: string[]
  keywords: string[]
}

// Comprehensive factor definitions based on specs/macro-factors.md
export const FACTOR_DEFINITIONS: FactorDefinition[] = [
  // Micro Factors
  {
    factor: 'company',
    category: 'micro',
    description: 'Internal company developments and strategic changes',
    examples: [
      'Leadership changes',
      'Key hires',
      'Product launches / features',
      'AI model releases',
      'Tech stack changes',
      'IP filings',
      'M&A activity',
      'Strategic pivots',
      'Funding rounds',
      'Geographic expansion'
    ],
    keywords: [
      'ceo', 'cto', 'founder', 'hire', 'join', 'appointment', 'leadership',
      'product', 'launch', 'release', 'feature', 'model', 'api',
      'patent', 'intellectual property', 'acquisition', 'merger',
      'pivot', 'strategy', 'funding', 'series', 'investment', 'valuation',
      'expansion', 'market', 'office', 'international'
    ]
  },
  {
    factor: 'competition',
    category: 'micro',
    description: 'Competitive dynamics and market positioning',
    examples: [
      'Competitor breakthroughs',
      'Competitive hires',
      'Market share changes',
      'Competitive product launches'
    ],
    keywords: [
      'competitor', 'rival', 'compete', 'market share', 'benchmark',
      'versus', 'compared to', 'outperform', 'breakthrough', 'advantage'
    ]
  },
  {
    factor: 'partners',
    category: 'micro',
    description: 'Partnership ecosystem and strategic alliances',
    examples: [
      'Partnerships',
      'Partner attrition',
      'Integration programs',
      'Ecosystem development'
    ],
    keywords: [
      'partnership', 'alliance', 'collaboration', 'integration',
      'ecosystem', 'partner', 'joint', 'co-development', 'consortium'
    ]
  },
  {
    factor: 'customers',
    category: 'micro',
    description: 'Customer relationships and market adoption',
    examples: [
      'Major customer wins',
      'Customer losses',
      'Customer advocacy',
      'Customer disputes',
      'Usage growth',
      'Retention rates'
    ],
    keywords: [
      'customer', 'client', 'user', 'adoption', 'retention',
      'churn', 'contract', 'deal', 'win', 'loss', 'testimonial',
      'case study', 'deployment', 'implementation'
    ]
  },
  // Macro Factors
  {
    factor: 'economic',
    category: 'macro',
    description: 'Economic conditions and financial market impacts',
    examples: [
      'Interest rate changes',
      'Inflation impacts',
      'Funding climate shifts',
      'Economic recession/growth',
      'Currency fluctuations'
    ],
    keywords: [
      'interest rate', 'inflation', 'economic', 'recession', 'growth',
      'gdp', 'market', 'financial', 'funding', 'investment', 'venture capital',
      'vc', 'valuation', 'bubble', 'correction', 'currency'
    ]
  },
  {
    factor: 'geo_political',
    category: 'macro',
    description: 'Geopolitical events and international relations',
    examples: [
      'Trade policy changes',
      'International sanctions',
      'Diplomatic relations',
      'Export restrictions',
      'Cross-border tensions'
    ],
    keywords: [
      'trade', 'tariff', 'sanctions', 'export', 'import', 'geopolitical',
      'diplomatic', 'international', 'government', 'policy', 'restriction',
      'ban', 'embargo', 'treaty', 'agreement'
    ]
  },
  {
    factor: 'regulation',
    category: 'macro',
    description: 'Regulatory changes and legal framework developments',
    examples: [
      'AI governance laws',
      'Privacy regulations',
      'Sector-specific rules',
      'Compliance requirements',
      'Legal precedents'
    ],
    keywords: [
      'regulation', 'law', 'legal', 'compliance', 'gdpr', 'privacy',
      'ai act', 'governance', 'ethics', 'transparency', 'audit',
      'liability', 'copyright', 'data protection', 'regulatory'
    ]
  },
  {
    factor: 'technology',
    category: 'macro',
    description: 'Technological breakthroughs and industry-wide innovations',
    examples: [
      'Foundation model breakthroughs',
      'Open source releases',
      'Compute advances',
      'Quantum computing progress',
      'Infrastructure improvements'
    ],
    keywords: [
      'breakthrough', 'innovation', 'technology', 'advancement',
      'open source', 'model', 'algorithm', 'compute', 'gpu', 'chip',
      'quantum', 'infrastructure', 'cloud', 'edge', 'performance',
      'efficiency', 'scalability'
    ]
  },
  {
    factor: 'environment',
    category: 'macro',
    description: 'Environmental factors and sustainability concerns',
    examples: [
      'Climate change impacts',
      'Carbon regulations',
      'Energy efficiency requirements',
      'Sustainability initiatives',
      'Natural disasters'
    ],
    keywords: [
      'climate', 'carbon', 'environment', 'sustainability', 'energy',
      'green', 'renewable', 'emissions', 'footprint', 'disaster',
      'flood', 'hurricane', 'earthquake', 'weather'
    ]
  },
  {
    factor: 'supply_chain',
    category: 'macro',
    description: 'Supply chain disruptions and logistics challenges',
    examples: [
      'Chip shortages',
      'Manufacturing delays',
      'Logistics disruptions',
      'Material costs',
      'Global supply issues'
    ],
    keywords: [
      'supply chain', 'shortage', 'manufacturing', 'logistics',
      'delivery', 'delay', 'disruption', 'materials', 'components',
      'chips', 'semiconductor', 'production', 'inventory'
    ]
  }
]

export class FactorClassifier {
  private factorMap: Map<Factor, FactorDefinition>

  constructor() {
    this.factorMap = new Map(FACTOR_DEFINITIONS.map(def => [def.factor, def]))
  }

  /**
   * Classify text content and extract relevant factors
   */
  classifyContent(text: string): {
    microFactors: MicroFactor[]
    macroFactors: MacroFactor[]
    confidence: ConfidenceLevel
    reasoning: string
    keywords: string[]
  } {
    const lowercaseText = text.toLowerCase()
    const detectedFactors: { factor: Factor; score: number; matchedKeywords: string[] }[] = []

    // Analyze each factor for keyword matches
    for (const [factor, definition] of Array.from(this.factorMap)) {
      const matchedKeywords: string[] = []
      let score = 0

      // Check for keyword matches
      for (const keyword of definition.keywords) {
        if (lowercaseText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword)
          score += 1
        }
      }

      // Check for example phrase matches (higher weight)
      for (const example of definition.examples) {
        if (lowercaseText.includes(example.toLowerCase())) {
          matchedKeywords.push(example)
          score += 2
        }
      }

      if (score > 0) {
        detectedFactors.push({ factor, score, matchedKeywords })
      }
    }

    // Sort by score and confidence
    detectedFactors.sort((a, b) => b.score - a.score)

    // Separate micro and macro factors
    const microFactors = detectedFactors
      .filter(d => this.factorMap.get(d.factor)?.category === 'micro')
      .map(d => d.factor as MicroFactor)
    
    const macroFactors = detectedFactors
      .filter(d => this.factorMap.get(d.factor)?.category === 'macro')
      .map(d => d.factor as MacroFactor)

    // Calculate confidence based on number and strength of matches
    const totalScore = detectedFactors.reduce((sum, d) => sum + d.score, 0)
    const confidence: ConfidenceLevel = 
      totalScore >= 5 ? 'high' :
      totalScore >= 2 ? 'medium' : 'low'

    // Generate reasoning
    const topMatches = detectedFactors.slice(0, 3)
    const reasoning = topMatches.length > 0
      ? `Classified based on detected factors: ${topMatches.map(m => 
          `${m.factor} (${m.matchedKeywords.slice(0, 3).join(', ')})`
        ).join('; ')}`
      : 'No clear factor indicators found in content'

    // Collect all matched keywords
    const allKeywords = Array.from(new Set(detectedFactors.flatMap(d => d.matchedKeywords)))

    return {
      microFactors,
      macroFactors,
      confidence,
      reasoning,
      keywords: allKeywords
    }
  }

  /**
   * Validate and enhance existing moment classifications
   */
  validateClassification(moment: PivotalMoment): MomentClassification {
    const textAnalysis = this.classifyContent(moment.content + ' ' + moment.description)
    
    // Merge with existing classification, preferring detected factors
    const enhancedClassification: MomentClassification = {
      microFactors: Array.from(new Set([...moment.classification.microFactors, ...textAnalysis.microFactors])),
      macroFactors: Array.from(new Set([...moment.classification.macroFactors, ...textAnalysis.macroFactors])),
      confidence: this.calculateCombinedConfidence(moment.classification.confidence, textAnalysis.confidence),
      reasoning: moment.classification.reasoning + 
        (textAnalysis.reasoning !== moment.classification.reasoning 
          ? ` Additional analysis: ${textAnalysis.reasoning}` 
          : ''),
      keywords: Array.from(new Set([...moment.classification.keywords, ...textAnalysis.keywords]))
    }

    return enhancedClassification
  }

  /**
   * Get factor definition by factor name
   */
  getFactorDefinition(factor: Factor): FactorDefinition | undefined {
    return this.factorMap.get(factor)
  }

  /**
   * Get all factors by category
   */
  getFactorsByCategory(category: 'micro' | 'macro'): FactorDefinition[] {
    return FACTOR_DEFINITIONS.filter(def => def.category === category)
  }

  /**
   * Calculate impact score based on factors and content
   */
  calculateImpactScore(moment: PivotalMoment): number {
    let baseScore = 50
    
    // Factor-based scoring
    const microFactorWeight = 15
    const macroFactorWeight = 20
    
    baseScore += moment.classification.microFactors.length * microFactorWeight
    baseScore += moment.classification.macroFactors.length * macroFactorWeight
    
    // Confidence-based modifier
    const confidenceMultiplier = {
      'low': 0.8,
      'medium': 1.0,
      'high': 1.2
    }
    
    baseScore *= confidenceMultiplier[moment.classification.confidence]
    
    // Keyword density bonus
    const keywordDensity = moment.classification.keywords.length / Math.max(moment.content.split(' ').length, 1)
    baseScore += keywordDensity * 100
    
    // Entity count bonus (companies, technologies mentioned)
    const entityCount = Object.values(moment.entities).flat().length
    baseScore += entityCount * 2
    
    // Cap at 100
    return Math.min(Math.round(baseScore), 100)
  }

  private calculateCombinedConfidence(
    existing: ConfidenceLevel, 
    detected: ConfidenceLevel
  ): ConfidenceLevel {
    const confidenceScores = { 'low': 1, 'medium': 2, 'high': 3 }
    const avgScore = (confidenceScores[existing] + confidenceScores[detected]) / 2
    
    if (avgScore >= 2.5) return 'high'
    if (avgScore >= 1.5) return 'medium'
    return 'low'
  }
}

// Singleton instance for global use
export const factorClassifier = new FactorClassifier()

// Utility functions
export function getMicroFactors(): MicroFactor[] {
  return FACTOR_DEFINITIONS
    .filter(def => def.category === 'micro')
    .map(def => def.factor as MicroFactor)
}

export function getMacroFactors(): MacroFactor[] {
  return FACTOR_DEFINITIONS
    .filter(def => def.category === 'macro')
    .map(def => def.factor as MacroFactor)
}

export function getAllFactors(): Factor[] {
  return FACTOR_DEFINITIONS.map(def => def.factor)
}

export function getFactorColor(factor: Factor): string {
  // Color mapping for UI components
  const colorMap: Record<Factor, string> = {
    // Micro factors - blue tones
    company: 'bg-blue-100 text-blue-800',
    competition: 'bg-purple-100 text-purple-800', 
    partners: 'bg-green-100 text-green-800',
    customers: 'bg-orange-100 text-orange-800',
    
    // Macro factors - darker tones
    economic: 'bg-red-100 text-red-800',
    geo_political: 'bg-gray-100 text-gray-800',
    regulation: 'bg-yellow-100 text-yellow-800',
    technology: 'bg-indigo-100 text-indigo-800',
    environment: 'bg-emerald-100 text-emerald-800',
    supply_chain: 'bg-amber-100 text-amber-800'
  }
  
  return colorMap[factor] || 'bg-gray-100 text-gray-800'
}

export function getConfidenceColor(confidence: ConfidenceLevel): string {
  const colorMap: Record<ConfidenceLevel, string> = {
    low: 'text-red-600',
    medium: 'text-yellow-600',
    high: 'text-green-600'
  }
  
  return colorMap[confidence]
}