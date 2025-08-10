import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { loadConfigServer } from '@/lib/config-loader.server'

export async function GET(request: NextRequest) {
  try {
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
    const fullPath = path.join(process.cwd(), momentsFolder)
    
    // Check if moments directory exists
    try {
      await fs.access(fullPath)
    } catch {
      // Directory doesn't exist, return empty array
      return NextResponse.json({ files: [] })
    }
    
    // Read all markdown files in the moments directory
    const files = await fs.readdir(fullPath)
    const momentFiles = files.filter((file: string) => 
      momentsConfig.file_patterns.some((pattern: string) => 
        file.endsWith(pattern.replace('*.', '.'))
      )
    )
    
    const fileContents = await Promise.all(
      momentFiles.map(async (filename) => {
        try {
          const filePath = path.join(fullPath, filename)
          const content = await fs.readFile(filePath, 'utf-8')
          return {
            filename,
            content,
            path: filePath,
            lastModified: (await fs.stat(filePath)).mtime
          }
        } catch (error) {
          console.error(`Error reading moment file ${filename}:`, error)
          return null
        }
      })
    )
    
    const validFiles = fileContents.filter(file => file !== null)
    
    console.log(`Loaded ${validFiles.length} moment files from ${fullPath}`)
    
    return NextResponse.json({ 
      files: validFiles,
      count: validFiles.length,
      path: fullPath
    })
    
  } catch (error) {
    console.error('Error loading moment files:', error)
    return NextResponse.json(
      { error: 'Failed to load moment files' },
      { status: 500 }
    )
  }
}