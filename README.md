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