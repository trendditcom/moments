'use client'

import React from 'react'
import { NaturalLanguageQuery } from '@/components/natural-language-query'
import { PivotalMoment } from '@/types/moments'
import { Company, Technology } from '@/types/catalog'

interface QueryViewProps {
  moments: PivotalMoment[]
  companies: Company[]
  technologies: Technology[]
  isLoading?: boolean
  onMomentSelect?: (moment: PivotalMoment) => void
  onEntityClick?: (entity: string, type: 'company' | 'technology') => void
}

export function QueryView({
  moments,
  companies,
  technologies,
  isLoading = false,
  onMomentSelect,
  onEntityClick
}: QueryViewProps) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">AI Query Interface</h1>
          <p className="text-muted-foreground">
            Ask questions about your moments in natural language. Our AI will analyze your data 
            and provide insights, trends, and detailed answers.
          </p>
        </div>

        {/* Query Interface */}
        <NaturalLanguageQuery
          moments={moments}
          companies={companies}
          technologies={technologies}
          activeTab="query"
          isLoading={isLoading}
          onMomentSelect={onMomentSelect}
          onEntityClick={onEntityClick}
        />

        {/* Help Section */}
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Example Questions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Search & Filter</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• &ldquo;Show me all moments related to AI regulation&rdquo;</p>
                <p>• &ldquo;Find high impact moments from Q4 2024&rdquo;</p>
                <p>• &ldquo;Moments about OpenAI in the last 3 months&rdquo;</p>
                <p>• &ldquo;What happened with Tesla this year?&rdquo;</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Analysis & Trends</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• &ldquo;What patterns emerged after the OpenAI leadership changes?&rdquo;</p>
                <p>• &ldquo;Compare Microsoft and Google AI developments&rdquo;</p>
                <p>• &ldquo;Trending technologies in machine learning&rdquo;</p>
                <p>• &ldquo;How many companies mentioned AI regulation?&rdquo;</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Temporal Analysis</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• &ldquo;Show me activity trends over the last 6 months&rdquo;</p>
                <p>• &ldquo;What were the most impactful moments in Q1?&rdquo;</p>
                <p>• &ldquo;Activity timeline for artificial intelligence&rdquo;</p>
                <p>• &ldquo;When did most AI regulation discussions happen?&rdquo;</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Aggregation & Metrics</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• &ldquo;How many moments involve partnerships?&rdquo;</p>
                <p>• &ldquo;Average impact score for technology moments&rdquo;</p>
                <p>• &ldquo;Count of high confidence predictions&rdquo;</p>
                <p>• &ldquo;Total unique companies mentioned&rdquo;</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium text-sm mb-2">Query Tips</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Be specific with your questions for better results</p>
            <p>• Use company names, technology terms, and time periods</p>
            <p>• Try different question styles: &ldquo;Show me...&rdquo;, &ldquo;What are...&rdquo;, &ldquo;How many...&rdquo;</p>
            <p>• Use comparisons: &ldquo;Compare X and Y&rdquo; or &ldquo;X vs Y&rdquo;</p>
            <p>• Ask about trends: &ldquo;trending&rdquo;, &ldquo;emerging&rdquo;, &ldquo;growing&rdquo;, &ldquo;declining&rdquo;</p>
            <p>• Specify time ranges: &ldquo;last week&rdquo;, &ldquo;Q4 2024&rdquo;, &ldquo;this year&rdquo;, &ldquo;past 3 months&rdquo;</p>
          </div>
        </div>
      </div>
    </div>
  )
}