import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Company } from '@/types/catalog'
import { processFolder } from '@/lib/content-processor'

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Loading companies from filesystem...')
    
    // Get company folder path from query params or use default
    const { searchParams } = new URL(request.url)
    const folderPath = searchParams.get('folderPath') || './companies'
    
    const absolutePath = path.resolve(process.cwd(), folderPath)
    
    // Check if folder exists
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { error: `Companies folder not found: ${folderPath}` },
        { status: 404 }
      )
    }
    
    // Load and process companies
    const companies = await processFolder(folderPath, 'companies') as Company[]
    
    console.log(`[API] Loaded ${companies.length} companies from ${folderPath}`)
    
    return NextResponse.json({
      success: true,
      data: companies,
      count: companies.length,
      source: folderPath,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[API] Error loading companies:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load companies from filesystem',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}