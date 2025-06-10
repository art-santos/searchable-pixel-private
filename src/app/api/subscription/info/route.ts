import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscription info from centralized table
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .rpc('get_user_subscription', { p_user_id: user.id })
      .single()

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError)
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }

    if (!subscriptionData) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Get current workspaces count
    const { count: workspacesCount, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get current AI logs usage for this period
    const { count: aiLogsCount, error: aiLogsError } = await supabase
      .from('crawler_visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('timestamp', subscriptionData.current_period_start)
      .lte('timestamp', subscriptionData.current_period_end)

    // Get active add-ons
    const { data: addOns, error: addOnsError } = await supabase
      .from('subscription_add_ons')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    // Update usage counts in subscription_info if they've changed
    const actualWorkspacesUsed = workspacesCount || 1
    const actualAiLogsUsed = aiLogsCount || 0

    if (actualWorkspacesUsed !== subscriptionData.workspaces_used || 
        actualAiLogsUsed !== subscriptionData.ai_logs_used) {
      
      await supabase
        .from('subscription_info')
        .update({
          workspaces_used: actualWorkspacesUsed,
          ai_logs_used: actualAiLogsUsed,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    }

    // Format response
    const response = {
      subscription: {
        user_id: subscriptionData.user_id,
        plan_type: subscriptionData.plan_type,
        plan_status: subscriptionData.plan_status,
        is_admin: subscriptionData.is_admin,
        stripe_customer_id: subscriptionData.stripe_customer_id,
        stripe_subscription_id: subscriptionData.stripe_subscription_id,
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
        trial_end: subscriptionData.trial_end,
        cancel_at_period_end: subscriptionData.cancel_at_period_end
      },
      usage: {
        domains: {
          included: subscriptionData.domains_included,
          used: subscriptionData.domains_used,
          remaining: subscriptionData.domains_remaining
        },
        workspaces: {
          included: subscriptionData.workspaces_included,
          used: actualWorkspacesUsed,
          remaining: Math.max(0, subscriptionData.workspaces_included - actualWorkspacesUsed)
        },
        team_members: {
          included: subscriptionData.team_members_included,
          used: subscriptionData.team_members_used,
          remaining: subscriptionData.team_members_remaining
        },
        ai_logs: {
          included: subscriptionData.ai_logs_included,
          used: actualAiLogsUsed,
          remaining: Math.max(0, subscriptionData.ai_logs_included - actualAiLogsUsed)
        }
      },
      add_ons: {
        extra_domains: subscriptionData.extra_domains,
        edge_alerts_enabled: subscriptionData.edge_alerts_enabled,
        active_add_ons: addOns || []
      },
      billing_preferences: subscriptionData.billing_preferences
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error in subscription info API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan_type, billing_preferences, add_ons } = body

    // Update plan if provided
    if (plan_type) {
      const { error: planUpdateError } = await supabase
        .rpc('update_subscription_plan', {
          p_user_id: user.id,
          p_plan_type: plan_type
        })

      if (planUpdateError) {
        console.error('Error updating plan:', planUpdateError)
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
      }
    }

    // Update billing preferences if provided
    if (billing_preferences) {
      const { error: prefsError } = await supabase
        .from('subscription_info')
        .update({ billing_preferences })
        .eq('user_id', user.id)

      if (prefsError) {
        console.error('Error updating billing preferences:', prefsError)
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
      }
    }

    // Update add-ons if provided
    if (add_ons) {
      const { error: addOnsError } = await supabase
        .from('subscription_info')
        .update({
          extra_domains: add_ons.extra_domains || 0,
          edge_alerts_enabled: add_ons.edge_alerts_enabled || false
        })
        .eq('user_id', user.id)

      if (addOnsError) {
        console.error('Error updating add-ons:', addOnsError)
        return NextResponse.json({ error: 'Failed to update add-ons' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Subscription updated successfully' })
    
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 