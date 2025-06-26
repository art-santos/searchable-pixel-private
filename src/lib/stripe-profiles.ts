import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from './stripe'
import Stripe from 'stripe'

/**
 * Update user's Stripe subscription in the profiles table
 * This is called from webhooks and needs service role access
 */
export async function updateUserSubscription({
  email,
  stripeCustomerId,
  subscriptionId,
  planId,
  billing,
}: {
  email?: string | null
  stripeCustomerId: string
  subscriptionId: string
  planId: string
  billing: 'monthly' | 'annual'
}) {
  const supabase = createServiceClient()
  
  console.log('[updateUserSubscription] Starting with:', {
    email,
    stripeCustomerId,
    subscriptionId,
    planId,
    billing
  })
  
  // Strategy 1: Try to find user by Stripe customer metadata (most reliable)
  let userId: string | null = null
  let userEmail: string | null = email || null
  
  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId)
    if (customer && !customer.deleted) {
      // Get user ID from metadata if available
      if (customer.metadata?.supabase_user_id) {
        userId = customer.metadata.supabase_user_id
        console.log('[updateUserSubscription] Found user ID from Stripe metadata:', userId)
      }
      
      // Get email from Stripe customer if we don't have it
      if (!userEmail && customer.email) {
        userEmail = customer.email
      }
    }
  } catch (error) {
    console.error('[updateUserSubscription] Error retrieving Stripe customer:', error)
  }
  
  // Strategy 2: Find by existing stripe_customer_id in profiles
  if (!userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()
    
    if (profile) {
      userId = profile.id
      if (!userEmail && profile.email) {
        userEmail = profile.email
      }
      console.log('[updateUserSubscription] Found user by stripe_customer_id:', userId)
    }
  }
  
  // Strategy 3: Find by email in profiles table
  if (!userId && userEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single()
    
    if (profile) {
      userId = profile.id
      console.log('[updateUserSubscription] Found user by email in profiles:', userId)
    }
  }
  
  // Strategy 4: Find by email in auth.users
  if (!userId && userEmail) {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === userEmail)
    if (user) {
      userId = user.id
      console.log('[updateUserSubscription] Found user by email in auth.users:', userId)
      
      // Create/update profile with email if it doesn't exist
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: userEmail,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
    }
  }
  
  if (!userId) {
    console.error('[updateUserSubscription] Unable to find user for Stripe customer:', stripeCustomerId, 'with email:', userEmail)
    
    // Log this as a critical error that needs manual intervention
    await supabase
      .from('stripe_webhook_errors')
      .insert({
        error_type: 'user_not_found',
        stripe_customer_id: stripeCustomerId,
        email: userEmail,
        subscription_id: subscriptionId,
        error_details: {
          message: 'Could not find user for Stripe customer',
          planId,
          billing
        },
        created_at: new Date().toISOString()
      })
    
    return
  }
  
  // Get the full subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  // Update the profile with Stripe data
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: stripeCustomerId,
      subscription_id: subscriptionId,
      subscription_status: subscription.status,
      subscription_plan: planId,
      subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      payment_method_verified: true, // If they have a subscription, they have a payment method
      payment_method_verified_at: new Date().toISOString(),
      email: userEmail, // Ensure email is set
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
  
  if (error) {
    console.error('[updateUserSubscription] Error updating user subscription:', error)
    
    // Log the error for debugging
    await supabase
      .from('stripe_webhook_errors')
      .insert({
        error_type: 'update_failed',
        stripe_customer_id: stripeCustomerId,
        email: userEmail,
        subscription_id: subscriptionId,
        error_details: {
          message: 'Failed to update user subscription',
          error: error.message,
          userId,
          planId,
          billing
        },
        created_at: new Date().toISOString()
      })
  } else {
    console.log('[updateUserSubscription] Successfully updated subscription for user:', userId)
    
    // Also update the Stripe customer metadata to ensure future lookups work
    try {
      await stripe.customers.update(stripeCustomerId, {
        metadata: {
          supabase_user_id: userId
        }
      })
      console.log('[updateUserSubscription] Updated Stripe customer metadata')
    } catch (stripeError) {
      console.error('[updateUserSubscription] Error updating Stripe customer metadata:', stripeError)
    }
  }
}

/**
 * Update subscription status when it changes
 * This is called from webhooks and needs service role access
 */
export async function updateSubscriptionStatus({
  subscriptionId,
  status,
  plan,
  currentPeriodEnd,
  cancelAtPeriodEnd = false,
}: {
  subscriptionId: string
  status: string
  plan: string
  currentPeriodEnd: Date
  cancelAtPeriodEnd?: boolean
}) {
  const supabase = createServiceClient()
  
  console.log('[updateSubscriptionStatus] Updating subscription:', {
    subscriptionId,
    status,
    plan,
    currentPeriodEnd,
    cancelAtPeriodEnd
  })
  
  // First update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_plan: plan,
      subscription_period_end: currentPeriodEnd.toISOString(),
    })
    .eq('subscription_id', subscriptionId)
  
  if (profileError) {
    console.error('Error updating subscription status in profiles:', profileError)
  }
  
  // Also update subscription_info table if it exists
  // First find the user ID by subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('subscription_id', subscriptionId)
    .single()
  
  if (profile) {
    const { error: subInfoError } = await supabase
      .from('subscription_info')
      .update({
        plan_status: status,
        plan_type: plan,
        current_period_end: currentPeriodEnd.toISOString(),
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', profile.id)
    
    if (subInfoError) {
      console.error('Error updating subscription_info:', subInfoError)
    } else {
      console.log('Successfully updated cancel_at_period_end to:', cancelAtPeriodEnd)
    }
  }
}

/**
 * Cancel user subscription when deleted (no free plan in new model)
 * This is called from webhooks and needs service role access
 */
export async function cancelUserSubscription({
  stripeCustomerId,
}: {
  stripeCustomerId: string
}) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      subscription_plan: 'starter', // Default to starter (they'll need to resubscribe)
      subscription_period_end: null,
      subscription_id: null,
    })
    .eq('stripe_customer_id', stripeCustomerId)
  
  if (error) {
    console.error('Error canceling user subscription:', error)
  }
}

/**
 * Get user's Stripe customer ID from profile
 * This is for regular authenticated requests
 */
export async function getUserStripeCustomerId(userId: string): Promise<string | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching Stripe customer ID:', error)
    return null
  }
  
  return data?.stripe_customer_id || null
}

/**
 * Get user's subscription details
 * This is for regular authenticated requests
 */
export async function getUserSubscription(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id, subscription_id, subscription_status, subscription_plan, subscription_period_end, is_admin')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user subscription:', error)
    return null
  }
  
  return data
} 