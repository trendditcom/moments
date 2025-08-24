/**
 * Data Virtualization System for Large Dataset Performance
 * Implements windowing, lazy loading, and efficient data access patterns
 */

export interface VirtualizedDataOptions {
  pageSize: number;
  bufferSize: number;
  preloadPages: number;
  indexBy?: string;
  sortBy?: string;
  filterFn?: (item: any) => boolean;
}

export interface DataWindow<T> {
  startIndex: number;
  endIndex: number;
  data: T[];
  totalCount: number;
  hasMore: boolean;
}

export interface VirtualizedMetrics {
  totalItems: number;
  loadedPages: number;
  cacheHitRate: number;
  averageLoadTime: number;
  memoryUsage: number;
}

/**
 * Efficient data virtualization for large datasets with intelligent buffering
 */
export class DataVirtualizer<T = any> {
  private pages = new Map<number, T[]>();
  private pageMetadata = new Map<number, { timestamp: number; accessCount: number }>();
  private loadingPages = new Set<number>();
  private dataSource: (page: number, pageSize: number) => Promise<{ data: T[]; totalCount: number }>;
  private options: VirtualizedDataOptions;
  private totalCount = 0;
  private metrics = {
    requests: 0,
    cacheHits: 0,
    totalLoadTime: 0,
    loadCount: 0
  };

  constructor(
    dataSource: (page: number, pageSize: number) => Promise<{ data: T[]; totalCount: number }>,
    options: Partial<VirtualizedDataOptions> = {}
  ) {
    this.dataSource = dataSource;
    this.options = {
      pageSize: 50,
      bufferSize: 3,
      preloadPages: 2,
      ...options
    };
  }

  /**
   * Get virtualized data window with intelligent buffering
   */
  async getWindow(startIndex: number, endIndex: number): Promise<DataWindow<T>> {
    this.metrics.requests++;

    const startPage = Math.floor(startIndex / this.options.pageSize);
    const endPage = Math.floor(endIndex / this.options.pageSize);
    
    // Ensure required pages are loaded
    await this.ensurePagesLoaded(startPage, endPage);
    
    // Preload adjacent pages
    this.preloadAdjacentPages(startPage, endPage);
    
    // Collect data from pages
    const windowData: T[] = [];
    for (let page = startPage; page <= endPage; page++) {
      const pageData = this.pages.get(page);
      if (pageData) {
        const pageStartIndex = page * this.options.pageSize;
        const pageEndIndex = pageStartIndex + pageData.length;
        
        const windowStart = Math.max(startIndex, pageStartIndex);
        const windowEnd = Math.min(endIndex + 1, pageEndIndex);
        
        if (windowStart < windowEnd) {
          const sliceStart = windowStart - pageStartIndex;
          const sliceEnd = windowEnd - pageStartIndex;
          windowData.push(...pageData.slice(sliceStart, sliceEnd));
        }
      }
    }

    return {
      startIndex,
      endIndex,
      data: windowData,
      totalCount: this.totalCount,
      hasMore: endIndex < this.totalCount - 1
    };
  }

  /**
   * Get single item by index with intelligent caching
   */
  async getItem(index: number): Promise<T | null> {
    const page = Math.floor(index / this.options.pageSize);
    await this.ensurePagesLoaded(page, page);
    
    const pageData = this.pages.get(page);
    if (!pageData) return null;
    
    const itemIndex = index % this.options.pageSize;
    return pageData[itemIndex] || null;
  }

  /**
   * Search within loaded data with optional expansion
   */
  async search(
    query: string,
    searchFields: string[],
    maxResults = 50
  ): Promise<{ items: T[]; totalMatches: number; hasMore: boolean }> {
    const results: T[] = [];
    let totalMatches = 0;
    let hasMore = false;

    // Search loaded pages first
    for (const [pageNum, pageData] of this.pages) {
      for (const item of pageData) {
        if (this.matchesQuery(item, query, searchFields)) {
          totalMatches++;
          if (results.length < maxResults) {
            results.push(item);
          } else {
            hasMore = true;
          }
        }
      }
    }

    // If we don't have enough results and there are unloaded pages, expand search
    if (results.length < maxResults && this.hasUnloadedPages()) {
      const additionalResults = await this.expandSearch(query, searchFields, maxResults - results.length);
      results.push(...additionalResults.items);
      totalMatches += additionalResults.totalMatches;
      hasMore = hasMore || additionalResults.hasMore;
    }

    return { items: results, totalMatches, hasMore };
  }

  /**
   * Apply filter and get filtered window
   */
  async getFilteredWindow(
    startIndex: number,
    endIndex: number,
    filterFn: (item: T) => boolean
  ): Promise<DataWindow<T>> {
    // For complex filtering, we may need to load more pages
    const window = await this.getWindow(startIndex, endIndex);
    const filteredData = window.data.filter(filterFn);

    return {
      startIndex,
      endIndex,
      data: filteredData,
      totalCount: window.totalCount, // Note: This is approximate for filtered data
      hasMore: window.hasMore
    };
  }

  /**
   * Prefetch data for improved performance
   */
  async prefetch(startIndex: number, count: number): Promise<void> {
    const endIndex = startIndex + count - 1;
    const startPage = Math.floor(startIndex / this.options.pageSize);
    const endPage = Math.floor(endIndex / this.options.pageSize);

    const prefetchPromises: Promise<void>[] = [];
    for (let page = startPage; page <= endPage; page++) {
      if (!this.pages.has(page) && !this.loadingPages.has(page)) {
        prefetchPromises.push(this.loadPage(page));
      }
    }

    await Promise.all(prefetchPromises);
  }

  /**
   * Get virtualization metrics
   */
  getMetrics(): VirtualizedMetrics {
    const memoryUsage = Array.from(this.pages.values()).reduce((total, page) => {
      return total + this.estimatePageSize(page);
    }, 0);

    return {
      totalItems: this.totalCount,
      loadedPages: this.pages.size,
      cacheHitRate: this.metrics.requests > 0 ? this.metrics.cacheHits / this.metrics.requests : 0,
      averageLoadTime: this.metrics.loadCount > 0 ? this.metrics.totalLoadTime / this.metrics.loadCount : 0,
      memoryUsage
    };
  }

  /**
   * Clear cached pages and reset state
   */
  clear(): void {
    this.pages.clear();
    this.pageMetadata.clear();
    this.loadingPages.clear();
    this.totalCount = 0;
    this.metrics = {
      requests: 0,
      cacheHits: 0,
      totalLoadTime: 0,
      loadCount: 0
    };
  }

  /**
   * Invalidate specific pages
   */
  invalidatePages(startPage: number, endPage: number): void {
    for (let page = startPage; page <= endPage; page++) {
      this.pages.delete(page);
      this.pageMetadata.delete(page);
    }
  }

  /**
   * Get current data state summary
   */
  getState(): {
    loadedPages: number[];
    totalPages: number;
    memoryUsage: number;
    metrics: VirtualizedMetrics;
  } {
    return {
      loadedPages: Array.from(this.pages.keys()).sort((a, b) => a - b),
      totalPages: Math.ceil(this.totalCount / this.options.pageSize),
      memoryUsage: this.getMetrics().memoryUsage,
      metrics: this.getMetrics()
    };
  }

  private async ensurePagesLoaded(startPage: number, endPage: number): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    for (let page = startPage; page <= endPage; page++) {
      if (!this.pages.has(page)) {
        if (this.loadingPages.has(page)) {
          // Wait for ongoing load
          await this.waitForPageLoad(page);
        } else {
          loadPromises.push(this.loadPage(page));
        }
      } else {
        this.updatePageMetadata(page);
        this.metrics.cacheHits++;
      }
    }

    await Promise.all(loadPromises);
  }

  private async loadPage(page: number): Promise<void> {
    if (this.loadingPages.has(page)) return;

    this.loadingPages.add(page);
    const startTime = Date.now();

    try {
      const result = await this.dataSource(page, this.options.pageSize);
      
      this.pages.set(page, result.data);
      this.totalCount = result.totalCount;
      this.updatePageMetadata(page);
      
      const loadTime = Date.now() - startTime;
      this.metrics.totalLoadTime += loadTime;
      this.metrics.loadCount++;

      // Clean up old pages if we're over the buffer limit
      this.cleanupOldPages();
    } finally {
      this.loadingPages.delete(page);
    }
  }

  private async waitForPageLoad(page: number): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.loadingPages.has(page)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 10);
    });
  }

  private preloadAdjacentPages(startPage: number, endPage: number): void {
    const preloadCount = this.options.preloadPages;
    
    // Preload pages before
    for (let i = 1; i <= preloadCount; i++) {
      const page = startPage - i;
      if (page >= 0 && !this.pages.has(page) && !this.loadingPages.has(page)) {
        this.loadPage(page).catch(() => {}); // Silent fail for preloading
      }
    }

    // Preload pages after
    const maxPage = Math.ceil(this.totalCount / this.options.pageSize) - 1;
    for (let i = 1; i <= preloadCount; i++) {
      const page = endPage + i;
      if (page <= maxPage && !this.pages.has(page) && !this.loadingPages.has(page)) {
        this.loadPage(page).catch(() => {}); // Silent fail for preloading
      }
    }
  }

  private updatePageMetadata(page: number): void {
    const metadata = this.pageMetadata.get(page) || { timestamp: 0, accessCount: 0 };
    metadata.timestamp = Date.now();
    metadata.accessCount++;
    this.pageMetadata.set(page, metadata);
  }

  private cleanupOldPages(): void {
    const maxPages = this.options.bufferSize * 3; // Keep more pages than buffer size
    
    if (this.pages.size <= maxPages) return;

    // Sort pages by access time (oldest first)
    const pagesByAccess = Array.from(this.pageMetadata.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const pagesToRemove = this.pages.size - maxPages;
    for (let i = 0; i < pagesToRemove; i++) {
      const [pageNum] = pagesByAccess[i];
      this.pages.delete(pageNum);
      this.pageMetadata.delete(pageNum);
    }
  }

  private matchesQuery(item: T, query: string, fields: string[]): boolean {
    const lowercaseQuery = query.toLowerCase();
    
    return fields.some(field => {
      const value = this.getNestedValue(item, field);
      return value && value.toString().toLowerCase().includes(lowercaseQuery);
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async expandSearch(
    query: string,
    searchFields: string[],
    remainingResults: number
  ): Promise<{ items: T[]; totalMatches: number; hasMore: boolean }> {
    // This is a simplified implementation
    // In practice, this would intelligently load pages to continue searching
    return { items: [], totalMatches: 0, hasMore: false };
  }

  private hasUnloadedPages(): boolean {
    const totalPages = Math.ceil(this.totalCount / this.options.pageSize);
    return this.pages.size < totalPages;
  }

  private estimatePageSize(page: T[]): number {
    try {
      return new Blob([JSON.stringify(page)]).size;
    } catch {
      return page.length * 1024; // 1KB per item estimate
    }
  }
}

/**
 * Virtual List Hook for React components
 */
export function useVirtualizedData<T>(
  dataSource: (page: number, pageSize: number) => Promise<{ data: T[]; totalCount: number }>,
  options?: Partial<VirtualizedDataOptions>
) {
  const [virtualizer] = React.useState(() => new DataVirtualizer(dataSource, options));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    return () => virtualizer.clear();
  }, [virtualizer]);

  const getWindow = React.useCallback(async (startIndex: number, endIndex: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await virtualizer.getWindow(startIndex, endIndex);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Virtualization failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [virtualizer]);

  const search = React.useCallback(async (query: string, fields: string[], maxResults?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      return await virtualizer.search(query, fields, maxResults);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Search failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [virtualizer]);

  return {
    getWindow,
    search,
    prefetch: virtualizer.prefetch.bind(virtualizer),
    getMetrics: virtualizer.getMetrics.bind(virtualizer),
    clear: virtualizer.clear.bind(virtualizer),
    loading,
    error
  };
}

// Import React for the hook
import React from 'react';