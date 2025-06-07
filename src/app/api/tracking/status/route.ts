import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace')
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify workspace belongs to user
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, domain')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check for recent visitor tracking events (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: recentEvents, count } = await supabase
      .from('usage_events')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('event_type', 'visitor_tracked')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1)

    const isConnected = count !== null && count > 0
    const lastConnection = recentEvents && recentEvents.length > 0 ? recentEvents[0].created_at : null

    return NextResponse.json({
      connected: isConnected,
      workspace: {
        id: workspace.id,
        domain: workspace.domain
      },
      lastConnection,
      eventCount: count || 0
    })

  } catch (error) {
    console.error('Error checking tracking status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 