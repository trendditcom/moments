# CLAUDE.md

## Project Overview

**Moments** is a local-first, agent-driven application that serves as a wrapper around the [Claude Code SDK](https://docs.anthropic.com/en/docs/claude-code/sdk). The application discovers and analyzes pivotal moments in the business of AI as they apply to:
- Top 100 most valued AI startups
- Fortune 100 enterprises managing AI disruption

Moments creates signal from noise by classifying and correlating these pivotal moments around:
- **Micro factors**: company, competition, partners, customers
- **Macro factors**: economic, geo-political, regulation, technology, environment, supply chain

## Project Structure

- `src/` - Source code for the Moments application
- `tests/` - Test files for the application
- `companies/` - Content folders with markdown and images related to AI companies
- `technologies/` - Content folders with AI technology-related materials
- `backlog/` - Feature backlog definition files
- Claude Code specific folders and files (reusable via Claude Code SDK)

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

## Environment Setup

### Required Tools and Dependencies
- Node.js/npm for web application development
- Claude Code SDK for agent integration
- Git for version control with descriptive commit messages
- Testing framework (to be determined based on tech stack)

### Development Environment Configuration
- Configure VS Code or preferred IDE with relevant extensions
- Set up local development server for the Moments web application
- Configure content folder monitoring for companies/ and technologies/ data

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
- **Parallel development** using multiple Claude instances for complex features
- **Git worktrees** for independent feature development
- **Headless mode** for automated content analysis and classification
- **Thinking modes** for complex AI moment detection algorithms

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

IMPORTANT: If user pastes an instruction in Claude Code that leads to code generation/changes and this instruction is not present in the backlog/ folder, after completing the code change, update the latest backlog file with a new item describing the instruction and change, marking it as complete

Project features and requirements are defined in the `backlog/` folder. Development should follow the backlog items in sequence to ensure systematic progress toward the project goals.

### Key Principle for Moments Development
Claude performs best when it has a clear target to iterate against—visual mockups for UI components, test cases for AI analysis features, or specific output examples for moment classification results.
