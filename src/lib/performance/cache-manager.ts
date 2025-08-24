/**
 * Advanced Cache Manager for Dashboard Performance Optimization
 * Implements intelligent caching with TTL, memory management, and performance monitoring
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalSize: number;
  entryCount: number;
  oldestEntry: number;
  newestEntry: number;
  memoryPressure: number;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default TTL in milliseconds
  maxEntries: number; // Maximum number of entries
  cleanupInterval: number; // Cleanup interval in milliseconds
  memoryThreshold: number; // Memory pressure threshold (0-1)
}

/**
 * Intelligent Cache Manager with LRU eviction and memory pressure management
 */
export class PerformanceCacheManager {
  private cache = new Map<string, CacheEntry>();
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  };
  
  private config: CacheConfig = {
    maxSize: 100 * 1024 * 1024, // 100MB default
    defaultTTL: 5 * 60 * 1000, // 5 minutes default
    maxEntries: 1000,
    cleanupInterval: 60 * 1000, // 1 minute cleanup
    memoryThreshold: 0.8 // 80% memory threshold
  };

  private cleanupTimer?: NodeJS.Timeout;
  private memoryMonitor?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.startCleanupTimer();
    this.startMemoryMonitoring();
  }

  /**
   * Get cached data with intelligent cache warming and performance tracking
   */
  get<T>(key: string): T | null {
    this.metrics.totalRequests++;
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check TTL expiration
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.metrics.hits++;

    return entry.data;
  }

  /**
   * Set cached data with intelligent size calculation and priority-based eviction
   */
  set<T>(key: string, data: T, options?: {
    ttl?: number;
    priority?: CacheEntry['priority'];
  }): void {
    const now = Date.now();
    const ttl = options?.ttl || this.config.defaultTTL;
    const priority = options?.priority || 'medium';
    
    // Calculate approximate data size
    const size = this.calculateDataSize(data);
    
    // Check memory pressure before adding
    if (this.shouldEvictForMemory(size)) {
      this.performIntelligentEviction(size);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now,
      size,
      priority
    };

    this.cache.set(key, entry);

    // Perform cleanup if necessary
    this.enforceMaxEntries();
  }

  /**
   * Intelligent cache warming for frequently accessed data patterns
   */
  warmCache(patterns: { key: string; loader: () => Promise<any>; priority?: CacheEntry['priority'] }[]): Promise<void[]> {
    return Promise.all(
      patterns.map(async pattern => {
        if (!this.has(pattern.key)) {
          try {
            const data = await pattern.loader();
            this.set(pattern.key, data, { priority: pattern.priority || 'high' });
          } catch (error) {
            console.warn(`Cache warming failed for key ${pattern.key}:`, error);
          }
        }
      })
    );
  }

  /**
   * Batch get with fallback loading for cache misses
   */
  async batchGet<T>(
    keys: string[],
    loader: (missedKeys: string[]) => Promise<Record<string, T>>
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {};
    const missedKeys: string[] = [];

    // Check cache for each key
    keys.forEach(key => {
      const cached = this.get<T>(key);
      if (cached !== null) {
        results[key] = cached;
      } else {
        missedKeys.push(key);
      }
    });

    // Load missed keys
    if (missedKeys.length > 0) {
      try {
        const loaded = await loader(missedKeys);
        Object.entries(loaded).forEach(([key, value]) => {
          this.set(key, value);
          results[key] = value;
        });
      } catch (error) {
        console.error('Batch cache loading failed:', error);
      }
    }

    return results;
  }

  /**
   * Check if key exists in cache (without affecting access stats)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    return now - entry.timestamp <= entry.ttl;
  }

  /**
   * Remove entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear cache with optional pattern matching
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get comprehensive cache metrics
   */
  getMetrics(): CacheMetrics {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const timestamps = entries.map(entry => entry.timestamp);
    
    return {
      hitRate: this.metrics.totalRequests > 0 ? this.metrics.hits / this.metrics.totalRequests : 0,
      missRate: this.metrics.totalRequests > 0 ? this.metrics.misses / this.metrics.totalRequests : 0,
      totalSize,
      entryCount: this.cache.size,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
      memoryPressure: totalSize / this.config.maxSize
    };
  }

  /**
   * Export cache state for debugging and analysis
   */
  exportState(): {
    entries: Array<{ key: string; entry: Omit<CacheEntry, 'data'> }>;
    metrics: typeof this.metrics;
    config: CacheConfig;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry: {
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
        size: entry.size,
        priority: entry.priority
      }
    }));

    return {
      entries,
      metrics: { ...this.metrics },
      config: { ...this.config }
    };
  }

  /**
   * Preload cache with essential data patterns
   */
  async preload(patterns: {
    moments: () => Promise<any[]>;
    companies: () => Promise<any[]>;
    technologies: () => Promise<any[]>;
    correlations: () => Promise<any[]>;
  }): Promise<void> {
    try {
      await Promise.all([
        this.preloadData('moments:all', patterns.moments, 'critical'),
        this.preloadData('companies:all', patterns.companies, 'high'),
        this.preloadData('technologies:all', patterns.technologies, 'high'),
        this.preloadData('correlations:all', patterns.correlations, 'medium')
      ]);
    } catch (error) {
      console.error('Cache preload failed:', error);
    }
  }

  private async preloadData(key: string, loader: () => Promise<any>, priority: CacheEntry['priority']): Promise<void> {
    if (!this.has(key)) {
      const data = await loader();
      this.set(key, data, { priority, ttl: 10 * 60 * 1000 }); // 10 minute TTL for preloaded data
    }
  }

  private calculateDataSize(data: any): number {
    try {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch {
      // Fallback for non-serializable data
      return 1024; // 1KB estimate
    }
  }

  private shouldEvictForMemory(newEntrySize: number): boolean {
    const currentSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    const projectedSize = currentSize + newEntrySize;
    
    return projectedSize > this.config.maxSize * this.config.memoryThreshold;
  }

  private performIntelligentEviction(spaceNeeded: number): void {
    let freedSpace = 0;
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => {
        // Sort by priority (low first), then by LRU
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return a.lastAccessed - b.lastAccessed;
      });

    for (const entry of entries) {
      if (freedSpace >= spaceNeeded) break;
      
      this.cache.delete(entry.key);
      freedSpace += entry.size;
      this.metrics.evictions++;
    }
  }

  private enforceMaxEntries(): void {
    if (this.cache.size <= this.config.maxEntries) return;

    const entriesToRemove = this.cache.size - this.config.maxEntries;
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    for (let i = 0; i < entriesToRemove; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      this.metrics.evictions++;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cleanupInterval);
  }

  private startMemoryMonitoring(): void {
    this.memoryMonitor = setInterval(() => {
      const metrics = this.getMetrics();
      if (metrics.memoryPressure > this.config.memoryThreshold) {
        this.performIntelligentEviction(0); // Evict some entries to relieve pressure
      }
    }, 30000); // Check every 30 seconds
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Destroy cache manager and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }
    this.cache.clear();
  }
}

// Global cache manager instance
export const globalCacheManager = new PerformanceCacheManager({
  maxSize: 150 * 1024 * 1024, // 150MB
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxEntries: 2000,
  cleanupInterval: 30 * 1000, // 30 seconds
  memoryThreshold: 0.75 // 75%
});