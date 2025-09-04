import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    // If user is not logged in and tries to access protected routes, redirect to login
    if (!user && pathname.startsWith('/dashboard')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set(`redirectedFrom`, pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user IS logged in and tries to access /login, redirect to dashboard
    if (user && pathname === '/login') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (e) {
    console.error('Error in Supabase middleware:', e)
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
