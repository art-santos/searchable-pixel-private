import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { T as TrackerConfig, c as CrawlerInfo, U as UnknownCrawlerInfo } from './tracker-Bp_2fBD6.mjs';
=======
import { SplitConfig } from './index.mjs';
>>>>>>> 8236b93 (fixed package)

/**
 * @split.dev/analytics - Next.js Middleware
 * Simple middleware helper for Next.js applications
 */

interface MiddlewareConfig extends SplitConfig {
    /** Paths to exclude from tracking (regex patterns) */
    exclude?: string[];
    /** Paths to include for tracking (regex patterns) - if specified, only these paths are tracked */
    include?: string[];
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
declare function createSplitMiddleware(config: MiddlewareConfig): (request: NextRequest) => Promise<NextResponse<unknown>>;
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
 *   // Add Split Analytics tracking
 *   await trackCrawlerVisit(request, {
 *     apiKey: process.env.SPLIT_API_KEY!,
 *     debug: process.env.NODE_ENV === 'development'
 *   })
 *
 *   return response
 * }
 */
declare function trackCrawlerVisit(request: NextRequest, config: SplitConfig): Promise<boolean>;

export { type MiddlewareConfig, createSplitMiddleware, trackCrawlerVisit };
