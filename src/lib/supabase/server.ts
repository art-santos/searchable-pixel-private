import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
// Remove potentially incorrect import
// import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies' 

export function createClient() {
  // Do not initialize cookieStore here

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookieStore = cookies() as any; // Use any to bypass type check
            // Await the promise if necessary, then access get
            const resolvedCookieStore = await cookieStore; 
            const cookie = resolvedCookieStore.get(name);
            return cookie?.value;
          } catch (error) {
             console.error(`Error getting cookie ${name}:`, error);
             return undefined;
          }
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = cookies() as any; // Use any to bypass type check
            // Await the promise if necessary, then access set
            const resolvedCookieStore = await cookieStore;
            resolvedCookieStore.set({ name, value, ...options });
          } catch (error) {
             console.warn(`Server Component attempt to set cookie: ${name}`, error);
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = cookies() as any; // Use any to bypass type check
            // Await the promise if necessary, then access set (used for remove)
            const resolvedCookieStore = await cookieStore;
            resolvedCookieStore.set({ name, value: '', ...options });
          } catch (error) {
             console.warn(`Server Component attempt to remove cookie: ${name}`, error);
          }
        },
      },
    }
  )
} 