export interface CatalogConfig {
  name: string
  description: string
  source_folders: string[]
  default_folder: string
  file_patterns: string[]
}

export interface AppConfig {
  name: string
  description: string
  version: string
  processing: {
    max_file_size_mb: number
    cache_enabled: boolean
    cache_ttl_seconds: number
  }
  ui: {
    items_per_page: number
    enable_search: boolean
    enable_filters: boolean
  }
}

export interface FactorsConfig {
  micro: string[]
  macro: string[]
}

export interface AgentConfig {
  enabled: boolean
  model: string
  temperature: number
}

export interface Config {
  catalogs: {
    companies: CatalogConfig
    technologies: CatalogConfig
  }
  app: AppConfig
  factors: FactorsConfig
  agents: {
    content_analyzer: AgentConfig
    classification_agent: AgentConfig
    correlation_engine: AgentConfig
    report_generator: AgentConfig
  }
}