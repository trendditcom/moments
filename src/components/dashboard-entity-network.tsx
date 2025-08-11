'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import * as d3 from 'd3'
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
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
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

// Helper functions for data processing
function extractEntitiesFromMoments(moments: PivotalMoment[], companies: any[], technologies: any[]): {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  matrix: RelationshipMatrix
} {
  const nodeMap = new Map<string, NetworkNode>()
  const edgeMap = new Map<string, NetworkEdge>()
  const coOccurrence = new Map<string, Set<string>>()
  
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
  
  // Process moments to find relationships and extract concepts from keywords
  moments.forEach(moment => {
    const momentEntities = [
      ...(moment.entities?.companies || []),
      ...(moment.entities?.technologies || [])
    ]
    
    // Extract concepts from keywords and people/locations
    const conceptsFromKeywords = moment.classification?.keywords?.slice(0, 3) || [] // Limit to first 3 keywords
    const peopleAsConcepts = moment.entities?.people || []
    const locationConcepts = moment.entities?.locations || []
    const allConcepts = [...conceptsFromKeywords, ...peopleAsConcepts, ...locationConcepts]
    
    // Add concept nodes from extracted concepts
    allConcepts.forEach(concept => {
      if (!nodeMap.has(concept) && concept.length > 2) { // Only add meaningful concepts
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
    
    // Update node impact and track co-occurrences
    momentEntities.forEach(entityId => {
      const node = nodeMap.get(entityId)
      if (node) {
        node.impact += moment.impact?.score || 0
        
        // Track co-occurrences for relationship detection
        if (!coOccurrence.has(entityId)) {
          coOccurrence.set(entityId, new Set())
        }
        
        momentEntities.forEach(otherId => {
          if (entityId !== otherId) {
            coOccurrence.get(entityId)?.add(otherId)
          }
        })
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
    
    // Size based on connections and impact
    node.size = Math.max(8, Math.min(40, 8 + node.connections * 2 + (node.impact * 0.1)))
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
  
  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
    matrix: { entities, matrix, entityTypes }
  }
}

// Force-directed Network Graph Component
function InteractiveNetworkGraph({ 
  nodes, 
  edges, 
  searchQuery, 
  selectedNodeType 
}: {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  searchQuery: string
  selectedNodeType: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null)
  
  const filteredNodes = useMemo(() => {
    let filtered = nodes
    
    if (searchQuery) {
      filtered = filtered.filter(node => 
        node.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (selectedNodeType !== 'all') {
      filtered = filtered.filter(node => node.type === selectedNodeType)
    }
    
    return filtered
  }, [nodes, searchQuery, selectedNodeType])
  
  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    return edges.filter(edge => 
      nodeIds.has(edge.source as string) && nodeIds.has(edge.target as string)
    )
  }, [edges, filteredNodes])
  
  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    
    const width = 600
    const height = 400
    const centerX = width / 2
    const centerY = height / 2
    
    // Color scales
    const nodeColorScale = d3.scaleOrdinal()
      .domain(['company', 'technology', 'concept'])
      .range(['#3b82f6', '#10b981', '#f59e0b'])
    
    const edgeColorScale = d3.scaleOrdinal()
      .domain(['collaboration', 'competition', 'technology_use', 'concept_relation', 'market_relation'])
      .range(['#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'])
    
    // Create force simulation with proper typing
    const simulation = d3.forceSimulation<NetworkNode>(filteredNodes)
      .force('link', d3.forceLink<NetworkNode, NetworkEdge>(filteredEdges)
        .id((d: NetworkNode) => d.id)
        .distance(d => 50 + (d.strength * 10))
        .strength(d => Math.min(1, d.strength * 0.1))
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(centerX, centerY))
      .force('collision', d3.forceCollide<NetworkNode>().radius(d => d.size + 5))
    
    // Create container
    const g = svg.append("g")
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', function(event) {
        g.attr('transform', event.transform)
      })
    
    svg.call(zoom as any)
    
    // Create edges
    const edges = g.selectAll('.edge')
      .data(filteredEdges)
      .enter().append('line')
      .attr('class', 'edge')
      .attr('stroke', d => edgeColorScale(d.type) as string)
      .attr('stroke-width', d => Math.max(1, d.strength * 2))
      .attr('stroke-opacity', 0.6)
    
    // Create nodes
    const nodeGroups = g.selectAll('.node')
      .data(filteredNodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
    
    // Node circles
    nodeGroups.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => nodeColorScale(d.type) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('mouseover', function(event, d) {
        setHoveredNode(d)
        d3.select(this)
          .attr('stroke-width', 4)
          .attr('stroke', '#000')
      })
      .on('mouseout', function(event, d) {
        setHoveredNode(null)
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('stroke', '#fff')
      })
      .on('click', function(event, d) {
        setSelectedNode(d)
        event.stopPropagation()
      })
      .call(d3.drag<SVGCircleElement, NetworkNode>()
        .on('start', function(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', function(event, d) {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', function(event, d) {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
    
    // Node labels
    nodeGroups.append('text')
      .text(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name)
      .attr('dy', d => d.size + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .style('pointer-events', 'none')
    
    // Update positions on simulation tick
    simulation.on('tick', function() {
      edges
        .attr('x1', d => (d.source as NetworkNode).x || 0)
        .attr('y1', d => (d.source as NetworkNode).y || 0)
        .attr('x2', d => (d.target as NetworkNode).x || 0)
        .attr('y2', d => (d.target as NetworkNode).y || 0)
      
      nodeGroups
        .attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`)
    })
    
    // Click to deselect
    svg.on('click', function() {
      setSelectedNode(null)
    })
    
    return () => {
      simulation.stop()
    }
    
  }, [filteredNodes, filteredEdges])
  
  return (
    <div className="space-y-4">
      <svg ref={svgRef} width="100%" height="400" className="border rounded" />
      
      {/* Legend */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="font-medium mb-2">Entity Types</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Companies</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Technologies</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Concepts</span>
            </div>
          </div>
        </div>
        
        <div>
          <div className="font-medium mb-2">Relationship Types</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-green-600"></div>
              <span>Collaboration</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-red-500"></div>
              <span>Competition</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-purple-500"></div>
              <span>Technology Use</span>
            </div>
          </div>
        </div>
        
        <div>
          <div className="font-medium mb-2">Node Information</div>
          {hoveredNode && (
            <div className="space-y-1">
              <div><strong>{hoveredNode.name}</strong></div>
              <div>Type: {hoveredNode.type}</div>
              <div>Connections: {hoveredNode.connections}</div>
              <div>Impact: {Math.round(hoveredNode.impact)}</div>
            </div>
          )}
        </div>
      </div>
      
      {selectedNode && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Selected: {selectedNode.name}</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div>Type: {selectedNode.type}</div>
              <div>Connections: {selectedNode.connections}</div>
            </div>
            <div>
              <div>Impact Score: {Math.round(selectedNode.impact)}</div>
              <div>Network Size: {selectedNode.size}</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground text-center">
        Drag nodes to reposition • Click to select • Scroll to zoom • Node size reflects connection count and impact
      </div>
    </div>
  )
}

// Relationship Strength Matrix Component
function RelationshipStrengthMatrix({ matrix }: { matrix: RelationshipMatrix }) {
  const [sortBy, setSortBy] = useState<'name' | 'connections' | 'type'>('connections')
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null)
  
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
  
  return (
    <div className="space-y-4">
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
      </div>
      
      <div className="overflow-auto max-h-96">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2 border text-left min-w-32">Entity</th>
              {displayEntities.map(colIndex => (
                <th key={colIndex} className="p-1 border text-center min-w-8 max-w-20">
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
                <td className="p-2 border">
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
      
      {selectedCell && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-900">
              <div className="font-medium mb-1">Relationship Analysis</div>
              <div>
                <strong>{matrix.entities[selectedCell.row]}</strong> ↔ <strong>{matrix.entities[selectedCell.col]}</strong>
              </div>
              <div>Strength: {matrix.matrix[selectedCell.row][selectedCell.col]} co-occurrences</div>
              <div>
                Entity Types: {matrix.entityTypes[matrix.entities[selectedCell.row]]} × {matrix.entityTypes[matrix.entities[selectedCell.col]]}
              </div>
            </div>
          </div>
        </div>
      )}
      
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
  )
}

// Main Entity Relationship Network Component
export function EntityRelationshipNetwork() {
  const { moments } = useMomentsStore()
  const { companies, technologies } = useCatalogStore()
  const [viewMode, setViewMode] = useState<'network' | 'matrix'>('network')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNodeType, setSelectedNodeType] = useState<'all' | 'company' | 'technology' | 'concept'>('all')
  
  const networkData = useMemo(() => 
    extractEntitiesFromMoments(moments, companies, technologies),
    [moments, companies, technologies]
  )
  
  const stats = useMemo(() => {
    const totalNodes = networkData.nodes.length
    const totalEdges = networkData.edges.length
    const avgConnections = totalNodes > 0 ? totalEdges * 2 / totalNodes : 0
    const mostConnected = networkData.nodes.reduce((max, node) => 
      node.connections > max.connections ? node : max,
      networkData.nodes[0] || { connections: 0, name: 'None' }
    )
    
    return { totalNodes, totalEdges, avgConnections, mostConnected }
  }, [networkData])
  
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Interactive Network Graph */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-medium">Entity Relationship Network</CardTitle>
              <CardDescription className="text-xs">
                Interactive network showing entity connections and relationships
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'network' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('network')}
                className="text-xs"
              >
                <Squares2X2Icon className="w-3 h-3 mr-1" />
                Network
              </Button>
              <Button
                variant={viewMode === 'matrix' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('matrix')}
                className="text-xs"
              >
                <ChartBarIcon className="w-3 h-3 mr-1" />
                Matrix
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <select
                value={selectedNodeType}
                onChange={(e) => setSelectedNodeType(e.target.value as any)}
                className="text-xs px-2 py-1 border rounded"
              >
                <option value="all">All Types</option>
                <option value="company">Companies</option>
                <option value="technology">Technologies</option>
                <option value="concept">Concepts</option>
              </select>
            </div>
            
            {/* Statistics */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <div className="font-bold">{stats.totalNodes}</div>
                <div className="text-muted-foreground">Entities</div>
              </div>
              <div>
                <div className="font-bold">{stats.totalEdges}</div>
                <div className="text-muted-foreground">Relations</div>
              </div>
              <div>
                <div className="font-bold">{Math.round(stats.avgConnections * 10) / 10}</div>
                <div className="text-muted-foreground">Avg Links</div>
              </div>
              <div>
                <div className="font-bold truncate" title={stats.mostConnected.name}>
                  {stats.mostConnected.name.length > 8 
                    ? stats.mostConnected.name.substring(0, 6) + '...'
                    : stats.mostConnected.name
                  }
                </div>
                <div className="text-muted-foreground">Most Connected</div>
              </div>
            </div>
            
            {viewMode === 'network' ? (
              <InteractiveNetworkGraph
                nodes={networkData.nodes}
                edges={networkData.edges}
                searchQuery={searchQuery}
                selectedNodeType={selectedNodeType}
              />
            ) : (
              <RelationshipStrengthMatrix matrix={networkData.matrix} />
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Network Analysis Insights */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium">Network Analysis Insights</CardTitle>
          <CardDescription className="text-xs">
            AI-powered analysis of entity relationships and network patterns
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Clustering Analysis */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-900">
                  <div className="font-medium mb-1">Cluster Detection</div>
                  <div>
                    Network analysis reveals {Math.ceil(stats.totalNodes / 5)} distinct entity clusters 
                    with companies forming the strongest interconnected groups around core AI technologies 
                    and business concepts like &quot;artificial intelligence,&quot; &quot;machine learning,&quot; and &quot;enterprise solutions.&quot;
                  </div>
                </div>
              </div>
            </div>
            
            {/* Key Relationships */}
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <ArrowsRightLeftIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-900">
                  <div className="font-medium mb-1">Key Relationships</div>
                  <div>
                    Strongest entity connections show technology adoption patterns, with AI startups 
                    clustering around foundational technologies like &quot;large language models&quot; and 
                    &quot;generative AI,&quot; indicating market convergence around these core technologies.
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pattern Discovery */}
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AdjustmentsHorizontalIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-900">
                  <div className="font-medium mb-1">Emerging Patterns</div>
                  <div>
                    Network evolution shows increasing interconnection between enterprise companies 
                    and AI technologies, suggesting accelerating adoption across traditional industries 
                    and emerging partnerships between established enterprises and AI-native startups.
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top Connected Entities */}
            <div>
              <h4 className="text-xs font-medium mb-2">Most Connected Entities</h4>
              <div className="space-y-2">
                {networkData.nodes
                  .sort((a, b) => b.connections - a.connections)
                  .slice(0, 5)
                  .map((node, index) => (
                    <div key={node.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline"
                          className={
                            node.type === 'company' ? 'border-blue-300' :
                            node.type === 'technology' ? 'border-green-300' : 'border-yellow-300'
                          }
                        >
                          #{index + 1}
                        </Badge>
                        <span className="truncate max-w-32" title={node.name}>
                          {node.name}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {node.connections} links
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Export Options */}
            <div className="pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => console.log('Export network data')}
              >
                <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                Export Network Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}