import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  try {
    const { workspaceIds, reason } = await req.json()

    if (!workspaceIds || !Array.isArray(workspaceIds) || workspaceIds.length === 0) {
      return NextResponse.json({ error: 'Workspace IDs required' }, { status: 400 })
    }

    // Use regular client for user auth
    const supabase = createClient()
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for secure operations
    const serviceSupabase = createServiceRoleClient()

    // Verify user owns all workspaces and none are primary
    const { data: workspaces, error: workspaceError } = await serviceSupabase
      .from('workspaces')
      .select('id, domain, workspace_name, is_primary, user_id')
      .in('id', workspaceIds)

    if (workspaceError) {
      return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
    }

    // Security checks
    for (const workspace of workspaces) {
      if (workspace.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized workspace access' }, { status: 403 })
      }
      if (workspace.is_primary) {
        return NextResponse.json({ error: 'Cannot delete primary workspace' }, { status: 400 })
      }
    }

    if (workspaces.length !== workspaceIds.length) {
      return NextResponse.json({ error: 'Some workspaces not found' }, { status: 404 })
    }

    // Begin transaction-like deletion (Supabase handles foreign key cascades)
    const deletionResults = []

    for (const workspace of workspaces) {
      try {
        // 1. Delete workspace (cascades will handle related data)
        const { error: deleteError } = await serviceSupabase
          .from('workspaces')
          .delete()
          .eq('id', workspace.id)
          .eq('user_id', user.id) // Extra security

        if (deleteError) {
          console.error(`Failed to delete workspace ${workspace.id}:`, deleteError)
          deletionResults.push({
            workspaceId: workspace.id,
            domain: workspace.domain,
            success: false,
            error: deleteError.message
          })
        } else {
          deletionResults.push({
            workspaceId: workspace.id,
            domain: workspace.domain,
            success: true
          })

          // 2. Log the deletion for audit trail
          await serviceSupabase
            .from('workspace_deletion_log')
            .insert({
              user_id: user.id,
              workspace_id: workspace.id,
              domain: workspace.domain,
              workspace_name: workspace.workspace_name,
              reason: reason || 'user_deletion',
              deleted_at: new Date().toISOString()
            })
            .catch(logError => {
              console.error('Failed to log workspace deletion:', logError)
              // Don't fail the deletion if logging fails
            })
        }
      } catch (error) {
        console.error(`Error deleting workspace ${workspace.id}:`, error)
        deletionResults.push({
          workspaceId: workspace.id,
          domain: workspace.domain,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = deletionResults.filter(r => r.success).length
    const failCount = deletionResults.filter(r => !r.success).length

    return NextResponse.json({
      success: failCount === 0,
      message: `${successCount} workspace${successCount !== 1 ? 's' : ''} deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results: deletionResults,
      deletedCount: successCount,
      failedCount: failCount
    })

  } catch (error) {
    console.error('Error in workspace deletion:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 