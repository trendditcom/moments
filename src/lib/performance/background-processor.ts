/**
 * Background Processor for Non-Blocking Operations
 * Implements task queuing, priority processing, and performance monitoring
 */

export interface BackgroundTask {
  id: string;
  type: string;
  payload: any;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = critical, 5 = low
  retries: number;
  maxRetries: number;
  createdAt: number;
  scheduledAt?: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  dependencies?: string[];
  timeout?: number;
}

export interface TaskProcessor<T = any> {
  type: string;
  handler: (payload: T, task: BackgroundTask) => Promise<any>;
  maxConcurrency?: number;
  timeout?: number;
  retryStrategy?: (attempt: number, error: Error) => number; // Returns delay in ms
}

export interface ProcessorMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeTasks: number;
  queuedTasks: number;
  averageProcessingTime: number;
  throughput: number; // tasks per minute
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface TaskQueue {
  high: BackgroundTask[];
  medium: BackgroundTask[];
  low: BackgroundTask[];
}

/**
 * Advanced Background Processor with intelligent task scheduling
 */
export class BackgroundProcessor {
  private queues: TaskQueue = { high: [], medium: [], low: [] };
  private activeTasks = new Map<string, BackgroundTask>();
  private completedTasks: BackgroundTask[] = [];
  private processors = new Map<string, TaskProcessor>();
  private concurrencyLimits = new Map<string, number>();
  private activeWorkers = new Map<string, number>();
  private isProcessing = false;
  private processingInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  
  private metrics: ProcessorMetrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    activeTasks: 0,
    queuedTasks: 0,
    averageProcessingTime: 0,
    throughput: 0,
    errorRate: 0,
    cpuUsage: 0,
    memoryUsage: 0
  };

  private config = {
    maxConcurrency: 10,
    processInterval: 100, // ms
    metricsInterval: 5000, // ms
    maxRetainedTasks: 1000,
    taskTimeout: 30000, // 30 seconds default
    adaptiveConcurrency: true,
    cpuThreshold: 70, // percentage
    memoryThreshold: 80 // percentage
  };

  constructor(config?: Partial<typeof BackgroundProcessor.prototype.config>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.initializeDefaultProcessors();
    this.start();
  }

  /**
   * Register task processor with specific handler and configuration
   */
  registerProcessor<T>(processor: TaskProcessor<T>): void {
    this.processors.set(processor.type, processor);
    this.concurrencyLimits.set(processor.type, processor.maxConcurrency || 3);
    this.activeWorkers.set(processor.type, 0);
  }

  /**
   * Queue task for background processing with priority and scheduling options
   */
  queueTask(task: Omit<BackgroundTask, 'id' | 'createdAt' | 'retries'>): string {
    const taskId = this.generateTaskId();
    const fullTask: BackgroundTask = {
      id: taskId,
      createdAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      ...task
    };

    this.addToQueue(fullTask);
    this.metrics.totalTasks++;
    this.updateQueueMetrics();

    return taskId;
  }

  /**
   * Queue multiple related tasks with dependency management
   */
  queueBatch(tasks: Array<Omit<BackgroundTask, 'id' | 'createdAt' | 'retries'>>): string[] {
    const taskIds: string[] = [];
    
    tasks.forEach((task, index) => {
      const taskId = this.queueTask({
        ...task,
        dependencies: index > 0 ? [taskIds[index - 1]] : task.dependencies
      });
      taskIds.push(taskId);
    });

    return taskIds;
  }

  /**
   * Schedule task for future execution
   */
  scheduleTask(
    task: Omit<BackgroundTask, 'id' | 'createdAt' | 'retries' | 'scheduledAt'>,
    delay: number
  ): string {
    return this.queueTask({
      ...task,
      scheduledAt: Date.now() + delay
    });
  }

  /**
   * Cancel pending task
   */
  cancelTask(taskId: string): boolean {
    // Remove from queues
    for (const queue of Object.values(this.queues)) {
      const index = queue.findIndex(task => task.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
        this.updateQueueMetrics();
        return true;
      }
    }

    // Mark active task for cancellation
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      activeTask.error = 'CANCELLED';
      return true;
    }

    return false;
  }

  /**
   * Get task status and progress information
   */
  getTaskStatus(taskId: string): {
    status: 'queued' | 'active' | 'completed' | 'failed' | 'cancelled' | 'not_found';
    task?: BackgroundTask;
    position?: number;
  } {
    // Check active tasks
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      return { status: 'active', task: activeTask };
    }

    // Check completed tasks
    const completedTask = this.completedTasks.find(task => task.id === taskId);
    if (completedTask) {
      const status = completedTask.error 
        ? (completedTask.error === 'CANCELLED' ? 'cancelled' : 'failed')
        : 'completed';
      return { status, task: completedTask };
    }

    // Check queued tasks
    for (const [priority, queue] of Object.entries(this.queues)) {
      const position = queue.findIndex(task => task.id === taskId);
      if (position !== -1) {
        return { 
          status: 'queued', 
          task: queue[position], 
          position: this.calculateQueuePosition(priority as keyof TaskQueue, position)
        };
      }
    }

    return { status: 'not_found' };
  }

  /**
   * Get comprehensive processor metrics and performance data
   */
  getMetrics(): ProcessorMetrics & {
    queueSizes: Record<keyof TaskQueue, number>;
    processorStats: Record<string, { active: number; limit: number; utilization: number }>;
    recentThroughput: number[];
    systemHealth: 'healthy' | 'warning' | 'critical';
  } {
    const queueSizes = {
      high: this.queues.high.length,
      medium: this.queues.medium.length,
      low: this.queues.low.length
    };

    const processorStats: Record<string, { active: number; limit: number; utilization: number }> = {};
    this.processors.forEach((_, type) => {
      const active = this.activeWorkers.get(type) || 0;
      const limit = this.concurrencyLimits.get(type) || 1;
      processorStats[type] = {
        active,
        limit,
        utilization: limit > 0 ? active / limit : 0
      };
    });

    const systemHealth = this.calculateSystemHealth();

    return {
      ...this.metrics,
      queueSizes,
      processorStats,
      recentThroughput: this.getRecentThroughput(),
      systemHealth
    };
  }

  /**
   * Pause task processing
   */
  pause(): void {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }

  /**
   * Resume task processing
   */
  resume(): void {
    if (!this.isProcessing) {
      this.start();
    }
  }

  /**
   * Clear all queues and reset processor state
   */
  clear(): void {
    this.queues = { high: [], medium: [], low: [] };
    this.activeTasks.clear();
    this.completedTasks = [];
    this.updateQueueMetrics();
  }

  /**
   * Shutdown processor and cleanup resources
   */
  shutdown(): Promise<void> {
    return new Promise((resolve) => {
      this.pause();
      
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }

      // Wait for active tasks to complete or timeout
      const checkActiveTasksInterval = setInterval(() => {
        if (this.activeTasks.size === 0) {
          clearInterval(checkActiveTasksInterval);
          resolve();
        }
      }, 100);

      // Force shutdown after 10 seconds
      setTimeout(() => {
        clearInterval(checkActiveTasksInterval);
        this.activeTasks.clear();
        resolve();
      }, 10000);
    });
  }

  private initializeDefaultProcessors(): void {
    // Moment analysis processor
    this.registerProcessor({
      type: 'moment_analysis',
      maxConcurrency: 2,
      timeout: 60000, // 1 minute
      handler: async (payload, task) => {
        // Simulate moment analysis processing
        await this.simulateWork(payload.complexity || 1000);
        return { analyzed: true, momentId: payload.momentId };
      },
      retryStrategy: (attempt, error) => Math.min(1000 * Math.pow(2, attempt), 30000)
    });

    // Correlation calculation processor
    this.registerProcessor({
      type: 'correlation_calculation',
      maxConcurrency: 3,
      timeout: 30000,
      handler: async (payload, task) => {
        await this.simulateWork(payload.complexity || 500);
        return { correlations: payload.entityPairs?.length || 0 };
      }
    });

    // Data indexing processor
    this.registerProcessor({
      type: 'data_indexing',
      maxConcurrency: 1, // Sequential processing for indexing
      timeout: 45000,
      handler: async (payload, task) => {
        await this.simulateWork(payload.recordCount || 100);
        return { indexed: payload.recordCount };
      }
    });

    // Cache warming processor
    this.registerProcessor({
      type: 'cache_warming',
      maxConcurrency: 4,
      timeout: 20000,
      handler: async (payload, task) => {
        await this.simulateWork(200);
        return { warmed: payload.cacheKeys?.length || 0 };
      }
    });
  }

  private start(): void {
    this.isProcessing = true;
    
    this.processingInterval = setInterval(() => {
      this.processNextTask();
    }, this.config.processInterval);

    this.metricsInterval = setInterval(() => {
      this.updateSystemMetrics();
    }, this.config.metricsInterval);
  }

  private async processNextTask(): Promise<void> {
    if (!this.isProcessing) return;

    const task = this.getNextTask();
    if (!task) return;

    // Check if task can be processed (dependencies, scheduling, concurrency)
    if (!this.canProcessTask(task)) {
      return;
    }

    // Remove from queue and add to active tasks
    this.removeFromQueue(task);
    this.activeTasks.set(task.id, task);
    
    // Update worker count
    const currentWorkers = this.activeWorkers.get(task.type) || 0;
    this.activeWorkers.set(task.type, currentWorkers + 1);

    task.startedAt = Date.now();
    this.updateQueueMetrics();

    try {
      await this.executeTask(task);
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
    }
  }

  private async executeTask(task: BackgroundTask): Promise<void> {
    const processor = this.processors.get(task.type);
    if (!processor) {
      this.completeTask(task, new Error(`No processor found for task type: ${task.type}`));
      return;
    }

    const timeout = task.timeout || processor.timeout || this.config.taskTimeout;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), timeout);
      });

      // Execute task with timeout
      const result = await Promise.race([
        processor.handler(task.payload, task),
        timeoutPromise
      ]);

      this.completeTask(task, null, result);
    } catch (error) {
      const err = error as Error;
      
      // Check if task should be retried
      if (task.retries < task.maxRetries && err.message !== 'CANCELLED') {
        await this.retryTask(task, err, processor);
      } else {
        this.completeTask(task, err);
      }
    }
  }

  private async retryTask(task: BackgroundTask, error: Error, processor: TaskProcessor): Promise<void> {
    task.retries++;
    
    // Calculate retry delay
    let delay = 1000; // Default 1 second
    if (processor.retryStrategy) {
      delay = processor.retryStrategy(task.retries, error);
    }

    // Schedule retry
    setTimeout(() => {
      if (this.isProcessing) {
        this.addToQueue(task);
      }
    }, delay);

    // Remove from active tasks
    this.activeTasks.delete(task.id);
    const currentWorkers = this.activeWorkers.get(task.type) || 0;
    this.activeWorkers.set(task.type, Math.max(0, currentWorkers - 1));
  }

  private completeTask(task: BackgroundTask, error: Error | null, result?: any): void {
    task.completedAt = Date.now();
    
    if (error) {
      task.error = error.message;
      this.metrics.failedTasks++;
    } else {
      this.metrics.completedTasks++;
    }

    // Update processing time metrics
    if (task.startedAt) {
      const processingTime = task.completedAt - task.startedAt;
      this.updateProcessingTimeMetrics(processingTime);
    }

    // Move to completed tasks
    this.activeTasks.delete(task.id);
    this.completedTasks.push(task);
    
    // Update worker count
    const currentWorkers = this.activeWorkers.get(task.type) || 0;
    this.activeWorkers.set(task.type, Math.max(0, currentWorkers - 1));

    // Cleanup old completed tasks
    if (this.completedTasks.length > this.config.maxRetainedTasks) {
      this.completedTasks = this.completedTasks.slice(-this.config.maxRetainedTasks);
    }

    this.updateQueueMetrics();
  }

  private getNextTask(): BackgroundTask | null {
    // Check high priority first
    for (const task of this.queues.high) {
      if (this.isTaskReady(task)) {
        return task;
      }
    }

    // Then medium priority
    for (const task of this.queues.medium) {
      if (this.isTaskReady(task)) {
        return task;
      }
    }

    // Finally low priority
    for (const task of this.queues.low) {
      if (this.isTaskReady(task)) {
        return task;
      }
    }

    return null;
  }

  private isTaskReady(task: BackgroundTask): boolean {
    // Check scheduling
    if (task.scheduledAt && Date.now() < task.scheduledAt) {
      return false;
    }

    // Check dependencies
    if (task.dependencies?.length) {
      const allDependenciesComplete = task.dependencies.every(depId => {
        const depTask = this.completedTasks.find(t => t.id === depId);
        return depTask && !depTask.error;
      });
      
      if (!allDependenciesComplete) {
        return false;
      }
    }

    return true;
  }

  private canProcessTask(task: BackgroundTask): boolean {
    // Check system health
    if (this.metrics.cpuUsage > this.config.cpuThreshold || 
        this.metrics.memoryUsage > this.config.memoryThreshold) {
      return false;
    }

    // Check concurrency limits
    const activeWorkers = this.activeWorkers.get(task.type) || 0;
    const maxWorkers = this.concurrencyLimits.get(task.type) || 1;
    
    return activeWorkers < maxWorkers;
  }

  private addToQueue(task: BackgroundTask): void {
    const queueName = this.getPriorityQueueName(task.priority);
    this.queues[queueName].push(task);
  }

  private removeFromQueue(task: BackgroundTask): void {
    const queueName = this.getPriorityQueueName(task.priority);
    const index = this.queues[queueName].findIndex(t => t.id === task.id);
    if (index !== -1) {
      this.queues[queueName].splice(index, 1);
    }
  }

  private getPriorityQueueName(priority: number): keyof TaskQueue {
    if (priority <= 2) return 'high';
    if (priority <= 3) return 'medium';
    return 'low';
  }

  private calculateQueuePosition(queueType: keyof TaskQueue, position: number): number {
    let totalPosition = position;
    
    if (queueType === 'medium') {
      totalPosition += this.queues.high.length;
    } else if (queueType === 'low') {
      totalPosition += this.queues.high.length + this.queues.medium.length;
    }
    
    return totalPosition;
  }

  private updateQueueMetrics(): void {
    this.metrics.queuedTasks = Object.values(this.queues).reduce((total, queue) => total + queue.length, 0);
    this.metrics.activeTasks = this.activeTasks.size;
  }

  private updateProcessingTimeMetrics(processingTime: number): void {
    const totalTasks = this.metrics.completedTasks + this.metrics.failedTasks;
    if (totalTasks === 1) {
      this.metrics.averageProcessingTime = processingTime;
    } else {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (totalTasks - 1) + processingTime) / totalTasks;
    }
  }

  private updateSystemMetrics(): void {
    // Update error rate
    const totalTasks = this.metrics.completedTasks + this.metrics.failedTasks;
    this.metrics.errorRate = totalTasks > 0 ? this.metrics.failedTasks / totalTasks : 0;

    // Update throughput (tasks per minute)
    const recentTasks = this.completedTasks.filter(
      task => task.completedAt && task.completedAt > Date.now() - 60000
    );
    this.metrics.throughput = recentTasks.length;

    // Simulate CPU and memory usage (in real implementation, use actual system metrics)
    this.metrics.cpuUsage = this.simulateCpuUsage();
    this.metrics.memoryUsage = this.simulateMemoryUsage();
  }

  private getRecentThroughput(): number[] {
    const intervals = 10; // Last 10 intervals
    const intervalSize = 60000; // 1 minute
    const now = Date.now();
    
    const throughput: number[] = [];
    
    for (let i = 0; i < intervals; i++) {
      const start = now - (i + 1) * intervalSize;
      const end = now - i * intervalSize;
      
      const count = this.completedTasks.filter(
        task => task.completedAt && task.completedAt >= start && task.completedAt < end
      ).length;
      
      throughput.unshift(count);
    }
    
    return throughput;
  }

  private calculateSystemHealth(): 'healthy' | 'warning' | 'critical' {
    if (this.metrics.cpuUsage > 90 || this.metrics.memoryUsage > 95 || this.metrics.errorRate > 0.5) {
      return 'critical';
    }
    
    if (this.metrics.cpuUsage > 70 || this.metrics.memoryUsage > 80 || this.metrics.errorRate > 0.2) {
      return 'warning';
    }
    
    return 'healthy';
  }

  private simulateCpuUsage(): number {
    // Simulate based on active tasks
    const utilization = Math.min(this.activeTasks.size / this.config.maxConcurrency, 1);
    return 20 + (utilization * 50) + (Math.random() * 10);
  }

  private simulateMemoryUsage(): number {
    // Simulate based on queued and active tasks
    const totalTasks = this.metrics.queuedTasks + this.metrics.activeTasks;
    const utilization = Math.min(totalTasks / 100, 1);
    return 30 + (utilization * 40) + (Math.random() * 10);
  }

  private async simulateWork(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global background processor instance
export const globalBackgroundProcessor = new BackgroundProcessor({
  maxConcurrency: 8,
  processInterval: 50,
  taskTimeout: 45000,
  adaptiveConcurrency: true
});