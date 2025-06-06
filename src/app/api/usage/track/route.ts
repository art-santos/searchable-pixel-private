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

    // Get user's subscription details and billing preferences
    const userSubscription = await getUserSubscription(user.id)
    
    // Get user's billing preferences
    const { data: userProfile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('billing_preferences')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 })
    }

    const billingPrefs = userProfile?.billing_preferences || {}

    // Check if user is admin - admins bypass all restrictions
    const isAdmin = userSubscription?.is_admin
    if (isAdmin) {
      console.log('👑 Admin user detected, bypassing all plan limits and billing restrictions')
    }

    // Check if user has disabled this type of tracking/billing (but not for admins)
    if (usageType === 'ai_logs' && !isAdmin) {
      // Check if AI logs tracking is completely disabled
      if (billingPrefs.ai_logs_enabled === false) {
        return NextResponse.json({ 
          success: false,
          message: 'AI crawler tracking is disabled for your account',
          blocked: true,
          reason: 'tracking_disabled'
        })
      }

      // Check if in analytics-only mode (track but don't bill)
      if (billingPrefs.analytics_only_mode === true) {
        // Track the usage but don't bill
        const { error: trackError } = await serviceSupabase
          .rpc('track_usage_event', {
            p_user_id: user.id,
            p_event_type: 'ai_log_tracked',
            p_amount: quantity,
            p_metadata: { ...metadata, analytics_only: true }
          })

        if (trackError) {
          console.error('Error tracking analytics-only usage:', trackError)
        }

        return NextResponse.json({ 
          success: true,
          message: 'Usage tracked (analytics-only mode)',
          billable: false,
          analytics_only: true
        })
      }
    }

    // Allow admin users to test usage tracking even without a subscription
    if (isAdmin) {
      console.log('👑 Admin user detected, allowing usage tracking without subscription requirement')
    } else if (!userSubscription?.subscription_id || userSubscription.subscription_status !== 'active') {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Get current billing period
    const { data: billingPeriod, error: billingError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: user.id })
      .single()

    if (billingError || !billingPeriod) {
      return NextResponse.json({ error: 'No active billing period found' }, { status: 400 })
    }

    // Check spending limits before processing (but not for admins)
    if (usageType === 'ai_logs' && !isAdmin) {
      const potentialOverage = Math.max(0, (billingPeriod.ai_logs_used + quantity) - billingPeriod.ai_logs_included)
      
      if (potentialOverage > 0) {
        const overageCostCents = Math.round(potentialOverage * 0.8) // $0.008 = 0.8 cents

        // Check if overage billing is allowed
        const { data: canBill, error: canBillError } = await serviceSupabase
          .rpc('can_bill_overage', {
            p_user_id: user.id,
            p_overage_cents: overageCostCents,
            p_usage_type: 'ai_logs'
          })

        if (canBillError) {
          console.error('Error checking billing permissions:', canBillError)
          return NextResponse.json({ error: 'Failed to check billing permissions' }, { status: 500 })
        }

        if (!canBill) {
          // Get warning level for better user feedback
          const { data: warningLevel } = await serviceSupabase
            .rpc('get_usage_warning_level', {
              p_user_id: user.id,
              p_usage_type: 'ai_logs'
            })

          // Still track the usage but mark as blocked
          await serviceSupabase
            .rpc('track_usage_event', {
              p_user_id: user.id,
              p_event_type: 'ai_log_tracked',
              p_amount: quantity,
              p_metadata: { ...metadata, billing_blocked: true }
            })

          return NextResponse.json({ 
            success: true,
            message: 'Usage tracked but billing blocked due to spending limits',
            blocked: true,
            reason: 'spending_limit_reached',
            warning_level: warningLevel,
            billable: false,
            overage_would_be: potentialOverage,
            overage_cost_would_be: overageCostCents / 100 // Convert back to dollars
          })
        }
      }
    } else if (usageType === 'ai_logs' && isAdmin) {
      console.log('👑 Admin user: Bypassing spending limit checks for AI logs')
    }

    // Calculate overage based on usage type
    let overage = 0
    let planLimit = 0

    switch (usageType) {
      case 'ai_logs':
        planLimit = billingPeriod.ai_logs_included || 0
        overage = Math.max(0, (billingPeriod.ai_logs_used + quantity) - planLimit)
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

    // Only report to Stripe if there's actual overage/usage to bill and billing is enabled
    let stripeReported = false
    if (overage > 0 && billingPrefs.auto_billing_enabled !== false) {
      console.log(`📊 Reporting ${overage} ${usageType} overage to Stripe for user ${user.id}`)
      
      // For admin users, always mock the Stripe reporting (don't charge admins)
      if (isAdmin) {
        console.log(`👑 Admin test: Mocking Stripe usage report for ${overage} ${usageType} (no billing for admins)`)
        stripeReported = true
      } else {
        // Report usage to Stripe for real subscribers
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
        stripeReported = true
      }
    }

    // Record the usage event in our database (this will respect billing preferences)
    const { error: eventError } = await serviceSupabase
      .rpc('track_usage_event', {
        p_user_id: user.id,
        p_event_type: usageType === 'ai_logs' ? 'ai_log_tracked' : 
                     usageType === 'extra_articles' ? 'article_generated' : 'domain_added',
        p_amount: quantity,
        p_metadata: { 
          ...metadata, 
          stripe_reported: stripeReported,
          original_overage: overage 
        }
      })

    if (eventError) {
      console.error('Error recording usage event:', eventError)
    }

    // Get updated usage warning level
    const { data: warningLevel } = await serviceSupabase
      .rpc('get_usage_warning_level', {
        p_user_id: user.id,
        p_usage_type: usageType
      })

    return NextResponse.json({ 
      success: true, 
      overage,
      planLimit,
      billable: overage > 0 && stripeReported,
      warning_level: warningLevel,
      stripe_reported: stripeReported,
      message: overage > 0 && stripeReported 
        ? `Reported ${overage} ${usageType} overage to billing` 
        : 'Usage within plan limits'
    })

  } catch (error) {
    console.error('Error in usage tracking API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 