'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Company, Technology } from '@/types/catalog';
import { PivotalMoment } from '@/types/moments';
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface LandscapeNode {
  id: string;
  name: string;
  type: 'company' | 'technology' | 'segment';
  x: number;
  y: number;
  radius: number;
  segment: string;
  influence: number;
  color: string;
  connections: string[];
  momentum?: { dx: number; dy: number };
}

interface MarketSegment {
  id: string;
  name: string;
  center: { x: number; y: number };
  radius: number;
  color: string;
  companies: string[];
  technologies: string[];
}

interface AILandscapeMapProps {
  companies: Company[];
  technologies: Technology[];
  moments: PivotalMoment[];
  width?: number;
  height?: number;
}

const MARKET_SEGMENTS: MarketSegment[] = [
  { id: 'ai-ml', name: 'AI/ML Core', center: { x: 400, y: 300 }, radius: 150, color: '#3B82F6', companies: [], technologies: [] },
  { id: 'enterprise', name: 'Enterprise AI', center: { x: 600, y: 400 }, radius: 130, color: '#10B981', companies: [], technologies: [] },
  { id: 'consumer', name: 'Consumer AI', center: { x: 300, y: 500 }, radius: 120, color: '#F59E0B', companies: [], technologies: [] },
  { id: 'infrastructure', name: 'AI Infrastructure', center: { x: 500, y: 200 }, radius: 140, color: '#8B5CF6', companies: [], technologies: [] },
  { id: 'security', name: 'AI Security', center: { x: 700, y: 300 }, radius: 110, color: '#EF4444', companies: [], technologies: [] },
  { id: 'data', name: 'Data & Analytics', center: { x: 400, y: 500 }, radius: 125, color: '#06B6D4', companies: [], technologies: [] },
];

export function AILandscapeMap({ companies, technologies, moments, width = 1000, height = 700 }: AILandscapeMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<LandscapeNode | null>(null);
  const [viewMode, setViewMode] = useState<'global' | 'segment' | 'detail'>('global');
  const [animationEnabled, setAnimationEnabled] = useState(true);

  // Process data into landscape nodes
  const landscapeData = useMemo(() => {
    const nodes: LandscapeNode[] = [];
    const segmentMap = new Map<string, MarketSegment>();
    
    // Initialize segment map
    MARKET_SEGMENTS.forEach(segment => {
      segmentMap.set(segment.id, { ...segment });
    });

    // Assign companies to segments based on keywords and moment analysis
    companies.forEach(company => {
      const companyMoments = moments.filter(m => 
        m.entities?.companies?.some(c => c.toLowerCase() === company.name.toLowerCase())
      );
      
      // Determine primary segment based on moment classification
      let primarySegment = 'ai-ml';
      const segmentScores = new Map<string, number>();
      
      companyMoments.forEach(moment => {
        // Check if this moment relates to the company (microFactors is an array)
        const companyFactors = moment.classification?.microFactors;
        const keywords = moment.classification?.keywords || [];
        
        if (companyFactors && companyFactors.length > 0) {
          if (keywords.some(k => k.toLowerCase().includes('enterprise'))) {
            segmentScores.set('enterprise', (segmentScores.get('enterprise') || 0) + 1);
          }
          if (keywords.some(k => k.toLowerCase().includes('consumer'))) {
            segmentScores.set('consumer', (segmentScores.get('consumer') || 0) + 1);
          }
          if (keywords.some(k => k.toLowerCase().includes('infrastructure') || k.toLowerCase().includes('cloud'))) {
            segmentScores.set('infrastructure', (segmentScores.get('infrastructure') || 0) + 1);
          }
          if (keywords.some(k => k.toLowerCase().includes('security'))) {
            segmentScores.set('security', (segmentScores.get('security') || 0) + 1);
          }
          if (keywords.some(k => k.toLowerCase().includes('data') || k.toLowerCase().includes('analytics'))) {
            segmentScores.set('data', (segmentScores.get('data') || 0) + 1);
          }
        }
      });

      // Find segment with highest score
      let maxScore = 0;
      segmentScores.forEach((score, segment) => {
        if (score > maxScore) {
          maxScore = score;
          primarySegment = segment;
        }
      });

      const segment = segmentMap.get(primarySegment)!;
      segment.companies.push(company.id);

      // Calculate position within segment
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * segment.radius * 0.8;
      const x = segment.center.x + Math.cos(angle) * distance;
      const y = segment.center.y + Math.sin(angle) * distance;

      nodes.push({
        id: company.id,
        name: company.name,
        type: 'company',
        x,
        y,
        radius: 10 + companyMoments.length * 2,
        segment: primarySegment,
        influence: companyMoments.length,
        color: segment.color,
        connections: [],
        momentum: { dx: (Math.random() - 0.5) * 0.5, dy: (Math.random() - 0.5) * 0.5 }
      });
    });

    // Assign technologies to segments
    technologies.forEach(tech => {
      const techMoments = moments.filter(m => 
        m.entities?.technologies?.some(t => t.toLowerCase() === tech.name.toLowerCase())
      );
      
      // Determine primary segment
      let primarySegment = 'ai-ml';
      if (tech.name.toLowerCase().includes('enterprise')) primarySegment = 'enterprise';
      else if (tech.name.toLowerCase().includes('consumer')) primarySegment = 'consumer';
      else if (tech.name.toLowerCase().includes('infrastructure') || tech.name.toLowerCase().includes('cloud')) primarySegment = 'infrastructure';
      else if (tech.name.toLowerCase().includes('security')) primarySegment = 'security';
      else if (tech.name.toLowerCase().includes('data')) primarySegment = 'data';

      const segment = segmentMap.get(primarySegment)!;
      segment.technologies.push(tech.id);

      // Calculate position
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * segment.radius * 0.8;
      const x = segment.center.x + Math.cos(angle) * distance;
      const y = segment.center.y + Math.sin(angle) * distance;

      nodes.push({
        id: tech.id,
        name: tech.name,
        type: 'technology',
        x,
        y,
        radius: 8 + techMoments.length * 1.5,
        segment: primarySegment,
        influence: techMoments.length,
        color: d3.color(segment.color)?.darker(0.5)?.toString() || segment.color,
        connections: [],
        momentum: { dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3 }
      });
    });

    // Identify connections based on co-occurrence in moments
    nodes.forEach(node => {
      const nodeMoments = moments.filter(m => {
        if (node.type === 'company') {
          return m.entities?.companies?.some(c => c.toLowerCase() === node.name.toLowerCase());
        } else {
          return m.entities?.technologies?.some(t => t.toLowerCase() === node.name.toLowerCase());
        }
      });

      nodes.forEach(otherNode => {
        if (node.id !== otherNode.id) {
          const sharedMoments = nodeMoments.filter(m => {
            if (otherNode.type === 'company') {
              return m.entities?.companies?.some(c => c.toLowerCase() === otherNode.name.toLowerCase());
            } else {
              return m.entities?.technologies?.some(t => t.toLowerCase() === otherNode.name.toLowerCase());
            }
          });

          if (sharedMoments.length > 0) {
            node.connections.push(otherNode.id);
          }
        }
      });
    });

    return { nodes, segments: Array.from(segmentMap.values()) };
  }, [companies, technologies, moments]);

  // Initialize D3 visualization
  useEffect(() => {
    if (!svgRef.current || landscapeData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    const container = svg.append('g');

    // Draw market segment territories
    const territories = container.selectAll('.territory')
      .data(landscapeData.segments)
      .enter().append('g')
      .attr('class', 'territory');

    territories.append('circle')
      .attr('cx', d => d.center.x)
      .attr('cy', d => d.center.y)
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('opacity', 0.1)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    territories.append('text')
      .attr('x', d => d.center.x)
      .attr('y', d => d.center.y - d.radius - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', d => d.color)
      .text(d => d.name);

    // Draw connections
    const connections = container.selectAll('.connection')
      .data(landscapeData.nodes.flatMap(node => 
        node.connections.map(targetId => ({
          source: node,
          target: landscapeData.nodes.find(n => n.id === targetId)
        })).filter(link => link.target)
      ))
      .enter().append('line')
      .attr('class', 'connection')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target!.x)
      .attr('y2', d => d.target!.y)
      .attr('stroke', '#94A3B8')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);

    // Draw nodes
    const nodes = container.selectAll('.node')
      .data(landscapeData.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d);
        if (viewMode === 'global') setViewMode('segment');
        else if (viewMode === 'segment') setViewMode('detail');
      });

    // Node circles
    nodes.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('opacity', 0.8)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Node labels (show on zoom)
    nodes.append('text')
      .attr('dy', -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#475569')
      .attr('opacity', d => zoomLevel > 1.5 ? 1 : 0)
      .text(d => d.name.slice(0, 15));

    // Add hover effects
    nodes.on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .transition().duration(200)
        .attr('r', d.radius * 1.2);
      
      // Show tooltip
      const tooltip = container.append('g')
        .attr('class', 'tooltip')
        .attr('transform', `translate(${d.x},${d.y - d.radius - 20})`);
      
      const rect = tooltip.append('rect')
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', 'white')
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1);
      
      const text = tooltip.append('text')
        .attr('x', 5)
        .attr('y', 15)
        .attr('font-size', '12px')
        .text(`${d.name} (${d.type}) - Influence: ${d.influence}`);
      
      const bbox = text.node()?.getBBox();
      if (bbox) {
        rect.attr('x', bbox.x - 5)
          .attr('y', bbox.y - 5)
          .attr('width', bbox.width + 10)
          .attr('height', bbox.height + 10);
      }
    }).on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .transition().duration(200)
        .attr('r', d.radius);
      
      container.selectAll('.tooltip').remove();
    });

    // Animate strategic movements
    if (animationEnabled) {
      const animateMovement = () => {
        nodes.transition()
          .duration(3000)
          .ease(d3.easeLinear)
          .attr('transform', d => {
            if (d.momentum) {
              d.x += d.momentum.dx;
              d.y += d.momentum.dy;
              
              // Keep within segment bounds
              const segment = landscapeData.segments.find(s => s.id === d.segment);
              if (segment) {
                const dx = d.x - segment.center.x;
                const dy = d.y - segment.center.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > segment.radius * 0.9) {
                  d.momentum.dx *= -1;
                  d.momentum.dy *= -1;
                }
              }
            }
            return `translate(${d.x},${d.y})`;
          });

        connections.transition()
          .duration(3000)
          .ease(d3.easeLinear)
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target!.x)
          .attr('y2', d => d.target!.y);
      };

      const interval = setInterval(animateMovement, 3000);
      return () => clearInterval(interval);
    }
  }, [landscapeData, zoomLevel, viewMode, animationEnabled]);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleTo as any,
      zoomLevel * 1.5
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleTo as any,
      zoomLevel / 1.5
    );
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
    setZoomLevel(1);
    setViewMode('global');
    setSelectedNode(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Landscape Map</h3>
            <p className="text-sm text-gray-500 mt-1">
              Geographic visualization of AI market territories and competitive positioning
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-md">
              <span className="text-xs text-gray-600">View:</span>
              <span className="text-xs font-medium text-gray-900">{viewMode}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-md">
              <span className="text-xs text-gray-600">Zoom:</span>
              <span className="text-xs font-medium text-gray-900">{Math.round(zoomLevel * 100)}%</span>
            </div>
            <button
              onClick={() => setAnimationEnabled(!animationEnabled)}
              className={`px-3 py-1 rounded-md text-xs font-medium ${
                animationEnabled ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'
              }`}
            >
              {animationEnabled ? 'Animation On' : 'Animation Off'}
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg ref={svgRef} width={width} height={height} className="w-full" />
        
        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50"
            title="Zoom In"
          >
            <MagnifyingGlassPlusIcon className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50"
            title="Zoom Out"
          >
            <MagnifyingGlassMinusIcon className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50"
            title="Reset View"
          >
            <ArrowPathIcon className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Selected node details */}
        {selectedNode && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md border border-gray-200 p-4 max-w-xs">
            <h4 className="font-semibold text-gray-900">{selectedNode.name}</h4>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Segment:</span>
                <span className="font-medium">{landscapeData.segments.find(s => s.id === selectedNode.segment)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Influence:</span>
                <span className="font-medium">{selectedNode.influence}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connections:</span>
                <span className="font-medium">{selectedNode.connections.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Market Segments</h4>
          <div className="space-y-1">
            {MARKET_SEGMENTS.map(segment => (
              <div key={segment.id} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-xs text-gray-600">{segment.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}