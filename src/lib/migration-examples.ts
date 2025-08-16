/**
 * Migration Examples for Provider-Aware Sub-Agent Manager
 * Demonstrates how to migrate from legacy SubAgentManager to ProviderAwareSubAgentManager
 */

import { 
  SubAgentManager, 
  createSubAgentManager,
  ProviderAwareSubAgentManager,
  createProviderAwareSubAgentManager,
  createSubAgentManagerWithProvider
} from './sub-agents'
import { AgentConfig, SubAgentConfigs } from '@/types/moments'
import { PivotalMoment } from '@/types/moments'

// Example configurations for demonstration
const exampleConfigs: SubAgentConfigs = {
  content_analyzer: {
    enabled: true,
    model: 'sonnet',
    temperature: 0.3,
    parallel_batch_size: 10,
    enable_parallel_batches: true
  },
  classification_agent: {
    enabled: true,
    model: 'sonnet',
    temperature: 0.2,
    parallel_batch_size: 10,
    enable_parallel_batches: true
  },
  correlation_engine: {
    enabled: true,
    model: 'sonnet',
    temperature: 0.4,
    parallel_batch_size: 15,
    enable_parallel_batches: true
  },
  report_generator: {
    enabled: true,
    model: 'sonnet',
    temperature: 0.5,
    parallel_batch_size: 5,
    enable_parallel_batches: false
  }
}

/**
 * Migration Example 1: Basic Migration
 * Shows how to migrate from legacy to provider-aware manager
 */
export class BasicMigrationExample {
  
  /**
   * BEFORE: Legacy SubAgentManager usage
   * Direct Anthropic SDK dependency, no provider abstraction
   */
  static legacyApproach(): SubAgentManager {
    // OLD WAY - Direct Anthropic only, no provider abstraction
    const manager = createSubAgentManager(
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      exampleConfigs
    )
    
    console.warn('Using legacy SubAgentManager - consider migrating to ProviderAwareSubAgentManager')
    return manager
  }

  /**
   * AFTER: Provider-Aware SubAgentManager usage
   * Multi-provider support with automatic configuration
   */
  static async modernApproach(): Promise<ProviderAwareSubAgentManager> {
    // NEW WAY - Multi-provider support with automatic configuration
    const manager = await createProviderAwareSubAgentManager(
      exampleConfigs,     // Agent configurations
      undefined,          // Model provider config (auto-loaded from config.yml)
      true               // Enable automatic fallback between providers
    )
    
    console.info('Using ProviderAwareSubAgentManager with multi-provider support')
    return manager
  }
}

/**
 * Migration Example 2: Explicit Provider Selection
 * Shows how to explicitly choose between Anthropic and Bedrock
 */
export class ExplicitProviderExample {
  
  /**
   * Explicitly use Anthropic provider
   */
  static async useAnthropicProvider(): Promise<ProviderAwareSubAgentManager> {
    const manager = await createSubAgentManagerWithProvider(
      'anthropic',        // Force Anthropic provider
      exampleConfigs,     // Agent configurations
      false              // Disable fallback for explicit control
    )
    
    console.info('Using explicit Anthropic provider')
    return manager
  }

  /**
   * Explicitly use Bedrock provider
   */
  static async useBedrockProvider(): Promise<ProviderAwareSubAgentManager> {
    const manager = await createSubAgentManagerWithProvider(
      'bedrock',          // Force Bedrock provider
      exampleConfigs,     // Agent configurations
      false              // Disable fallback for explicit control
    )
    
    console.info('Using explicit Bedrock provider')
    return manager
  }

  /**
   * Use auto-detection with fallback
   */
  static async useAutoDetectionWithFallback(): Promise<ProviderAwareSubAgentManager> {
    const manager = await createProviderAwareSubAgentManager(
      exampleConfigs,     // Agent configurations
      undefined,          // Auto-load configuration
      true               // Enable automatic fallback
    )
    
    const status = manager.getProviderStatus()
    console.info('Provider status:', status)
    
    return manager
  }
}

/**
 * Migration Example 3: Advanced Features Demo
 * Shows new capabilities not available in legacy manager
 */
export class AdvancedFeaturesExample {
  
  /**
   * Demonstrate provider health checking and switching
   */
  static async demonstrateHealthChecking(): Promise<void> {
    const manager = await createProviderAwareSubAgentManager()
    
    // Check health of all providers
    const healthStatus = await manager.checkProviderHealth()
    console.log('Provider health status:', healthStatus)
    
    // Get current provider status
    const status = manager.getProviderStatus()
    console.log('Current provider status:', {
      primary: status.primary,
      fallback: status.fallback,
      autoFallback: status.autoFallback
    })
    
    // Manually switch providers if needed
    if (status.fallback) {
      const switched = await manager.switchProvider(
        status.primary.type === 'anthropic' ? 'bedrock' : 'anthropic'
      )
      console.log('Provider switch successful:', switched)
    }
  }

  /**
   * Demonstrate enhanced error handling and retry logic
   */
  static async demonstrateEnhancedErrorHandling(): Promise<void> {
    const manager = await createProviderAwareSubAgentManager()
    
    // Example moments for testing
    const testMoments: PivotalMoment[] = [
      {
        id: 'test-1',
        title: 'Test Moment',
        description: 'A test moment for demonstration',
        content: 'This is test content for moment analysis',
        classification: {
          microFactors: ['company'],
          macroFactors: ['technology'],
          confidence: 'medium',
          reasoning: 'Test classification for demonstration purposes',
          keywords: ['test', 'demonstration', 'company']
        },
        impact: { 
          score: 75,
          reasoning: 'Medium impact due to demonstration nature'
        },
        timeline: { 
          timeframe: '2024',
          isHistorical: false
        },
        source: { 
          type: 'company', 
          id: 'test-company', 
          name: 'Test Company',
          contentId: 'content-1',
          filePath: '/test/content-1.md'
        },
        entities: { companies: ['Test Company'], technologies: [], people: [], locations: [] },
        extractedAt: new Date(),
        metadata: { extractedAt: new Date(), version: '1.0' }
      }
    ]
    
    try {
      // Analyze with enhanced error handling
      const result = await manager.classifyMoments(testMoments, 5, true)
      
      if (result.success) {
        console.log('Analysis successful:', {
          provider: result.provider,
          model: result.model,
          usage: result.usage,
          processingTime: result.processingTime
        })
      } else {
        console.error('Analysis failed:', result.error)
      }
    } catch (error) {
      console.error('Unexpected error during analysis:', error)
    }
  }

  /**
   * Demonstrate usage tracking and cost monitoring
   */
  static async demonstrateUsageTracking(): Promise<void> {
    const manager = await createProviderAwareSubAgentManager()
    
    // Example content for analysis
    const testContent = [
      {
        id: 'content-1',
        name: 'Test Content',
        type: 'markdown' as const,
        content: 'AI startup announces $100M Series B funding round',
        path: '/test/content-1.md',
        lastModified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 1024
      }
    ]
    
    try {
      const result = await manager.analyzeContent(testContent)
      
      if (result.success && result.usage) {
        console.log('Usage statistics:', {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
          processingTime: result.processingTime,
          provider: result.provider
        })
        
        // Note: In a real implementation, you would save these statistics
        // to a usage tracking database for cost monitoring and analysis
      }
    } catch (error) {
      console.error('Content analysis error:', error)
    }
  }
}

/**
 * Migration Example 4: Configuration Migration
 * Shows how to migrate configuration from legacy to provider-aware setup
 */
export class ConfigurationMigrationExample {
  
  /**
   * Legacy configuration approach
   */
  static legacyConfiguration() {
    // OLD WAY - Hard-coded Anthropic configuration
    const legacyManager = createSubAgentManager(
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY, // Hard-coded API key
      {
        content_analyzer: {
          enabled: true,
          model: 'claude-3-5-sonnet-20241022', // Hard-coded model ID
          temperature: 0.3
        },
        classification_agent: {
          enabled: true,
          model: 'claude-3-5-sonnet-20241022', // Hard-coded model ID
          temperature: 0.2
        },
        correlation_engine: {
          enabled: true,
          model: 'claude-3-5-sonnet-20241022', // Hard-coded model ID
          temperature: 0.4
        },
        report_generator: {
          enabled: true,
          model: 'claude-3-5-sonnet-20241022', // Hard-coded model ID
          temperature: 0.5
        }
      }
    )
    
    return legacyManager
  }

  /**
   * Modern configuration approach
   */
  static async modernConfiguration(): Promise<ProviderAwareSubAgentManager> {
    // NEW WAY - Flexible configuration with logical model names
    const modernManager = await createProviderAwareSubAgentManager(
      {
        content_analyzer: {
          enabled: true,
          model: 'sonnet',           // Logical model name (auto-mapped to provider)
          temperature: 0.3,
          parallel_batch_size: 10,
          enable_parallel_batches: true
        },
        classification_agent: {
          enabled: true,
          model: 'sonnet',           // Logical model name
          temperature: 0.2,
          parallel_batch_size: 10,
          enable_parallel_batches: true
        },
        correlation_engine: {
          enabled: true,
          model: 'sonnet',           // Logical model name
          temperature: 0.4,
          parallel_batch_size: 15,
          enable_parallel_batches: true
        },
        report_generator: {
          enabled: true,
          model: 'haiku',            // Use cheaper model for simple reports
          temperature: 0.5,
          parallel_batch_size: 5,
          enable_parallel_batches: false
        }
      },
      // Configuration loaded automatically from config.yml
      undefined,
      // Enable automatic fallback between providers
      true
    )
    
    return modernManager
  }

  /**
   * Environment-specific configuration
   */
  static async environmentSpecificConfiguration(): Promise<ProviderAwareSubAgentManager> {
    // Determine provider based on environment
    const isProduction = process.env.NODE_ENV === 'production'
    const hasBedrockConfig = process.env.AWS_REGION || process.env.BEDROCK_API_KEY
    const hasAnthropicConfig = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
    
    let providerType: 'anthropic' | 'bedrock'
    
    if (isProduction && hasBedrockConfig) {
      // Use Bedrock in production for enterprise features
      providerType = 'bedrock'
    } else if (hasAnthropicConfig) {
      // Use Anthropic for development or when Bedrock not configured
      providerType = 'anthropic'
    } else {
      throw new Error('No AI provider configured. Please set up Anthropic or Bedrock credentials.')
    }
    
    const manager = await createSubAgentManagerWithProvider(
      providerType,
      {
        content_analyzer: {
          enabled: true,
          model: isProduction ? 'sonnet' : 'haiku', // Use cheaper model in dev
          temperature: 0.3,
          parallel_batch_size: isProduction ? 15 : 5,
          enable_parallel_batches: isProduction
        },
        classification_agent: {
          enabled: true,
          model: 'sonnet',
          temperature: 0.2,
          parallel_batch_size: isProduction ? 10 : 3,
          enable_parallel_batches: isProduction
        },
        correlation_engine: {
          enabled: true,
          model: 'sonnet',
          temperature: 0.4,
          parallel_batch_size: isProduction ? 20 : 5,
          enable_parallel_batches: isProduction
        },
        report_generator: {
          enabled: true,
          model: 'haiku', // Always use cheaper model for reports
          temperature: 0.5,
          parallel_batch_size: 3,
          enable_parallel_batches: false
        }
      },
      true // Enable fallback in all environments
    )
    
    console.info(`Initialized ${providerType} provider for ${isProduction ? 'production' : 'development'} environment`)
    return manager
  }
}

/**
 * Migration Utility Functions
 * Helper functions to ease migration process
 */
export class MigrationUtilities {
  
  /**
   * Check if current SubAgentManager is legacy or provider-aware
   */
  static isLegacyManager(manager: any): manager is SubAgentManager {
    return manager instanceof SubAgentManager && 
           typeof (manager as any).getProviderStatus !== 'function'
  }

  /**
   * Create a migration report showing differences
   */
  static async createMigrationReport(): Promise<{
    legacy: {
      capabilities: string[]
      limitations: string[]
    }
    providerAware: {
      capabilities: string[]
      newFeatures: string[]
    }
    migrationSteps: string[]
  }> {
    return {
      legacy: {
        capabilities: [
          'Direct Anthropic API integration',
          'Basic prompt management',
          'Simple error handling',
          'Single model provider'
        ],
        limitations: [
          'No provider abstraction',
          'No automatic failover',
          'No usage tracking',
          'No cost monitoring',
          'Limited error recovery',
          'Hard-coded model IDs'
        ]
      },
      providerAware: {
        capabilities: [
          'Multi-provider support (Anthropic + Bedrock)',
          'Automatic provider failover',
          'Enhanced error handling with retries',
          'Usage and cost tracking',
          'Health monitoring',
          'Logical model name mapping',
          'Parallel processing optimizations',
          'Provider-specific optimizations'
        ],
        newFeatures: [
          'Provider health checking',
          'Dynamic provider switching',
          'Comprehensive usage statistics',
          'Enhanced parallel processing',
          'Automatic retry with exponential backoff',
          'Configuration-driven model selection',
          'Enterprise authentication support'
        ]
      },
      migrationSteps: [
        '1. Update imports to include ProviderAwareSubAgentManager',
        '2. Replace createSubAgentManager() with createProviderAwareSubAgentManager()',
        '3. Update configuration to use logical model names (sonnet, haiku, opus)',
        '4. Configure model provider settings in config.yml',
        '5. Set up environment variables for chosen provider(s)',
        '6. Test provider switching and fallback mechanisms',
        '7. Implement usage tracking and monitoring',
        '8. Update error handling to leverage enhanced capabilities'
      ]
    }
  }

  /**
   * Validate migration readiness
   */
  static async validateMigrationReadiness(): Promise<{
    isReady: boolean
    checklist: Array<{
      item: string
      status: 'pass' | 'fail' | 'warning'
      message: string
    }>
  }> {
    const checklist: Array<{
      item: string
      status: 'pass' | 'fail' | 'warning'
      message: string
    }> = []
    let isReady = true

    // Check for provider configuration
    const hasAnthropicKey = !!(process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY)
    const hasBedrockConfig = !!(process.env.AWS_REGION || process.env.BEDROCK_API_KEY)
    
    checklist.push({
      item: 'Provider Configuration',
      status: (hasAnthropicKey || hasBedrockConfig) ? 'pass' : 'fail',
      message: hasAnthropicKey || hasBedrockConfig 
        ? 'At least one provider is configured'
        : 'No provider credentials found. Configure ANTHROPIC_API_KEY or AWS credentials.'
    })

    if (!hasAnthropicKey && !hasBedrockConfig) {
      isReady = false
    }

    // Check for config file
    try {
      const { loadConfigClient } = await import('./config-loader.client')
      const config = await loadConfigClient()
      
      checklist.push({
        item: 'Configuration File',
        status: 'pass',
        message: 'config.yml loaded successfully'
      })

      // Check model provider configuration
      if (config.model_provider) {
        checklist.push({
          item: 'Model Provider Config',
          status: 'pass',
          message: `Model provider configured: ${config.model_provider.type}`
        })
      } else {
        checklist.push({
          item: 'Model Provider Config',
          status: 'warning',
          message: 'No model_provider section in config.yml. Will use defaults.'
        })
      }
    } catch (error) {
      checklist.push({
        item: 'Configuration File',
        status: 'warning',
        message: 'Could not load config.yml. Will use defaults.'
      })
    }

    // Check for required dependencies
    try {
      await import('./model-providers/provider-factory')
      checklist.push({
        item: 'Provider Dependencies',
        status: 'pass',
        message: 'All provider dependencies available'
      })
    } catch (error) {
      checklist.push({
        item: 'Provider Dependencies',
        status: 'fail',
        message: 'Provider abstraction dependencies missing'
      })
      isReady = false
    }

    return { isReady, checklist }
  }
}

// Export all examples for easy access
export const MigrationExamples = {
  Basic: BasicMigrationExample,
  ExplicitProvider: ExplicitProviderExample,
  AdvancedFeatures: AdvancedFeaturesExample,
  Configuration: ConfigurationMigrationExample,
  Utilities: MigrationUtilities
}