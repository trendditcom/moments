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

#### 9. Development Process Evaluation
- **Location**: `backlog/001-backlog.md`
- **What to Check**:
  - Backlog items #1, #2, #3, #4, #5, #6, #7, and #8 are marked as complete [x]
  - Completion summaries are detailed and accurate for all completed items
  - Remaining backlog items are clearly defined
  - Item #5 completion summary covers system architecture, technology stack, sub-agent specifications, data models, security strategies, and integration patterns
  - Item #6 completion summary covers design philosophy, information architecture, component architecture, design systems, responsive design, interaction design, data visualization, performance considerations, and development implementation
  - Item #7 completion summary covers Next.js architecture, folder selection system, content processing pipeline, catalog hydration, persistent state management, responsive dashboard, error handling, and type-safe development
  - Item #8 completion summary covers config.yml creation, configuration loader module, API endpoint, content processor updates, folder selection enhancements, and local override support

#### 10. Project Structure Validation
- **What to Check**:
  - `companies/` and `technologies/` content folders exist
  - `backlog/` folder contains development roadmap
  - `specs/` folder contains stack.md architecture specification and design.md UI specification
  - `src/` folder contains complete Next.js application with proper structure
  - `config.yml` file exists with catalog and application configuration
  - `package.json` includes all required dependencies for the tech stack including js-yaml
  - Project follows Claude Code SDK integration patterns

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
- **Folder Selection**: Click "Select Folder" buttons to choose companies/ and technologies/ folders
- **Catalog Hydration**: Click "Hydrate Catalogs" to process selected folders and populate catalogs
- **Dashboard Navigation**: Use sidebar navigation to explore different sections
- **Catalog Browsing**: Switch between Companies and Technologies tabs to view processed content
- **Content Cards**: Examine detailed information for each company/technology including content items and metadata
- **Persistent Storage**: Refresh browser to verify folder selections are remembered across sessions
- **Configuration System**: Modify `config.yml` to change catalog names, descriptions, or file patterns
- **Local Overrides**: Create `config.local.yml` to test user-specific configuration without affecting version control

#### Available Content
- **Companies**: Glean (agent platform), Sierra AI (agent OS)
- **Technologies**: Claude Code (AI development), LLM Agents, LLM Prompting

## Getting Started

This project requires Claude Code SDK. Refer to `CLAUDE.md` for detailed setup and development instructions.

---

*Generated using Claude Code with feature-slice development approach - no mocks, prototypes, or fake implementations.*