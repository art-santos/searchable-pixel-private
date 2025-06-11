import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscription info from centralized table
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .rpc('get_user_subscription', { p_user_id: user.id })
      .single()

    if (subscriptionError || !subscriptionData) {
      console.error('Error fetching subscription data:', subscriptionError)
      
      // Fallback: check if user exists in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, stripe_customer_id, is_admin')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        // Return default if no data found
        return NextResponse.json({
          subscriptionPlan: 'starter',
          subscriptionStatus: 'active',
          stripeCustomerId: null,
          isAdmin: false
        })
      }

      // Use profile data as fallback
      const effectivePlan = profile.is_admin ? 'admin' : (profile.subscription_plan || 'starter')
      return NextResponse.json({
        subscriptionPlan: effectivePlan,
        subscriptionStatus: profile.subscription_status || 'active',
        stripeCustomerId: profile.stripe_customer_id,
        isAdmin: profile.is_admin || false
      })
    }

    // Cast to any to avoid TypeScript errors with RPC return type
    const subscription = subscriptionData as any

    // Determine effective plan - admin users should have admin plan
    const effectivePlan = subscription.is_admin ? 'admin' : subscription.plan_type
    
    console.log('User subscription data:', {
      userId: user.id,
      planType: subscription.plan_type,
      isAdmin: subscription.is_admin,
      effectivePlan: effectivePlan
    })

    // Return data from centralized subscription system
    return NextResponse.json({
      subscriptionPlan: effectivePlan,
      subscriptionStatus: subscription.plan_status,
      stripeCustomerId: subscription.stripe_customer_id,
      stripeSubscriptionId: subscription.stripe_subscription_id,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      trialEnd: subscription.trial_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      isAdmin: subscription.is_admin || false,
      usage: {
        domains: {
          included: subscription.domains_included,
          used: subscription.domains_used,
          remaining: subscription.domains_remaining
        },
        workspaces: {
          included: subscription.workspaces_included,
          used: subscription.workspaces_used,
          remaining: subscription.workspaces_remaining
        },
        aiLogs: {
          included: subscription.ai_logs_included,
          used: subscription.ai_logs_used,
          remaining: subscription.ai_logs_remaining
        }
      },
      addOns: {
        extraDomains: subscription.extra_domains,
        edgeAlertsEnabled: subscription.edge_alerts_enabled
      },
      billingPreferences: subscription.billing_preferences
    })

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 