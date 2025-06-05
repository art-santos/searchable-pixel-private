import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with subscription info
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        stripeCustomerId: null
      })
    }

    return NextResponse.json({
      subscriptionPlan: profile.subscription_plan || 'free',
      subscriptionStatus: profile.subscription_status || 'active',
      stripeCustomerId: profile.stripe_customer_id
    })

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 