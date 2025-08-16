import Anthropic from '@anthropic-ai/sdk'
import { AgentConfig, SubAgentConfigs } from '@/types/moments'
import { PivotalMoment, MomentCorrelation } from '@/types/moments'
import { ContentItem } from '@/types/catalog'
import { ProviderAwareSubAgentManager, createProviderAwareSubAgentManager } from './sub-agents-provider-aware'

interface AgentResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  processingTime: number
}

/**
 * @deprecated This class is deprecated. Use ProviderAwareSubAgentManager instead.
 * 
 * SubAgentManager - Legacy implementation using direct Anthropic SDK
 * 
 * This class provides backward compatibility but lacks provider abstraction features.
 * For new implementations, use ProviderAwareSubAgentManager which supports:
 * - Multiple AI providers (Anthropic and Amazon Bedrock)
 * - Automatic provider failover
 * - Enhanced error handling and retry logic
 * - Usage tracking and cost estimation
 * - Provider health monitoring
 * 
 * @example
 * // Recommended new approach:
 * const manager = await createProviderAwareSubAgentManager()
 * 
 * // Legacy approach (still works):
 * const legacyManager = new SubAgentManager()
 */
export class SubAgentManager {
  private anthropic: Anthropic
  private configs: SubAgentConfigs
  
  /**
   * Creates a new SubAgentManager instance
   * 
   * @param apiKey - Optional API key override
   * @param configs - Sub-agent configurations
   * 
   * @warning SECURITY ISSUE: This class currently runs Anthropic API calls in the browser
   * with dangerouslyAllowBrowser: true, which exposes the API key to the client.
   * 
   * @warning DEPRECATION: This class is deprecated. Use ProviderAwareSubAgentManager for:
   * - Multi-provider support (Anthropic + Bedrock)
   * - Better error handling and failover
   * - Enhanced monitoring and cost tracking
   * 
   * @todo PRODUCTION FIX: Move API calls to server-side API routes:
   * - Create /api/sub-agents/* endpoints
   * - Move Anthropic SDK calls to server-side
   * - Use fetch() from client to call server endpoints
   * - Remove dangerouslyAllowBrowser and NEXT_PUBLIC_ prefix from API key
   */
  constructor(apiKey?: string, configs?: SubAgentConfigs) {
    const finalApiKey = apiKey || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || ''
    console.log('SubAgentManager API Key check:', {
      hasProvidedKey: !!apiKey,
      hasEnvKey: !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      keyLength: finalApiKey.length,
      keyPrefix: finalApiKey.substring(0, 15) + '...',
    })
    
    if (!finalApiKey) {
      throw new Error('ANTHROPIC_API_KEY is required. Please set NEXT_PUBLIC_ANTHROPIC_API_KEY in your .env.local file')
    }
    
    this.anthropic = new Anthropic({
      apiKey: finalApiKey,
      dangerouslyAllowBrowser: true, // WARNING: This exposes API key in browser - only for development
      defaultHeaders: {
        "anthropic-dangerous-direct-browser-access": "true"
      }
    })
    
    // Default configurations - will be loaded from config.yml in practice
    this.configs = configs || {
      content_analyzer: {
        enabled: true,
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3
      },
      classification_agent: {
        enabled: true,
        model: 'claude-sonnet-4-20250514',
        temperature: 0.2
      },
      correlation_engine: {
        enabled: true,
        model: 'claude-sonnet-4-20250514',
        temperature: 0.4
      },
      report_generator: {
        enabled: true,
        model: 'claude-sonnet-4-20250514',
        temperature: 0.5
      }
    }
  }

  /**
   * Content Analyzer Sub-Agent
   * Specialized in extracting and preprocessing content for moment detection
   */
  async analyzeContent(content: ContentItem[]): Promise<AgentResponse<{
    analyzedContent: Array<{
      contentId: string
      extractedText: string
      keyPhrases: string[]
      sentiment: 'positive' | 'negative' | 'neutral'
      importance: number // 0-100
      sections: Array<{
        title: string
        content: string
        type: 'announcement' | 'analysis' | 'data' | 'quote'
      }>
    }>
  }>> {
    if (!this.configs.content_analyzer.enabled) {
      return { success: false, error: 'Content analyzer is disabled', processingTime: 0 }
    }

    const startTime = Date.now()

    try {
      const prompt = this.buildContentAnalysisPrompt(content)
      
      const response = await this.anthropic.messages.create({
        model: this.configs.content_analyzer.model,
        max_tokens: 4000,
        temperature: this.configs.content_analyzer.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const responseText = response.content[0].type === 'text' 
        ? response.content[0].text 
        : ''

      const analyzedData = this.parseContentAnalysisResponse(responseText, content)
      
      return {
        success: true,
        data: { analyzedContent: analyzedData },
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Content analysis failed',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Classification Agent Sub-Agent
   * Specialized in classifying moments into micro/macro factors
   * Now supports batch processing for improved performance
   */
  async classifyMoments(
    moments: PivotalMoment[], 
    batchSize: number = 10,
    useParallelBatches: boolean = true
  ): Promise<AgentResponse<{
    classifications: Array<{
      momentId: string
      enhancedClassification: {
        microFactors: string[]
        macroFactors: string[]
        confidence: 'low' | 'medium' | 'high'
        reasoning: string
        additionalKeywords: string[]
      }
      riskAssessment: {
        level: 'low' | 'medium' | 'high' | 'critical'
        factors: string[]
      }
    }>
  }>> {
    if (!this.configs.classification_agent.enabled) {
      return { success: false, error: 'Classification agent is disabled', processingTime: 0 }
    }

    const startTime = Date.now()

    try {
      if (useParallelBatches && moments.length > batchSize) {
        // Process large moment sets in parallel batches
        console.log(`[ClassificationAgent] Processing ${moments.length} moments in parallel batches of ${batchSize}`)
        
        const batches: PivotalMoment[][] = []
        for (let i = 0; i < moments.length; i += batchSize) {
          batches.push(moments.slice(i, i + batchSize))
        }
        
        const batchPromises = batches.map(async (batch) => {
          const prompt = this.buildClassificationPrompt(batch)
          
          const response = await this.anthropic.messages.create({
            model: this.configs.classification_agent.model,
            max_tokens: 4000,
            temperature: this.configs.classification_agent.temperature,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })

          const responseText = response.content[0].type === 'text' 
            ? response.content[0].text 
            : ''

          return this.parseClassificationResponse(responseText, batch)
        })
        
        const batchResults = await Promise.all(batchPromises)
        const allClassifications = batchResults.flat()
        
        return {
          success: true,
          data: { classifications: allClassifications },
          processingTime: Date.now() - startTime
        }
        
      } else {
        // Process all moments in a single batch (original behavior)
        const prompt = this.buildClassificationPrompt(moments)
        
        const response = await this.anthropic.messages.create({
          model: this.configs.classification_agent.model,
          max_tokens: 4000,
          temperature: this.configs.classification_agent.temperature,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })

        const responseText = response.content[0].type === 'text' 
          ? response.content[0].text 
          : ''

        const classifications = this.parseClassificationResponse(responseText, moments)
        
        return {
          success: true,
          data: { classifications },
          processingTime: Date.now() - startTime
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Classification failed',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Correlation Engine Sub-Agent
   * Specialized in finding relationships between moments
   * Now supports batch processing for large moment sets
   */
  async findCorrelations(
    moments: PivotalMoment[], 
    batchSize: number = 15,
    useParallelBatches: boolean = true
  ): Promise<AgentResponse<{
    correlations: MomentCorrelation[]
    insights: Array<{
      type: 'trend' | 'pattern' | 'anomaly' | 'cluster'
      description: string
      momentIds: string[]
      confidence: number
    }>
  }>> {
    if (!this.configs.correlation_engine.enabled) {
      return { success: false, error: 'Correlation engine is disabled', processingTime: 0 }
    }

    const startTime = Date.now()

    try {
      if (useParallelBatches && moments.length > batchSize) {
        // Process large moment sets in parallel batches
        console.log(`[CorrelationEngine] Processing ${moments.length} moments in parallel batches of ${batchSize}`)
        
        const batches: PivotalMoment[][] = []
        for (let i = 0; i < moments.length; i += batchSize) {
          batches.push(moments.slice(i, i + batchSize))
        }
        
        const batchPromises = batches.map(async (batch) => {
          const prompt = this.buildCorrelationPrompt(batch)
          
          const response = await this.anthropic.messages.create({
            model: this.configs.correlation_engine.model,
            max_tokens: 4000,
            temperature: this.configs.correlation_engine.temperature,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })

          const responseText = response.content[0].type === 'text' 
            ? response.content[0].text 
            : ''

          return this.parseCorrelationResponse(responseText, batch)
        })
        
        const batchResults = await Promise.all(batchPromises)
        
        // Combine results from all batches
        const allCorrelations: MomentCorrelation[] = []
        const allInsights: Array<{type: 'trend' | 'pattern' | 'anomaly' | 'cluster', description: string, momentIds: string[], confidence: number}> = []
        
        for (const result of batchResults) {
          allCorrelations.push(...(result.correlations || []))
          allInsights.push(...(result.insights || []))
        }
        
        return {
          success: true,
          data: {
            correlations: allCorrelations,
            insights: allInsights
          },
          processingTime: Date.now() - startTime
        }
        
      } else {
        // Process all moments in a single batch (original behavior)
        const prompt = this.buildCorrelationPrompt(moments)
        
        const response = await this.anthropic.messages.create({
          model: this.configs.correlation_engine.model,
          max_tokens: 4000,
          temperature: this.configs.correlation_engine.temperature,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })

        const responseText = response.content[0].type === 'text' 
          ? response.content[0].text 
          : ''

        const correlationData = this.parseCorrelationResponse(responseText, moments)
        
        return {
          success: true,
          data: correlationData,
          processingTime: Date.now() - startTime
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Correlation analysis failed',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Report Generator Sub-Agent
   * Specialized in creating business intelligence reports
   */
  async generateReport(
    moments: PivotalMoment[], 
    correlations: MomentCorrelation[],
    options: {
      type: 'executive_summary' | 'detailed_analysis' | 'trend_report' | 'risk_assessment'
      timeframe?: string
      focusAreas?: string[]
    }
  ): Promise<AgentResponse<{
    report: {
      title: string
      summary: string
      sections: Array<{
        title: string
        content: string
        data?: any
      }>
      recommendations: string[]
      riskFactors: string[]
      opportunities: string[]
    }
  }>> {
    if (!this.configs.report_generator.enabled) {
      return { success: false, error: 'Report generator is disabled', processingTime: 0 }
    }

    const startTime = Date.now()

    try {
      const prompt = this.buildReportPrompt(moments, correlations, options)
      
      const response = await this.anthropic.messages.create({
        model: this.configs.report_generator.model,
        max_tokens: 4000,
        temperature: this.configs.report_generator.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const responseText = response.content[0].type === 'text' 
        ? response.content[0].text 
        : ''

      const report = this.parseReportResponse(responseText)
      
      return {
        success: true,
        data: { report },
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed',
        processingTime: Date.now() - startTime
      }
    }
  }

  // Private methods for building prompts

  private buildContentAnalysisPrompt(content: ContentItem[]): string {
    return `You are a specialized content analysis agent. Your role is to preprocess and structure content for AI business intelligence analysis.

**Content to Analyze:**
${content.map(item => `
File: ${item.name}
Type: ${item.type}
Content: ${item.content?.substring(0, 2000) || 'No content'}
---`).join('\n')}

**Your Task:**
For each content item, analyze and extract:
1. Key phrases and entities relevant to AI business intelligence
2. Sentiment (positive/negative/neutral) regarding business developments
3. Importance score (0-100) based on potential business impact
4. Content sections by type (announcement, analysis, data, quote)

**Response Format:**
Return JSON array with analysis for each content item:
[{
  "contentId": "content_id",
  "extractedText": "clean, structured text",
  "keyPhrases": ["phrase1", "phrase2"],
  "sentiment": "positive|negative|neutral",
  "importance": 85,
  "sections": [
    {
      "title": "section title",
      "content": "section content",
      "type": "announcement|analysis|data|quote"
    }
  ]
}]`
  }

  private buildClassificationPrompt(moments: PivotalMoment[]): string {
    return `You are a specialized moment classification agent. Your role is to enhance and validate moment classifications for AI business intelligence.

**Moments to Classify:**
${moments.map(moment => `
ID: ${moment.id}
Title: ${moment.title}
Description: ${moment.description}
Content: ${moment.content.substring(0, 1000)}
Current Classification: ${JSON.stringify(moment.classification)}
---`).join('\n')}

**Classification Framework:**
Micro Factors: company, competition, partners, customers
Macro Factors: economic, geo_political, regulation, technology, environment, supply_chain

**Your Task:**
For each moment, provide enhanced classification and risk assessment.

**Response Format:**
Return JSON array:
[{
  "momentId": "moment_id",
  "enhancedClassification": {
    "microFactors": ["factor1", "factor2"],
    "macroFactors": ["factor1"],
    "confidence": "low|medium|high",
    "reasoning": "detailed reasoning",
    "additionalKeywords": ["keyword1", "keyword2"]
  },
  "riskAssessment": {
    "level": "low|medium|high|critical",
    "factors": ["risk factor descriptions"]
  }
}]`
  }

  private buildCorrelationPrompt(moments: PivotalMoment[]): string {
    return `You are a specialized correlation analysis agent. Your role is to identify relationships and patterns between pivotal moments.

**Moments to Correlate:**
${moments.map(moment => `
ID: ${moment.id}
Title: ${moment.title}
Factors: Micro[${moment.classification.microFactors.join(',')}] Macro[${moment.classification.macroFactors.join(',')}]
Timeline: ${moment.timeline.timeframe || moment.timeline.estimatedDate?.toISOString() || 'Unknown'}
Impact: ${moment.impact.score}
---`).join('\n')}

**Your Task:**
1. Identify correlations between moments (causal, temporal, thematic, competitive)
2. Discover patterns, trends, anomalies, and clusters

**Response Format:**
Return JSON object:
{
  "correlations": [
    {
      "moment1Id": "id1",
      "moment2Id": "id2",
      "correlationType": "causal|temporal|thematic|competitive",
      "strength": 0.85,
      "description": "description of relationship",
      "commonFactors": ["shared factors"]
    }
  ],
  "insights": [
    {
      "type": "trend|pattern|anomaly|cluster",
      "description": "insight description",
      "momentIds": ["id1", "id2"],
      "confidence": 0.8
    }
  ]
}`
  }

  private buildReportPrompt(
    moments: PivotalMoment[], 
    correlations: MomentCorrelation[],
    options: any
  ): string {
    return `You are a specialized business intelligence report generator. Create a comprehensive ${options.type} report.

**Data Summary:**
- Total Moments: ${moments.length}
- Total Correlations: ${correlations.length}
- Report Type: ${options.type}
- Timeframe: ${options.timeframe || 'All available data'}
- Focus Areas: ${options.focusAreas?.join(', ') || 'All factors'}

**Key Moments:**
${moments.slice(0, 10).map(m => `- ${m.title} (Impact: ${m.impact.score})`).join('\n')}

**Key Correlations:**
${correlations.slice(0, 5).map(c => `- ${c.correlationType}: ${c.description} (Strength: ${c.strength})`).join('\n')}

**Your Task:**
Generate a professional business intelligence report with executive insights, strategic recommendations, and risk analysis.

**Response Format:**
Return JSON object:
{
  "report": {
    "title": "report title",
    "summary": "executive summary",
    "sections": [
      {
        "title": "section title",
        "content": "section content",
        "data": {} // optional structured data
      }
    ],
    "recommendations": ["recommendation1", "recommendation2"],
    "riskFactors": ["risk1", "risk2"],
    "opportunities": ["opportunity1", "opportunity2"]
  }
}`
  }

  // Private methods for parsing responses

  private parseContentAnalysisResponse(responseText: string, originalContent: ContentItem[]): any[] {
    try {
      const jsonText = this.extractJSON(responseText)
      const parsed = JSON.parse(jsonText)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Error parsing content analysis response:', error)
      return []
    }
  }

  private parseClassificationResponse(responseText: string, originalMoments: PivotalMoment[]): any[] {
    try {
      const jsonText = this.extractJSON(responseText)
      const parsed = JSON.parse(jsonText)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Error parsing classification response:', error)
      return []
    }
  }

  private parseCorrelationResponse(responseText: string, originalMoments: PivotalMoment[]): any {
    try {
      const jsonText = this.extractJSON(responseText)
      const parsed = JSON.parse(jsonText)
      return {
        correlations: parsed.correlations || [],
        insights: parsed.insights || []
      }
    } catch (error) {
      console.error('Error parsing correlation response:', error)
      return { correlations: [], insights: [] }
    }
  }

  private parseReportResponse(responseText: string): any {
    try {
      const jsonText = this.extractJSON(responseText)
      const parsed = JSON.parse(jsonText)
      return parsed.report || {
        title: 'Analysis Report',
        summary: 'Report generation encountered an error',
        sections: [],
        recommendations: [],
        riskFactors: [],
        opportunities: []
      }
    } catch (error) {
      console.error('Error parsing report response:', error)
      return {
        title: 'Analysis Report',
        summary: 'Report generation encountered an error',
        sections: [],
        recommendations: [],
        riskFactors: [],
        opportunities: []
      }
    }
  }

  private extractJSON(text: string): string {
    // Remove markdown code blocks
    let jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    // Find JSON object or array
    const jsonStart = Math.max(jsonText.indexOf('['), jsonText.indexOf('{'))
    const jsonEnd = Math.max(jsonText.lastIndexOf(']'), jsonText.lastIndexOf('}')) + 1
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON found in response')
    }
    
    return jsonText.slice(jsonStart, jsonEnd)
  }

  /**
   * Update agent configurations
   */
  updateConfigs(newConfigs: Partial<SubAgentConfigs>): void {
    this.configs = { ...this.configs, ...newConfigs }
  }

  /**
   * Get current agent configurations
   */
  getConfigs(): SubAgentConfigs {
    return { ...this.configs }
  }
}

// Factory function (Legacy)
/**
 * @deprecated Use createProviderAwareSubAgentManager() instead for multi-provider support
 * 
 * Creates a legacy SubAgentManager instance
 * This function is maintained for backward compatibility only.
 * 
 * @param apiKey - Optional API key override
 * @param configs - Sub-agent configurations
 * @returns SubAgentManager instance
 * 
 * @example
 * // Recommended approach:
 * const manager = await createProviderAwareSubAgentManager()
 * 
 * // Legacy approach (still supported):
 * const legacyManager = createSubAgentManager()
 */
export function createSubAgentManager(apiKey?: string, configs?: SubAgentConfigs): SubAgentManager {
  console.warn('createSubAgentManager() is deprecated. Consider using createProviderAwareSubAgentManager() for multi-provider support.')
  return new SubAgentManager(apiKey, configs)
}

// Re-export new provider-aware functions for easy migration
export { 
  ProviderAwareSubAgentManager,
  createProviderAwareSubAgentManager,
  createSubAgentManagerWithProvider
} from './sub-agents-provider-aware'