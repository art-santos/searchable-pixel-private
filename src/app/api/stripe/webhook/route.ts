import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, mapSubscriptionToPlan } from '@/lib/stripe'
import { 
  updateUserSubscription, 
  updateSubscriptionStatus, 
  downgradeToFreePlan 
} from '@/lib/stripe-profiles'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
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
        
        // Handle subscription updates (plan changes, renewals)
        console.log('Subscription updated:', subscription.id)
        console.log('Status:', subscription.status)
        console.log('Current plan:', mapSubscriptionToPlan(subscription))
        
        // Update subscription info in the database
        await updateSubscriptionStatus({
          subscriptionId: subscription.id,
          status: subscription.status,
          plan: mapSubscriptionToPlan(subscription),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        })
        
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Handle subscription cancellation
        console.log('Subscription deleted:', subscription.id)
        console.log('Customer:', subscription.customer)
        
        // Update user to free plan in the database
        await downgradeToFreePlan({
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