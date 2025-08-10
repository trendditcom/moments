import { NextResponse } from 'next/server'
import { loadConfig } from '@/lib/config-loader'

export async function GET() {
  try {
    const config = loadConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error loading configuration:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}