import Anthropic from '@anthropic-ai/sdk'
import { 
  PivotalMoment, 
  ClassificationRequest, 
  ClassificationResponse, 
  MomentAnalysisResult,
  MicroFactor,
  MacroFactor,
  ConfidenceLevel
} from '@/types/moments'
import { ContentItem, Company, Technology } from '@/types/catalog'

interface ExtractorConfig {
  apiKey?: string
  model?: string
  temperature?: number
}

export class MomentExtractor {
  private anthropic: Anthropic
  private config: ExtractorConfig

  constructor(config: ExtractorConfig = {}) {
    this.config = {
      model: 'claude-3-sonnet-20240229',
      temperature: 0.3,
      ...config
    }
    
    this.anthropic = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || '',
    })
  }

  async analyzeContent(
    content: ContentItem[],
    sourceType: 'company' | 'technology',
    sourceName: string
  ): Promise<MomentAnalysisResult> {
    const startTime = Date.now()
    const moments: PivotalMoment[] = []
    const errors: string[] = []

    for (const item of content) {
      if (item.type === 'markdown' && item.content) {
        try {
          const extractedMoments = await this.extractMomentsFromText(
            item.content,
            {
              sourceType,
              sourceName,
              contentId: item.id,
              filePath: item.path,
              contentName: item.name
            }
          )
          moments.push(...extractedMoments)
        } catch (error) {
          const errorMessage = `Failed to analyze ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMessage)
          console.error(errorMessage, error)
        }
      }
    }

    const processingTime = Date.now() - startTime

    return {
      moments,
      totalProcessed: content.length,
      processingTime,
      errors
    }
  }

  private async extractMomentsFromText(
    text: string,
    context: {
      sourceType: 'company' | 'technology'
      sourceName: string
      contentId: string
      filePath: string
      contentName: string
    }
  ): Promise<PivotalMoment[]> {
    const prompt = this.buildExtractionPrompt(text, context)
    
    try {
      const response = await this.anthropic.messages.create({
        model: this.config.model!,
        max_tokens: 4000,
        temperature: this.config.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const responseText = response.content[0].type === 'text' 
        ? response.content[0].text 
        : ''

      return this.parseMomentsResponse(responseText, context)
    } catch (error) {
      console.error('Error calling Anthropic API:', error)
      throw new Error(`Failed to extract moments: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildExtractionPrompt(
    text: string,
    context: { sourceType: 'company' | 'technology', sourceName: string }
  ): string {
    return `You are an AI business intelligence analyst specializing in identifying pivotal moments in the AI industry.

Your task is to analyze the following content and identify pivotal moments that could significantly impact AI startups or enterprises.

**Source Context:**
- Type: ${context.sourceType}
- Name: ${context.sourceName}

**Content to Analyze:**
${text}

**Moment Classification Framework:**

**Micro Factors:**
- company: Leadership changes, key hires, product launches, AI model releases, tech stack changes, IP filings, M&A activity, strategic pivots, funding rounds, geographic expansion
- competition: Competitor breakthroughs, competitive hires
- partners: Partnerships, partner attrition  
- customers: Major customer wins, customer losses, customer advocacy, customer disputes

**Macro Factors:**
- economic: Interest rates, inflation, funding climate
- geo_political: Trade policy, sanctions
- regulation: AI laws, privacy laws, sector rules
- technology: Breakthroughs, open source, compute, quantum
- environment: Climate impacts, carbon regulations
- supply_chain: Chips, logistics

**Instructions:**
1. Identify significant events, announcements, or developments that could be classified as pivotal moments
2. For each moment, classify it using the framework above
3. Assess the potential impact on AI industry dynamics
4. Extract relevant entities (companies, technologies, people, locations)
5. Estimate timeline information if available

**Response Format:**
Return your analysis as a JSON array of moments. Each moment should have:
{
  "title": "Brief descriptive title",
  "description": "1-2 sentence summary",
  "content": "Extracted relevant text snippet",
  "microFactors": ["array", "of", "applicable", "micro", "factors"],
  "macroFactors": ["array", "of", "applicable", "macro", "factors"],
  "confidence": "low|medium|high",
  "reasoning": "Why this is a pivotal moment and classification rationale",
  "keywords": ["key", "terms", "extracted"],
  "impactScore": 75, // 0-100 scale
  "impactReasoning": "Why this impact score",
  "entities": {
    "companies": ["company", "names"],
    "technologies": ["tech", "names"], 
    "people": ["person", "names"],
    "locations": ["location", "names"]
  },
  "timeline": {
    "estimatedDate": "2024-01-15T00:00:00.000Z", // if determinable
    "timeframe": "Q1 2024", // if date not specific
    "isHistorical": true
  }
}

Return only the JSON array, no other text. If no pivotal moments are found, return an empty array []`
  }

  private parseMomentsResponse(
    responseText: string,
    context: {
      sourceType: 'company' | 'technology'
      sourceName: string
      contentId: string
      filePath: string
      contentName: string
    }
  ): PivotalMoment[] {
    try {
      // Clean the response text to extract JSON
      let jsonText = responseText.trim()
      
      // Remove any markdown code blocks
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      
      // Find the JSON array
      const jsonStart = jsonText.indexOf('[')
      const jsonEnd = jsonText.lastIndexOf(']') + 1
      
      if (jsonStart === -1 || jsonEnd === 0) {
        console.warn('No JSON array found in response')
        return []
      }
      
      jsonText = jsonText.slice(jsonStart, jsonEnd)
      
      const parsedMoments = JSON.parse(jsonText)
      
      if (!Array.isArray(parsedMoments)) {
        console.warn('Response is not an array')
        return []
      }

      return parsedMoments.map((moment, index) => ({
        id: `${context.contentId}-moment-${index + 1}`,
        title: moment.title || 'Untitled Moment',
        description: moment.description || '',
        content: moment.content || '',
        source: {
          type: context.sourceType,
          id: context.contentId,
          name: context.sourceName,
          contentId: context.contentId,
          filePath: context.filePath
        },
        classification: {
          microFactors: (moment.microFactors || []).filter((f: string) => 
            ['company', 'competition', 'partners', 'customers'].includes(f)
          ) as MicroFactor[],
          macroFactors: (moment.macroFactors || []).filter((f: string) =>
            ['economic', 'geo_political', 'regulation', 'technology', 'environment', 'supply_chain'].includes(f)
          ) as MacroFactor[],
          confidence: (['low', 'medium', 'high'].includes(moment.confidence) 
            ? moment.confidence 
            : 'medium') as ConfidenceLevel,
          reasoning: moment.reasoning || '',
          keywords: Array.isArray(moment.keywords) ? moment.keywords : []
        },
        extractedAt: new Date(),
        impact: {
          score: typeof moment.impactScore === 'number' && moment.impactScore >= 0 && moment.impactScore <= 100 
            ? moment.impactScore 
            : 50,
          reasoning: moment.impactReasoning || ''
        },
        entities: {
          companies: Array.isArray(moment.entities?.companies) ? moment.entities.companies : [],
          technologies: Array.isArray(moment.entities?.technologies) ? moment.entities.technologies : [],
          people: Array.isArray(moment.entities?.people) ? moment.entities.people : [],
          locations: Array.isArray(moment.entities?.locations) ? moment.entities.locations : []
        },
        timeline: {
          estimatedDate: moment.timeline?.estimatedDate ? new Date(moment.timeline.estimatedDate) : undefined,
          timeframe: moment.timeline?.timeframe || undefined,
          isHistorical: Boolean(moment.timeline?.isHistorical)
        }
      })) as PivotalMoment[]
      
    } catch (error) {
      console.error('Error parsing moments response:', error)
      console.log('Raw response:', responseText)
      return []
    }
  }

  async analyzeCompanies(companies: Company[]): Promise<MomentAnalysisResult> {
    const allMoments: PivotalMoment[] = []
    const allErrors: string[] = []
    let totalProcessed = 0
    const startTime = Date.now()

    for (const company of companies) {
      try {
        const result = await this.analyzeContent(
          company.content,
          'company',
          company.name
        )
        allMoments.push(...result.moments)
        allErrors.push(...result.errors)
        totalProcessed += result.totalProcessed
      } catch (error) {
        const errorMessage = `Failed to analyze company ${company.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        allErrors.push(errorMessage)
      }
    }

    return {
      moments: allMoments,
      totalProcessed,
      processingTime: Date.now() - startTime,
      errors: allErrors
    }
  }

  async analyzeTechnologies(technologies: Technology[]): Promise<MomentAnalysisResult> {
    const allMoments: PivotalMoment[] = []
    const allErrors: string[] = []
    let totalProcessed = 0
    const startTime = Date.now()

    for (const technology of technologies) {
      try {
        const result = await this.analyzeContent(
          technology.content,
          'technology',
          technology.name
        )
        allMoments.push(...result.moments)
        allErrors.push(...result.errors)
        totalProcessed += result.totalProcessed
      } catch (error) {
        const errorMessage = `Failed to analyze technology ${technology.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        allErrors.push(errorMessage)
      }
    }

    return {
      moments: allMoments,
      totalProcessed,
      processingTime: Date.now() - startTime,
      errors: allErrors
    }
  }
}

// Factory function to create configured extractor
export function createMomentExtractor(config?: ExtractorConfig): MomentExtractor {
  return new MomentExtractor(config)
}