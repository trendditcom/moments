'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarDaysIcon,
  BellIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  BookmarkIcon,
  ChartBarIcon,
  CpuChipIcon,
  ServerStackIcon,
  PresentationChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

// Types for dashboard layout components
interface DashboardHeaderProps {
  onTimeframeChange: (timeframe: string) => void
  selectedTimeframe: string
  alertsCount: number
  analysisDepth: 'strategic' | 'tactical' | 'operational'
  onAnalysisDepthChange: (depth: 'strategic' | 'tactical' | 'operational') => void
  sidebarVisible: boolean
  onSidebarToggle: () => void
}

interface DashboardGridProps {
  analysisDepth: 'strategic' | 'tactical' | 'operational'
  children: React.ReactNode
}

interface DashboardSidebarProps {
  isVisible: boolean
  onToggle: () => void
  children?: React.ReactNode
}

interface DashboardFooterProps {
  systemHealth: {
    dataHealth: 'healthy' | 'warning' | 'error'
    processing: number
    performance: number
  }
}

// Dashboard Header Component
export function DashboardHeader({ 
  onTimeframeChange, 
  selectedTimeframe, 
  alertsCount, 
  analysisDepth, 
  onAnalysisDepthChange,
  sidebarVisible,
  onSidebarToggle 
}: DashboardHeaderProps) {
  const timeframes = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ]

  const depthOptions = [
    { value: 'strategic' as const, label: 'Strategic', icon: EyeIcon, description: 'Executive overview' },
    { value: 'tactical' as const, label: 'Tactical', icon: PresentationChartBarIcon, description: 'Analysis insights' },
    { value: 'operational' as const, label: 'Operational', icon: Cog6ToothIcon, description: 'Detailed operations' }
  ]

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
      {/* Navigation Tabs */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <div className="flex space-x-2">
            <Badge variant="outline" className="text-xs">
              Live
            </Badge>
          </div>
        </div>
      </div>

      {/* Analysis Depth Selector, Timeframe Selector and Alerts */}
      <div className="flex items-center space-x-4">
        {/* Analysis Depth Selector */}
        <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
          {depthOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <Button
                key={option.value}
                variant={analysisDepth === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onAnalysisDepthChange(option.value)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
                  analysisDepth === option.value 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                }`}
                title={option.description}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{option.label}</span>
              </Button>
            )
          })}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center space-x-2">
          <CalendarDaysIcon className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedTimeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            className="bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {timeframes.map(timeframe => (
              <option key={timeframe.value} value={timeframe.value}>
                {timeframe.label}
              </option>
            ))}
          </select>
        </div>

        {/* Trending Alerts */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2"
        >
          <BellIcon className="w-4 h-4" />
          {alertsCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {alertsCount}
            </Badge>
          )}
        </Button>
        
        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className="flex items-center space-x-1.5 px-3 py-1.5"
        >
          <EyeIcon className="w-4 h-4" />
          <span className="text-xs font-medium">
            {sidebarVisible ? 'Hide' : 'Show'} Insights
          </span>
        </Button>
      </div>
    </div>
  )
}

// Responsive Dashboard Grid Component
export function DashboardGrid({ analysisDepth, children }: DashboardGridProps) {
  return (
    <div className="flex flex-col gap-4 p-6">
      {children}
    </div>
  )
}

// Dashboard Sidebar Component
export function DashboardSidebar({ isVisible, onToggle, children }: DashboardSidebarProps) {
  const [activeSection, setActiveSection] = useState<'filters' | 'insights' | 'bookmarks'>('filters')

  if (!isVisible) {
    return null
  }

  return (
    <div className="w-80 border-l border-border bg-card/50 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Insights</h3>
      </div>
      
      <nav className="flex-none p-2">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => setActiveSection('filters')}
            className={`p-2 text-xs font-medium rounded-md transition-colors ${
              activeSection === 'filters'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4 mx-auto mb-1" />
            Filters
          </button>
          
          <button
            onClick={() => setActiveSection('insights')}
            className={`p-2 text-xs font-medium rounded-md transition-colors ${
              activeSection === 'insights'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <ChartBarIcon className="w-4 h-4 mx-auto mb-1" />
            AI Insights
          </button>
          
          <button
            onClick={() => setActiveSection('bookmarks')}
            className={`p-2 text-xs font-medium rounded-md transition-colors ${
              activeSection === 'bookmarks'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <BookmarkIcon className="w-4 h-4 mx-auto mb-1" />
            Views
          </button>
        </div>
      </nav>
      
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'filters' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Smart Filters</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Filter controls will be implemented in future iterations</p>
            </div>
          </div>
        )}
        
        {activeSection === 'insights' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">AI Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>AI-powered insights and recommendations will appear here</p>
            </div>
          </div>
        )}
        
        {activeSection === 'bookmarks' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Saved Views</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Bookmarked dashboard views will be listed here</p>
            </div>
          </div>
        )}
        
        {children}
      </div>
    </div>
  )
}

// Dashboard Footer Component  
export function DashboardFooter({ systemHealth }: DashboardFooterProps) {
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between">
        {/* Data Source Status */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <ServerStackIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Data Health:</span>
            <Badge className={`text-xs ${getHealthBadge(systemHealth.dataHealth)}`}>
              {systemHealth.dataHealth.charAt(0).toUpperCase() + systemHealth.dataHealth.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <CpuChipIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Processing Queue:</span>
            <Badge variant="outline" className="text-xs">
              {systemHealth.processing} items
            </Badge>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Performance:</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${systemHealth.performance > 80 ? 'text-green-600' : 
                systemHealth.performance > 60 ? 'text-yellow-600' : 'text-red-600'}`}
            >
              {systemHealth.performance}%
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </footer>
  )
}

// Main Dashboard Layout Wrapper
interface DashboardLayoutProps {
  children: React.ReactNode
  analysisDepth?: 'strategic' | 'tactical' | 'operational'
  onAnalysisDepthChange?: (depth: 'strategic' | 'tactical' | 'operational') => void
  timeframe?: string
  onTimeframeChange?: (timeframe: string) => void
  systemHealth?: {
    dataHealth: 'healthy' | 'warning' | 'error'
    processing: number
    performance: number
  }
}

export function DashboardLayout({ 
  children, 
  analysisDepth = 'strategic',
  onAnalysisDepthChange = () => {},
  timeframe = '7d',
  onTimeframeChange = () => {},
  systemHealth = { dataHealth: 'healthy', processing: 0, performance: 95 }
}: DashboardLayoutProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false) // Start hidden by default

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        selectedTimeframe={timeframe}
        onTimeframeChange={onTimeframeChange}
        analysisDepth={analysisDepth}
        onAnalysisDepthChange={onAnalysisDepthChange}
        alertsCount={0} // Will be dynamic in future
        sidebarVisible={sidebarVisible}
        onSidebarToggle={() => setSidebarVisible(!sidebarVisible)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <DashboardGrid analysisDepth={analysisDepth}>
            {children}
          </DashboardGrid>
        </div>
        
        <DashboardSidebar
          isVisible={sidebarVisible}
          onToggle={() => setSidebarVisible(!sidebarVisible)}
        >
          {/* Additional sidebar content can be passed as children */}
        </DashboardSidebar>
      </div>
      
      <DashboardFooter systemHealth={systemHealth} />
    </div>
  )
}