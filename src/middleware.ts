import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware' // We'll create this helper next

export async function middleware(request: NextRequest) {
  try {
    // This creates an optimized Supabase client specific to the server-side context of the middleware.
    // It's used for session management via cookies.
    const { supabase, response } = createClient(request)

    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
    await supabase.auth.getSession()

    // Optional: Redirect logic based on auth state and path
    const { data: { session } } = await supabase.auth.getSession();
    const { pathname } = request.nextUrl;

    // Redirect any requests to /customers/ and its subpaths to the homepage
    if (pathname.startsWith('/customers')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }

    // Normalize article URLs to lowercase to prevent 404s
    if (pathname.startsWith('/article/')) {
      const originalSlug = pathname.replace('/article/', '');
      
      // Simple slug normalization - just lowercase to avoid encoding issues
      const normalizedSlug = originalSlug.toLowerCase();
      
      // Only redirect if the normalized slug is different from the original
      if (normalizedSlug !== originalSlug) {
        console.log(`[MIDDLEWARE] Redirecting article: ${originalSlug} → ${normalizedSlug}`);
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = `/article/${normalizedSlug}`;
        
        // Add cache control headers to prevent browser caching
        const response = NextResponse.redirect(redirectUrl);
        response.headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        return response;
      }
    }

    // If user is not logged in and tries to access protected routes, redirect to login
    if (!session && isPprotectedRoute(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set(`redirectedFrom`, pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If user IS logged in and tries to access /login, redirect to /blog
    if (session && pathname === '/login') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/blog';
      return NextResponse.redirect(redirectUrl);
    }

    // IMPORTANT: Avoid writing response cookies unless absolutely necessary.
    // Returning the original response allows the Next.js router cache optimization to work.
    return response

  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely due to invalid Supabase URL or Key.
    // Ensure your .env.local contains valid SUPABASE_URL and SUPABASE_ANON_KEY
    console.error('Error in Supabase middleware:', e);

    // Return the original response even in case of error to avoid breaking the site
    // You might want to add more specific error handling here
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

// Helper function to determine if a route should be protected
function isPprotectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/blog',
    '/dashboard',
    '/profile',
    // Add other protected routes as needed
  ];
  
  return protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/blog/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/login',
  ],
} 