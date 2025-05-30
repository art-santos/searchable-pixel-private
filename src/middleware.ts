import { NextResponse, type NextRequest } from 'next/server'
import { isAiCrawler } from "@/lib/ai"
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Skip middleware for Stripe webhook - it needs raw body access
    if (pathname === '/api/stripe/webhook') {
      return NextResponse.next();
    }
    
    const { supabase, response } = createClient(request)
    await supabase.auth.getSession()
    
    const ua = request.headers.get("user-agent") ?? "";
    if (isAiCrawler(ua)) {
      console.log("[AI-CRAWLER]", ua, request.nextUrl.pathname);
    }

    const { data: { session } } = await supabase.auth.getSession();

    // Allow public access to image files
    if (pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/i)) {
      return NextResponse.next();
    }

    // Normalize article URLs to lowercase to prevent 404s
    if (pathname.startsWith('/article/')) {
      const originalSlug = pathname.replace('/article/', '');
      const normalizedSlug = originalSlug.toLowerCase();
      
      if (normalizedSlug !== originalSlug) {
        console.log(`[MIDDLEWARE] Redirecting article: ${originalSlug} → ${normalizedSlug}`);
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = `/article/${normalizedSlug}`;
        
        const response = NextResponse.redirect(redirectUrl);
        response.headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        return response;
      }
    }

    // If user is not logged in and tries to access protected routes, redirect to login
    if (!session && isProtectedRoute(pathname)) {
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

    return response;
  } catch (e) {
    console.error('Error in Supabase middleware:', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

// Fixed function name and added more specific route protection
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/api-keys'
  ];
  
  return protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 