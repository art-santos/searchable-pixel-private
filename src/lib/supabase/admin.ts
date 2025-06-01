import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Ensure your Supabase URL and Service Role Key are in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY

// Cache the admin client so it's not recreated on every request
let supabaseAdminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        // Important: Tell Supabase this client is for admin actions and should bypass RLS
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('Supabase Admin Client Initialized');
  }

  return supabaseAdminClient;
} 