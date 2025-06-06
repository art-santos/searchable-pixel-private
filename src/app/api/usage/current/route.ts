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

    // Get actual AI crawler logs - check crawler_visits table since that's what's actually used
    const { data: crawlerVisits, error: crawlerVisitsError } = await serviceSupabase
      .from('crawler_visits')
      .select('id, timestamp, crawler_name, crawler_company, user_id')
      .eq('user_id', user.id)
      .gte('timestamp', billingPeriod.period_start)
      .lte('timestamp', billingPeriod.period_end)

    let actualAiLogsUsed = 0

    // Count crawler visits (these should count towards AI usage)
    if (!crawlerVisitsError && crawlerVisits) {
      actualAiLogsUsed = crawlerVisits.length
    }

    // Update the subscription_usage table to reflect actual usage if different
    if (actualAiLogsUsed !== billingPeriod.ai_logs_used) {
      const { error: updateUsageError } = await serviceSupabase
        .from('subscription_usage')
        .update({ 
          ai_logs_used: actualAiLogsUsed,
          updated_at: 'NOW()'
        })
        .eq('id', billingPeriod.usage_id)
      
      // Update the billingPeriod object for calculations below
      if (!updateUsageError) {
        billingPeriod.ai_logs_used = actualAiLogsUsed
      }
    }

    // Check for AI logs overage and report to Stripe if user has active subscription
    const userSubscription = await getUserSubscription(user.id)
    const aiLogsOverage = Math.max(0, actualAiLogsUsed - billingPeriod.ai_logs_included)
    
    // Get usage warning levels
    const { data: aiLogsWarningLevel } = await serviceSupabase
      .rpc('get_usage_warning_level', {
        p_user_id: user.id,
        p_usage_type: 'ai_logs'
      })

    // Get spending limits
    const { data: planSpendingLimit } = await serviceSupabase
      .rpc('get_plan_spending_limit', { plan_type: billingPeriod.plan_type })

    // Only use user's explicitly set spending limit, don't fall back to plan limit
    const userConfiguredLimit = billingPrefs.spending_limit_cents
    const effectiveSpendingLimit = userConfiguredLimit !== null && userConfiguredLimit !== undefined 
      ? Math.min(planSpendingLimit || 999999, userConfiguredLimit)
      : null // No spending limit if user hasn't configured one

    // Get dismissed notifications for this user
    const { data: dismissedNotifications, error: notifError } = await serviceSupabase
      .from('dismissed_notifications')
      .select('notification_type, notification_key')
      .eq('user_id', user.id)

    const dismissedSet = new Set(
      (dismissedNotifications || []).map(d => `${d.notification_type}:${d.notification_key}`)
    )

    // Check if 90% usage notification should be shown
    const aiLogsUsagePercentage = billingPeriod.ai_logs_included > 0 
      ? Math.round((actualAiLogsUsed / billingPeriod.ai_logs_included) * 100)
      : 0

    const shouldShowUsageWarning = 
      billingPrefs.overage_notifications !== false && // Only if user has notifications enabled
      aiLogsUsagePercentage >= 90 && 
      !dismissedSet.has('usage_warning:ai_logs_90') &&
      billingPrefs.ai_logs_enabled !== false // Only if tracking is enabled

    // Format notifications that should be shown
    const notifications = shouldShowUsageWarning ? [{
      type: 'usage_warning',
      key: 'ai_logs_90',
      title: 'Almost there!',
      message: `You've used ${aiLogsUsagePercentage}% of your AI crawler logs this month. Additional logs cost $0.008 each.`,
      level: 'warning',
      dismissible: true
    }] : []

    if (aiLogsOverage > 0 && userSubscription) {
      try {
        // Check if billing is allowed before reporting to Stripe
        const { data: canBill } = await serviceSupabase
          .rpc('can_bill_overage', {
            p_user_id: user.id,
            p_overage_cents: Math.round(aiLogsOverage * 0.8),
            p_usage_type: 'ai_logs'
          })

        // For admin users without subscription, just log the overage
        if (userSubscription.is_admin && !userSubscription.subscription_id) {
          console.log(`🧪 Admin overage detected: ${aiLogsOverage} AI logs (would cost $${(aiLogsOverage * 0.008).toFixed(3)})`)
        } else if (userSubscription.subscription_id && userSubscription.subscription_status === 'active' && canBill) {
          // Report overage usage to Stripe for real subscribers only if allowed
          const usageRecord = await reportMeteredUsage({
            subscriptionId: userSubscription.subscription_id,
            meteredType: 'ai_logs',
            quantity: aiLogsOverage
          })
          
          if (usageRecord) {
            console.log(`📊 Reported ${aiLogsOverage} AI logs overage to Stripe for user ${user.id}`)
            
            // Record the billing event
            await serviceSupabase
              .from('usage_events')
              .insert({
                user_id: user.id,
                subscription_usage_id: billingPeriod.usage_id,
                event_type: 'ai_log_tracked',
                amount: aiLogsOverage,
                metadata: { stripe_usage_record_id: usageRecord.id },
                billable: true,
                cost_cents: Math.round(aiLogsOverage * 0.8) // $0.008 = 0.8 cents
              })
          }
        } else if (!canBill) {
          console.log(`🚫 AI logs overage blocked due to spending limits: ${aiLogsOverage} logs`)
        }
      } catch (error) {
        console.error('Error reporting AI logs overage to Stripe:', error)
        // Don't fail the whole request if Stripe reporting fails
      }
    }

    // Calculate usage percentages and limits
    const usage = {
      billingPeriod: {
        start: billingPeriod.period_start,
        end: billingPeriod.period_end,
        planType: billingPeriod.plan_type
      },
      billingPreferences: {
        ai_logs_enabled: billingPrefs.ai_logs_enabled !== false,
        spending_limit_cents: userConfiguredLimit,
        overage_notifications: billingPrefs.overage_notifications !== false,
        auto_billing_enabled: billingPrefs.auto_billing_enabled !== false,
        analytics_only_mode: billingPrefs.analytics_only_mode === true
      },
      spendingLimits: {
        plan_limit_cents: planSpendingLimit,
        user_limit_cents: userConfiguredLimit,
        effective_limit_cents: effectiveSpendingLimit,
        current_overage_cents: billingPeriod.overage_amount_cents || 0,
        remaining_cents: effectiveSpendingLimit !== null 
          ? Math.max(0, effectiveSpendingLimit - (billingPeriod.overage_amount_cents || 0))
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
        used: actualAiLogsUsed,
        remaining: Math.max(0, billingPeriod.ai_logs_included - actualAiLogsUsed),
        percentage: billingPeriod.ai_logs_included > 0 
          ? Math.round((actualAiLogsUsed / billingPeriod.ai_logs_included) * 100)
          : 0,
        overage: aiLogsOverage,
        overageCost: aiLogsOverage * 0.008,
        reportedToStripe: aiLogsOverage > 0 && userSubscription?.subscription_id ? true : false,
        warningLevel: aiLogsWarningLevel || 'normal',
        trackingEnabled: billingPrefs.ai_logs_enabled !== false,
        billingBlocked: billingPeriod.overage_blocked === true,
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