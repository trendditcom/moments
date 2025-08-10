# Moments

A local-first, agent-driven application for discovering and analyzing pivotal moments in the AI business landscape.

## Project Status

The Moments application is currently in early development. The following features have been completed:

### ✅ Project Foundation (Backlog Item #1)
- **CLAUDE.md Configuration**: Comprehensive project documentation and development guidelines established
- **Development Principles**: Feature-slice approach with no mock/prototype implementations
- **Project Structure**: Defined folder structure for source code, tests, and content
- **Backlog Management**: System for tracking and managing development progress

### ✅ Claude Code Best Practices Integration (Backlog Item #2)
- **Development Workflow**: Explore-Plan-Code-Commit approach with TDD guidelines
- **Environment Setup**: Required tools and configuration for AI-driven development
- **Optimization Techniques**: Effective communication patterns and tool integration
- **Advanced Development Patterns**: Parallel development, headless mode, and thinking modes
- **Code Standards**: AI analysis-specific conventions and testing guidelines

### ✅ Claude Code Documentation References (Backlog Item #3)
- **Essential Resources**: Complete documentation links for Overview, Quickstart, Common Workflows, Hooks Guide, MCP, and Amazon Bedrock
- **Integration Notes**: Context-specific guidance for Moments app development
- **AI Startup Analysis**: Tailored workflow patterns for business intelligence gathering
- **Automation Hooks**: Content discovery and external API integration guidance

### ✅ Advanced Claude Code Best Practices (Backlog Item #4)
- **Headless Automation**: SDK integration patterns, Unix tool philosophy, CI automation capabilities, and structured output for programmatic parsing
- **Vibe Coding Best Practices**: Eric Breck's production methodology with "forget the code, not the product" philosophy, leaf node focus strategy, and verification-first approach
- **Agent Development Principles**: Anthropic's methodology with simplicity-first approach, agent vs workflow distinction, and specialized sub-agent configuration
- **SDK Implementation Patterns**: Multi-turn conversations, session management, and sub-agent orchestration for complex AI analysis workflows
- **Production-Ready Development**: Enhanced Environment Setup and Advanced Development Patterns for responsible AI-driven development

### ✅ Architecture & Technology Stack Specification (Backlog Item #5)
- **System Architecture**: 4-layer design with Presentation Layer (React/Next.js), Agent Orchestration Layer (Claude Code SDK), Data Processing Layer, and Storage & Integration Layer
- **Technology Stack**: Comprehensive stack covering Frontend (Next.js 14+, React 18+, TypeScript 5+, Tailwind CSS, shadcn/ui), Backend (Claude Code SDK, tRPC, Prisma, SQLite), AI Technologies (specialized sub-agents), and Development Tools
- **Sub-Agent Specifications**: Detailed TypeScript interfaces for Content Analyzer, Classification Agent, Correlation Engine, and Report Generator
- **Data Models**: SQLite schema for moments, companies, and correlations with full-text search capabilities
- **Security & Performance**: Local-first optimization, memory management, and data privacy strategies
- **Integration Patterns**: MCP server configurations and Claude Code SDK multi-turn conversation examples

### ✅ User Interface Design Specification (Backlog Item #6)
- **Design Philosophy**: Data-first, AI-native design with signal clarity focus and contextual intelligence
- **Information Architecture**: Primary user journeys for Moment Discovery, Correlation Exploration, and Company Deep Dive with hierarchical navigation
- **Component Architecture**: Specialized components including Moment Cards, Agent Status Indicators, Correlation Graphs, Factor Classification Panels, Timeline Visualizations, and Company Intelligence Dashboards
- **Design System**: Semantic color palettes for moment types and confidence levels, typography scales using Inter/JetBrains Mono, comprehensive spacing and layout systems
- **Responsive Design**: Mobile-first breakpoints with adaptive layouts for different screen sizes and devices
- **Accessibility Standards**: WCAG 2.1 AA compliance with inclusive design features and comprehensive screen reader support
- **Data Visualization**: Chart types for temporal/relational/comparative data with principles for data integrity and progressive disclosure
- **Performance Optimization**: Virtual scrolling, lazy loading, local-first interface optimizations for instant responsiveness

### ✅ Minimal Moments Application with Catalog Hydration (Backlog Item #7)
- **Next.js 14+ Architecture**: Full-stack application with TypeScript 5+, App Router, Tailwind CSS 3+, and shadcn/ui component library
- **Folder Selection System**: Intuitive UI for selecting companies/ and technologies/ folders with persistent storage
- **Content Processing Pipeline**: Automated analysis of folder structures, markdown content extraction, and structured data creation
- **Catalog Hydration**: Real-time processing of selected folders to populate Company and Technology catalogs
- **Persistent State Management**: Zustand store with localStorage persistence for folder selections and catalog data
- **Responsive Dashboard**: Modern interface with navigation, tabbed views, and detailed content cards
- **Error Handling**: Comprehensive error states and loading indicators for smooth user experience
- **Type-Safe Development**: Complete TypeScript interfaces for data models and state management

### ✅ Configuration System (Backlog Item #8)
- **config.yml File**: Structured YAML configuration for catalogs, app settings, moment classification factors, and sub-agent configurations
- **Configuration Loader**: TypeScript module with YAML parsing, local override support, and client-side configuration loading
- **Local Overrides**: Support for config.local.yml files for user-specific configurations without affecting version control
- **API Endpoint**: Server endpoint to serve configuration to client-side components
- **Dynamic Content Processing**: File patterns and source folders now configurable through config.yml
- **UI Configuration**: Catalog names, descriptions, and settings displayed from configuration
- **Deep Merge Support**: Sophisticated configuration merging for local overrides
- **Type-Safe Interfaces**: Comprehensive TypeScript definitions for all configuration structures

### ✅ Specs Documentation Integration (Backlog Item #9)
- **Comprehensive Specs Coverage**: Added IMPORTANT references to CLAUDE.md for all specification files in specs/ folder
- **Pipeline Blueprint Reference**: specs/blueprint.md for ingestion-to-insight pipeline implementation with visual dataflow diagrams
- **Factor Classification Reference**: specs/macro-factors.md for moment classification with micro/macro factor tables and pivotal moment examples
- **Architecture Documentation Reference**: specs/moments_architecture_doc.md and specs/moments_architecture.png for complete system architecture and operational framework
- **Tagging Correlation Reference**: specs/tagging-correlation.md for content classification and moment correlation implementation
- **Developer Guidance**: Clear IMPORTANT prefixes with descriptive guidance for when and how to use each specification
- **Documentation Completeness**: Full coverage of all architectural, design, and implementation specifications

### ✅ Specs Cross-Reference Updates (Backlog Item #10)
- **stack.md Integration**: Added comprehensive architecture documentation references and pipeline implementation references to Data Processing Layer
- **design.md Integration**: Added related design documentation references and specific component implementation guidance
- **Cross-Reference Network**: Created interconnected documentation system with blueprint.md, macro-factors.md, moments_architecture_doc.md, and tagging-correlation.md properly referenced
- **Developer Context**: Enhanced both stack.md and design.md with specific references to detailed implementation specifications
- **Architectural Coherence**: Unified documentation approach ensuring all specifications work together cohesively
- **Implementation Guidance**: Clear pathways from high-level design to detailed implementation through cross-referenced documentation
- **Complete Integration**: Both primary specification files now comprehensively reference all new detailed specifications

### ✅ AI-Powered Moment Detection & Classification System (Backlog Item #11)
- **Claude Code SDK Integration**: Full integration with @anthropic-ai/sdk for content analysis with structured prompting, JSON parsing, and error handling
- **Moment Extraction Pipeline**: Sophisticated content analysis system processing markdown from companies/ and technologies/ folders with comprehensive metadata including impact scores, entities, timelines, and classification factors
- **Factor Classification System**: FactorClassifier with 10 comprehensive factor definitions (4 micro: company, competition, partners, customers; 6 macro: economic, geo_political, regulation, technology, environment, supply_chain) based on specs/macro-factors.md
- **Sub-Agent Architecture**: SubAgentManager with 4 specialized agents (Content Analyzer, Classification Agent, Correlation Engine, Report Generator) using config.yml configurations with different model temperatures and capabilities
- **Enhanced UI Components**: MomentCard and MomentsView components with factor badges, confidence indicators, impact scoring, filtering/sorting, search functionality, and timeline visualization following specs/design.md patterns
- **Real-Time Analysis Integration**: Moments tab added to main navigation with processing indicators, error handling, and state management using Zustand store with persistence, enabling seamless transition between catalog browsing and AI-powered moment analysis
- **Production-Ready Capabilities**: Complete transformation from static content browser to AI business intelligence dashboard with moment discovery, classification, and correlation detection

### ✅ Anthropic SDK Browser Environment Fix (Backlog Item #12)
- **Browser Compatibility**: Resolved "browser-like environment" error by adding `dangerouslyAllowBrowser: true` to Anthropic SDK initialization in both MomentExtractor and SubAgentManager classes
- **Environment Variable Configuration**: Updated `.env.local` with `NEXT_PUBLIC_ANTHROPIC_API_KEY` for client-side access while maintaining server-side `ANTHROPIC_API_KEY` for future server-side implementations
- **Security Documentation**: Added comprehensive security warnings and JSDoc comments explaining the risks of client-side API key exposure with detailed TODO items for production server-side migration
- **Code Quality Improvements**: Fixed TypeScript compilation errors in factor-classifier.ts related to Map and Set iteration, ensuring clean builds with `npm run build` and `npm run type-check`
- **Development Ready**: Application now successfully loads API key from `.env.local`, initializes Anthropic SDK in browser environment, and enables full moment analysis functionality for development and testing
- **Production Roadmap**: Documented migration path to server-side API routes (`/api/moments/analyze`, `/api/sub-agents/*`) for secure production deployment without API key exposure

## User Evaluation Guide

### What You Can Evaluate Now

#### 1. Project Documentation Review
- **Location**: `CLAUDE.md`
- **What to Check**: 
  - Clear project overview and goals
  - Well-defined development principles
  - Proper integration with Claude Code SDK
  - Comprehensive project structure documentation

#### 2. Claude Code Best Practices Implementation
- **Location**: `CLAUDE.md` (sections: Development Workflow, Environment Setup, Claude Code Optimization Techniques)
- **What to Check**:
  - Explore-Plan-Code-Commit workflow is clearly documented
  - TDD approach specifically tailored for AI analysis features
  - Environment setup includes Claude Code SDK and required tools
  - Optimization techniques cover effective communication with Claude Code
  - Advanced development patterns for AI-driven applications
  - Code standards specific to Moments app AI functionality

#### 3. Claude Code Documentation References Implementation
- **Location**: `CLAUDE.md` (section: Claude Code Documentation References)
- **What to Check**:
  - All 6 essential Claude Code documentation links are properly formatted and accessible
  - Integration Notes provide Moments-specific context for each resource
  - Clear guidance for AI startup data analysis pipelines
  - Automated content discovery hooks are documented
  - External API integration via MCP is explained
  - Enterprise scaling considerations are addressed

#### 4. Advanced Claude Code Best Practices Implementation
- **Location**: `CLAUDE.md` (sections: Headless Automation, Vibe Coding Best Practices, Effective Agent Development Principles)
- **What to Check**:
  - **Headless Automation section** includes SDK integration patterns, Unix tool philosophy, CI automation capabilities, and structured output documentation
  - **Vibe Coding Best Practices section** implements Eric Breck's production methodology with proper leaf node strategy and verification-first approach
  - **Effective Agent Development section** covers Anthropic's methodology with clear agent vs workflow distinction and specialized sub-agent configurations
  - **Environment Setup** updated to include Claude Code CLI, SDK installation, sub-agent configuration, and MCP server setup
  - **Advanced Development Patterns** enhanced with headless automation, vibe coding workflows, session management, and sub-agent orchestration
  - **SDK Implementation Patterns** documented with multi-turn conversation examples and error handling strategies

#### 5. Architecture & Technology Stack Specification Implementation
- **Location**: `specs/stack.md` and `CLAUDE.md` (IMPORTANT reference)
- **What to Check**:
  - **Architecture Overview** clearly defines local-first, agent-driven design with Claude Code SDK integration
  - **4-Layer System Architecture** properly documented with ASCII diagrams for Presentation, Agent Orchestration, Data Processing, and Storage layers
  - **Technology Stack** comprehensively covers Frontend (Next.js 14+, React 18+, TypeScript 5+, Tailwind CSS, shadcn/ui), Backend (Claude Code SDK, tRPC, Prisma, SQLite), and AI Technologies
  - **Sub-Agent Specifications** include detailed TypeScript interfaces for Content Analyzer, Classification Agent, Correlation Engine, and Report Generator with clear purpose and tool definitions
  - **Data Models** provide complete SQLite schema with CREATE TABLE statements for moments, companies, and correlations
  - **Performance & Security** sections address local-first optimization, memory management, encrypted storage, and data privacy
  - **Integration Patterns** include MCP server configurations and Claude Code SDK multi-turn conversation code examples
  - **CLAUDE.md Reference** contains IMPORTANT prefix directing developers to specs/stack.md for architecture decisions

#### 6. User Interface Design Specification Implementation
- **Location**: `specs/design.md` and `CLAUDE.md` (IMPORTANT reference)
- **What to Check**:
  - **Design Philosophy** clearly defines data-first, AI-native approach with signal clarity focus and contextual intelligence
  - **Information Architecture** includes comprehensive user journey mapping for Moment Discovery, Correlation Exploration, and Company Deep Dive with hierarchical navigation structure
  - **Component Architecture** provides detailed specifications for specialized components: Moment Cards, Agent Status Indicators, Correlation Graphs, Factor Classification Panels, Timeline Visualizations, and Company Intelligence Dashboards
  - **Design System Specifications** include semantic color palettes for moment types and confidence levels, typography scales using Inter/JetBrains Mono, comprehensive spacing/layout systems, and component patterns
  - **Responsive Design Strategy** implements mobile-first breakpoints with adaptive layouts for mobile, tablet, and desktop experiences
  - **Interaction Design** covers purposeful animations, loading states, WCAG 2.1 AA accessibility compliance, and inclusive design features
  - **Data Visualization Guidelines** provide chart type recommendations for temporal/relational/comparative data with principles for data integrity and progressive disclosure
  - **Performance Considerations** include virtual scrolling, lazy loading, local-first interface optimizations, and rendering optimization strategies
  - **Development Implementation** provides component structure patterns, state management integration with Zustand/TanStack Query, and comprehensive testing strategy
  - **CLAUDE.md Reference** contains IMPORTANT prefix directing developers to specs/design.md for user experience and interface design decisions

#### 7. Minimal Moments Application Implementation
- **Location**: `src/` directory and `package.json`
- **What to Check**:
  - **Application Architecture** follows Next.js 14+ with App Router, TypeScript 5+, and specifications from specs/stack.md
  - **Package Dependencies** include all required technologies: Next.js, React 18+, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, and content processing libraries
  - **Folder Structure** properly organized with src/app/, src/components/, src/types/, src/store/, src/lib/ following modern React patterns
  - **Folder Selection Feature** provides intuitive interface for users to select companies/ and technologies/ folders with immediate feedback
  - **Content Processing Pipeline** successfully analyzes markdown files and images from companies/ (Glean, Sierra AI) and technologies/ (Claude Code, LLM Agents, LLM Prompting) folders
  - **Catalog Hydration** processes selected folders and creates structured Company and Technology entities with metadata and content items
  - **Persistent Storage** uses Zustand with localStorage middleware to remember folder selections across browser sessions
  - **Responsive Dashboard Interface** includes navigation sidebar, tabbed catalog views, and detailed content cards showing company/technology information
  - **Error Handling and Loading States** provide clear user feedback during folder processing and content hydration
  - **Type Safety** comprehensive TypeScript interfaces for Company, Technology, ContentItem, CatalogState, and CatalogActions
  - **UI Components** built with shadcn/ui including Card, Button, Badge components with proper styling and interactions

#### 8. Configuration System Implementation
- **Location**: `config.yml`, `src/lib/config-loader.ts`, `src/app/api/config/route.ts`
- **What to Check**:
  - **config.yml File** contains structured configuration for catalogs (companies/technologies), app settings, moment classification factors, and sub-agent configurations
  - **Configuration Loader** (`src/lib/config-loader.ts`) includes TypeScript interfaces for Config, CatalogConfig, AppConfig, FactorsConfig, and AgentConfig
  - **YAML Parsing** properly integrated using js-yaml library with error handling and fallback to default configuration
  - **Local Override Support** through config.local.yml with deep merge functionality for user-specific configurations
  - **API Endpoint** (`/api/config`) correctly serves configuration to client-side components
  - **Content Processor Integration** uses configured file patterns and source folders from config.yml
  - **Folder Selection Component** displays catalog names and descriptions from configuration
  - **Type Safety** comprehensive TypeScript definitions for all configuration structures
  - **config.local.yml** added to .gitignore for local overrides without version control conflicts

#### 9. Specs Documentation Integration Implementation
- **Location**: `CLAUDE.md` (IMPORTANT reference sections) and `specs/` folder
- **What to Check**:
  - **CLAUDE.md References** contains IMPORTANT prefixes for all specs/ files: blueprint.md, macro-factors.md, moments_architecture_doc.md, moments_architecture.png, and tagging-correlation.md
  - **specs/blueprint.md** contains visual dataflow diagrams and processing pipeline for ingestion-to-insight implementation
  - **specs/macro-factors.md** contains comprehensive tables of micro/macro factors and pivotal moment examples for classification algorithms
  - **specs/moments_architecture_doc.md** provides detailed architecture documentation with pipeline stages and operational framework
  - **specs/moments_architecture.png** provides visual architecture diagram referenced in documentation
  - **specs/tagging-correlation.md** contains operational framework for content classification, correlation, and ranking implementation
  - **Developer Guidance** each IMPORTANT reference includes clear description of when and how to use each specification
  - **Complete Coverage** all specification files in specs/ folder have corresponding IMPORTANT references in CLAUDE.md

#### 10. Specs Cross-Reference Updates Implementation
- **Location**: `specs/stack.md` and `specs/design.md`
- **What to Check**:
  - **specs/stack.md** contains "Related Architecture Documentation" section with references to moments_architecture_doc.md, moments_architecture.png, blueprint.md, and tagging-correlation.md
  - **Data Processing Layer** in stack.md includes detailed pipeline implementation references linking to blueprint.md (dataflow diagrams), tagging-correlation.md (operational framework), and macro-factors.md (classification algorithms)
  - **specs/design.md** contains "Related Design Documentation" section providing UI/UX context for all new specification files
  - **Moment Cards component** in design.md includes factor classification reference to macro-factors.md for comprehensive factor definitions
  - **Factor Classification Panel** in design.md includes implementation reference to macro-factors.md for detailed examples
  - **Cross-Reference Integration** both specifications provide clear pathways from high-level design to detailed implementation
  - **Developer Context** enhanced documentation ensures all new pipeline, architecture, and classification specifications are properly integrated

#### 11. AI-Powered Moment Detection & Classification System Implementation
- **Location**: `src/lib/moment-extractor.ts`, `src/lib/factor-classifier.ts`, `src/lib/sub-agents.ts`, `src/components/moment-card.tsx`, `src/components/moments-view.tsx`, `src/store/moments-store.ts`, `src/app/page.tsx`
- **What to Check**:
  - **Claude Code SDK Integration** (`src/lib/moment-extractor.ts`): MomentExtractor class with @anthropic-ai/sdk integration, structured prompting for AI analysis, JSON parsing with error handling, and comprehensive content analysis capabilities
  - **Moment Extraction Pipeline**: Sophisticated content processing that analyzes markdown files from companies/ and technologies/ folders, extracts pivotal moments using AI agents, and structures findings with impact scores, entities, timelines, and classification factors
  - **Factor Classification System** (`src/lib/factor-classifier.ts`): FactorClassifier with 10 comprehensive factor definitions including 4 micro factors (company, competition, partners, customers) and 6 macro factors (economic, geo_political, regulation, technology, environment, supply_chain) based on specs/macro-factors.md with keyword matching and automated classification
  - **Sub-Agent Architecture** (`src/lib/sub-agents.ts`): SubAgentManager implementing 4 specialized agents (Content Analyzer temp 0.3, Classification Agent temp 0.2, Correlation Engine temp 0.4, Report Generator temp 0.5) using config.yml configurations for enhanced analysis workflow
  - **Enhanced UI Components**: MomentCard component with factor badges, confidence indicators (high/medium/low with color coding), impact scoring (0-100 with visual indicators), entity displays (companies, technologies, people, locations), and timeline visualization; MomentsView component with advanced filtering/sorting, search functionality, statistics display, and responsive grid layout
  - **Real-Time Analysis Integration** (`src/app/page.tsx`): New "Moments" tab in main navigation with moment count and high-impact indicators, integrated analysis workflow with "Analyze Moments" button, processing indicators during AI analysis, comprehensive error handling with retry capabilities
  - **State Management** (`src/store/moments-store.ts`): Zustand store with persistence for moments, correlations, analysis state, and processing statistics with helper methods for filtering by source, factor, and impact level
  - **Production Features**: Complete transformation from static catalog browser to AI business intelligence dashboard capable of discovering, classifying, and analyzing pivotal moments in AI industry dynamics with factor analysis, correlation detection, and comprehensive business intelligence reporting

#### 12. Anthropic SDK Browser Environment Fix Implementation
- **Location**: `src/lib/moment-extractor.ts`, `src/lib/sub-agents.ts`, `.env.local`
- **What to Check**:
  - **Environment Variable Setup**: Verify `.env.local` contains both `NEXT_PUBLIC_ANTHROPIC_API_KEY` for client-side access and `ANTHROPIC_API_KEY` for future server-side use with comprehensive security warnings documented
  - **SDK Configuration**: Both `MomentExtractor` class and `SubAgentManager` class include `dangerouslyAllowBrowser: true` option in Anthropic SDK initialization with security warning comments
  - **API Key Loading**: Code references `process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY` for client-side access instead of `process.env.ANTHROPIC_API_KEY`
  - **Security Documentation**: Comprehensive JSDoc comments on constructors explaining security risks and future migration path to server-side API routes
  - **Code Quality**: TypeScript compilation errors in `factor-classifier.ts` resolved by replacing spread operators with `Array.from()` for Map and Set iteration
  - **Build Verification**: Application builds successfully with `npm run build` and passes type checking with `npm run type-check`
  - **Functional Testing**: Moments analysis now works in browser environment without "browser-like environment" error, API key properly loaded from `.env.local`
  - **Production Roadmap**: Clear documentation of recommended server-side migration using `/api/moments/analyze` and `/api/sub-agents/*` endpoints for secure production deployment

#### 13. Development Process Evaluation
- **Location**: `backlog/001-backlog.md`
- **What to Check**:
  - Backlog items #1, #2, #3, #4, #5, #6, #7, #8, #9, #10, #11, and #12 are marked as complete [x]
  - Completion summaries are detailed and accurate for all completed items
  - Remaining backlog items are clearly defined
  - Item #5 completion summary covers system architecture, technology stack, sub-agent specifications, data models, security strategies, and integration patterns
  - Item #6 completion summary covers design philosophy, information architecture, component architecture, design systems, responsive design, interaction design, data visualization, performance considerations, and development implementation
  - Item #7 completion summary covers Next.js architecture, folder selection system, content processing pipeline, catalog hydration, persistent state management, responsive dashboard, error handling, and type-safe development
  - Item #8 completion summary covers config.yml creation, configuration loader module, API endpoint, content processor updates, folder selection enhancements, and local override support
  - Item #9 completion summary covers specs folder review, IMPORTANT references addition to CLAUDE.md, pipeline blueprint reference, factor classification reference, architecture documentation reference, and tagging correlation reference
  - Item #10 completion summary covers specs/stack.md and specs/design.md updates, architecture documentation references, pipeline implementation references, cross-reference network creation, and comprehensive documentation integration
  - Item #11 completion summary covers Claude Code SDK integration, moment extraction pipeline, factor classification system, sub-agent architecture, enhanced UI components, and real-time analysis integration transforming the app into an AI business intelligence dashboard
  - Item #12 completion summary covers Anthropic SDK browser environment fix, environment variable configuration, security documentation, code quality improvements, and development-ready state with production migration roadmap

#### 14. Project Structure Validation
- **What to Check**:
  - `companies/` and `technologies/` content folders exist
  - `backlog/` folder contains development roadmap
  - `specs/` folder contains comprehensive specifications: stack.md, design.md, blueprint.md, macro-factors.md, moments_architecture_doc.md, moments_architecture.png, and tagging-correlation.md
  - `src/` folder contains complete Next.js application with proper structure
  - `config.yml` file exists with catalog and application configuration
  - `package.json` includes all required dependencies for the tech stack including @anthropic-ai/sdk, date-fns, and js-yaml
  - Project follows Claude Code SDK integration patterns
  - `src/lib/` contains moment-extractor.ts, factor-classifier.ts, and sub-agents.ts for AI functionality
  - `src/components/` contains moment-card.tsx and moments-view.tsx for AI-powered UI
  - `src/store/` contains moments-store.ts for AI analysis state management

### Next Development Phase

The next backlog items to be implemented include:
1. Additional features as defined in the backlog

### How to Test

The Moments application now includes executable features that can be tested:

#### Running the Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

#### Testing Features

##### Basic Catalog Features
- **Folder Selection**: Click "Select Folder" buttons to choose companies/ and technologies/ folders
- **Catalog Hydration**: Click "Hydrate Catalogs" to process selected folders and populate catalogs
- **Dashboard Navigation**: Use navigation tabs to explore Companies, Technologies, and Moments sections
- **Catalog Browsing**: Switch between Companies and Technologies tabs to view processed content
- **Content Cards**: Examine detailed information for each company/technology including content items and metadata
- **Persistent Storage**: Refresh browser to verify folder selections are remembered across sessions
- **Configuration System**: Modify `config.yml` to change catalog names, descriptions, or file patterns
- **Local Overrides**: Create `config.local.yml` to test user-specific configuration without affecting version control

##### AI-Powered Moments Features
- **Moments Analysis**: Click "Analyze Moments" button in the Moments tab to trigger AI-powered content analysis
- **Processing Indicators**: Observe real-time processing indicators during AI analysis with loading states and progress feedback
- **Moment Discovery**: View extracted pivotal moments with titles, descriptions, and detailed content analysis
- **Factor Classification**: Examine micro factors (company, competition, partners, customers) and macro factors (economic, geo_political, regulation, technology, environment, supply_chain) displayed as colored badges
- **Impact Scoring**: Review impact scores (0-100) with color-coded indicators (red for high impact 80+, orange for medium 60-79, yellow for low 40-59, green for minimal <40)
- **Confidence Levels**: Check confidence indicators (high/medium/low) with color coding for analysis reliability
- **Entity Extraction**: View extracted entities including companies, technologies, people, and locations from analyzed content
- **Timeline Information**: Examine temporal data with estimated dates, timeframes, and historical context
- **Advanced Filtering**: Use search functionality and filter by factors, confidence levels, source types, and impact scores
- **Sorting Options**: Sort moments by impact score, date, confidence level, or title with ascending/descending options
- **Statistics Dashboard**: Review moment statistics including total counts, high-impact moments, and distribution by confidence and source type
- **Error Handling**: Test error scenarios with retry capabilities and detailed error messages for failed AI operations
- **Persistent Analysis**: Verify that analyzed moments are saved and persist across browser sessions

#### Available Content
- **Companies**: Glean (agent platform), Sierra AI (agent OS)
- **Technologies**: Claude Code (AI development), LLM Agents, LLM Prompting

## Getting Started

This project requires Claude Code SDK and Anthropic API access for AI-powered moment analysis features.

### Prerequisites
- **Node.js** (18+ recommended)
- **Anthropic API Key** for AI moment analysis (add to `.env.local` file)
- **Claude Code CLI** (optional, for enhanced development workflow)

### Setup Instructions
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local` file:
   ```bash
   # WARNING: NEXT_PUBLIC_ prefix exposes API key to browser - for development only
   NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # Server-side API key (for future server-side API routes)
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```
4. Run the development server: `npm run dev`
5. Open browser to http://localhost:3000

### Environment Variables
- `NEXT_PUBLIC_ANTHROPIC_API_KEY` (required for client-side AI analysis - **development only**)
- `ANTHROPIC_API_KEY` (for future server-side API routes - **production ready**)
- Additional configuration can be set in `config.yml` or `config.local.yml`

### Security Notice
⚠️ **Important**: The current implementation uses `dangerouslyAllowBrowser: true` and client-side API keys for development convenience. For production deployment, migrate to server-side API routes to protect your API credentials.

Refer to `CLAUDE.md` for detailed setup and development instructions.

---

*Generated using Claude Code with feature-slice development approach - no mocks, prototypes, or fake implementations.*