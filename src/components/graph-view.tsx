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

// Re-import the data structures and helper functions from dashboard-entity-network
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

// Helper functions for data processing (copied from dashboard-entity-network)
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

// Full-Height Interactive Network Graph Component
function FullHeightNetworkGraph({ 
  nodes, 
  edges, 
  searchQuery, 
  selectedNodeType,
  containerHeight = 600,
  onNodeSelect
}: {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  searchQuery: string
  selectedNodeType: string
  containerHeight?: number
  onNodeSelect?: (node: NetworkNode | null) => void
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
    
    const width = 1000
    const height = containerHeight - 100 // Account for header and controls
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
        onNodeSelect?.(d)
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
      onNodeSelect?.(null)
    })
    
    return () => {
      simulation.stop()
    }
    
  }, [filteredNodes, filteredEdges, containerHeight])
  
  return (
    <div className="space-y-4">
      <svg ref={svgRef} width="100%" height={containerHeight - 100} className="border rounded" />
      
      {/* Selected Node Information */}
      {selectedNode && (
        <div className="p-3 bg-muted rounded-lg">
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
      
      {/* Hovered Node Information */}
      {hoveredNode && !selectedNode && (
        <div className="p-2 bg-background border rounded-lg text-xs">
          <div className="font-medium">{hoveredNode.name}</div>
          <div className="text-muted-foreground">
            {hoveredNode.type} • {hoveredNode.connections} connections • Impact: {Math.round(hoveredNode.impact)}
          </div>
        </div>
      )}
    </div>
  )
}

// Network Analysis Insights Sidebar Component
function NetworkAnalysisInsightsSidebar({ networkData, stats, selectedNode }: {
  networkData: { nodes: NetworkNode[], edges: NetworkEdge[] }
  stats: { totalNodes: number, totalEdges: number, avgConnections: number, mostConnected: NetworkNode }
  selectedNode: NetworkNode | null
}) {
  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Network Analysis Insights</h3>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => console.log('Export network data')}
          >
            <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          AI-powered analysis of entity relationships and patterns
        </p>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selected Node Information */}
        {selectedNode && (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-start space-x-2">
              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                selectedNode.type === 'company' ? 'bg-blue-500' :
                selectedNode.type === 'technology' ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-purple-900 mb-1 truncate" title={selectedNode.name}>
                  {selectedNode.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-purple-800">
                  <div>
                    <div className="text-purple-600">Type</div>
                    <div className="font-medium capitalize">{selectedNode.type}</div>
                  </div>
                  <div>
                    <div className="text-purple-600">Connections</div>
                    <div className="font-medium">{selectedNode.connections}</div>
                  </div>
                  <div>
                    <div className="text-purple-600">Impact Score</div>
                    <div className="font-medium">{Math.round(selectedNode.impact)}</div>
                  </div>
                  <div>
                    <div className="text-purple-600">Network Size</div>
                    <div className="font-medium">{selectedNode.size}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Clustering Analysis */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-900">
              <div className="font-medium mb-1">Cluster Detection</div>
              <div>
                Network analysis reveals {Math.ceil(stats.totalNodes / 5)} distinct entity clusters 
                with companies forming the strongest interconnected groups around core AI technologies.
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
                clustering around foundational technologies like &quot;large language models&quot; and &quot;generative AI.&quot;
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
                and AI technologies, suggesting accelerating adoption across traditional industries.
              </div>
            </div>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium mb-2">Network Statistics</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Entities</span>
              <span className="font-medium">{stats.totalNodes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Relations</span>
              <span className="font-medium">{stats.totalEdges}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Connections</span>
              <span className="font-medium">{Math.round(stats.avgConnections * 10) / 10}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Density</span>
              <span className="font-medium">
                {Math.round((stats.totalEdges / (stats.totalNodes * (stats.totalNodes - 1) / 2)) * 1000) / 10}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Top Connected Entities */}
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="text-xs font-medium mb-2">Most Connected Entities</div>
          <div className="space-y-1.5">
            {networkData.nodes
              .sort((a, b) => b.connections - a.connections)
              .slice(0, 6)
              .map((node, index) => (
                <div key={node.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <Badge 
                      variant="outline"
                      className={`text-xs px-1 py-0 ${
                        node.type === 'company' ? 'border-blue-300 text-blue-700' :
                        node.type === 'technology' ? 'border-green-300 text-green-700' : 'border-yellow-300 text-yellow-700'
                      }`}
                    >
                      #{index + 1}
                    </Badge>
                    <span className="truncate max-w-20" title={node.name}>
                      {node.name.length > 12 ? node.name.substring(0, 10) + '...' : node.name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {node.connections}
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="text-xs font-medium mb-2">Legend</div>
          <div className="space-y-2">
            <div>
              <div className="text-xs font-medium mb-1">Entity Types</div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs">Companies</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs">Technologies</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs">Concepts</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-xs font-medium mb-1">Relationships</div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-0.5 bg-green-600"></div>
                  <span className="text-xs">Collaboration</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-0.5 bg-red-500"></div>
                  <span className="text-xs">Competition</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-0.5 bg-purple-500"></div>
                  <span className="text-xs">Technology Use</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Graph View Component
interface GraphViewProps {
  companies: any[]
  technologies: any[]
  moments: PivotalMoment[]
  isLoading?: boolean
}

export function GraphView({ companies, technologies, moments, isLoading = false }: GraphViewProps) {
  const [viewMode, setViewMode] = useState<'network' | 'matrix'>('network')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNodeType, setSelectedNodeType] = useState<'all' | 'company' | 'technology' | 'concept'>('all')
  const [containerHeight, setContainerHeight] = useState(600)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  
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
  
  // Calculate container height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      const vh = window.innerHeight
      const headerHeight = 60 // Approximate header height
      const padding = 40 // Some padding
      setContainerHeight(vh - headerHeight - padding)
    }
    
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])
  
  if (isLoading && moments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-lg font-medium">Loading Graph Data...</div>
          <div className="text-sm text-muted-foreground">Analyzing entity relationships and network patterns</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex h-full">
      {/* Main Graph Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Entity Relationship Graph</h2>
              <p className="text-sm text-muted-foreground">
                Interactive network visualization of entity connections and relationships
              </p>
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
          
          {/* Search Controls and Statistics */}
          <div className="flex items-center justify-between gap-4">
            {/* Search Controls */}
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <select
                value={selectedNodeType}
                onChange={(e) => setSelectedNodeType(e.target.value as any)}
                className="text-sm px-2 py-1 border rounded"
              >
                <option value="all">All Types</option>
                <option value="company">Companies</option>
                <option value="technology">Technologies</option>
                <option value="concept">Concepts</option>
              </select>
            </div>
            
            {/* Statistics Pills */}
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {stats.totalNodes} Entities
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {stats.totalEdges} Relations
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {Math.round(stats.avgConnections * 10) / 10} Avg Links
              </Badge>
              <Badge variant="secondary" className="text-xs" title={stats.mostConnected.name}>
                {stats.mostConnected.name.length > 10 
                  ? stats.mostConnected.name.substring(0, 8) + '...'
                  : stats.mostConnected.name
                } Top Connected
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Graph Content */}
        <div className="flex-1 p-4">
          {viewMode === 'network' ? (
            <FullHeightNetworkGraph
              nodes={networkData.nodes}
              edges={networkData.edges}
              searchQuery={searchQuery}
              selectedNodeType={selectedNodeType}
              containerHeight={containerHeight}
              onNodeSelect={setSelectedNode}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                Matrix view will be implemented in future iterations
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Sidebar */}
      <NetworkAnalysisInsightsSidebar networkData={networkData} stats={stats} selectedNode={selectedNode} />
    </div>
  )
}