/**
 * @split.dev/analytics - Next.js Middleware
 * Simple middleware helper for Next.js applications
 */

import { NextRequest, NextResponse } from 'next/server'
import { SplitAnalytics, SplitConfig, isAICrawler, getCrawlerInfo } from './index'

export interface MiddlewareConfig extends SplitConfig {
  /** Paths to exclude from tracking (regex patterns) */
  exclude?: string[]
  /** Paths to include for tracking (regex patterns) - if specified, only these paths are tracked */
  include?: string[]
  /** Skip tracking entirely and just continue with request (useful for debugging) */
  skipTracking?: boolean
}

/**
 * Create Split Analytics middleware for Next.js
 * 
 * @example
 * // Simple usage in middleware.ts
 * import { createSplitMiddleware } from '@split.dev/analytics/middleware'
 * 
 * export const middleware = createSplitMiddleware({
 *   apiKey: process.env.SPLIT_API_KEY!,
 *   debug: process.env.NODE_ENV === 'development'
 * })
 * 
 * export const config = {
 *   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
 * }
 */
export function createSplitMiddleware(config: MiddlewareConfig) {
  // Validate configuration at startup
  if (!config.apiKey) {
    throw new Error('[Split Analytics Middleware] API key is required')
  }
  
  if (!config.apiKey.startsWith('split_live_') && !config.apiKey.startsWith('split_test_')) {
    throw new Error('[Split Analytics Middleware] Invalid API key format. Keys should start with "split_live_" or "split_test_"')
  }
  
  const analytics = new SplitAnalytics(config)
  
  if (config.debug) {
    console.log('[Split Analytics Middleware] Initialized with:', {
      keyType: config.apiKey.startsWith('split_test_') ? 'test' : 'live',
      excludePatterns: config.exclude?.length || 0,
      includePatterns: config.include?.length || 0,
      skipTracking: config.skipTracking || false
    })
  }
  
  return async function splitMiddleware(request: NextRequest) {
    // Always create a NextResponse first to avoid routing conflicts
    const response = NextResponse.next()
    
    try {
      const { pathname } = request.nextUrl
      const userAgent = request.headers.get('user-agent')
      
      if (config.debug) {
        console.log('[Split Analytics Middleware] Processing request:', {
          pathname,
          userAgent: userAgent?.substring(0, 50) + '...',
          method: request.method
        })
      }
      
      // Skip tracking if configured to do so (useful for debugging)
      if (config.skipTracking) {
        if (config.debug) {
          console.log('[Split Analytics Middleware] Skipping tracking (skipTracking=true)')
        }
        return response
      }
      
      // Check if path should be excluded
      if (config.exclude) {
        for (const pattern of config.exclude) {
          try {
            if (pathname.match(pattern)) {
              if (config.debug) {
                console.log('[Split Analytics Middleware] Path excluded by pattern:', pattern)
              }
              return response
            }
          } catch (error) {
            if (config.debug) {
              console.error('[Split Analytics Middleware] Invalid exclude pattern:', pattern, error)
            }
          }
        }
      }
      
      // Check if path should be included (if include patterns are specified)
      if (config.include && config.include.length > 0) {
        let shouldInclude = false
        for (const pattern of config.include) {
          try {
            if (pathname.match(pattern)) {
              shouldInclude = true
              break
            }
          } catch (error) {
            if (config.debug) {
              console.error('[Split Analytics Middleware] Invalid include pattern:', pattern, error)
            }
          }
        }
        if (!shouldInclude) {
          if (config.debug) {
            console.log('[Split Analytics Middleware] Path not included by any pattern')
          }
          return response
        }
      }
      
      // Only track if it's an AI crawler
      if (isAICrawler(userAgent)) {
        const crawler = getCrawlerInfo(userAgent)
        if (crawler) {
          if (config.debug) {
            console.log('[Split Analytics Middleware] AI crawler detected:', {
              name: crawler.name,
              company: crawler.company,
              category: crawler.category
            })
          }
          
          // Track the crawler visit asynchronously (don't block the response)
          // Using setImmediate to ensure this happens after the response is sent
          setImmediate(async () => {
            const startTime = Date.now()
            try {
              const success = await analytics.track({
                url: request.url,
                userAgent: userAgent || '',
                crawler,
                metadata: {
                  method: request.method,
                  pathname,
                  timestamp: new Date().toISOString(),
                  responseTime: Date.now() - startTime
                }
              })
              
              if (config.debug) {
                console.log('[Split Analytics Middleware] Tracking result:', success ? 'success' : 'failed')
              }
            } catch (error) {
              if (config.debug) {
                console.error('[Split Analytics Middleware] Tracking error:', error)
              }
            }
          })
        }
      } else if (config.debug) {
        console.log('[Split Analytics Middleware] Not an AI crawler, skipping')
      }
      
      return response
    } catch (error) {
      // Never let middleware errors break the application
      if (config.debug) {
        console.error('[Split Analytics Middleware] Unexpected error:', error)
      }
      return response
    }
  }
}

/**
 * Helper for users who already have middleware
 * Call this function in your existing middleware to add Split Analytics tracking
 * 
 * @example
 * // In your existing middleware.ts
 * import { trackCrawlerVisit } from '@split.dev/analytics/middleware'
 * 
 * export async function middleware(request: NextRequest) {
 *   // Your existing middleware logic here
 *   const response = NextResponse.next()
 *   
 *   // Add Split Analytics tracking (non-blocking)
 *   trackCrawlerVisit(request, {
 *     apiKey: process.env.SPLIT_API_KEY!,
 *     debug: process.env.NODE_ENV === 'development'
 *   }).catch(console.error)
 *   
 *   return response
 * }
 */
export async function trackCrawlerVisit(request: NextRequest, config: SplitConfig): Promise<boolean> {
  try {
    const userAgent = request.headers.get('user-agent')
    
    if (!isAICrawler(userAgent)) {
      if (config.debug) {
        console.log('[Split Analytics] trackCrawlerVisit: Not an AI crawler')
      }
      return false
    }
    
    const analytics = new SplitAnalytics(config)
    const crawler = getCrawlerInfo(userAgent)
    
    if (!crawler) {
      if (config.debug) {
        console.log('[Split Analytics] trackCrawlerVisit: No crawler info found')
      }
      return false
    }
    
    if (config.debug) {
      console.log('[Split Analytics] trackCrawlerVisit: Tracking', crawler.name)
    }
    
    const success = await analytics.track({
      url: request.url,
      userAgent: userAgent || '',
      crawler,
      metadata: {
        method: request.method,
        pathname: request.nextUrl.pathname,
        timestamp: new Date().toISOString()
      }
    })
    
    if (config.debug) {
      console.log('[Split Analytics] trackCrawlerVisit: Result', success ? 'success' : 'failed')
    }
    
    return success
  } catch (error) {
    if (config.debug) {
      console.error('[Split Analytics] trackCrawlerVisit: Error', error)
    }
    return false
  }
} 