import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// GET: Fetch vote counts and user's votes
export async function GET() {
  try {
    // Await cookies properly
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('[API] GET /platform-votes - User:', user?.id || 'not logged in')
    
    // Get vote counts for all platforms
    const { data: voteCounts, error: voteCountError } = await supabase
      .from('platform_vote_counts')
      .select('*')
    
    if (voteCountError) {
      console.error('[API] Error fetching vote counts:', voteCountError)
      throw voteCountError
    }
    
    console.log('[API] Vote counts:', voteCounts)
    
    // Get user's votes if logged in
    let userVotes: string[] = []
    if (user) {
      const { data: votes, error: userVoteError } = await supabase
        .from('platform_votes')
        .select('platform_id')
        .eq('user_id', user.id)
      
      if (userVoteError) {
        console.error('[API] Error fetching user votes:', userVoteError)
        throw userVoteError
      }
      userVotes = votes?.map(v => v.platform_id) || []
      console.log('[API] User votes:', userVotes)
    }
    
    return NextResponse.json({
      voteCounts: voteCounts || [],
      userVotes
    })
  } catch (error) {
    console.error('[API] Error in GET /platform-votes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch votes', details: error },
      { status: 500 }
    )
  }
}

// POST: Submit a vote
export async function POST(request: Request) {
  try {
    // Await cookies properly
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('[API] POST /platform-votes - User:', user?.id || 'not logged in')
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { platformId } = body
    
    console.log('[API] Voting for platform:', platformId)
    
    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform ID required' },
        { status: 400 }
      )
    }
    
    // Get IP for rate limiting (hash it for privacy)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown'
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex')
    
    // Insert vote
    const { error: insertError, data: insertData } = await supabase
      .from('platform_votes')
      .insert({
        user_id: user.id,
        platform_id: platformId,
        ip_hash: ipHash
      })
      .select()
    
    console.log('[API] Insert result:', { error: insertError, data: insertData })
    
    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Already voted for this platform' },
          { status: 400 }
        )
      }
      console.error('[API] Error inserting vote:', insertError)
      throw insertError
    }
    
    // Get updated count
    const { data: voteCount, error: countError } = await supabase
      .from('platform_vote_counts')
      .select('vote_count')
      .eq('platform_id', platformId)
      .single()
    
    console.log('[API] Updated vote count:', voteCount)
    
    if (countError) {
      console.error('[API] Error fetching updated count:', countError)
    }
    
    return NextResponse.json({
      success: true,
      voteCount: voteCount?.vote_count || 1
    })
  } catch (error) {
    console.error('[API] Error in POST /platform-votes:', error)
    return NextResponse.json(
      { error: 'Failed to submit vote', details: error },
      { status: 500 }
    )
  }
} 