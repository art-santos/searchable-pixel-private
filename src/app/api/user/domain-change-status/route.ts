import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/user/domain-change-status - Check if user can change workspace domain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns this workspace
    const { data: workspace, error: verifyError } = await supabase
      .from('workspaces')
      .select('id, last_domain_change')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (verifyError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Check if domain change is allowed (7-day cooldown)
    const { data: canChange, error: canChangeError } = await supabase
      .rpc('can_change_domain', { p_workspace_id: workspaceId })
      .single()

    if (canChangeError) {
      console.error('Error checking domain change eligibility:', canChangeError)
      return NextResponse.json(
        { error: 'Failed to check domain change status' },
        { status: 500 }
      )
    }

    let daysRemaining = 0
    if (!canChange) {
      // Get days remaining until next change is allowed
      const { data: daysUntilChange, error: daysError } = await supabase
        .rpc('days_until_domain_change', { p_workspace_id: workspaceId })
        .single()

      if (!daysError) {
        daysRemaining = daysUntilChange
      }
    }

    return NextResponse.json({
      canChange,
      daysRemaining,
      lastDomainChange: workspace.last_domain_change,
      nextChangeAllowedAt: workspace.last_domain_change ? 
        new Date(new Date(workspace.last_domain_change).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : 
        null
    })

  } catch (error) {
    console.error('Domain change status check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check domain change status',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 