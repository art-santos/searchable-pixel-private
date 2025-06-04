import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getUserSubscription } from '@/lib/stripe-profiles'

export async function POST(request: Request) {
  try {
    // Get user from auth
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create Stripe customer
    let userSubscription = await getUserSubscription(user.id)
    let customerId = userSubscription?.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      })
      customerId = customer.id

      // Update user profile with customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile with customer ID:', updateError)
      }
    }

    // Construct proper base URL with scheme
    const requestUrl = new URL(request.url)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${requestUrl.protocol}//${requestUrl.host}`
    
    // Ensure the base URL has a proper scheme
    const normalizedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`

    // Create setup intent for payment method with Link support
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card', 'link'],
      usage: 'off_session',
      metadata: {
        user_id: user.id
      }
    })

    // Create Stripe Checkout session for payment method setup with Link support
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'setup',
      payment_method_types: ['card', 'link'],
      success_url: `${normalizedBaseUrl}/dashboard?setup=success`,
      cancel_url: `${normalizedBaseUrl}/dashboard?setup=canceled`,
      metadata: {
        user_id: user.id,
        setup_intent_id: setupIntent.id
      },
      // Add configuration to better handle errors and Link payments
      payment_method_configuration: undefined, // Use default configuration
      locale: 'auto', // Auto-detect locale to fix the localization error
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      customer_creation: 'if_required'
    })

    return NextResponse.json({ 
      setupIntent: {
        id: setupIntent.id,
        url: session.url,
        client_secret: setupIntent.client_secret
      }
    })

  } catch (error) {
    console.error('Error creating setup intent:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 