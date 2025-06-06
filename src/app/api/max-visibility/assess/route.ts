// API Route: MAX Visibility Assessment
// POST /api/max-visibility/assess

import { NextRequest, NextResponse } from 'next/server'
import { MaxVisibilityPipeline } from '@/lib/max-visibility/pipeline'
import { createClient } from '@/lib/supabase/server'

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

    // Parse request body (simplified format)
    const body = await request.json()
    const assessmentType = body.type || body.assessment_type || 'max'
    const workspaceId = body.workspaceId
    
    console.log('🚀 Starting assessment with type:', assessmentType, 'for user:', user.id, 'workspace:', workspaceId)

    if (!workspaceId) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Workspace ID is required' 
        },
        { status: 400 }
      )
    }

    // Get workspace to verify access and get domain
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, workspace_name, domain')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      console.error('❌ Workspace lookup failed:', workspaceError)
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Workspace not found or access denied' 
        },
        { status: 404 }
      )
    }

    if (!workspace.domain) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Workspace domain not configured' 
        },
        { status: 400 }
      )
    }

    console.log('✅ Found workspace:', workspace.workspace_name, workspace.domain)

    // Find or create company based on domain
    let company = null
    let { data: existingCompany, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name, root_url')
      .or(`root_url.eq.${workspace.domain},root_url.eq.https://${workspace.domain},root_url.eq.http://${workspace.domain}`)
      .single()

    if (companyError || !existingCompany) {
      console.log('🏢 Company not found, creating new one...')
      // Create company if it doesn't exist
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          company_name: workspace.workspace_name || 'Unknown Company',
          root_url: workspace.domain.startsWith('http') ? workspace.domain : `https://${workspace.domain}`,
          created_by: user.id
        })
        .select()
        .single()

      if (createError || !newCompany) {
        console.error('❌ Failed to create company:', createError)
        return NextResponse.json(
          { 
            success: false,
            data: null,
            error: 'Failed to create company record' 
          },
          { status: 500 }
        )
      }
      
      company = newCompany
      console.log('✅ Created new company:', company.id, company.company_name)
    } else {
      company = existingCompany
      console.log('✅ Found existing company:', company.id, company.company_name)
    }

    // Prepare assessment request
    const assessmentRequest = {
      type: assessmentType,
      triggered_by: user.id,
      workspace_id: workspaceId,
      company: {
        id: company.id,
        name: company.company_name,
        domain: workspace.domain
      }
    }

    console.log('📊 Starting MAX visibility assessment for workspace...')

    // Initialize pipeline
    const pipeline = new MaxVisibilityPipeline()

    // Create assessment record first to get ID
    const { data: assessmentRecord, error: createError } = await supabase
      .from('max_visibility_runs')
      .insert({
        company_id: company.id,
        workspace_id: workspaceId,
        status: 'pending',
        total_score: 0,
        mention_rate: 0,
        progress_percentage: 0,
        progress_stage: 'setup',
        progress_message: 'Assessment starting...',
        triggered_by: user.id,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (createError || !assessmentRecord) {
      console.error('❌ Failed to create assessment record:', createError)
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Failed to create assessment record',
          message: createError?.message || 'Unknown error'
        },
        { status: 500 }
      )
    }

    const assessmentId = assessmentRecord.id
    console.log('✅ Assessment record created with ID:', assessmentId)

    // Start assessment processing in background (truly asynchronous)
    setImmediate(async () => {
      try {
        console.log('🎯 Running assessment in background thread...')
        await pipeline.runAssessment(assessmentRequest, undefined, assessmentId)
        console.log('🎉 Background assessment completed successfully!')
      } catch (error) {
        console.error('❌ Background assessment failed:', error)
        // Error handling is done within the pipeline
      }
    })

    // Return immediately so UI can start polling for progress
    return NextResponse.json({
      success: true,
      data: {
        assessment_id: assessmentId
      }
    })

  } catch (error) {
    console.error('❌ MAX Visibility assessment error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        data: null,
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