# Backlog - Amazon Bedrock and Model Provider Configuration

## Overview
This backlog defines implementation items for configurable model provider switching between Amazon Bedrock and Anthropic API, enabling flexible deployment options for the Moments application's AI capabilities.

## Implementation Items

### 1. [x] Create Model Provider Abstraction Layer
Create a unified model provider interface that abstracts the differences between Anthropic API and Amazon Bedrock, allowing seamless switching between providers.

**Requirements:**
- Define `ModelProvider` interface with common methods for all AI operations
- Create `AnthropicProvider` class implementing direct Anthropic API calls
- Create `BedrockProvider` class implementing AWS Bedrock API calls
- Support for Claude Sonnet, Claude Haiku, and Claude Opus models
- Handle authentication differences (API key vs AWS credentials)
- Implement retry logic and error handling for both providers

**Files to modify/create:**
- Create `src/lib/model-providers/provider-interface.ts`
- Create `src/lib/model-providers/anthropic-provider.ts`
- Create `src/lib/model-providers/bedrock-provider.ts`
- Create `src/lib/model-providers/provider-factory.ts`

**Completion Summary:**
Successfully created a comprehensive model provider abstraction layer that enables seamless switching between Anthropic and Amazon Bedrock providers. The implementation includes:
- **ModelProvider Interface**: Abstract base class defining common methods for all providers including sendRequest, streamRequest, healthCheck, validateAuth, and cost estimation
- **AnthropicProvider**: Full implementation supporting direct Anthropic API calls with browser compatibility, beta features, and prompt caching
- **BedrockProvider**: Complete AWS Bedrock integration supporting multiple authentication methods (AWS profiles, environment variables, Bedrock API keys)
- **ModelProviderFactory**: Factory pattern implementation for provider instantiation with automatic fallback support and environment detection
- **Error Handling**: Specialized error classes for authentication, rate limiting, and general provider errors
- **Model Mapping**: Automatic translation between logical model names (sonnet, haiku, opus) and provider-specific model IDs
- **Cost Tracking**: Built-in cost estimation methods for both providers with current pricing models
- **Health Monitoring**: Provider health check capabilities for automatic failover scenarios
- Installed required AWS SDK dependencies (@aws-sdk/client-bedrock-runtime, @aws-sdk/credential-providers)

### 2. [x] Extend Configuration Schema for Provider Selection
Update the configuration system to support model provider selection and provider-specific settings.

**Requirements:**
- Add `model_provider` section to config.yml schema
- Support provider type selection (`anthropic` | `bedrock`)
- Add AWS region configuration for Bedrock
- Support model ID mapping for different providers
- Add authentication configuration options
- Support environment variable overrides

**Configuration structure:**
```yaml
model_provider:
  type: "anthropic" # or "bedrock"
  
  anthropic:
    api_key_env: "ANTHROPIC_API_KEY"
    base_url: "https://api.anthropic.com"
    
  bedrock:
    aws_region: "us-east-1"
    aws_profile: "default" # optional
    use_bedrock_api_key: false # use Bedrock API keys instead of AWS credentials
    inference_profile: null # optional cross-region inference profile
    
  model_mapping:
    # Map logical model names to provider-specific model IDs
    sonnet:
      anthropic: "claude-3-5-sonnet-20241022"
      bedrock: "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
    haiku:
      anthropic: "claude-3-5-haiku-20241022"
      bedrock: "us.anthropic.claude-3-5-haiku-20241022-v1:0"
    opus:
      anthropic: "claude-3-opus-20240229"
      bedrock: "anthropic.claude-3-opus-20240229-v1:0"
```

**Files to modify:**
- Update `src/lib/config-types.ts` with ModelProviderConfig interface
- Update `src/lib/config-loader.server.ts` to load provider configuration
- Update `config.yml` with default provider configuration

**Completion Summary:**
Successfully extended configuration schema for provider selection including: 1) **config.yml Enhancement** - Added comprehensive model_provider section with type selection (anthropic/bedrock), complete Anthropic API configuration (api_key_env, base_url), full Bedrock configuration (aws_region, aws_profile, use_bedrock_api_key, inference_profile), and detailed model mapping for logical model names (sonnet, haiku, opus) to provider-specific model IDs, 2) **TypeScript Interface Implementation** - Created ModelProviderConfig interface with AnthropicProviderConfig, BedrockProviderConfig, and ModelMapping interfaces, updated main Config interface to include optional model_provider field, ensured type safety with proper optional fields and null handling for inference_profile, 3) **Configuration Loader Updates** - Updated both server-side (config-loader.server.ts) and client-side (config-loader.client.ts) configuration loaders to include model_provider in default configuration, added getModelProviderConfig() helper function for easy access to provider settings, maintained backward compatibility with existing configuration loading, 4) **Validation and Testing** - Successfully validated YAML configuration loading with both Anthropic and Bedrock provider types, confirmed TypeScript compilation success with npm run type-check, tested configuration structure with different provider settings (aws_region: us-west-2, use_bedrock_api_key: true), verified model mapping access and type safety throughout the system, 5) **Build Integration** - Ensured npm run build completes successfully with new configuration schema, confirmed API endpoint (/api/config) automatically serves enhanced configuration including model_provider section, maintained all existing functionality while adding provider selection capabilities. The implementation provides complete foundation for seamless switching between Anthropic and Amazon Bedrock providers with comprehensive configuration support, type safety, and backward compatibility.

### 3. [x] Implement AWS Bedrock Authentication
Add support for multiple AWS authentication methods for Bedrock integration.

**Requirements:**
- Support AWS CLI configuration (`~/.aws/credentials`)
- Support environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
- Support AWS SSO profiles
- Support Bedrock API keys (new authentication method)
- Support IAM role assumption
- Validate required permissions (bedrock:InvokeModel, bedrock:InvokeModelWithResponseStream)

**Files to create/modify:**
- Create `src/lib/auth/bedrock-auth.ts`
- Create `src/lib/auth/auth-validator.ts`
- Update `.env.example` with AWS configuration examples

**Completion Summary:**
Successfully implemented comprehensive AWS Bedrock authentication system including: 1) **BedrockAuth Class** - Created comprehensive authentication class (`src/lib/auth/bedrock-auth.ts`) supporting 6 authentication methods: AWS CLI configuration with profile support, environment variables (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY), AWS SSO with start URL and role configuration, Bedrock API keys (new authentication method), IAM role assumption with external ID support, and automatic detection trying methods in preference order, 2) **Authentication Validation** - Implemented detailed permission validation for bedrock:InvokeModel and bedrock:InvokeModelWithResponseStream permissions using actual API calls, AWS STS GetCallerIdentity integration for identity verification, comprehensive error handling with specific authentication failure reasons, and detailed validation results including identity information (ARN, User ID, Account) and permission status for required Bedrock operations, 3) **AuthValidator Class** - Built universal authentication validator (`src/lib/auth/auth-validator.ts`) supporting both Anthropic and Bedrock providers with comprehensive validation workflows, provider-specific error handling and troubleshooting suggestions, authentication status reporting with detailed recommendations, and multi-provider validation for hybrid deployment scenarios, 4) **Environment Configuration** - Created comprehensive `.env.example` file with detailed examples for all authentication methods, security best practices documentation, configuration examples by use case (local development, production, enterprise SSO, CI/CD), and comprehensive environment variable documentation for AWS regions, credentials, SSO, role assumption, and Bedrock-specific settings, 5) **BedrockProvider Integration** - Enhanced existing BedrockProvider to use new authentication system replacing basic credential handling with comprehensive BedrockAuth integration, added authentication status checking with detailed permission validation, support for dynamic authentication configuration updates, and extensive authentication method discovery and troubleshooting capabilities, 6) **AWS SDK Dependencies** - Installed required AWS SDK packages (@aws-sdk/client-sts for identity validation), updated all dependencies for comprehensive AWS authentication support, and ensured TypeScript compilation success with proper type safety throughout authentication pipeline, 7) **Permission Validation** - Implemented real-time permission testing using minimal API calls to validate bedrock:InvokeModel and bedrock:InvokeModelWithResponseStream permissions, comprehensive error classification (AccessDenied, UnrecognizedClient, ThrottlingException), and detailed permission status reporting for troubleshooting authentication issues, 8) **Configuration Flexibility** - Support for BEDROCK_AUTH_METHOD environment variable to override authentication method selection, dynamic configuration updates without provider re-initialization, comprehensive authentication method documentation with requirements and use cases, and production-ready authentication flows for enterprise deployment scenarios. The implementation provides enterprise-grade AWS Bedrock authentication with comprehensive support for all major AWS authentication patterns, detailed permission validation, extensive error handling and troubleshooting guidance, and seamless integration with existing provider abstraction layer.

### 4. [x] Update Sub-Agent Manager for Provider Abstraction
Refactor the existing SubAgentManager to use the new provider abstraction layer instead of direct Anthropic SDK calls.

**Requirements:**
- Replace direct Anthropic SDK usage with provider abstraction
- Support dynamic provider selection based on configuration
- Maintain backward compatibility with existing code
- Add provider health check and fallback mechanism
- Implement provider-specific optimizations (e.g., Bedrock inference profiles)

**Files to modify:**
- Update `src/lib/sub-agents.ts` to use provider abstraction
- Create `src/lib/sub-agents-provider-aware.ts` as enhanced version
- Update agent initialization to select provider

**Completion Summary:**
Successfully refactored SubAgentManager for provider abstraction including: 1) **ProviderAwareSubAgentManager Class** - Created comprehensive new manager (`src/lib/sub-agents-provider-aware.ts`) that uses ModelProvider abstraction instead of direct Anthropic SDK calls, supporting dynamic provider selection based on configuration, automatic provider failover with health monitoring, enhanced error handling with exponential backoff retries, and comprehensive usage tracking with token counts and processing times, 2) **Backward Compatibility** - Updated original SubAgentManager (`src/lib/sub-agents.ts`) with deprecation warnings while maintaining full backward compatibility, added re-exports of new provider-aware functions for easy migration, and provided clear migration path guidance with examples, 3) **Enhanced Features** - Implemented provider health checking with automatic failover, dynamic provider switching capabilities (switchProvider method), comprehensive usage and cost tracking with detailed statistics, parallel processing optimizations with configurable batch sizes, and provider-specific optimizations support, 4) **Configuration Integration** - Seamless integration with existing config.yml model provider settings, support for logical model names (sonnet, haiku, opus) with automatic provider-specific mapping, environment-based provider auto-detection, and flexible authentication method selection, 5) **Migration Support** - Created comprehensive migration examples (`src/lib/migration-examples.ts`) with before/after code samples, detailed feature comparison documentation, migration readiness validation utilities, and environment-specific configuration examples, 6) **Type System Updates** - Extended AgentConfig interface to include parallel_batch_size and enable_parallel_batches properties, added metadata field to PivotalMoment interface for enhanced tracking, updated moment file processor to handle new metadata requirements, and ensured complete TypeScript type safety throughout the system, 7) **Production Integration** - Updated moments store (`src/store/moments-store.ts`) to use new provider-aware manager, successful TypeScript compilation and Next.js build verification, comprehensive error handling for both authentication and API call failures, and maintained all existing functionality while adding multi-provider capabilities. The implementation provides a complete migration path from legacy Anthropic-only approach to a flexible multi-provider system supporting both Anthropic and Amazon Bedrock with automatic failover, enhanced monitoring, and comprehensive usage tracking while maintaining full backward compatibility.

### 5. [x] Create Provider Configuration UI Component
Build a settings interface for users to configure and test model provider settings.

**Requirements:**
- Provider selection dropdown (Anthropic/Bedrock)
- Dynamic form fields based on selected provider
- AWS region selector for Bedrock
- Model mapping configuration
- Test connection button with validation
- Save configuration to config.yml
- Display current provider status and costs

**Components to create:**
- Create `src/components/settings/provider-config.tsx`
- Create `src/components/settings/provider-test.tsx`
- Update `src/components/settings-content.tsx` to include provider config

**Completion Summary:**
Successfully created a comprehensive provider configuration UI component that enables seamless switching between Anthropic and Amazon Bedrock providers. The implementation includes:
1. **ProviderConfig Component** (`src/components/settings/provider-config.tsx`) - Main configuration interface with provider selection dropdown, dynamic form fields for Anthropic (API key env, base URL) and Bedrock (AWS region, profile, API keys, inference profile), model mapping configuration for sonnet/haiku/opus models, test connection functionality with detailed status display, save configuration with validation and feedback
2. **ProviderTest Component** (`src/components/settings/provider-test.tsx`) - Comprehensive testing interface with model selection (haiku, sonnet, opus), customizable test prompts, single provider testing with latency and cost metrics, dual provider comparison testing, detailed test results display with performance metrics, cost breakdown and comparison summary
3. **Settings Integration** - Updated `src/components/settings-content.tsx` to include new provider section, added provider configuration state management, integrated configuration loading and saving logic, added provider-specific message handling
4. **API Endpoints** - Created `/api/provider/config` for saving/loading provider configuration to config.yml, created `/api/provider/test` for testing provider connections with full authentication validation
5. **UI Components** - Added complete Radix UI component set (Select, Input, Label, Switch, Textarea), proper TypeScript typing and accessibility features, consistent styling with existing UI patterns
6. **Type Safety** - Full TypeScript support with proper interface definitions, validated against existing provider factory implementation, error handling for all edge cases
The implementation provides a production-ready UI for configuring and testing both Anthropic and Amazon Bedrock providers with real-time validation, cost estimation, and performance comparison capabilities.

### 6. [x] Implement Model ID Translation System
Create a system to translate logical model names to provider-specific model IDs.

**Requirements:**
- Map generic model names (sonnet, haiku, opus) to provider-specific IDs
- Support version management (e.g., different Claude versions)
- Handle model availability by region (for Bedrock)
- Provide fallback models if primary is unavailable
- Cache model availability checks

**Files to create:**
- Create `src/lib/model-mapping/model-translator.ts`
- Create `src/lib/model-mapping/model-availability.ts`
- Create `src/types/model-provider.ts` for type definitions

**Completion Summary:**
Successfully implemented comprehensive Model ID Translation System that enables seamless provider switching with logical model names including: 1) **Comprehensive Type System** - Created complete TypeScript type definitions (`src/types/model-provider.ts`) with LogicalModelName, ProviderType, ModelMappingConfig, ModelAvailability, ModelTranslationResult, and comprehensive error types for robust type safety throughout the model mapping system, 2) **ModelTranslator Class** - Built sophisticated model translator (`src/lib/model-mapping/model-translator.ts`) supporting logical name to provider-specific ID translation with intelligent caching using LRU eviction and configurable TTL, automatic fallback support with configurable fallback chains, model validation and configuration checking, batch translation for multiple models simultaneously, comprehensive statistics tracking with cache hit rates and translation times, and global translator instance with convenience functions for easy integration, 3) **ModelAvailabilityChecker** - Implemented regional availability checker (`src/lib/model-mapping/model-availability.ts`) with cross-region model availability validation, provider-specific model catalog generation, model capability detection and cost estimation, intelligent caching with expiration handling, model access validation with real API testing, performance metrics tracking for latency and throughput, and comprehensive error handling with graceful degradation, 4) **Configuration Integration** - Updated config.yml to use logical model names (sonnet, haiku, opus) instead of hard-coded provider-specific IDs, integrated model mapping configuration with provider-specific model ID definitions, updated agent configurations to use logical names enabling automatic translation, and ensured backward compatibility with existing provider-specific model IDs, 5) **Provider-Aware Integration** - Enhanced ProviderAwareSubAgentManager with automatic model translation using translateModelId method, integrated model translator into sendProviderRequest for both primary and fallback providers, added comprehensive logging for translation debugging and monitoring, and maintained full compatibility with existing agent configuration system, 6) **Advanced Features** - Implemented intelligent fallback chains for model availability issues, comprehensive model validation with detailed error reporting and suggestions, model recommendation system based on use case (analysis, classification, correlation, generation), cache management with statistics and efficiency monitoring, and batch processing support for high-throughput scenarios, 7) **Production Ready** - Complete TypeScript type safety with successful compilation verification, comprehensive error handling with graceful fallback to original model names, efficient caching system reducing API calls and translation overhead, detailed logging and monitoring for debugging and performance tracking, and seamless integration with existing provider abstraction layer maintaining zero-breaking changes. The implementation now enables true zero-code provider switching where users can change model_provider.type from 'anthropic' to 'bedrock' in config.yml and all agent configurations automatically resolve to the correct provider-specific model IDs through the logical name mapping system.

### 7. [x] Add Claude Code SDK Integration for Both Providers
Integrate the Claude Code SDK to work with both Anthropic and Bedrock providers.

**Requirements:**
- Create ClaudeSDKClient wrapper supporting both providers
- Implement session management for multi-turn conversations
- Support streaming responses from both providers
- Handle provider-specific response formats
- Implement automatic prompt caching

**SDK Integration Pattern:**
```typescript
// Example usage with provider abstraction
const client = new ClaudeSDKClient({
  provider: config.model_provider.type,
  providerConfig: config.model_provider[config.model_provider.type],
  options: {
    system_prompt: "You are a specialized AI agent",
    max_turns: 5
  }
})

const response = await client.query("Analyze this moment")
```

**Files to create:**
- Create `src/lib/claude-sdk/client-wrapper.ts`
- Create `src/lib/claude-sdk/provider-adapter.ts`
- Create `src/lib/claude-sdk/session-manager.ts`

**Completion Summary:**
Successfully implemented comprehensive Claude Code SDK integration supporting both Anthropic and Bedrock providers including: 1) **ClaudeSDKClient Wrapper** - Created unified client wrapper (`src/lib/claude-sdk/client-wrapper.ts`) supporting both providers with seamless provider switching, multi-turn conversation management, session persistence with automatic session ID generation, query and streaming interfaces with automatic fallback support, cost tracking and usage monitoring, provider health checking, and complete session export/import capabilities, 2) **Session Management System** - Built sophisticated session manager (`src/lib/claude-sdk/session-manager.ts`) with localStorage and memory persistence options, multi-turn conversation context preservation, session analytics and statistics tracking, automatic session cleanup and expiration handling, workflow history management, and comprehensive session export for analysis and debugging, 3) **Provider Adapter Layer** - Implemented provider adapter (`src/lib/claude-sdk/provider-adapter.ts`) standardizing provider interactions with unified request/response formats, intelligent response caching with LRU eviction, provider-specific optimization support, multi-provider adapter for automatic failover, comprehensive error handling and provider validation, and performance optimization with caching statistics and hit rate monitoring, 4) **Automatic Prompt Caching** - Created advanced prompt cache (`src/lib/claude-sdk/prompt-cache.ts`) with intelligent cache key generation from request parameters, LRU eviction with configurable cache sizes and TTL, localStorage persistence with compression support, comprehensive cache statistics and efficiency metrics, automatic cleanup of expired entries, and cache export/import for backup and analysis, 5) **Enhanced Sub-Agent Manager** - Built enhanced sub-agent manager (`src/lib/claude-sdk/enhanced-sub-agent-manager.ts`) integrating Claude Code SDK with existing agent workflows, supporting multi-agent workflow execution with parallel and sequential processing, session-based agent conversations with context preservation, streaming responses and real-time progress tracking, comprehensive analytics and cost tracking, and provider switching capabilities for dynamic configuration, 6) **TypeScript Integration** - Complete TypeScript type safety with comprehensive interfaces for all SDK components, proper error handling and provider fallback mechanisms, seamless integration with existing model provider abstraction layer, compatibility with current AgentConfig and SubAgentConfigs interfaces, and successful compilation verification with npm run type-check, 7) **Advanced Features** - Workflow orchestration supporting parallel and sequential agent execution with dependency management, real-time streaming responses with chunk-based processing, intelligent cost optimization with automatic caching and provider selection, session persistence across browser sessions with automatic recovery, comprehensive analytics including usage patterns, cost tracking, and performance metrics, and provider health monitoring with automatic failover and recovery mechanisms. The implementation provides enterprise-grade Claude Code SDK integration with multi-provider support, advanced session management, intelligent caching, and comprehensive workflow orchestration capabilities while maintaining full compatibility with existing Moments application architecture and provider abstraction patterns.


### 8. [ ] Implement Cost Tracking and Optimization
Add cost tracking for both Anthropic and Bedrock usage with optimization recommendations.

**Requirements:**
- Track token usage per provider and model
- Calculate costs based on provider pricing
- Store usage history for analysis
- Provide cost comparison between providers
- Suggest optimizations (e.g., use Haiku for simple tasks)
- Monthly budget alerts

**Files to create:**
- Create `src/lib/cost-tracking/usage-tracker.ts`
- Create `src/lib/cost-tracking/cost-calculator.ts`
- Create `src/components/settings/usage-dashboard.tsx`

### 9. [ ] Add Environment-Specific Provider Selection
Implement automatic provider selection based on deployment environment.

**Requirements:**
- Use Anthropic for local development (simpler setup)
- Use Bedrock for production deployments (enterprise features)
- Support override via environment variables
- Automatic fallback if primary provider fails
- Log provider selection decisions

**Environment variables:**
```bash
# Force specific provider regardless of config
MOMENTS_PROVIDER_OVERRIDE=bedrock

# Bedrock-specific overrides
CLAUDE_CODE_USE_BEDROCK=1
AWS_REGION=us-east-1

# Token configuration
CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096
MAX_THINKING_TOKENS=1024
```

**Files to modify:**
- Update `src/lib/config-loader.server.ts` with environment detection
- Create `src/lib/provider-selector.ts` for selection logic
- Update `.env.example` with all provider options

### 10. [ ] Create Provider Migration Tools
Build utilities to help users migrate between providers.

**Requirements:**
- Configuration migration wizard
- API key to AWS credential setup guide
- Model mapping verification tool
- Test suite to verify functionality across providers
- Performance comparison tool
- Migration checklist component

**Files to create:**
- Create `src/tools/provider-migration.ts`
- Create `src/components/settings/migration-wizard.tsx`
- Create `docs/provider-migration-guide.md`

### 11. [ ] Implement Provider-Specific Optimizations
Add optimizations specific to each provider for better performance.

**Requirements:**
- **Anthropic optimizations:**
  - Automatic prompt caching
  - Beta feature flags support
  - Direct API streaming
  
- **Bedrock optimizations:**
  - Cross-region inference profiles
  - Model inference optimization
  - Batch inference for large workloads
  - GuardRails integration for content filtering

**Files to create:**
- Create `src/lib/optimizations/anthropic-optimizer.ts`
- Create `src/lib/optimizations/bedrock-optimizer.ts`
- Update provider implementations with optimization hooks

### 12. [ ] Add Provider Health Monitoring
Implement health checks and monitoring for both providers.

**Requirements:**
- Periodic health checks
- Latency monitoring
- Error rate tracking
- Automatic failover on provider issues
- Alert system for provider outages
- Historical uptime tracking

**Files to create:**
- Create `src/lib/monitoring/provider-health.ts`
- Create `src/lib/monitoring/failover-manager.ts`
- Create `src/components/settings/provider-status.tsx`

### 13. [ ] Create Integration Tests for Multi-Provider Support
Build comprehensive test suite for provider abstraction.

**Requirements:**
- Unit tests for each provider implementation
- Integration tests for provider switching
- Mock providers for testing
- Performance benchmarks
- Cost calculation verification
- Error handling scenarios

**Files to create:**
- Create `tests/providers/anthropic-provider.test.ts`
- Create `tests/providers/bedrock-provider.test.ts`
- Create `tests/providers/provider-switching.test.ts`
- Create `tests/mocks/mock-providers.ts`

### 14. [ ] Add Provider Documentation
Create comprehensive documentation for provider configuration and usage.

**Requirements:**
- Setup guide for each provider
- Configuration examples
- Troubleshooting guide
- Cost optimization tips
- Security best practices
- Migration scenarios

**Files to create:**
- Create `docs/providers/anthropic-setup.md`
- Create `docs/providers/bedrock-setup.md`
- Create `docs/providers/configuration-guide.md`
- Create `docs/providers/troubleshooting.md`

### 15. [ ] Implement Provider-Agnostic Caching Layer
Create a caching system that works across providers to reduce API calls and costs.

**Requirements:**
- Cache responses based on prompt hash
- Respect cache TTL from configuration
- Provider-specific cache key generation
- Cache statistics and hit rate monitoring
- Manual cache invalidation options
- Export/import cache for development

**Files to create:**
- Create `src/lib/caching/response-cache.ts`
- Create `src/lib/caching/cache-manager.ts`
- Create `src/components/settings/cache-management.tsx`

## Implementation Priority

### Phase 1: Core Abstraction (Items 1-4)
- Create provider abstraction layer
- Extend configuration schema
- Implement authentication
- Update SubAgentManager

### Phase 2: Configuration & UI (Items 5-7)
- Build configuration UI
- Implement model translation
- Add Claude Code SDK integration

### Phase 3: Optimization & Monitoring (Items 8-12)
- Cost tracking
- Environment-specific selection
- Provider optimizations
- Health monitoring

### Phase 4: Polish & Documentation (Items 13-15)
- Integration tests
- Documentation
- Caching layer

## Success Criteria

1. **Seamless Provider Switching**: Users can switch between Anthropic and Bedrock with configuration change only
2. **Cost Transparency**: Clear visibility into costs for each provider
3. **Performance Parity**: Similar performance regardless of provider
4. **Zero Code Changes**: Existing application code works without modification
5. **Enterprise Ready**: Full support for Bedrock's enterprise features
6. **Developer Friendly**: Easy local development with Anthropic, easy production deployment with Bedrock

## Configuration Examples

### Local Development (Anthropic)
```yaml
model_provider:
  type: "anthropic"
  anthropic:
    api_key_env: "ANTHROPIC_API_KEY"
```

### Production Deployment (Bedrock)
```yaml
model_provider:
  type: "bedrock"
  bedrock:
    aws_region: "us-east-1"
    use_bedrock_api_key: true
```

### Hybrid with Fallback
```yaml
model_provider:
  type: "bedrock"
  fallback_provider: "anthropic"
  auto_fallback: true
```

## Notes

- Maintain backward compatibility with existing `NEXT_PUBLIC_ANTHROPIC_API_KEY` configuration
- Consider security implications of storing AWS credentials
- Implement gradual rollout to test Bedrock integration
- Monitor cost differences between providers
- Document breaking changes if any