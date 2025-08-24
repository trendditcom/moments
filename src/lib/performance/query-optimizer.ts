/**
 * Query Optimizer for Dashboard Performance
 * Implements intelligent query planning, indexing, and optimization strategies
 */

import { globalCacheManager } from './cache-manager';

export interface QueryPlan {
  id: string;
  query: QueryDefinition;
  steps: QueryStep[];
  estimatedCost: number;
  estimatedTime: number;
  cacheKey?: string;
  useCache: boolean;
}

export interface QueryDefinition {
  source: 'moments' | 'companies' | 'technologies' | 'correlations';
  filters?: QueryFilter[];
  aggregations?: QueryAggregation[];
  sorting?: QuerySort[];
  groupBy?: string[];
  limit?: number;
  offset?: number;
  joins?: QueryJoin[];
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith' | 'endsWith' | 'between';
  value: any;
  index?: string;
}

export interface QueryAggregation {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';
  alias?: string;
}

export interface QuerySort {
  field: string;
  direction: 'asc' | 'desc';
  index?: string;
}

export interface QueryJoin {
  source: string;
  target: string;
  on: string;
  type: 'inner' | 'left' | 'right';
}

export interface QueryStep {
  type: 'filter' | 'aggregate' | 'sort' | 'join' | 'group' | 'limit';
  operation: string;
  estimatedCost: number;
  canUseIndex: boolean;
  indexName?: string;
}

export interface QueryIndex {
  name: string;
  field: string;
  type: 'btree' | 'hash' | 'text' | 'compound';
  unique: boolean;
  sparse: boolean;
  data: Map<any, any[]>;
}

export interface QueryMetrics {
  totalQueries: number;
  cacheHitRate: number;
  averageExecutionTime: number;
  slowQueries: number;
  indexUsage: Record<string, number>;
  optimizationsSuggested: number;
}

/**
 * Advanced Query Optimizer with intelligent execution planning
 */
export class QueryOptimizer {
  private indexes = new Map<string, QueryIndex>();
  private queryHistory: Array<{ query: QueryDefinition; executionTime: number; timestamp: number }> = [];
  private metrics: QueryMetrics = {
    totalQueries: 0,
    cacheHitRate: 0,
    averageExecutionTime: 0,
    slowQueries: 0,
    indexUsage: {},
    optimizationsSuggested: 0
  };

  constructor() {
    this.initializeDefaultIndexes();
  }

  /**
   * Create optimized query plan with intelligent cost estimation
   */
  createQueryPlan(query: QueryDefinition): QueryPlan {
    const planId = this.generatePlanId(query);
    const cacheKey = this.generateCacheKey(query);
    
    // Check if we can use cache
    const useCache = this.shouldUseCache(query);
    
    // Generate execution steps
    const steps = this.generateOptimizedSteps(query);
    
    // Calculate costs
    const estimatedCost = steps.reduce((total, step) => total + step.estimatedCost, 0);
    const estimatedTime = this.estimateExecutionTime(steps, query);

    return {
      id: planId,
      query,
      steps,
      estimatedCost,
      estimatedTime,
      cacheKey: useCache ? cacheKey : undefined,
      useCache
    };
  }

  /**
   * Execute optimized query with performance monitoring
   */
  async executeQuery<T>(plan: QueryPlan, dataSource: () => Promise<T[]>): Promise<T[]> {
    const startTime = Date.now();
    this.metrics.totalQueries++;

    try {
      // Try cache first
      if (plan.useCache && plan.cacheKey) {
        const cached = globalCacheManager.get<T[]>(plan.cacheKey);
        if (cached) {
          this.metrics.cacheHitRate = this.updateCacheHitRate(true);
          return cached;
        }
      }

      // Execute query
      let data = await dataSource();
      
      // Apply optimized execution steps
      data = await this.executeSteps(data, plan.steps);
      
      // Cache result if appropriate
      if (plan.useCache && plan.cacheKey) {
        globalCacheManager.set(plan.cacheKey, data, {
          ttl: this.calculateCacheTTL(plan.query),
          priority: this.calculateCachePriority(plan.query)
        });
      }

      const executionTime = Date.now() - startTime;
      this.recordQueryExecution(plan.query, executionTime);
      
      return data;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordQueryExecution(plan.query, executionTime, error as Error);
      throw error;
    }
  }

  /**
   * Create specialized index for optimal query performance
   */
  createIndex(options: {
    name: string;
    field: string;
    type?: QueryIndex['type'];
    unique?: boolean;
    sparse?: boolean;
  }): void {
    const index: QueryIndex = {
      name: options.name,
      field: options.field,
      type: options.type || 'btree',
      unique: options.unique || false,
      sparse: options.sparse || false,
      data: new Map()
    };

    this.indexes.set(options.name, index);
  }

  /**
   * Build index from data source
   */
  buildIndex<T>(indexName: string, data: T[]): void {
    const index = this.indexes.get(indexName);
    if (!index) throw new Error(`Index ${indexName} not found`);

    index.data.clear();

    data.forEach((item, idx) => {
      const value = this.getFieldValue(item, index.field);
      if (value !== undefined && value !== null) {
        if (!index.data.has(value)) {
          index.data.set(value, []);
        }
        index.data.get(value)!.push(idx);
      }
    });
  }

  /**
   * Optimize query filters using available indexes
   */
  optimizeFilters<T>(data: T[], filters: QueryFilter[]): T[] {
    let result = data;

    // Sort filters by optimization potential
    const optimizedFilters = this.sortFiltersByEfficiency(filters);

    for (const filter of optimizedFilters) {
      const index = this.findBestIndex(filter.field, filter.operator);
      
      if (index && this.canUseIndexForFilter(filter, index)) {
        result = this.executeIndexedFilter(result, filter, index);
        this.metrics.indexUsage[index.name] = (this.metrics.indexUsage[index.name] || 0) + 1;
      } else {
        result = this.executeSequentialFilter(result, filter);
      }
    }

    return result;
  }

  /**
   * Analyze query patterns and suggest optimizations
   */
  analyzeQueryPatterns(): {
    recommendedIndexes: Array<{ field: string; reason: string; impact: 'high' | 'medium' | 'low' }>;
    slowQueries: Array<{ query: QueryDefinition; averageTime: number; count: number }>;
    optimizationOpportunities: Array<{ type: string; description: string; impact: string }>;
  } {
    const recommendations = this.generateIndexRecommendations();
    const slowQueries = this.identifySlowQueries();
    const opportunities = this.identifyOptimizationOpportunities();

    return {
      recommendedIndexes: recommendations,
      slowQueries,
      optimizationOpportunities: opportunities
    };
  }

  /**
   * Get comprehensive optimizer metrics
   */
  getMetrics(): QueryMetrics & {
    indexCount: number;
    indexSizes: Record<string, number>;
    recentQueries: number;
  } {
    const indexSizes: Record<string, number> = {};
    this.indexes.forEach((index, name) => {
      indexSizes[name] = index.data.size;
    });

    const recentQueries = this.queryHistory.filter(
      q => Date.now() - q.timestamp < 5 * 60 * 1000 // Last 5 minutes
    ).length;

    return {
      ...this.metrics,
      indexCount: this.indexes.size,
      indexSizes,
      recentQueries
    };
  }

  /**
   * Clear query history and reset metrics
   */
  clearHistory(): void {
    this.queryHistory = [];
    this.metrics = {
      totalQueries: 0,
      cacheHitRate: 0,
      averageExecutionTime: 0,
      slowQueries: 0,
      indexUsage: {},
      optimizationsSuggested: 0
    };
  }

  private initializeDefaultIndexes(): void {
    // Create common indexes for dashboard queries
    this.createIndex({ name: 'moments_date', field: 'extractedAt', type: 'btree' });
    this.createIndex({ name: 'moments_impact', field: 'impact.score', type: 'btree' });
    this.createIndex({ name: 'moments_source', field: 'source.type', type: 'hash' });
    this.createIndex({ name: 'companies_name', field: 'name', type: 'text' });
    this.createIndex({ name: 'technologies_name', field: 'name', type: 'text' });
  }

  private generatePlanId(query: QueryDefinition): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(query: QueryDefinition): string {
    const key = JSON.stringify({
      source: query.source,
      filters: query.filters?.map(f => ({ field: f.field, operator: f.operator, value: f.value })),
      groupBy: query.groupBy,
      sorting: query.sorting,
      limit: query.limit,
      offset: query.offset
    });
    
    return `query_${Buffer.from(key).toString('base64').slice(0, 32)}`;
  }

  private shouldUseCache(query: QueryDefinition): boolean {
    // Don't cache if query has recent time filters or is too specific
    const hasRecentTimeFilter = query.filters?.some(f => 
      f.field.includes('date') || f.field.includes('time')
    );

    const isSimpleQuery = !query.joins?.length && 
                         (!query.filters?.length || query.filters.length <= 3);

    return isSimpleQuery && !hasRecentTimeFilter;
  }

  private generateOptimizedSteps(query: QueryDefinition): QueryStep[] {
    const steps: QueryStep[] = [];

    // Filter steps (optimized order)
    if (query.filters?.length) {
      const optimizedFilters = this.sortFiltersByEfficiency(query.filters);
      optimizedFilters.forEach(filter => {
        const index = this.findBestIndex(filter.field, filter.operator);
        steps.push({
          type: 'filter',
          operation: `${filter.field} ${filter.operator} ${filter.value}`,
          estimatedCost: index ? 10 : 100,
          canUseIndex: !!index,
          indexName: index?.name
        });
      });
    }

    // Join steps
    if (query.joins?.length) {
      query.joins.forEach(join => {
        steps.push({
          type: 'join',
          operation: `${join.type} join ${join.target} on ${join.on}`,
          estimatedCost: 200,
          canUseIndex: false
        });
      });
    }

    // Group by steps
    if (query.groupBy?.length) {
      steps.push({
        type: 'group',
        operation: `group by ${query.groupBy.join(', ')}`,
        estimatedCost: 150,
        canUseIndex: false
      });
    }

    // Aggregation steps
    if (query.aggregations?.length) {
      query.aggregations.forEach(agg => {
        steps.push({
          type: 'aggregate',
          operation: `${agg.function}(${agg.field})`,
          estimatedCost: 50,
          canUseIndex: false
        });
      });
    }

    // Sort steps
    if (query.sorting?.length) {
      query.sorting.forEach(sort => {
        const index = this.findBestIndex(sort.field, 'eq');
        steps.push({
          type: 'sort',
          operation: `sort by ${sort.field} ${sort.direction}`,
          estimatedCost: index ? 30 : 200,
          canUseIndex: !!index,
          indexName: index?.name
        });
      });
    }

    // Limit step
    if (query.limit) {
      steps.push({
        type: 'limit',
        operation: `limit ${query.limit}${query.offset ? ` offset ${query.offset}` : ''}`,
        estimatedCost: 5,
        canUseIndex: false
      });
    }

    return steps;
  }

  private estimateExecutionTime(steps: QueryStep[], query: QueryDefinition): number {
    // Base time estimation (ms)
    let baseTime = 10;
    
    // Add step costs
    const stepTime = steps.reduce((total, step) => total + step.estimatedCost, 0);
    
    // Factor in data size estimate
    const dataSizeMultiplier = this.estimateDataSizeMultiplier(query.source);
    
    return baseTime + (stepTime * dataSizeMultiplier);
  }

  private estimateDataSizeMultiplier(source: string): number {
    // Estimate based on typical data sizes
    switch (source) {
      case 'moments': return 2.0;
      case 'companies': return 0.5;
      case 'technologies': return 0.5;
      case 'correlations': return 1.5;
      default: return 1.0;
    }
  }

  private async executeSteps<T>(data: T[], steps: QueryStep[]): Promise<T[]> {
    let result = data;

    for (const step of steps) {
      switch (step.type) {
        case 'limit':
          const [limitStr, offsetStr] = step.operation.match(/\d+/g) || [];
          const limit = parseInt(limitStr);
          const offset = offsetStr ? parseInt(offsetStr) : 0;
          result = result.slice(offset, offset + limit);
          break;
        // Add other step implementations as needed
      }
    }

    return result;
  }

  private sortFiltersByEfficiency(filters: QueryFilter[]): QueryFilter[] {
    return [...filters].sort((a, b) => {
      const aIndex = this.findBestIndex(a.field, a.operator);
      const bIndex = this.findBestIndex(b.field, b.operator);
      
      // Prioritize indexed filters
      if (aIndex && !bIndex) return -1;
      if (!aIndex && bIndex) return 1;
      
      // Prioritize equality filters
      if (a.operator === 'eq' && b.operator !== 'eq') return -1;
      if (a.operator !== 'eq' && b.operator === 'eq') return 1;
      
      return 0;
    });
  }

  private findBestIndex(field: string, operator: string): QueryIndex | null {
    for (const index of this.indexes.values()) {
      if (index.field === field || field.startsWith(index.field + '.')) {
        // Check if index type supports the operator
        if (this.indexSupportsOperator(index.type, operator)) {
          return index;
        }
      }
    }
    return null;
  }

  private indexSupportsOperator(indexType: QueryIndex['type'], operator: string): boolean {
    switch (indexType) {
      case 'hash':
        return operator === 'eq';
      case 'btree':
        return ['eq', 'gt', 'gte', 'lt', 'lte', 'between'].includes(operator);
      case 'text':
        return ['eq', 'contains', 'startsWith', 'endsWith'].includes(operator);
      case 'compound':
        return true;
      default:
        return false;
    }
  }

  private canUseIndexForFilter(filter: QueryFilter, index: QueryIndex): boolean {
    return this.indexSupportsOperator(index.type, filter.operator) && 
           index.data.has(filter.value);
  }

  private executeIndexedFilter<T>(data: T[], filter: QueryFilter, index: QueryIndex): T[] {
    const indices = index.data.get(filter.value) || [];
    return indices.map(idx => data[idx]).filter(Boolean);
  }

  private executeSequentialFilter<T>(data: T[], filter: QueryFilter): T[] {
    return data.filter(item => {
      const value = this.getFieldValue(item, filter.field);
      return this.evaluateFilter(value, filter.operator, filter.value);
    });
  }

  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateFilter(value: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'eq': return value === filterValue;
      case 'ne': return value !== filterValue;
      case 'gt': return value > filterValue;
      case 'gte': return value >= filterValue;
      case 'lt': return value < filterValue;
      case 'lte': return value <= filterValue;
      case 'in': return Array.isArray(filterValue) && filterValue.includes(value);
      case 'contains': return value && value.toString().includes(filterValue);
      case 'startsWith': return value && value.toString().startsWith(filterValue);
      case 'endsWith': return value && value.toString().endsWith(filterValue);
      case 'between': return value >= filterValue[0] && value <= filterValue[1];
      default: return false;
    }
  }

  private calculateCacheTTL(query: QueryDefinition): number {
    // Longer TTL for simpler queries
    const baseTime = 5 * 60 * 1000; // 5 minutes
    const complexity = (query.filters?.length || 0) + (query.aggregations?.length || 0);
    
    return Math.max(60 * 1000, baseTime - (complexity * 30 * 1000));
  }

  private calculateCachePriority(query: QueryDefinition): 'low' | 'medium' | 'high' | 'critical' {
    if (query.aggregations?.length) return 'high';
    if (query.groupBy?.length) return 'medium';
    if (query.filters?.length && query.filters.length > 2) return 'medium';
    return 'low';
  }

  private recordQueryExecution(query: QueryDefinition, executionTime: number, error?: Error): void {
    this.queryHistory.push({
      query,
      executionTime,
      timestamp: Date.now()
    });

    // Update metrics
    this.updateMetrics(executionTime, !error);

    // Keep only recent history
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.queryHistory = this.queryHistory.filter(q => q.timestamp > cutoff);
  }

  private updateMetrics(executionTime: number, success: boolean): void {
    const totalTime = this.metrics.averageExecutionTime * (this.metrics.totalQueries - 1) + executionTime;
    this.metrics.averageExecutionTime = totalTime / this.metrics.totalQueries;

    if (executionTime > 1000) { // Slow query threshold: 1 second
      this.metrics.slowQueries++;
    }
  }

  private updateCacheHitRate(hit: boolean): number {
    const total = this.metrics.totalQueries;
    const currentHits = this.metrics.cacheHitRate * (total - 1);
    const newHits = currentHits + (hit ? 1 : 0);
    return newHits / total;
  }

  private generateIndexRecommendations(): Array<{ field: string; reason: string; impact: 'high' | 'medium' | 'low' }> {
    const fieldUsage = new Map<string, number>();
    
    // Analyze recent queries for field usage
    this.queryHistory.forEach(({ query }) => {
      query.filters?.forEach(filter => {
        fieldUsage.set(filter.field, (fieldUsage.get(filter.field) || 0) + 1);
      });
      query.sorting?.forEach(sort => {
        fieldUsage.set(sort.field, (fieldUsage.get(sort.field) || 0) + 1);
      });
    });

    const recommendations: Array<{ field: string; reason: string; impact: 'high' | 'medium' | 'low' }> = [];
    
    fieldUsage.forEach((count, field) => {
      if (count >= 5 && !this.hasIndexForField(field)) {
        recommendations.push({
          field,
          reason: `Field used in ${count} queries but not indexed`,
          impact: count >= 10 ? 'high' : count >= 7 ? 'medium' : 'low'
        });
      }
    });

    return recommendations;
  }

  private identifySlowQueries(): Array<{ query: QueryDefinition; averageTime: number; count: number }> {
    const queryGroups = new Map<string, { times: number[]; query: QueryDefinition }>();
    
    this.queryHistory.forEach(({ query, executionTime }) => {
      const key = this.generateCacheKey(query);
      if (!queryGroups.has(key)) {
        queryGroups.set(key, { times: [], query });
      }
      queryGroups.get(key)!.times.push(executionTime);
    });

    const slowQueries: Array<{ query: QueryDefinition; averageTime: number; count: number }> = [];
    
    queryGroups.forEach(({ times, query }) => {
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (averageTime > 500 && times.length >= 3) { // 500ms threshold, minimum 3 executions
        slowQueries.push({ query, averageTime, count: times.length });
      }
    });

    return slowQueries.sort((a, b) => b.averageTime - a.averageTime);
  }

  private identifyOptimizationOpportunities(): Array<{ type: string; description: string; impact: string }> {
    const opportunities: Array<{ type: string; description: string; impact: string }> = [];

    // Check cache hit rate
    if (this.metrics.cacheHitRate < 0.6) {
      opportunities.push({
        type: 'caching',
        description: 'Low cache hit rate - consider increasing cache TTL or improving cache keys',
        impact: 'medium'
      });
    }

    // Check slow queries
    if (this.metrics.slowQueries > this.metrics.totalQueries * 0.1) {
      opportunities.push({
        type: 'performance',
        description: 'High percentage of slow queries - review query complexity and indexing',
        impact: 'high'
      });
    }

    // Check index usage
    const unusedIndexes = Array.from(this.indexes.keys()).filter(
      name => !this.metrics.indexUsage[name]
    );
    
    if (unusedIndexes.length > 0) {
      opportunities.push({
        type: 'indexing',
        description: `${unusedIndexes.length} unused indexes - consider removing them to save memory`,
        impact: 'low'
      });
    }

    return opportunities;
  }

  private hasIndexForField(field: string): boolean {
    return Array.from(this.indexes.values()).some(index => 
      index.field === field || field.startsWith(index.field + '.')
    );
  }
}

// Global query optimizer instance
export const globalQueryOptimizer = new QueryOptimizer();