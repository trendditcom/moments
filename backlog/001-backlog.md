# Backlog 001

1. [x] You are an expert engineer from Claude Code team at Anthropic. Create CLAUDE.md for this project using following context:
   - Project contains source code in src/ folder and tests in tests/ folder
   - The project has an app called Moments (in src/ folder)
   - Moments is a local-first, agent driven app and built as a wrapper of https://docs.anthropic.com/en/docs/claude-code/sdk
   - Project contains several content (markdown, images) related folders like companies/ and technologies/ which may be referred by the Moments app 
   - The project also contains Claude Code specific folders and files which are reusable by the Moments app via the Claude Code SDK
   - The project features backlog is defined in backlog/ folder
   - Each code generation for this project follows a feature-slice approach generating a working, usable feature
   - IMPORTANT: This project does not create any mock, hardcoded, prototype, or fake features or fallbacks
   - If feature fails then a descriptive error message and debug log is created to help Claude Code iterate on the fix
   - Moments app discovers pivotal moments in the business of AI as these apply to top 100 most valued AI startups and Fortune 100 enterprises managing disruption caused by AI
   - Moments app creates signal from noise by classifying and correlating these pivotal moments around micro factors (company, competition, partners, customer) and macro factors (economic, geo-political, regulation, technology, environment, supply chain, etc.)
   
   **Completion Summary**: Successfully created comprehensive CLAUDE.md file with project overview, structure documentation, development principles (feature-slice approach, no mocks/prototypes), code generation guidelines, and backlog management instructions. The file serves as the central project documentation and development guide for the Moments application.

2. [x] Understand the best practicies of using Claude Code at https://www.anthropic.com/engineering/claude-code-best-practices. Apply these best practices to CLAUDE.md based on the goals of Moments app
   
   **Completion Summary**: Successfully integrated comprehensive Claude Code best practices into CLAUDE.md including: 1) Development Workflow with Explore-Plan-Code-Commit approach and TDD guidelines, 2) Environment Setup with required tools and configuration, 3) Claude Code Optimization Techniques for effective communication and tool usage, 4) Advanced Development Patterns including parallel development and headless mode, 5) Code Style and Testing Guidelines specific to AI analysis features, and 6) Key development principle emphasizing clear targets for iteration. The enhanced documentation now provides detailed guidance for efficient Claude Code usage tailored to the Moments app's AI-driven development needs.
   
3. [x] Add these Claude Code documentation links as reference for this project and update CLAUDE.md with these:
   - https://docs.anthropic.com/en/docs/claude-code/overview
   - https://docs.anthropic.com/en/docs/claude-code/quickstart
   - https://docs.anthropic.com/en/docs/claude-code/common-workflows
   - https://docs.anthropic.com/en/docs/claude-code/hooks-guide
   - https://docs.anthropic.com/en/docs/claude-code/mcp
   - https://docs.anthropic.com/en/docs/claude-code/amazon-bedrock
   
   **Completion Summary**: Successfully added comprehensive Claude Code Documentation References section to CLAUDE.md including: 1) Essential Claude Code Resources with all 6 required documentation links (Overview, Quickstart, Common Workflows, Hooks Guide, MCP, Amazon Bedrock), 2) Integration Notes specific to Moments app goals including AI startup data analysis pipelines, automated content discovery hooks, external API connections via MCP, and enterprise scaling considerations. The documentation provides clear reference points for development teams and contextualizes each resource within the Moments application architecture.
   

4. [ ] Add these vibe coding, agents, and headless claude code best practices for this project and update CLAUDE.md with these:
   - @technologies/claude-code/headless-claude-code.md
   - https://docs.anthropic.com/en/docs/claude-code/sdk
   - https://docs.anthropic.com/en/docs/claude-code/sub-agents
   - @technologies/claude-code/vibe-coding-prod.md
   - https://www.anthropic.com/engineering/building-effective-agents

5. Based on the Moments app goals and documentation available to CLAUDE.md create an architecture and technology stack specification in specs/stack.md following best practices for modern AI first app architecture. Update CLAUDE.md with IMPORTANT prefix to refer to specs/stack.md when building Moments app architecture and stack.

6. Based on the Moments app goals, documentation available to CLAUDE.md, and specs/stack.md architecture and stack create a user interface design specification in specs/design.md following best practices for modern AI first app design. Update CLAUDE.md with IMPORTANT prefix to refer to specs/design.md when building Moments app user experience.

6. [ ] Scaffold a minimalist moments app which has an intuitive and pleasing user interface inspired by modern IDEs (like VS Code) or markdown document explorers (like Obsidian). It has a folder, file hierarchy browser on left, a markdown code and rendered HTML switcher/viewer in center, two intuitively placed tool bars - one which has tools to work on folders/files explorer and one which has tools to work on the document viewer. The app should read current folder contents (folder running the app) and filter which folders to show/ignore based on intuitive `config.yml` configuration. By default configure to ignore any code/tests folders like src/ and tests/ folders, and ignore any .prefixed folders like .claude, and only show content oriented folders like companies/ and technologies/ folders.
   
