import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { loadConfigServer } from '@/lib/config-loader.server'

export async function DELETE(request: NextRequest) {
  try {
    const { momentId } = await request.json()
    
    if (!momentId) {
      return NextResponse.json(
        { error: 'Missing momentId' },
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
    const fullPath = path.join(process.cwd(), momentsFolder)
    
    // Find files with the moment ID in their content or filename
    const files = await fs.readdir(fullPath)
    const momentFiles = files.filter((file: string) => 
      momentsConfig.file_patterns.some((pattern: string) => 
        file.endsWith(pattern.replace('*.', '.'))
      )
    )
    
    let deletedFiles = 0
    
    for (const filename of momentFiles) {
      const filePath = path.join(fullPath, filename)
      
      try {
        // Check if file contains the moment ID (either in filename or content)
        if (filename.includes(momentId)) {
          await fs.unlink(filePath)
          deletedFiles++
          console.log(`Deleted moment file: ${filePath}`)
        } else {
          // Check file content for moment ID
          const content = await fs.readFile(filePath, 'utf-8')
          if (content.includes(`id: ${momentId}`) || content.includes(`"id":"${momentId}"`)) {
            await fs.unlink(filePath)
            deletedFiles++
            console.log(`Deleted moment file: ${filePath}`)
          }
        }
      } catch (error) {
        console.error(`Error processing file ${filename}:`, error)
      }
    }
    
    if (deletedFiles === 0) {
      return NextResponse.json(
        { error: 'Moment file not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      deletedFiles,
      momentId
    })
    
  } catch (error) {
    console.error('Error deleting moment file:', error)
    return NextResponse.json(
      { error: 'Failed to delete moment file' },
      { status: 500 }
    )
  }
}