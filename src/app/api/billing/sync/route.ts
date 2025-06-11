import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/stripe-profiles'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Manual billing sync requested for user:', user.id)

    const serviceSupabase = createServiceRoleClient()

    // Get user's profile data first
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'No profile found',
        details: profileError?.message 
      }, { status: 404 })
    }

    console.log('📋 Current profile data:', {
      stripeCustomerId: profile.stripe_customer_id,
      subscriptionId: profile.subscription_id,
      subscriptionPlan: profile.subscription_plan,
      subscriptionStatus: profile.subscription_status,
      isAdmin: profile.is_admin
    })

    // If user has Stripe customer ID, get their actual Stripe data
    let stripeSubscription = null
    let actualPlan = 'starter'
    let subscriptionStatus = 'active'

    if (profile.stripe_customer_id) {
      try {
        // Get all subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'all',
          limit: 10
        })

        console.log('💳 Stripe subscriptions found:', subscriptions.data.length)
        
        // Find the active subscription
        stripeSubscription = subscriptions.data.find(sub => 
          sub.status === 'active' || sub.status === 'trialing'
        ) || subscriptions.data[0] // Fallback to most recent

        if (stripeSubscription) {
          console.log('✅ Active Stripe subscription found:', {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            priceId: stripeSubscription.items.data[0]?.price.id,
            planName: stripeSubscription.items.data[0]?.price.nickname
          })

                 // Get plan from Stripe metadata (check all sources)
       const priceId = stripeSubscription.items.data[0]?.price.id
       let planFromMetadata = null
       
       // 1. First check subscription metadata (most common location)
       planFromMetadata = stripeSubscription.metadata?.plan_id
       console.log('📋 [SYNC] Subscription metadata plan_id:', planFromMetadata)
       
       // 2. If not on subscription, check price metadata
       if (!planFromMetadata && priceId) {
         try {
           const priceObject = await stripe.prices.retrieve(priceId)
           planFromMetadata = priceObject.metadata?.plan_id
           console.log('📋 [SYNC] Price metadata plan_id:', planFromMetadata)
           
           // 3. If not on price, try product metadata
           if (!planFromMetadata && priceObject.product) {
             const productId = typeof priceObject.product === 'string' ? priceObject.product : priceObject.product.id
             const productObject = await stripe.products.retrieve(productId)
             planFromMetadata = productObject.metadata?.plan_id
             console.log('📋 [SYNC] Product metadata plan_id:', planFromMetadata)
           }
         } catch (metadataError) {
           console.error('❌ [SYNC] Error reading Stripe metadata:', metadataError)
         }
       }
       
       console.log('📋 [SYNC] Final metadata plan_id:', planFromMetadata)
       
       // Use metadata plan_id as authoritative source
       if (planFromMetadata && ['starter', 'pro', 'team'].includes(planFromMetadata)) {
         actualPlan = planFromMetadata
       } else {
         // Fallback to price ID parsing if no metadata
         if (priceId.includes('starter') || priceId.includes('basic')) {
           actualPlan = 'starter'
         } else if (priceId.includes('pro')) {
           actualPlan = 'pro'
         } else if (priceId.includes('team') || priceId.includes('enterprise')) {
           actualPlan = 'team'
         }
       }
          
          subscriptionStatus = stripeSubscription.status
        } else {
          console.log('❌ No active Stripe subscription found')
        }
      } catch (stripeError) {
        console.error('❌ Error fetching Stripe data:', stripeError)
      }
    }

    // Handle admin users
    if (profile.is_admin) {
      actualPlan = 'team'
      subscriptionStatus = 'active'
    }

    console.log('🎯 Target sync data:', { actualPlan, subscriptionStatus })

    // Define plan limits
    const getPlanLimits = (plan: string) => {
      switch (plan) {
        case 'starter': return { domains: 1, aiLogs: 1000, snapshots: 10, workspaces: 1 }
        case 'pro': return { domains: 3, aiLogs: 5000, snapshots: 50, workspaces: 3 }
        case 'team': return { domains: 5, aiLogs: 10000, snapshots: 100, workspaces: 5 }
        default: return { domains: 1, aiLogs: 1000, snapshots: 10, workspaces: 1 }
      }
    }

    const limits = getPlanLimits(actualPlan)
    let result: any = {
      action: 'updated',
      planType: actualPlan,
      subscriptionStatus,
      limits,
      beforeSync: {},
      afterSync: {},
      tablesUpdated: []
    }

    // 1. UPDATE PROFILES TABLE
    const profileUpdateData = {
      subscription_plan: actualPlan,
      subscription_status: subscriptionStatus,
      subscription_id: stripeSubscription?.id || null,
      subscription_period_end: stripeSubscription ? 
        new Date(stripeSubscription.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    }

    const { error: profileUpdateError } = await serviceSupabase
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', user.id)

    if (profileUpdateError) {
      console.error('❌ Error updating profiles table:', profileUpdateError)
    } else {
      console.log('✅ Updated profiles table')
      result.tablesUpdated.push('profiles')
    }

    // 2. UPDATE SUBSCRIPTION_INFO TABLE (if it exists)
    const { data: subscriptionInfo, error: subInfoError } = await serviceSupabase
      .from('subscription_info')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!subInfoError && subscriptionInfo) {
      const subscriptionInfoUpdateData = {
        plan_type: actualPlan,
        plan_status: subscriptionStatus,
        stripe_subscription_id: stripeSubscription?.id || null,
        stripe_price_id: stripeSubscription?.items.data[0]?.price.id || null,
        current_period_start: stripeSubscription ? 
          new Date(stripeSubscription.current_period_start * 1000).toISOString() : subscriptionInfo.current_period_start,
        current_period_end: stripeSubscription ? 
          new Date(stripeSubscription.current_period_end * 1000).toISOString() : subscriptionInfo.current_period_end,
        domains_included: limits.domains,
        workspaces_included: limits.workspaces,
        ai_logs_included: limits.aiLogs,
        updated_at: new Date().toISOString()
      }

      const { error: subInfoUpdateError } = await serviceSupabase
        .from('subscription_info')
        .update(subscriptionInfoUpdateData)
        .eq('user_id', user.id)

      if (subInfoUpdateError) {
        console.error('❌ Error updating subscription_info table:', subInfoUpdateError)
      } else {
        console.log('✅ Updated subscription_info table')
        result.tablesUpdated.push('subscription_info')
      }
    }

    // 3. UPDATE SUBSCRIPTION_USAGE TABLE
    const { data: currentUsage, error: usageError } = await serviceSupabase
      .from('subscription_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!usageError && currentUsage) {
      result.beforeSync.subscription_usage = {
        plan_type: currentUsage.plan_type,
        plan_status: currentUsage.plan_status,
        domains_included: currentUsage.domains_included,
        ai_logs_included: currentUsage.ai_logs_included,
        snapshots_included: currentUsage.snapshots_included
      }

      const usageUpdateData = {
        plan_type: actualPlan,
        plan_status: subscriptionStatus,
        stripe_subscription_id: stripeSubscription?.id || null,
        domains_included: limits.domains,
        ai_logs_included: limits.aiLogs,
        snapshots_included: limits.snapshots,
        updated_at: new Date().toISOString()
      }

      // If plan changed significantly, reset billing period
      if (currentUsage.plan_type !== actualPlan) {
        const now = new Date()
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
        
        usageUpdateData.billing_period_start = now.toISOString()
        usageUpdateData.billing_period_end = periodEnd.toISOString()
        usageUpdateData.next_billing_date = periodEnd.toISOString()
        
        console.log('🔄 Plan changed from', currentUsage.plan_type, 'to', actualPlan)
      }

      const { error: usageUpdateError } = await serviceSupabase
        .from('subscription_usage')
        .update(usageUpdateData)
        .eq('id', currentUsage.id)

      if (usageUpdateError) {
        console.error('❌ Error updating subscription_usage table:', usageUpdateError)
      } else {
        console.log('✅ Updated subscription_usage table')
        result.tablesUpdated.push('subscription_usage')
        result.afterSync.subscription_usage = usageUpdateData
      }
    } else if (usageError?.code === 'PGRST116') {
      // No subscription_usage record exists, create one
      console.log('📝 Creating new subscription_usage record')
      
      const { error: initError } = await serviceSupabase
        .rpc('initialize_subscription', {
          p_user_id: user.id,
          p_plan_type: actualPlan,
          p_stripe_subscription_id: stripeSubscription?.id || null
        })

      if (initError) {
        console.error('❌ Error initializing subscription:', initError)
      } else {
        console.log('✅ Initialized subscription_usage table')
        result.tablesUpdated.push('subscription_usage')
        result.action = 'created'
      }
    }

    // Get the final state to verify
    const { data: finalBilling, error: finalError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: user.id })
      .single()

    if (!finalError && finalBilling) {
      result.finalState = {
        plan_type: finalBilling.plan_type,
        plan_status: finalBilling.plan_status,
        domains_included: finalBilling.domains_included,
        ai_logs_included: finalBilling.ai_logs_included,
        snapshots_included: finalBilling.snapshots_included,
        stripe_subscription_id: finalBilling.stripe_subscription_id
      }
    }

    return NextResponse.json({
      success: true,
      message: `Billing data synchronized across ${result.tablesUpdated.length} tables!`,
      data: result
    })

  } catch (error) {
    console.error('❌ Manual billing sync error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// GET endpoint to check sync status across all tables
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Get data from all billing tables
    const [profileData, subscriptionInfoData, usageData] = await Promise.all([
      getUserSubscription(user.id),
      serviceSupabase.from('subscription_info').select('*').eq('user_id', user.id).single(),
      serviceSupabase.rpc('get_current_billing_period', { p_user_id: user.id }).single()
    ])

    const profile = profileData
    const subscriptionInfo = subscriptionInfoData.data
    const usage = usageData.data

    // Check if all tables are in sync
    const profilePlan = profile?.subscription_plan
    const subscriptionInfoPlan = subscriptionInfo?.plan_type
    const usagePlan = usage?.plan_type

    const isInSync = !!(
      profilePlan && subscriptionInfoPlan && usagePlan &&
      profilePlan === subscriptionInfoPlan &&
      profilePlan === usagePlan
    )

    return NextResponse.json({
      inSync: isInSync,
      profilesData: profile ? {
        plan: profile.subscription_plan,
        status: profile.subscription_status,
        stripeCustomerId: profile.stripe_customer_id,
        subscriptionId: profile.subscription_id,
        isAdmin: profile.is_admin
      } : null,
      subscriptionInfoData: subscriptionInfo ? {
        plan_type: subscriptionInfo.plan_type,
        plan_status: subscriptionInfo.plan_status,
        stripe_subscription_id: subscriptionInfo.stripe_subscription_id,
        domains_included: subscriptionInfo.domains_included
      } : null,
      usageData: usage ? {
        plan_type: usage.plan_type,
        plan_status: usage.plan_status,
        domains_included: usage.domains_included,
        ai_logs_included: usage.ai_logs_included,
        snapshots_included: usage.snapshots_included,
        stripe_subscription_id: usage.stripe_subscription_id
      } : null,
      syncIssues: {
        profileVsSubscriptionInfo: profilePlan !== subscriptionInfoPlan,
        profileVsUsage: profilePlan !== usagePlan,
        subscriptionInfoVsUsage: subscriptionInfoPlan !== usagePlan
      }
    })

  } catch (error) {
    console.error('❌ Billing sync status error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 