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

    // Get assessment details with progress and error information
    const { data: assessment, error } = await supabase
      .from('max_visibility_runs')
      .select(`
        id,
        status,
        total_score,
        started_at,
        completed_at,
        computed_at,
        progress_percentage,
        progress_stage,
        progress_message,
        error_message,
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

    // Use real progress from database, with fallback logic
    let progress = assessment.progress_percentage || 0
    let stage = assessment.progress_stage || 'setup'
    let message = assessment.progress_message || ''

    // Handle status-based progress calculation as fallback
    if (assessment.status === 'pending') {
      progress = Math.max(progress, 0)
      stage = stage || 'setup'
      message = message || 'Initializing scan...'
    } else if (assessment.status === 'running') {
      // Use database progress if available, otherwise calculate from time
      if (progress === 0) {
        const startTime = new Date(assessment.started_at).getTime()
        const currentTime = Date.now()
        const elapsed = Math.max(0, currentTime - startTime)
        // Estimate progress based on typical pipeline duration (2-3 minutes)
        progress = Math.min(95, Math.max(0, Math.floor((elapsed / 120000) * 100)))
      }
      stage = stage || 'questions'
      message = message || `Analyzing... ${progress}%`
    } else if (assessment.status === 'completed') {
      progress = 100
      stage = 'complete'
      message = message || 'Assessment completed!'
    } else if (assessment.status === 'failed') {
      progress = 0
      stage = 'error'
      message = assessment.error_message || 'Assessment failed'
    }

    console.log(`📈 Assessment ${assessmentId}: status=${assessment.status}, progress=${progress}%, stage=${stage}`)

    return NextResponse.json({
      success: true,
      data: {
        status: assessment.status,
        progress,
        stage,
        message,
        error: assessment.status === 'failed' ? (assessment.error_message || 'Assessment failed') : undefined,
        company: assessment.companies?.company_name
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