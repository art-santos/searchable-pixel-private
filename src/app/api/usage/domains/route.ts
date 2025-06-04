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
    const { action, domain, amount = 1, metadata = {} } = body

    // Validate input
    if (!action || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "add" or "remove".' }, { status: 400 })
    }

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required and must be a string.' }, { status: 400 })
    }

    if (typeof amount !== 'number' || amount < 1 || amount > 10) {
      return NextResponse.json({ error: 'Invalid amount. Must be between 1 and 10.' }, { status: 400 })
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

    if (action === 'add') {
      // Calculate if user has enough domain slots
      const totalDomainsAvailable = (billingPeriod.domains_included || 1) + (billingPeriod.domains_purchased || 0)
      const domainsUsed = billingPeriod.domains_used || 0
      const domainsRemaining = totalDomainsAvailable - domainsUsed

      if (domainsRemaining < amount) {
        return NextResponse.json({ 
          error: 'Insufficient domain slots',
          details: {
            requested: amount,
            available: domainsRemaining,
            used: domainsUsed,
            total: totalDomainsAvailable
          }
        }, { status: 402 }) // Payment Required
      }
    }

    // Track the usage event
    const eventType = action === 'add' ? 'domain_added' : 'domain_removed'
    const { data: eventId, error: trackingError } = await serviceSupabase
      .rpc('track_usage_event', {
        p_user_id: user.id,
        p_event_type: eventType,
        p_amount: amount,
        p_metadata: { ...metadata, domain }
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

    const totalDomainsAvailable = (billingPeriod.domains_included || 1) + (billingPeriod.domains_purchased || 0)
    const newDomainsUsed = action === 'add' 
      ? (billingPeriod.domains_used || 0) + amount
      : Math.max(0, (billingPeriod.domains_used || 0) - amount)

    return NextResponse.json({
      success: true,
      eventId,
      action,
      domain,
      usage: {
        domainsUsed: updatedBillingPeriod?.domains_used || newDomainsUsed,
        domainsRemaining: updatedBillingPeriod?.domains_remaining || (totalDomainsAvailable - newDomainsUsed),
        totalDomains: totalDomainsAvailable
      }
    })

  } catch (error) {
    console.error('Error in usage/domains API:', error)
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

    // Get domain usage history
    const { data: domainEvents, error: eventsError } = await serviceSupabase
      .from('usage_events')
      .select('*')
      .eq('user_id', user.id)
      .in('event_type', ['domain_added', 'domain_removed'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (eventsError) {
      console.error('Error fetching domain events:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch domain usage' }, { status: 500 })
    }

    // Get current billing period for summary
    const { data: billingPeriod, error: billingError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: user.id })
      .single()

    if (billingError) {
      console.error('Error fetching billing period:', billingError)
    }

    return NextResponse.json({ 
      events: domainEvents || [],
      summary: billingPeriod ? {
        domainsIncluded: billingPeriod.domains_included || 1,
        domainsPurchased: billingPeriod.domains_purchased || 0,
        domainsUsed: billingPeriod.domains_used || 0,
        domainsRemaining: billingPeriod.domains_remaining || 1
      } : null
    })

  } catch (error) {
    console.error('Error in usage/domains GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 