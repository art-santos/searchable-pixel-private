import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createClient() {
  // Do not initialize cookieStore here

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookieStore = await cookies()
            const cookie = cookieStore.get(name)
            
            if (!cookie?.value) return undefined
            
            // Handle base64 prefixed cookies that might be causing parsing issues
            if (cookie.value.startsWith('base64-')) {
              console.warn(`[Supabase Server] Skipping malformed cookie: ${name}`)
              return undefined
            }
            
            // Handle potential JSON parsing issues in cookie values
            if (cookie.value.includes('{') || cookie.value.includes('[')) {
              try {
                // Test if it's valid JSON
                JSON.parse(cookie.value)
              } catch {
                console.warn(`[Supabase Server] Invalid JSON in cookie ${name}, skipping`)
                return undefined
              }
            }
            
            return cookie.value
          } catch (error) {
            console.error(`[Supabase Server] Error getting cookie ${name}:`, error)
            return undefined
          }
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies()
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.warn(`[Supabase Server] Server Component attempt to set cookie: ${name}`, error)
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies()
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.warn(`[Supabase Server] Server Component attempt to remove cookie: ${name}`, error)
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client for server-side operations that bypasses RLS
 * WARNING: This should only be used for trusted server-side operations
 */
export function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
} 