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