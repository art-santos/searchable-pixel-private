import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, payment_method_verified, requires_payment_method, is_admin')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Admin users don't require payment methods
    if (profile.is_admin) {
      return NextResponse.json({
        hasPaymentMethod: true,
        verified: true,
        requiresPaymentMethod: false,
        isAdmin: true
      })
    }

    // If user doesn't require payment method, return true
    if (!profile.requires_payment_method) {
      return NextResponse.json({
        hasPaymentMethod: true,
        verified: true,
        requiresPaymentMethod: false
      })
    }

    // If already verified in our database, return early
    if (profile.payment_method_verified && profile.stripe_customer_id) {
      // Double-check with Stripe to ensure payment method still exists
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: profile.stripe_customer_id,
          type: 'card',
          limit: 1
        })

        const hasValidPaymentMethod = paymentMethods.data.length > 0

        if (!hasValidPaymentMethod) {
          // Payment method was removed from Stripe, update our database
          await supabase
            .from('profiles')
            .update({ 
              payment_method_verified: false,
              payment_method_verified_at: null 
            })
            .eq('id', user.id)
        }

        return NextResponse.json({
          hasPaymentMethod: hasValidPaymentMethod,
          verified: hasValidPaymentMethod,
          requiresPaymentMethod: true
        })
      } catch (stripeError) {
        console.error('Error checking Stripe payment methods:', stripeError)
        // If Stripe check fails, trust our database for now
        return NextResponse.json({
          hasPaymentMethod: profile.payment_method_verified,
          verified: profile.payment_method_verified,
          requiresPaymentMethod: true
        })
      }
    }

    // Check with Stripe if customer exists and has payment methods
    if (profile.stripe_customer_id) {
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: profile.stripe_customer_id,
          type: 'card',
          limit: 1
        })

        const hasValidPaymentMethod = paymentMethods.data.length > 0

        // Update our database if we found a payment method
        if (hasValidPaymentMethod && !profile.payment_method_verified) {
          await supabase
            .from('profiles')
            .update({ 
              payment_method_verified: true,
              payment_method_verified_at: new Date().toISOString()
            })
            .eq('id', user.id)
        }

        return NextResponse.json({
          hasPaymentMethod: hasValidPaymentMethod,
          verified: hasValidPaymentMethod,
          requiresPaymentMethod: true
        })
      } catch (stripeError) {
        console.error('Error checking Stripe payment methods:', stripeError)
        return NextResponse.json({
          hasPaymentMethod: false,
          verified: false,
          requiresPaymentMethod: true
        })
      }
    }

    // No Stripe customer ID and not verified
    return NextResponse.json({
      hasPaymentMethod: false,
      verified: false,
      requiresPaymentMethod: true
    })

  } catch (error) {
    console.error('Error verifying payment method:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 