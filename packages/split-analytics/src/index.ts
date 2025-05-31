// Main exports
export { detectAICrawler, extractRequestMetadata } from './detector'
export { CrawlerTracker } from './tracker'
export { AI_CRAWLERS } from './constants'
export type { CrawlerDetectionResult, UnknownCrawlerInfo } from './detector'
export type { CrawlerEvent, TrackerConfig } from './tracker'
export type { CrawlerInfo } from './constants'

// For custom Node.js/Express servers
import { IncomingMessage, ServerResponse } from 'http'
import { detectAICrawler, extractRequestMetadata } from './detector'
import { CrawlerTracker, TrackerConfig } from './tracker'

/**
 * Express/Node.js middleware for crawler tracking
 */
export function createNodeMiddleware(config: TrackerConfig) {
  const tracker = new CrawlerTracker(config)

  return function middleware(
    req: IncomingMessage & { url?: string },
    res: ServerResponse,
    next: () => void
  ) {
    const startTime = Date.now()
    
    try {
      // Get user agent
      const userAgent = req.headers['user-agent'] || ''
      const detection = detectAICrawler(userAgent)

      if (!detection.isAICrawler || !detection.crawler) {
        return next()
      }

      // Store crawler info to use in the response handler
      const crawlerInfo = detection.crawler

      // Hook into response to get status code
      const originalEnd = res.end
      res.end = function(this: ServerResponse, ...args: Parameters<typeof originalEnd>): ReturnType<typeof originalEnd> {
        const responseTimeMs = Date.now() - startTime
        
        // Track the event
        const fullUrl = `${req.headers.host}${req.url}`
        const event = tracker.createEvent(
          crawlerInfo,
          {
            url: fullUrl,
            headers: req.headers as any,
            statusCode: res.statusCode,
            responseTimeMs
          },
          extractRequestMetadata({ headers: req.headers as any })
        )

        tracker.track(event).catch(error => {
          if (config.debug) {
            console.error('[Split Analytics] Failed to track event:', error)
          }
        })

        // Call original end
        return originalEnd.apply(this, args)
      } as typeof originalEnd

      next()
    } catch (error) {
      if (config.debug) {
        console.error('[Split Analytics] Middleware error:', error)
      }
      next()
    }
  }
}

/**
 * Simple tracking function for custom implementations
 */
export async function trackCrawler(
  config: TrackerConfig,
  request: {
    url: string
    userAgent: string
    headers?: Record<string, string | string[] | undefined>
    statusCode?: number
    responseTimeMs?: number
  }
): Promise<boolean> {
  const detection = detectAICrawler(request.userAgent)
  
  if (!detection.isAICrawler || !detection.crawler) {
    return false
  }

  const tracker = new CrawlerTracker(config)
  
  const event = tracker.createEvent(
    detection.crawler,
    {
      url: request.url,
      headers: { 
        'user-agent': request.userAgent,
        ...(request.headers || {})
      },
      statusCode: request.statusCode,
      responseTimeMs: request.responseTimeMs
    },
    request.headers ? extractRequestMetadata({ headers: request.headers }) : undefined
  )

  await tracker.track(event)
  
  // Clean up single-use tracker
  tracker.destroy()
  
  return true
} 