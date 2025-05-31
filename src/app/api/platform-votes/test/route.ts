import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Test 1: Check if platform_votes table exists
    const { data: votesTable, error: votesError } = await supabase
      .from('platform_votes')
      .select('*')
      .limit(1)
    
    // Test 2: Check if platform_vote_counts view exists
    const { data: countsView, error: countsError } = await supabase
      .from('platform_vote_counts')
      .select('*')
    
    // Test 3: Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      tests: {
        platform_votes_table: {
          exists: !votesError,
          error: votesError?.message,
          sample: votesTable
        },
        platform_vote_counts_view: {
          exists: !countsError,
          error: countsError?.message,
          data: countsView
        },
        auth: {
          user: user?.id || null,
          error: userError?.message
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Test failed', details: error }, { status: 500 })
  }
} 