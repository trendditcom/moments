import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Technology } from '@/types/catalog'
import { processFolder } from '@/lib/content-processor'

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Loading technologies from filesystem...')
    
    // Get technology folder path from query params or use default
    const { searchParams } = new URL(request.url)
    const folderPath = searchParams.get('folderPath') || './technologies'
    
    const absolutePath = path.resolve(process.cwd(), folderPath)
    
    // Check if folder exists
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { error: `Technologies folder not found: ${folderPath}` },
        { status: 404 }
      )
    }
    
    // Load and process technologies
    const technologies = await processFolder(folderPath, 'technologies') as Technology[]
    
    console.log(`[API] Loaded ${technologies.length} technologies from ${folderPath}`)
    
    return NextResponse.json({
      success: true,
      data: technologies,
      count: technologies.length,
      source: folderPath,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[API] Error loading technologies:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load technologies from filesystem',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}