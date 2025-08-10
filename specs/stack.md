# Moments App Architecture & Technology Stack Specification

## Architecture Overview

Moments is a local-first, agent-driven application built as an intelligent wrapper around the Claude Code SDK. The architecture follows a modern AI-first design with specialized sub-agents, headless automation capabilities, and comprehensive content analysis pipelines.

**📋 Related Architecture Documentation**:
- See `moments_architecture_doc.md` and `moments_architecture.png` for complete system architecture and operational framework
- See `blueprint.md` for detailed ingestion-to-insight pipeline diagrams and dataflow specifications  
- See `tagging-correlation.md` for operational framework implementation details

### Core Architectural Principles

1. **Local-First Architecture**: All data processing and storage happens locally with optional cloud sync
2. **Agent-Driven Design**: Specialized AI sub-agents handle distinct responsibilities
3. **SDK-Native Integration**: Built fundamentally on Claude Code SDK capabilities
4. **Feature-Slice Development**: Each component provides complete, production-ready functionality
5. **No Mock/Prototype Policy**: All implementations are real, functional solutions

## System Architecture

### Layer 1: Presentation Layer
```
┌─────────────────────────────────────────────────────────────┐
│                   Web Application (React/Next.js)           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Dashboard     │ │   Content       │ │   Analysis      ││
│  │   Interface     │ │   Explorer      │ │   Viewer        ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Layer 2: Agent Orchestration Layer
```
┌─────────────────────────────────────────────────────────────┐
│                Claude Code SDK Integration Layer            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Content       │ │  Classification │ │   Correlation   ││
│  │   Analyzer      │ │     Agent       │ │     Engine      ││
│  │   Sub-Agent     │ │   Sub-Agent     │ │   Sub-Agent     ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │    Report       │ │   Workflow      │ │    Session      ││
│  │   Generator     │ │  Orchestrator   │ │   Manager       ││
│  │   Sub-Agent     │ │                 │ │                 ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Layer 3: Data Processing Layer
```
┌─────────────────────────────────────────────────────────────┐
│                    Data Processing Layer                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Content       │ │   Moment        │ │   Knowledge     ││
│  │   Ingestion     │ │   Extraction    │ │     Graph       ││
│  │   Pipeline      │ │   Engine        │ │   Builder       ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**📋 Pipeline Implementation References**:
- **Content Ingestion Pipeline**: See `blueprint.md` for complete dataflow diagrams from sources through ingestion gateway, preprocessing, entity extraction, factor classification, enrichment, correlation, and impact scoring
- **Moment Extraction Engine**: See `tagging-correlation.md` for operational framework including preprocessing (language detection, entity extraction), micro/macro classification using rule-based and ML approaches, and enrichment with knowledge graph integration
- **Factor Classification**: See `macro-factors.md` for comprehensive micro and macro factor definitions and pivotal moment examples essential for training classification algorithms

### Layer 4: Storage & External Integration Layer
```
┌─────────────────────────────────────────────────────────────┐
│                 Storage & Integration Layer                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Local SQLite  │ │   File System   │ │   MCP Server    ││
│  │   Database      │ │   Content Store │ │   Integration   ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Technologies

#### Core Framework
- **Next.js 14+** - React framework with App Router for server/client rendering
- **React 18+** - UI library with concurrent features and Suspense
- **TypeScript 5+** - Type-safe development with latest features

#### UI & Styling
- **Tailwind CSS 3+** - Utility-first CSS framework for rapid development
- **shadcn/ui** - High-quality component library built on Radix UI
- **Lucide React** - Consistent icon system
- **React Hook Form** - Performant forms with minimal re-renders
- **Zod** - TypeScript-first schema validation

#### State Management
- **Zustand** - Lightweight state management for client-side state
- **React Query/TanStack Query** - Server state management and caching
- **Context API** - Built-in React context for theme and user preferences

### Backend/API Technologies

#### Claude Code Integration
- **Claude Code SDK (TypeScript)** - Primary AI agent integration
- **Claude Code CLI** - Development tooling and automation
- **Sub-Agent Configuration** - Specialized AI agents with focused responsibilities

#### API & Services
- **Next.js API Routes** - Backend API endpoints with edge runtime support
- **tRPC** - End-to-end typesafe API layer
- **Prisma** - Database ORM with TypeScript integration
- **SQLite** - Local-first database with optional cloud sync

### AI & Analysis Technologies

#### Sub-Agent Specifications
```typescript
interface SubAgent {
  id: string;
  name: string;
  purpose: string;
  tools: string[];
  systemPrompt: string;
  contextWindow: number;
}

// Specialized Sub-Agents
const subAgents = {
  contentAnalyzer: {
    purpose: "Extract pivotal moments from raw content",
    tools: ["read", "grep", "parse"],
    specialization: "Content processing and moment identification"
  },
  classificationAgent: {
    purpose: "Categorize moments by micro/macro factors",
    tools: ["classify", "tag", "score"],
    specialization: "Factor-based classification system"
  },
  correlationEngine: {
    purpose: "Identify relationships between moments",
    tools: ["correlate", "graph", "analyze"],
    specialization: "Pattern recognition and relationship mapping"
  },
  reportGenerator: {
    purpose: "Create human-readable analysis outputs",
    tools: ["format", "visualize", "export"],
    specialization: "Report generation and data visualization"
  }
}
```

#### Content Processing Pipeline
- **Markdown Parser** - Process companies/ and technologies/ content
- **Image Analysis** - Extract insights from visual content
- **Natural Language Processing** - Moment extraction and classification
- **Knowledge Graph** - Relationship mapping between entities and moments

### Development & DevOps Technologies

#### Development Tools
- **Vite** - Fast build tool for development and production
- **ESLint + Prettier** - Code linting and formatting
- **Husky** - Git hooks for pre-commit validation
- **Jest/Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing for user workflows

#### Local Development
- **pnpm** - Fast, disk space efficient package manager
- **Docker Compose** - Local development environment
- **Claude Code CLI** - AI-assisted development workflows
- **GitHub CLI** - Repository and PR management

#### CI/CD & Automation
- **GitHub Actions** - Automated testing and deployment
- **Claude Code Headless** - Automated code review and feature development
- **Vercel** - Frontend deployment and edge functions
- **Railway/Fly.io** - Backend deployment options

### Storage & Data Technologies

#### Primary Storage
```sql
-- Core data models
CREATE TABLE moments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_path TEXT NOT NULL,
  moment_type TEXT NOT NULL, -- 'pivot', 'trend', 'disruption'
  classification TEXT NOT NULL, -- JSON: micro/macro factors
  confidence_score REAL NOT NULL,
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'startup', 'enterprise'
  valuation REAL,
  stage TEXT,
  content_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE correlations (
  id TEXT PRIMARY KEY,
  moment_id_1 TEXT REFERENCES moments(id),
  moment_id_2 TEXT REFERENCES moments(id),
  correlation_type TEXT NOT NULL,
  strength REAL NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Content Storage
- **File System** - Hierarchical storage for companies/ and technologies/ content
- **SQLite FTS5** - Full-text search capabilities
- **JSON Storage** - Flexible metadata and analysis results
- **Git LFS** - Large file support for images and documents

### Integration & External Services

#### MCP Server Integrations
```typescript
interface MCPIntegrations {
  aiResearchAPIs: {
    purpose: "External AI research databases",
    endpoints: ["crunchbase", "pitchbook", "cbinsights"],
    authentication: "api_key"
  },
  marketData: {
    purpose: "Real-time market and funding information",
    endpoints: ["yahoo_finance", "alpha_vantage", "sec_filings"],
    authentication: "oauth2"
  },
  newsAggregators: {
    purpose: "Latest AI industry news and announcements",
    endpoints: ["techcrunch_api", "reuters_api", "bloomberg_api"],
    authentication: "api_key"
  }
}
```

## Performance & Scalability

### Local-First Optimization
- **Incremental Processing** - Only analyze new/changed content
- **Caching Strategy** - Multi-layer caching for API responses and analysis results
- **Background Processing** - Non-blocking analysis using Web Workers
- **Lazy Loading** - On-demand loading of heavy content and visualizations

### Memory Management
- **Streaming Processing** - Handle large content files without memory overflow
- **Sub-Agent Context Management** - Efficient context switching and memory cleanup
- **Database Optimization** - Indexed queries and connection pooling
- **Asset Optimization** - Compressed images and code splitting

## Security & Data Privacy

### Local-First Security
- **No Cloud Dependencies** - All sensitive processing happens locally
- **Encrypted Storage** - Local database encryption for sensitive analysis
- **API Key Management** - Secure storage of external service credentials
- **Content Sandboxing** - Isolated processing environments for untrusted content

### Development Security
- **Dependency Scanning** - Automated vulnerability detection
- **Code Security Analysis** - Static analysis for security issues
- **Secrets Management** - No hardcoded keys or tokens
- **Input Validation** - Comprehensive validation for all user inputs

## Deployment Architecture

### Local Deployment (Primary)
```bash
# Development setup
pnpm install
pnpm dev

# Production build
pnpm build
pnpm start
```

### Cloud Deployment (Optional)
- **Vercel Edge Functions** - Stateless API endpoints
- **Cloudflare Workers** - Edge computing for content analysis
- **Supabase** - Optional cloud database sync
- **S3-Compatible Storage** - Backup and sync for content folders

## Development Workflow Integration

### Claude Code SDK Integration Points
```typescript
// Multi-turn conversation pattern
const analysisWorkflow = async (contentPath: string) => {
  const session = await claudeSDK.createSession();
  
  // Phase 1: Content discovery
  const content = await session.execute(`Analyze ${contentPath} for new content`);
  
  // Phase 2: Moment extraction
  const moments = await session.execute(`Extract pivotal moments from: ${content}`);
  
  // Phase 3: Classification and correlation
  const analysis = await session.execute(`Classify and correlate moments: ${moments}`);
  
  return analysis;
};

// Sub-agent coordination
const processWithSubAgents = async (content: Content) => {
  const results = await Promise.all([
    subAgents.contentAnalyzer.process(content),
    subAgents.classificationAgent.process(content),
    subAgents.correlationEngine.process(content)
  ]);
  
  return subAgents.reportGenerator.synthesize(results);
};
```

### Testing Strategy
- **Unit Tests** - Individual component and utility testing
- **Integration Tests** - Sub-agent coordination and SDK interaction
- **End-to-End Tests** - Complete user workflows from content discovery to analysis
- **Performance Tests** - Large-scale content processing and memory usage
- **AI Model Tests** - Validation of moment extraction accuracy and classification precision

This architecture specification provides a comprehensive foundation for building the Moments application with modern AI-first principles, robust local-first capabilities, and seamless Claude Code SDK integration.