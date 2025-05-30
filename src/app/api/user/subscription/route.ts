import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/stripe-profiles'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user's subscription data
    const subscription = await getUserSubscription(user.id)
    
    return NextResponse.json({
      stripeCustomerId: subscription?.stripe_customer_id || null,
      subscriptionStatus: subscription?.subscription_status || 'free',
      subscriptionPlan: subscription?.subscription_plan || 'free',
      subscriptionPeriodEnd: subscription?.subscription_period_end || null
    })
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    )
  }
} 