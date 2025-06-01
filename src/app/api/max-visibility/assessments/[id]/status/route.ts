// API Route: MAX Visibility Assessment Status
// GET /api/max-visibility/assessments/[id]/status

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id: assessmentId } = await params

    console.log('📊 Status check for assessment:', assessmentId)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Authentication failed for status check')
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Unauthorized'
        }, 
        { status: 401 }
      )
    }

    // Get assessment details
    const { data: assessment, error } = await supabase
      .from('max_visibility_runs')
      .select(`
        id,
        status,
        total_score,
        started_at,
        completed_at,
        computed_at,
        companies!inner(company_name, root_url)
      `)
      .eq('id', assessmentId)
      .single()

    if (error || !assessment) {
      console.log('❌ Assessment not found:', assessmentId, error?.message)
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Assessment not found'
        },
        { status: 404 }
      )
    }

    // Calculate progress based on status
    let progress = 0
    if (assessment.status === 'pending') {
      progress = 0
    } else if (assessment.status === 'running') {
      // Simulate progress based on time elapsed
      const startTime = new Date(assessment.started_at).getTime()
      const currentTime = Date.now()
      const elapsed = Math.max(0, currentTime - startTime) // Ensure non-negative
      // Assume 10 seconds total, so progress = elapsed / 10000 * 100, capped at 95%
      progress = Math.min(95, Math.max(0, Math.floor((elapsed / 10000) * 100)))
    } else if (assessment.status === 'completed') {
      progress = 100
    } else if (assessment.status === 'failed') {
      progress = 0
    }

    console.log(`📈 Assessment ${assessmentId}: status=${assessment.status}, progress=${progress}% (elapsed: ${assessment.status === 'running' ? Math.max(0, Date.now() - new Date(assessment.started_at).getTime()) + 'ms' : 'N/A'})`)

    return NextResponse.json({
      success: true,
      data: {
        status: assessment.status,
        progress,
        error: assessment.status === 'failed' ? 'Assessment failed' : undefined
      },
      error: null
    })

  } catch (error) {
    console.error('💥 Assessment status error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: 'Failed to get assessment status: ' + (error as Error).message
      },
      { status: 500 }
    )
  }
} 