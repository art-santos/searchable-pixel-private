import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const supabase = createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Verify the user has access to this workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, workspace_name, user_id')
      .eq('id', workspaceId)
      .single()
    
    if (workspaceError || !workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      )
    }
    
    if (workspace.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // Test the tracking pixel by making a request
    const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/track/${workspaceId}/pixel.gif?page=test&c=pixel-test`
    
    try {
      const response = await fetch(pixelUrl, {
        headers: {
          'User-Agent': 'Split-Test-Bot/1.0 (Tracking Pixel Test)',
          'Referer': `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/settings`
        }
      })
      
      if (response.ok && response.headers.get('content-type') === 'image/gif') {
        // Check if a test event was created
        const { data: recentVisit } = await supabase
          .from('crawler_visits')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('crawler_name', 'Split-Test-Bot')
          .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        return NextResponse.json({
          success: true,
          message: 'Tracking pixel test successful!',
          details: {
            pixelLoaded: true,
            eventCreated: !!recentVisit,
            workspace: workspace.workspace_name,
            testUrl: pixelUrl
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Pixel failed to load',
          details: {
            status: response.status,
            statusText: response.statusText
          }
        }, { status: 500 })
      }
    } catch (fetchError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to test pixel',
        details: {
          message: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        }
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Pixel test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 