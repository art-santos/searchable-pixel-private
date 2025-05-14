import { createBrowserClient } from '@supabase/ssr'

// No need for a manual singleton function here, 
// createBrowserClient handles initialization correctly for client components.

export function createClient() {
  // Note: Ensure these environment variables are correctly exposed 
  // to the client-side (prefixed with NEXT_PUBLIC_)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[client.ts] ERROR: Missing Supabase environment variables!');
    // Return null or throw an error, depending on desired handling
    // throw new Error('Missing Supabase environment variables');
    // Or return a non-functional client / null to handle gracefully in components
    return null; // Or handle error more robustly
  }

  // createBrowserClient is designed to be called directly in components 
  // or hooks where it's needed, ensuring it runs client-side.
  // This function now just returns a new instance when called.
  // If you need a true singleton across multiple hook calls, 
  // consider using React Context or a Zustand/Jotai store.
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
} 