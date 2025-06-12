// Simple in-memory cache for API responses
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Singleton instance
let cacheInstance: MemoryCache | null = null

export function getCache(): MemoryCache {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache()
  }
  return cacheInstance
}

// Cache key generators
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')
  return `${prefix}:${sortedParams}`
}

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  CHART_DATA: 300,        // 5 minutes for chart data
  STATS: 180,             // 3 minutes for stats
  LIST_DATA: 120,         // 2 minutes for list data
  USER_PROFILE: 600,      // 10 minutes for user profile
  WORKSPACE_DATA: 300     // 5 minutes for workspace data
} 