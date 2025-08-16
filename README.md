<div align="center">
  <h1>⚡ Moments</h1>
  
  **AI-Powered Business Intelligence for the AI Industry**
  
  Transform overwhelming AI industry information into clear, actionable insights with local-first intelligence and Claude Code SDK integration.

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![Claude Code SDK](https://img.shields.io/badge/Claude_Code_SDK-Latest-purple?style=flat)](https://docs.anthropic.com/en/docs/claude-code/sdk)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
</div>

![Moments Dashboard](blog/images/dashboard.png)

## 🚀 What is Moments?

**Moments** is a local-first, agent-driven application that discovers and analyzes pivotal moments in the AI business landscape. Built as an intelligent wrapper around the [Claude Code SDK](https://docs.anthropic.com/en/docs/claude-code/sdk), Moments transforms raw business content into classified intelligence through specialized AI agents.

### ✨ Key Features

🤖 **Multi-Agent AI Analysis** - Specialized sub-agents for content analysis, classification, and correlation discovery

📊 **Business Intelligence Dashboard** - Three-tier analytics (Strategic/Tactical/Operational) with real-time visualizations

🔒 **Local-First Architecture** - Your data stays on your systems with optional AI enhancement

⚡ **Smart Update System** - Incremental analysis processes only changed content for 10x faster updates

🎯 **Factor Classification** - Automatic categorization by micro/macro business factors

🔗 **Entity Relationship Network** - Interactive force-directed graphs with 237+ entities and 1800+ relationships

📈 **Advanced Visualizations** - Sunburst charts, correlation matrices, growth velocity tracking

🗂️ **File-System Integration** - Two-way sync with human-readable markdown files

📱 **Apple Settings-Style Interface** - Professional, intuitive design with advanced storage management

⚡ **Parallel Processing** - Multi-source concurrent analysis with real-time progress tracking

## 🎯 Use Cases

### For Business Leaders
- **Investment Intelligence**: Track startup trajectories and acquisition targets
- **Competitive Analysis**: Monitor competitor moves 3-6 months before market impact  
- **Strategic Planning**: Understand regulatory impacts on product roadmaps

### For Development Teams
- **Agent Orchestration**: Learn multi-agent AI application patterns
- **Claude Code SDK**: Explore production-ready AI integration techniques
- **TypeScript AI Apps**: Study type-safe AI development workflows

## 🏗️ Architecture

![Dashboard Architecture](blog/images/dashboard-factors.png)

### Multi-Agent System Architecture
```typescript
// Specialized AI agents for different analysis tasks
const subAgents = {
  contentAnalyzer: {    // Extract pivotal moments from content
    model: "claude-sonnet-4-20250514",
    temperature: 0.3
  },
  classificationAgent: { // Categorize by business factors  
    model: "claude-sonnet-4-20250514",
    temperature: 0.2
  },
  correlationEngine: {   // Discover relationships
    model: "claude-sonnet-4-20250514", 
    temperature: 0.4
  }
}
```

### Technology Stack
- **Frontend**: Next.js 14+, React 18+, TypeScript 5+, Tailwind CSS, shadcn/ui, D3.js
- **AI Integration**: Claude Code SDK, Anthropic API, multi-agent orchestration
- **Visualization**: Recharts, D3.js force simulations, interactive network graphs
- **State Management**: Zustand with file-system persistence
- **Architecture**: 4-layer design (Presentation, Agent Orchestration, Data Processing, Storage)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Anthropic API key
- 2GB free disk space

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/moments.git
cd moments

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Anthropic API key to .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Configuration

```env
# Required: Anthropic API key for AI analysis
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Custom configuration path
CONFIG_PATH=./config.yml
```

## 📊 Dashboard Features

![Entity Network Graph](blog/images/graph.png)

### Three-Tier Information Architecture

**Strategic Tier (Executive Dashboard)**
- High-level KPIs and trend alerts for leadership
- Knowledge base growth metrics and velocity tracking
- Real-time system health indicators

**Tactical Tier (Analysis Dashboard)**  
- Factor distribution with interactive sunburst charts
- Entity relationship networks with 237 entities
- Correlation insights and pattern discovery

**Operational Tier (Detail Dashboard)**
- Individual moment analysis and classification
- Relationship strength matrices with quantitative coefficients
- Source analysis and temporal correlation patterns

### Advanced Visualizations

**Knowledge Base Growth Metrics**
- Multi-series velocity charts with time-series data
- Health indicators with circular gauge visualizations  
- Quality score progress bars and industry coverage maps

**Factor Distribution Analytics**
- Three-ring sunburst charts (micro/macro, categories, specific types)
- Impact distribution heatmaps with color intensity mapping
- Interactive filtering and AI-generated pattern insights

**Entity Relationship Network**
- Force-directed network visualization with drag-and-drop
- Proportional node sizing based on connection count
- Color-coded relationship types and strength-based edge width

![Relationship Matrix](blog/images/matrix.png)

**Relationship Strength Matrix**  
- Correlation coefficients with hierarchical clustering
- Interactive matrix cells with detailed relationship analysis
- Quantitative relationship strengths and statistical significance

## 🧠 AI Analysis Features

### Factor Classification System

Moments categorizes business developments into:

**Micro Factors** (Company-Specific):
- 🏢 **Company**: Leadership, funding, product launches
- 🥊 **Competition**: Competitor moves, market positioning
- 🤝 **Partners**: Strategic alliances, integrations  
- 👥 **Customers**: Customer wins, market adoption

**Macro Factors** (Industry-Wide):
- 💰 **Economic**: Market conditions, investment trends
- 🌍 **Geo-Political**: Trade policies, international relations
- ⚖️ **Regulation**: Policy changes, compliance requirements
- 🔬 **Technology**: Breakthrough innovations, standards
- 🌱 **Environment**: Sustainability, ESG considerations
- ⛓️ **Supply Chain**: Infrastructure, resource availability

### Real-Time Processing Intelligence

Monitor AI agent activities with live progress tracking:
- **Content Analyzer**: Extracting moments from documents
- **Classification Agent**: Categorizing by business factors
- **Correlation Engine**: Discovering entity relationships
- **Progress Intelligence**: Step-by-step analysis visibility with live moment counting

### Parallel Processing Performance

- **Smart Updates**: 90% faster processing by analyzing only changed content
- **Parallel Agents**: Multiple AI agents working simultaneously  
- **Incremental Cache**: MD5 content hashing for change detection
- **Temporal Windows**: Correlation analysis within configurable time periods

## 🗂️ File-System Integration

### Two-Way Persistence

**Human-Readable Storage**
- All data stored as markdown files with YAML frontmatter
- Moments automatically saved to `moments/` folder hierarchy
- Companies and technologies loaded from `companies/` and `technologies/` folders

**Example Moment File Format**
```yaml
---
title: "Tesla develops 10x parameter FSD model with end-to-end architecture"
type: "company"
impact_score: 85
confidence: 92
classification:
  micro_factors: ["company"]
  macro_factors: ["technology"]
entities:
  companies: ["Tesla"]
  technologies: ["autonomous driving", "neural networks"]
timeline:
  extracted_date: "2025-08-10"
---

# Analysis Summary

Tesla's development of a 10x parameter Full Self-Driving model represents...
```

### Configuration Management

Customize content sources in `config.yml`:

```yaml
catalogs:
  companies:
    name: "Companies"
    description: "AI Companies and Startups" 
    source_folder: "./companies"
    file_patterns: ["**/*.md", "**/*.txt"]
  
  technologies:
    name: "Technologies"
    description: "AI Technologies and Frameworks"
    source_folder: "./technologies"
    file_patterns: ["**/*.md", "**/*.txt"]

agents:
  content_analyzer:
    enabled: true
    model: "claude-sonnet-4-20250514"
    temperature: 0.3

app:
  processing:
    parallel_processing:
      enabled: true
      max_concurrent_sources: 4
      max_concurrent_content_per_source: 3
```

## 🎨 User Interface

### Apple Settings-Style Design

Professional interface with:
- **Edge-to-edge layout** with dedicated Settings sidebar
- **Three-section storage management** (Health, Current Data, Management)
- **Smooth animations** and hover states throughout
- **Responsive design** optimized for all screen sizes

### Interactive Navigation

- **Entity Navigation**: Click companies/technologies in moment cards to view details
- **Keyword Filtering**: Click keyword badges for instant filtering
- **Detail Views**: Comprehensive 4-tab detail pages (Overview, Related, Source, Timeline)
- **Real-Time Search**: Live filtering with updated statistics

## 📊 Sample Data

The repository includes curated content for immediate exploration:

**Companies**
- **Glean**: Agent platform and enterprise search ($7.2B valuation)
- **Sierra AI**: Conversational agent operating system ($4.5B valuation)  
- **Tesla**: Autonomous driving and AI infrastructure
- **Walmart**: Enterprise AI strategy and agentic systems

**Technologies**
- **Claude Code**: AI development tools and SDK patterns
- **LLM Agents**: Multi-agent system architectures
- **Model Context Protocol**: Standardized agent tool integration

## 🧪 Feature Evaluation Guide

### Claude Code SDK Integration (Latest Feature)

The Moments application now includes **comprehensive Claude Code SDK integration** that provides enterprise-grade multi-provider support, advanced session management, intelligent caching, and sophisticated workflow orchestration capabilities for AI-powered business intelligence analysis.

#### Testing Claude Code SDK Integration

**1. Multi-Provider SDK Client**
```typescript
// Create SDK client with automatic provider detection
import { ClaudeSDKClient, createClaudeClient } from '@/lib/claude-sdk/client-wrapper'

const client = new ClaudeSDKClient({
  provider: 'anthropic', // or 'bedrock'
  temperature: 0.7,
  maxTokens: 4000,
  max_turns: 10,
  enableCaching: true
})

// Single query with automatic provider selection
const result = await client.query("Analyze this AI industry development")
console.log('Response:', result.content)
console.log('Usage:', result.usage)
console.log('Cost:', result.cost)
console.log('Provider:', result.provider)
```

**2. Session Management & Multi-turn Conversations**
```typescript
// Test persistent session management
import { SessionManager, createSessionManager } from '@/lib/claude-sdk/session-manager'

const sessionManager = createSessionManager({
  persistence: 'localStorage',
  defaultOptions: {
    system_prompt: "You are an AI business intelligence analyst",
    max_turns: 15,
    temperature: 0.6
  }
})

// Create and manage sessions
const { sessionId, client } = await sessionManager.createSession()

// Continue conversation with context preservation
const response1 = await sessionManager.continueConversation(
  sessionId, 
  "What are the key trends in AI funding?"
)

const response2 = await sessionManager.continueConversation(
  sessionId,
  "How do these trends compare to last quarter?" // Context preserved
)

// Session analytics
const analytics = await sessionManager.getSessionAnalytics()
console.log('Total sessions:', analytics.totalSessions)
console.log('Total cost:', analytics.totalCost)
console.log('Average session length:', analytics.avgSessionLength)
```

**3. Enhanced Sub-Agent Workflows**
```typescript
// Test enhanced sub-agent manager with SDK integration
import { EnhancedSubAgentManager } from '@/lib/claude-sdk/enhanced-sub-agent-manager'

const manager = new EnhancedSubAgentManager()

// Create specialized agent sessions
const contentSession = await manager.createAgentSession('content_analyzer', {
  system_prompt: "Extract pivotal business moments from AI industry content",
  temperature: 0.3
})

const classificationSession = await manager.createAgentSession('classification_agent', {
  system_prompt: "Classify business events by micro and macro factors",
  temperature: 0.2
})

// Execute multi-agent workflow
const workflow = await manager.executeWorkflow([
  {
    agentType: 'content_analyzer',
    prompt: 'Analyze this content for key developments: {{content}}',
    expectedFormat: 'json',
    parallel: true
  },
  {
    agentType: 'classification_agent', 
    prompt: 'Classify the extracted information by business factors',
    expectedFormat: 'json',
    dependencies: ['content_analyzer']
  }
], { content: "AI startup raises $100M Series B funding round" })

console.log('Workflow success:', workflow.success)
console.log('Total cost:', workflow.totalCost)
console.log('Processing time:', workflow.totalTime)
console.log('Results count:', workflow.results.size)
```

**4. Intelligent Prompt Caching**
```typescript
// Test automatic prompt caching system
import { PromptCache, getGlobalPromptCache } from '@/lib/claude-sdk/prompt-cache'

const cache = getGlobalPromptCache()

// Cache automatically activated for repeated queries
const query = "What are the key factors in AI startup success?"
const response1 = await client.query(query) // Cache miss
const response2 = await client.query(query) // Cache hit

// Cache analytics
const stats = cache.getStats()
console.log('Cache hit rate:', stats.hitRate)
console.log('Total savings:', stats.totalSavings)
console.log('Cache entries:', stats.totalEntries)

const efficiency = cache.getEfficiencyMetrics()
console.log('Memory usage:', efficiency.memoryUsage)
console.log('Average entry size:', efficiency.avgEntrySize)
console.log('Savings percentage:', efficiency.savingsPercentage)
```

**5. Streaming Responses**
```typescript
// Test real-time streaming capabilities
async function testStreaming() {
  const session = await manager.createAgentSession('content_analyzer')
  
  for await (const chunk of manager.streamAgentResponse(
    session.sessionId,
    "Provide a detailed analysis of current AI market trends"
  )) {
    if (chunk.type === 'chunk') {
      console.log('Streaming content:', chunk.content)
    } else if (chunk.type === 'complete') {
      console.log('Stream completed')
      break
    }
  }
}

await testStreaming()
```

**6. Provider Adapter Integration**
```typescript
// Test provider adapter with fallback capabilities
import { ProviderAdapter, createProviderAdapter } from '@/lib/claude-sdk/provider-adapter'

const adapter = createProviderAdapter(undefined, { enableCache: true })

// Test request with standardized response format
const response = await adapter.sendRequest({
  provider: provider,
  messages: [{ role: 'user', content: 'Analyze AI market trends' }],
  model: 'sonnet',
  options: {
    temperature: 0.7,
    maxTokens: 4000,
    enableCaching: true
  }
})

console.log('Adapter response:', response.content)
console.log('Cost estimate:', response.cost)
console.log('Cache hit:', response.cacheHit)
console.log('Provider used:', response.provider)

// Test provider validation
const validation = await adapter.validateProvider()
console.log('Provider valid:', validation.isValid)
console.log('Validation errors:', validation.errors)
console.log('Validation warnings:', validation.warnings)
```

**7. Advanced Content Analysis**
```typescript
// Test integrated content analysis with SDK
const contentItems = [
  {
    id: 'item-1',
    name: 'AI Funding Report',
    type: 'markdown' as const,
    content: 'Major AI startup secures $150M Series C funding round led by top-tier VCs',
    path: '/content/funding-report.md',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Comprehensive analysis workflow
const analysisResult = await manager.analyzeContent(contentItems, 'correlation')

if (analysisResult.success) {
  console.log('Analysis completed successfully')
  console.log('Processing time:', analysisResult.processingTime)
  console.log('Total cost:', analysisResult.cost)
  console.log('Total tokens:', analysisResult.usage?.totalTokens)
  console.log('Analysis data:', analysisResult.data)
  console.log('Workflow steps completed:', analysisResult.metadata?.workflowSteps)
}
```

**8. Session Export & Analytics**
```typescript
// Test comprehensive session management
const sessions = await sessionManager.listSessions()
console.log('Active sessions:', sessions.length)

// Export session for analysis
const sessionExport = await sessionManager.exportSession(sessionId)
if (sessionExport) {
  console.log('Session analysis:', sessionExport.analysis)
  console.log('Average response length:', sessionExport.analysis.averageResponseLength)
  console.log('Total interactions:', sessionExport.analysis.totalInteractions)
  console.log('Cost per message:', sessionExport.analysis.costPerMessage)
}

// Cleanup old sessions
const deletedCount = await sessionManager.cleanupOldSessions(7) // 7 days
console.log('Cleaned up sessions:', deletedCount)
```

**9. Error Handling & Resilience**
```typescript
// Test comprehensive error handling
try {
  // Test with invalid configuration
  const faultyClient = new ClaudeSDKClient({
    provider: 'anthropic',
    providerConfig: { apiKey: 'invalid-key' }
  })
  
  await faultyClient.query("Test query")
} catch (error) {
  console.log('Error handled gracefully:', error.message)
}

// Test automatic provider failover
const response = await client.query("Test failover scenario")
console.log('Failover response received:', !!response.content)
```

**10. Integration with Existing Moments Features**
```typescript
// Test integration with existing moments functionality
import { useMomentsStore } from '@/store/moments-store'

const momentsStore = useMomentsStore.getState()

// Use enhanced manager for moment analysis
const moments = momentsStore.moments.slice(0, 5)
const enhancedAnalysis = await manager.executeWorkflow([
  {
    agentType: 'classification_agent',
    prompt: 'Re-classify these moments with enhanced accuracy',
    parallel: true
  },
  {
    agentType: 'correlation_engine',
    prompt: 'Find new correlations between these moments',
    dependencies: ['classification_agent']
  }
], { moments })

console.log('Enhanced analysis completed:', enhancedAnalysis.success)
console.log('New correlations found:', enhancedAnalysis.results.get('correlation_engine'))
```

**Key Benefits:**
- ✅ **Enterprise-Grade SDK Integration**: Professional Claude Code SDK wrapper with multi-provider support
- ✅ **Advanced Session Management**: Persistent multi-turn conversations with automatic context preservation
- ✅ **Intelligent Prompt Caching**: LRU cache with compression, persistence, and efficiency monitoring
- ✅ **Workflow Orchestration**: Parallel and sequential agent execution with dependency management
- ✅ **Provider Abstraction**: Seamless switching between Anthropic and Bedrock providers
- ✅ **Streaming Capabilities**: Real-time response streaming with chunk-based processing
- ✅ **Cost Optimization**: Automatic cost tracking, usage monitoring, and intelligent caching
- ✅ **Error Resilience**: Comprehensive error handling with automatic fallback and retry logic
- ✅ **Session Analytics**: Detailed usage statistics, session management, and export capabilities
- ✅ **TypeScript Safety**: Complete type definitions with build-time validation

**Technical Implementation:**
- **ClaudeSDKClient Wrapper**: Unified client supporting both Anthropic and Bedrock providers
- **SessionManager**: localStorage/memory persistence with multi-turn conversation context
- **PromptCache**: Intelligent caching with LRU eviction, TTL expiration, and efficiency metrics
- **EnhancedSubAgentManager**: Multi-agent workflow orchestration with session-based conversations
- **ProviderAdapter**: Standardized provider interface with automatic failover and validation
- **Integration Layer**: Seamless compatibility with existing Moments architecture and components

### Provider Configuration (Previous Feature)

The Moments application now supports configurable AI model providers, allowing seamless switching between Anthropic API and Amazon Bedrock for enterprise deployments.

#### Accessing Provider Configuration

1. **Navigate to Settings**
   - Click the Settings icon in the application
   - Select the "Provider" section in the sidebar

2. **Configure Your Provider**
   
   **For Anthropic API (Recommended for Development):**
   - Select "Anthropic API" from the provider dropdown
   - Ensure your `ANTHROPIC_API_KEY` environment variable is set
   - Verify the base URL is `https://api.anthropic.com`
   
   **For Amazon Bedrock (Enterprise Deployment):**
   - Select "Amazon Bedrock" from the provider dropdown
   - Choose your AWS region (e.g., us-east-1, us-west-2)
   - Configure authentication method:
     - AWS CLI profile (default)
     - Bedrock API keys (toggle "Use Bedrock API Keys")
     - Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
   - Optional: Set inference profile for cross-region optimization

3. **Test Your Configuration**
   - Click "Test Connection" to validate authentication
   - View detailed test results including:
     - Connection status (success/failure)
     - Latency measurements
     - Token usage statistics
     - Estimated costs per request
   
4. **Compare Provider Performance**
   - Use "Compare Both Providers" to test both simultaneously
   - Review comparison metrics:
     - Response latency (ms)
     - Cost per request ($)
     - Success rate
     - Model availability

5. **Customize Model Mappings**
   - Configure model IDs for each provider:
     - Sonnet: Balanced performance
     - Haiku: Fast and economical
     - Opus: Most capable
   - Map logical names to provider-specific model IDs
   - Example: `claude-3-5-sonnet` → `us.anthropic.claude-3-7-sonnet`

#### Testing Provider Functionality

**Basic Connection Test:**
```yaml
1. Set provider type to "anthropic" or "bedrock"
2. Configure authentication credentials
3. Click "Test Connection"
4. Verify green success badge appears
```

**Performance Comparison:**
```yaml
1. Configure both providers with valid credentials
2. Enter test prompt: "What is 2+2?"
3. Click "Compare Both Providers"
4. Review latency and cost differences
```

**Production Configuration:**
```yaml
# config.yml
model_provider:
  type: "bedrock"  # Use Bedrock for production
  bedrock:
    aws_region: "us-east-1"
    use_bedrock_api_key: true
  fallback_provider: "anthropic"  # Automatic fallback
  auto_fallback: true
```

#### Troubleshooting

**Authentication Issues:**
- Verify API keys are correctly set in `.env.local`
- Check AWS credentials with `aws sts get-caller-identity`
- Ensure IAM role has `bedrock:InvokeModel` permission

**Model Availability:**
- Confirm model is available in selected AWS region
- Check Bedrock console for enabled models
- Use inference profiles for cross-region access

**Configuration Persistence:**
- Settings are saved to `config.yml` automatically
- Changes take effect immediately
- Restart not required after configuration updates

## 🔧 Development

### Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                 # REST API endpoints
│   │   ├── moments/         # Moment CRUD operations
│   │   ├── companies/       # Company data loading
│   │   └── technologies/    # Technology data loading
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── dashboard-*.tsx     # Dashboard visualizations
│   ├── moment-*.tsx        # Moment display and details
│   └── graph-view.tsx      # Entity network visualization
├── lib/                    # Core logic
│   ├── moment-extractor.ts   # Claude SDK integration
│   ├── sub-agents.ts         # Agent orchestration
│   ├── factor-classifier.ts  # Business factor logic
│   └── incremental-moment-manager.ts # Smart updates
├── store/                  # Zustand state management
└── types/                  # TypeScript definitions
```

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # Code linting
```

## 🧪 Feature Evaluation Guide

### Provider-Aware Sub-Agent Manager (Latest Feature)

The Moments application now includes a **Provider-Aware Sub-Agent Manager** that provides seamless multi-provider support, automatic failover, enhanced error handling, and comprehensive usage tracking for AI sub-agents across both Anthropic and Amazon Bedrock providers.

#### Testing Provider-Aware Sub-Agent Manager

**1. Basic Migration Testing**
```typescript
// Legacy approach (still works but deprecated)
import { createSubAgentManager } from '@/lib/sub-agents'
const legacyManager = createSubAgentManager()

// Modern approach with provider abstraction
import { createProviderAwareSubAgentManager } from '@/lib/sub-agents'
const modernManager = await createProviderAwareSubAgentManager()

// Check provider status
const status = modernManager.getProviderStatus()
console.log('Primary provider:', status.primary.type)
console.log('Has fallback:', !!status.fallback)
console.log('Auto fallback enabled:', status.autoFallback)
```

**2. Explicit Provider Selection**
```typescript
import { createSubAgentManagerWithProvider } from '@/lib/sub-agents'

// Force Anthropic provider
const anthropicManager = await createSubAgentManagerWithProvider('anthropic')

// Force Bedrock provider
const bedrockManager = await createSubAgentManagerWithProvider('bedrock')

// Test provider switching
const canSwitch = await modernManager.switchProvider('bedrock')
console.log('Provider switch successful:', canSwitch)
```

**3. Health Monitoring and Failover Testing**
```typescript
// Check provider health
const healthStatus = await modernManager.checkProviderHealth()
console.log('Primary health:', healthStatus.primary)
console.log('Fallback health:', healthStatus.fallback)

// Test automatic failover (simulate primary failure)
const manager = await createProviderAwareSubAgentManager(
  undefined, // Default configs
  undefined, // Auto-load provider config
  true       // Enable auto-failover
)

// Monitor health and failover behavior
const status = await manager.checkProviderHealth()
if (!status.primary.isHealthy && status.fallback?.isHealthy) {
  console.log('Will automatically use fallback provider')
}
```

**4. Enhanced Error Handling and Retry Logic**
```typescript
// Test enhanced error handling with sample content
const testContent = [{
  id: 'test-1',
  name: 'Test Content',
  type: 'markdown' as const,
  content: 'AI startup raises $50M Series A funding',
  path: '/test/content.md',
  lastModified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  size: 1024
}]

try {
  const result = await manager.analyzeContent(testContent)
  
  if (result.success) {
    console.log('Analysis successful:', {
      provider: result.provider,
      model: result.model,
      processingTime: result.processingTime,
      usage: result.usage
    })
  } else {
    console.log('Analysis failed with enhanced error handling:', result.error)
  }
} catch (error) {
  console.log('Caught error with retry logic:', error)
}
```

**5. Parallel Processing with Usage Tracking**
```typescript
// Test parallel processing with usage tracking
const sampleMoments = [
  {
    id: 'moment-1',
    title: 'AI Funding Surge',
    description: 'Major funding round in AI sector',
    content: 'Company X raises $100M in Series B funding for AI infrastructure',
    classification: {
      microFactors: ['company'],
      macroFactors: ['economic'],
      confidence: 'high',
      reasoning: 'Significant funding event',
      keywords: ['funding', 'AI', 'Series B']
    },
    impact: { score: 85, reasoning: 'Large funding round indicates market confidence' },
    timeline: { timeframe: '2024', isHistorical: false },
    source: { 
      type: 'company', 
      id: 'company-x', 
      name: 'Company X',
      contentId: 'content-1',
      filePath: '/companies/company-x.md'
    },
    entities: { companies: ['Company X'], technologies: ['AI'], people: [], locations: [] },
    extractedAt: new Date(),
    metadata: { extractedAt: new Date(), version: '1.0' }
  }
]

// Test classification with parallel processing
const classificationResult = await manager.classifyMoments(
  sampleMoments, 
  10,  // Batch size
  true // Enable parallel batches
)

if (classificationResult.success) {
  console.log('Parallel classification results:', {
    provider: classificationResult.provider,
    processingTime: classificationResult.processingTime,
    usage: classificationResult.usage,
    classifications: classificationResult.data?.classifications?.length
  })
}

// Test correlation analysis
const correlationResult = await manager.findCorrelations(
  sampleMoments,
  15, // Batch size
  true // Enable parallel batches
)

if (correlationResult.success) {
  console.log('Correlation analysis results:', {
    provider: correlationResult.provider,
    correlations: correlationResult.data?.correlations?.length,
    insights: correlationResult.data?.insights?.length,
    usage: correlationResult.usage
  })
}
```

**6. Configuration-Driven Operation**
```typescript
// Test configuration-driven operation
const configuredManager = await createProviderAwareSubAgentManager({
  content_analyzer: {
    enabled: true,
    model: 'sonnet',           // Logical model name
    temperature: 0.3,
    parallel_batch_size: 15,
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
    model: 'haiku',            // Use cheaper model for correlation
    temperature: 0.4,
    parallel_batch_size: 20,
    enable_parallel_batches: true
  },
  report_generator: {
    enabled: true,
    model: 'haiku',            // Use cheaper model for reports
    temperature: 0.5,
    parallel_batch_size: 5,
    enable_parallel_batches: false
  }
})

// Test report generation
const reportResult = await configuredManager.generateReport(
  sampleMoments,
  [], // No correlations for this test
  {
    type: 'executive_summary',
    timeframe: '2024',
    focusAreas: ['funding', 'AI']
  }
)

if (reportResult.success) {
  console.log('Report generation results:', {
    provider: reportResult.provider,
    title: reportResult.data?.report.title,
    sections: reportResult.data?.report.sections.length,
    recommendations: reportResult.data?.report.recommendations.length,
    usage: reportResult.usage
  })
}
```

**7. Migration Validation and Examples**
```typescript
// Test migration validation
import { MigrationUtilities } from '@/lib/migration-examples'

const migrationReport = await MigrationUtilities.createMigrationReport()
console.log('Migration capabilities comparison:', migrationReport)

const readinessCheck = await MigrationUtilities.validateMigrationReadiness()
console.log('Migration readiness:', readinessCheck.isReady)
console.log('Checklist:', readinessCheck.checklist)

// Test if current manager is legacy or provider-aware
const isLegacy = MigrationUtilities.isLegacyManager(manager)
console.log('Is legacy manager:', isLegacy)
```

**8. Environment-Specific Configuration Testing**
```bash
# Test different environment configurations

# Development with Anthropic
export ANTHROPIC_API_KEY=sk-ant-...
export NODE_ENV=development
# Manager will use Anthropic with cheaper models

# Production with Bedrock
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export NODE_ENV=production
# Manager will use Bedrock with production optimizations

# Hybrid environment with fallback
export ANTHROPIC_API_KEY=sk-ant-...
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
# Manager will auto-detect primary and set up fallback
```

**Key Benefits:**
- ✅ **Multi-Provider Support**: Seamless switching between Anthropic and Amazon Bedrock
- ✅ **Automatic Failover**: Health monitoring with automatic provider switching
- ✅ **Enhanced Error Handling**: Exponential backoff retry logic with detailed error classification
- ✅ **Usage Tracking**: Comprehensive token usage and cost monitoring
- ✅ **Parallel Processing**: Configurable batch processing for improved performance
- ✅ **Backward Compatibility**: Legacy SubAgentManager still works with deprecation warnings
- ✅ **Configuration Driven**: Logical model names with provider-specific mapping
- ✅ **Production Ready**: Health checks, monitoring, and enterprise authentication support
- ✅ **Migration Support**: Comprehensive examples and validation utilities

**Technical Implementation:**
- **ProviderAwareSubAgentManager Class**: New manager with provider abstraction layer
- **Automatic Provider Detection**: Environment-based provider selection and configuration
- **Health Monitoring**: Real-time provider health checks with status reporting
- **Enhanced Retry Logic**: Exponential backoff with provider fallback on failures
- **Usage Statistics**: Detailed token usage and cost tracking per provider
- **Configuration Integration**: Seamless integration with existing config.yml settings
- **Migration Path**: Clear upgrade path with comprehensive examples and utilities
- **Type Safety**: Complete TypeScript interfaces with extended AgentConfig support

### AWS Bedrock Authentication (Previous Feature)

The Moments application now includes **comprehensive AWS Bedrock authentication** supporting multiple authentication methods, detailed permission validation, and enterprise-grade AWS integration for AI model providers.

#### Testing AWS Bedrock Authentication

**1. Authentication Methods Testing**
```bash
# Method 1: AWS CLI Configuration
aws configure set profile development
export AWS_PROFILE=development
export BEDROCK_AUTH_METHOD=cli

# Method 2: Environment Variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
export BEDROCK_AUTH_METHOD=env

# Method 3: AWS SSO
export AWS_SSO_START_URL=https://your-org.awsapps.com/start
export AWS_SSO_ACCOUNT_ID=123456789012
export AWS_SSO_ROLE_NAME=BedrockUserRole
export BEDROCK_AUTH_METHOD=sso

# Method 4: Bedrock API Keys
export BEDROCK_API_KEY=your-bedrock-api-key
export BEDROCK_AUTH_METHOD=api_key

# Method 5: IAM Role Assumption
export AWS_ROLE_ARN=arn:aws:iam::123456789012:role/BedrockRole
export BEDROCK_AUTH_METHOD=role
```

**2. Permission Validation Testing**
```typescript
// Test comprehensive permission validation
import { BedrockAuth } from '@/lib/auth/bedrock-auth'

const auth = new BedrockAuth({
  method: 'auto',
  region: 'us-east-1'
})

// Validate authentication and permissions
const validation = await auth.validateBedrockPermissions()
console.log('Authentication valid:', validation.isValid)
console.log('Identity:', validation.identity)
console.log('Can invoke model:', validation.permissions?.canInvokeModel)
console.log('Can stream model:', validation.permissions?.canStreamModel)

// Expected output for valid authentication:
// Authentication valid: true
// Identity: { arn: 'arn:aws:iam::123456789012:user/developer', ... }
// Can invoke model: true
// Can stream model: true
```

**3. Multi-Provider Authentication Validator**
```typescript
// Test universal authentication validator
import { AuthValidator } from '@/lib/auth/auth-validator'

const validator = new AuthValidator()

// Test both providers simultaneously
const anthropicResult = await validator.validateAnthropicAuth()
const bedrockResult = await validator.validateBedrockAuth()

console.log('Anthropic auth:', anthropicResult.isValid)
console.log('Bedrock auth:', bedrockResult.isValid)
console.log('Recommendations:', bedrockResult.suggestions)

// Get comprehensive authentication status
const status = await validator.getAuthStatus([
  { type: 'anthropic' },
  { type: 'bedrock' }
])

console.log('Valid providers:', status.validProviders)
console.log('Has valid provider:', status.hasValidProvider)
```

**4. BedrockProvider Integration Testing**
```typescript
// Test enhanced Bedrock provider with new authentication
import { BedrockProvider } from '@/lib/model-providers/bedrock-provider'

const provider = new BedrockProvider({
  type: 'bedrock',
  region: 'us-east-1',
  useBedrockApiKey: true,
  apiKey: process.env.BEDROCK_API_KEY
})

// Test authentication status
const authStatus = await provider.getAuthenticationStatus()
console.log('Provider auth status:', authStatus)

// Test available authentication methods
const methods = BedrockProvider.getAuthenticationMethods()
console.log('Available auth methods:', methods)

// Test authentication validation
const isValid = await provider.validateAuth()
console.log('Provider authentication valid:', isValid)
```

**5. Environment Configuration Validation**
```bash
# Test comprehensive .env.example configuration
cat .env.example | grep -A 50 "AWS BEDROCK CONFIGURATION"

# Verify all authentication methods are documented:
# ✅ AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
# ✅ BEDROCK_API_KEY 
# ✅ AWS_PROFILE
# ✅ AWS_SSO_* variables
# ✅ AWS_ROLE_ARN for role assumption
# ✅ AWS_REGION configuration
# ✅ Security notes and best practices
```

**6. Error Handling & Troubleshooting**
```typescript
// Test comprehensive error scenarios
try {
  const auth = new BedrockAuth({ 
    method: 'api_key',
    bedrockApiKey: 'invalid-key'
  })
  await auth.validateBedrockPermissions()
} catch (error) {
  console.log('Error type:', error.constructor.name)
  console.log('Error message:', error.message)
  // Expected: ModelProviderAuthError with specific guidance
}

// Test validation with helpful suggestions
const result = await validator.validateBedrockAuth({
  type: 'bedrock',
  useBedrockApiKey: true,
  apiKey: '' // Empty key to trigger error
})

console.log('Validation suggestions:', result.suggestions)
// Expected suggestions:
// - Configure AWS credentials using aws configure
// - Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
// - Use AWS SSO authentication
// - Configure Bedrock API keys
// - Check IAM permissions for Bedrock access
```

**Key Benefits:**
- ✅ **6 Authentication Methods**: CLI, Environment Variables, SSO, API Keys, Role Assumption, Auto-detection
- ✅ **Real Permission Validation**: Tests actual bedrock:InvokeModel and bedrock:InvokeModelWithResponseStream permissions
- ✅ **AWS STS Integration**: Identity verification with ARN, User ID, and Account details
- ✅ **Comprehensive Error Handling**: Specific error types with actionable troubleshooting guidance
- ✅ **Universal Validator**: Single interface for validating both Anthropic and Bedrock authentication
- ✅ **Environment Documentation**: Complete .env.example with security best practices
- ✅ **Enterprise Support**: SSO, role assumption, and multi-account scenarios
- ✅ **TypeScript Safety**: Full type definitions for all authentication configurations
- ✅ **Dynamic Configuration**: Runtime authentication method switching and validation
- ✅ **Production Ready**: Security-first design with comprehensive AWS integration patterns

**Technical Implementation:**
- **BedrockAuth Class**: Comprehensive authentication with 6 methods and permission validation
- **AuthValidator Class**: Universal authentication validator for multi-provider scenarios  
- **Enhanced BedrockProvider**: Integrated with new authentication system for seamless provider switching
- **AWS SDK Integration**: Uses @aws-sdk/credential-providers and @aws-sdk/client-sts for robust AWS integration
- **Permission Testing**: Real API calls to validate bedrock:InvokeModel and bedrock:InvokeModelWithResponseStream access
- **Error Classification**: Specific error types (AccessDenied, UnrecognizedClient, ThrottlingException) with targeted guidance

### Configuration Schema for Provider Selection (Latest Feature)

The Moments application now includes **enhanced configuration management** supporting multiple AI model providers through a comprehensive configuration schema, enabling seamless switching between Anthropic and Amazon Bedrock providers with zero code changes.

#### Testing the Configuration Schema

**1. Configuration Structure Verification**
```yaml
# config.yml - Model provider configuration
model_provider:
  type: "anthropic" # or "bedrock"
  
  # Anthropic API configuration
  anthropic:
    api_key_env: "ANTHROPIC_API_KEY"
    base_url: "https://api.anthropic.com"
    
  # Amazon Bedrock configuration  
  bedrock:
    aws_region: "us-east-1"
    aws_profile: "default"
    use_bedrock_api_key: false
    inference_profile: null
    
  # Model mapping between logical names and provider-specific IDs
  model_mapping:
    sonnet:
      anthropic: "claude-3-5-sonnet-20241022"
      bedrock: "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
    haiku:
      anthropic: "claude-3-5-haiku-20241022"
      bedrock: "us.anthropic.claude-3-5-haiku-20241022-v1:0"
    opus:
      anthropic: "claude-3-opus-20240229"
      bedrock: "anthropic.claude-3-opus-20240229-v1:0"
```

**2. TypeScript Configuration Testing**
```typescript
// Access provider configuration with full type safety
import { loadConfigClient, getModelProviderConfig } from '@/lib/config-loader.client'

const config = await loadConfigClient()
const providerConfig = getModelProviderConfig(config)

// Type-safe access to provider settings
const providerType: 'anthropic' | 'bedrock' = providerConfig?.type || 'anthropic'
const awsRegion: string = providerConfig?.bedrock.aws_region || 'us-east-1'
const apiKeyEnv: string = providerConfig?.anthropic.api_key_env || 'ANTHROPIC_API_KEY'

// Model mapping with automatic provider selection
const sonnetModel = providerConfig?.model_mapping.sonnet[providerType]
console.log('Sonnet model ID:', sonnetModel)
```

**3. Configuration Loading Validation**
```bash
# Test YAML configuration loading
node -e "
const fs = require('fs');
const yaml = require('js-yaml');
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'));
console.log('Provider type:', config.model_provider?.type);
console.log('AWS region:', config.model_provider?.bedrock?.aws_region);
console.log('Model mapping available:', !!config.model_provider?.model_mapping);
"

# Expected output:
# Provider type: anthropic
# AWS region: us-east-1  
# Model mapping available: true
```

**4. API Configuration Access**
```typescript
// Test configuration API endpoint
fetch('/api/config')
  .then(res => res.json())
  .then(config => {
    console.log('Model provider loaded:', config.model_provider?.type)
    console.log('Bedrock config:', config.model_provider?.bedrock)
    console.log('Model mapping:', config.model_provider?.model_mapping)
  })
```

**5. Local Override Testing**
```yaml
# config.local.yml - Override for local development
model_provider:
  type: "bedrock"
  bedrock:
    aws_region: "us-west-2"
    aws_profile: "development"
    use_bedrock_api_key: true
    inference_profile: "us.anthropic.claude-3-5-sonnet-20241022-v1:0"
```

**Key Benefits:**
- ✅ **Unified Configuration**: Single source of truth for all provider settings
- ✅ **Type Safety**: Complete TypeScript interfaces with compile-time validation
- ✅ **Zero Code Changes**: Switch providers through configuration only
- ✅ **Backward Compatibility**: Existing configurations continue to work
- ✅ **Local Overrides**: config.local.yml for environment-specific settings
- ✅ **Model Mapping**: Logical model names automatically resolve to provider-specific IDs
- ✅ **Environment Variables**: Support for various authentication methods
- ✅ **Deep Merge**: Configuration sections intelligently combined
- ✅ **Build Integration**: Automatic configuration validation during build process
- ✅ **API Exposure**: Configuration accessible via /api/config endpoint

**Technical Implementation:**
- **YAML Parsing**: Uses js-yaml library for robust configuration loading
- **TypeScript Safety**: Complete interfaces for all configuration sections
- **Default Fallbacks**: Comprehensive default configuration for missing files
- **Client/Server Support**: Both client-side and server-side configuration access
- **Helper Functions**: getModelProviderConfig() for easy provider access

### Model Provider Abstraction Layer (New Feature)

The Moments application now supports **multiple AI model providers** through a unified abstraction layer, enabling seamless switching between Anthropic's direct API and Amazon Bedrock.

#### Testing the Provider Abstraction

**1. Provider Interface Testing**
```typescript
// Example: Using the provider factory
import { ModelProviderFactory } from '@/lib/model-providers/provider-factory'

// Initialize with Anthropic (default for development)
ModelProviderFactory.initialize({
  type: 'anthropic',
  anthropic: {
    apiKeyEnv: 'ANTHROPIC_API_KEY'
  }
})

// Or initialize with Bedrock (for production)
ModelProviderFactory.initialize({
  type: 'bedrock',
  bedrock: {
    region: 'us-east-1',
    useBedrockApiKey: true
  }
})

// Get provider and make requests
const provider = ModelProviderFactory.getPrimaryProvider()
const response = await provider.sendRequest({
  messages: [{ role: 'user', content: 'Analyze this moment' }],
  model: 'sonnet', // Logical name, auto-mapped to provider-specific ID
  maxTokens: 4000
})
```

**2. Testing Provider Switching**
- Set `ANTHROPIC_API_KEY` in `.env.local` for Anthropic provider
- Or configure AWS credentials for Bedrock provider
- The system automatically detects available credentials

**3. Health Check & Fallback**
```typescript
// Test provider health
const health = await provider.healthCheck()
console.log('Provider healthy:', health.isHealthy)

// Automatic fallback configuration
ModelProviderFactory.initialize({
  type: 'bedrock',
  fallbackProvider: 'anthropic',
  autoFallback: true
})
```

**4. Cost Tracking**
```typescript
// Estimate costs for both providers
const cost = provider.estimateCost(1000, 500, 'sonnet')
console.log('Estimated cost:', cost)
```

**Key Benefits:**
- ✅ **Zero code changes** required when switching providers
- ✅ **Automatic model ID mapping** between providers
- ✅ **Built-in error handling** and retry logic
- ✅ **Cost estimation** for budget management
- ✅ **Health monitoring** with automatic failover
- ✅ **Support for streaming** responses

### Temporal Analysis Dashboard (Latest Feature)

The Moments application now includes a **comprehensive Temporal Analysis Dashboard** that transforms static moment data into dynamic temporal intelligence, providing deep insights into AI industry activity patterns, trend analysis, and predictive analytics.

#### Testing the Temporal Analysis Dashboard

**1. Accessing Temporal Analysis**
- Navigate to **Dashboard** tab in the main navigation
- Switch analysis depth to **"Operational"** using the top-right controls
- The Temporal Analysis component appears as the third visualization panel

**2. View Mode Testing**
```typescript
// Available visualization modes:
const viewModes = [
  'timeline',    // Area chart with multi-layer visualization
  'density',     // Bar chart showing event concentration
  'calendar',    // Calendar heatmap (placeholder - coming soon)
  'streamgraph'  // Streamgraph visualization (placeholder - coming soon)
]
```

**3. Interactive Controls Evaluation**

**Time Granularity Controls:**
- **Day**: Aggregate moments by daily intervals
- **Week**: Weekly aggregation with start-of-week alignment
- **Month**: Monthly patterns and seasonal analysis

**Time Range Selection:**
- **7d**: Recent activity analysis
- **30d**: Monthly trends and patterns
- **90d**: Quarterly business cycles
- **1y**: Annual seasonality detection
- **All**: Complete historical analysis

**Layer Toggle Testing:**
- **Events Layer**: Toggle moment count visualization on/off
- **Impact Layer**: Show/hide high/medium/low impact distributions
- **Trends Layer**: Display average impact trend line overlay
- **Annotations Layer**: Significant event markers and reference lines

**4. Advanced Features Evaluation**

**Event Density Mapping:**
```javascript
// Density calculation: moments per day within intervals
const density = momentCount / intervalDays
// Visualization: Interactive bar charts with hover details
```

**Intelligent Event Annotations:**
- **High Activity Detection**: Days with 5+ moments automatically annotated
- **Anomaly Detection**: Unusual density patterns (>2 moments/day) flagged
- **Impact Clusters**: 3+ high-impact moments grouped and highlighted
- **Color-coded Indicators**: Red (high impact), Yellow (medium), Green (low)

**Forecasting & Trend Analysis:**
```typescript
// Basic trend detection
const momentum = currentCount - previousCount
const trend = momentum > 1 ? 'up' : momentum < -1 ? 'down' : 'stable'

// Simple linear regression for forecasting
const forecast = currentValue + averageGrowthRate
const confidence = Math.min(90, Math.max(10, 70 - Math.abs(momentum) * 5))
```

**5. Data Processing Intelligence**

**Temporal Data Pipeline:**
- Filters moments by selected time range using `isWithinInterval`
- Generates time intervals based on granularity (`eachDayOfInterval`, `eachWeekOfInterval`, etc.)
- Aggregates metrics: count, average impact, density, factor distributions
- Calculates derived statistics: high/medium/low impact breakdowns

**Real-time Statistics Dashboard:**
- **Total Events**: Sum of all moments in selected timeframe
- **Average Impact**: Mean impact score across all moments
- **Average Density**: Events per day average
- **Key Events**: Count of significant annotations

**6. Professional UI/UX Features**

**Custom Tooltips:**
```javascript
// Rich hover information
const tooltipData = {
  date: "Jan 15",
  momentCount: 8,
  averageImpact: 72,
  density: 2.3,
  highImpactCount: 3
}
```

**Zoom & Animation Controls:**
- **Zoom In/Out**: Scale visualization detail level (50% - 300%)
- **Reset**: Return to 100% zoom level
- **Play/Pause**: Animation controls for temporal progression
- **Refresh**: Manual data reload capabilities

**Significant Events List:**
- **Impact-coded Indicators**: Color-coded event importance
- **Expandable Details**: Event descriptions and affected moments
- **Date Badges**: Clear temporal reference points
- **Scrollable Interface**: Handle large numbers of annotations

**Key Benefits:**
- ✅ **Temporal Intelligence**: Transform static data into time-series insights
- ✅ **Multi-View Analysis**: Timeline, density, calendar, and streamgraph options
- ✅ **Intelligent Annotations**: Automated detection of significant events and anomalies
- ✅ **Configurable Granularity**: Day/week/month analysis with proper interval handling
- ✅ **Interactive Layers**: Toggle events, impact, trends, and annotations independently
- ✅ **Forecasting Capabilities**: Basic trend detection with confidence scoring
- ✅ **Professional UI**: Zoom, animation, and comprehensive control systems
- ✅ **Real-time Processing**: Live data integration with memoized calculations
- ✅ **Responsive Design**: Optimized for all screen sizes and analysis depths

**Technical Implementation:**
- **Data Processing**: Uses `date-fns` library for robust date manipulation
- **Visualization**: Recharts-based with custom components and responsive containers
- **Performance**: Memoized calculations and efficient time series aggregation
- **Integration**: Seamless integration with Zustand store and existing dashboard architecture

## ⚡ Performance Features

### Intelligent Processing
- **90% faster updates** through incremental processing
- **Parallel agent execution** with configurable concurrency
- **Real-time progress tracking** with live moment counting
- **Smart caching** with MD5 content change detection

### Scalability
- **File-system first** architecture for unlimited data growth
- **Efficient network visualization** handling 200+ entities
- **Responsive dashboard** adapting to analysis depth (Strategic/Tactical/Operational)
- **Memory optimization** with lazy loading and virtualization

## 🔐 Security & Privacy

### Local-First Design
- All sensitive processing happens locally
- No cloud dependencies for core functionality  
- Optional AI enhancement with your API keys
- Data export/backup for complete control

### Production Considerations
- **Development**: Client-side API keys for rapid iteration
- **Production**: Server-side API routes recommended (patterns included)
- **Migration Path**: Built-in patterns for secure deployment

## 📚 Documentation

### Comprehensive Specifications
- **[Architecture Specification](specs/stack.md)**: Complete technical architecture
- **[Design System](specs/design.md)**: UI/UX design principles  
- **[Dashboard Specification](specs/dashboard.md)**: Visualization design patterns
- **[Development Guide](CLAUDE.md)**: Comprehensive development instructions

### Blog Posts & Guides
- **[Business Intelligence Dashboard](blog/business-intelligence-dashboard-three-tier-analytics.md)**: Executive overview
- **[Factor Distribution Analytics](blog/factor-distribution-analytics-sunburst-heatmap.md)**: Advanced visualization guide
- **[Entity Relationship Networks](blog/entity-relationship-network-graph-ai-intelligence.md)**: Network analysis features
- **[Parallel AI Processing](blog/parallel-ai-processing-performance.md)**: Performance optimization

## 🤝 Contributing

We welcome contributions! Priority areas:

### High Priority
- **Server-side API migration** for production security
- **Additional data sources** (RSS feeds, APIs, databases)
- **Advanced correlation algorithms** for business intelligence
- **Export capabilities** (PDF reports, CSV data, dashboard snapshots)

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow existing patterns: TypeScript-first, feature-slice approach
4. Add tests and documentation
5. Submit pull request with detailed description

## 🚀 Roadmap

### Immediate (Next Release)
- [ ] **Dashboard Components**: Temporal analysis, trend detection, anomaly identification
- [ ] **Advanced Analytics**: Predictive insights, seasonality patterns, forecasting
- [ ] **Server-side Security**: Production API routes, authentication, authorization
- [ ] **Export Features**: PDF reports, data export, dashboard snapshots

### Short Term  
- [ ] **Advanced Visualizations**: AI landscape maps, technology evolution trees
- [ ] **Natural Language Queries**: Conversational analytics interface
- [ ] **Real-time Updates**: WebSocket integration, live dashboard updates
- [ ] **Collaboration Features**: Shared views, annotations, team workspaces

### Long Term
- [ ] **Enterprise Deployment**: Scalability, multi-tenancy, enterprise security
- [ ] **BI Platform Integration**: Tableau, PowerBI, Looker connectors
- [ ] **Mobile Application**: Touch-optimized interface, offline capabilities
- [ ] **Advanced AI**: Custom models, domain-specific agents, automated insights

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Anthropic](https://anthropic.com)** for Claude Code SDK and AI capabilities
- **[Vercel](https://vercel.com)** for Next.js framework and development tools  
- **[shadcn/ui](https://ui.shadcn.com)** for beautiful, accessible components
- **AI research community** for multi-agent system patterns and techniques

---

<div align="center">
  <strong>Built with ❤️ using Claude Code SDK</strong>
  <br>
  <em>Transform information overload into strategic advantage</em>
</div>