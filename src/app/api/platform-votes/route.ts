import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Helper to manually parse the auth token
async function getAuthenticatedUser(cookieStore: any) {
  try {
    // First try the standard approach
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user && !error) {
      return { user, supabase }
    }
    
    // If standard approach fails, try manual cookie parsing
    console.log('[API] Standard auth failed, trying manual approach')
    
    // Find the auth token cookie (it starts with sb- and ends with -auth-token)
    const allCookies = cookieStore.getAll()
    const authCookie = allCookies.find((c: any) => 
      c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    )
    
    if (!authCookie?.value) {
      console.log('[API] No auth token cookie found')
      return { user: null, supabase }
    }
    
    console.log('[API] Found auth cookie:', authCookie.name)
    console.log('[API] Cookie value preview:', authCookie.value.substring(0, 50) + '...')
    
    // Create a direct Supabase client
    const directSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    )
    
    // Try to decode the token value
    let tokenData
    try {
      // The cookie value might have a "base64-" prefix
      let cookieValue = authCookie.value
      if (cookieValue.startsWith('base64-')) {
        cookieValue = cookieValue.substring(7) // Remove "base64-" prefix
        console.log('[API] Stripped base64- prefix')
      }
      
      // Try base64 decode
      const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8')
      tokenData = JSON.parse(decoded)
      console.log('[API] Successfully decoded token')
    } catch (e) {
      console.log('[API] Failed to decode token, trying direct parse')
      try {
        tokenData = JSON.parse(authCookie.value)
      } catch (e2) {
        console.error('[API] Failed to parse token:', e2)
        // Try one more approach - the cookie might be URL encoded
        try {
          const decoded = decodeURIComponent(authCookie.value)
          tokenData = JSON.parse(decoded)
          console.log('[API] Successfully decoded URL-encoded token')
        } catch (e3) {
          console.error('[API] All parsing attempts failed')
          return { user: null, supabase }
        }
      }
    }
    
    // Extract the access token and refresh token
    const accessToken = tokenData?.access_token || tokenData?.[0]?.access_token
    const refreshToken = tokenData?.refresh_token || tokenData?.[0]?.refresh_token
    
    if (!accessToken) {
      console.log('[API] No access token found in cookie')
      return { user: null, supabase }
    }
    
    // Set the session on the Supabase client
    const { data: sessionData, error: sessionError } = await directSupabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    })
    
    if (sessionError) {
      console.error('[API] Failed to set session:', sessionError)
      return { user: null, supabase }
    }
    
    // Now get the user with the session set
    const { data: { user: manualUser }, error: manualError } = await directSupabase.auth.getUser()
    
    if (manualUser) {
      console.log('[API] Manual auth successful:', manualUser.id)
      return { user: manualUser, supabase: directSupabase }
    }
    
    console.error('[API] Manual auth failed:', manualError)
    return { user: null, supabase }
    
  } catch (error) {
    console.error('[API] Error in getAuthenticatedUser:', error)
    return { user: null, supabase: null }
  }
}

// GET: Fetch vote counts and user's votes
export async function GET() {
  try {
    // Await cookies properly
    const cookieStore = await cookies()
    
    // Debug: Check cookies in GET request too
    const allCookies = cookieStore.getAll()
    console.log('[API] GET - Available cookies:', allCookies.map(c => ({ name: c.name, valueLength: c.value?.length })))
    
    const { user, supabase } = await getAuthenticatedUser(cookieStore)
    
    console.log('[API] GET /platform-votes - User:', user?.id || 'not logged in')
    
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client')
    }
    
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
    const body = await request.json()
    const { platformId } = body
    
    console.log('[API] Voting for platform:', platformId)
    
    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform ID required' },
        { status: 400 }
      )
    }
    
    // Development bypass for testing
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      console.log('[API] Development mode: Skipping auth, using mock data')
      
      // Just return a mock response
      const mockCount = Math.floor(Math.random() * 50) + 100
      return NextResponse.json({
        success: true,
        voteCount: mockCount,
        devMode: true,
        message: 'This is mock data - auth is bypassed'
      })
    }
    
    // Normal auth flow
    const cookieStore = await cookies()
    
    // Debug: Log all cookies
    const allCookies = cookieStore.getAll()
    console.log('[API] Available cookies:', allCookies.map(c => ({ name: c.name, valueLength: c.value?.length })))
    
    // Check for Supabase auth cookies specifically
    const authCookies = allCookies.filter(c => c.name.includes('auth'))
    console.log('[API] Auth cookies found:', authCookies.length)
    
    const { user, supabase } = await getAuthenticatedUser(cookieStore)
    
    console.log('[API] POST /platform-votes - User:', user?.id || 'not logged in')
    
    if (!user || !supabase) {
      console.log('[API] User not authenticated - login required to vote')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
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
    
    // Get updated count by manually counting votes
    // (The view might have a slight delay in updating)
    const { count, error: countError } = await supabase
      .from('platform_votes')
      .select('*', { count: 'exact', head: true })
      .eq('platform_id', platformId)
    
    console.log('[API] Manual count for platform', platformId, ':', count)
    
    if (countError) {
      console.error('[API] Error counting votes:', countError)
    }
    
    return NextResponse.json({
      success: true,
      voteCount: count || 1
    })
  } catch (error) {
    console.error('[API] Error in POST /platform-votes:', error)
    return NextResponse.json(
      { error: 'Failed to submit vote', details: error },
      { status: 500 }
    )
  }
} 