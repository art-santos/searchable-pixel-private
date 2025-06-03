import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeBaseService } from '@/lib/knowledge-base/service'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET /api/knowledge-base/items - Get knowledge items with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Initialize service
    const knowledgeService = new KnowledgeBaseService(true)

    const filters = {
      tag: tag !== 'all' ? tag || undefined : undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    }

    const items = await knowledgeService.getItems(companyId, filters)
    const statistics = await knowledgeService.getStatistics(companyId)

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
    const { companyId, content, tag } = await request.json()

    if (!companyId || !content || !tag) {
      return NextResponse.json(
        { error: 'Company ID, content, and tag are required' },
        { status: 400 }
      )
    }

    // Initialize service
    const knowledgeService = new KnowledgeBaseService(true)

    // Create item
    const item = await knowledgeService.createItem(companyId, content, tag)

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

    const knowledgeService = new KnowledgeBaseService()
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

    const knowledgeService = new KnowledgeBaseService()
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