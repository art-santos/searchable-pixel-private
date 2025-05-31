import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Use admin client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    )

    // Get all crawler visits (no RLS filtering)
    const { data: allVisits, error: visitsError } = await supabase
      .from('crawler_visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (visitsError) {
      console.error('Error fetching crawler visits:', visitsError)
      return NextResponse.json({ error: visitsError.message }, { status: 500 })
    }

    // Get all API keys to see the user_id mappings
    const { data: allKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('id, user_id, name, key_hash, created_at')
      .order('created_at', { ascending: false })

    if (keysError) {
      console.error('Error fetching API keys:', keysError)
      return NextResponse.json({ error: keysError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Debug data for crawler visits',
      crawler_visits: allVisits || [],
      api_keys: allKeys || [],
      total_visits: allVisits?.length || 0,
      total_keys: allKeys?.length || 0
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 