'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { globalCacheManager } from '@/lib/performance/cache-manager';
import { globalQueryOptimizer } from '@/lib/performance/query-optimizer';
import { globalBackgroundProcessor } from '@/lib/performance/background-processor';
import { 
  CpuChipIcon, 
  ClockIcon, 
  CircleStackIcon, 
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface PerformanceMetrics {
  cache: {
    hitRate: number;
    missRate: number;
    totalSize: number;
    entryCount: number;
    memoryPressure: number;
  };
  query: {
    totalQueries: number;
    cacheHitRate: number;
    averageExecutionTime: number;
    slowQueries: number;
    indexUsage: Record<string, number>;
  };
  background: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    activeTasks: number;
    queuedTasks: number;
    throughput: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
}

interface PerformanceMonitorProps {
  refreshInterval?: number;
  showDetailed?: boolean;
}

export function PerformanceMonitor({ refreshInterval = 5000, showDetailed = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<Array<{
    timestamp: number;
    cacheHitRate: number;
    queryTime: number;
    cpuUsage: number;
    memoryUsage: number;
    throughput: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'cache' | 'query' | 'background'>('overview');

  // Collect performance metrics
  useEffect(() => {
    const collectMetrics = () => {
      try {
        const cacheMetrics = globalCacheManager.getMetrics();
        const queryMetrics = globalQueryOptimizer.getMetrics();
        const backgroundMetrics = globalBackgroundProcessor.getMetrics();

        const newMetrics: PerformanceMetrics = {
          cache: cacheMetrics,
          query: queryMetrics,
          background: backgroundMetrics
        };

        setMetrics(newMetrics);

        // Update historical data
        const now = Date.now();
        setHistoricalData(prev => {
          const newPoint = {
            timestamp: now,
            cacheHitRate: cacheMetrics.hitRate * 100,
            queryTime: queryMetrics.averageExecutionTime,
            cpuUsage: backgroundMetrics.cpuUsage,
            memoryUsage: backgroundMetrics.memoryUsage,
            throughput: backgroundMetrics.throughput
          };

          const updated = [...prev, newPoint];
          // Keep only last 20 data points
          return updated.slice(-20);
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to collect performance metrics:', error);
        setIsLoading(false);
      }
    };

    collectMetrics();
    const interval = setInterval(collectMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Format data for charts
  const chartData = useMemo(() => {
    return historicalData.map((point, index) => ({
      time: index,
      ...point
    }));
  }, [historicalData]);

  // Calculate health status
  const overallHealth = useMemo(() => {
    if (!metrics) return 'unknown';
    
    const issues = [
      metrics.cache.hitRate < 0.6,
      metrics.query.averageExecutionTime > 1000,
      metrics.background.errorRate > 0.1,
      metrics.background.cpuUsage > 80,
      metrics.background.memoryUsage > 85,
      metrics.background.systemHealth === 'critical'
    ];

    const criticalIssues = issues.filter(Boolean).length;
    
    if (criticalIssues >= 3) return 'critical';
    if (criticalIssues >= 1) return 'warning';
    return 'healthy';
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-2" />
            <p>Unable to load performance metrics</p>
          </div>
        </div>
      </div>
    );
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircleIcon className="h-5 w-5" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'critical': return <ExclamationTriangleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
            <p className="text-sm text-gray-500 mt-1">
              Real-time system performance and optimization metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Overall Health */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-md ${getHealthColor(overallHealth)}`}>
              {getHealthIcon(overallHealth)}
              <span className="text-sm font-medium capitalize">{overallHealth}</span>
            </div>
            
            {/* View Selector */}
            <div className="flex items-center bg-gray-50 rounded-lg p-1">
              {['overview', 'cache', 'query', 'background'].map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view as typeof selectedView)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedView === view
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CircleStackIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-900">
                      {Math.round(metrics.cache.hitRate * 100)}%
                    </div>
                    <div className="text-sm text-blue-700">Cache Hit Rate</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {Math.round(metrics.query.averageExecutionTime)}ms
                    </div>
                    <div className="text-sm text-green-700">Avg Query Time</div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CpuChipIcon className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-900">
                      {Math.round(metrics.background.cpuUsage)}%
                    </div>
                    <div className="text-sm text-purple-700">CPU Usage</div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <BoltIcon className="h-8 w-8 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-900">
                      {metrics.background.throughput}
                    </div>
                    <div className="text-sm text-orange-700">Tasks/Min</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Trends Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Performance Trends</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="time"
                      stroke="#6B7280"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="#6B7280"
                      fontSize={10}
                    />
                    <Tooltip 
                      contentStyle={{ fontSize: '12px' }}
                      labelFormatter={(value) => `Point ${value}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cacheHitRate" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Cache Hit Rate (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="queryTime" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Query Time (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpuUsage" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      name="CPU Usage (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'cache' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cache Metrics */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Cache Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Hit Rate</span>
                    <span className="font-medium">{Math.round(metrics.cache.hitRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Miss Rate</span>
                    <span className="font-medium">{Math.round(metrics.cache.missRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Entry Count</span>
                    <span className="font-medium">{metrics.cache.entryCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Memory Pressure</span>
                    <span className="font-medium">{Math.round(metrics.cache.memoryPressure * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Total Size</span>
                    <span className="font-medium">{Math.round(metrics.cache.totalSize / 1024 / 1024)}MB</span>
                  </div>
                </div>
              </div>

              {/* Cache Hit Rate Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Cache Hit Rate Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="time" stroke="#6B7280" fontSize={10} />
                      <YAxis stroke="#6B7280" fontSize={10} domain={[0, 100]} />
                      <Tooltip contentStyle={{ fontSize: '12px' }} />
                      <Area 
                        type="monotone" 
                        dataKey="cacheHitRate" 
                        stroke="#3B82F6" 
                        fill="#3B82F6"
                        fillOpacity={0.3}
                        name="Hit Rate (%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'query' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Query Metrics */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Query Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Total Queries</span>
                    <span className="font-medium">{metrics.query.totalQueries}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Cache Hit Rate</span>
                    <span className="font-medium">{Math.round(metrics.query.cacheHitRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Avg Execution Time</span>
                    <span className="font-medium">{Math.round(metrics.query.averageExecutionTime)}ms</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Slow Queries</span>
                    <span className="font-medium">{metrics.query.slowQueries}</span>
                  </div>
                </div>
              </div>

              {/* Query Time Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Query Performance Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="time" stroke="#6B7280" fontSize={10} />
                      <YAxis stroke="#6B7280" fontSize={10} />
                      <Tooltip contentStyle={{ fontSize: '12px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="queryTime" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Query Time (ms)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Index Usage */}
            {Object.keys(metrics.query.indexUsage).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Index Usage</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(metrics.query.indexUsage).map(([index, usage]) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <div className="text-sm font-medium text-gray-900">{index}</div>
                      <div className="text-sm text-gray-600">{usage} uses</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedView === 'background' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task Status */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Task Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                    <span className="text-sm text-green-700">Completed</span>
                    <span className="font-medium text-green-900">{metrics.background.completedTasks}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                    <span className="text-sm text-blue-700">Active</span>
                    <span className="font-medium text-blue-900">{metrics.background.activeTasks}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-md">
                    <span className="text-sm text-yellow-700">Queued</span>
                    <span className="font-medium text-yellow-900">{metrics.background.queuedTasks}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                    <span className="text-sm text-red-700">Failed</span>
                    <span className="font-medium text-red-900">{metrics.background.failedTasks}</span>
                  </div>
                </div>
              </div>

              {/* System Resources */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">System Resources</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">CPU Usage</span>
                      <span className="font-medium">{Math.round(metrics.background.cpuUsage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(metrics.background.cpuUsage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Memory Usage</span>
                      <span className="font-medium">{Math.round(metrics.background.memoryUsage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(metrics.background.memoryUsage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Throughput</span>
                    <span className="font-medium">{metrics.background.throughput} tasks/min</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="font-medium">{Math.round(metrics.background.errorRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">System Health</span>
                    <span className={`font-medium capitalize ${getHealthColor(metrics.background.systemHealth).split(' ')[0]}`}>
                      {metrics.background.systemHealth}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Usage Chart */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">System Usage Trends</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="time" stroke="#6B7280" fontSize={10} />
                    <YAxis stroke="#6B7280" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="cpuUsage" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      name="CPU Usage (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memoryUsage" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Memory Usage (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="throughput" 
                      stroke="#06B6D4" 
                      strokeWidth={2}
                      name="Throughput (tasks/min)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}