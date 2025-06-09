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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_status, stripe_customer_id, is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      if (profileError && profileError.code !== 'PGRST116') {
        // If the error is something other than "no rows", log it
        console.error('Error fetching user subscription:', profileError)
      }
      
      // If no profile or a "no rows" error, return default starter plan
      return NextResponse.json({
        subscription_plan: 'starter',
        subscription_status: 'active',
        stripe_customer_id: null,
        is_admin: false
      })
    }

    // Admin users get full access (treat as team plan)
    const effectivePlan = profile.is_admin ? 'team' : (profile.subscription_plan || 'starter')

    return NextResponse.json({
      subscription_plan: effectivePlan,
      subscription_status: profile.subscription_status || 'active',
      stripe_customer_id: profile.stripe_customer_id,
      is_admin: profile.is_admin || false
    })

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 