import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { loadConfigServer } from '@/lib/config-loader.server'

export async function GET(request: NextRequest) {
  try {
    // Load configuration to get moments folder
    const config = await loadConfigServer()
    console.log('Loaded config catalogs keys:', Object.keys(config.catalogs))
    const momentsConfig = config.catalogs.moments
    
    if (!momentsConfig) {
      console.error('Moments config not found. Available catalogs:', Object.keys(config.catalogs))
      return NextResponse.json(
        { error: 'Moments configuration not found' },
        { status: 500 }
      )
    }
    
    console.log('Moments config loaded:', {
      name: momentsConfig.name,
      default_folder: momentsConfig.default_folder,
      file_patterns: momentsConfig.file_patterns
    })

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
    console.log(`Found ${files.length} files in ${fullPath}:`, files.slice(0, 5))
    console.log('File patterns:', momentsConfig.file_patterns)
    
    const momentFiles = files.filter((file: string) => 
      momentsConfig.file_patterns.some((pattern: string) => 
        file.endsWith(pattern.replace('*.', '.'))
      )
    )
    
    console.log(`Filtered to ${momentFiles.length} moment files:`, momentFiles.slice(0, 5))
    
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