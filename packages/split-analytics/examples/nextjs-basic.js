// examples/nextjs-basic.js
// Copy this to your middleware.ts file in your Next.js project

import { createSplitMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createSplitMiddleware({
  apiKey: process.env.SPLIT_API_KEY!,
  debug: process.env.NODE_ENV === 'development',
  
  // Optional: Exclude specific paths
  exclude: [
    '/admin/.*',      // Don't track admin pages
    '/api/.*',        // Don't track API routes
    '.*\\.json$',     // Don't track JSON files
    '/health',        // Don't track health checks
    '/robots\\.txt'   // Don't track robots.txt
  ]
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 