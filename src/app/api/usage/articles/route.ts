import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Use regular client for user auth
    const supabase = createClient()
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { amount = 1, metadata = {} } = body

    // Validate amount
    if (typeof amount !== 'number' || amount < 1 || amount > 100) {
      return NextResponse.json({ error: 'Invalid amount. Must be between 1 and 100.' }, { status: 400 })
    }

    // Use service role client for database operations
    const serviceSupabase = createServiceRoleClient()

    // Check current usage and limits
    const { data: billingPeriod, error: billingError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: user.id })
      .single()

    if (billingError) {
      console.error('Error fetching billing period:', billingError)
      return NextResponse.json({ error: 'Failed to check usage limits' }, { status: 500 })
    }

    if (!billingPeriod) {
      return NextResponse.json({ error: 'No active billing period found' }, { status: 404 })
    }

    // Calculate if user has enough credits (including purchased extras)
    const totalCreditsAvailable = (billingPeriod.article_credits_included || 0) + (billingPeriod.article_credits_purchased || 0)
    const creditsUsed = billingPeriod.article_credits_used || 0
    const creditsRemaining = totalCreditsAvailable - creditsUsed

    if (creditsRemaining < amount) {
      return NextResponse.json({ 
        error: 'Insufficient article credits',
        details: {
          requested: amount,
          available: creditsRemaining,
          used: creditsUsed,
          total: totalCreditsAvailable
        }
      }, { status: 402 }) // Payment Required
    }

    // Track the usage event
    const { data: eventId, error: trackingError } = await serviceSupabase
      .rpc('track_usage_event', {
        p_user_id: user.id,
        p_event_type: 'article_generated',
        p_amount: amount,
        p_metadata: metadata
      })

    if (trackingError) {
      console.error('Error tracking usage event:', trackingError)
      return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 })
    }

    // Get updated usage
    const { data: updatedBillingPeriod, error: updatedError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: user.id })
      .single()

    if (updatedError) {
      console.error('Error fetching updated billing period:', updatedError)
    }

    return NextResponse.json({
      success: true,
      eventId,
      usage: {
        articlesUsed: updatedBillingPeriod?.article_credits_used || creditsUsed + amount,
        articlesRemaining: updatedBillingPeriod?.article_credits_remaining || creditsRemaining - amount,
        totalCredits: totalCreditsAvailable
      }
    })

  } catch (error) {
    console.error('Error in usage/articles API:', error)
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

    // Get article usage history
    const { data: articleEvents, error: eventsError } = await serviceSupabase
      .from('usage_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_type', 'article_generated')
      .order('created_at', { ascending: false })
      .limit(50)

    if (eventsError) {
      console.error('Error fetching article events:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch article usage' }, { status: 500 })
    }

    return NextResponse.json({ events: articleEvents || [] })

  } catch (error) {
    console.error('Error in usage/articles GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 