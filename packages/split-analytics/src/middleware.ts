import { NextRequest, NextResponse } from 'next/server'
import { detectAICrawler, extractRequestMetadata, UnknownCrawlerInfo } from './detector'
import { CrawlerTracker, TrackerConfig } from './tracker'
import { CrawlerInfo } from './constants'

// Global tracker instance
let tracker: CrawlerTracker | null = null

export interface MiddlewareConfig extends TrackerConfig {
  // Paths to exclude from tracking
  exclude?: string[]
  // Paths to include (if specified, only these paths are tracked)
  include?: string[]
  // Whether to add custom headers for crawlers
  addCrawlerHeaders?: boolean
  // Custom logic to run when crawler is detected
  onCrawlerDetected?: (request: NextRequest, crawler: CrawlerInfo | UnknownCrawlerInfo) => void | Promise<void>
}

/**
 * Create Next.js middleware for AI crawler tracking
 */
export function createCrawlerMiddleware(config: MiddlewareConfig) {
  // Initialize tracker if not already done
  if (!tracker) {
    tracker = new CrawlerTracker(config)
  }

  return async function middleware(request: NextRequest) {
    const startTime = Date.now()
    
    try {
      // Check if path should be tracked
      const pathname = request.nextUrl.pathname
      
      if (config.exclude) {
        const shouldExclude = config.exclude.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'))
            return regex.test(pathname)
          }
          return pathname.startsWith(pattern)
        })
        
        if (shouldExclude) {
          return NextResponse.next()
        }
      }
      
      if (config.include) {
        const shouldInclude = config.include.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'))
            return regex.test(pathname)
          }
          return pathname.startsWith(pattern)
        })
        
        if (!shouldInclude) {
          return NextResponse.next()
        }
      }

      // Detect AI crawler
      const userAgent = request.headers.get('user-agent')
      const detection = detectAICrawler(userAgent)

      if (!detection.isAICrawler || !detection.crawler) {
        return NextResponse.next()
      }

      // Call custom handler if provided
      if (config.onCrawlerDetected) {
        await config.onCrawlerDetected(request, detection.crawler)
      }

      // Create response (could be modified if needed)
      const response = NextResponse.next()

      // Add custom headers if requested
      if (config.addCrawlerHeaders) {
        response.headers.set('X-AI-Crawler-Detected', 'true')
        response.headers.set('X-AI-Crawler-Name', detection.crawler.bot)
        response.headers.set('X-AI-Crawler-Company', detection.crawler.company)
      }

      // Extract metadata
      const metadata = extractRequestMetadata({
        headers: Object.fromEntries(request.headers.entries()),
        url: request.url,
        method: request.method
      })

      // Calculate response time
      const responseTimeMs = Date.now() - startTime

      // Ensure tracker is initialized (TypeScript safety)
      if (!tracker) {
        tracker = new CrawlerTracker(config)
      }

      // Track the event
      const event = tracker.createEvent(
        detection.crawler,
        {
          url: request.url,
          headers: Object.fromEntries(request.headers.entries()),
          statusCode: response.status,
          responseTimeMs
        },
        metadata
      )

      // Track asynchronously to not block the response
      tracker.track(event).catch(error => {
        if (config.debug) {
          console.error('[Split Analytics] Failed to track event:', error)
        }
      })

      return response

    } catch (error) {
      // Don't let tracking errors break the application
      if (config.debug) {
        console.error('[Split Analytics] Middleware error:', error)
      }
      return NextResponse.next()
    }
  }
}

/**
 * Cleanup function to call when shutting down
 */
export function destroyTracker() {
  if (tracker) {
    tracker.destroy()
    tracker = null
  }
} 