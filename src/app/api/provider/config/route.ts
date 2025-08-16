import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import yaml from 'yaml'
import type { ModelProviderConfig } from '@/lib/config-types'

export async function POST(request: NextRequest) {
  try {
    const providerConfig: ModelProviderConfig = await request.json()

    // Load existing config
    const configPath = path.join(process.cwd(), 'config.yml')
    const configContent = await fs.readFile(configPath, 'utf-8')
    const config = yaml.parse(configContent)

    // Update model_provider section
    config.model_provider = providerConfig

    // Save updated config
    const updatedContent = yaml.stringify(config, {
      indent: 2,
      lineWidth: 0,
      defaultStringType: 'PLAIN',
      defaultKeyType: 'PLAIN',
    })
    
    await fs.writeFile(configPath, updatedContent, 'utf-8')

    return NextResponse.json({ 
      success: true, 
      message: 'Provider configuration saved successfully' 
    })
  } catch (error) {
    console.error('Error saving provider configuration:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save configuration' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Load current config
    const configPath = path.join(process.cwd(), 'config.yml')
    const configContent = await fs.readFile(configPath, 'utf-8')
    const config = yaml.parse(configContent)

    return NextResponse.json({
      model_provider: config.model_provider || null,
    })
  } catch (error) {
    console.error('Error loading provider configuration:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to load configuration' 
      },
      { status: 500 }
    )
  }
}