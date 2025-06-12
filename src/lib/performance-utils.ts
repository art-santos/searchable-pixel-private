// Performance monitoring utilities

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private timers = new Map<string, number>()
  private enabled: boolean = process.env.NODE_ENV === 'development'

  startTimer(name: string): void {
    if (!this.enabled) return
    this.timers.set(name, performance.now())
  }

  endTimer(name: string, metadata?: Record<string, any>): number {
    if (!this.enabled) return 0
    
    const startTime = this.timers.get(name)
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(name)

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata
    })

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata)
    }

    return duration
  }

  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTimer(name)
    try {
      const result = await operation()
      this.endTimer(name, metadata)
      return result
    } catch (error) {
      this.endTimer(name, { ...metadata, error: true })
      throw error
    }
  }

  measure<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    this.startTimer(name)
    try {
      const result = operation()
      this.endTimer(name, metadata)
      return result
    } catch (error) {
      this.endTimer(name, { ...metadata, error: true })
      throw error
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getAverageTime(name: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === name)
    if (relevantMetrics.length === 0) return 0
    
    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / relevantMetrics.length
  }

  getSummary(): Record<string, { count: number; avgTime: number; totalTime: number }> {
    const summary: Record<string, { count: number; avgTime: number; totalTime: number }> = {}
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, avgTime: 0, totalTime: 0 }
      }
      summary[metric.name].count++
      summary[metric.name].totalTime += metric.duration
    })

    Object.keys(summary).forEach(name => {
      summary[name].avgTime = summary[name].totalTime / summary[name].count
    })

    return summary
  }

  clear(): void {
    this.metrics = []
    this.timers.clear()
  }

  logSummary(): void {
    if (!this.enabled) return
    
    const summary = this.getSummary()
    console.log('\n=== Performance Summary ===')
    Object.entries(summary)
      .sort((a, b) => b[1].totalTime - a[1].totalTime)
      .forEach(([name, stats]) => {
        console.log(
          `${name}: ${stats.count} calls, ` +
          `avg: ${stats.avgTime.toFixed(2)}ms, ` +
          `total: ${stats.totalTime.toFixed(2)}ms`
        )
      })
    console.log('========================\n')
  }
}

// Singleton instance
let monitorInstance: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor()
  }
  return monitorInstance
}

// Utility functions for common performance patterns
export async function withPerformanceLogging<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const monitor = getPerformanceMonitor()
  return monitor.measureAsync(name, operation, metadata)
}

export function measureApiRoute(routeName: string) {
  return async (handler: Function) => {
    return async (...args: any[]) => {
      const monitor = getPerformanceMonitor()
      return monitor.measureAsync(`API:${routeName}`, () => handler(...args))
    }
  }
}

// Database query performance helper
export function measureQuery<T>(
  queryName: string,
  query: Promise<T>
): Promise<T> {
  const monitor = getPerformanceMonitor()
  return monitor.measureAsync(`DB:${queryName}`, () => query)
}

// Batch operation performance helper
export async function measureBatchOperation<T>(
  name: string,
  items: T[],
  operation: (item: T) => Promise<any>,
  batchSize: number = 10
): Promise<void> {
  const monitor = getPerformanceMonitor()
  
  monitor.startTimer(`${name}:total`)
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await monitor.measureAsync(
      `${name}:batch`,
      () => Promise.all(batch.map(operation)),
      { batchIndex: Math.floor(i / batchSize), batchSize: batch.length }
    )
  }
  
  monitor.endTimer(`${name}:total`, { totalItems: items.length })
} 