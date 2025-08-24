'use client';

import React, { useState, useEffect } from 'react';
import { Company, Technology } from '@/types/catalog';
import { PivotalMoment } from '@/types/moments';
import { CompanyPerformanceRadar } from './company-performance-radar';
import { FactorImpactWaterfall } from './factor-impact-waterfall';
import { ChartBarIcon, FunnelIcon, ArrowsUpDownIcon, ShareIcon } from '@heroicons/react/24/outline';

interface ComparativeAnalysisViewProps {
  companies: Company[];
  technologies: Technology[];
  moments: PivotalMoment[];
  isLoading: boolean;
}

type ViewMode = 'radar' | 'waterfall' | 'both' | 'split';

export function ComparativeAnalysisView({ 
  companies, 
  technologies, 
  moments, 
  isLoading 
}: ComparativeAnalysisViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [containerHeight, setContainerHeight] = useState(600);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Calculate container height
    const updateHeight = () => {
      const headerHeight = 60;
      const padding = 40;
      const viewHeaderHeight = 120;
      const availableHeight = window.innerHeight - headerHeight - padding - viewHeaderHeight;
      setContainerHeight(Math.max(600, availableHeight));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    // Show loading briefly
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 600);

    return () => {
      window.removeEventListener('resize', updateHeight);
      clearTimeout(timer);
    };
  }, []);

  const handleExportAll = () => {
    // Prepare comprehensive export data
    const exportData = {
      timestamp: new Date().toISOString(),
      comparativeAnalysis: {
        overview: {
          companies: companies.length,
          technologies: technologies.length,
          moments: moments.length,
          viewMode
        },
        companyPerformance: {
          totalCompanies: companies.slice(0, 8).length,
          metrics: ['Innovation Velocity', 'Market Impact', 'Partnership Strength', 'Risk Management']
        },
        factorAnalysis: {
          microFactors: moments.reduce((acc, m) => acc + (m.classification?.microFactors?.length || 0), 0),
          macroFactors: moments.reduce((acc, m) => acc + (m.classification?.macroFactors?.length || 0), 0),
          totalFactorInstances: moments.reduce((acc, m) => 
            acc + (m.classification?.microFactors?.length || 0) + (m.classification?.macroFactors?.length || 0), 0
          )
        }
      },
      metadata: {
        analysisDate: new Date().toISOString(),
        exportedBy: 'Moments AI - Comparative Analysis'
      }
    };

    // Download as JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparative-analysis-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show skeleton loading
  if (isInitializing || isLoading) {
    return (
      <div className="h-full overflow-hidden flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="animate-pulse">
              <div className="h-6 w-56 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-72 bg-gray-200 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Comparative Analysis</h2>
            <p className="text-sm text-gray-500 mt-1">
              Multi-dimensional performance comparison and factor impact analysis
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* View mode selector */}
            <div className="flex items-center bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('radar')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'radar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4" />
                  <span>Radar</span>
                </div>
              </button>
              <button
                onClick={() => setViewMode('waterfall')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'waterfall'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4" />
                  <span>Waterfall</span>
                </div>
              </button>
              <button
                onClick={() => setViewMode('both')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'both'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Both
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'split'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowsUpDownIcon className="h-4 w-4" />
                  <span>Split</span>
                </div>
              </button>
            </div>

            {/* Export button */}
            <button
              onClick={handleExportAll}
              disabled={moments.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShareIcon className="h-4 w-4" />
              Export All
            </button>
          </div>
        </div>

        {/* Analysis Statistics */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Companies:</span>
            <span className="text-xs font-medium text-gray-900">{Math.min(8, companies.length)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Total Moments:</span>
            <span className="text-xs font-medium text-gray-900">{moments.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Factor Instances:</span>
            <span className="text-xs font-medium text-gray-900">
              {moments.reduce((acc, m) => 
                acc + (m.classification?.microFactors?.length || 0) + (m.classification?.macroFactors?.length || 0), 0
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">High Impact:</span>
            <span className="text-xs font-medium text-gray-900">
              {moments.filter(m => m.impact?.score >= 75).length}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        {viewMode === 'radar' && (
          <div className="space-y-6">
            <CompanyPerformanceRadar
              companies={companies}
              moments={moments}
            />
          </div>
        )}

        {viewMode === 'waterfall' && (
          <div className="space-y-6">
            <FactorImpactWaterfall
              moments={moments}
            />
          </div>
        )}

        {viewMode === 'both' && (
          <div className="space-y-6">
            <CompanyPerformanceRadar
              companies={companies}
              moments={moments}
            />
            <FactorImpactWaterfall
              moments={moments}
            />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" style={{ minHeight: containerHeight - 100 }}>
            <CompanyPerformanceRadar
              companies={companies}
              moments={moments}
            />
            <FactorImpactWaterfall
              moments={moments}
            />
          </div>
        )}

        {/* Analysis Insights Panel */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Analysis Insights</h3>
            <p className="text-sm text-gray-500 mt-1">
              Key findings from comparative performance and factor impact analysis
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Performance Leaders */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Leaders</h4>
                <div className="space-y-2 text-xs">
                  {(() => {
                    const companiesWithMoments = companies.filter(c => 
                      moments.some(m => m.entities?.companies?.some(ec => ec.toLowerCase() === c.name.toLowerCase()))
                    ).slice(0, 3);
                    
                    return companiesWithMoments.map(company => {
                      const companyMoments = moments.filter(m => 
                        m.entities?.companies?.some(ec => ec.toLowerCase() === company.name.toLowerCase())
                      );
                      const highImpact = companyMoments.filter(m => 
                        m.impact?.score >= 75
                      ).length;
                      
                      return (
                        <div key={company.id} className="flex justify-between">
                          <span className="text-gray-600">{company.name}:</span>
                          <span className="font-medium text-gray-900">{highImpact} high-impact</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Factor Distribution */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Factor Distribution</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Micro Factors:</span>
                    <span className="font-medium text-gray-900">
                      {moments.reduce((acc, m) => acc + (m.classification?.microFactors?.length || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Macro Factors:</span>
                    <span className="font-medium text-gray-900">
                      {moments.reduce((acc, m) => acc + (m.classification?.macroFactors?.length || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">High Impact:</span>
                    <span className="font-medium text-gray-900">
                      {moments.filter(m => m.impact?.score >= 75).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Market Activity */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Market Activity</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recent Moments:</span>
                    <span className="font-medium text-gray-900">
                      {moments.filter(m => {
                        const date = new Date(m.extractedAt);
                        const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
                        return daysAgo <= 30;
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Partnerships:</span>
                    <span className="font-medium text-gray-900">
                      {moments.filter(m => {
                        const keywords = m.classification?.keywords || [];
                        return keywords.some(k => k.toLowerCase().includes('partnership') || 
                                            k.toLowerCase().includes('collaboration'));
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Events:</span>
                    <span className="font-medium text-gray-900">
                      {moments.filter(m => {
                        const keywords = m.classification?.keywords || [];
                        return keywords.some(k => k.toLowerCase().includes('risk') || 
                                            k.toLowerCase().includes('challenge'));
                      }).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis Coverage */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Analysis Coverage</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Companies Analyzed:</span>
                    <span className="font-medium text-gray-900">
                      {companies.filter(c => 
                        moments.some(m => m.entities?.companies?.some(ec => ec.toLowerCase() === c.name.toLowerCase()))
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Technologies:</span>
                    <span className="font-medium text-gray-900">
                      {technologies.filter(t => 
                        moments.some(m => m.entities?.technologies?.some(et => et.toLowerCase() === t.name.toLowerCase()))
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coverage:</span>
                    <span className="font-medium text-gray-900">
                      {Math.round((companies.filter(c => 
                        moments.some(m => m.entities?.companies?.some(ec => ec.toLowerCase() === c.name.toLowerCase()))
                      ).length / Math.max(1, companies.length)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}