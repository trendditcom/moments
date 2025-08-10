import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { loadConfigServer } from '@/lib/config-loader.server'

export async function POST(request: NextRequest) {
  try {
    const { filename, content } = await request.json()
    
    if (!filename || !content) {
      return NextResponse.json(
        { error: 'Missing filename or content' },
        { status: 400 }
      )
    }

    // Load configuration to get moments folder
    const config = await loadConfigServer()
    const momentsConfig = config.catalogs.moments
    
    if (!momentsConfig) {
      return NextResponse.json(
        { error: 'Moments configuration not found' },
        { status: 500 }
      )
    }

    const momentsFolder = momentsConfig.default_folder
    const fullPath = path.join(process.cwd(), momentsFolder, filename)
    
    // Ensure moments directory exists
    const dirPath = path.dirname(fullPath)
    await fs.mkdir(dirPath, { recursive: true })
    
    // Write the moment file
    await fs.writeFile(fullPath, content, 'utf-8')
    
    console.log(`Saved moment file: ${fullPath}`)
    
    return NextResponse.json({ 
      success: true, 
      filename,
      path: fullPath
    })
    
  } catch (error) {
    console.error('Error saving moment file:', error)
    return NextResponse.json(
      { error: 'Failed to save moment file' },
      { status: 500 }
    )
  }
}