# Building Production AI Apps with Claude Code SDK: The Moments Architecture

*A deep dive into creating AI-powered business intelligence applications using Claude Code SDK, TypeScript, and modern agent orchestration patterns*

![Companies Catalog View](images/companies.png)

## The New Stack for AI-First Applications

The AI development landscape has evolved beyond simple API integrations. Today's production AI applications require sophisticated **agent orchestration**, **local-first architectures**, and **verifiable AI workflows**. 

**Moments** showcases this evolution—a TypeScript application built entirely on the Claude Code SDK that transforms raw business content into classified intelligence through multi-agent processing pipelines.

## Architecture Deep Dive

### Claude Code SDK as Application Foundation

Traditional AI integrations rely on stateless API calls. Claude Code SDK enables **stateful agent interactions** with conversation memory, tool access, and structured output parsing:

```typescript
// Traditional approach: Single API call
const response = await anthropic.messages.create({...})

// Claude Code SDK approach: Agent workflow
const momentExtractor = createMomentExtractor({
  onProgress: (step) => updateUI(step),
  onAgentActivity: (agent) => trackAgent(agent),
  onPrompt: (prompt) => logPrompt(prompt)
})

const result = await momentExtractor.analyzeCompanies(companies)
```

### Multi-Agent Architecture Pattern

Moments implements **specialized sub-agents** rather than monolithic AI processing:

**1. Content Analyzer Agent**
```typescript
export class ContentAnalyzer {
  async analyze(content: ContentItem[]): Promise<AnalysisResult> {
    return this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      messages: [{ role: 'user', content: this.buildAnalysisPrompt(content) }]
    })
  }
}
```

**2. Classification Agent**  
```typescript
export class ClassificationAgent {
  async classifyMoments(moments: PivotalMoment[]): Promise<ClassificationResult> {
    // Hybrid rule-based + ML classification logic
    const ruleHits = this.applyRules(moments)
    const mlPredictions = await this.mlClassify(moments)
    return this.ensemble(ruleHits, mlPredictions)
  }
}
```

**3. Correlation Engine**
```typescript  
export class CorrelationEngine {
  async findCorrelations(moments: PivotalMoment[]): Promise<CorrelationResult> {
    const entityGraph = this.buildEntityGraph(moments)
    const clusters = this.detectCommunities(entityGraph)
    return this.attachMacroMicroLinks(clusters)
  }
}
```

### Local-First with Global Intelligence

The **hybrid local-first** pattern enables both privacy and AI capabilities:

**Local Storage Layer**:
```typescript
// Zustand store with persistence
export const useMomentsStore = create<MomentStore>()(
  persist(
    (set, get) => ({
      moments: [],
      progress: { isActive: false, agents: [], completedSteps: [] },
      analyzeMoments: async () => {
        // Local processing with AI enhancement
      }
    }),
    { name: 'moments-store' }
  )
)
```

**AI Agent Integration**:
```typescript
const progressCallbacks = {
  onProgress: (step: AnalysisStep) => addStep(step),
  onAgentActivity: (agent: AgentActivity) => updateAgent(agent),
  onPrompt: (prompt: string) => setCurrentPrompt(prompt)
}
```

## TypeScript-First AI Development

### Comprehensive Type Safety

Moments demonstrates **end-to-end type safety** for AI applications:

```typescript
export interface PivotalMoment {
  id: string
  title: string  
  classification: MomentClassification
  impact: { score: number; reasoning: string }
  entities: {
    companies: string[]
    technologies: string[]
    people: string[]
    locations: string[]
  }
  timeline: {
    estimatedDate?: Date
    timeframe?: string
    isHistorical: boolean
  }
}

export interface AgentActivity {
  agentId: string
  agentType: 'content_analyzer' | 'classification_agent' | 'correlation_engine'
  status: 'spawning' | 'active' | 'processing' | 'completed' | 'error'
  currentTask?: string
  model: string
  processingCount: number
}
```

### Configuration-Driven Development

**YAML Configuration with TypeScript Interfaces**:
```yaml
# config.yml
agents:
  content_analyzer:
    enabled: true
    model: "claude-sonnet-4-20250514"
    temperature: 0.3
  classification_agent:
    model: "claude-sonnet-4-20250514" 
    temperature: 0.2
```

```typescript
// Type-safe configuration loading
interface AgentConfig {
  enabled: boolean
  model: string
  temperature: number
}

const config = await loadConfig()
const extractor = createMomentExtractor(config.agents.content_analyzer)
```

## Advanced Development Patterns

### Progress Tracking Architecture

![Real-time Progress Tracking](images/moments.png)

Production AI applications require **transparent processing** for user confidence:

```typescript
export interface AnalysisProgress {
  isActive: boolean
  currentStep: AnalysisStep | null
  completedSteps: AnalysisStep[]
  activeAgents: AgentActivity[]
  currentPrompt?: string
  progressPercentage: number
  stats: {
    totalItems: number
    processedItems: number  
    momentsExtracted: number
    errorsEncountered: number
  }
}
```

### Error Boundaries and Resilience

**Graceful AI Failure Handling**:
```typescript
try {
  const result = await extractor.analyzeContent(content, 'company', sourceName)
  moments.push(...result.moments)
} catch (error) {
  const errorMessage = `Failed to analyze ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
  errors.push(errorMessage)
  
  // Continue processing other items
  this.config.onProgress?.({
    id: `error-${item.name}`,
    status: 'error',
    description: `Error processing ${item.name}`,
    details: errorMessage
  })
}
```

### Next.js 14+ Integration Patterns

**App Router with Server Actions**:
```typescript
// For production: Move AI processing to server actions
'use server'

export async function analyzeMomentsAction(
  companies: Company[],
  technologies: Technology[]  
): Promise<MomentAnalysisResult> {
  const extractor = createMomentExtractor({
    apiKey: process.env.ANTHROPIC_API_KEY // Server-side only
  })
  
  return await extractor.analyzeCompanies(companies)
}
```

**Client-Side Development Mode**:
```typescript
// Development: Browser-based with warnings
const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // Development only
  defaultHeaders: {
    "anthropic-dangerous-direct-browser-access": "true"
  }
})
```

## Production Deployment Strategy

### Vibe Coding for AI Applications

Following **Eric Breck's production vibe coding principles** adapted for AI:

**1. Focus on Leaf Nodes**: Apply vibe coding to AI analysis components with isolated responsibilities
**2. Verification Over Implementation**: Design easily testable AI outputs rather than understanding every prompt detail  
**3. Stress Test Stability**: Test AI agents under various content types and edge cases
**4. Claude as Product Manager**: Use Claude to iterate on prompts and agent behavior

### Testing AI Applications

**Unit Testing AI Components**:
```typescript
describe('MomentExtractor', () => {
  it('should classify pivotal moments correctly', async () => {
    const mockContent = [{ 
      type: 'markdown', 
      content: 'Acme AI announces Series B funding of $50M led by GV'
    }]
    
    const result = await extractor.analyzeContent(mockContent, 'company', 'Acme AI')
    
    expect(result.moments).toHaveLength(1)
    expect(result.moments[0].classification.microFactors).toContain('company')
    expect(result.moments[0].impact.score).toBeGreaterThan(70)
  })
})
```

**Integration Testing Agent Workflows**:
```typescript
describe('Full Analysis Pipeline', () => {
  it('should process companies through all agent stages', async () => {
    const companies = await loadTestCompanies()
    const result = await analyzeMomentsFromCatalog(companies, [], 'companies')
    
    expect(result.moments.length).toBeGreaterThan(0)
    expect(result.errors.length).toBeLessThan(result.totalProcessed * 0.1) // <10% error rate
  })
})
```

## Performance Optimization Strategies

### Memory Management for Large Datasets

```typescript
// Streaming processing for large content sets
async function* processInBatches<T>(
  items: T[], 
  batchSize: number,
  processor: (batch: T[]) => Promise<U[]>
): AsyncGenerator<U[], void, unknown> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    yield await processor(batch)
  }
}
```

### Caching and Memoization

```typescript
// Intelligent caching for repeated analysis
const memoizedExtraction = useMemo(() => {
  return createMomentExtractor({
    // Cache expensive embeddings and classifications
    enableCache: true,
    cacheKey: `analysis-${contentHash}`
  })
}, [contentHash])
```

## Developer Experience Innovation

### Real-Time Development Feedback

The **progress tracking system** provides developers with unprecedented visibility into AI agent behavior:

- **Live prompt inspection**: See exactly what prompts are sent to Claude
- **Agent spawning visualization**: Monitor sub-agent creation and lifecycle  
- **Step-by-step processing**: Track analysis phases with timing information
- **Error correlation**: Link failures to specific content and processing stages

### Extensible Agent Architecture

```typescript
// Easy agent extension pattern
export class CustomAnalysisAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config)
  }
  
  async processCustomLogic(data: any): Promise<any> {
    // Custom AI processing logic
    return await this.anthropic.messages.create({
      model: this.config.model,
      messages: this.buildCustomPrompt(data)
    })
  }
}
```

## Getting Started

Clone and run the Moments application to explore these patterns:

```bash
git clone <repo-url>
cd moments
npm install
npm run dev
```

The codebase demonstrates production-ready patterns for:
- Multi-agent AI orchestration
- TypeScript-first AI development  
- Local-first with cloud AI integration
- Real-time progress tracking
- Error resilience and recovery
- Configuration-driven development

---

*The Moments architecture showcases the future of AI application development: sophisticated agent orchestration, type-safe AI workflows, and transparent processing—all built on the powerful foundation of Claude Code SDK.*

**Tags**: Claude Code SDK, AI Agents, TypeScript, Next.js, Agent Architecture, AI Development