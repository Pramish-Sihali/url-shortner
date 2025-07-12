// lib/cache.ts
interface CacheItem<T> {
    data: T
    timestamp: number
    ttl: number
  }
  
  class InMemoryCache {
    private cache = new Map<string, CacheItem<any>>()
    private readonly DEFAULT_TTL = 60 * 1000 // 1 minute
  
    set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      })
    }
  
    get<T>(key: string): T | null {
      const item = this.cache.get(key)
      if (!item) return null
  
      if (Date.now() - item.timestamp > item.ttl) {
        this.cache.delete(key)
        return null
      }
  
      return item.data
    }
  
    delete(key: string): void {
      this.cache.delete(key)
    }
  
    clear(): void {
      this.cache.clear()
    }
  
    // Clean expired entries
    cleanup(): void {
      const now = Date.now()
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key)
        }
      }
    }
  }
  
  export const cache = new InMemoryCache()
  
  // Cleanup expired cache entries every 5 minutes
  if (typeof window === 'undefined') {
    setInterval(() => cache.cleanup(), 5 * 60 * 1000)
  }