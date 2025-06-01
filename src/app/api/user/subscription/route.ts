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
    
    // Admin override: if user is admin, always treat as pro
    const effectivePlan = subscription?.is_admin ? 'pro' : (subscription?.subscription_plan || 'free')
    const effectiveStatus = subscription?.is_admin ? 'active' : (subscription?.subscription_status || 'free')
    
    return NextResponse.json({
      stripeCustomerId: subscription?.stripe_customer_id || null,
      subscriptionStatus: effectiveStatus,
      subscriptionPlan: effectivePlan,
      subscriptionPeriodEnd: subscription?.subscription_period_end || null,
      isAdmin: subscription?.is_admin || false
    })
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    )
  }
} 