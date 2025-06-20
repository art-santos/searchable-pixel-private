import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const createClient = (request: NextRequest) => {
  // Create an unmodified response object based on the incoming request
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return request.cookies.get(name)?.value
          } catch (error) {
            console.error(`[Supabase Middleware] Error getting cookie ${name}:`, error)
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // If the cookie is updated, update the cookies for the request and response
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({ // Recreate response to apply updated cookie
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          } catch (error) {
            console.error(`[Supabase Middleware] Error setting cookie ${name}:`, error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // If the cookie is removed, update the cookies for the request and response
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
             response = NextResponse.next({ // Recreate response to apply updated cookie
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          } catch (error) {
            console.error(`[Supabase Middleware] Error removing cookie ${name}:`, error)
          }
        },
      },
    }
  )

  return { supabase, response }
} 