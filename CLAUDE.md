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

## Backlog Management

IMPORTANT: If user pastes an instruction in Claude Code that leads to code generation/changes and this instruction is not present in the backlog/ folder, after completing the code change, update the latest backlog file with a new item describing the instruction and change, marking it as complete

Project features and requirements are defined in the `backlog/` folder. Development should follow the backlog items in sequence to ensure systematic progress toward the project goals.
