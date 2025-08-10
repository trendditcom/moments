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
      return NextResponse.json({
        exists: false,
        writable: false,
        count: 0,
        error: 'Moments configuration not found'
      })
    }

    const momentsFolder = momentsConfig.default_folder
    const fullPath = path.join(process.cwd(), momentsFolder)
    
    let exists = false
    let writable = false
    let count = 0
    
    try {
      // Check if directory exists
      await fs.access(fullPath)
      exists = true
      
      // Check if directory is writable by trying to create a temp file
      const tempFile = path.join(fullPath, '.temp-write-test')
      try {
        await fs.writeFile(tempFile, 'test')
        await fs.unlink(tempFile)
        writable = true
      } catch {
        writable = false
      }
      
      // Count existing moment files
      const files = await fs.readdir(fullPath)
      count = files.filter((file: string) => 
        momentsConfig.file_patterns.some((pattern: string) => 
          file.endsWith(pattern.replace('*.', '.'))
        )
      ).length
      
    } catch (error) {
      exists = false
      writable = false
      count = 0
    }
    
    return NextResponse.json({ 
      exists,
      writable,
      count,
      path: fullPath,
      config: {
        autoSave: momentsConfig.auto_save,
        syncMode: momentsConfig.sync_mode,
        patterns: momentsConfig.file_patterns
      }
    })
    
  } catch (error) {
    console.error('Error checking moments folder status:', error)
    return NextResponse.json({
      exists: false,
      writable: false,
      count: 0,
      error: 'Failed to check moments folder status'
    })
  }
}