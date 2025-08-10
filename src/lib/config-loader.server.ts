import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'
import { Config } from './config-types'

let cachedConfig: Config | null = null

export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    // First load the default config
    const configPath = path.join(process.cwd(), 'config.yml')
    const fileContents = fs.readFileSync(configPath, 'utf8')
    let config = yaml.load(fileContents) as Config
    
    // Check for local overrides
    const localConfigPath = path.join(process.cwd(), 'config.local.yml')
    if (fs.existsSync(localConfigPath)) {
      const localContents = fs.readFileSync(localConfigPath, 'utf8')
      const localConfig = yaml.load(localContents) as Partial<Config>
      // Deep merge local config with default config
      config = deepMerge(config, localConfig)
      console.log('Loaded local configuration overrides from config.local.yml')
    }
    
    cachedConfig = config
    return cachedConfig
  } catch (error) {
    console.error('Error loading config.yml:', error)
    // Return default config if file doesn't exist or is invalid
    return getDefaultConfig()
  }
}

// Simple deep merge function for configuration objects
function deepMerge(target: any, source: any): any {
  const output = { ...target }
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key]
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        output[key] = source[key]
      }
    })
  }
  
  return output
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item)
}

export const loadConfigServer = loadConfig

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
      },
      moments: {
        name: 'Moments',
        description: 'Pivotal business moments extracted and analyzed by AI',
        source_folders: ['./moments'],
        default_folder: './moments',
        file_patterns: ['*.md', '*.mdx'],
        metadata_format: 'frontmatter' as const,
        auto_save: true,
        sync_mode: 'bidirectional' as const
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