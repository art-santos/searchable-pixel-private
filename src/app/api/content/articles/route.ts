import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/content/articles - Get articles for a workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'published'
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Get user auth
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

    // Build query for articles
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        content,
        content_preview,
        status,
        category,
        primary_keyword,
        meta_description,
        word_count,
        read_time,
        views,
        workspace_id,
        created_at,
        updated_at
      `)
      .eq('workspace_id', workspaceId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,category.ilike.%${search}%,primary_keyword.ilike.%${search}%`)
    }

    // Add pagination
    if (limit) {
      query = query.limit(parseInt(limit))
    }
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + (limit ? parseInt(limit) - 1 : 9))
    }

    const { data: articles, error: articlesError } = await query

    if (articlesError) {
      console.error('Error fetching articles:', articlesError)
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', status)

    return NextResponse.json({
      success: true,
      data: {
        articles: articles || [],
        totalCount: count || 0,
        pagination: {
          limit: limit ? parseInt(limit) : null,
          offset: offset ? parseInt(offset) : 0,
          total: count || 0
        }
      }
    })

  } catch (error) {
    console.error('Get articles API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get articles',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

// POST /api/content/articles - Create a new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      workspaceId, 
      title, 
      content, 
      category, 
      primaryKeyword,
      metaDescription,
      status = 'draft'
    } = body

    if (!workspaceId || !title || !content) {
      return NextResponse.json(
        { error: 'Workspace ID, title, and content are required' },
        { status: 400 }
      )
    }

    // Get user auth
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

    // Calculate word count and read time
    const wordCount = content.split(/\s+/).length
    const readTime = Math.ceil(wordCount / 200) // Assuming 200 words per minute

    // Create content preview (first 160 characters)
    const contentPreview = content.replace(/<[^>]*>/g, '').substring(0, 160) + '...'

    // Insert article
    const { data: article, error: insertError } = await supabase
      .from('articles')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        title,
        content,
        content_preview: contentPreview,
        status,
        category: category || 'General',
        primary_keyword: primaryKeyword,
        meta_description: metaDescription,
        word_count: wordCount,
        read_time: `${readTime} min`,
        views: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating article:', insertError)
      return NextResponse.json(
        { error: 'Failed to create article' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: article
    })

  } catch (error) {
    console.error('Create article API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create article',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 