import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeBaseService } from '@/lib/knowledge-base/service'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/knowledge-base/items - Get knowledge items with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Get user auth to verify workspace access
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Initialize service with workspace context
    const knowledgeService = new KnowledgeBaseService(true, workspaceId)

    const filters = {
      tag: tag !== 'all' ? tag || undefined : undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    }

    const items = await knowledgeService.getItems(workspaceId, filters)
    const statistics = await knowledgeService.getStatistics(workspaceId)

    return NextResponse.json({
      success: true,
      data: {
        items,
        statistics
      }
    })

  } catch (error) {
    console.error('Get knowledge items API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get knowledge items',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

// POST /api/knowledge-base/items - Create a knowledge item
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, content, tag } = await request.json()

    if (!workspaceId || !content || !tag) {
      return NextResponse.json(
        { error: 'Workspace ID, content, and tag are required' },
        { status: 400 }
      )
    }

    // Get user auth to verify workspace access
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Initialize service with workspace context
    const knowledgeService = new KnowledgeBaseService(true, workspaceId)

    // Create item
    const item = await knowledgeService.createItem(workspaceId, content, tag)

    return NextResponse.json({
      success: true,
      data: item
    })

  } catch (error) {
    console.error('Create knowledge item API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create knowledge item',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

// PUT /api/knowledge-base/items - Update a knowledge item
export async function PUT(request: NextRequest) {
  try {
    const { id, content, tag } = await request.json()

    if (!id || !content || !tag) {
      return NextResponse.json(
        { error: 'ID, content, and tag are required' },
        { status: 400 }
      )
    }

    // Validate content length
    if (content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters long' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Content must be less than 1000 characters' },
        { status: 400 }
      )
    }

    const knowledgeService = new KnowledgeBaseService(true)
    const item = await knowledgeService.updateItem(id, content, tag)

    return NextResponse.json({
      success: true,
      data: item
    })

  } catch (error) {
    console.error('Update knowledge item error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update knowledge item',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/knowledge-base/items - Delete a knowledge item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    const knowledgeService = new KnowledgeBaseService(true)
    await knowledgeService.deleteItem(id)

    return NextResponse.json({
      success: true,
      message: 'Knowledge item deleted successfully'
    })

  } catch (error) {
    console.error('Delete knowledge item error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to delete knowledge item',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 