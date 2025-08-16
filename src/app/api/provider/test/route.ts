import { NextRequest, NextResponse } from 'next/server'
import { ModelProviderFactory } from '@/lib/model-providers/provider-factory'
import type { ModelProviderConfig } from '@/lib/config-types'

interface TestRequest {
  config: ModelProviderConfig
  model: 'sonnet' | 'haiku' | 'opus'
  prompt: string
}

export async function POST(request: NextRequest) {
  try {
    const { config, model, prompt }: TestRequest = await request.json()
    
    // Create provider instance with model mapping from config
    const provider = ModelProviderFactory.createProvider(
      config.type,
      {
        region: config.bedrock?.aws_region,
        profile: config.bedrock?.aws_profile,
        useBedrockApiKey: config.bedrock?.use_bedrock_api_key,
        inferenceProfile: config.bedrock?.inference_profile || undefined,
        apiKeyEnv: config.anthropic?.api_key_env,
        baseUrl: config.anthropic?.base_url,
      },
      config.model_mapping
    )
    
    // Validate authentication
    const authValid = await provider.validateAuth()
    if (!authValid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication failed',
          details: 'Please check your API credentials and try again',
        },
        { status: 401 }
      )
    }
    
    // Health check
    const healthResult = await provider.healthCheck()
    if (!healthResult.isHealthy) {
      return NextResponse.json(
        { 
          success: false,
          error: healthResult.error || 'Health check failed',
        },
        { status: 503 }
      )
    }
    
    // Send test request
    const startTime = Date.now()
    const response = await provider.sendRequest({
      model,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 50,
      temperature: 0.5,
    })
    
    const latency = Date.now() - startTime
    
    // Calculate cost
    const cost = provider.estimateCost(
      response.usage?.inputTokens || 0,
      response.usage?.outputTokens || 0,
      model
    )
    
    return NextResponse.json({
      success: true,
      provider: config.type,
      model,
      latency,
      tokens: {
        input: response.usage?.inputTokens || 0,
        output: response.usage?.outputTokens || 0,
      },
      cost: {
        input: cost * (response.usage?.inputTokens || 0) / ((response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 1)),
        output: cost * (response.usage?.outputTokens || 0) / ((response.usage?.inputTokens || 1) + (response.usage?.outputTokens || 0)),
        total: cost,
      },
      response: response.content || 'No response',
    })
  } catch (error) {
    console.error('Provider test error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid or missing API credentials',
            details: error.message,
          },
          { status: 401 }
        )
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Rate limit exceeded',
            details: error.message,
          },
          { status: 429 }
        )
      }
      if (error.message.includes('model')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Model not available',
            details: error.message,
          },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Provider test failed',
      },
      { status: 500 }
    )
  }
}