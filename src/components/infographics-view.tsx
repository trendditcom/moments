'use client';

import React, { useState, useEffect } from 'react';
import { Company, Technology } from '@/types/catalog';
import { PivotalMoment } from '@/types/moments';
import { AILandscapeMap } from './ai-landscape-map';
import { TechnologyEvolutionTree } from './technology-evolution-tree';
import { MapIcon, ShareIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface InfographicsViewProps {
  companies: Company[];
  technologies: Technology[];
  moments: PivotalMoment[];
  isLoading: boolean;
}

type ViewMode = 'landscape' | 'evolution' | 'both';

export function InfographicsView({ companies, technologies, moments, isLoading }: InfographicsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('landscape');
  const [containerHeight, setContainerHeight] = useState(600);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Calculate container height
    const updateHeight = () => {
      const headerHeight = 60;
      const padding = 40;
      const viewHeaderHeight = 100;
      const availableHeight = window.innerHeight - headerHeight - padding - viewHeaderHeight;
      setContainerHeight(Math.max(600, availableHeight));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    // Show loading briefly
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 800);

    return () => {
      window.removeEventListener('resize', updateHeight);
      clearTimeout(timer);
    };
  }, []);

  const handleExport = () => {
    // Prepare export data
    const exportData = {
      timestamp: new Date().toISOString(),
      infographics: {
        landscape: {
          companies: companies.length,
          technologies: technologies.length,
          moments: moments.length,
          segments: ['AI/ML Core', 'Enterprise AI', 'Consumer AI', 'AI Infrastructure', 'AI Security', 'Data & Analytics']
        },
        evolution: {
          categories: ['Foundation AI', 'AI Infrastructure', 'AI Applications', 'Enterprise AI', 'AI Research'],
          maturityStages: ['emerging', 'growth', 'mature', 'declining']
        }
      },
      metadata: {
        viewMode,
        exportedBy: 'Moments AI'
      }
    };

    // Download as JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infographics-export-${new Date().toISOString().split('T')[0]}.json`;
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
              <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 gap-6">
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
            <h2 className="text-xl font-semibold text-gray-900">Interactive Infographics</h2>
            <p className="text-sm text-gray-500 mt-1">
              Visual exploration of AI landscape and technology evolution
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* View mode selector */}
            <div className="flex items-center bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('landscape')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'landscape'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapIcon className="h-4 w-4" />
                  <span>Landscape</span>
                </div>
              </button>
              <button
                onClick={() => setViewMode('evolution')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'evolution'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShareIcon className="h-4 w-4" />
                  <span>Evolution</span>
                </div>
              </button>
              <button
                onClick={() => setViewMode('both')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'both'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Both
              </button>
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={moments.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Companies:</span>
            <span className="text-xs font-medium text-gray-900">{companies.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Technologies:</span>
            <span className="text-xs font-medium text-gray-900">{technologies.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Moments:</span>
            <span className="text-xs font-medium text-gray-900">{moments.length}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        {viewMode === 'landscape' && (
          <div className="space-y-6">
            <AILandscapeMap
              companies={companies}
              technologies={technologies}
              moments={moments}
              width={1200}
              height={containerHeight}
            />
          </div>
        )}

        {viewMode === 'evolution' && (
          <div className="space-y-6">
            <TechnologyEvolutionTree
              technologies={technologies}
              moments={moments}
              width={1200}
              height={containerHeight}
            />
          </div>
        )}

        {viewMode === 'both' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AILandscapeMap
              companies={companies}
              technologies={technologies}
              moments={moments}
              width={580}
              height={containerHeight - 100}
            />
            <TechnologyEvolutionTree
              technologies={technologies}
              moments={moments}
              width={580}
              height={containerHeight - 100}
            />
          </div>
        )}
      </div>
    </div>
  );
}