import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPriceId } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { planId, isAnnual, customerId, customerEmail } = await req.json()

    // Get the price ID using helper function
    const priceId = getPriceId(planId, isAnnual)

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(customerId && { customer: customerId }),
      ...(customerEmail && !customerId && { customer_email: customerEmail }),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      metadata: {
        planId,
        billing: isAnnual ? 'annual' : 'monthly',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
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