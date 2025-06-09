import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { newPlan } = await req.json()

    if (!newPlan) {
      return NextResponse.json({ error: 'New plan required' }, { status: 400 })
    }

    if (!['starter', 'pro', 'team'].includes(newPlan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
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

    // Get current plan and workspace count
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const currentPlan = profile.subscription_plan || 'starter'

    // Get current workspace count
    const { count: workspaceCount, error: countError } = await serviceSupabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      return NextResponse.json({ error: 'Failed to count workspaces' }, { status: 500 })
    }

    // Get current add-ons
    const { data: addOns, error: addOnError } = await serviceSupabase
      .from('subscription_add_ons')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('add_on_type', 'extra_domains')
      .eq('is_active', true)
      .single()

    const extraDomains = addOns?.quantity || 0

    // Calculate plan limits
    const planLimits = {
      starter: 1,
      pro: 1,
      team: 5
    }

    const currentLimit = planLimits[currentPlan as keyof typeof planLimits] + extraDomains
    const newLimit = planLimits[newPlan as keyof typeof planLimits] + extraDomains
    const currentWorkspaces = workspaceCount || 0

    // Check if plan change is safe
    const isUpgrade = newLimit >= currentLimit
    const requiresDeletion = currentWorkspaces > newLimit
    const workspacesToDelete = Math.max(0, currentWorkspaces - newLimit)

    // Get list of non-primary workspaces for deletion selection
    let workspaceOptions = []
    if (requiresDeletion) {
      const { data: workspaces, error: workspaceError } = await serviceSupabase
        .from('workspaces')
        .select('id, domain, workspace_name, is_primary, created_at')
        .eq('user_id', user.id)
        .eq('is_primary', false)
        .order('created_at', { ascending: false }) // Newest first for deletion

      if (!workspaceError) {
        workspaceOptions = workspaces || []
      }
    }

    return NextResponse.json({
      currentPlan,
      newPlan,
      currentWorkspaces,
      currentLimit,
      newLimit,
      extraDomains,
      isUpgrade,
      canChange: !requiresDeletion,
      requiresDeletion,
      workspacesToDelete,
      workspaceOptions,
      message: requiresDeletion 
        ? `Downgrading to ${newPlan} would reduce your workspace limit from ${currentLimit} to ${newLimit}. You need to delete ${workspacesToDelete} workspace${workspacesToDelete > 1 ? 's' : ''} first.`
        : `Plan change to ${newPlan} is safe. Your current ${currentWorkspaces} workspace${currentWorkspaces !== 1 ? 's' : ''} will remain within the new limit of ${newLimit}.`
    })

  } catch (error) {
    console.error('Error validating plan change:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 