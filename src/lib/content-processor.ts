import matter from 'gray-matter'
import { Company, Technology, ContentItem } from '@/types/catalog'
import { loadConfigClient } from '@/lib/config-loader.client'

export async function processFolder(
  folderPath: string,
  type: 'companies' | 'technologies'
): Promise<Company[] | Technology[]> {
  try {
    // Load configuration from client
    const config = await loadConfigClient()
    const catalogConfig = config.catalogs[type]
    
    // Use configured source folders if folderPath matches default
    const isDefaultPath = folderPath === catalogConfig.default_folder || 
                         catalogConfig.source_folders.includes(folderPath)
    
    if (!isDefaultPath) {
      console.log(`Using custom folder path: ${folderPath}`)
    }
    
    // Call the catalog API to process the actual folder contents
    const response = await fetch('/api/catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderPath,
        type,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to process folder: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error processing ${type} folder:`, error)
    throw new Error(`Failed to process ${type} folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function parseMarkdownContent(content: string): { metadata: any; content: string } {
  try {
    const result = matter(content)
    return {
      metadata: result.data,
      content: result.content,
    }
  } catch (error) {
    console.error('Error parsing markdown:', error)
    return {
      metadata: {},
      content: content,
    }
  }
}