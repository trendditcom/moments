'use client';

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PivotalMoment } from '@/types/moments';
import { ChevronDownIcon, ChevronRightIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface FactorImpact {
  id: string;
  name: string;
  type: 'micro' | 'macro';
  category: string;
  impact: number;
  cumulativeImpact: number;
  momentCount: number;
  contributingMoments: PivotalMoment[];
  color: string;
}

interface FactorImpactWaterfallProps {
  moments: PivotalMoment[];
}

const FACTOR_CATEGORIES = {
  micro: {
    company: { name: 'Company Factors', color: '#3B82F6' },
    competition: { name: 'Competition Factors', color: '#10B981' },
    partners: { name: 'Partner Factors', color: '#F59E0B' },
    customers: { name: 'Customer Factors', color: '#EF4444' }
  },
  macro: {
    economic: { name: 'Economic Factors', color: '#8B5CF6' },
    'geo-political': { name: 'Geo-Political Factors', color: '#06B6D4' },
    regulation: { name: 'Regulation Factors', color: '#84CC16' },
    technology: { name: 'Technology Factors', color: '#F97316' },
    environment: { name: 'Environment Factors', color: '#EC4899' },
    'supply-chain': { name: 'Supply Chain Factors', color: '#6B7280' }
  }
};

export function FactorImpactWaterfall({ moments }: FactorImpactWaterfallProps) {
  const [selectedFactorType, setSelectedFactorType] = useState<'all' | 'micro' | 'macro'>('all');
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // Process factor impacts from moments
  const factorImpacts = useMemo(() => {
    const factorMap = new Map<string, {
      type: 'micro' | 'macro';
      category: string;
      moments: PivotalMoment[];
      totalImpact: number;
    }>();

    moments.forEach(moment => {
      const microFactors = moment.classification?.microFactors || [];
      const macroFactors = moment.classification?.macroFactors || [];
      
      // Get impact score
      const impactScore = moment.impact?.score >= 75 ? 3 :
                         moment.impact?.score >= 50 ? 2 : 1;

      // Process micro factors
      microFactors.forEach(factor => {
        const key = `micro-${factor}`;
        if (!factorMap.has(key)) {
          factorMap.set(key, {
            type: 'micro',
            category: factor,
            moments: [],
            totalImpact: 0
          });
        }
        const factorData = factorMap.get(key)!;
        factorData.moments.push(moment);
        factorData.totalImpact += impactScore;
      });

      // Process macro factors
      macroFactors.forEach(factor => {
        const key = `macro-${factor}`;
        if (!factorMap.has(key)) {
          factorMap.set(key, {
            type: 'macro',
            category: factor,
            moments: [],
            totalImpact: 0
          });
        }
        const factorData = factorMap.get(key)!;
        factorData.moments.push(moment);
        factorData.totalImpact += impactScore;
      });
    });

    // Convert to FactorImpact array and sort by impact
    const impacts: FactorImpact[] = Array.from(factorMap.entries()).map(([key, data]) => {
      // Safely lookup category config with fallback
      const typeCategories = FACTOR_CATEGORIES[data.type];
      const categoryConfig: { name: string; color: string } | null = typeCategories ? 
        (typeCategories as any)[data.category] : null;
      
      return {
        id: key,
        name: categoryConfig?.name || `${data.category} Factors`,
        type: data.type,
        category: data.category,
        impact: data.totalImpact,
        cumulativeImpact: 0, // Will be calculated below
        momentCount: data.moments.length,
        contributingMoments: data.moments,
        color: categoryConfig?.color || '#6B7280'
      };
    }).sort((a, b) => b.impact - a.impact);

    // Calculate cumulative impacts
    let cumulative = 0;
    impacts.forEach(factor => {
      cumulative += factor.impact;
      factor.cumulativeImpact = cumulative;
    });

    return impacts;
  }, [moments]);

  // Filter factors based on selected type and search term
  const filteredFactors = useMemo(() => {
    let filtered = factorImpacts;

    if (selectedFactorType !== 'all') {
      filtered = filtered.filter(factor => factor.type === selectedFactorType);
    }

    if (searchTerm) {
      filtered = filtered.filter(factor => 
        factor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factor.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [factorImpacts, selectedFactorType, searchTerm]);

  // Prepare waterfall chart data
  const waterfallData = useMemo(() => {
    const data: any[] = [];
    let runningTotal = 0;

    // Starting point
    data.push({
      name: 'Baseline',
      value: 0,
      cumulative: 0,
      type: 'baseline',
      color: '#E5E7EB'
    });

    // Add each factor
    filteredFactors.forEach((factor, index) => {
      const previousTotal = runningTotal;
      runningTotal += factor.impact;
      
      data.push({
        name: factor.name.slice(0, 12) + (factor.name.length > 12 ? '...' : ''),
        fullName: factor.name,
        value: factor.impact,
        cumulative: runningTotal,
        previousTotal,
        type: 'factor',
        factorType: factor.type,
        factorId: factor.id,
        color: factor.color,
        momentCount: factor.momentCount
      });
    });

    // Total
    data.push({
      name: 'Total Impact',
      value: runningTotal,
      cumulative: runningTotal,
      type: 'total',
      color: '#374151'
    });

    return data;
  }, [filteredFactors]);

  const handleFactorClick = (factorId: string) => {
    setExpandedFactor(expandedFactor === factorId ? null : factorId);
  };

  const handleSegmentClick = (data: any) => {
    if (data.factorId) {
      setSelectedSegment(selectedSegment === data.factorId ? null : data.factorId);
    }
  };

  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      factorImpactWaterfall: {
        totalFactors: filteredFactors.length,
        totalImpact: filteredFactors.reduce((sum, f) => sum + f.impact, 0),
        filterType: selectedFactorType,
        searchTerm,
        factors: filteredFactors.map(factor => ({
          name: factor.name,
          type: factor.type,
          category: factor.category,
          impact: factor.impact,
          cumulativeImpact: factor.cumulativeImpact,
          momentCount: factor.momentCount,
          contributingMoments: factor.contributingMoments.map(m => ({
            id: m.id,
            title: m.title,
            impact: m.impact?.score || 0,
            extractedAt: m.extractedAt
          }))
        }))
      },
      metadata: {
        analysisDate: new Date().toISOString(),
        baseMoments: moments.length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factor-impact-waterfall-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Custom tooltip for waterfall chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.fullName || label}</p>
          {data.type === 'factor' && (
            <>
              <p className="text-sm text-gray-600">
                Type: <span className="font-medium capitalize">{data.factorType}</span>
              </p>
              <p className="text-sm text-gray-600">
                Impact: <span className="font-medium">{data.value}</span>
              </p>
              <p className="text-sm text-gray-600">
                Moments: <span className="font-medium">{data.momentCount}</span>
              </p>
              <p className="text-sm text-gray-600">
                Cumulative: <span className="font-medium">{data.cumulative}</span>
              </p>
            </>
          )}
          {data.type === 'total' && (
            <p className="text-sm text-gray-600">
              Total Impact: <span className="font-medium">{data.value}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Factor Impact Waterfall</h3>
            <p className="text-sm text-gray-500 mt-1">
              Cumulative factor impacts showing trend drivers and momentum
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-md">
              <span className="text-xs text-gray-600">Factors:</span>
              <span className="text-xs font-medium text-gray-900">{filteredFactors.length}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-md">
              <span className="text-xs text-gray-600">Impact:</span>
              <span className="text-xs font-medium text-gray-900">
                {filteredFactors.reduce((sum, f) => sum + f.impact, 0)}
              </span>
            </div>
            <button
              onClick={handleExport}
              disabled={filteredFactors.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-3 w-3" />
              Export
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-4">
          {/* Factor Type Filter */}
          <div className="flex items-center bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => setSelectedFactorType('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedFactorType === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Factors
            </button>
            <button
              onClick={() => setSelectedFactorType('micro')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedFactorType === 'micro'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Micro
            </button>
            <button
              onClick={() => setSelectedFactorType('macro')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedFactorType === 'macro'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Macro
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search factors..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredFactors.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="text-sm font-medium">No Factor Data Available</div>
              <div className="text-xs mt-1">Moments need factor classifications to generate impact analysis</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Waterfall Chart */}
            <div className="xl:col-span-2">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={10}
                      stroke="#6B7280"
                    />
                    <YAxis 
                      fontSize={10}
                      stroke="#6B7280"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="value" 
                      onClick={handleSegmentClick}
                      cursor="pointer"
                    >
                      {waterfallData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke={selectedSegment === entry.factorId ? '#374151' : 'none'}
                          strokeWidth={selectedSegment === entry.factorId ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Factor Details Panel */}
            <div className="xl:col-span-1">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Factor Details</h4>
                
                {/* Top Contributing Factors */}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-700">Top Contributors</h5>
                  <div className="space-y-1">
                    {filteredFactors.slice(0, 5).map((factor) => (
                      <div key={factor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: factor.color }}
                          />
                          <span className="text-xs text-gray-700 truncate">
                            {factor.name}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {factor.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Factor Breakdown by Type */}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-700">Factor Breakdown</h5>
                  <div className="space-y-1">
                    {['micro', 'macro'].map(type => {
                      const typeFactors = filteredFactors.filter(f => f.type === type);
                      const typeImpact = typeFactors.reduce((sum, f) => sum + f.impact, 0);
                      const percentage = filteredFactors.length > 0 ? 
                        Math.round((typeImpact / filteredFactors.reduce((sum, f) => sum + f.impact, 0)) * 100) : 0;
                      
                      return (
                        <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <span className="text-xs text-gray-700 capitalize">{type} Factors</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{typeFactors.length}</span>
                            <span className="text-xs font-medium text-gray-900">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Factor Details */}
                {selectedSegment && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-700">Selected Factor</h5>
                    {(() => {
                      const factor = filteredFactors.find(f => f.id === selectedSegment);
                      if (!factor) return null;
                      
                      return (
                        <div className="bg-blue-50 rounded-md p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: factor.color }}
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {factor.name}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <span className="font-medium text-gray-900 ml-1 capitalize">{factor.type}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Impact:</span>
                              <span className="font-medium text-gray-900 ml-1">{factor.impact}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Moments:</span>
                              <span className="font-medium text-gray-900 ml-1">{factor.momentCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Cumulative:</span>
                              <span className="font-medium text-gray-900 ml-1">{factor.cumulativeImpact}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFactorClick(factor.id)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            {expandedFactor === factor.id ? (
                              <ChevronDownIcon className="h-3 w-3" />
                            ) : (
                              <ChevronRightIcon className="h-3 w-3" />
                            )}
                            View Contributing Moments
                          </button>
                          
                          {expandedFactor === factor.id && (
                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                              {factor.contributingMoments.slice(0, 5).map((moment, index) => (
                                <div key={index} className="text-xs p-2 bg-white rounded border">
                                  <div className="font-medium text-gray-900 line-clamp-1">
                                    {moment.title}
                                  </div>
                                  <div className="text-gray-500 mt-1">
                                    Impact: {moment.impact?.score || 'unknown'}
                                  </div>
                                </div>
                              ))}
                              {factor.contributingMoments.length > 5 && (
                                <div className="text-xs text-gray-500 text-center pt-1">
                                  +{factor.contributingMoments.length - 5} more moments
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}