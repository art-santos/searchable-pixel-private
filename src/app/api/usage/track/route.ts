import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/stripe-profiles'
import { reportMeteredUsage } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { usageType, quantity, metadata } = await req.json()

    // Validate input
    if (!usageType || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['ai_logs', 'extra_articles', 'extra_domains'].includes(usageType)) {
      return NextResponse.json({ error: 'Invalid usage type' }, { status: 400 })
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

    // Get user's subscription details
    const userSubscription = await getUserSubscription(user.id)
    
    if (!userSubscription?.subscription_id || userSubscription.subscription_status !== 'active') {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Get current billing period
    const { data: billingPeriod, error: billingError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: user.id })
      .single()

    if (billingError || !billingPeriod) {
      return NextResponse.json({ error: 'No active billing period found' }, { status: 400 })
    }

    // Calculate overage based on usage type
    let overage = 0
    let planLimit = 0

    switch (usageType) {
      case 'ai_logs':
        planLimit = billingPeriod.ai_logs_included || 0
        overage = Math.max(0, billingPeriod.ai_logs_used - planLimit)
        break
      case 'extra_articles':
        // For articles, quantity represents purchased articles
        overage = quantity
        break
      case 'extra_domains':
        // For domains, quantity represents purchased domains
        overage = quantity
        break
    }

    // Only report to Stripe if there's actual overage/usage to bill
    if (overage > 0) {
      console.log(`📊 Reporting ${overage} ${usageType} overage to Stripe for user ${user.id}`)
      
      // Report usage to Stripe
      const usageRecord = await reportMeteredUsage({
        subscriptionId: userSubscription.subscription_id,
        meteredType: usageType as 'ai_logs' | 'extra_articles' | 'extra_domains',
        quantity: overage
      })

      if (!usageRecord) {
        console.error(`Failed to report ${usageType} usage to Stripe`)
        return NextResponse.json({ error: 'Failed to report usage to billing system' }, { status: 500 })
      }

      console.log(`✅ Successfully reported usage to Stripe:`, usageRecord.id)
    }

    // Record the usage event in our database
    const { error: eventError } = await serviceSupabase
      .from('usage_events')
      .insert({
        user_id: user.id,
        subscription_usage_id: billingPeriod.usage_id,
        event_type: usageType === 'ai_logs' ? 'ai_log_tracked' : 
                   usageType === 'extra_articles' ? 'article_generated' : 'domain_added',
        amount: quantity,
        metadata: metadata || {},
        billable: overage > 0,
        cost_cents: usageType === 'ai_logs' ? overage * 0.8 : // $0.008 = 0.8 cents
                   usageType === 'extra_articles' ? overage * 1000 : // $10 = 1000 cents
                   usageType === 'extra_domains' ? overage * 10000 : 0 // $100 = 10000 cents
      })

    if (eventError) {
      console.error('Error recording usage event:', eventError)
    }

    return NextResponse.json({ 
      success: true, 
      overage,
      planLimit,
      billable: overage > 0,
      message: overage > 0 ? `Reported ${overage} ${usageType} overage to billing` : 'Usage within plan limits'
    })

  } catch (error) {
    console.error('Error in usage tracking API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 