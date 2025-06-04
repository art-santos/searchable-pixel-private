import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { notification_type, notification_key } = await req.json()

    // Validate input
    if (!notification_type || !notification_key) {
      return NextResponse.json({ 
        error: 'Missing notification_type or notification_key' 
      }, { status: 400 })
    }

    // Use regular client for user auth
    const supabase = createClient()
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database operations
    const serviceSupabase = createServiceRoleClient()

    // Insert dismissed notification (upsert to handle duplicates)
    const { error: insertError } = await serviceSupabase
      .from('dismissed_notifications')
      .upsert({
        user_id: user.id,
        notification_type,
        notification_key,
        dismissed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,notification_type,notification_key'
      })

    if (insertError) {
      console.error('Error inserting dismissed notification:', insertError)
      return NextResponse.json({ 
        error: 'Failed to dismiss notification' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notification dismissed successfully'
    })

  } catch (error) {
    console.error('Error in notifications dismiss API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Use regular client for user auth
    const supabase = createClient()
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database operations
    const serviceSupabase = createServiceRoleClient()

    // Get all dismissed notifications for user
    const { data: dismissedNotifications, error: fetchError } = await serviceSupabase
      .from('dismissed_notifications')
      .select('notification_type, notification_key, dismissed_at')
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Error fetching dismissed notifications:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch dismissed notifications' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      dismissed_notifications: dismissedNotifications || []
    })

  } catch (error) {
    console.error('Error in notifications GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 