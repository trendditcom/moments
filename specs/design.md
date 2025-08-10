# Moments App User Interface Design Specification

## Design Philosophy

Moments follows a **data-first, AI-native** design philosophy that prioritizes signal clarity over visual complexity. The interface serves as an intelligent lens for discovering and correlating pivotal moments in the AI business landscape.

### Core Design Principles

1. **Signal-First Design**: Every UI element serves to surface meaningful insights
2. **Contextual Intelligence**: Interface adapts based on analysis depth and user focus
3. **Local-First Experience**: Instant responsiveness with no loading states for core features
4. **Progressive Disclosure**: Complex analysis revealed incrementally as users explore
5. **Agent-Aware Interface**: UI reflects the multi-agent analysis pipeline

## Information Architecture

### Primary User Journeys

#### Journey 1: Moment Discovery
```
Landing → Content Explorer → Moment Timeline → Detail Analysis
```

#### Journey 2: Correlation Exploration
```
Dashboard → Correlation Graph → Factor Analysis → Trend Insights
```

#### Journey 3: Company/Technology Deep Dive
```
Search → Company Profile → Moment History → Competitive Landscape
```

### Navigation Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    Global Navigation                    │
│  [Dashboard] [Explore] [Analysis] [Correlations] [⚙]  │
└─────────────────────────────────────────────────────────┘
│
├── Dashboard (Overview & Recent Activity)
├── Explore (Content Discovery & Filtering)
├── Analysis (Deep-dive Tools & Visualizations)
├── Correlations (Relationship Mapping & Trends)
└── Settings (Preferences & Agent Configuration)
```

## Component Architecture

### Layout System

#### Primary Layout (Dashboard & Main Views)
```typescript
interface PrimaryLayout {
  header: GlobalNavigation;
  sidebar: ContextualNavigation;
  main: MainContent;
  aside: InsightPanel;
  status: AgentStatusBar;
}
```

#### Focus Layout (Detail Views & Analysis)
```typescript
interface FocusLayout {
  header: BreadcrumbNavigation;
  main: FullWidthContent;
  overlay: ToolPalette;
  status: ProcessingIndicator;
}
```

### Core Components

#### 1. Moment Cards
**Purpose**: Display individual pivotal moments with key metadata
```typescript
interface MomentCard {
  id: string;
  title: string;
  source: CompanyInfo;
  classification: {
    factors: MicroMacroFactors;
    confidence: number;
    type: 'pivot' | 'trend' | 'disruption';
  };
  timestamp: Date;
  preview: string;
  correlations: number;
  actions: MomentActions;
}
```

**Visual Design**:
- Card-based layout with subtle elevation
- Color-coded left border indicating moment type
- Confidence indicator as subtle progress bar
- Hover states reveal correlation count and quick actions

#### 2. Agent Status Indicator
**Purpose**: Real-time feedback on AI analysis progress
```typescript
interface AgentStatusIndicator {
  activeAgents: SubAgent[];
  currentTask: string;
  progress: number;
  queuedAnalysis: number;
  lastUpdate: Date;
}
```

**Visual Design**:
- Persistent bottom bar with agent icons
- Animated progress indicators for active analysis
- Expandable detail view showing sub-agent activities

#### 3. Correlation Graph
**Purpose**: Interactive visualization of moment relationships
```typescript
interface CorrelationGraph {
  nodes: MomentNode[];
  edges: CorrelationEdge[];
  filters: {
    timeRange: DateRange;
    factors: FactorFilters;
    strength: number;
  };
  layout: 'force' | 'hierarchical' | 'temporal';
}
```

**Visual Design**:
- D3.js-powered interactive graph
- Node size represents moment impact/confidence
- Edge thickness represents correlation strength
- Color coding for different correlation types

#### 4. Factor Classification Panel
**Purpose**: Visual breakdown of micro/macro factor analysis
```typescript
interface FactorPanel {
  microFactors: {
    company: FactorScore[];
    competition: FactorScore[];
    partners: FactorScore[];
    customers: FactorScore[];
  };
  macroFactors: {
    economic: FactorScore[];
    geopolitical: FactorScore[];
    regulation: FactorScore[];
    technology: FactorScore[];
    environment: FactorScore[];
    supplyChain: FactorScore[];
  };
}
```

**Visual Design**:
- Tabbed interface with micro/macro views
- Horizontal bar charts for factor scores
- Expandable sections for detailed analysis
- Tooltips with AI-generated explanations

### Advanced UI Components

#### 5. Timeline Visualization
**Purpose**: Chronological view of moments with trend analysis
```typescript
interface TimelineComponent {
  moments: TimelineMoment[];
  granularity: 'day' | 'week' | 'month' | 'quarter';
  overlays: {
    trends: TrendLine[];
    events: MarketEvent[];
    annotations: UserAnnotation[];
  };
  filters: TimelineFilters;
}
```

**Visual Design**:
- Horizontal timeline with moment markers
- Trend lines overlaid for pattern recognition
- Zoom controls for different time granularities
- Interactive brushing for time range selection

#### 6. Company Intelligence Dashboard
**Purpose**: Comprehensive view of company-specific moments and analysis
```typescript
interface CompanyDashboard {
  company: CompanyProfile;
  moments: MomentSummary[];
  competitivePosition: CompetitorAnalysis;
  trends: TrendAnalysis[];
  insights: AIGeneratedInsights;
  correlations: CrossCompanyCorrelations;
}
```

**Visual Design**:
- Hero section with company overview and key metrics
- Grid layout for different analysis categories
- Interactive charts for trend visualization
- Expandable insight cards with detailed analysis

## Design System Specifications

### Color Palette

#### Primary Colors
```css
--primary-50: #f0f9ff;   /* Background wash */
--primary-500: #3b82f6;  /* Primary actions */
--primary-600: #2563eb;  /* Primary hover */
--primary-900: #1e3a8a;  /* Primary text */
```

#### Semantic Colors
```css
/* Moment Types */
--moment-pivot: #f59e0b;     /* Amber - Strategic pivots */
--moment-trend: #10b981;     /* Emerald - Emerging trends */
--moment-disruption: #ef4444; /* Red - Market disruptions */

/* Confidence Levels */
--confidence-high: #22c55e;   /* Green - High confidence */
--confidence-medium: #f59e0b; /* Amber - Medium confidence */
--confidence-low: #ef4444;    /* Red - Low confidence */

/* Factor Categories */
--micro-factor: #8b5cf6;     /* Purple - Micro factors */
--macro-factor: #06b6d4;     /* Cyan - Macro factors */
```

### Typography Scale

```css
/* Primary Font: Inter (UI Text) */
--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Secondary Font: JetBrains Mono (Code/Data) */
--font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Type Scale */
--text-xs: 0.75rem;    /* 12px - Meta information */
--text-sm: 0.875rem;   /* 14px - Supporting text */
--text-base: 1rem;     /* 16px - Body text */
--text-lg: 1.125rem;   /* 18px - Emphasized text */
--text-xl: 1.25rem;    /* 20px - Subheadings */
--text-2xl: 1.5rem;    /* 24px - Section headers */
--text-3xl: 1.875rem;  /* 30px - Page headers */
```

### Spacing & Layout

```css
/* Spacing Scale (4px base) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */

/* Layout Grid */
--max-width-prose: 65ch;     /* Text content */
--max-width-screen: 1400px;  /* Application width */
--sidebar-width: 280px;      /* Navigation sidebar */
--aside-width: 320px;        /* Insight panel */
```

### Component Patterns

#### Card Design Pattern
```css
.moment-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: var(--space-6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    border-color: var(--primary-300);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}
```

#### Interactive Element States
```css
.interactive-element {
  transition: all 200ms ease;
  
  &:hover { opacity: 0.8; }
  &:focus { outline: 2px solid var(--primary-500); }
  &:active { transform: translateY(1px); }
}
```

## Responsive Design Strategy

### Breakpoint System
```css
/* Mobile First Approach */
--screen-sm: 640px;   /* Small tablets */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Laptops */
--screen-xl: 1280px;  /* Desktops */
--screen-2xl: 1536px; /* Large displays */
```

### Layout Adaptations

#### Mobile (< 768px)
- Single column layout
- Bottom navigation
- Simplified moment cards
- Gesture-based interactions
- Collapsible filters

#### Tablet (768px - 1024px)
- Two column layout
- Side navigation drawer
- Medium-density moment cards
- Touch-optimized controls
- Expandable detail panels

#### Desktop (> 1024px)
- Full multi-panel layout
- Persistent navigation
- High-density information display
- Keyboard shortcuts
- Multiple simultaneous views

## Interaction Design

### Animation Principles

#### Purposeful Motion
- **Functional animations**: Guide user attention and provide feedback
- **Duration**: 200ms for micro-interactions, 300ms for transitions
- **Easing**: Ease-out for UI responses, ease-in-out for transitions
- **Reduced motion**: Respect user preferences for accessibility

#### Loading States
```typescript
interface LoadingStates {
  skeleton: SkeletonLoader;     // Content structure preview
  spinner: ProcessingSpinner;   // Active analysis indicator
  progress: ProgressBar;        // Long-running operations
  shimmer: ShimmerEffect;       // Data loading states
}
```

### Accessibility Standards

#### WCAG 2.1 AA Compliance
- **Color contrast**: 4.5:1 minimum for normal text, 3:1 for large text
- **Keyboard navigation**: Full functionality without mouse
- **Screen reader support**: Proper ARIA labels and semantic HTML
- **Focus management**: Logical tab order and visible focus indicators

#### Inclusive Design Features
- **High contrast mode**: Alternative color schemes for visibility
- **Font scaling**: Support for user font size preferences
- **Motion reduction**: Respect prefers-reduced-motion settings
- **Alternative text**: Comprehensive alt text for all visual content

## Data Visualization Guidelines

### Chart Types & Use Cases

#### Temporal Data
- **Line Charts**: Moment frequency over time
- **Area Charts**: Cumulative impact analysis  
- **Timeline Plots**: Event sequence visualization

#### Relational Data
- **Network Graphs**: Moment correlations
- **Sankey Diagrams**: Factor flow analysis
- **Treemaps**: Hierarchical company categories

#### Comparative Data
- **Bar Charts**: Factor score comparisons
- **Radar Charts**: Multi-dimensional company profiles
- **Scatter Plots**: Correlation strength visualization

### Visualization Principles
1. **Data Integrity**: Never distort data for visual appeal
2. **Progressive Disclosure**: Layer complexity based on user needs
3. **Interactive Exploration**: Enable user-driven analysis
4. **Context Preservation**: Maintain reference points during interactions

## Performance Considerations

### Rendering Optimization
- **Virtual scrolling**: Handle large moment datasets efficiently
- **Lazy loading**: Load components and images on demand
- **Memoization**: Cache expensive UI calculations
- **Debounced inputs**: Optimize search and filter responsiveness

### Local-First Interface
- **Instant feedback**: No loading states for local operations
- **Optimistic updates**: Show changes immediately, sync asynchronously
- **Offline indicators**: Clear status when external services unavailable
- **Background sync**: Non-blocking updates with subtle notifications

## Development Implementation

### Component Structure
```typescript
// Base component structure
interface BaseComponent {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

// Compound component pattern
const MomentCard = {
  Root: MomentCardRoot,
  Header: MomentCardHeader,
  Content: MomentCardContent,
  Actions: MomentCardActions,
  Meta: MomentCardMeta
};
```

### State Management Integration
```typescript
// Zustand store structure
interface UIStore {
  // Layout state
  sidebarCollapsed: boolean;
  activePanel: 'insights' | 'correlations' | 'timeline';
  
  // Filter state
  momentFilters: MomentFilters;
  dateRange: DateRange;
  
  // Selection state
  selectedMoments: string[];
  focusedCorrelation: string | null;
  
  // View preferences
  viewMode: 'grid' | 'list' | 'timeline';
  sortOrder: SortOption;
}
```

### Testing Strategy
- **Component Testing**: React Testing Library for behavior verification
- **Visual Regression**: Chromatic/Storybook for UI consistency
- **Accessibility Testing**: axe-core integration for WCAG compliance
- **Performance Testing**: Lighthouse CI for rendering performance
- **User Journey Testing**: Playwright for end-to-end workflows

This design specification provides a comprehensive foundation for building an intelligent, data-rich interface that effectively surfaces pivotal moments in the AI business landscape while maintaining excellent user experience and accessibility standards.