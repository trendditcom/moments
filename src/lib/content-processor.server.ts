import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { Company, Technology, ContentItem } from '@/types/catalog'

/**
 * Server-side content processor that directly processes folders
 * without making HTTP calls (for use in API routes)
 */
export async function processFolder(
  folderPath: string,
  type: 'companies' | 'technologies'
): Promise<Company[] | Technology[]> {
  try {
    const absolutePath = path.join(process.cwd(), folderPath)
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Folder not found: ${folderPath}`)
    }

    let data: Company[] | Technology[]
    
    if (type === 'companies') {
      data = await processCompaniesFolder(absolutePath, folderPath)
    } else {
      data = await processTechnologiesFolder(absolutePath, folderPath)
    }

    return data
  } catch (error) {
    console.error(`Error processing ${type} folder:`, error)
    throw new Error(`Failed to process ${type} folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function processCompaniesFolder(absolutePath: string, relativePath: string): Promise<Company[]> {
  const companies: Company[] = []
  
  try {
    const entries = fs.readdirSync(absolutePath, { withFileTypes: true })
    const companyDirs = entries.filter(entry => entry.isDirectory())
    
    for (const companyDir of companyDirs) {
      const companyPath = path.join(absolutePath, companyDir.name)
      const companyRelativePath = `${relativePath}/${companyDir.name}`
      
      // Process company folder
      const content: ContentItem[] = []
      
      try {
        const companyFiles = fs.readdirSync(companyPath, { withFileTypes: true })
        
        for (const file of companyFiles) {
          if (file.isFile()) {
            const filePath = path.join(companyPath, file.name)
            const fileRelativePath = `${companyRelativePath}/${file.name}`
            const ext = path.extname(file.name).toLowerCase()
            
            if (ext === '.md' || ext === '.mdx') {
              try {
                const fileContent = fs.readFileSync(filePath, 'utf8')
                const parsed = matter(fileContent)
                
                content.push({
                  id: `${companyDir.name}-${path.parse(file.name).name}`,
                  name: parsed.data.title || path.parse(file.name).name.replace(/-/g, ' '),
                  path: fileRelativePath,
                  type: 'markdown',
                  content: parsed.content,
                  createdAt: fs.statSync(filePath).birthtime,
                  updatedAt: fs.statSync(filePath).mtime,
                })
              } catch (error) {
                console.warn(`Error reading markdown file ${filePath}:`, error)
              }
            } else if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
              content.push({
                id: `${companyDir.name}-${path.parse(file.name).name}`,
                name: path.parse(file.name).name.replace(/-/g, ' '),
                path: fileRelativePath,
                type: 'image',
                createdAt: fs.statSync(filePath).birthtime,
                updatedAt: fs.statSync(filePath).mtime,
              })
            }
          }
        }
      } catch (error) {
        console.warn(`Error processing company directory ${companyPath}:`, error)
      }
      
      // Create company object
      const company: Company = {
        id: companyDir.name,
        name: companyDir.name.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        slug: companyDir.name,
        path: companyRelativePath,
        description: `AI startup company: ${companyDir.name}`,
        category: 'startup',
        content,
        createdAt: fs.statSync(companyPath).birthtime,
        updatedAt: fs.statSync(companyPath).mtime,
      }
      
      companies.push(company)
    }
  } catch (error) {
    console.error(`Error processing companies folder ${absolutePath}:`, error)
  }
  
  return companies
}

async function processTechnologiesFolder(absolutePath: string, relativePath: string): Promise<Technology[]> {
  const technologies: Technology[] = []
  
  try {
    const entries = fs.readdirSync(absolutePath, { withFileTypes: true })
    const techDirs = entries.filter(entry => entry.isDirectory())
    
    for (const techDir of techDirs) {
      const techPath = path.join(absolutePath, techDir.name)
      const techRelativePath = `${relativePath}/${techDir.name}`
      
      // Process technology folder
      const content: ContentItem[] = []
      
      try {
        const techFiles = fs.readdirSync(techPath, { withFileTypes: true })
        
        for (const file of techFiles) {
          if (file.isFile()) {
            const filePath = path.join(techPath, file.name)
            const fileRelativePath = `${techRelativePath}/${file.name}`
            const ext = path.extname(file.name).toLowerCase()
            
            if (ext === '.md' || ext === '.mdx') {
              try {
                const fileContent = fs.readFileSync(filePath, 'utf8')
                const parsed = matter(fileContent)
                
                content.push({
                  id: `${techDir.name}-${path.parse(file.name).name}`,
                  name: parsed.data.title || path.parse(file.name).name.replace(/-/g, ' '),
                  path: fileRelativePath,
                  type: 'markdown',
                  content: parsed.content,
                  createdAt: fs.statSync(filePath).birthtime,
                  updatedAt: fs.statSync(filePath).mtime,
                })
              } catch (error) {
                console.warn(`Error reading markdown file ${filePath}:`, error)
              }
            } else if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
              content.push({
                id: `${techDir.name}-${path.parse(file.name).name}`,
                name: path.parse(file.name).name.replace(/-/g, ' '),
                path: fileRelativePath,
                type: 'image',
                createdAt: fs.statSync(filePath).birthtime,
                updatedAt: fs.statSync(filePath).mtime,
              })
            }
          }
        }
      } catch (error) {
        console.warn(`Error processing technology directory ${techPath}:`, error)
      }
      
      // Determine category based on folder name
      let category = 'ai-tools'
      if (techDir.name.includes('agent')) category = 'ai-frameworks'
      if (techDir.name.includes('prompt')) category = 'ai-techniques'
      
      // Create technology object
      const technology: Technology = {
        id: techDir.name,
        name: techDir.name.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        slug: techDir.name,
        path: techRelativePath,
        description: `AI technology: ${techDir.name}`,
        category,
        content,
        createdAt: fs.statSync(techPath).birthtime,
        updatedAt: fs.statSync(techPath).mtime,
      }
      
      technologies.push(technology)
    }
  } catch (error) {
    console.error(`Error processing technologies folder ${absolutePath}:`, error)
  }
  
  return technologies
}