export interface CatalogConfig {
  name: string
  description: string
  source_folders: string[]
  default_folder: string
  file_patterns: string[]
  // File system persistence settings
  persistence_mode?: 'file_primary' | 'memory_primary' | 'hybrid'
  auto_sync?: boolean
  cache_enabled?: boolean
  cache_ttl_seconds?: number
}

export interface MomentsCatalogConfig extends CatalogConfig {
  metadata_format: 'frontmatter' | 'json'
  auto_save: boolean
  sync_mode: 'one-way' | 'bidirectional'
  // Additional moments-specific persistence settings inherited from CatalogConfig
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

export interface PersistenceConfig {
  strategy: 'file_system_first' | 'local_storage_first' | 'hybrid'
  cache: {
    enabled: boolean
    default_ttl_seconds: number
    max_size_mb: number
  }
  file_system: {
    auto_sync: boolean
    backup_enabled: boolean
    compression_enabled: boolean
  }
  local_storage: {
    used_for: string[]
    clear_on_startup: boolean
    versioning: boolean
  }
}

export interface Config {
  catalogs: {
    companies: CatalogConfig
    technologies: CatalogConfig
    moments?: MomentsCatalogConfig
  }
  persistence?: PersistenceConfig
  app: AppConfig
  factors: FactorsConfig
  agents: {
    content_analyzer: AgentConfig
    classification_agent: AgentConfig
    correlation_engine: AgentConfig
    report_generator: AgentConfig
  }
}