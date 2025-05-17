import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  // Do not initialize cookieStore here

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const cookieStore = cookies()
            const cookie = cookieStore.get(name)
            return cookie?.value
          } catch (error) {
            console.error(`Error getting cookie ${name}:`, error)
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = cookies()
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.warn(`Server Component attempt to set cookie: ${name}`, error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = cookies()
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.warn(`Server Component attempt to remove cookie: ${name}`, error)
          }
        },
      },
    }
  )
} 