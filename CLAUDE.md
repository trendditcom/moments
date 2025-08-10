# CLAUDE.md

## Project Overview

**Moments** is a local-first, agent-driven application that serves as a wrapper around the [Claude Code SDK](https://docs.anthropic.com/en/docs/claude-code/sdk). The application discovers and analyzes pivotal moments in the business of AI as they apply to:
- Top 100 most valued AI startups
- Fortune 100 enterprises managing AI disruption

Moments creates signal from noise by classifying and correlating these pivotal moments around:
- **Micro factors**: company, competition, partners, customers
- **Macro factors**: economic, geo-political, regulation, technology, environment, supply chain

**IMPORTANT**: Refer to `specs/stack.md` when building Moments app architecture and technology stack. This specification provides comprehensive architecture overview, technology stack details, sub-agent configurations, data models, and integration patterns following modern AI-first design principles.

**IMPORTANT**: Refer to `specs/design.md` when building Moments app user experience and interface design. This specification provides comprehensive UI/UX design guidelines, component architecture, design systems, accessibility standards, and data visualization patterns following modern AI-first design principles.

**IMPORTANT**: Refer to `specs/blueprint.md` when implementing the Moments ingestion-to-insight pipeline. This specification provides visual dataflow diagrams, processing stages, and system blueprint for data ingestion, preprocessing, entity extraction, factor classification, correlation, and impact scoring.

**IMPORTANT**: Refer to `specs/macro-factors.md` when implementing moment classification and factor analysis. This specification provides comprehensive tables of micro and macro factors with concrete pivotal moment examples for AI startups and enterprises, essential for training classification algorithms and correlation logic.

**IMPORTANT**: Refer to `specs/moments_architecture_doc.md` and `specs/moments_architecture.png` when understanding the complete system architecture and operational framework. These specifications provide detailed pipeline stages, data sources, processing components, and visual architecture diagrams for the full Moments application ecosystem.

**IMPORTANT**: Refer to `specs/tagging-correlation.md` when implementing content classification and moment correlation features. This specification provides the operational framework for detecting, classifying, correlating, and ranking pivotal moments through preprocessing, entity extraction, rule-based and ML classification, and correlation algorithms.

## Project Structure

- `src/` - Source code for the Moments application
- `tests/` - Test files for the application
- `companies/` - Content folders with markdown and images related to AI companies
- `technologies/` - Content folders with AI technology-related materials
- `backlog/` - Feature backlog definition files
- Claude Code specific folders and files (reusable via Claude Code SDK)

## Claude Code Documentation References

### Essential Claude Code Resources
- **[Overview](https://docs.anthropic.com/en/docs/claude-code/overview)** - Comprehensive introduction to Claude Code capabilities and features
- **[Quickstart](https://docs.anthropic.com/en/docs/claude-code/quickstart)** - Getting started guide for initial setup and basic usage
- **[Common Workflows](https://docs.anthropic.com/en/docs/claude-code/common-workflows)** - Best practices and typical development patterns
- **[Hooks Guide](https://docs.anthropic.com/en/docs/claude-code/hooks-guide)** - Custom hooks for automated workflows and integrations
- **[MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)** - Model Context Protocol for external service integrations
- **[Amazon Bedrock](https://docs.anthropic.com/en/docs/claude-code/amazon-bedrock)** - Enterprise deployment and scaling options

### Integration Notes for Moments
- Use **Common Workflows** patterns for AI startup data analysis pipelines
- Implement **Hooks** for automated content discovery from companies/ and technologies/ folders
- Leverage **MCP** for connecting to external AI research APIs and databases
- Consider **Amazon Bedrock** for enterprise-scale moment analysis and correlation

### Advanced Claude Code Resources
- **[Claude Code SDK](https://docs.anthropic.com/en/docs/claude-code/sdk)** - Building blocks for production-ready AI agents with TypeScript and Python bindings
- **[Sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)** - Specialized AI assistants with focused expertise and separate context windows
- **[Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** - Core principles and methodologies for AI agent development

## Development Principles

### Feature-Slice Approach
Each code generation follows a feature-slice approach, generating working, usable features. Every feature must be:
- **Complete and functional** - No mocks, hardcoded values, prototypes, or fake implementations
- **Production-ready** - Real implementations that provide actual value
- **Error-handled** - If a feature fails, create descriptive error messages and debug logs to help Claude Code iterate on fixes

### Code Generation Guidelines
- Always prefer editing existing files over creating new ones
- Never create files unless absolutely necessary for achieving the goal
- Never proactively create documentation files (*.md) or README files unless explicitly requested
- Follow existing code patterns and conventions in the codebase
- Integrate with the Claude Code SDK wherever possible

## Development Workflow

### Recommended Development Approach: Explore, Plan, Code, Commit
1. **Explore** - Read relevant files and understand the codebase context
2. **Plan** - Create detailed implementation plans using TodoWrite tool
3. **Code** - Implement solutions following feature-slice approach
4. **Commit** - Commit changes with descriptive messages

### Test-Driven Development for Moments
- Write tests first for AI data processing and analysis features
- Confirm tests fail initially to validate test coverage
- Implement code to pass tests incrementally
- Focus testing on pivotal moment detection and classification logic

## Headless Automation with Claude Code

### Claude Code SDK Integration
The Moments app leverages the Claude Code SDK for programmatic access to AI agent capabilities in headless mode, enabling:

#### Core SDK Capabilities
- **Headless automation** - Run Claude Code programmatically without interactive interface
- **Unix tool philosophy** - Integrate into bash pipelines and terminal workflows
- **CI automation** - Automated code review, testing, and feature development
- **Custom chatbot development** - Build AI-powered applications with Claude Code capabilities
- **Structured output** - JSON format responses for programmatic parsing and integration

#### SDK Usage Patterns for Moments
- **Content analysis pipelines** - Automated processing of companies/ and technologies/ content
- **Batch moment detection** - Process multiple sources simultaneously for pivotal moment identification
- **Automated classification** - Use structured JSON output for systematic moment categorization
- **Integration with MCP servers** - Connect to external AI research APIs and data sources

#### Permission and Tool Management
- Use `--allow-tools` flag to preconfigure Claude with necessary permissions
- Enable write, bash, and MCP tool access for comprehensive automation
- Implement permission prompting for dynamic tool access in production environments
- Session management with session IDs for context preservation across operations

## Vibe Coding Best Practices for Production

### Responsible Vibe Coding in Moments Development

#### Core Philosophy: "Forget the Code, Not the Product"
Following Eric Breck's production vibe coding principles, Moments development embraces:
- **Exponential advantage** - Task complexity that AI can handle doubles every 7 months
- **Product manager role** - Developers act as PMs for Claude, providing context and requirements
- **Verification over implementation** - Focus on validating outputs rather than reading all code

#### Safe Vibe Coding Implementation Strategy

**Focus on Leaf Nodes**
- Apply vibe coding primarily to **leaf node features** - components with no dependencies
- Avoid vibe coding for **core architecture** and **foundational systems**
- Acceptable tech debt in leaf nodes since they're unlikely to change or have dependencies

**Verification-First Approach**
- Design **easily verifiable inputs and outputs** for all vibe-coded features
- Implement **stress tests for stability** rather than code review for correctness
- Create **acceptance tests** that validate functionality without understanding implementation
- Use **end-to-end testing** to ensure system behavior matches expectations

#### Moments-Specific Vibe Coding Applications

**Content Analysis Features (Leaf Nodes)**
- AI startup data processing and moment extraction
- Content classification and correlation algorithms
- Report generation and visualization components
- Export functionality and data formatting

**Architecture Components (Human-Reviewed)**
- Core moment detection engine architecture
- Database schema and data model design
- API interfaces and integration patterns
- Authentication and security implementations

### Claude as Product Manager Pattern

#### Pre-Development Planning (15-20 minutes per feature)
1. **Codebase exploration** - Have Claude identify relevant files and patterns
2. **Requirements gathering** - Document clear specifications and constraints
3. **Implementation planning** - Create detailed plan with file changes and patterns to follow
4. **Execution** - Let Claude implement based on comprehensive planning artifact

#### Context Provision Strategies
- **Guided exploration** - "Tell me where authentication happens in this codebase"
- **Pattern identification** - "Show me similar features and the classes I should use"
- **Constraint documentation** - Specify performance, security, and integration requirements
- **Success criteria definition** - Define measurable outcomes for feature completion

## Effective Agent Development Principles

### Anthropic's Agent Development Methodology

#### Core Principles for Moments Agents
1. **Simplicity First** - Start with simplest solution, add complexity only when proven beneficial
2. **Clear Success Criteria** - Define measurable outcomes for each agent capability
3. **Transparency** - Maintain clear decision-making processes in AI moment analysis
4. **Composable Patterns** - Build using prompt chaining, routing, and orchestrator-worker models

#### Agent vs Workflow Distinction
- **Workflows** - Predefined paths for known processes (content ingestion, classification)
- **Agents** - Dynamic, self-directed systems for complex analysis and correlation
- **Moments Focus** - Use agents for nuanced moment detection, workflows for data processing

#### Sub-Agent Configuration for Moments

**Specialized Sub-Agents**
- **Content Analyzer** - Focused on extracting pivotal moments from raw content
- **Classification Agent** - Specialized in categorizing moments by micro/macro factors
- **Correlation Engine** - Expert in identifying relationships between moments
- **Report Generator** - Dedicated to creating human-readable analysis outputs

**Sub-Agent Best Practices**
- **Single-purpose design** - Each sub-agent has one clear responsibility
- **Detailed system prompts** - Comprehensive role definition and context
- **Limited tool access** - Minimal permissions for security and focus
- **Version control** - Track sub-agent configurations in project repository

#### Tool Development for Moments
- **Intuitive interfaces** - Design tools that are easy for AI agents to understand
- **Minimal formatting overhead** - Reduce complexity in tool responses
- **Extensive testing** - Validate tool behavior across different scenarios
- **Iterative refinement** - Continuously improve based on agent feedback

### SDK Implementation Patterns

#### Multi-turn Conversations for Complex Analysis
```python
# Example pattern for moment analysis workflow
with claude_session() as session:
    # Phase 1: Content discovery
    content = session.execute("Analyze companies/ folder for new content")
    
    # Phase 2: Moment extraction
    moments = session.execute(f"Extract pivotal moments from: {content}")
    
    # Phase 3: Classification and correlation
    analysis = session.execute(f"Classify and correlate moments: {moments}")
```

#### Error Handling and Session Management
- Implement robust error handling for failed analysis attempts
- Use session management for context preservation across long operations
- Leverage automatic prompt caching for repeated operations
- Implement rate limiting and respectful API usage

## Environment Setup

### Required Tools and Dependencies
- **Claude Code CLI** - Primary interface for AI-powered development
- **Claude Code SDK** - TypeScript/Python bindings for programmatic agent integration
- **Node.js/npm** - Web application development and build tooling
- **Git with GitHub CLI** - Version control with advanced automation features
- **VS Code** - Primary IDE with Claude Code extensions
- **Testing framework** - Jest/Vitest for JavaScript, pytest for Python SDK components

### Development Environment Configuration
- **Claude Code Setup** - Install CLI and configure API authentication
- **SDK Installation** - Add Claude Code SDK to project dependencies
- **Sub-agent Configuration** - Create specialized agents for content analysis and classification
- **VS Code Extensions** - Claude Code integration and development tools
- **Local Development Server** - Hot-reload environment for Moments web application
- **Content Monitoring** - Automated watching for companies/ and technologies/ folder changes
- **MCP Server Configuration** - External API integrations for AI research data

## Claude Code Optimization Techniques

### Effective Communication with Claude Code
- **Be specific** in feature requests and bug descriptions
- **Reference specific files** when requesting changes (e.g., `src/components/MomentAnalyzer.js`)
- **Provide visual references** like mockups or screenshots for UI features
- **Use /clear** command to maintain focused context during long sessions

### Leveraging Claude Code Tools
- Use **bash tools** for content processing and data analysis tasks
- Integrate **MCP servers** for external AI service connections
- Create **custom slash commands** for repeated Moments app workflows
- Use **GitHub CLI** for seamless repository management

### Advanced Development Patterns
- **Headless automation** - Use SDK for programmatic batch processing and CI integration
- **Parallel development** - Multiple Claude instances for concurrent feature development
- **Git worktrees with Claude** - Independent feature branches with separate Claude contexts
- **Vibe coding workflows** - 15-20 minute planning followed by autonomous implementation
- **Session management** - Context preservation across multi-step analysis operations
- **Sub-agent orchestration** - Specialized agents working together on complex problems
- **Unix pipeline integration** - Claude as a composable tool in data processing workflows

## Code Style and Standards

### Moments App Code Conventions
- Use semantic naming for AI analysis components and functions
- Implement proper error handling with descriptive messages for failed AI operations
- Follow modern JavaScript/TypeScript patterns for web development
- Maintain separation between UI components and AI processing logic

### Testing Guidelines
- Unit tests for moment classification algorithms
- Integration tests for Claude Code SDK interactions
- End-to-end tests for complete workflow from content discovery to analysis
- Performance tests for large-scale AI startup data processing

## Backlog Management

**IMPORTANT:** If user pastes an instruction in Claude Code that leads to code generation/changes and this instruction is not present in the backlog/ folder, after completing the code change, update the latest backlog file with a new item describing the instruction and change, marking it as complete

Project features and requirements are defined in the `backlog/` folder. Development should follow the backlog items in sequence to ensure systematic progress toward the project goals.

### Key Principle for Moments Development
Claude performs best when it has a clear target to iterate against—visual mockups for UI components, test cases for AI analysis features, or specific output examples for moment classification results.
