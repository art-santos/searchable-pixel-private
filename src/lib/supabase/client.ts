import { createBrowserClient } from '@supabase/ssr'

// No need for a manual singleton function here, 
// createBrowserClient handles initialization correctly for client components.

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing environment variables:', {
      supabaseUrl: !!supabaseUrl,
      supabaseAnonKey: !!supabaseAnonKey
    });
    return null;
  }
  
  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Ensure session is persisted properly
        persistSession: true,
        // Automatically refresh tokens
        autoRefreshToken: true,
        // Store session in localStorage by default
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Detect session from URL for auth redirects
        detectSessionInUrl: true,
      },
    });
    
    console.log('[Supabase] Client created successfully');
    return client;
  } catch (error) {
    console.error('[Supabase] Error creating client:', error);
    return null;
  }
} 