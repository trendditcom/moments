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
    parallel_processing?: {
      enabled: boolean
      max_concurrent_sources: number
      max_concurrent_content_per_source: number
      enable_sub_agent_parallelization: boolean
      sub_agent_batch_size: number
      api_rate_limiting: {
        requests_per_minute: number
        concurrent_requests: number
      }
    }
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
  parallel_batch_size?: number
  enable_parallel_batches?: boolean
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

export interface AnthropicOptimizationConfig {
  prompt_caching?: {
    enabled: boolean
    cache_key_prefix?: string
    min_prompt_length?: number
    max_cache_size?: number
    ttl?: number
  }
  beta_features?: {
    enabled: boolean
    features: string[]
    auto_enable?: boolean
  }
  streaming?: {
    enabled: boolean
    buffer_size?: number
    adaptive_buffer?: boolean
    preload_threshold?: number
  }
  request_optimization?: {
    enabled: boolean
    batch_requests?: boolean
    connection_pooling?: boolean
    keep_alive?: boolean
    retry_with_backoff?: boolean
  }
  model_optimization?: {
    enabled: boolean
    auto_select_model?: boolean
    fallback_models?: Record<string, string[]>
    cost_optimized_selection?: boolean
  }
}

export interface BedrockOptimizationConfig {
  cross_region_inference?: {
    enabled: boolean
    primary_region: string
    fallback_regions: string[]
    inference_profiles: Record<string, string>
    auto_fallback: boolean
    latency_threshold: number
  }
  batch_inference?: {
    enabled: boolean
    batch_size: number
    max_wait_time: number
    cost_threshold: number
    compatible_operations: string[]
  }
  guardrails?: {
    enabled: boolean
    guardrail_id?: string
    guardrail_version?: string
    trace: boolean
    block_on_violation: boolean
    custom_filters: string[]
  }
  model_inference?: {
    enabled: boolean
    adaptive_model_selection: boolean
    region_specific_models: Record<string, string[]>
    performance_monitoring: boolean
    auto_scaling: boolean
  }
  cost_optimization?: {
    enabled: boolean
    prefer_cheaper_models: boolean
    spot_instances_usage: boolean
    reserved_capacity: boolean
    cost_budget_limits: Record<string, number>
  }
  enterprise?: {
    enabled: boolean
    vpc_endpoints: boolean
    private_subnets: string[]
    kms_key_id?: string
    iam_role_arn?: string
    logging_enabled: boolean
    compliance_mode: 'strict' | 'moderate' | 'relaxed'
  }
}

export interface AnthropicProviderConfig {
  api_key_env: string
  base_url: string
  optimizations?: AnthropicOptimizationConfig
}

export interface BedrockProviderConfig {
  aws_region: string
  aws_profile?: string
  use_bedrock_api_key: boolean
  inference_profile?: string | null
  optimizations?: BedrockOptimizationConfig
}

export interface ModelMapping {
  sonnet: {
    anthropic: string
    bedrock: string
  }
  haiku: {
    anthropic: string
    bedrock: string
  }
  opus: {
    anthropic: string
    bedrock: string
  }
}

export interface ResponseCacheConfig {
  enabled: boolean
  providers: {
    anthropic: {
      enabled: boolean
      max_entries: number
      default_ttl_hours: number
      max_memory_mb: number
      compression_enabled: boolean
      persist_to_disk: boolean
      cleanup_interval_minutes: number
    }
    bedrock: {
      enabled: boolean
      max_entries: number
      default_ttl_hours: number
      max_memory_mb: number
      compression_enabled: boolean
      persist_to_disk: boolean
      cleanup_interval_minutes: number
    }
  }
  global: {
    max_total_memory_mb: number
    analytics_enabled: boolean
    export_schedule: 'daily' | 'weekly' | 'never'
    warning_thresholds: {
      memory_usage_percent: number
      hit_rate_percent: number
    }
  }
}

export interface ModelProviderConfig {
  type: 'anthropic' | 'bedrock'
  anthropic: AnthropicProviderConfig
  bedrock: BedrockProviderConfig
  model_mapping: ModelMapping
}

export interface Config {
  catalogs: {
    companies: CatalogConfig
    technologies: CatalogConfig
    moments?: MomentsCatalogConfig
  }
  persistence?: PersistenceConfig
  model_provider?: ModelProviderConfig
  cache?: ResponseCacheConfig
  app: AppConfig
  factors: FactorsConfig
  agents: {
    content_analyzer: AgentConfig
    classification_agent: AgentConfig
    correlation_engine: AgentConfig
    report_generator: AgentConfig
  }
}