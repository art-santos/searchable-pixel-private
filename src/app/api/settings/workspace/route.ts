import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/settings/workspace - Get workspace settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

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

    // Get workspace settings
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, workspace_name, domain, created_at, updated_at')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: workspace
    })

  } catch (error) {
    console.error('Get workspace settings error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get workspace settings',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

// PUT /api/settings/workspace - Update workspace settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, workspace_name, domain } = body

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
    const { data: existingWorkspace, error: verifyError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (verifyError || !existingWorkspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: any = {}
    if (workspace_name !== undefined) updates.workspace_name = workspace_name
    if (domain !== undefined) updates.domain = domain

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      )
    }

    // Update workspace
    const { data: updatedWorkspace, error: updateError } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update workspace error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update workspace' },
        { status: 500 }
      )
    }

    // Check if user should be marked as having completed onboarding
    // Get the user's profile to check all required fields
    const { data: userProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('first_name, workspace_name, domain, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profileFetchError && userProfile && !userProfile.onboarding_completed) {
      // Check if user has sufficient information for onboarding completion
      // Use updated workspace data if workspace_name was just updated
      const workspaceName = updates.workspace_name !== undefined ? updates.workspace_name : userProfile.workspace_name
      const domain = updates.domain !== undefined ? updates.domain : userProfile.domain
      
      const hasName = userProfile.first_name && userProfile.first_name.trim().length > 0
      const hasWorkspace = workspaceName && workspaceName.trim().length > 0
      const hasDomain = domain && domain.trim().length > 0

      if (hasName && hasWorkspace && hasDomain) {
        console.log('🎉 Auto-completing onboarding for existing user via workspace update:', user.id)
        
        // Mark onboarding as completed
        const { error: onboardingError } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', user.id)
        
        if (onboardingError) {
          console.error('⚠️ Warning: Could not mark onboarding as completed:', onboardingError)
          // Don't fail the entire update for this
        } else {
          console.log('✅ Onboarding marked as completed for existing user via workspace update')
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkspace,
      message: 'Workspace settings updated successfully'
    })

  } catch (error) {
    console.error('Update workspace settings error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update workspace settings',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 