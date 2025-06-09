import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { 
      planId, 
      isAnnual = false, 
      customerId, 
      customerEmail,
      addOns = {}
    } = await req.json()

    // Validate required fields
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    if (!customerEmail && !customerId) {
      return NextResponse.json(
        { error: 'Customer email or ID is required' },
        { status: 400 }
      )
    }

    // Set trial for starter plan
    const trialDays = planId === 'starter' ? 7 : 0

    // Create checkout session using new helper
    const session = await createCheckoutSession({
      planId,
      isAnnual,
      customerId,
      customerEmail,
      addOns,
      trialDays,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
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