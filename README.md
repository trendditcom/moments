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

#### 7. Development Process Evaluation
- **Location**: `backlog/001-backlog.md`
- **What to Check**:
  - Backlog items #1, #2, #3, #4, #5, and #6 are marked as complete [x]
  - Completion summaries are detailed and accurate for all completed items
  - Remaining backlog items are clearly defined
  - Item #5 completion summary covers system architecture, technology stack, sub-agent specifications, data models, security strategies, and integration patterns
  - Item #6 completion summary covers design philosophy, information architecture, component architecture, design systems, responsive design, interaction design, data visualization, performance considerations, and development implementation

#### 8. Project Structure Validation
- **What to Check**:
  - `companies/` and `technologies/` content folders exist
  - `backlog/` folder contains development roadmap
  - `specs/` folder contains stack.md architecture specification and design.md UI specification
  - Project follows Claude Code SDK integration patterns

### Next Development Phase

The next backlog items to be implemented include:
1. Minimal Moments app scaffolding with IDE-like interface (Backlog Item #7)
2. Additional features as defined in the backlog

### How to Test

Currently, there are no executable features to test. The completed work focuses on project foundation and documentation. Future releases will include:
- Web application interface
- Content folder browsing and filtering
- Markdown document viewing and editing
- AI business moment analysis capabilities

## Getting Started

This project requires Claude Code SDK. Refer to `CLAUDE.md` for detailed setup and development instructions.

---

*Generated using Claude Code with feature-slice development approach - no mocks, prototypes, or fake implementations.*