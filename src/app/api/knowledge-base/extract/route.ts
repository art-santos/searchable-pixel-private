import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeBaseService } from '@/lib/knowledge-base/service'
import { KnowledgeExtractionEngine } from '@/lib/knowledge-base/extraction-engine'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/knowledge-base/extract
export async function POST(request: NextRequest) {
  try {
    const { textDump, workspaceId } = await request.json()

    if (!textDump || !workspaceId) {
      return NextResponse.json(
        { error: 'Text dump and workspace ID are required' },
        { status: 400 }
      )
    }

    // Validate text dump size
    if (textDump.length < 50) {
      return NextResponse.json(
        { error: 'Text dump is too short. Please provide at least 50 characters.' },
        { status: 400 }
      )
    }

    if (textDump.length > 10000) {
      return NextResponse.json(
        { error: 'Text dump is too long. Please limit to 10,000 characters.' },
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

    // Extract and save knowledge
    const result = await knowledgeService.extractAndSaveKnowledge(textDump, workspaceId)

    return NextResponse.json({
      success: true,
      data: {
        extractedItems: result.extractedItems,
        extractionStats: {
          processingTime: result.extractionResult.processingTime,
          totalWordCount: result.extractionResult.totalWordCount,
          itemsExtracted: result.extractedItems.length,
          batchId: result.extractionResult.batchId
        }
      }
    })

  } catch (error) {
    console.error('Knowledge extraction API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to extract knowledge',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

// GET /api/knowledge-base/extract - Get extraction estimates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const textDump = searchParams.get('text')

    if (!textDump) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      )
    }

    const estimatedCount = KnowledgeExtractionEngine.estimateExtractionCount(textDump)
    const wordCount = textDump.trim().split(' ').length

    return NextResponse.json({
      success: true,
      data: {
        estimatedItemCount: estimatedCount,
        wordCount,
        estimatedProcessingTime: Math.max(5, Math.min(30, wordCount / 100)) // 5-30 seconds estimate
      }
    })

  } catch (error) {
    console.error('Extraction estimate error:', error)
    
    return NextResponse.json(
      { error: 'Failed to estimate extraction' },
      { status: 500 }
    )
  }
} 