import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all workspaces for the user
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching workspaces:', error)
      return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
    }

    return NextResponse.json({ workspaces })

  } catch (error) {
    console.error('Error in workspaces API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { domain, workspace_name } = await request.json()

    if (!domain || !workspace_name) {
      return NextResponse.json({ error: 'Domain and workspace name are required' }, { status: 400 })
    }

    // Check user's subscription plan - only Team plan can have multiple workspaces
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unable to verify subscription' }, { status: 500 })
    }

    // Check current workspace count
    const { count: workspaceCount, error: countError } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      return NextResponse.json({ error: 'Unable to verify workspace count' }, { status: 500 })
    }

    // Enforce workspace limits based on plan
    const plan = profile.subscription_plan || 'starter'
    let maxWorkspaces = 1 // Default for starter
    let includedWorkspaces = 1 // Base included workspaces

    // Set base limits for each plan
    if (plan === 'pro') {
      maxWorkspaces = 1 // Pro gets 1 included
      includedWorkspaces = 1
    } else if (plan === 'team') {
      maxWorkspaces = 5 // Team gets 5 included (1 primary + 4 additional)
      includedWorkspaces = 5
    }

    // Check for extra domain add-ons for ALL plans that support them (Pro and Team)
    if (plan === 'pro' || plan === 'team') {
      const { data: addOns } = await supabase
        .from('subscription_add_ons')
        .select('quantity')
        .eq('user_id', user.id)
        .eq('add_on_type', 'extra_domains')
        .eq('is_active', true)
        .single()
      
      if (addOns?.quantity) {
        maxWorkspaces += addOns.quantity // Add extra domains beyond base plan
      }
    }

    if ((workspaceCount || 0) >= maxWorkspaces) {
      if (plan === 'team') {
        return NextResponse.json({ 
          error: `Team plan includes up to ${maxWorkspaces} workspaces. You've reached the limit.`,
          requiresUpgrade: false
        }, { status: 403 })
      } else {
        return NextResponse.json({ 
          error: 'Multiple workspaces require Team plan. Upgrade to create additional workspaces.',
          requiresUpgrade: true,
          requiredPlan: 'team'
        }, { status: 403 })
      }
    }

    // Check if workspace with this domain already exists for user
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .eq('domain', domain)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Workspace with this domain already exists' }, { status: 409 })
    }

    // Create new workspace
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({
        user_id: user.id,
        domain,
        workspace_name,
        is_primary: false, // New workspaces are never primary
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating workspace:', error)
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
    }

    return NextResponse.json({ workspace })

  } catch (error) {
    console.error('Error in workspace creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    // Check if workspace exists and belongs to user
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('is_primary')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (workspace.is_primary) {
      return NextResponse.json({ error: 'Cannot delete primary workspace' }, { status: 400 })
    }

    // Delete the workspace (this will cascade delete all related data)
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting workspace:', error)
      return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in workspace deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 