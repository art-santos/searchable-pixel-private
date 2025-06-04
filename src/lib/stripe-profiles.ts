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
  
  // First, get the user by email if provided
  let userId: string | null = null
  
  if (email) {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === email)
    userId = user?.id || null
  }
  
  // If no userId from email, try to find by existing stripe_customer_id
  if (!userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()
    
    userId = profile?.id || null
  }
  
  if (!userId) {
    console.error('Unable to find user for Stripe customer:', stripeCustomerId)
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
      updated_by: userId,
    })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating user subscription:', error)
  } else {
    console.log('Successfully updated subscription for user:', userId)
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
}: {
  subscriptionId: string
  status: string
  plan: string
  currentPeriodEnd: Date
}) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_plan: plan,
      subscription_period_end: currentPeriodEnd.toISOString(),
    })
    .eq('subscription_id', subscriptionId)
  
  if (error) {
    console.error('Error updating subscription status:', error)
  }
}

/**
 * Downgrade user to free plan when subscription is deleted
 * This is called from webhooks and needs service role access
 */
export async function downgradeToFreePlan({
  stripeCustomerId,
}: {
  stripeCustomerId: string
}) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'free',
      subscription_plan: 'free',
      subscription_period_end: null,
      subscription_id: null,
    })
    .eq('stripe_customer_id', stripeCustomerId)
  
  if (error) {
    console.error('Error downgrading to free plan:', error)
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