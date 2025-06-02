import { createBrowserClient } from '@supabase/ssr'

// No need for a manual singleton function here, 
// createBrowserClient handles initialization correctly for client components.

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing environment variables');
    return null;
  }
  
  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('[Supabase] Error creating client:', error)
    return null
  }
} 