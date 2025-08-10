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
        model: 'claude-3-sonnet',
        temperature: 0.3
      },
      classification_agent: {
        enabled: true,
        model: 'claude-3-sonnet',
        temperature: 0.2
      },
      correlation_engine: {
        enabled: true,
        model: 'claude-3-sonnet',
        temperature: 0.4
      },
      report_generator: {
        enabled: true,
        model: 'claude-3-sonnet',
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