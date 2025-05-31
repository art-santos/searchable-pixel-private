// examples/nextjs-with-auth.js
// Example of integrating Split Analytics with existing middleware (e.g., Supabase auth)

import { NextRequest, NextResponse } from 'next/server'
import { trackCrawlerVisit } from '@split.dev/analytics/middleware'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Your existing middleware logic (e.g., Supabase auth)
  const supabase = createMiddlewareClient({ req: request, res: response })
  const { data: { session } } = await supabase.auth.getSession()
  
  // Handle authentication redirects
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Add Split Analytics tracking (non-blocking)
  // This runs asynchronously and won't affect your app's performance
  trackCrawlerVisit(request, {
    apiKey: process.env.SPLIT_API_KEY!,
    debug: process.env.NODE_ENV === 'development'
  }).catch(error => {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Split Analytics error:', error)
    }
  })
  
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
} 