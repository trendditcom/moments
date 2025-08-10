import matter from 'gray-matter'
import { Company, Technology, ContentItem } from '@/types/catalog'

export async function processFolder(
  folderPath: string,
  type: 'companies' | 'technologies'
): Promise<Company[] | Technology[]> {
  try {
    // In a real application, this would use Node.js fs APIs or a file system API
    // For now, we'll process the known structure from the companies/ and technologies/ folders
    
    if (type === 'companies') {
      return await processCompaniesFolder(folderPath)
    } else {
      return await processTechnologiesFolder(folderPath)
    }
  } catch (error) {
    console.error(`Error processing ${type} folder:`, error)
    throw new Error(`Failed to process ${type} folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function processCompaniesFolder(folderPath: string): Promise<Company[]> {
  // Simulate processing the companies folder structure
  // In a real app, this would read the actual file system
  const companies: Company[] = [
    {
      id: 'glean',
      name: 'Glean',
      slug: 'glean',
      path: `${folderPath}/glean`,
      description: 'Work AI leader with horizontal agent platform',
      category: 'startup' as const,
      content: [
        {
          id: 'glean-stack',
          name: 'Glean Stack',
          path: `${folderPath}/glean/glean-stack.md`,
          type: 'markdown' as const,
          content: 'Glean expands horizontal agent platform...',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'glean-stack-image',
          name: 'Glean Stack Image',
          path: `${folderPath}/glean/glean-stack.webp`,
          type: 'image' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'sierra-ai',
      name: 'Sierra AI',
      slug: 'sierra-ai',
      path: `${folderPath}/sierra-ai`,
      description: 'Agent OS platform for building and scaling AI agents',
      category: 'startup' as const,
      content: [
        {
          id: 'rolling-your-own-agent',
          name: 'Rolling Your Own Agent',
          path: `${folderPath}/sierra-ai/rolling-your-own-agent.md`,
          type: 'markdown' as const,
          content: 'The challenge with rolling your own agent...',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'sierra-agent-stack',
          name: 'Sierra Agent Stack',
          path: `${folderPath}/sierra-ai/sierra-agent-stack.png`,
          type: 'image' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]

  return companies
}

async function processTechnologiesFolder(folderPath: string): Promise<Technology[]> {
  // Simulate processing the technologies folder structure
  const technologies: Technology[] = [
    {
      id: 'claude-code',
      name: 'Claude Code',
      slug: 'claude-code',
      path: `${folderPath}/claude-code`,
      description: 'AI-powered development tool and SDK',
      category: 'ai-tools',
      content: [
        {
          id: 'headless-claude-code',
          name: 'Headless Claude Code',
          path: `${folderPath}/claude-code/headless-claude-code.md`,
          type: 'markdown' as const,
          content: 'Building headless automation with Claude Code...',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'vibe-coding-prod',
          name: 'Vibe Coding in Production',
          path: `${folderPath}/claude-code/vibe-coding-prod.md`,
          type: 'markdown' as const,
          content: 'Production vibe coding best practices...',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'llm-agents',
      name: 'LLM Agents',
      slug: 'llm-agents',
      path: `${folderPath}/llm-agents`,
      description: 'Technologies and frameworks for LLM agents',
      category: 'ai-frameworks',
      content: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'llm-prompting',
      name: 'LLM Prompting',
      slug: 'llm-prompting',
      path: `${folderPath}/llm-prompting`,
      description: 'Prompting techniques and strategies',
      category: 'ai-techniques',
      content: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]

  return technologies
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