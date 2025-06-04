import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/stripe-profiles'

interface BillingPeriod {
  usage_id: string
  period_start: string
  period_end: string
  article_credits_included: number
  article_credits_used: number
  article_credits_purchased: number
  article_credits_remaining: number
  domains_included: number
  domains_used: number
  domains_purchased: number
  domains_remaining: number
  ai_logs_included: number
  ai_logs_used: number
  ai_logs_remaining: number
  max_scans_used: number
  daily_scans_used: number
  plan_type: string
  plan_status: string
  stripe_subscription_id: string | null
  next_billing_date: string | null
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
        const planCredits = actualPlan === 'visibility' ? 0 : actualPlan === 'plus' ? 10 : actualPlan === 'pro' ? 30 : 0
        const planDomains = actualPlan === 'pro' ? 3 : 1
        const planAiLogs = actualPlan === 'free' ? 100 : actualPlan === 'visibility' ? 250 : actualPlan === 'plus' ? 500 : actualPlan === 'pro' ? 1000 : 100
        
        const { error: updateError } = await serviceSupabase
          .from('subscription_usage')
          .update({
            plan_type: actualPlan,
            article_credits_included: planCredits,
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

    // Get actual visibility scans from max_visibility_runs within current billing period
    const { data: visibilityScans, error: scansError } = await serviceSupabase
      .from('max_visibility_runs')
      .select(`
        id, 
        created_at, 
        status, 
        question_count,
        triggered_by,
        company_id
      `)
      .eq('triggered_by', user.id)
      .gte('created_at', billingPeriod.period_start)
      .lte('created_at', billingPeriod.period_end)

    let totalScansThisPeriod = 0
    let maxScansThisPeriod = 0
    let dailyScansThisPeriod = 0

    if (!scansError && visibilityScans) {
      totalScansThisPeriod = visibilityScans.length
      // All scans from max_visibility_runs are MAX scans
      maxScansThisPeriod = visibilityScans.length
      dailyScansThisPeriod = 0 // No daily scans from this table
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
    }

    // Calculate usage percentages and limits
    const usage = {
      billingPeriod: {
        start: billingPeriod.period_start,
        end: billingPeriod.period_end,
        planType: billingPeriod.plan_type
      },
      articles: {
        included: 0, // Not implemented yet
        used: 0,
        purchased: 0,
        remaining: 0,
        percentage: 0,
        note: "Article generation coming soon"
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
        overage: Math.max(0, actualAiLogsUsed - billingPeriod.ai_logs_included),
        overageCost: Math.max(0, actualAiLogsUsed - billingPeriod.ai_logs_included) * 0.008
      },
      scans: {
        maxScansUsed: maxScansThisPeriod,
        dailyScansUsed: dailyScansThisPeriod,
        totalScansUsed: totalScansThisPeriod,
        unlimitedMax: ['plus', 'pro'].includes(billingPeriod.plan_type),
        dailyAllowed: true // All plans get daily scans
      },
      recentEvents: recentEvents || [],
      addOns: addOns || []
    }

    return NextResponse.json({ usage })

  } catch (error) {
    console.error('Error in usage/current API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 