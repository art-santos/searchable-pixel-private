import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { 
  stripe, 
  mapSubscriptionToPlan, 
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
      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object as Stripe.SetupIntent
        
        console.log('Setup intent succeeded:', setupIntent.id)
        console.log('Customer:', setupIntent.customer)
        console.log('Payment method:', setupIntent.payment_method)
        
        // Mark payment method as verified for this user
        if (setupIntent.customer && setupIntent.payment_method) {
          await markPaymentMethodVerified(
            setupIntent.customer as string, 
            setupIntent.payment_method as string,
            setupIntent.id
          )
        }
        
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Handle successful subscription creation
        console.log('Checkout session completed:', session.id)
        console.log('Customer:', session.customer)
        console.log('Subscription:', session.subscription)
        console.log('Metadata:', session.metadata)
        
        // Mark payment method as verified (subscription checkout includes payment method)
        if (session.customer) {
          await markPaymentMethodVerifiedForCustomer(session.customer as string)
        }
        
        // ✅ NEW: Cancel existing active subscriptions before creating new one
        if (session.customer && session.subscription) {
          await cancelExistingSubscriptions(session.customer as string, session.subscription as string)
        }
        
        // Update user's subscription in the database
        await updateUserSubscription({
          email: session.customer_email || session.customer_details?.email,
          stripeCustomerId: session.customer as string,
          subscriptionId: session.subscription as string,
          planId: session.metadata?.planId || '',
          billing: (session.metadata?.billing || 'monthly') as 'monthly' | 'annual'
        })

        // ✅ NEW: Sync all billing tables with credit metadata
        await syncAllBillingTables(
          session.customer as string, 
          session.subscription as string,
          session.metadata
        )
        
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Handle subscription updates (plan changes, renewals, add-ons)
        console.log('Subscription updated:', subscription.id)
        console.log('Status:', subscription.status)
        console.log('Cancel at period end:', subscription.cancel_at_period_end)
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
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        })

        // Removed: Add-on functionality no longer supported

        // ✅ NEW: Sync all billing tables
        await syncAllBillingTables(subscription.customer as string, subscription.id, subscription.metadata)
        
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
        await syncAllBillingTables(subscription.customer as string, subscription.id, subscription.metadata)
        
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
async function syncAllBillingTables(stripeCustomerId: string, subscriptionId: string, metadata?: any) {
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
      if (planFromMetadata && ['starter', 'pro'].includes(planFromMetadata)) {
        actualPlan = planFromMetadata
      } else {
        // Fallback to price ID parsing if no metadata
        if (priceId.includes('starter') || priceId.includes('basic')) {
          actualPlan = 'starter'
        } else if (priceId.includes('pro')) {
          actualPlan = 'pro'  
        }
      }
      
      console.log('🎯 [WEBHOOK] Final mapped plan:', actualPlan)
      
      subscriptionStatus = stripeSubscription.status
    } catch (stripeError) {
      console.error('❌ [WEBHOOK] Error retrieving Stripe subscription:', stripeError)
    }

    // Handle admin users (give them Pro access)
    if (profile.is_admin) {
      actualPlan = 'pro'
      subscriptionStatus = 'active'
      console.log('👑 [WEBHOOK] Admin user detected, using pro plan')
    }

    // Extract credit allocation for Pro plans
    let leadCredits = 0
    if (metadata?.credits && actualPlan === 'pro') {
      leadCredits = parseInt(metadata.credits, 10) || 250 // Default to 250 if invalid
      console.log('💳 [WEBHOOK] Pro plan with credits:', leadCredits)
    }

    // Define plan limits
    const getPlanLimits = (plan: string, credits: number = 0) => {
      switch (plan) {
        case 'starter': return { 
          domains: 1, 
          aiLogs: 0, // Unlimited AI crawler tracking for Starter  
          snapshots: 0, // Unlimited snapshots for Starter
          workspaces: 1,
          leadCredits: 0 // No lead credits for Starter
        }
        case 'pro': return { 
          domains: 1, 
          aiLogs: 0, // Unlimited AI crawler tracking for Pro
          snapshots: 0, // Unlimited snapshots for Pro
          workspaces: 3,
          leadCredits: credits || 250 // Credit-based lead generation
        }
        default: return { 
          domains: 1, 
          aiLogs: 0, 
          snapshots: 0, 
          workspaces: 1,
          leadCredits: 0
        }
      }
    }

    const limits = getPlanLimits(actualPlan, leadCredits)
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
        cancel_at_period_end: stripeSubscription?.cancel_at_period_end || false,
        domains_included: limits.domains,
        workspaces_included: limits.workspaces,
        ai_logs_included: limits.leadCredits, // Store lead credits in ai_logs_included for now
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
        // Use the new lead_credits_included column
        lead_credits_included: limits.leadCredits,
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

// Removed: Add-on functionality no longer supported

// ✅ NEW: Function to mark payment method as verified for a specific customer
async function markPaymentMethodVerified(
  stripeCustomerId: string, 
  paymentMethodId: string,
  setupIntentId: string
) {
  try {
    const serviceSupabase = createServiceRoleClient()
    
    console.log('🔐 [WEBHOOK] Marking payment method as verified for customer:', stripeCustomerId)
    
    // Find user by Stripe customer ID
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()
    
    if (profileError || !profile) {
      console.error('❌ [WEBHOOK] Could not find user for Stripe customer:', stripeCustomerId)
      return
    }

    // Mark payment method as verified
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({
        payment_method_verified: true,
        payment_method_verified_at: new Date().toISOString(),
        stripe_setup_intent_id: setupIntentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
    
    if (updateError) {
      console.error('❌ [WEBHOOK] Error marking payment method verified:', updateError)
    } else {
      console.log('✅ [WEBHOOK] Payment method marked as verified for user:', profile.id)
    }

  } catch (error) {
    console.error('❌ [WEBHOOK] Error in markPaymentMethodVerified:', error)
  }
}

// ✅ NEW: Function to mark payment method as verified for customer (when we don't have payment method ID)
async function markPaymentMethodVerifiedForCustomer(stripeCustomerId: string) {
  try {
    const serviceSupabase = createServiceRoleClient()
    
    console.log('🔐 [WEBHOOK] Marking payment method as verified for customer:', stripeCustomerId)
    
    // Find user by Stripe customer ID
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()
    
    if (profileError || !profile) {
      console.error('❌ [WEBHOOK] Could not find user for Stripe customer:', stripeCustomerId)
      return
    }

    // Mark payment method as verified (subscription checkout means they have a payment method)
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({
        payment_method_verified: true,
        payment_method_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
    
    if (updateError) {
      console.error('❌ [WEBHOOK] Error marking payment method verified:', updateError)
    } else {
      console.log('✅ [WEBHOOK] Payment method marked as verified for user:', profile.id)
    }

  } catch (error) {
    console.error('❌ [WEBHOOK] Error in markPaymentMethodVerifiedForCustomer:', error)
  }
}

// ✅ NEW: Function to cancel existing active subscriptions when creating a new one
async function cancelExistingSubscriptions(stripeCustomerId: string, newSubscriptionId: string) {
  try {
    console.log('🚫 [WEBHOOK] Checking for existing subscriptions to cancel for customer:', stripeCustomerId)
    console.log('🚫 [WEBHOOK] New subscription ID (to keep active):', newSubscriptionId)
    
    // List all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 100 // Should be plenty for any customer
    })
    
    console.log('🚫 [WEBHOOK] Found', subscriptions.data.length, 'active subscriptions for customer')
    
    // Cancel all subscriptions except the new one
    const subscriptionsToCancel = subscriptions.data.filter(sub => sub.id !== newSubscriptionId)
    
    if (subscriptionsToCancel.length === 0) {
      console.log('✅ [WEBHOOK] No existing subscriptions to cancel')
      return
    }
    
    console.log('🚫 [WEBHOOK] Cancelling', subscriptionsToCancel.length, 'existing subscriptions')
    
    for (const subscription of subscriptionsToCancel) {
      try {
        console.log('🚫 [WEBHOOK] Cancelling subscription:', subscription.id)
        
        // Cancel the subscription immediately (not at period end)
        await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: false,
        })
        
        // Then cancel it immediately
        await stripe.subscriptions.cancel(subscription.id, {
          prorate: true, // Give them credit for unused time
        })
        
        console.log('✅ [WEBHOOK] Successfully cancelled subscription:', subscription.id)
        
      } catch (cancelError) {
        console.error('❌ [WEBHOOK] Error cancelling subscription', subscription.id, ':', cancelError)
        // Continue with other subscriptions even if one fails
      }
    }
    
    console.log('🎉 [WEBHOOK] Finished cancelling existing subscriptions')
    
  } catch (error) {
    console.error('❌ [WEBHOOK] Error in cancelExistingSubscriptions:', error)
  }
} 