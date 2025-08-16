/**
 * Provider-Aware Sub-Agent Manager
 * Enhanced SubAgentManager that uses the model provider abstraction layer
 * instead of direct Anthropic SDK calls, enabling support for multiple providers
 */

import { AgentConfig, SubAgentConfigs } from '@/types/moments'
import { PivotalMoment, MomentCorrelation } from '@/types/moments'
import { ContentItem } from '@/types/catalog'
import { Config, ModelProviderConfig } from './config-types'
import { ModelProviderFactory, ProviderFactoryConfig } from './model-providers/provider-factory'
import { ModelProvider, ModelRequest, ModelResponse } from './model-providers/provider-interface'
import { loadConfigClient } from './config-loader.client'

interface AgentResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  processingTime: number
  provider?: string
  model?: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens?: number
  }
}

interface ProviderHealthStatus {
  primary: {
    isHealthy: boolean
    provider: string
    latency?: number
    error?: string
  }
  fallback?: {
    isHealthy: boolean
    provider: string
    latency?: number
    error?: string
  }
  lastChecked: Date
}

export class ProviderAwareSubAgentManager {
  private provider!: ModelProvider
  private fallbackProvider?: ModelProvider
  private configs!: SubAgentConfigs
  private modelProviderConfig?: ModelProviderConfig
  private healthStatus?: ProviderHealthStatus
  private autoFallback: boolean = false
  
  /**
   * Creates a new ProviderAwareSubAgentManager instance
   * 
   * @param configs - Sub-agent configurations (optional, will load from config.yml if not provided)
   * @param modelProviderConfig - Model provider configuration (optional, will load from config.yml if not provided)
   * @param autoFallback - Enable automatic fallback between providers
   * 
   * @description This enhanced SubAgentManager uses the provider abstraction layer
   * to support both Anthropic and Amazon Bedrock providers seamlessly. The provider
   * is selected based on configuration and can automatically fallback if the primary
   * provider fails.
   */
  constructor(
    configs?: SubAgentConfigs,
    modelProviderConfig?: ModelProviderConfig,
    autoFallback: boolean = true
  ) {
    this.autoFallback = autoFallback
    this.initializeAsync(configs, modelProviderConfig)
  }

  /**
   * Async initialization to load configuration and set up providers
   */
  private async initializeAsync(
    configs?: SubAgentConfigs,
    modelProviderConfig?: ModelProviderConfig
  ): Promise<void> {
    try {
      // Load configuration if not provided
      if (!configs || !modelProviderConfig) {
        const fullConfig = await loadConfigClient()
        this.configs = configs || fullConfig.agents
        this.modelProviderConfig = modelProviderConfig || fullConfig.model_provider
      } else {
        this.configs = configs
        this.modelProviderConfig = modelProviderConfig
      }

      // Initialize provider factory
      if (this.modelProviderConfig) {
        const factoryConfig: ProviderFactoryConfig = {
          type: this.modelProviderConfig.type,
          autoFallback: this.autoFallback,
          modelMapping: this.modelProviderConfig.model_mapping,
          anthropic: {
            apiKeyEnv: this.modelProviderConfig.anthropic.api_key_env,
            baseUrl: this.modelProviderConfig.anthropic.base_url
          },
          bedrock: {
            region: this.modelProviderConfig.bedrock.aws_region,
            profile: this.modelProviderConfig.bedrock.aws_profile,
            useBedrockApiKey: this.modelProviderConfig.bedrock.use_bedrock_api_key,
            inferenceProfile: this.modelProviderConfig.bedrock.inference_profile || undefined
          }
        }

        // Set up fallback provider (opposite of primary)
        if (this.autoFallback) {
          factoryConfig.fallbackProvider = this.modelProviderConfig.type === 'anthropic' ? 'bedrock' : 'anthropic'
        }

        ModelProviderFactory.initialize(factoryConfig)
        this.provider = ModelProviderFactory.getPrimaryProvider()
        this.fallbackProvider = ModelProviderFactory.getFallbackProvider() || undefined
      } else {
        // Fallback to environment-based provider detection
        console.warn('No model provider configuration found, using environment detection')
        this.provider = ModelProviderFactory.createFromEnvironment()
      }

      console.log('ProviderAwareSubAgentManager initialized:', {
        primaryProvider: this.provider.getType(),
        hasFallback: !!this.fallbackProvider,
        autoFallback: this.autoFallback,
        modelMapping: this.modelProviderConfig?.model_mapping
      })

      // Initial health check
      await this.checkProviderHealth()

    } catch (error) {
      console.error('Failed to initialize ProviderAwareSubAgentManager:', error)
      // Fallback to basic Anthropic provider
      this.provider = ModelProviderFactory.createProvider('anthropic')
      this.configs = this.getDefaultConfigs()
    }
  }

  /**
   * Static factory method for easier initialization
   */
  static async create(
    configs?: SubAgentConfigs,
    modelProviderConfig?: ModelProviderConfig,
    autoFallback: boolean = true
  ): Promise<ProviderAwareSubAgentManager> {
    const manager = new ProviderAwareSubAgentManager(configs, modelProviderConfig, autoFallback)
    // Wait for async initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    return manager
  }

  /**
   * Check health of providers and update status
   */
  async checkProviderHealth(): Promise<ProviderHealthStatus> {
    const startTime = Date.now()
    
    try {
      const primaryHealth = await this.provider.healthCheck()
      
      const status: ProviderHealthStatus = {
        primary: {
          isHealthy: primaryHealth.isHealthy,
          provider: primaryHealth.provider,
          latency: primaryHealth.latency,
          error: primaryHealth.error
        },
        lastChecked: new Date()
      }

      if (this.fallbackProvider) {
        try {
          const fallbackHealth = await this.fallbackProvider.healthCheck()
          status.fallback = {
            isHealthy: fallbackHealth.isHealthy,
            provider: fallbackHealth.provider,
            latency: fallbackHealth.latency,
            error: fallbackHealth.error
          }
        } catch (error) {
          status.fallback = {
            isHealthy: false,
            provider: this.fallbackProvider.getType(),
            error: error instanceof Error ? error.message : 'Health check failed'
          }
        }
      }

      this.healthStatus = status
      return status
    } catch (error) {
      const status: ProviderHealthStatus = {
        primary: {
          isHealthy: false,
          provider: this.provider.getType(),
          error: error instanceof Error ? error.message : 'Health check failed'
        },
        lastChecked: new Date()
      }
      this.healthStatus = status
      return status
    }
  }

  /**
   * Get current provider with automatic fallback if enabled
   */
  private async getActiveProvider(): Promise<ModelProvider> {
    if (!this.autoFallback || !this.fallbackProvider) {
      return this.provider
    }

    // Check if we need to update health status
    if (!this.healthStatus || 
        (Date.now() - this.healthStatus.lastChecked.getTime()) > 300000) { // 5 minutes
      await this.checkProviderHealth()
    }

    // Use fallback if primary is unhealthy
    if (!this.healthStatus?.primary.isHealthy && 
        this.fallbackProvider && 
        this.healthStatus?.fallback?.isHealthy) {
      console.info('Using fallback provider due to primary provider health issues')
      return this.fallbackProvider
    }

    return this.provider
  }

  /**
   * Send request to active provider with error handling and retries
   */
  private async sendProviderRequest(
    messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>,
    agentConfig: AgentConfig,
    retryCount: number = 0
  ): Promise<ModelResponse> {
    const maxRetries = 2
    
    try {
      const activeProvider = await this.getActiveProvider()
      
      const request: ModelRequest = {
        messages,
        model: agentConfig.model,
        maxTokens: 4000,
        temperature: agentConfig.temperature
      }

      const response = await activeProvider.sendRequest(request)
      return response
    } catch (error) {
      console.error(`Provider request failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error)
      
      // Try fallback provider if available and not already using it
      if (retryCount === 0 && this.fallbackProvider && this.autoFallback) {
        console.info('Retrying with fallback provider')
        const fallbackRequest: ModelRequest = {
          messages,
          model: agentConfig.model,
          maxTokens: 4000,
          temperature: agentConfig.temperature
        }
        
        try {
          const response = await this.fallbackProvider.sendRequest(fallbackRequest)
          return response
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError)
        }
      }
      
      // Standard retry logic
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.sendProviderRequest(messages, agentConfig, retryCount + 1)
      }
      
      throw error
    }
  }

  /**
   * Content Analyzer Sub-Agent with Provider Abstraction
   */
  async analyzeContent(content: ContentItem[]): Promise<AgentResponse<{
    analyzedContent: Array<{
      contentId: string
      extractedText: string
      keyPhrases: string[]
      sentiment: 'positive' | 'negative' | 'neutral'
      importance: number
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
      const messages = [{ role: 'user' as const, content: prompt }]
      
      const response = await this.sendProviderRequest(messages, this.configs.content_analyzer)
      const analyzedData = this.parseContentAnalysisResponse(response.content, content)
      
      return {
        success: true,
        data: { analyzedContent: analyzedData },
        processingTime: Date.now() - startTime,
        provider: this.provider.getType(),
        model: response.model,
        usage: response.usage
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Content analysis failed',
        processingTime: Date.now() - startTime,
        provider: this.provider.getType()
      }
    }
  }

  /**
   * Classification Agent with Provider Abstraction and Parallel Processing
   */
  async classifyMoments(
    moments: PivotalMoment[], 
    batchSize?: number,
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
    const finalBatchSize = batchSize || this.configs.classification_agent.parallel_batch_size || 10

    try {
      let totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 }

      if (useParallelBatches && moments.length > finalBatchSize) {
        console.log(`[ClassificationAgent] Processing ${moments.length} moments in parallel batches of ${finalBatchSize}`)
        
        const batches: PivotalMoment[][] = []
        for (let i = 0; i < moments.length; i += finalBatchSize) {
          batches.push(moments.slice(i, i + finalBatchSize))
        }
        
        const batchPromises = batches.map(async (batch) => {
          const prompt = this.buildClassificationPrompt(batch)
          const messages = [{ role: 'user' as const, content: prompt }]
          
          const response = await this.sendProviderRequest(messages, this.configs.classification_agent)
          
          // Accumulate usage statistics
          if (response.usage) {
            totalUsage.inputTokens += response.usage.inputTokens
            totalUsage.outputTokens += response.usage.outputTokens
            totalUsage.totalTokens += response.usage.totalTokens || 0
          }

          return this.parseClassificationResponse(response.content, batch)
        })
        
        const batchResults = await Promise.all(batchPromises)
        const allClassifications = batchResults.flat()
        
        return {
          success: true,
          data: { classifications: allClassifications },
          processingTime: Date.now() - startTime,
          provider: this.provider.getType(),
          usage: totalUsage
        }
        
      } else {
        const prompt = this.buildClassificationPrompt(moments)
        const messages = [{ role: 'user' as const, content: prompt }]
        
        const response = await this.sendProviderRequest(messages, this.configs.classification_agent)
        const classifications = this.parseClassificationResponse(response.content, moments)
        
        return {
          success: true,
          data: { classifications },
          processingTime: Date.now() - startTime,
          provider: this.provider.getType(),
          model: response.model,
          usage: response.usage
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Classification failed',
        processingTime: Date.now() - startTime,
        provider: this.provider.getType()
      }
    }
  }

  /**
   * Correlation Engine with Provider Abstraction and Parallel Processing
   */
  async findCorrelations(
    moments: PivotalMoment[], 
    batchSize?: number,
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
    const finalBatchSize = batchSize || this.configs.correlation_engine.parallel_batch_size || 15

    try {
      let totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 }

      if (useParallelBatches && moments.length > finalBatchSize) {
        console.log(`[CorrelationEngine] Processing ${moments.length} moments in parallel batches of ${finalBatchSize}`)
        
        const batches: PivotalMoment[][] = []
        for (let i = 0; i < moments.length; i += finalBatchSize) {
          batches.push(moments.slice(i, i + finalBatchSize))
        }
        
        const batchPromises = batches.map(async (batch) => {
          const prompt = this.buildCorrelationPrompt(batch)
          const messages = [{ role: 'user' as const, content: prompt }]
          
          const response = await this.sendProviderRequest(messages, this.configs.correlation_engine)
          
          // Accumulate usage statistics
          if (response.usage) {
            totalUsage.inputTokens += response.usage.inputTokens
            totalUsage.outputTokens += response.usage.outputTokens
            totalUsage.totalTokens += response.usage.totalTokens || 0
          }

          return this.parseCorrelationResponse(response.content, batch)
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
          processingTime: Date.now() - startTime,
          provider: this.provider.getType(),
          usage: totalUsage
        }
        
      } else {
        const prompt = this.buildCorrelationPrompt(moments)
        const messages = [{ role: 'user' as const, content: prompt }]
        
        const response = await this.sendProviderRequest(messages, this.configs.correlation_engine)
        const correlationData = this.parseCorrelationResponse(response.content, moments)
        
        return {
          success: true,
          data: correlationData,
          processingTime: Date.now() - startTime,
          provider: this.provider.getType(),
          model: response.model,
          usage: response.usage
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Correlation analysis failed',
        processingTime: Date.now() - startTime,
        provider: this.provider.getType()
      }
    }
  }

  /**
   * Report Generator with Provider Abstraction
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
      const messages = [{ role: 'user' as const, content: prompt }]
      
      const response = await this.sendProviderRequest(messages, this.configs.report_generator)
      const report = this.parseReportResponse(response.content)
      
      return {
        success: true,
        data: { report },
        processingTime: Date.now() - startTime,
        provider: this.provider.getType(),
        model: response.model,
        usage: response.usage
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed',
        processingTime: Date.now() - startTime,
        provider: this.provider.getType()
      }
    }
  }

  // Provider management methods

  /**
   * Switch to a different provider
   */
  async switchProvider(providerType: 'anthropic' | 'bedrock'): Promise<boolean> {
    try {
      const newProvider = ModelProviderFactory.getProvider(providerType)
      const health = await newProvider.healthCheck()
      
      if (health.isHealthy) {
        this.provider = newProvider
        console.info(`Switched to ${providerType} provider`)
        return true
      } else {
        console.warn(`Cannot switch to ${providerType} provider: health check failed`)
        return false
      }
    } catch (error) {
      console.error(`Failed to switch to ${providerType} provider:`, error)
      return false
    }
  }

  /**
   * Get provider status information
   */
  getProviderStatus(): {
    primary: { type: string, isHealthy?: boolean }
    fallback?: { type: string, isHealthy?: boolean }
    autoFallback: boolean
    lastHealthCheck?: Date
  } {
    return {
      primary: { 
        type: this.provider.getType(),
        isHealthy: this.healthStatus?.primary.isHealthy
      },
      fallback: this.fallbackProvider ? {
        type: this.fallbackProvider.getType(),
        isHealthy: this.healthStatus?.fallback?.isHealthy
      } : undefined,
      autoFallback: this.autoFallback,
      lastHealthCheck: this.healthStatus?.lastChecked
    }
  }

  /**
   * Update configurations
   */
  updateConfigs(newConfigs: Partial<SubAgentConfigs>): void {
    this.configs = { ...this.configs, ...newConfigs }
  }

  /**
   * Get current configurations
   */
  getConfigs(): SubAgentConfigs {
    return { ...this.configs }
  }

  /**
   * Get default configurations
   */
  private getDefaultConfigs(): SubAgentConfigs {
    return {
      content_analyzer: {
        enabled: true,
        model: 'sonnet',
        temperature: 0.3,
        parallel_batch_size: 10,
        enable_parallel_batches: true
      },
      classification_agent: {
        enabled: true,
        model: 'sonnet',
        temperature: 0.2,
        parallel_batch_size: 10,
        enable_parallel_batches: true
      },
      correlation_engine: {
        enabled: true,
        model: 'sonnet',
        temperature: 0.4,
        parallel_batch_size: 15,
        enable_parallel_batches: true
      },
      report_generator: {
        enabled: true,
        model: 'sonnet',
        temperature: 0.5,
        parallel_batch_size: 5,
        enable_parallel_batches: false
      }
    }
  }

  // Private methods for building prompts (reused from original implementation)

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

  // Private methods for parsing responses (reused from original implementation)

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
}

// Factory function for backward compatibility
export function createProviderAwareSubAgentManager(
  configs?: SubAgentConfigs,
  modelProviderConfig?: ModelProviderConfig,
  autoFallback: boolean = true
): Promise<ProviderAwareSubAgentManager> {
  return ProviderAwareSubAgentManager.create(configs, modelProviderConfig, autoFallback)
}

// Enhanced factory function with explicit provider selection
export async function createSubAgentManagerWithProvider(
  providerType: 'anthropic' | 'bedrock',
  configs?: SubAgentConfigs,
  autoFallback: boolean = true
): Promise<ProviderAwareSubAgentManager> {
  const manager = await ProviderAwareSubAgentManager.create(configs, undefined, autoFallback)
  
  if (manager.getProviderStatus().primary.type !== providerType) {
    const switched = await manager.switchProvider(providerType)
    if (!switched) {
      console.warn(`Could not switch to ${providerType} provider, using default`)
    }
  }
  
  return manager
}