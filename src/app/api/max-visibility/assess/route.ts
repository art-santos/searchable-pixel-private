// API Route: MAX Visibility Assessment
// POST /api/max-visibility/assess

import { NextRequest, NextResponse } from 'next/server'
import { MaxVisibilityPipeline } from '@/lib/max-visibility/pipeline'
import { createClient } from '@/lib/supabase/server'
import { MaxAssessmentRequest } from '@/types/max-visibility'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json() as MaxAssessmentRequest
    
    // Validate required fields
    if (!body.company?.name || !body.company?.domain) {
      return NextResponse.json(
        { error: 'Company name and domain are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, domain')
      .eq('id', body.company.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 403 }
      )
    }

    // Initialize pipeline
    const pipeline = new MaxVisibilityPipeline()

    // Test connectivity before starting
    const connectivityTest = await pipeline.testConnectivity()
    if (!connectivityTest.success) {
      return NextResponse.json(
        { 
          error: 'Service connectivity issues',
          details: connectivityTest.errors
        },
        { status: 503 }
      )
    }

    // Start assessment (run in background for long-running process)
    const assessmentPromise = pipeline.runAssessment(body)

    // For now, return assessment started response
    // In production, you might want to use a job queue system
    const result = await assessmentPromise

    return NextResponse.json({
      success: true,
      assessment_id: result.assessment_id,
      result: result
    })

  } catch (error) {
    console.error('MAX Visibility assessment error:', error)
    
    return NextResponse.json(
      { 
        error: 'Assessment failed',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving assessment status
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('id')

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Get assessment details
    const { data: assessment, error } = await supabase
      .from('max_assessments')
      .select(`
        id,
        status,
        assessment_type,
        visibility_scores,
        started_at,
        completed_at,
        companies!inner(name, domain)
      `)
      .eq('id', assessmentId)
      .single()

    if (error || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      assessment: assessment
    })

  } catch (error) {
    console.error('Assessment status error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get assessment status',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
} 