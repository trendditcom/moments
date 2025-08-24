'use client';

import React, { useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Company } from '@/types/catalog';
import { PivotalMoment } from '@/types/moments';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface PerformanceMetrics {
  companyId: string;
  companyName: string;
  innovationVelocity: number;
  marketImpact: number;
  partnershipStrength: number;
  riskFactor: number;
  totalMoments: number;
  color: string;
}

interface CompanyPerformanceRadarProps {
  companies: Company[];
  moments: PivotalMoment[];
}

const RADAR_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#EC4899', // pink
  '#6B7280', // gray
];

export function CompanyPerformanceRadar({ companies, moments }: CompanyPerformanceRadarProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [showAnimation, setShowAnimation] = useState(true);
  const [maxCompanies] = useState(8); // Limit for readability

  // Calculate performance metrics for each company
  const performanceData = useMemo(() => {
    const companyMetrics: PerformanceMetrics[] = [];

    companies.slice(0, maxCompanies).forEach((company, index) => {
      const companyMoments = moments.filter(m => 
        m.entities?.companies?.some(c => c.toLowerCase() === company.name.toLowerCase())
      );

      if (companyMoments.length === 0) return;

      // Innovation Velocity - Rate of new technology/product announcements
      const recentMoments = companyMoments.filter(m => {
        const date = new Date(m.extractedAt);
        const monthsAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 6; // Last 6 months
      });
      const innovationVelocity = Math.min(100, (recentMoments.length / Math.max(1, companyMoments.length)) * 100);

      // Market Impact - Based on high-impact moments and factor variety
      const highImpactMoments = companyMoments.filter(m => 
        m.impact?.score >= 75 // High impact threshold
      );
      const marketImpact = Math.min(100, (highImpactMoments.length / Math.max(1, companyMoments.length)) * 100);

      // Partnership Strength - Based on collaboration moments and entity co-occurrence
      const partnershipMoments = companyMoments.filter(m => {
        const keywords = m.classification?.keywords || [];
        return keywords.some(k => k.toLowerCase().includes('partnership') || 
                            k.toLowerCase().includes('collaboration') ||
                            k.toLowerCase().includes('acquisition') ||
                            k.toLowerCase().includes('alliance'));
      });
      const partnershipStrength = Math.min(100, (partnershipMoments.length / Math.max(1, companyMoments.length)) * 100);

      // Risk Factor - Based on negative sentiment and risk-related keywords (inverted scale)
      const riskMoments = companyMoments.filter(m => {
        const keywords = m.classification?.keywords || [];
        return keywords.some(k => k.toLowerCase().includes('risk') || 
                            k.toLowerCase().includes('challenge') ||
                            k.toLowerCase().includes('threat') ||
                            k.toLowerCase().includes('decline') ||
                            k.toLowerCase().includes('lawsuit') ||
                            k.toLowerCase().includes('controversy'));
      });
      const riskFactor = Math.max(0, 100 - ((riskMoments.length / Math.max(1, companyMoments.length)) * 100));

      companyMetrics.push({
        companyId: company.id,
        companyName: company.name,
        innovationVelocity: Math.round(innovationVelocity),
        marketImpact: Math.round(marketImpact),
        partnershipStrength: Math.round(partnershipStrength),
        riskFactor: Math.round(riskFactor),
        totalMoments: companyMoments.length,
        color: RADAR_COLORS[index % RADAR_COLORS.length]
      });
    });

    return companyMetrics.sort((a, b) => b.totalMoments - a.totalMoments);
  }, [companies, moments, maxCompanies]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    const metrics = ['Innovation Velocity', 'Market Impact', 'Partnership Strength', 'Risk Management'];
    
    return metrics.map(metric => {
      const dataPoint: any = { metric };
      
      performanceData.forEach(company => {
        if (selectedCompanies.size === 0 || selectedCompanies.has(company.companyId)) {
          const key = metric.toLowerCase().replace(' ', '');
          switch (metric) {
            case 'Innovation Velocity':
              dataPoint[company.companyName] = company.innovationVelocity;
              break;
            case 'Market Impact':
              dataPoint[company.companyName] = company.marketImpact;
              break;
            case 'Partnership Strength':
              dataPoint[company.companyName] = company.partnershipStrength;
              break;
            case 'Risk Management':
              dataPoint[company.companyName] = company.riskFactor;
              break;
          }
        }
      });
      
      return dataPoint;
    });
  }, [performanceData, selectedCompanies]);

  // Get companies to display in radar
  const visibleCompanies = useMemo(() => {
    return performanceData.filter(company => 
      selectedCompanies.size === 0 || selectedCompanies.has(company.companyId)
    );
  }, [performanceData, selectedCompanies]);

  const handleCompanyToggle = (companyId: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCompanies.size === performanceData.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(performanceData.map(c => c.companyId)));
    }
  };

  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      companyPerformanceRadar: {
        metrics: ['Innovation Velocity', 'Market Impact', 'Partnership Strength', 'Risk Management'],
        companies: performanceData.map(company => ({
          name: company.companyName,
          metrics: {
            innovationVelocity: company.innovationVelocity,
            marketImpact: company.marketImpact,
            partnershipStrength: company.partnershipStrength,
            riskFactor: company.riskFactor
          },
          totalMoments: company.totalMoments
        }))
      },
      metadata: {
        totalCompanies: performanceData.length,
        selectedCompanies: selectedCompanies.size || performanceData.length,
        analysisDate: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company-performance-radar-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Company Performance Radar</h3>
            <p className="text-sm text-gray-500 mt-1">
              Multi-dimensional performance comparison across key business metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-md">
              <span className="text-xs text-gray-600">Showing:</span>
              <span className="text-xs font-medium text-gray-900">
                {selectedCompanies.size || performanceData.length}/{performanceData.length}
              </span>
            </div>
            <button
              onClick={() => setShowAnimation(!showAnimation)}
              className={`px-3 py-1 rounded-md text-xs font-medium ${
                showAnimation ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'
              }`}
            >
              {showAnimation ? 'Animation On' : 'Animation Off'}
            </button>
            <button
              onClick={handleExport}
              disabled={performanceData.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-3 w-3" />
              Export
            </button>
          </div>
        </div>

        {/* Performance Metrics Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600">Avg Innovation Velocity</div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(performanceData.reduce((sum, c) => sum + c.innovationVelocity, 0) / Math.max(1, performanceData.length))}%
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600">Avg Market Impact</div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(performanceData.reduce((sum, c) => sum + c.marketImpact, 0) / Math.max(1, performanceData.length))}%
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600">Avg Partnership</div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(performanceData.reduce((sum, c) => sum + c.partnershipStrength, 0) / Math.max(1, performanceData.length))}%
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600">Avg Risk Management</div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(performanceData.reduce((sum, c) => sum + c.riskFactor, 0) / Math.max(1, performanceData.length))}%
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {performanceData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="text-sm font-medium">No Performance Data Available</div>
              <div className="text-xs mt-1">Companies need moments to generate performance metrics</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Company Selection Panel */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Companies</h4>
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {selectedCompanies.size === performanceData.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {performanceData.map((company) => (
                      <label
                        key={company.companyId}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCompanies.size === 0 || selectedCompanies.has(company.companyId)}
                          onChange={() => handleCompanyToggle(company.companyId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: company.color }}
                        />
                        <span className="text-sm text-gray-700 flex-1 min-w-0">
                          {company.companyName}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({company.totalMoments})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Performance Summary for Selected Companies */}
                {visibleCompanies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Leaders</h4>
                    <div className="space-y-2">
                      <div className="text-xs">
                        <span className="text-gray-600">Innovation:</span>
                        <span className="font-medium text-gray-900 ml-1">
                          {visibleCompanies.reduce((max, c) => c.innovationVelocity > max.innovationVelocity ? c : max).companyName}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600">Market Impact:</span>
                        <span className="font-medium text-gray-900 ml-1">
                          {visibleCompanies.reduce((max, c) => c.marketImpact > max.marketImpact ? c : max).companyName}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600">Partnerships:</span>
                        <span className="font-medium text-gray-900 ml-1">
                          {visibleCompanies.reduce((max, c) => c.partnershipStrength > max.partnershipStrength ? c : max).companyName}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600">Risk Mgmt:</span>
                        <span className="font-medium text-gray-900 ml-1">
                          {visibleCompanies.reduce((max, c) => c.riskFactor > max.riskFactor ? c : max).companyName}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="lg:col-span-3">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid gridType="polygon" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 12, fill: '#4B5563' }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    />
                    {visibleCompanies.map((company, index) => (
                      <Radar
                        key={company.companyId}
                        name={company.companyName}
                        dataKey={company.companyName}
                        stroke={company.color}
                        fill={company.color}
                        fillOpacity={0.2}
                        strokeWidth={2}
                        dot={{ fill: company.color, strokeWidth: 2, r: 4 }}
                        animationDuration={showAnimation ? 1000 : 0}
                        animationBegin={showAnimation ? index * 200 : 0}
                      />
                    ))}
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      iconType="circle"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Metric Explanations */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-medium text-gray-900">Innovation Velocity</div>
                  <div className="text-gray-600">Rate of new announcements (6mo)</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Market Impact</div>
                  <div className="text-gray-600">Percentage of high-impact moments</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Partnership Strength</div>
                  <div className="text-gray-600">Collaboration & alliance activity</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Risk Management</div>
                  <div className="text-gray-600">Low risk/controversy exposure</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}