import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/stripe-profiles'

export async function GET() {
  try {
    // Use regular client for user auth
    const supabase = createClient()
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database operations
    const serviceSupabase = createServiceRoleClient()

    // Get user's current billing preferences
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('billing_preferences, subscription_plan')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching billing preferences:', profileError)
      return NextResponse.json({ error: 'Failed to fetch billing preferences' }, { status: 500 })
    }

    // Get plan spending limits
    const { data: planSpendingLimit } = await serviceSupabase
      .rpc('get_plan_spending_limit', { plan_type: profile?.subscription_plan || 'free' })

    const billingPrefs = profile?.billing_preferences || {}

    return NextResponse.json({ 
      preferences: {
        ai_logs_enabled: billingPrefs.ai_logs_enabled !== false,
        spending_limit_cents: billingPrefs.spending_limit_cents,
        overage_notifications: billingPrefs.overage_notifications !== false,
        auto_billing_enabled: billingPrefs.auto_billing_enabled !== false,
        analytics_only_mode: billingPrefs.analytics_only_mode === true
      },
      limits: {
        plan_spending_limit_cents: planSpendingLimit,
        max_user_spending_limit_cents: planSpendingLimit // Users can't set higher than plan limit
      }
    })

  } catch (error) {
    console.error('Error in billing preferences GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { preferences } = await req.json()

    // Validate input
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid preferences object' }, { status: 400 })
    }

    // Use regular client for user auth
    const supabase = createClient()
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database operations
    const serviceSupabase = createServiceRoleClient()

    // Get user's subscription info to validate spending limits
    const userSubscription = await getUserSubscription(user.id)
    const { data: planSpendingLimit } = await serviceSupabase
      .rpc('get_plan_spending_limit', { plan_type: userSubscription?.subscription_plan || 'free' })

    // Validate spending limit
    if (preferences.spending_limit_cents !== null && preferences.spending_limit_cents !== undefined) {
      if (typeof preferences.spending_limit_cents !== 'number' || preferences.spending_limit_cents < 0) {
        return NextResponse.json({ error: 'Spending limit must be a non-negative number or null' }, { status: 400 })
      }
    }

    // Validate boolean preferences
    const booleanFields = ['ai_logs_enabled', 'overage_notifications', 'auto_billing_enabled', 'analytics_only_mode']
    for (const field of booleanFields) {
      if (preferences[field] !== undefined && typeof preferences[field] !== 'boolean') {
        return NextResponse.json({ error: `${field} must be a boolean value` }, { status: 400 })
      }
    }

    // Get current preferences to merge with new ones
    const { data: currentProfile, error: fetchError } = await serviceSupabase
      .from('profiles')
      .select('billing_preferences')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching current preferences:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch current preferences' }, { status: 500 })
    }

    const currentPrefs = currentProfile?.billing_preferences || {}
    
    // Merge new preferences with existing ones
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences
    }

    // Update billing preferences
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({ 
        billing_preferences: updatedPrefs
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating billing preferences:', updateError)
      return NextResponse.json({ error: 'Failed to update billing preferences' }, { status: 500 })
    }

    // Log the preference change
    await serviceSupabase
      .from('usage_events')
      .insert({
        user_id: user.id,
        event_type: 'preference_updated',
        amount: 1,
        metadata: {
          previous_preferences: currentPrefs,
          new_preferences: updatedPrefs,
          changed_fields: Object.keys(preferences)
        },
        billable: false,
        cost_cents: 0
      })

    return NextResponse.json({ 
      success: true,
      message: 'Billing preferences updated successfully',
      preferences: updatedPrefs
    })

  } catch (error) {
    console.error('Error in billing preferences PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 