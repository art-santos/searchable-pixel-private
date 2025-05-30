import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserUsage, getUsageEvents } from '@/lib/subscription/usage'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get usage data
    const usage = await getUserUsage(user.id)
    
    // Get recent events if requested
    const includeEvents = req.nextUrl.searchParams.get('include_events') === 'true'
    let events = null
    
    if (includeEvents) {
      events = await getUsageEvents(user.id, 20)
    }
    
    return NextResponse.json({
      usage,
      events,
      userId: user.id
    })
    
  } catch (error) {
    console.error('Error fetching usage data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
} 