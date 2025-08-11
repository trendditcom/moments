'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChartPieIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import {
  ResponsiveContainer,
  Cell,
  Tooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts'
import * as d3 from 'd3'
import { useMomentsStore } from '@/store/moments-store'
import { FACTOR_DEFINITIONS } from '@/lib/factor-classifier'
import { PivotalMoment, Factor, MicroFactor, MacroFactor } from '@/types/moments'

// Data structures for visualizations
interface SunburstData {
  name: string
  value: number
  children?: SunburstData[]
  factor?: Factor
  category?: 'micro' | 'macro'
  level: number
}

interface HeatmapData {
  factor: Factor
  factorName: string
  category: 'micro' | 'macro'
  lowImpact: number
  mediumImpact: number
  highImpact: number
  total: number
  averageImpact: number
}

interface FactorStats {
  factor: Factor
  category: 'micro' | 'macro'
  count: number
  averageImpact: number
  impactDistribution: {
    low: number
    medium: number
    high: number
  }
}

// Helper functions
function generateSunburstData(moments: PivotalMoment[]): SunburstData {
  const microFactors: Record<MicroFactor, number> = {
    company: 0,
    competition: 0,
    partners: 0,
    customers: 0
  }
  
  const macroFactors: Record<MacroFactor, number> = {
    economic: 0,
    geo_political: 0,
    regulation: 0,
    technology: 0,
    environment: 0,
    supply_chain: 0
  }

  // Count factor occurrences
  moments.forEach(moment => {
    moment.classification?.microFactors?.forEach(factor => {
      microFactors[factor] = (microFactors[factor] || 0) + 1
    })
    moment.classification?.macroFactors?.forEach(factor => {
      macroFactors[factor] = (macroFactors[factor] || 0) + 1
    })
  })

  // Build hierarchical structure
  return {
    name: 'All Factors',
    value: 0,
    level: 0,
    children: [
      {
        name: 'Micro Factors',
        value: Object.values(microFactors).reduce((sum, val) => sum + val, 0),
        category: 'micro',
        level: 1,
        children: Object.entries(microFactors).map(([factor, count]) => ({
          name: factor.charAt(0).toUpperCase() + factor.slice(1),
          value: count,
          factor: factor as MicroFactor,
          category: 'micro' as const,
          level: 2
        }))
      },
      {
        name: 'Macro Factors',
        value: Object.values(macroFactors).reduce((sum, val) => sum + val, 0),
        category: 'macro',
        level: 1,
        children: Object.entries(macroFactors).map(([factor, count]) => ({
          name: factor.replace('_', ' ').split(' ').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' '),
          value: count,
          factor: factor as MacroFactor,
          category: 'macro' as const,
          level: 2
        }))
      }
    ]
  }
}

function generateHeatmapData(moments: PivotalMoment[]): HeatmapData[] {
  const factorStats: Partial<Record<Factor, FactorStats>> = {}
  
  // Initialize factor stats
  FACTOR_DEFINITIONS.forEach(def => {
    factorStats[def.factor] = {
      factor: def.factor,
      category: def.category,
      count: 0,
      averageImpact: 0,
      impactDistribution: { low: 0, medium: 0, high: 0 }
    }
  })
  
  // Analyze moments for factor statistics
  moments.forEach(moment => {
    const allFactors = [
      ...(moment.classification?.microFactors || []),
      ...(moment.classification?.macroFactors || [])
    ]
    
    allFactors.forEach(factor => {
      const stats = factorStats[factor]
      if (stats) {
        stats.count++
        const impact = moment.impact?.score || 0
        
        // Categorize impact
        if (impact < 40) stats.impactDistribution.low++
        else if (impact < 70) stats.impactDistribution.medium++
        else stats.impactDistribution.high++
        
        // Calculate running average
        stats.averageImpact = 
          (stats.averageImpact * (stats.count - 1) + impact) / 
          stats.count
      }
    })
  })
  
  return Object.values(factorStats)
    .filter((stats): stats is FactorStats => !!stats && stats.count > 0)
    .map(stats => ({
      factor: stats.factor,
      factorName: stats.factor.replace('_', ' ').split(' ').map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' '),
      category: stats.category,
      lowImpact: stats.impactDistribution.low,
      mediumImpact: stats.impactDistribution.medium,
      highImpact: stats.impactDistribution.high,
      total: stats.count,
      averageImpact: Math.round(stats.averageImpact)
    }))
    .sort((a, b) => b.total - a.total)
}

// Sunburst Chart Component using D3
function SunburstChart({ data, width = 300, height = 300 }: {
  data: SunburstData
  width?: number
  height?: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  
  useEffect(() => {
    if (!svgRef.current || !data) return
    
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove() // Clear previous render
    
    const radius = Math.min(width, height) / 2
    const centerX = width / 2
    const centerY = height / 2
    
    // Create hierarchy
    const hierarchy = d3.hierarchy(data, d => d.children)
      .sum(d => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0))
    
    // Create partition layout
    const partition = d3.partition<SunburstData>()
      .size([2 * Math.PI, radius])
    
    const root = partition(hierarchy)
    
    // Color scales
    const colorScale = d3.scaleOrdinal()
      .domain(['micro', 'macro'])
      .range(['#3b82f6', '#10b981'])
    
    const factorColorScale = d3.scaleOrdinal()
      .domain([
        'company', 'competition', 'partners', 'customers',
        'economic', 'geo_political', 'regulation', 'technology', 'environment', 'supply_chain'
      ])
      .range([
        '#60a5fa', '#93c5fd', '#c3ddfd', '#dbeafe', // micro factor shades
        '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5', '#f0fdfa' // macro factor shades
      ])
    
    // Create arc generator
    const arc = d3.arc<d3.HierarchyRectangularNode<SunburstData>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1)
    
    // Add arcs
    svg.append("g")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll("path")
      .data(root.descendants().filter(d => d.depth > 0))
      .enter().append("path")
      .attr("d", arc)
      .attr("fill", d => {
        if (d.depth === 1) {
          return colorScale(d.data.category || 'micro') as string
        } else {
          return factorColorScale(d.data.factor || 'company') as string
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 0.8)
        
        // Create tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("color", "white")
          .style("padding", "8px 12px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", 1000)
          .html(`
            <div><strong>${d.data.name}</strong></div>
            <div>Count: ${d.data.value}</div>
            <div>Level: ${d.depth === 1 ? 'Category' : 'Factor'}</div>
          `)
        
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
      })
      .on("mousemove", function(event) {
        d3.select(".tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 1)
        d3.selectAll(".tooltip").remove()
      })
    
    // Add center label
    svg.append("text")
      .attr("x", centerX)
      .attr("y", centerY)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#374151")
      .text("Factors")
    
  }, [data, width, height])
  
  return <svg ref={svgRef} width={width} height={height} />
}

// Impact Distribution Heatmap Component
function ImpactHeatmap({ data }: { data: HeatmapData[] }) {
  const [selectedFactor, setSelectedFactor] = useState<Factor | null>(null)
  
  const heatmapCells = useMemo(() => {
    const cells: any[] = []
    
    data.forEach((item, yIndex) => {
      // Low impact
      cells.push({
        x: 0,
        y: yIndex,
        value: item.lowImpact,
        factor: item.factor,
        factorName: item.factorName,
        category: item.category,
        impactLevel: 'Low',
        percentage: Math.round((item.lowImpact / item.total) * 100)
      })
      
      // Medium impact
      cells.push({
        x: 1,
        y: yIndex,
        value: item.mediumImpact,
        factor: item.factor,
        factorName: item.factorName,
        category: item.category,
        impactLevel: 'Medium',
        percentage: Math.round((item.mediumImpact / item.total) * 100)
      })
      
      // High impact
      cells.push({
        x: 2,
        y: yIndex,
        value: item.highImpact,
        factor: item.factor,
        factorName: item.factorName,
        category: item.category,
        impactLevel: 'High',
        percentage: Math.round((item.highImpact / item.total) * 100)
      })
    })
    
    return cells
  }, [data])
  
  const maxValue = Math.max(...heatmapCells.map(cell => cell.value))
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
        <div>Factor</div>
        <div className="text-center">Low Impact</div>
        <div className="text-center">Medium Impact</div>
        <div className="text-center">High Impact</div>
      </div>
      
      {data.map((item, yIndex) => (
        <div key={item.factor} className="grid grid-cols-4 gap-2 items-center">
          <div className="text-sm font-medium">
            <Badge 
              variant="outline" 
              className={item.category === 'micro' ? 'border-blue-300' : 'border-green-300'}
            >
              {item.factorName}
            </Badge>
          </div>
          
          <div 
            className="h-8 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-opacity hover:opacity-80"
            style={{
              backgroundColor: `rgba(239, 68, 68, ${item.lowImpact / maxValue})`,
              color: item.lowImpact > maxValue * 0.5 ? 'white' : 'black'
            }}
            onClick={() => setSelectedFactor(item.factor)}
          >
            {item.lowImpact}
          </div>
          
          <div 
            className="h-8 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-opacity hover:opacity-80"
            style={{
              backgroundColor: `rgba(245, 158, 11, ${item.mediumImpact / maxValue})`,
              color: item.mediumImpact > maxValue * 0.5 ? 'white' : 'black'
            }}
            onClick={() => setSelectedFactor(item.factor)}
          >
            {item.mediumImpact}
          </div>
          
          <div 
            className="h-8 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-opacity hover:opacity-80"
            style={{
              backgroundColor: `rgba(34, 197, 94, ${item.highImpact / maxValue})`,
              color: item.highImpact > maxValue * 0.5 ? 'white' : 'black'
            }}
            onClick={() => setSelectedFactor(item.factor)}
          >
            {item.highImpact}
          </div>
        </div>
      ))}
      
      {selectedFactor && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">
            Factor Analysis: {selectedFactor.replace('_', ' ').toUpperCase()}
          </h4>
          <p className="text-xs text-muted-foreground">
            Click visualization cells to explore detailed factor analysis and correlation insights.
          </p>
        </div>
      )}
      
      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-200 rounded"></div>
          <span>Low Impact</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-200 rounded"></div>
          <span>Medium Impact</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-200 rounded"></div>
          <span>High Impact</span>
        </div>
      </div>
    </div>
  )
}

// Factor Classification Sunburst Component
export function FactorClassificationSunburst() {
  const { moments } = useMomentsStore()
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'json'>('png')
  
  const sunburstData = useMemo(() => generateSunburstData(moments), [moments])
  
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log(`Exporting sunburst chart as ${exportFormat}`)
  }
  
  return (
    <Card className="flex-1 min-w-[400px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-medium">Factor Classification</CardTitle>
            <CardDescription className="text-xs">
              Three-ring structure: micro/macro categories and specific types
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center space-x-1"
            >
              <ArrowDownTrayIcon className="w-3 h-3" />
              <span className="text-xs">Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <SunburstChart data={sunburstData} width={300} height={300} />
          
          <div className="grid grid-cols-2 gap-4 text-xs w-full">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="font-medium">Micro Factors</span>
              </div>
              <div className="space-y-1 text-muted-foreground">
                <div>• Company developments</div>
                <div>• Competitive dynamics</div>
                <div>• Partnership ecosystem</div>
                <div>• Customer relationships</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="font-medium">Macro Factors</span>
              </div>
              <div className="space-y-1 text-muted-foreground">
                <div>• Economic conditions</div>
                <div>• Geopolitical events</div>
                <div>• Regulatory changes</div>
                <div>• Technology breakthroughs</div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            Click to zoom • Hover for details • Inner ring: categories, Outer ring: specific factors
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Impact Distribution Heatmap Component
export function ImpactDistributionHeatmap() {
  const { moments } = useMomentsStore()
  const [viewMode, setViewMode] = useState<'heatmap' | 'table'>('heatmap')
  const [filterCategory, setFilterCategory] = useState<'all' | 'micro' | 'macro'>('all')
  
  const heatmapData = useMemo(() => {
    let data = generateHeatmapData(moments)
    
    if (filterCategory !== 'all') {
      data = data.filter(item => item.category === filterCategory)
    }
    
    return data
  }, [moments, filterCategory])
  
  const totalMoments = moments.length
  const uniqueFactors = heatmapData.length
  
  return (
    <Card className="flex-1 min-w-[500px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-medium">Impact Distribution</CardTitle>
            <CardDescription className="text-xs">
              Factor categories vs impact levels with interactive analysis
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as 'all' | 'micro' | 'macro')}
              className="text-xs px-2 py-1 border rounded"
            >
              <option value="all">All Factors</option>
              <option value="micro">Micro Only</option>
              <option value="macro">Macro Only</option>
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{totalMoments}</div>
              <div className="text-xs text-muted-foreground">Total Moments</div>
            </div>
            <div>
              <div className="text-lg font-bold">{uniqueFactors}</div>
              <div className="text-xs text-muted-foreground">Active Factors</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {Math.round(heatmapData.reduce((sum, item) => sum + item.averageImpact, 0) / Math.max(heatmapData.length, 1))}
              </div>
              <div className="text-xs text-muted-foreground">Avg Impact</div>
            </div>
          </div>
          
          <ImpactHeatmap data={heatmapData} />
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-900">
                <div className="font-medium mb-1">AI-Generated Insights</div>
                <div>
                  {filterCategory === 'micro' 
                    ? "Company-specific factors show higher variance in impact distribution, suggesting personalized moment significance."
                    : filterCategory === 'macro'
                    ? "Industry-wide factors demonstrate consistent patterns, indicating systematic market influences."
                    : "Mixed factor analysis reveals both company-specific and systemic influences on pivotal moments."
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Factor Distribution Analytics Component
export function FactorDistributionAnalytics() {
  return (
    <div className="flex flex-wrap gap-4 w-full">
      <FactorClassificationSunburst />
      <ImpactDistributionHeatmap />
    </div>
  )
}