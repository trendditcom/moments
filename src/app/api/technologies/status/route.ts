import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Checking technologies folder status...')
    
    // Get folder path from query params or use default
    const { searchParams } = new URL(request.url)
    const folderPath = searchParams.get('folderPath') || './technologies'
    
    const absolutePath = path.resolve(process.cwd(), folderPath)
    
    // Check folder existence
    const exists = fs.existsSync(absolutePath)
    
    if (!exists) {
      return NextResponse.json({
        exists: false,
        writable: false,
        count: 0,
        path: folderPath,
        absolutePath
      })
    }
    
    // Check if writable
    let writable = false
    try {
      fs.accessSync(absolutePath, fs.constants.W_OK)
      writable = true
    } catch (error) {
      writable = false
    }
    
    // Count technology folders/files
    let count = 0
    try {
      const items = fs.readdirSync(absolutePath)
      // Count directories (technology folders) and markdown files
      count = items.filter(item => {
        const itemPath = path.join(absolutePath, item)
        const stat = fs.statSync(itemPath)
        return stat.isDirectory() || (stat.isFile() && item.endsWith('.md'))
      }).length
    } catch (error) {
      console.error('[API] Error counting technologies:', error)
    }
    
    console.log(`[API] Technologies folder status: exists=${exists}, writable=${writable}, count=${count}`)
    
    return NextResponse.json({
      exists,
      writable,
      count,
      path: folderPath,
      absolutePath,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[API] Error checking technologies status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check technologies folder status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}