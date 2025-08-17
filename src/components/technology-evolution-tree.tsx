'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Technology } from '@/types/catalog';
import { PivotalMoment } from '@/types/moments';
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface TreeNode {
  id: string;
  name: string;
  type: 'root' | 'category' | 'technology' | 'innovation';
  maturity: 'emerging' | 'growth' | 'mature' | 'declining';
  parent?: string;
  children: TreeNode[];
  value: number;
  depth: number;
  x?: number;
  y?: number;
}

interface TechnologyEvolutionTreeProps {
  technologies: Technology[];
  moments: PivotalMoment[];
  width?: number;
  height?: number;
}

const TECHNOLOGY_CATEGORIES = {
  'foundation': {
    name: 'Foundation AI',
    technologies: ['llm', 'neural-networks', 'machine-learning', 'deep-learning'],
    color: '#3B82F6'
  },
  'infrastructure': {
    name: 'AI Infrastructure',
    technologies: ['gpu-clouds', 'edge-computing', 'quantum-computing', 'distributed-systems'],
    color: '#8B5CF6'
  },
  'applications': {
    name: 'AI Applications',
    technologies: ['conversational-ai', 'computer-vision', 'robotics', 'autonomous-systems'],
    color: '#10B981'
  },
  'enterprise': {
    name: 'Enterprise AI',
    technologies: ['agent-platforms', 'workflow-automation', 'decision-systems', 'analytics'],
    color: '#F59E0B'
  },
  'research': {
    name: 'AI Research',
    technologies: ['agi', 'neuromorphic', 'bio-inspired', 'theoretical-ai'],
    color: '#EF4444'
  }
};

export function TechnologyEvolutionTree({ technologies, moments, width = 1000, height = 800 }: TechnologyEvolutionTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [currentYear, setCurrentYear] = useState(2020);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  // Build hierarchical tree structure
  const treeData = useMemo(() => {
    const root: TreeNode = {
      id: 'root',
      name: 'AI Technology Evolution',
      type: 'root',
      maturity: 'growth',
      children: [],
      value: 0,
      depth: 0
    };

    // Create category nodes
    Object.entries(TECHNOLOGY_CATEGORIES).forEach(([categoryId, category]) => {
      const categoryNode: TreeNode = {
        id: categoryId,
        name: category.name,
        type: 'category',
        maturity: 'growth',
        parent: 'root',
        children: [],
        value: 0,
        depth: 1
      };

      // Add technologies to categories
      technologies.forEach(tech => {
        const techMoments = moments.filter(m =>
          m.entities?.technologies?.some(t => t.toLowerCase() === tech.name.toLowerCase())
        );

        // Determine if technology belongs to this category
        const belongsToCategory = category.technologies.some(catTech =>
          tech.name.toLowerCase().includes(catTech) ||
          tech.description?.toLowerCase().includes(catTech)
        );

        if (belongsToCategory || (techMoments.length > 0 && Math.random() < 0.3)) {
          // Determine maturity based on moment patterns
          let maturity: TreeNode['maturity'] = 'emerging';
          const recentMoments = techMoments.filter(m => {
            const date = new Date(m.extractedAt);
            return date.getFullYear() >= 2024;
          });

          if (recentMoments.length > 10) maturity = 'growth';
          else if (recentMoments.length > 5) maturity = 'mature';
          else if (techMoments.length < 3) maturity = 'emerging';

          const techNode: TreeNode = {
            id: tech.id,
            name: tech.name,
            type: 'technology',
            maturity,
            parent: categoryId,
            children: [],
            value: techMoments.length,
            depth: 2
          };

          // Add innovations as children
          const innovations = new Set<string>();
          techMoments.forEach(moment => {
            const keywords = moment.classification?.keywords || [];
            if (keywords.length > 0) {
              keywords.slice(0, 3).forEach(keyword => {
                if (!innovations.has(keyword)) {
                  innovations.add(keyword);
                  techNode.children.push({
                    id: `${tech.id}-${keyword}`,
                    name: keyword,
                    type: 'innovation',
                    maturity: 'emerging',
                    parent: tech.id,
                    children: [],
                    value: 1,
                    depth: 3
                  });
                }
              });
            }
          });

          categoryNode.children.push(techNode);
          categoryNode.value += techNode.value;
        }
      });

      if (categoryNode.children.length > 0) {
        root.children.push(categoryNode);
        root.value += categoryNode.value;
      }
    });

    return root;
  }, [technologies, moments]);

  // Initialize D3 tree visualization
  useEffect(() => {
    if (!svgRef.current || !treeData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 120, bottom: 40, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([innerHeight, innerWidth])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    // Convert to hierarchy
    const hierarchyRoot = d3.hierarchy(treeData);
    const treeNodes = treeLayout(hierarchyRoot);

    // Create links
    const link = g.selectAll('.link')
      .data(treeNodes.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr('fill', 'none')
      .attr('stroke', '#CBD5E1')
      .attr('stroke-width', d => Math.max(1, 4 - d.source.depth))
      .attr('stroke-opacity', 0.6);

    // Create nodes
    const node = g.selectAll('.node')
      .data(treeNodes.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .style('cursor', d => d.data.children.length > 0 ? 'pointer' : 'default')
      .on('click', (event, d) => {
        if (d.data.children.length > 0) {
          const nodeId = d.data.id;
          const newExpanded = new Set(expandedNodes);
          if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
          } else {
            newExpanded.add(nodeId);
          }
          setExpandedNodes(newExpanded);
        }
        setSelectedNode(d.data);
      });

    // Node circles with maturity colors
    const getNodeColor = (node: TreeNode) => {
      if (node.type === 'root') return '#6B7280';
      if (node.type === 'category') {
        const category = Object.entries(TECHNOLOGY_CATEGORIES).find(([id]) => id === node.id);
        return category ? category[1].color : '#6B7280';
      }
      
      // Color by maturity
      switch (node.maturity) {
        case 'emerging': return '#10B981';
        case 'growth': return '#3B82F6';
        case 'mature': return '#F59E0B';
        case 'declining': return '#EF4444';
        default: return '#6B7280';
      }
    };

    node.append('circle')
      .attr('r', d => {
        if (d.data.type === 'root') return 12;
        if (d.data.type === 'category') return 10;
        if (d.data.type === 'technology') return 8;
        return 5;
      })
      .attr('fill', d => getNodeColor(d.data))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Node labels
    node.append('text')
      .attr('dy', '.31em')
      .attr('x', d => d.data.children.length > 0 ? -15 : 15)
      .style('text-anchor', d => d.data.children.length > 0 ? 'end' : 'start')
      .style('font-size', d => {
        if (d.data.type === 'root') return '14px';
        if (d.data.type === 'category') return '12px';
        if (d.data.type === 'technology') return '11px';
        return '10px';
      })
      .style('font-weight', d => d.data.type === 'root' || d.data.type === 'category' ? 'bold' : 'normal')
      .text(d => d.data.name.slice(0, 30));

    // Add maturity indicators
    node.filter(d => d.data.type === 'technology')
      .append('text')
      .attr('x', 15)
      .attr('dy', '1.5em')
      .style('font-size', '9px')
      .style('fill', '#9CA3AF')
      .text(d => `(${d.data.maturity})`);

    // Add growth animations
    if (animationPlaying) {
      const animateGrowth = () => {
        node.selectAll('circle')
          .transition()
          .duration(2000)
          .attr('r', function(d: any) {
            const baseRadius = d.data.type === 'root' ? 12 :
                               d.data.type === 'category' ? 10 :
                               d.data.type === 'technology' ? 8 : 5;
            
            // Simulate growth based on "year"
            if (d.data.maturity === 'emerging' && currentYear > 2022) {
              return baseRadius * 1.2;
            } else if (d.data.maturity === 'growth' && currentYear > 2023) {
              return baseRadius * 1.3;
            }
            return baseRadius;
          });
      };

      animateGrowth();
      const interval = setInterval(() => {
        setCurrentYear(prev => {
          const next = prev + 1;
          return next > 2025 ? 2020 : next;
        });
        animateGrowth();
      }, 2000);

      return () => clearInterval(interval);
    }

    // Add hover effects
    node.on('mouseenter', function(event, d: any) {
      d3.select(this).select('circle')
        .transition().duration(200)
        .attr('r', function() {
          const baseRadius = d.data.type === 'root' ? 12 :
                             d.data.type === 'category' ? 10 :
                             d.data.type === 'technology' ? 8 : 5;
          return baseRadius * 1.3;
        });
    }).on('mouseleave', function(event, d: any) {
      d3.select(this).select('circle')
        .transition().duration(200)
        .attr('r', () => {
          if (d.data.type === 'root') return 12;
          if (d.data.type === 'category') return 10;
          if (d.data.type === 'technology') return 8;
          return 5;
        });
    });

  }, [treeData, width, height, animationPlaying, currentYear, expandedNodes]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Technology Evolution Tree</h3>
            <p className="text-sm text-gray-500 mt-1">
              Hierarchical visualization of AI technology evolution and dependencies
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Timeline:</span>
              <span className="text-sm font-medium text-gray-900">{currentYear}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAnimationPlaying(!animationPlaying)}
                className="p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                title={animationPlaying ? 'Pause' : 'Play'}
              >
                {animationPlaying ? (
                  <PauseIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <PlayIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setCurrentYear(2020);
                  setAnimationPlaying(false);
                }}
                className="p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                title="Reset"
              >
                <ArrowPathIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg ref={svgRef} width={width} height={height} className="w-full" />

        {/* Selected node details */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md border border-gray-200 p-4 max-w-xs">
            <h4 className="font-semibold text-gray-900">{selectedNode.name}</h4>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Maturity:</span>
                <span className="font-medium capitalize">{selectedNode.maturity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Depth:</span>
                <span className="font-medium">{selectedNode.depth}</span>
              </div>
              {selectedNode.value > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Moments:</span>
                  <span className="font-medium">{selectedNode.value}</span>
                </div>
              )}
              {selectedNode.children.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Children:</span>
                  <span className="font-medium">{selectedNode.children.length}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Maturity Stages</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">Emerging</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">Growth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600">Mature</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">Declining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}