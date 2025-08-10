'use client'

import { useCatalogStore } from '@/store/catalog-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Image } from 'lucide-react'
import { Company, Technology } from '@/types/catalog'

interface CatalogViewProps {
  type: 'companies' | 'technologies'
}

export function CatalogView({ type }: CatalogViewProps) {
  const { companies, technologies, isLoading, error } = useCatalogStore()
  const data = type === 'companies' ? companies : technologies

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing {type}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading {type}</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No {type} found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Select a {type} folder to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item) => (
          <CatalogItemCard
            key={item.id}
            item={item}
            type={type}
          />
        ))}
      </div>
    </div>
  )
}

interface CatalogItemCardProps {
  item: Company | Technology
  type: 'companies' | 'technologies'
}

function CatalogItemCard({ item, type }: CatalogItemCardProps) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{item.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-2">
              {item.description || `${type.slice(0, -1)} information`}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {'category' in item ? item.category : 'tech'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {item.content.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">
                Content ({item.content.length})
              </h4>
              <div className="space-y-2">
                {item.content.slice(0, 3).map((content) => (
                  <div key={content.id} className="flex items-center space-x-2 text-sm">
                    {content.type === 'markdown' ? (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Image className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground truncate">
                      {content.name}
                    </span>
                  </div>
                ))}
                {item.content.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{item.content.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
            <span className="truncate ml-2">{item.path}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}