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

### 3. [ ] Implement AWS Bedrock Authentication
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

### 4. [ ] Update Sub-Agent Manager for Provider Abstraction
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

### 5. [ ] Create Provider Configuration UI Component
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

### 6. [ ] Implement Model ID Translation System
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

### 7. [ ] Add Claude Code SDK Integration for Both Providers
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