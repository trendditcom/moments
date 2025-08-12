'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  InformationCircleIcon,
  ArrowDownTrayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useMomentsStore } from '@/store/moments-store'
import { useCatalogStore } from '@/store/catalog-store'
import { PivotalMoment } from '@/types/moments'

// Entity and relationship data structures
interface NetworkNode {
  id: string
  name: string
  type: 'company' | 'technology' | 'concept'
  category?: string
  size: number
  connections: number
  impact: number
}

interface NetworkEdge {
  source: string | NetworkNode
  target: string | NetworkNode
  strength: number
  type: 'collaboration' | 'competition' | 'technology_use' | 'concept_relation' | 'market_relation'
  weight: number
  moments: string[]
}

interface RelationshipMatrix {
  entities: string[]
  matrix: number[][]
  entityTypes: Record<string, 'company' | 'technology' | 'concept'>
}

// Helper function to extract entities and build matrix from moments
function extractRelationshipMatrix(moments: PivotalMoment[], companies: any[], technologies: any[]): RelationshipMatrix {
  const nodeMap = new Map<string, NetworkNode>()
  const edgeMap = new Map<string, NetworkEdge>()
  
  // Initialize nodes from catalogs
  companies.forEach(company => {
    nodeMap.set(company.id, {
      id: company.id,
      name: company.name,
      type: 'company',
      category: 'enterprise',
      size: 20,
      connections: 0,
      impact: 0
    })
  })
  
  technologies.forEach(tech => {
    nodeMap.set(tech.id, {
      id: tech.id,
      name: tech.name,
      type: 'technology',
      category: 'ai_tech',
      size: 15,
      connections: 0,
      impact: 0
    })
  })
  
  // Process moments to find relationships and extract concepts
  moments.forEach(moment => {
    const momentEntities = [
      ...(moment.entities?.companies || []),
      ...(moment.entities?.technologies || [])
    ]
    
    // Extract concepts from keywords and people/locations
    const conceptsFromKeywords = moment.classification?.keywords?.slice(0, 3) || []
    const peopleAsConcepts = moment.entities?.people || []
    const locationConcepts = moment.entities?.locations || []
    const allConcepts = [...conceptsFromKeywords, ...peopleAsConcepts, ...locationConcepts]
    
    // Add concept nodes
    allConcepts.forEach(concept => {
      if (!nodeMap.has(concept) && concept.length > 2) {
        nodeMap.set(concept, {
          id: concept,
          name: concept,
          type: 'concept',
          category: 'business_concept',
          size: 10,
          connections: 0,
          impact: 0
        })
      }
    })
    
    // Include concepts in entity relationships
    momentEntities.push(...allConcepts.filter(c => c.length > 2))
    
    // Update node impact and create edges
    momentEntities.forEach(entityId => {
      const node = nodeMap.get(entityId)
      if (node) {
        node.impact += moment.impact?.score || 0
      }
    })
    
    // Create edges between co-occurring entities
    for (let i = 0; i < momentEntities.length; i++) {
      for (let j = i + 1; j < momentEntities.length; j++) {
        const source = momentEntities[i]
        const target = momentEntities[j]
        const edgeKey = `${source}-${target}`
        const reverseKey = `${target}-${source}`
        
        const existingEdge = edgeMap.get(edgeKey) || edgeMap.get(reverseKey)
        if (existingEdge) {
          existingEdge.strength += 1
          existingEdge.weight += (moment.impact?.score || 0) * 0.01
          existingEdge.moments.push(moment.id)
        } else {
          const sourceNode = nodeMap.get(source)
          const targetNode = nodeMap.get(target)
          
          let relationshipType: NetworkEdge['type'] = 'concept_relation'
          if (sourceNode?.type === 'company' && targetNode?.type === 'company') {
            relationshipType = 'competition'
          } else if (sourceNode?.type === 'company' && targetNode?.type === 'technology') {
            relationshipType = 'technology_use'
          } else if (sourceNode?.type === 'technology' && targetNode?.type === 'technology') {
            relationshipType = 'concept_relation'
          }
          
          edgeMap.set(edgeKey, {
            source,
            target,
            strength: 1,
            type: relationshipType,
            weight: (moment.impact?.score || 0) * 0.01,
            moments: [moment.id]
          })
        }
      }
    }
  })
  
  // Update node connection counts
  Array.from(nodeMap.values()).forEach(node => {
    node.connections = Array.from(edgeMap.values()).filter(
      edge => edge.source === node.id || edge.target === node.id
    ).length
  })
  
  // Create relationship matrix
  const entities = Array.from(nodeMap.keys())
  const matrix: number[][] = entities.map(() => entities.map(() => 0))
  const entityTypes: Record<string, NetworkNode['type']> = {}
  
  entities.forEach((entity, i) => {
    const node = nodeMap.get(entity)
    if (node) entityTypes[entity] = node.type
    
    entities.forEach((otherEntity, j) => {
      if (i !== j) {
        const edge = edgeMap.get(`${entity}-${otherEntity}`) || edgeMap.get(`${otherEntity}-${entity}`)
        matrix[i][j] = edge ? edge.strength : 0
      }
    })
  })
  
  return { entities, matrix, entityTypes }
}

// Main Relationship Matrix Component for Dashboard
export function RelationshipMatrix() {
  const { moments } = useMomentsStore()
  const { companies, technologies } = useCatalogStore()
  const [sortBy, setSortBy] = useState<'name' | 'connections' | 'type'>('connections')
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null)
  
  const matrix = useMemo(() => 
    extractRelationshipMatrix(moments, companies, technologies),
    [moments, companies, technologies]
  )
  
  const sortedIndices = useMemo(() => {
    const indices = matrix.entities.map((_, i) => i)
    
    return indices.sort((a, b) => {
      if (sortBy === 'name') {
        return matrix.entities[a].localeCompare(matrix.entities[b])
      } else if (sortBy === 'type') {
        const typeA = matrix.entityTypes[matrix.entities[a]]
        const typeB = matrix.entityTypes[matrix.entities[b]]
        return typeA.localeCompare(typeB)
      } else {
        const connectionsA = matrix.matrix[a].reduce((sum, val) => sum + val, 0)
        const connectionsB = matrix.matrix[b].reduce((sum, val) => sum + val, 0)
        return connectionsB - connectionsA
      }
    })
  }, [matrix, sortBy])
  
  const maxValue = Math.max(...matrix.matrix.flat())
  
  const getEntityColor = (type: string) => {
    switch (type) {
      case 'company': return 'bg-blue-100 text-blue-800'
      case 'technology': return 'bg-green-100 text-green-800'
      case 'concept': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getCellColor = (value: number) => {
    if (value === 0) return 'bg-gray-50'
    const intensity = value / maxValue
    return `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`
  }
  
  const displayEntities = sortedIndices.slice(0, 10) // Show top 10 for readability
  
  const stats = useMemo(() => {
    const totalEntities = matrix.entities.length
    const totalRelationships = matrix.matrix.flat().filter(v => v > 0).length / 2 // Divide by 2 since matrix is symmetric
    const avgStrength = totalRelationships > 0 
      ? matrix.matrix.flat().filter(v => v > 0).reduce((sum, v) => sum + v, 0) / (totalRelationships * 2)
      : 0
    
    return { totalEntities, totalRelationships, avgStrength }
  }, [matrix])
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-medium">Relationship Strength Matrix</CardTitle>
            <CardDescription className="text-xs">
              Quantitative correlation analysis showing entity relationship strengths and co-occurrence patterns
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              <ChartBarIcon className="w-3 h-3 mr-1" />
              {stats.totalEntities} Entities
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stats.totalRelationships} Relations
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {Math.round(stats.avgStrength * 10) / 10} Avg Strength
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => console.log('Export matrix data')}
            >
              <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Sort Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-2">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border rounded px-2 py-1"
                >
                  <option value="connections">Connections</option>
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                </select>
              </div>
              <div className="text-muted-foreground">
                Showing top 10 entities by {sortBy === 'connections' ? 'connection count' : sortBy}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 rounded"></div>
                <span>Weak (1-2)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-300 rounded"></div>
                <span>Medium (3-5)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Strong (5+)</span>
              </div>
            </div>
          </div>
          
          {/* Matrix Table */}
          <div className="overflow-auto max-h-96 border rounded">
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border text-left min-w-32 bg-muted">Entity</th>
                  {displayEntities.map(colIndex => (
                    <th key={colIndex} className="p-1 border text-center min-w-8 max-w-20 bg-muted">
                      <div className="transform -rotate-45 origin-center truncate">
                        {matrix.entities[colIndex].length > 8 
                          ? matrix.entities[colIndex].substring(0, 6) + '...'
                          : matrix.entities[colIndex]
                        }
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayEntities.map((rowIndex, i) => (
                  <tr key={rowIndex}>
                    <td className="p-2 border bg-muted">
                      <Badge 
                        variant="outline"
                        className={getEntityColor(matrix.entityTypes[matrix.entities[rowIndex]])}
                      >
                        {matrix.entities[rowIndex]}
                      </Badge>
                    </td>
                    {displayEntities.map((colIndex, j) => (
                      <td 
                        key={colIndex}
                        className="p-1 border text-center cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: getCellColor(matrix.matrix[rowIndex][colIndex]) }}
                        onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                      >
                        {matrix.matrix[rowIndex][colIndex] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Selected Cell Analysis */}
          {selectedCell && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-900">
                  <div className="font-medium mb-1">Relationship Analysis</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-blue-600">Entities</div>
                      <div>
                        <strong>{matrix.entities[selectedCell.row]}</strong> ↔ <strong>{matrix.entities[selectedCell.col]}</strong>
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-600">Relationship Strength</div>
                      <div>{matrix.matrix[selectedCell.row][selectedCell.col]} co-occurrences</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Entity Types</div>
                      <div>
                        {matrix.entityTypes[matrix.entities[selectedCell.row]]} × {matrix.entityTypes[matrix.entities[selectedCell.col]]}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-600">Correlation Pattern</div>
                      <div>
                        {matrix.matrix[selectedCell.row][selectedCell.col] > 5 ? 'Strong' : 
                         matrix.matrix[selectedCell.row][selectedCell.col] > 2 ? 'Moderate' : 'Weak'} correlation
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-blue-700">
                    This relationship indicates {matrix.matrix[selectedCell.row][selectedCell.col] > 3 ? 'significant' : 'emerging'} connection 
                    patterns between these entities in the AI industry landscape.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Entity Type Distribution */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="p-2 border rounded bg-blue-50">
              <div className="font-medium text-blue-900 mb-1">Companies</div>
              <div className="text-blue-700">
                {matrix.entities.filter(e => matrix.entityTypes[e] === 'company').length} entities
              </div>
            </div>
            <div className="p-2 border rounded bg-green-50">
              <div className="font-medium text-green-900 mb-1">Technologies</div>
              <div className="text-green-700">
                {matrix.entities.filter(e => matrix.entityTypes[e] === 'technology').length} entities
              </div>
            </div>
            <div className="p-2 border rounded bg-yellow-50">
              <div className="font-medium text-yellow-900 mb-1">Concepts</div>
              <div className="text-yellow-700">
                {matrix.entities.filter(e => matrix.entityTypes[e] === 'concept').length} entities
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}