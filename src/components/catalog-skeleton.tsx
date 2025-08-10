'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function CatalogSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded-md w-48 animate-pulse" />
        <div className="h-4 bg-muted rounded-md w-72 animate-pulse" />
      </div>
      
      {/* Tabs skeleton */}
      <div className="flex space-x-8 border-b border-border pb-2">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="h-6 bg-muted rounded-md w-24 animate-pulse"
          />
        ))}
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded-md w-3/4" />
                <div className="h-4 bg-muted rounded-md w-1/2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded-md w-full" />
                <div className="h-4 bg-muted rounded-md w-5/6" />
                <div className="h-4 bg-muted rounded-md w-4/6" />
                
                <div className="flex gap-2 mt-4">
                  <div className="h-6 bg-muted rounded-full w-16" />
                  <div className="h-6 bg-muted rounded-full w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function CatalogHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-4 h-4 bg-muted rounded-full" />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <div className="h-4 bg-muted rounded-md w-16" />
          <div className="h-5 bg-muted rounded-full w-12" />
          <div className="h-5 bg-muted rounded-full w-16" />
        </div>
        <div className="h-3 bg-muted rounded-md w-24 mt-1" />
      </div>
    </div>
  )
}