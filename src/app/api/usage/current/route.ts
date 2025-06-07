import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/stripe-profiles'
import { reportMeteredUsage } from '@/lib/stripe'

interface BillingPeriod {
  usage_id: string
  period_start: string
  period_end: string
  domains_included: number
  domains_used: number
  domains_purchased: number
  domains_remaining: number
  ai_logs_included: number
  ai_logs_used: number
  ai_logs_remaining: number
  plan_type: string
  plan_status: string
  stripe_subscription_id: string | null
  next_billing_date: string | null
  overage_blocked?: boolean
  last_overage_warning_sent?: string | null
  overage_amount_cents?: number
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

    // Get user's billing preferences
    const { data: userProfile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('billing_preferences')
      .eq('id', user.id)
      .single()

    const billingPrefs = userProfile?.billing_preferences || {}

    // Get current billing period and usage
    let { data: billingPeriod, error: billingError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: user.id })
      .single() as { data: BillingPeriod | null, error: any }

    // If billing period exists, verify it matches the user's actual subscription plan
    if (billingPeriod && !billingError) {
      // Get user's actual subscription plan from profiles table
      const userSubscription = await getUserSubscription(user.id)
      
      let actualPlan = 'free'
      
      if (userSubscription?.is_admin) {
        actualPlan = 'pro'
      } else if (userSubscription?.subscription_plan && userSubscription?.subscription_status === 'active') {
        actualPlan = userSubscription.subscription_plan
      }
      
      // If the billing period plan doesn't match the actual plan, update it
      if (billingPeriod.plan_type !== actualPlan) {
        // Update the billing period with correct plan and limits
        const planDomains = actualPlan === 'pro' ? 3 : 1
        const planAiLogs = actualPlan === 'free' ? 100 : actualPlan === 'visibility' ? 250 : actualPlan === 'plus' ? 500 : actualPlan === 'pro' ? 1000 : 100
        
        const { error: updateError } = await serviceSupabase
          .from('subscription_usage')
          .update({
            plan_type: actualPlan,
            domains_included: planDomains,
            ai_logs_included: planAiLogs,
            stripe_subscription_id: userSubscription?.subscription_id || null,
            updated_at: 'NOW()'
          })
          .eq('id', billingPeriod.usage_id)
        
        if (!updateError) {
          // Refresh the billing period data
          const { data: updatedBillingPeriod, error: refreshError } = await serviceSupabase
            .rpc('get_current_billing_period', { p_user_id: user.id })
            .single() as { data: BillingPeriod | null, error: any }
          
          if (!refreshError && updatedBillingPeriod) {
            billingPeriod = updatedBillingPeriod
          }
        }
      }
    }

    // If no billing period exists, initialize one for the user
    if (billingError && billingError.code === 'PGRST116') {
      // Get user's actual subscription plan from profiles table
      const userSubscription = await getUserSubscription(user.id)
      
      let actualPlan = 'free'
      
      if (userSubscription?.is_admin) {
        actualPlan = 'pro'
      } else if (userSubscription?.subscription_plan && userSubscription?.subscription_status === 'active') {
        actualPlan = userSubscription.subscription_plan
      }
      
      // Initialize subscription with the user's actual plan
      const { data: subscriptionId, error: initError } = await serviceSupabase
        .rpc('initialize_subscription', { 
          p_user_id: user.id, 
          p_plan_type: actualPlan,
          p_stripe_subscription_id: userSubscription?.subscription_id || null
        })

      if (initError) {
        console.error('Error initializing subscription:', initError)
        return NextResponse.json({ error: 'Failed to initialize subscription' }, { status: 500 })
      }

      // Try to get billing period again after initialization
      const { data: newBillingPeriod, error: newBillingError } = await serviceSupabase
        .rpc('get_current_billing_period', { p_user_id: user.id })
        .single() as { data: BillingPeriod | null, error: any }

      if (newBillingError || !newBillingPeriod) {
        console.error('Error fetching billing period after initialization:', newBillingError)
        return NextResponse.json({ error: 'Failed to fetch usage data after initialization' }, { status: 500 })
      }

      billingPeriod = newBillingPeriod
    } else if (billingError) {
      console.error('Error fetching billing period:', billingError)
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
    }

    if (!billingPeriod) {
      return NextResponse.json({ error: 'No active billing period found' }, { status: 404 })
    }

    // Get recent usage events
    const { data: recentEvents, error: eventsError } = await serviceSupabase
      .from('usage_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get add-ons for current period
    const { data: addOns, error: addOnsError } = await serviceSupabase
      .from('subscription_add_ons')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('billing_period_end', new Date().toISOString())

    // Get actual domains count
    const { data: userDomains, error: domainsError } = await serviceSupabase
      .from('domains')
      .select('id, domain, is_primary')
      .eq('user_id', user.id)

    let actualDomainsUsed = 1 // Default to 1 domain minimum
    if (!domainsError && userDomains && userDomains.length > 0) {
      actualDomainsUsed = userDomains.length
    } else {
      // Ensure user has at least one domain record if they have a profile domain
      const { data: userProfile } = await serviceSupabase
        .from('profiles')
        .select('domain')
        .eq('id', user.id)
        .single()
      
      if (userProfile?.domain) {
        const { error: insertError } = await serviceSupabase
          .from('domains')
          .insert({
            user_id: user.id,
            domain: userProfile.domain,
            is_primary: true
          })
      }
    }

    // Get actual AI crawler logs - count ALL crawler visits for this billing period
    const { count: actualAiLogsUsed, error: crawlerVisitsError } = await serviceSupabase
      .from('crawler_visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('timestamp', billingPeriod.period_start)
      .lte('timestamp', billingPeriod.period_end)

    // If count failed, fallback to 0
    const finalAiLogsUsed = crawlerVisitsError ? 0 : (actualAiLogsUsed || 0)

    // Update the subscription_usage table to reflect actual usage if different
    if (finalAiLogsUsed !== billingPeriod.ai_logs_used) {
      const { error: updateUsageError } = await serviceSupabase
        .from('subscription_usage')
        .update({ 
          ai_logs_used: finalAiLogsUsed,
          updated_at: 'NOW()'
        })
        .eq('id', billingPeriod.usage_id)
      
      // Update the billingPeriod object for calculations below
      if (!updateUsageError) {
        billingPeriod.ai_logs_used = finalAiLogsUsed
      }
    }

    // Check if 90% usage notification should be shown - disabled since logs are unlimited
    const shouldShowUsageWarning = false

    // Format notifications that should be shown
    const notifications = shouldShowUsageWarning ? [] : []

    // Calculate usage percentages and limits
    const usage = {
      billingPeriod: {
        start: billingPeriod.period_start,
        end: billingPeriod.period_end,
        planType: billingPeriod.plan_type
      },
      billingPreferences: {
        ai_logs_enabled: billingPrefs.ai_logs_enabled !== false,
        spending_limit_cents: billingPrefs.spending_limit_cents,
        overage_notifications: billingPrefs.overage_notifications !== false,
        auto_billing_enabled: billingPrefs.auto_billing_enabled !== false,
        analytics_only_mode: billingPrefs.analytics_only_mode === true
      },
      spendingLimits: {
        plan_limit_cents: billingPrefs.plan_limit_cents,
        user_limit_cents: billingPrefs.user_limit_cents,
        effective_limit_cents: billingPrefs.effective_limit_cents,
        current_overage_cents: billingPeriod.overage_amount_cents || 0,
        remaining_cents: billingPrefs.effective_limit_cents !== null 
          ? Math.max(0, billingPrefs.effective_limit_cents - (billingPeriod.overage_amount_cents || 0))
          : null // No remaining limit if no spending limit is configured
      },
      domains: {
        included: billingPeriod.domains_included || 1,
        used: actualDomainsUsed,
        purchased: billingPeriod.domains_purchased || 0,
        remaining: Math.max(0, (billingPeriod.domains_included + billingPeriod.domains_purchased) - actualDomainsUsed),
        percentage: Math.round((actualDomainsUsed / (billingPeriod.domains_included + billingPeriod.domains_purchased)) * 100)
      },
      aiLogs: {
        included: billingPeriod.ai_logs_included || 0,
        used: finalAiLogsUsed,
        remaining: Math.max(0, billingPeriod.ai_logs_included - finalAiLogsUsed),
        percentage: billingPeriod.ai_logs_included > 0 
          ? Math.round((finalAiLogsUsed / billingPeriod.ai_logs_included) * 100)
          : 0,
        overage: 0,
        overageCost: 0,
        reportedToStripe: false,
        warningLevel: 'normal',
        trackingEnabled: billingPrefs.ai_logs_enabled !== false,
        billingBlocked: false,
        analyticsOnlyMode: billingPrefs.analytics_only_mode === true
      },
      recentEvents: recentEvents || [],
      addOns: addOns || [],
      notifications: notifications
    }

    return NextResponse.json({ usage })

  } catch (error) {
    console.error('Error in usage/current API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 