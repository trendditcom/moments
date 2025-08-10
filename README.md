# Moments

<div align="center">
  <img src="blog/images/moments.png" alt="Moments Dashboard" width="100%">
  
  **AI-Powered Business Intelligence for the AI Industry**
  
  Transform overwhelming AI industry information into clear, actionable insights with local-first intelligence and Claude Code SDK integration.

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![Claude Code SDK](https://img.shields.io/badge/Claude_Code_SDK-Latest-purple?style=flat)](https://docs.anthropic.com/en/docs/claude-code/sdk)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
</div>

## 🚀 What is Moments?

**Moments** is a local-first, agent-driven application that discovers and analyzes pivotal moments in the AI business landscape. Built as an intelligent wrapper around the [Claude Code SDK](https://docs.anthropic.com/en/docs/claude-code/sdk), Moments transforms raw business content into classified intelligence through specialized AI agents.

### Key Features

- **🤖 Multi-Agent AI Analysis** - Specialized sub-agents for content analysis, classification, and correlation discovery
- **📊 Business Intelligence Dashboard** - Real-time analysis of AI startups, enterprises, and market dynamics  
- **🔒 Local-First Architecture** - Your data stays on your systems with optional AI enhancement
- **⚡ Real-Time Processing** - Live progress tracking and transparent AI agent activities
- **🎯 Factor Classification** - Automatic categorization by micro/macro business factors
- **🔗 Correlation Discovery** - AI-powered relationship mapping between market events

<div align="center">
  <img src="blog/images/companies.png" alt="Company Analysis" width="45%">
  <img src="blog/images/filters.png" alt="Smart Filtering" width="45%">
</div>

## 🏗️ Architecture & Technology

Moments showcases modern AI-first application architecture with production-ready patterns:

### Multi-Agent System
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
- **Frontend**: Next.js 14+, React 18+, TypeScript 5+, Tailwind CSS, shadcn/ui
- **AI Integration**: Claude Code SDK, Anthropic API, multi-agent orchestration
- **State Management**: Zustand with localStorage persistence
- **Development**: ESLint, TypeScript, modern React patterns
- **Architecture**: 4-layer design (Presentation, Agent Orchestration, Data Processing, Storage)

## 🎯 Use Cases

### For Business Leaders
- **Investment Intelligence**: Track startup trajectories and acquisition targets
- **Competitive Analysis**: Monitor competitor moves 3-6 months before market impact
- **Strategic Planning**: Understand regulatory impacts on product roadmaps

### For Development Teams
- **Agent Orchestration**: Learn multi-agent AI application patterns
- **Claude Code SDK**: Explore production-ready AI integration techniques
- **TypeScript AI Apps**: Study type-safe AI development workflows

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

### Configuration

Create your `.env.local` file:

```env
# Required: Anthropic API key for AI analysis
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Custom configuration path
CONFIG_PATH=./config.yml
```

## 📖 Getting Started Guide

### 1. Automatic Catalog Loading

<img src="blog/images/companies.png" alt="Content Loading" width="400" align="right">

- **Zero Configuration**: Catalogs load automatically from `companies/` and `technologies/` folders
- **Immediate Start**: App begins loading content on first visit
- **Status Feedback**: Watch loading progress in the header status bar
- **Persistent Storage**: Loaded content persists across browser sessions
- **Manual Refresh**: Use the refresh button if you add new content

### 2. Analyze Moments

Switch to the **Moments** tab and click **"Analyze Moments"** to:
- Process content through AI agents
- Extract pivotal business moments
- Classify by micro/macro factors
- Generate correlation insights

### 3. Explore Intelligence

Use the intelligent interface to:
- **Filter by factors**: Company, competition, regulation, technology
- **Sort by impact**: High-impact moments surface first
- **Search content**: Find specific companies or technologies
- **Track confidence**: Understand AI analysis reliability

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

### Real-Time Processing

<img src="blog/images/agents.png" alt="Agent Activity" width="300" align="right">

Monitor AI agent activities in real-time:
- **Content Analyzer**: Extracting moments from documents
- **Classification Agent**: Categorizing by business factors
- **Correlation Engine**: Discovering relationships
- **Progress Tracking**: Step-by-step analysis visibility

## 🧪 User Evaluation Guide

### Testing Enhanced Interactivity Features

The latest release includes comprehensive interactive features. Here's how to evaluate and test them:

#### 1. Enhanced Moment Cards

**What to Test:**
- **Expandable Information Display**: Click "Show More" on any moment card to reveal complete AI analysis
- **Classification Reasoning**: Expanded view shows why AI classified the moment with specific factors
- **Impact Analysis**: Detailed reasoning for impact scores (0-100 scale)
- **Content Extracts**: Full text snippets that triggered moment detection

**Evaluation Criteria:**
- ✅ Cards expand smoothly with additional information
- ✅ All agent response data is displayed (reasoning, impact analysis, content)
- ✅ "Show More/Less" buttons work correctly
- ✅ Information is well-organized and readable

#### 2. Interactive Keyword Filtering

**What to Test:**
- **Clickable Keywords**: Click any keyword badge in moment cards
- **Search Integration**: Keywords should automatically add to search filter
- **Visual Feedback**: Keywords show filter icons and hover states
- **Multiple Keywords**: Add multiple keywords to build complex filters

**How to Test:**
1. Navigate to Moments tab and run analysis
2. Find moment cards with keywords in "Key Terms" section
3. Click different keywords and observe search field updates
4. Combine multiple keyword clicks for advanced filtering

**Evaluation Criteria:**
- ✅ Keywords are visually distinguishable as clickable elements
- ✅ Clicking keywords adds them to search immediately
- ✅ Search results update in real-time
- ✅ Multiple keywords can be combined effectively

#### 3. Entity Navigation System

**What to Test:**
- **Company Links**: Click company names in moment cards
- **Technology Links**: Click technology names in moment cards  
- **Catalog Matching**: Test with both existing and non-existing entities
- **Navigation Flow**: Verify smooth transitions to detail views

**Test Scenarios:**
1. **Existing Entities**: Click "Glean" or "Sierra AI" in moments (should navigate to company details)
2. **Technology Entities**: Click "Claude Code" or "LLM Agents" (should navigate to technology details)
3. **Non-existing Entities**: Click entities not in catalogs (should show appropriate handling)

**Evaluation Criteria:**
- ✅ Company and technology names show external link icons
- ✅ Clicking navigates to appropriate catalog detail views
- ✅ Non-existing entities are handled gracefully
- ✅ Navigation maintains proper context

#### 4. Catalog Detail Views

**What to Test:**
- **Three-Tab Interface**: Overview, Content, Moments tabs
- **AI Insights**: Statistics and intelligence derived from related moments
- **Content Display**: File listings with previews and metadata
- **Related Moments**: Moments connected to the selected catalog item

**Test Navigation:**
1. Go to Companies or Technologies tab
2. Click any catalog card to open detail view
3. Navigate through all three tabs (Overview, Content, Moments)
4. Test "Back" button functionality
5. Try clicking entities within related moments for nested navigation

**Evaluation Criteria:**
- ✅ Detail view opens with proper catalog item information
- ✅ All three tabs load correctly with appropriate content
- ✅ AI insights show meaningful statistics and factors
- ✅ Related moments are accurately identified and displayed
- ✅ Navigation between catalog and detail views works smoothly

#### 5. Clickable Catalog Cards

**What to Test:**
- **Visual Feedback**: Hover states and click animations
- **Detail Navigation**: Cards open appropriate detail views
- **Consistent Behavior**: Both company and technology cards work identically

**Evaluation Steps:**
1. Navigate to Companies tab
2. Hover over catalog cards (should show visual feedback)
3. Click cards to open detail views
4. Repeat with Technologies tab
5. Test navigation back to catalog views

**Evaluation Criteria:**
- ✅ Cards show clear hover states indicating they're clickable
- ✅ Clicking opens detail view for the correct catalog item
- ✅ Consistent behavior across different catalog types
- ✅ Smooth visual transitions

#### 6. End-to-End Workflow Testing

**Complete User Journey:**
1. **Start**: Load catalogs using folder selection
2. **Analyze**: Run moment analysis and wait for completion
3. **Explore Moments**: Use filters, search, and sorting
4. **Keyword Interaction**: Click keywords to filter content
5. **Entity Navigation**: Click companies/technologies in moments
6. **Detail Exploration**: Navigate through catalog detail tabs
7. **Correlation Discovery**: Find related moments in detail views

**Success Indicators:**
- ✅ Seamless flow from catalog loading to detailed analysis
- ✅ All interactive elements respond appropriately
- ✅ Information remains consistent across different views
- ✅ Navigation context is preserved throughout the journey

### Performance Evaluation

**Expected Behavior:**
- Moment cards expand/collapse smoothly (< 300ms animation)
- Entity clicks navigate immediately (< 100ms response)
- Detail views load efficiently (< 500ms for local data)
- Search filtering updates in real-time (< 50ms)

### Troubleshooting Common Issues

**Keywords Not Clickable:**
- Verify moments were analyzed successfully
- Check that moment cards have expanded details visible
- Ensure keywords array is populated in moment data

**Entity Navigation Not Working:**
- Confirm catalog data is loaded properly
- Check browser console for navigation errors
- Verify entity names match catalog entries

**Detail Views Not Loading:**
- Ensure catalog items have proper data structure
- Check that moments store contains analyzed moments
- Verify navigation state management

### Reporting Issues

When testing, please note:
- Browser and version used
- Specific user actions that caused issues
- Console error messages (if any)
- Expected vs actual behavior

This enhanced interactivity transforms Moments from a static dashboard into a fully interactive business intelligence platform for AI industry analysis.

### Testing Data Persistence & Recovery Features

The latest update includes robust data persistence and recovery mechanisms to ensure your catalogs and moments data remain available across browser sessions.

#### 7. Storage Management System

**What to Test:**
- **Storage Health Monitor**: Check available storage space and health status
- **Backup/Restore**: Export and import complete application state
- **Auto-Recovery**: Automatic data restoration on app startup
- **Storage Inspection**: Debug and monitor stored data

**How to Access:**
1. Click the settings/cog icon in the header (next to folder selection)
2. Storage Manager panel expands with complete storage controls

**Storage Manager Features:**
- **Health Status**: Green checkmark = healthy, Red warning = issues
- **Space Usage**: Shows KB used and percentage of available storage
- **Current State**: Displays loaded companies, technologies, and moments counts
- **Backup Button**: Downloads complete state as JSON file
- **Restore Button**: Upload previous backup to restore state
- **Inspect Button**: Logs detailed storage info to browser console
- **Check Health**: Re-runs storage diagnostics
- **Refresh Page**: Force reload with fresh hydration
- **Clear All**: Remove all stored data (with confirmation)

**Evaluation Criteria:**
- ✅ Storage health shows accurate status and metrics
- ✅ Backup creates downloadable JSON with timestamp
- ✅ Restore successfully loads previous state from backup
- ✅ Storage persists after closing/reopening browser
- ✅ Auto-recovery status badge shows in header

#### 8. Data Persistence Testing

**Test Scenarios:**

**Scenario 1: Basic Persistence**
1. Load catalogs and generate moments
2. Note the counts (e.g., 3 companies, 3 technologies, 20 moments)
3. Close browser completely
4. Reopen browser and navigate to app
5. Verify all data is restored automatically

**Scenario 2: Extended Session**
1. Load data and generate moments
2. Leave browser open for 8+ hours or overnight
3. Return to app and verify data still present
4. If missing, check auto-recovery status in header

**Scenario 3: Backup and Restore**
1. Create full dataset with catalogs and moments
2. Click Storage Manager → Backup
3. Save the JSON file
4. Clear all data using "Clear All" button
5. Restore from backup file
6. Verify complete restoration

**Scenario 4: Auto-Recovery**
1. Load catalogs (but don't generate moments)
2. Close browser
3. Reopen and watch for recovery status badge
4. Should show "Rehydrating catalogs..." then "Recovery complete"
5. Verify catalogs are restored

**Expected Behavior:**
- Data persists indefinitely until manually cleared
- Auto-recovery runs within 500ms of app load
- Recovery status shows in header during process
- Corrupted data is automatically cleared and reported
- Version tracking enables future migrations

#### 9. Storage Debugging

**Console Commands for Debugging:**

Open browser console (F12) and run:
```javascript
// Inspect all stored data
localStorage.getItem('moments-catalog-store')
localStorage.getItem('moments-store')

// Check storage size
new Blob(Object.values(localStorage)).size
```

**Common Issues and Solutions:**

**Issue: Data disappears after session**
- Check browser privacy settings (disable "Clear on exit")
- Verify localStorage is not blocked
- Check Storage Manager health status
- Try backup/restore as workaround

**Issue: Auto-recovery not working**
- Check recovery status badge in header
- Open console for detailed recovery logs
- Verify folder paths still exist
- Use Storage Manager to manually reload

**Issue: Storage quota exceeded**
- Check Storage Manager for space usage
- Clear old moments before generating new ones
- Use backup to save important data externally
- Consider using multiple browser profiles

**Performance Metrics:**
- Storage operations: < 100ms
- Auto-recovery: < 2s on app startup
- Backup/restore: < 500ms for typical datasets
- Health check: < 50ms response time

### Testing Automatic Catalog Loading

The latest update implements zero-configuration catalog loading that automatically hydrates from config.yml on app startup.

#### 10. Automatic Catalog Hydration

**What to Test:**
- **Zero Setup Experience**: App loads catalogs automatically on first visit
- **Configuration-Driven Loading**: Catalogs loaded from config.yml folder definitions
- **Real-Time Status**: Visual feedback during loading process
- **Error Handling**: Graceful handling of missing folders or configuration issues

**How It Works:**
1. On app startup, auto-hydration hook reads config.yml
2. Extracts folder paths: `./companies` and `./technologies`
3. Automatically processes content from these folders
4. Populates catalogs without user intervention

**Testing Scenarios:**

**Scenario 1: Fresh Installation**
1. Open app for the first time (or clear storage)
2. Observe automatic loading in header status
3. Should see "Loading configuration..." then "Loading catalogs..."
4. Catalogs populate automatically with companies and technologies

**Scenario 2: Configuration Changes**
1. Modify paths in config.yml
2. Refresh app or clear storage
3. Verify new paths are loaded automatically
4. Check catalog contents match new configuration

**Scenario 3: Missing Folders**
1. Temporarily rename companies/ or technologies/ folder
2. Refresh app
3. Should see error status with descriptive message
4. Restore folder and use refresh button to reload

**Visual Indicators:**
- **Catalog Status in Header**: Shows real-time loading progress
- **Company/Technology Badges**: Display item counts once loaded
- **Loading Animations**: Spinning icons during processing
- **Error States**: Red warning icons with error messages
- **Success States**: Green checkmarks when loaded successfully

**Evaluation Criteria:**
- ✅ App starts loading catalogs immediately without user action
- ✅ Status shows "Loading configuration..." then "Loading catalogs..."
- ✅ Header displays catalog counts once loading completes
- ✅ No manual folder selection required
- ✅ Error handling for missing folders or configuration issues
- ✅ Refresh button available for manual reloading

**Manual Refresh Testing:**
1. After catalogs are loaded, click refresh button in header
2. Should reload catalogs from configured folders
3. Observe loading states and updated content
4. Verify all existing functionality remains intact

**Configuration Integration:**
- Folder paths defined in config.yml (`./companies`, `./technologies`)
- Display names from config ("Companies", "Technologies")
- File patterns respected during content processing
- Easy configuration changes without code modifications

**Performance Expectations:**
- Auto-hydration starts within 100ms of app load
- Configuration loading: < 200ms
- Catalog processing: varies by content size
- UI feedback: immediate visual indicators
- Error detection: < 500ms response time

**Troubleshooting:**

**Issue: Catalogs not loading automatically**
- Check if companies/ and technologies/ folders exist
- Verify config.yml has correct folder paths
- Check browser console for configuration errors
- Try using refresh button manually

**Issue: Only partial catalog loading**
- Verify both folders have readable content
- Check file permissions on folders
- Look for specific folder processing errors
- Compare loaded counts with expected content

This automatic loading feature eliminates setup friction and provides immediate value to users while maintaining all advanced functionality including manual refresh, persistence, and recovery capabilities.

### Testing Improved Storage Manager

The latest update significantly improves the Storage Manager interface with better explanations, clearer actions, and enhanced user guidance.

#### 11. Enhanced Storage Manager Interface

**What to Test:**
- **Intuitive Action Organization**: Actions grouped into logical categories with clear descriptions
- **Storage Health Explanations**: Each metric includes helpful explanatory text
- **Improved Error Handling**: Better error messages with troubleshooting guidance
- **In-App Inspection Results**: Storage inspection shown directly in UI instead of console-only

**How to Access:**
1. Click the settings/cog icon in the header
2. Storage Manager panel expands with improved interface
3. Notice organized layout with Data Management, System Diagnostics, and Danger Zone sections

**Key Improvements to Evaluate:**

**Storage Health Section:**
- **Storage Status**: Overall health with color-coded badge (Healthy/Moderate Usage/High Usage/Unavailable)
- **Space Usage**: Shows actual KB/MB usage with explanatory text about browser capacity
- **Usage Percentage**: Color-coded percentage with warnings when approaching limits
- **Storage Keys**: Number of data items with explanation of what this means
- **Current Data**: Clear breakdown of companies, technologies, moments with descriptions

**Redesigned Storage Actions:**

**Data Management:**
- **Create Backup**: Clear description "Download a complete backup of your catalogs and moments data as a JSON file"
- **Restore Backup**: Explains it will "Upload a previous backup file to restore your data (will replace current data)"
- File validation with helpful error messages for invalid files

**System Diagnostics:**
- **Run Health Check**: "Refresh storage capacity and health information displayed above" (updates UI metrics)
- **Inspect Storage**: "View detailed storage contents and structure for troubleshooting" (shows results in collapsible panel)
- **Reload Application**: "Refresh the entire application to resolve display or loading issues" (renamed from "Refresh Page")

**Danger Zone:**
- **Clear All Data**: Shows item counts "Clear All Data (X items)" with detailed confirmation dialog

**Testing Scenarios:**

**Scenario 1: Understanding Storage Health**
1. Open Storage Manager
2. Review each metric in Storage Health section
3. Verify each metric has explanatory text below it
4. Check color coding matches usage levels (green=healthy, amber=warning, red=critical)

**Scenario 2: Action Clarity**
1. Review each action button
2. Verify each has descriptive text explaining what it does
3. Test that categories make logical sense (Data vs Diagnostics vs Danger)
4. Confirm button labels clearly indicate their function

**Scenario 3: Enhanced Inspection**
1. Click "Inspect Storage" button
2. Verify results appear in collapsible UI panel (not just console)
3. Check that explanation text helps users understand the data
4. Confirm console logging still works for technical users

**Scenario 4: Improved Error Handling**
1. Try restore with invalid file (non-JSON)
2. Verify helpful error message with specific guidance
3. Test backup creation and verify success messaging
4. Try operations with storage issues and check troubleshooting suggestions

**Scenario 5: Smart Confirmations**
1. Click "Clear All Data" with loaded catalogs
2. Verify confirmation shows specific counts (companies, technologies, moments)
3. Test "Reload Application" confirms about losing unsaved changes
4. Check that destructive operations require explicit confirmation

**Expected Benefits:**
- **Reduced Confusion**: Clear action descriptions eliminate guesswork
- **Better Error Resolution**: Specific troubleshooting guidance for common issues
- **Improved Accessibility**: In-app inspection results accessible to all users
- **Professional Feel**: Organized layout with proper visual hierarchy
- **Safer Operations**: Smart confirmations prevent accidental data loss

**Visual Design Improvements:**
- Organized sections with clear headers and icons
- Color-coded health indicators throughout
- Responsive grid layout for mobile compatibility
- Consistent visual feedback for all interactions
- Professional spacing and typography

**Performance Indicators:**
- All actions provide immediate visual feedback
- Loading states shown during health checks
- Smooth transitions and hover effects
- Clear success/error messaging with appropriate delays
- No confusing console-only operations

This redesigned Storage Manager transforms a technical diagnostic tool into an intuitive, user-friendly interface that clearly communicates what each action does, where results appear, and how to resolve issues when they occur.

### Testing Moment Detail Views

The latest update adds comprehensive detail views for individual moments, creating a unified navigation experience across all content types.

#### 12. Moment Detail Navigation System

**What to Test:**
- **Clickable Moment Cards**: Every moment card opens a dedicated detail view when clicked
- **Four-Tab Interface**: Overview, Related, Source, and Timeline tabs with specialized content
- **Advanced Correlation Analysis**: AI-powered discovery of related moments with similarity scoring
- **Complete Information Display**: All AI analysis data accessible through organized tabs

**How to Access:**
1. Navigate to Moments tab and ensure moments are analyzed
2. Click anywhere on a moment card (outside of existing interactive elements like keywords)
3. Moment detail view opens with comprehensive four-tab interface

**Detail Tabs to Evaluate:**

**Overview Tab:**
- **Factor Classification Display**: Complete micro/macro factor badges with color coding
- **Impact Analysis Visualization**: Impact score (0-100) with detailed AI reasoning
- **Entity Organization**: Companies, technologies, people, and locations in organized sections
- **Interactive Keywords**: Clickable keywords for filtering (inherited from main moments view)
- **Visual Hierarchy**: Professional layout with proper sections and visual indicators

**Related Tab:**
- **Intelligent Moment Correlation**: AI-powered similarity scoring based on multiple factors
- **Correlation Reasoning**: Detailed explanation of why moments are related
- **Similarity Metrics**: Numerical scores showing relationship strength
- **Nested Navigation**: Click related moments to navigate between detail views
- **Relationship Types**: Shared factors, entities, sources, and keywords

**Source Tab:**
- **Original Content Display**: Full text content that triggered moment detection
- **Source Metadata**: Complete file path, source type, and content information
- **Source Analytics**: Statistics about all moments from the same source
- **File Context**: Integration with catalog system for source entity details

**Timeline Tab:**
- **Temporal Information**: Estimated dates, timeframes, and historical context
- **Discovery Metadata**: When the moment was extracted and processed
- **Timeline Visualization Placeholder**: Future enhancement area for visual timeline

**Testing Scenarios:**

**Scenario 1: Basic Navigation**
1. From Moments tab, click any moment card
2. Verify detail view opens with moment title and impact score prominently displayed
3. Navigate through all four tabs (Overview, Related, Source, Timeline)
4. Use "Back" button to return to moments list
5. Test with different moment types (high impact, low confidence, etc.)

**Scenario 2: Correlation Discovery**
1. Open a moment with high impact or many entities
2. Navigate to "Related" tab
3. Verify related moments appear with similarity scores
4. Click on a related moment to navigate to its detail view
5. Test navigation between multiple related moments
6. Check correlation reasoning explains relationship factors

**Scenario 3: Entity Navigation**
1. In Overview tab, click company or technology entities
2. Verify navigation to appropriate catalog detail views
3. From catalog detail, navigate back to moment detail
4. Test with both existing and non-existing entities
5. Ensure navigation context is preserved

**Scenario 4: Source Integration**
1. Navigate to Source tab in moment detail
2. Review original content and source metadata
3. Check source analytics show accurate statistics
4. If source exists in catalog, verify entity connection
5. Test with moments from different source types (company vs technology)

**Scenario 5: Complete User Journey**
1. Start from Moments tab with analyzed moments
2. Click moment → navigate to detail → explore all tabs
3. Click related moment → navigate to new detail
4. Click entity → navigate to catalog detail → view related moments
5. Click different moment → return to moment detail
6. Verify seamless navigation throughout entire journey

**Evaluation Criteria:**
- ✅ Moment cards are clearly clickable with proper hover states
- ✅ Detail view opens with comprehensive moment information
- ✅ All four tabs load with appropriate, organized content
- ✅ Related moments show meaningful correlations with scoring
- ✅ Source tab displays complete original content and metadata
- ✅ Timeline tab shows temporal context and discovery information
- ✅ Navigation between detail views works smoothly
- ✅ "Back" button consistently returns to appropriate view
- ✅ Entity navigation integrates with catalog system
- ✅ Visual design matches existing catalog detail views

**Advanced Features to Test:**

**Correlation Intelligence:**
- Similarity scores reflect actual moment relationships
- Correlation reasoning provides clear explanations
- Top 6 most relevant moments displayed (not just random selection)
- Different correlation types properly identified

**Data Completeness:**
- All AI agent analysis data accessible through detail view
- Factor classifications show complete reasoning
- Impact analysis displays both score and rationale
- Entity extraction shows all detected entities (companies, technologies, people, locations)

**Navigation Consistency:**
- Detail view navigation behavior matches catalog detail views
- Active tab highlighting works correctly
- Context preservation throughout complex navigation paths
- Proper handling of edge cases (moments without entities, correlations, etc.)

**Performance Expectations:**
- Moment detail opens within 200ms of click
- Tab switching responds immediately (< 100ms)
- Correlation calculation completes within 500ms
- Navigation transitions smooth and responsive
- No flickering or loading delays for local data

**Common Issues to Watch For:**

**Navigation Problems:**
- Moment cards not responding to clicks
- Detail view not opening or loading incorrectly
- "Back" button not returning to correct view
- Tab content not loading properly

**Content Issues:**
- Missing or incomplete moment information
- Related moments not showing meaningful correlations
- Source content not displaying correctly
- Timeline information incomplete or incorrect

**Integration Issues:**
- Entity clicks not navigating to catalog details
- Correlation with existing catalog items failing
- Navigation context lost during complex journeys
- Inconsistent behavior between different moment types

This comprehensive moment detail system completes the unified navigation experience in Moments, allowing users to explore any piece of content (companies, technologies, or moments) with the same level of depth and interconnection.

### Testing File-Based Moment Persistence

The latest update introduces comprehensive two-way file-based persistence for moments, extending the existing companies/technologies folder pattern to moments with human-readable markdown files.

#### 13. File-Based Persistence System

**What to Test:**
- **Automatic File Generation**: Moments are automatically saved to `moments/` folder as markdown files
- **Two-Way Sync**: Moments load from filesystem on app startup and save back when analyzed
- **Human-Readable Format**: Files use YAML frontmatter with complete moment metadata
- **File Management UI**: Storage Manager provides file operations with user-friendly interface

**How It Works:**
1. When you analyze moments, they are automatically saved to `moments/` folder
2. Each moment becomes a markdown file: `YYYY-MM-DD-{type}-{title}-{id}.md`
3. Files contain YAML frontmatter with all metadata and readable markdown content
4. On app restart, moments load from files instead of relying only on browser storage
5. Manual file editing is supported - changes will be loaded back into the app

**Testing Scenarios:**

**Scenario 1: Automatic File Generation**
1. Run moment analysis to generate some moments
2. Check the `moments/` folder in your project directory
3. Verify moment files are created with proper naming convention
4. Open a moment file and examine the YAML frontmatter and markdown content
5. Confirm all moment data (classification, entities, impact, etc.) is present

**Scenario 2: File-Based Hydration**
1. After generating moments, close the browser completely
2. Reopen the app and navigate to Moments tab
3. Observe moments loading from files instead of showing empty state
4. Verify all moment data and relationships are preserved
5. Check browser console for hydration log messages

**Scenario 3: Storage Manager File Operations**
1. Navigate to Storage Manager (settings icon in header)
2. Go to "Storage Management" section
3. Look for "File Management" section with "Save to Files" and "Load from Files" buttons
4. Test "Save to Files" to manually save moments to filesystem
5. Test "Load from Files" to refresh moments from filesystem files

**Scenario 4: Manual File Editing**
1. Open a moment file in `moments/` folder with a text editor
2. Edit the title or description in the YAML frontmatter
3. Save the file and return to the Moments app
4. Use "Load from Files" in Storage Manager to refresh from files
5. Verify your changes appear in the moment card

**Scenario 5: Configuration Verification**
1. Check `config.yml` for moments configuration section
2. Verify `auto_save: true` and `sync_mode: "bidirectional"`
3. Test changing `auto_save: false` and confirm moments don't auto-save
4. Test different file patterns or folder paths

**File Structure to Evaluate:**

**Folder Organization:**
- `moments/` folder should be created automatically
- Files should follow naming pattern: `2024-01-15-c-openai-partnership-abc12345.md`
- Each file should be self-contained with complete moment data

**File Content Structure:**
```markdown
---
id: unique-moment-id
title: "Moment Title"
description: "Description"
extractedAt: "2024-01-01T00:00:00.000Z"
source:
  type: company
  name: "Company Name"
  # ... complete source metadata
classification:
  microFactors: ["company", "partners"]
  macroFactors: ["technology"]
  confidence: "high"
  reasoning: "AI analysis reasoning"
  keywords: ["keyword1", "keyword2"]
impact:
  score: 85
  reasoning: "Impact analysis"
entities:
  companies: ["Company1", "Company2"]
  technologies: ["Tech1", "Tech2"]
  # ... etc
---

# Moment Title

Brief description...

## Analysis Summary
[Readable analysis content]
```

**Configuration Options to Test:**

**In `config.yml`:**
```yaml
catalogs:
  moments:
    auto_save: true          # Test enabling/disabling auto-save
    sync_mode: "bidirectional"  # Test "one-way" vs "bidirectional"
    metadata_format: "frontmatter"  # YAML frontmatter format
    file_patterns: ["*.md", "*.mdx"]  # Test different patterns
```

**Evaluation Criteria:**
- ✅ Moment files are automatically created in `moments/` folder
- ✅ Files contain complete moment data in YAML frontmatter
- ✅ Markdown content is human-readable with structured analysis
- ✅ App successfully loads moments from files on startup
- ✅ File Management UI provides easy save/load operations
- ✅ Manual file edits are preserved when loading from files
- ✅ Configuration options work as expected
- ✅ No data loss when switching between memory and file storage

**Advanced Features to Test:**

**Bidirectional Sync:**
- Files → Memory: Changes to files appear in app after "Load from Files"
- Memory → Files: New moments automatically save to files (if auto_save enabled)
- Mixed operations: Some moments from analysis, some edited manually

**Error Handling:**
- Invalid YAML frontmatter in moment files
- Missing or corrupted moment files
- Filesystem permissions issues
- Large numbers of moment files (performance)

**Performance Testing:**
- Time to save large numbers of moments to files
- Loading speed with many moment files in folder
- Memory usage with file-based persistence enabled
- Browser storage usage before/after file persistence

**Integration Testing:**
- Moment detail views work with file-loaded moments
- Entity navigation works with file-persisted moments
- Keyword filtering works across file and memory moments
- Related moments correlation works with mixed sources

**Troubleshooting Common Issues:**

**Moments Not Saving to Files:**
- Check config.yml has `auto_save: true`
- Verify filesystem write permissions in moments/ folder
- Check browser console for save operation errors
- Use Storage Manager "Save to Files" as fallback

**Moments Not Loading from Files:**
- Verify `sync_mode: "bidirectional"` in config.yml
- Check moment files have valid YAML frontmatter
- Look for hydration errors in browser console
- Try "Load from Files" in Storage Manager manually

**File Format Issues:**
- Ensure YAML frontmatter is properly formatted with `---` delimiters
- Check all required fields are present (id, title, extractedAt)
- Verify date formats are ISO strings
- Validate enum values (confidence, etc.)

**Performance Issues:**
- Monitor filesystem operations in browser dev tools
- Check for excessive save/load operations
- Test with representative numbers of moment files
- Use "Inspect Storage" to check memory usage

This file-based persistence system provides a robust foundation for moments data management, ensuring your AI analysis results are preserved as human-readable files that can be version controlled, edited manually, and shared across different environments.

### Testing File-System-First Persistence Architecture

The latest major architectural update transforms Moments from localStorage-primary to file-system-first persistence, making the filesystem the single source of truth for all catalog data (companies, technologies, and moments).

#### 14. Enhanced Persistence Architecture

**What Changed:**
- **Primary Storage**: Filesystem is now the authoritative source for all catalog data
- **Caching Role**: localStorage is used only for performance optimization and temporary storage
- **Unified API**: Consistent file operations across all catalog types
- **Intelligent Fallback**: Seamless transition from old localStorage-primary to new file-first architecture

**What to Test:**

**File-System-First Loading:**
1. **Fresh Start**: Clear browser storage completely (dev tools → Application → Storage → Clear site data)
2. **Automatic Hydration**: Refresh the app and observe loading behavior
3. **Source Priority**: Check browser console logs for "Loading from file system first" messages
4. **Fallback Behavior**: Verify localStorage is used only for caching, not primary storage

**Enhanced Configuration:**
1. **Persistence Settings**: Check `config.yml` for new persistence configuration
   - `persistence.strategy: "file_system_first"`
   - Individual catalog `persistence_mode: "file_primary"`
   - `cache_enabled: true` for performance optimization
2. **Cache Configuration**: Verify cache TTL settings and behavior
3. **Auto-sync Settings**: Test `auto_sync: true` functionality

**Storage Manager Integration:**
1. **Enhanced Health Check**: Storage Manager now shows both localStorage AND filesystem status
2. **Filesystem Metrics**: Check file counts and folder readiness indicators
3. **Dual Status Display**: Verify both cache health and file system health are shown
4. **Error Handling**: Test behavior when filesystem is unavailable

**Testing Scenarios:**

**Scenario 1: File-First vs Cache-First Comparison**
1. **Before**: Load app with existing localStorage data
2. **Clear Cache**: Use Storage Manager to clear localStorage only
3. **Reload App**: App should load from filesystem, not show empty state
4. **Performance**: Observe that data appears immediately (loaded from files, cached to localStorage)

**Scenario 2: Cache Performance Validation**
1. **Initial Load**: First app load reads from filesystem and caches in localStorage
2. **Subsequent Loads**: Verify localStorage cache is used for immediate display
3. **Cache Invalidation**: Test that stale cache is refreshed from filesystem when needed
4. **Cache Health**: Monitor storage health shows both cache size and file system status

**Scenario 3: Data Source Verification**
1. **Modify Files**: Edit a moment file directly in `moments/` folder
2. **Clear Cache**: Clear localStorage using Storage Manager
3. **Reload App**: Verify file changes appear in the app
4. **Cache Refresh**: Confirm modified data is cached for subsequent loads

**Scenario 4: Migration from Old Architecture**
1. **Existing Users**: App should work normally for users with existing localStorage data
2. **Gradual Transition**: New data prioritizes filesystem while preserving existing data
3. **No Data Loss**: Verify no existing moments, companies, or technologies are lost
4. **Background Migration**: Existing data is gradually migrated to file-first approach

**Expected Benefits:**

**Data Reliability:**
- ✅ Data survives browser storage clearing
- ✅ Content persists across different browsers/devices (same filesystem)
- ✅ Manual file editing is immediately reflected in the app
- ✅ Version control friendly (files can be committed to git)

**Performance Optimization:**
- ✅ Immediate display using localStorage cache
- ✅ Background file system sync for persistence
- ✅ Intelligent cache invalidation prevents stale data
- ✅ Reduced browser storage consumption (files stored externally)

**Developer Experience:**
- ✅ Human-readable data files for debugging
- ✅ Direct file manipulation for testing/development
- ✅ Clear separation between cache and source of truth
- ✅ Consistent API across all catalog types

**Configuration Testing:**

**Test Different Persistence Strategies:**
```yaml
# In config.yml, test different strategies
persistence:
  strategy: "file_system_first"  # Test primary behavior
  # strategy: "local_storage_first"  # Test legacy mode
  # strategy: "hybrid"  # Test balanced approach
```

**Cache Settings Validation:**
```yaml
cache:
  enabled: true  # Test with caching enabled/disabled
  default_ttl_seconds: 3600  # Test different TTL values
  max_size_mb: 50  # Test cache size limits
```

**Per-Catalog Configuration:**
```yaml
catalogs:
  companies:
    persistence_mode: "file_primary"  # Test file-first for companies
    cache_enabled: true  # Test caching behavior
  moments:
    persistence_mode: "hybrid"  # Test mixed approach for moments
```

**Advanced Testing:**

**Performance Metrics:**
- File system operations: < 200ms for typical datasets
- Cache hits: < 10ms response time
- Cache misses: Graceful fallback to filesystem
- Storage health checks: < 100ms including filesystem status

**Error Scenarios:**
- Filesystem unavailable: Graceful degradation to cache-only mode
- Corrupted files: Automatic error recovery with detailed logging
- Cache quota exceeded: Automatic cleanup and file-priority fallback
- Mixed data sources: Proper merging and conflict resolution

**Integration Validation:**
- All existing features work with file-first persistence
- Moment detail views display file-loaded data correctly  
- Entity navigation works across file and cache sources
- Correlation discovery works with mixed data sources
- Export/import operations respect file-first architecture

**Troubleshooting Guide:**

**Issue: Data Not Loading from Files**
- Check `config.yml` has `persistence.strategy: "file_system_first"`
- Verify filesystem permissions for reading catalog folders
- Check browser console for file loading error messages
- Use Storage Manager to inspect filesystem status

**Issue: Cache Not Working**
- Verify `cache.enabled: true` in configuration
- Check localStorage quota and available space
- Monitor cache hit/miss ratios in browser dev tools
- Test with different cache TTL settings

**Issue: Mixed Data Sources**
- Some data from files, some from cache - this is expected during migration
- Use "Load from Files" in Storage Manager to force file reload
- Clear localStorage to test pure file-first behavior
- Check console logs for data source information

This architectural transformation ensures Moments provides enterprise-grade data reliability while maintaining the performance benefits of intelligent caching, creating a robust foundation for local-first AI business intelligence applications.

### Testing Incremental Moments Generation System

The latest update introduces intelligent incremental analysis that dramatically improves performance by processing only changed content instead of re-analyzing everything from scratch.

#### 15. Incremental Analysis Features

**What to Test:**
- **Smart Content Detection**: System tracks content changes using MD5 hashing and only processes new/modified items
- **Temporal Correlation Windows**: Advanced correlation analysis within configurable time windows (default 14 days)
- **Intelligent UI**: "Smart Update" vs "Full Refresh" buttons with incremental stats display
- **Cache Management**: Clear incremental cache to force full re-analysis when needed

**How It Works:**
1. **Change Detection**: System maintains content hashes to identify what has changed since last analysis
2. **Incremental Processing**: Only processes new or modified content, preserving existing analysis
3. **Correlation Updates**: Updates correlations within affected temporal windows
4. **Smart Merging**: Combines existing moments with newly discovered ones

**Testing Scenarios:**

**Scenario 1: Initial Analysis (Baseline)**
1. **Fresh Start**: Clear all data and start with clean catalogs
2. **Run Full Analysis**: Click "Full Analysis" button to establish baseline
3. **Note Performance**: Record analysis time and moment count (e.g., "18 moments in 45 seconds")
4. **Observe Files**: Check that moments are saved to `moments/` folder
5. **Check Incremental Stats**: Note "Tracked Content" count in status card

**Scenario 2: No-Change Incremental Analysis**
1. **Immediate Re-run**: Click "Smart Update" immediately after initial analysis
2. **Expected Behavior**: Should complete very quickly with "No changes detected" message
3. **Moment Preservation**: Verify same moment count and data
4. **Performance**: Should complete in < 5 seconds (vs 45 seconds for full analysis)

**Scenario 3: Content Change Detection**
1. **Modify Content**: Edit a markdown file in `companies/` or `technologies/` folder
2. **Add New Content**: Create a new markdown file with business-relevant information
3. **Run Smart Update**: Click "Smart Update" button
4. **Observe Processing**: Should process only changed files, not all content
5. **Verify Results**: New moments appear while existing ones are preserved
6. **Check Correlation**: Related moments should have updated impact scores

**Scenario 4: Force Full Re-analysis**
1. **Change Multiple Files**: Modify several content files significantly
2. **Click "Full Refresh"**: Use force full analysis option
3. **Compare Performance**: Should take longer but be more comprehensive than Smart Update
4. **Verify Accuracy**: All moments should be re-analyzed with current content

**Scenario 5: Incremental Cache Management**
1. **View Stats**: Check incremental status card for tracked content count and last update
2. **Clear Cache**: Click "Reset Cache" button to clear change detection
3. **Next Analysis**: Verify next "Smart Update" becomes full analysis (no change history)
4. **Re-establish Tracking**: Subsequent analyses should again be incremental

**User Interface Elements to Evaluate:**

**Incremental Analysis Buttons:**
- **"Smart Update"**: Primary button for incremental analysis
- **"Full Refresh"**: Secondary button for complete re-analysis  
- **"Reset Cache"**: Small button to clear incremental cache

**Incremental Status Card:**
- **Blue background**: Indicates incremental analysis is active
- **Tracked Content**: Number of files being monitored for changes
- **Temporal Window**: Shows correlation window (14 days default)
- **Last Update**: Timestamp of most recent analysis

**Expected Performance Benefits:**

**Time Comparison:**
- **Full Analysis**: 30-60 seconds for typical dataset
- **Smart Update (no changes)**: 2-5 seconds
- **Smart Update (few changes)**: 5-15 seconds
- **Reset Cache impact**: Next analysis becomes full (one-time cost)

**Content Processing:**
- **Full Analysis**: Processes 100% of content files
- **Incremental**: Processes only changed files (often 0-20%)
- **Correlation Updates**: Only affected temporal windows recalculated
- **Memory Usage**: Lower memory footprint for large content collections

**Advanced Features to Test:**

**Correlation Intelligence:**
1. **Temporal Windowing**: Related moments within 14-day windows get correlation updates
2. **Impact Score Boosting**: Highly correlated moments (>60% similarity) get impact score increases
3. **Similarity Calculation**: Based on entity overlap, factor alignment, and keyword matching
4. **Detailed Reasoning**: Console logs show correlation strength and reasoning

**Configuration Options:**
```yaml
# Test different temporal window sizes
incremental:
  temporal_window_days: 14  # Try 7, 14, 21, 30 days
  correlation_threshold: 0.6  # Adjust similarity threshold
  force_full_analysis: false  # Override incremental behavior
```

**Evaluation Criteria:**
- ✅ Smart Update processes only changed content (significant time savings)
- ✅ No-change analysis completes in < 5 seconds
- ✅ Existing moments preserved during incremental analysis  
- ✅ New moments properly integrated with existing correlation network
- ✅ Temporal correlation windows update affected moments only
- ✅ Impact scores adjust based on new correlations
- ✅ Incremental stats display accurate tracking information
- ✅ Cache reset forces full analysis on next run
- ✅ User interface clearly distinguishes incremental vs full analysis options

**Common Issues to Watch For:**

**Performance Issues:**
- Smart Update taking too long (should be < 15 seconds for typical changes)
- Memory leaks during repeated incremental analysis
- Excessive correlation calculations in temporal windows

**Data Integrity Issues:**
- Missing moments after incremental analysis
- Duplicated moments appearing in results  
- Correlation relationships lost during updates
- Impact scores not updating based on new correlations

**UI/UX Issues:**
- Incremental status card not reflecting actual state
- Button states confusing (when to use Smart Update vs Full Refresh)
- Status messages unclear during incremental processing

**Troubleshooting Guide:**

**Issue: Smart Update Not Working**
- Check browser console for change detection errors
- Verify content files have actual changes (timestamps, content)
- Try "Reset Cache" and run analysis again
- Compare content hashes in localStorage for debugging

**Issue: Poor Performance**
- Check if temporal correlation window is too large
- Verify not processing unchanged content (check console logs)  
- Monitor memory usage during analysis
- Consider clearing incremental cache for fresh start

**Issue: Missing Correlations**
- Ensure temporal window captures related moments timeframe
- Check correlation threshold isn't too restrictive
- Verify entity and factor overlap detection working
- Test with "Full Refresh" to establish complete correlation baseline

**Integration with File System:**
- Incremental analysis respects file-system-first persistence
- Content hashes track both file modifications and timestamps  
- Changes to moment files trigger correlation recalculation
- Manual file editing detected and processed incrementally

This incremental analysis system transforms Moments from a static batch processor into an intelligent, efficient analysis platform that scales gracefully with large content collections while maintaining analysis quality and correlation accuracy.

### Testing Parallel Processing Optimization

The latest update introduces comprehensive parallel processing optimization that dramatically improves moments analysis performance through concurrent execution.

#### 16. Parallel Processing Architecture

**What's New:**
- **Concurrent Analysis**: Companies and technologies now process simultaneously instead of sequentially
- **Parallel Content Processing**: Individual content files within each source process in parallel batches
- **Sub-Agent Parallelization**: Classification and correlation sub-agents run concurrently 
- **Configuration-Driven**: All parallel processing behavior is configurable via `config.yml`

**Performance Improvements to Test:**

**Scenario 1: Analysis Speed Comparison**
1. **Before Optimization**: Previous sequential processing (if available via config)
2. **After Optimization**: New parallel processing (default behavior)
3. **Expected Results**: 
   - **Small datasets (3-5 companies)**: 40-60% faster
   - **Medium datasets (5-10 companies)**: 60-80% faster
   - **Large datasets (10+ companies)**: 70-90% faster

**Scenario 2: Parallel Configuration Testing**
1. **Modify config.yml** parallel processing settings:
```yaml
app:
  processing:
    parallel_processing:
      enabled: true
      max_concurrent_sources: 4        # Process 4 companies/technologies simultaneously
      max_concurrent_content_per_source: 3  # Process 3 files per source in parallel
      enable_sub_agent_parallelization: true  # Run sub-agents concurrently
      sub_agent_batch_size: 10         # Batch size for classification/correlation
```

2. **Test Different Settings**:
   - Try `max_concurrent_sources: 2` vs `4` vs `6`
   - Test `max_concurrent_content_per_source: 1` (sequential) vs `3` (parallel)
   - Compare `enable_sub_agent_parallelization: false` vs `true`

**Scenario 3: Real-Time Performance Monitoring**
1. **Watch Analysis Progress**: Observe console logs during analysis
2. **Parallel Indicators**: Look for messages like:
   - `"Processing 2 source types in parallel"`
   - `"Parallel classification completed: X items"`
   - `"Sub-agent enhancement completed in parallel"`
3. **Performance Metrics**: Monitor browser dev tools for concurrent API calls

**Sub-Agent Parallelization Testing:**

**Classification + Correlation Concurrency:**
1. **Parallel Mode** (default): Both classification and correlation sub-agents run simultaneously
2. **Sequential Mode**: Sub-agents run one after another (configurable fallback)
3. **Batch Processing**: Large moment sets processed in configurable batches (10-15 items)

**Expected Benefits:**
- ✅ **Faster Analysis**: 40-90% reduction in total analysis time
- ✅ **Better Resource Usage**: Efficient utilization of API rate limits
- ✅ **Scalable Performance**: Performance improvements increase with dataset size  
- ✅ **Configurable Behavior**: Fine-tune parallel settings for your hardware/API limits
- ✅ **Backward Compatibility**: Sequential mode available as fallback option

**Performance Monitoring:**

**Browser Console Indicators:**
```
[ParallelAnalysis] Parallel processing enabled
[ParallelAnalysis] Processing 2 source types
[MomentExtractor] Processing 5 items in parallel (max 3 concurrent)
[SubAgents] Parallel classification completed: 15 items
[SubAgents] Parallel correlation analysis completed: 12 correlations
```

**Configuration Options to Test:**

**Rate Limiting Configuration:**
```yaml
api_rate_limiting:
  requests_per_minute: 120    # Stay within API limits
  concurrent_requests: 10     # Max simultaneous API calls
```

**Agent-Specific Parallel Settings:**
```yaml
agents:
  classification_agent:
    parallel_batch_size: 10
    enable_parallel_batches: true
  correlation_engine:
    parallel_batch_size: 15
    enable_parallel_batches: true
```

**Troubleshooting Parallel Processing:**

**Issue: No Performance Improvement**
- Check `parallel_processing.enabled: true` in config.yml
- Verify you have enough content to benefit from parallelization
- Monitor API rate limiting - may need to adjust concurrent_requests
- Test with different batch sizes for optimal performance

**Issue: API Rate Limiting Errors**
- Reduce `max_concurrent_sources` or `max_concurrent_content_per_source`
- Lower `concurrent_requests` in rate limiting configuration
- Enable `enable_sub_agent_parallelization: false` to reduce concurrent calls

**Issue: Inconsistent Results**
- Parallel processing should produce identical results to sequential
- Try `enable_sub_agent_parallelization: false` to isolate issues
- Check browser console for processing errors or warnings
- Compare results with sequential mode for validation

**Advanced Features:**

**Intelligent Fallback:**
- Automatic fallback to sequential processing if parallel fails
- Graceful error handling with detailed logging
- Configurable retry logic for failed parallel operations

**Performance Scaling:**
- Linear performance improvement with additional concurrent sources
- Optimal batch sizes automatically calculated based on content size
- Dynamic adjustment based on API response times

**Integration Testing:**
- Parallel processing works with all existing features
- Incremental analysis benefits from parallel processing
- File-system persistence maintains performance gains
- Storage manager reflects parallel processing status

This parallel processing optimization ensures Moments scales efficiently with large content collections while maintaining analysis accuracy and providing comprehensive configuration options for different deployment scenarios and API rate limits.

## 🔧 Configuration

### Custom Content Sources

Modify `config.yml` to analyze your own content:

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
```

### Agent Configuration

Customize AI agent behavior:

```yaml
agents:
  content_analyzer:
    enabled: true
    model: "claude-sonnet-4-20250514"
    temperature: 0.3
    
  classification_agent:
    model: "claude-sonnet-4-20250514"
    temperature: 0.2
```

## 📊 Sample Data

The repository includes curated content for exploration:

### Companies
- **Glean**: Agent platform and enterprise search
- **Sierra AI**: Conversational agent operating system
- **Walmart**: Enterprise AI strategy and implementation

### Technologies
- **Claude Code**: AI development tools and SDK
- **LLM Agents**: Multi-agent system architectures
- **LLM Prompting**: Advanced prompting techniques

## 🏗️ Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── moment-card.tsx   # AI moment display
│   └── moments-view.tsx  # Analysis dashboard
├── lib/                  # Core logic
│   ├── moment-extractor.ts  # AI content analysis
│   ├── sub-agents.ts        # Agent orchestration
│   └── factor-classifier.ts # Business factor logic
├── store/                # State management
└── types/                # TypeScript definitions
```

### Key Components

- **MomentExtractor**: Claude Code SDK integration for content analysis
- **SubAgentManager**: Multi-agent orchestration and workflow
- **FactorClassifier**: Business intelligence classification logic
- **MomentsStore**: Zustand state management with persistence

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # Code linting
```

## 🔐 Security & Privacy

### Local-First Design
- All sensitive processing happens locally
- No cloud dependencies for core functionality
- Optional AI enhancement with your API keys

### Development vs Production
- **Development**: Client-side API keys for rapid iteration
- **Production**: Server-side API routes recommended
- **Migration Path**: Built-in patterns for secure deployment

## 📚 Learning Resources

### Documentation
- **[Architecture Specification](specs/stack.md)**: Complete technical architecture
- **[Design System](specs/design.md)**: UI/UX design principles
- **[Development Guide](CLAUDE.md)**: Comprehensive development instructions

### Blog Posts
- **[AI Business Intelligence](blog/end-user-persona-ai-business-intelligence.md)**: End-user perspective
- **[Claude Code SDK Architecture](blog/developer-persona-claude-code-sdk-architecture.md)**: Technical deep dive
- **[AI Engineer Guide](blog/ai-engineer-persona-multi-agent-systems.md)**: Multi-agent systems

## 🤝 Contributing

We welcome contributions! Areas of interest:

### High Priority
- **Server-side API migration** for production security
- **Additional data sources** (RSS, APIs, databases)
- **Advanced correlation algorithms** for business intelligence
- **Export capabilities** (PDF reports, CSV data)

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes following existing patterns
4. Add tests for new functionality
5. Submit pull request with detailed description

### Code Style
- TypeScript-first development
- Feature-slice approach (no mocks/prototypes)
- AI-native patterns with Claude Code SDK
- Modern React and Next.js conventions

## 🚀 Roadmap

### Immediate (Next Release)
- [ ] Server-side API routes for production security
- [ ] Enhanced correlation discovery algorithms
- [ ] Export functionality (reports, data)
- [ ] Additional content source integrations

### Short Term
- [ ] Advanced filtering and search capabilities
- [ ] Custom agent configuration UI
- [ ] Real-time content monitoring
- [ ] Team collaboration features

### Long Term
- [ ] Enterprise deployment options
- [ ] Advanced analytics and reporting
- [ ] Integration with business intelligence platforms
- [ ] Multi-language content analysis

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