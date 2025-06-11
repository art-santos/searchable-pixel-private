import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { 
  stripe, 
  mapSubscriptionToPlan, 
  getAddOnPriceId,
  validateWebhookSignature,
  hasActiveTrial 
} from '@/lib/stripe'
import { 
  updateUserSubscription, 
  updateSubscriptionStatus, 
  cancelUserSubscription 
} from '@/lib/stripe-profiles'
import { createServiceRoleClient } from '@/lib/supabase/server'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = validateWebhookSignature(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Handle successful subscription creation
        console.log('Checkout session completed:', session.id)
        console.log('Customer:', session.customer)
        console.log('Subscription:', session.subscription)
        console.log('Metadata:', session.metadata)
        
        // Update user's subscription in the database
        await updateUserSubscription({
          email: session.customer_email || session.customer_details?.email,
          stripeCustomerId: session.customer as string,
          subscriptionId: session.subscription as string,
          planId: session.metadata?.planId || '',
          billing: (session.metadata?.billing || 'monthly') as 'monthly' | 'annual'
        })

        // ✅ NEW: Sync all billing tables
        await syncAllBillingTables(session.customer as string, session.subscription as string)
        
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Handle subscription updates (plan changes, renewals, add-ons)
        console.log('Subscription updated:', subscription.id)
        console.log('Status:', subscription.status)
        console.log('Current plan:', mapSubscriptionToPlan(subscription))
        console.log('Items:', subscription.items.data.map(item => ({
          id: item.id,
          priceId: item.price.id,
          quantity: item.quantity
        })))
        
        // Update subscription info in the database
        await updateSubscriptionStatus({
          subscriptionId: subscription.id,
          status: subscription.status,
          plan: mapSubscriptionToPlan(subscription),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        })

        // Handle add-on changes
        await updateSubscriptionAddOns(subscription)

        // ✅ NEW: Sync all billing tables
        await syncAllBillingTables(subscription.customer as string, subscription.id)
        
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Handle subscription cancellation
        console.log('Subscription deleted:', subscription.id)
        console.log('Customer:', subscription.customer)
        
        // Cancel user subscription (no free plan in new model)
        await cancelUserSubscription({
          stripeCustomerId: subscription.customer as string
        })

        // ✅ NEW: Sync all billing tables
        await syncAllBillingTables(subscription.customer as string, subscription.id)
        
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Handle failed payments
        console.log('Payment failed for invoice:', invoice.id)
        console.log('Customer:', invoice.customer)
        console.log('Attempt count:', invoice.attempt_count)
        
        // TODO: Send notification to user about failed payment
        // You can implement email notifications here using your preferred email service
        
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// ✅ NEW: Function to sync ALL billing tables with Stripe data
async function syncAllBillingTables(stripeCustomerId: string, subscriptionId: string) {
  try {
    const serviceSupabase = createServiceRoleClient()
    
    console.log('🔄 [WEBHOOK] Syncing ALL billing tables for customer:', stripeCustomerId)
    console.log('🔄 [WEBHOOK] Subscription ID:', subscriptionId)
    
    // Get user ID from Stripe customer ID
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()
    
    if (profileError || !profile) {
      console.error('❌ [WEBHOOK] Could not find user for Stripe customer:', stripeCustomerId)
      return
    }

    const userId = profile.id
    console.log('✅ [WEBHOOK] Found user ID:', userId)

    // Get actual Stripe subscription data
    let actualPlan = 'starter'
    let subscriptionStatus = 'active'
    let stripeSubscription = null

    try {
      stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
      console.log('✅ [WEBHOOK] Retrieved Stripe subscription:', {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        priceId: stripeSubscription.items.data[0]?.price.id
      })

            // Get plan from Stripe metadata (check all sources)
      const priceId = stripeSubscription.items.data[0]?.price.id
      let planFromMetadata = null
      
      // 1. First check subscription metadata (most common location)
      planFromMetadata = stripeSubscription.metadata?.plan_id
      console.log('📋 [WEBHOOK] Subscription metadata plan_id:', planFromMetadata)
      
      // 2. If not on subscription, check price metadata
      if (!planFromMetadata && priceId) {
        try {
          const priceObject = await stripe.prices.retrieve(priceId)
          planFromMetadata = priceObject.metadata?.plan_id
          console.log('📋 [WEBHOOK] Price metadata plan_id:', planFromMetadata)
          
          // 3. If not on price, try product metadata
          if (!planFromMetadata && priceObject.product) {
            const productId = typeof priceObject.product === 'string' ? priceObject.product : priceObject.product.id
            const productObject = await stripe.products.retrieve(productId)
            planFromMetadata = productObject.metadata?.plan_id
            console.log('📋 [WEBHOOK] Product metadata plan_id:', planFromMetadata)
          }
        } catch (metadataError) {
          console.error('❌ [WEBHOOK] Error reading Stripe metadata:', metadataError)
        }
      }
      
      console.log('📋 [WEBHOOK] Final metadata plan_id:', planFromMetadata)
      
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
      
      console.log('🎯 [WEBHOOK] Final mapped plan:', actualPlan)
      
      subscriptionStatus = stripeSubscription.status
    } catch (stripeError) {
      console.error('❌ [WEBHOOK] Error retrieving Stripe subscription:', stripeError)
    }

    // Handle admin users
    if (profile.is_admin) {
      actualPlan = 'team'
      subscriptionStatus = 'active'
      console.log('👑 [WEBHOOK] Admin user detected, using team plan')
    }

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
    console.log('📊 [WEBHOOK] Plan limits:', limits)

    // 1. UPDATE PROFILES TABLE
    const profileUpdateData = {
      subscription_plan: actualPlan,
      subscription_status: subscriptionStatus,
      subscription_id: subscriptionId,
      subscription_period_end: stripeSubscription ? 
        new Date(stripeSubscription.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    }

    const { error: profileUpdateError } = await serviceSupabase
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', userId)

    if (profileUpdateError) {
      console.error('❌ [WEBHOOK] Error updating profiles table:', profileUpdateError)
    } else {
      console.log('✅ [WEBHOOK] Updated profiles table with plan:', actualPlan)
    }

    // 2. UPDATE SUBSCRIPTION_INFO TABLE (if it exists)
    const { data: subscriptionInfo, error: subInfoError } = await serviceSupabase
      .from('subscription_info')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!subInfoError && subscriptionInfo) {
      const subscriptionInfoUpdateData = {
        plan_type: actualPlan,
        plan_status: subscriptionStatus,
        stripe_subscription_id: subscriptionId,
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
        .eq('user_id', userId)

      if (subInfoUpdateError) {
        console.error('❌ [WEBHOOK] Error updating subscription_info table:', subInfoUpdateError)
      } else {
        console.log('✅ [WEBHOOK] Updated subscription_info table')
      }
    }

    // 3. UPDATE SUBSCRIPTION_USAGE TABLE
    const { data: currentUsage, error: usageError } = await serviceSupabase
      .from('subscription_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!usageError && currentUsage) {
      console.log('📝 [WEBHOOK] Updating existing subscription_usage record')
      
      const usageUpdateData = {
        plan_type: actualPlan,
        plan_status: subscriptionStatus,
        stripe_subscription_id: subscriptionId,
        domains_included: limits.domains,
        ai_logs_included: limits.aiLogs,
        snapshots_included: limits.snapshots,
        updated_at: new Date().toISOString()
      }

      // If plan changed, reset billing period to current month
      if (currentUsage.plan_type !== actualPlan) {
        const now = new Date()
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
        
        usageUpdateData.billing_period_start = now.toISOString()
        usageUpdateData.billing_period_end = periodEnd.toISOString()
        usageUpdateData.next_billing_date = periodEnd.toISOString()
        
        console.log('🔄 [WEBHOOK] Plan changed from', currentUsage.plan_type, 'to', actualPlan)
      }

      const { error: usageUpdateError } = await serviceSupabase
        .from('subscription_usage')
        .update(usageUpdateData)
        .eq('id', currentUsage.id)

      if (usageUpdateError) {
        console.error('❌ [WEBHOOK] Error updating subscription_usage table:', usageUpdateError)
      } else {
        console.log('✅ [WEBHOOK] Updated subscription_usage table')
      }
    } else if (usageError?.code === 'PGRST116') {
      // No subscription_usage record exists, create one
      console.log('📝 [WEBHOOK] Creating new subscription_usage record')
      
      const { error: initError } = await serviceSupabase
        .rpc('initialize_subscription', {
          p_user_id: userId,
          p_plan_type: actualPlan,
          p_stripe_subscription_id: subscriptionId
        })

      if (initError) {
        console.error('❌ [WEBHOOK] Error initializing subscription:', initError)
      } else {
        console.log('✅ [WEBHOOK] Initialized subscription_usage table')
      }
    }

    console.log('🎉 [WEBHOOK] Billing sync completed for user:', userId)

  } catch (error) {
    console.error('❌ [WEBHOOK] Error syncing billing tables:', error)
  }
}

// Helper function to update subscription add-ons in database
async function updateSubscriptionAddOns(subscription: Stripe.Subscription) {
  try {
    const serviceSupabase = createServiceRoleClient()
    
    // Get user ID from subscription
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single()
    
    if (profileError || !profile) {
      console.error('Could not find user for subscription:', subscription.id)
      return
    }

    const userId = profile.id

    // Get current billing period
    const { data: billingPeriod, error: billingError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: userId })
      .single()

    if (billingError || !billingPeriod) {
      console.error('Could not find billing period for user:', userId)
      return
    }

    // Get add-on price IDs for comparison (simplified for new model)
    const domainPriceId = getAddOnPriceId('extra_domains')
    const edgeAlertsPriceId = getAddOnPriceId('edge_alerts')

    // Mark all existing add-ons as cancelled first
    await serviceSupabase
      .from('subscription_add_ons')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active')

    // Process current subscription items (simplified for new model)
    for (const item of subscription.items.data) {
      let addOnType: 'extra_domains' | 'edge_alerts' | null = null
      let unitPriceCents = 0

      if (item.price.id === domainPriceId) {
        addOnType = 'extra_domains'
        unitPriceCents = 10000 // $100
      } else if (item.price.id === edgeAlertsPriceId) {
        addOnType = 'edge_alerts'
        unitPriceCents = 1000 // $10
      }

      if (addOnType && item.quantity > 0) {
        // Create or reactivate add-on record
        const addonData = {
          user_id: userId,
          subscription_usage_id: billingPeriod.usage_id,
          add_on_type: addOnType,
          quantity: item.quantity,
          unit_price_cents: unitPriceCents,
          total_price_cents: item.quantity * unitPriceCents,
          stripe_subscription_item_id: item.id,
          status: 'active',
          billing_period_start: billingPeriod.period_start,
          billing_period_end: billingPeriod.period_end
        }

        await serviceSupabase
          .from('subscription_add_ons')
          .upsert(addonData, {
            onConflict: 'user_id,add_on_type,status'
          })

        console.log(`✅ Updated ${addOnType} add-on: ${item.quantity} units`)
      }
    }

  } catch (error) {
    console.error('Error updating subscription add-ons:', error)
  }
} 