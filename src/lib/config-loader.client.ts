import { Config } from './config-types'

let cachedConfig: Config | null = null

// Default configuration fallback
export function getDefaultConfig(): Config {
  return {
    catalogs: {
      companies: {
        name: 'Companies',
        description: 'AI startup companies and enterprises',
        source_folders: ['./companies'],
        default_folder: './companies',
        file_patterns: ['*.md', '*.mdx', '*.png', '*.jpg', '*.jpeg', '*.webp', '*.svg']
      },
      technologies: {
        name: 'Technologies',
        description: 'AI technologies, frameworks, and tools',
        source_folders: ['./technologies'],
        default_folder: './technologies',
        file_patterns: ['*.md', '*.mdx', '*.png', '*.jpg', '*.jpeg', '*.webp', '*.svg']
      }
    },
    model_provider: {
      type: 'anthropic',
      anthropic: {
        api_key_env: 'ANTHROPIC_API_KEY',
        base_url: 'https://api.anthropic.com'
      },
      bedrock: {
        aws_region: 'us-east-1',
        aws_profile: 'default',
        use_bedrock_api_key: false,
        inference_profile: null
      },
      model_mapping: {
        sonnet: {
          anthropic: 'claude-3-5-sonnet-20241022',
          bedrock: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0'
        },
        haiku: {
          anthropic: 'claude-3-5-haiku-20241022',
          bedrock: 'us.anthropic.claude-3-5-haiku-20241022-v1:0'
        },
        opus: {
          anthropic: 'claude-3-opus-20240229',
          bedrock: 'anthropic.claude-3-opus-20240229-v1:0'
        }
      }
    },
    app: {
      name: 'Moments',
      description: 'AI Business Intelligence Dashboard',
      version: '0.1.0',
      processing: {
        max_file_size_mb: 10,
        cache_enabled: true,
        cache_ttl_seconds: 3600
      },
      ui: {
        items_per_page: 20,
        enable_search: true,
        enable_filters: true
      }
    },
    factors: {
      micro: ['company', 'competition', 'partners', 'customers'],
      macro: ['economic', 'geo_political', 'regulation', 'technology', 'environment', 'supply_chain']
    },
    agents: {
      content_analyzer: {
        enabled: true,
        model: 'sonnet',
        temperature: 0.3
      },
      classification_agent: {
        enabled: true,
        model: 'sonnet',
        temperature: 0.2
      },
      correlation_engine: {
        enabled: true,
        model: 'sonnet',
        temperature: 0.4
      },
      report_generator: {
        enabled: true,
        model: 'sonnet',
        temperature: 0.5
      }
    }
  }
}

// Client-side config loader (for browser environments)
export async function loadConfigClient(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    const response = await fetch('/api/config')
    if (!response.ok) {
      throw new Error('Failed to load configuration')
    }
    cachedConfig = await response.json()
    return cachedConfig!
  } catch (error) {
    console.error('Error loading configuration:', error)
    return getDefaultConfig()
  }
}

export function getCatalogConfig(config: Config, type: 'companies' | 'technologies') {
  return config.catalogs[type]
}

export function getAppConfig(config: Config) {
  return config.app
}

export function getFactorsConfig(config: Config) {
  return config.factors
}

export function getAgentConfig(config: Config, agent: keyof Config['agents']) {
  return config.agents[agent]
}

export function getModelProviderConfig(config: Config) {
  return config.model_provider
}