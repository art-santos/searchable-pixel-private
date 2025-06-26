import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }

    console.log('🔍 Getting billing portal for user:', user.email)

    // Get user's Stripe customer ID from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_plan, subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError)
      return NextResponse.redirect(new URL('/settings?error=profile_not_found', request.url))
    }

    const stripeCustomerId = profile.stripe_customer_id

    if (!stripeCustomerId) {
      console.error('❌ No Stripe customer ID for user:', user.email)
      return NextResponse.redirect(new URL('/settings?error=no_billing_setup', request.url))
    }

    console.log('✅ Found Stripe customer:', stripeCustomerId)

    // Create Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
    })

    console.log('🎯 Portal session created, redirecting to:', session.url)

    // Direct redirect to Stripe portal
    return NextResponse.redirect(session.url)

  } catch (error) {
    console.error('❌ Billing portal error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(new URL(`/settings?error=portal_failed&details=${encodeURIComponent(errorMessage)}`, request.url))
  }
}

export async function POST(request: NextRequest) {
  try {
    const { returnUrl } = await request.json()
    
    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No billing setup found' }, { status: 404 })
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('❌ Portal creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create portal session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 