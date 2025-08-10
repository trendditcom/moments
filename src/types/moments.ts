export type MicroFactor = 
  | 'company' 
  | 'competition' 
  | 'partners' 
  | 'customers'

export type MacroFactor = 
  | 'economic' 
  | 'geo_political' 
  | 'regulation' 
  | 'technology' 
  | 'environment' 
  | 'supply_chain'

export type Factor = MicroFactor | MacroFactor

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface MomentClassification {
  microFactors: MicroFactor[]
  macroFactors: MacroFactor[]
  confidence: ConfidenceLevel
  reasoning: string
  keywords: string[]
}

export interface PivotalMoment {
  id: string
  title: string
  description: string
  content: string
  source: {
    type: 'company' | 'technology'
    id: string
    name: string
    contentId: string
    filePath: string
  }
  classification: MomentClassification
  extractedAt: Date
  impact: {
    score: number // 0-100
    reasoning: string
  }
  entities: {
    companies: string[]
    technologies: string[]
    people: string[]
    locations: string[]
  }
  timeline: {
    estimatedDate?: Date
    timeframe?: string
    isHistorical: boolean
  }
}

export interface MomentCorrelation {
  id: string
  moment1Id: string
  moment2Id: string
  correlationType: 'causal' | 'temporal' | 'thematic' | 'competitive'
  strength: number // 0-1
  description: string
  commonFactors: Factor[]
  discoveredAt: Date
}

export interface MomentAnalysisResult {
  moments: PivotalMoment[]
  totalProcessed: number
  processingTime: number
  errors: string[]
}

// Progress tracking types
export interface AnalysisStep {
  id: string
  type: 'content_analysis' | 'moment_extraction' | 'classification' | 'correlation' | 'validation'
  status: 'pending' | 'running' | 'completed' | 'error'
  startTime?: Date
  endTime?: Date
  description: string
  details?: string
  progress?: number // 0-100
}

export interface AgentActivity {
  agentId: string
  agentType: 'content_analyzer' | 'classification_agent' | 'correlation_engine' | 'report_generator' | 'moment_extractor'
  status: 'spawning' | 'active' | 'processing' | 'waiting' | 'completed' | 'error'
  currentTask?: string
  prompt?: string
  model: string
  startTime: Date
  lastActivity: Date
  processingCount: number
}

export interface AnalysisProgress {
  isActive: boolean
  currentStep: AnalysisStep | null
  completedSteps: AnalysisStep[]
  activeAgents: AgentActivity[]
  currentPrompt?: string
  progressPercentage: number
  estimatedTimeRemaining?: number
  stats: {
    totalItems: number
    processedItems: number
    momentsExtracted: number
    errorsEncountered: number
  }
}

export interface MomentState {
  moments: PivotalMoment[]
  correlations: MomentCorrelation[]
  isAnalyzing: boolean
  analysisError: string | null
  lastAnalysisAt: Date | null
  processingStats: {
    totalContent: number
    processedContent: number
    momentsFound: number
  }
  progress: AnalysisProgress
}

export interface MomentActions {
  analyzeMoments: (sourceType: 'companies' | 'technologies' | 'all') => Promise<void>
  addMoments: (moments: PivotalMoment[]) => Promise<void>
  addCorrelations: (correlations: MomentCorrelation[]) => void
  setAnalyzing: (analyzing: boolean) => void
  setAnalysisError: (error: string | null) => void
  clearMoments: () => void
  updateProcessingStats: (stats: Partial<MomentState['processingStats']>) => void
  // File-based persistence actions
  hydrateFromFiles: () => Promise<{ loaded: number; errors: number }>
  saveToFiles: (moments?: PivotalMoment[]) => Promise<{ saved: number; failed: number }>
  deleteMomentFile: (momentId: string) => Promise<boolean>
  checkFileSystemStatus: () => Promise<{ exists: boolean; writable: boolean; count: number }>
  // Progress tracking actions
  updateProgress: (progress: Partial<AnalysisProgress>) => void
  addStep: (step: AnalysisStep) => void
  updateStep: (stepId: string, updates: Partial<AnalysisStep>) => void
  addAgent: (agent: AgentActivity) => void
  updateAgent: (agentId: string, updates: Partial<AgentActivity>) => void
  setCurrentPrompt: (prompt: string | undefined) => void
  resetProgress: () => void
}

// Agent configuration types
export interface AgentConfig {
  enabled: boolean
  model: string
  temperature: number
}

export interface SubAgentConfigs {
  content_analyzer: AgentConfig
  classification_agent: AgentConfig
  correlation_engine: AgentConfig
  report_generator: AgentConfig
}

// Moment extraction pipeline types
export interface ContentAnalysis {
  contentId: string
  extractedText: string
  metadata: Record<string, any>
  potentialMoments: string[]
}

export interface ClassificationRequest {
  text: string
  context: {
    sourceType: 'company' | 'technology'
    sourceName: string
    filePath: string
  }
}

export interface ClassificationResponse {
  isPivotalMoment: boolean
  classification?: MomentClassification
  extractedMoment?: Omit<PivotalMoment, 'id' | 'extractedAt' | 'source'>
}