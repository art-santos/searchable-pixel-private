import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { 
      planId, 
      isAnnual = false, 
      customerId, 
      customerEmail,
      addOns = {},
      successUrl,
      cancelUrl
    } = await req.json()

    // Validate required fields
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use user's email if not provided
    const email = customerEmail || user.email

    if (!email && !customerId) {
      return NextResponse.json(
        { error: 'Customer email or ID is required' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer ID
    let stripeCustomerId = customerId
    
    if (!stripeCustomerId) {
      // Check if user already has a Stripe customer ID in profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
      
      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: email,
          metadata: {
            supabase_user_id: user.id
          }
        })
        stripeCustomerId = customer.id
        
        // Update profile with customer ID
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', user.id)
      }
    }

    // No trial for any plans
    const trialDays = 0

    // Create checkout session using new helper
    const session = await createCheckoutSession({
      planId,
      isAnnual,
      customerId: stripeCustomerId,
      customerEmail: email,
      addOns,
      trialDays,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 