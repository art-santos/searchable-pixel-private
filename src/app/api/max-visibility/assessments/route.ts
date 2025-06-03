// API Route: MAX Visibility Assessments List
// GET /api/max-visibility/assessments
// POST /api/max-visibility/assessments

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MaxVisibilityPipeline } from '@/lib/max-visibility/pipeline'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Build query
    let query = supabase
      .from('max_visibility_runs')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        total_score,
        computed_at,
        companies!inner(id, company_name, root_url)
      `)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by company if specified
    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: assessments, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      assessments: assessments || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Assessments list error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve assessments',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 MAX Visibility Assessment - Starting REAL scan request')
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Parse request body
    const body = await request.json()
    const assessmentType = body.type || 'lite'
    console.log('📝 Scan type requested:', assessmentType)

    // Check for required API keys
    if (!process.env.PERPLEXITY_API_KEY) {
      console.log('❌ Perplexity API key not configured')
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Perplexity API key not configured. Please add your Perplexity API key to run visibility scans.'
        },
        { status: 400 }
      )
    }

    // Get user's profile to extract company information
    console.log('🔍 Fetching user profile for company information...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('workspace_name, domain')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.workspace_name || !profile?.domain) {
      console.log('❌ Profile incomplete:', { profileError, profile })
      return NextResponse.json(
        { 
          error: 'Profile incomplete',
          message: 'Please complete your workspace name and domain in settings before running a scan'
        },
        { status: 400 }
      )
    }

    console.log('✅ Profile found:', { 
      workspace: profile.workspace_name, 
      domain: profile.domain 
    })

    // Check or create company record
    console.log('🏢 Looking for existing company record...')
    let { data: company, error: companyFindError } = await supabase
      .from('companies')
      .select('id, company_name, root_url')
      .eq('root_url', profile.domain)
      .single()

    if (companyFindError && companyFindError.code === 'PGRST116') {
      // Company doesn't exist, create it
      console.log('🆕 Company not found, creating new company record...')
      const { data: newCompany, error: companyCreateError } = await supabase
        .from('companies')
        .insert([
          {
            company_name: profile.workspace_name,
            root_url: profile.domain,
            submitted_by: user.id
          }
        ])
        .select()
        .single()

      if (companyCreateError) {
        // If it's a duplicate key error, try to find the existing company again with broader search
        if (companyCreateError.code === '23505') {
          console.log('🔄 Duplicate detected, searching for existing company with broader criteria...')
          
          // Try multiple search strategies
          const searchStrategies = [
            // Exact domain match
            { root_url: profile.domain },
            // Domain with www prefix
            { root_url: `www.${profile.domain}` },
            // Domain without www
            { root_url: profile.domain.replace(/^www\./, '') },
            // Company name match
            { company_name: profile.workspace_name }
          ]
          
          let existingCompany = null
          let foundStrategy = null
          
          for (const strategy of searchStrategies) {
            console.log(`🔍 Trying search strategy:`, strategy)
            const { data: foundCompany, error: searchError } = await supabase
              .from('companies')
              .select('id, company_name, root_url')
              .match(strategy)
              .limit(1)
              .single()
            
            if (!searchError && foundCompany) {
              existingCompany = foundCompany
              foundStrategy = strategy
              console.log(`✅ Found company using strategy:`, strategy, 'Company:', foundCompany.id)
              break
            }
          }
          
          if (!existingCompany) {
            console.log('❌ Could not find existing company despite duplicate constraint')
            return NextResponse.json(
              { 
                success: false,
                data: null,
                error: 'Company creation failed due to duplicate constraint, but existing company could not be found. Please contact support.'
              },
              { status: 500 }
            )
          }
          
          console.log('✅ Found existing company after duplicate:', existingCompany.id)
          company = existingCompany
        } else {
          console.log('❌ Failed to create company:', companyCreateError)
          throw companyCreateError
        }
      } else {
        console.log('✅ New company created:', newCompany?.id)
        company = newCompany
      }
    } else if (companyFindError) {
      console.log('❌ Company lookup error:', companyFindError)
      throw companyFindError
    } else {
      console.log('✅ Existing company found:', company?.id)
    }

    // Ensure company is properly resolved
    if (!company) {
      console.log('❌ Company resolution failed')
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Failed to resolve company information'
        },
        { status: 500 }
      )
    }

    // Type assertion to ensure TypeScript knows company is not null
    const resolvedCompany = company as NonNullable<typeof company>

    // Initialize the MAX visibility pipeline
    console.log('🔧 Initializing MAX visibility pipeline...')
    
    // Check for Perplexity API key first
    try {
      const pipeline = new MaxVisibilityPipeline()
      
      console.log('✅ Pipeline initialized successfully')

      // Prepare assessment request
      const assessmentRequest = {
        company: {
          id: resolvedCompany.id,
          name: resolvedCompany.company_name,
          domain: resolvedCompany.root_url
        },
        assessment_type: assessmentType,
        question_count: assessmentType === 'max' ? 50 : 20, // Proper question counts
        question_types: [
          'direct_conversational',
          'indirect_conversational', 
          'comparison_query',
          'recommendation_request',
          'explanatory_query'
        ] as any[],
        include_competitor_analysis: assessmentType === 'max'
      }

      console.log('📊 Starting REAL assessment with pipeline...')

      // Create a UI tracking record first
      console.log('📝 Creating UI tracking record...')
      const { data: assessment, error: assessmentError } = await supabase
        .from('max_visibility_runs')
        .insert([
          {
            company_id: resolvedCompany.id,
            triggered_by: user.id,
            status: 'running',
            started_at: new Date().toISOString(),
            total_score: null,
            computed_at: null
          }
        ])
        .select()
        .single()

      if (assessmentError) {
        console.log('❌ Failed to create tracking record:', assessmentError)
        throw assessmentError
      }

      console.log('✅ UI tracking record created:', assessment.id)

      // Run the assessment in the background
      setImmediate(async () => {
        try {
          console.log('🎯 Running real MAX visibility assessment...')
          const result = await pipeline.runAssessment(assessmentRequest, (progress) => {
            console.log(`📈 Pipeline progress: ${progress.stage} - ${progress.completed}% - ${progress.message}`)
          }, assessment.id)
          
          console.log('🎉 Assessment completed successfully!', {
            score: result.visibility_scores.overall_score,
            questions: result.question_analyses.length,
            mentions: result.question_analyses.filter(q => q.mention_analysis.mention_detected).length
          })
          
          console.log('✅ Assessment record already updated by pipeline')
          
        } catch (error) {
          console.error('💥 Real assessment failed:', error)
          
          // Update assessment record to failed status
          try {
            await supabase
              .from('max_visibility_runs')
              .update({ 
                status: 'failed',
                error_message: (error as Error).message
              })
              .eq('id', assessment.id)
          } catch (updateError) {
            console.error('Failed to update assessment status to failed:', updateError)
          }
        }
      })

      console.log('🚀 Real assessment started successfully, running in background')

      return NextResponse.json({
        success: true,
        data: {
          assessment_id: assessment.id
        },
        error: null
      })
      
    } catch (pipelineError) {
      console.error('❌ Pipeline initialization failed:', pipelineError)
      
      // Check if it's an API key related error
      const errorMessage = (pipelineError as Error).message
      if (errorMessage.toLowerCase().includes('api key') || 
          errorMessage.toLowerCase().includes('perplexity') ||
          errorMessage.toLowerCase().includes('unauthorized')) {
        return NextResponse.json(
          { 
            success: false,
            data: null,
            error: 'Perplexity API key is missing or invalid. Please configure your Perplexity API key to run visibility scans. Check your environment variables.'
          },
          { status: 400 }
        )
      }
      
      throw pipelineError
    }

  } catch (error) {
    console.error('💥 Assessment trigger error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: 'Failed to start assessment: ' + (error as Error).message
      },
      { status: 500 }
    )
  }
} 