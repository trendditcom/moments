'use client'

import { useState } from 'react'
import { FolderSelection } from '@/components/folder-selection'
import { CatalogView } from '@/components/catalog-view'
import { useCatalogStore } from '@/store/catalog-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const { companies, technologies } = useCatalogStore()
  const [activeTab, setActiveTab] = useState<'companies' | 'technologies'>('companies')

  const hasData = companies.length > 0 || technologies.length > 0

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Moments</h1>
            <p className="text-sm text-muted-foreground">
              AI Business Intelligence Dashboard
            </p>
          </div>
          <FolderSelection />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {!hasData ? (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Welcome to Moments</CardTitle>
                <CardDescription>
                  Get started by selecting your companies and technologies folders to hydrate your catalogs.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <FolderSelection />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="border-b border-border">
              <nav className="flex space-x-8 px-6 py-2">
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'companies'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Companies ({companies.length})
                </button>
                <button
                  onClick={() => setActiveTab('technologies')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'technologies'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Technologies ({technologies.length})
                </button>
              </nav>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <CatalogView key={activeTab} type={activeTab} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}