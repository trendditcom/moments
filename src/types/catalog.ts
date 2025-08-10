export interface ContentItem {
  id: string
  name: string
  path: string
  type: 'markdown' | 'image'
  content?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  // Moment analysis properties
  momentsExtracted?: number
  lastAnalyzedAt?: Date
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'error'
}

export interface Company {
  id: string
  name: string
  slug: string
  path: string
  description?: string
  category: 'startup' | 'enterprise'
  valuation?: number
  stage?: string
  content: ContentItem[]
  createdAt: Date
  updatedAt: Date
  // Moment analysis properties
  totalMoments?: number
  lastMomentAnalysis?: Date
  highImpactMoments?: number
}

export interface Technology {
  id: string
  name: string
  slug: string
  path: string
  description?: string
  category: string
  content: ContentItem[]
  createdAt: Date
  updatedAt: Date
  // Moment analysis properties
  totalMoments?: number
  lastMomentAnalysis?: Date
  highImpactMoments?: number
}

export interface FolderSelection {
  companiesPath: string | null
  technologiesPath: string | null
  lastUpdated: Date | null
}

export interface CatalogState {
  companies: Company[]
  technologies: Technology[]
  folderSelection: FolderSelection
  isLoading: boolean
  error: string | null
}

export interface CatalogActions {
  setFolderSelection: (selection: Partial<FolderSelection>) => void
  addCompanies: (companies: Company[]) => void
  addTechnologies: (technologies: Technology[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearCatalogs: () => void
  hydrateCatalogs: (companiesPath?: string, technologiesPath?: string) => Promise<void>
}