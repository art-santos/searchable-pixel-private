// API Route: Unified MAX Visibility Data
// GET /api/max-visibility/data

import { NextRequest, NextResponse } from 'next/server'
import { UnifiedDataAPI, DataRequest } from '@/lib/max-visibility/unified-data-api'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 MAX Visibility Data - Fetching visibility data')
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Authentication failed for data request')
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Unauthorized'
        }, 
        { status: 401 }
      )
    }

    console.log('✅ User authenticated for data request:', user.id)

    // Get user's profile to extract company information
    console.log('🔍 Fetching user profile for company resolution...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('workspace_name, domain')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.workspace_name || !profile?.domain) {
      console.log('❌ Profile incomplete for data request:', { profileError, profile })
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Profile incomplete. Please complete your workspace name and domain in settings.'
        },
        { status: 400 }
      )
    }

    console.log('✅ Profile found:', { domain: profile.domain })

    // Find or resolve company
    console.log('🏢 Looking up company for domain:', profile.domain)
    let { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name, root_url')
      .eq('root_url', profile.domain)
      .single()

    if (companyError && companyError.code === 'PGRST116') {
      // No company found, but we can still return empty data
      console.log('ℹ️ No company found for domain, returning empty data')
      return NextResponse.json({
        success: true,
        data: null,
        error: null
      })
    } else if (companyError) {
      console.log('❌ Company lookup error:', companyError)
      throw companyError
    }

    console.log('✅ Company found:', company.id)

    // Get the most recent completed assessment for this company
    console.log('🔍 Looking for completed assessments...')
    const { data: assessment, error: assessmentError } = await supabase
      .from('max_visibility_runs')
      .select(`
        id,
        status,
        total_score,
        mention_rate,
        sentiment_score,
        citation_score,
        competitive_score,
        consistency_score,
        started_at,
        completed_at,
        computed_at
      `)
      .eq('company_id', company.id)
      .eq('status', 'completed')
      .order('computed_at', { ascending: false })
      .limit(1)
      .single()

    if (assessmentError && assessmentError.code === 'PGRST116') {
      // No completed assessments found
      console.log('ℹ️ No completed assessments found, returning empty data')
      return NextResponse.json({
        success: true,
        data: null,
        error: null
      })
    } else if (assessmentError) {
      console.log('❌ Assessment query error:', assessmentError)
      throw assessmentError
    }

    if (!assessment || !assessment.total_score) {
      console.log('ℹ️ Assessment found but no score available')
      return NextResponse.json({
        success: true,
        data: null,
        error: null
      })
    }

    console.log('✅ Assessment data found:', {
      id: assessment.id,
      score: assessment.total_score,
      completed: assessment.computed_at
    })

    // Fetch detailed data from related tables
    console.log('📊 Fetching detailed visibility data...')
    
    // Get questions and responses
    const { data: questions, error: questionsError } = await supabase
      .from('max_visibility_questions')
      .select(`
        id,
        question,
        question_type,
        position,
        max_visibility_responses!inner(
          id,
          mention_detected,
          mention_position,
          mention_sentiment,
          response_quality_score,
          citation_count
        )
      `)
      .eq('run_id', assessment.id)
      .order('position', { ascending: true })

    if (questionsError) {
      console.error('❌ Failed to fetch questions:', questionsError)
    }

    // Get citations
    const { data: citations, error: citationsError } = await supabase
      .from('max_visibility_citations')
      .select(`
        id,
        citation_url,
        citation_domain,
        bucket,
        influence_score,
        response_id
      `)
      .in('response_id', questions?.flatMap(q => q.max_visibility_responses.map((r: any) => r.id)) || [])

    if (citationsError) {
      console.error('❌ Failed to fetch citations:', citationsError)
    }

    // Get competitors
    const { data: competitors, error: competitorsError } = await supabase
      .from('max_visibility_competitors')
      .select('*')
      .eq('run_id', assessment.id)
      .order('rank_position', { ascending: true })

    if (competitorsError) {
      console.error('❌ Failed to fetch competitors:', competitorsError)
    }

    // Get topics
    const { data: topics, error: topicsError } = await supabase
      .from('max_visibility_topics')
      .select('*')
      .eq('run_id', assessment.id)
      .order('rank_position', { ascending: true })

    if (topicsError) {
      console.error('❌ Failed to fetch topics:', topicsError)
    }

    // Get metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('max_visibility_metrics')
      .select('*')
      .eq('run_id', assessment.id)

    if (metricsError) {
      console.error('❌ Failed to fetch metrics:', metricsError)
    }

    // Calculate real statistics from the data
    const totalQuestions = questions?.length || 0
    const mentionedQuestions = questions?.filter(q => 
      q.max_visibility_responses.some((r: any) => r.mention_detected)
    ).length || 0
    
    const allCitations = citations || []
    const citationsByBucket = allCitations.reduce((acc: any, c: any) => {
      acc[c.bucket] = (acc[c.bucket] || 0) + 1
      return acc
    }, {})

    // Transform the data to match the expected VisibilityData interface
    console.log('🔄 Transforming assessment data to visibility format...')
    const visibilityData = {
      score: {
        overall_score: assessment.total_score || 0,
        lite_score: Math.round(assessment.total_score * 0.8), // Approximation
        max_score: assessment.total_score,
        trend_change: 0, // Would need historical data
        trend_period: '30 days',
        mention_rate: assessment.mention_rate || 0,
        sentiment_score: assessment.sentiment_score || 0,
        competitive_score: assessment.competitive_score || 0,
        consistency_score: assessment.consistency_score || 0
      },
      citations: {
        direct_count: citationsByBucket.owned || 0,
        indirect_count: citationsByBucket.operated || 0,
        total_count: allCitations.length,
        earned_count: citationsByBucket.earned || 0,
        competitor_count: citationsByBucket.competitor || 0,
        sentiment_score: assessment.sentiment_score || 0,
        coverage_rate: mentionedQuestions / Math.max(1, totalQuestions),
        recent_mentions: questions?.filter(q => 
          q.max_visibility_responses.some((r: any) => r.mention_detected)
        ).slice(0, 5).map((q: any) => ({
          question: q.question,
          type: q.question_type,
          position: q.max_visibility_responses[0]?.mention_position || 'none',
          sentiment: q.max_visibility_responses[0]?.mention_sentiment || 'neutral'
        })) || []
      },
      competitive: {
        current_rank: competitors?.[0]?.rank_position || 1,
        total_competitors: competitors?.length || 0,
        competitors: competitors?.map((c: any) => ({
          name: c.competitor_name,
          domain: c.competitor_domain,
          visibility_score: c.ai_visibility_score || 0,
          mention_rate: c.mention_rate || 0,
          rank: c.rank_position
        })) || [],
        percentile: 85, // Would need more data to calculate
        improvement_potential: 15 // Would need analysis
      },
      topics: topics?.map((t: any) => ({
        name: t.topic_name,
        category: t.topic_category,
        mention_count: t.mention_count,
        mention_percentage: t.mention_percentage,
        sentiment_score: t.sentiment_score || 0,
        rank: t.rank_position
      })) || [],
      questions_analyzed: totalQuestions,
      mentions_found: mentionedQuestions,
      last_updated: assessment.computed_at || assessment.completed_at,
      scan_type: 'max' as 'lite' | 'max',
      // Additional data for UI
      assessment_id: assessment.id,
      processing_time: assessment.completed_at && assessment.started_at 
        ? new Date(assessment.completed_at).getTime() - new Date(assessment.started_at).getTime()
        : 0
    }

    console.log('📈 Returning visibility data with score:', visibilityData.score.overall_score)

    return NextResponse.json({
      success: true,
      data: visibilityData,
      error: null
    })

  } catch (error) {
    console.error('💥 Visibility data API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: 'Failed to retrieve visibility data: ' + (error as Error).message
      },
      { status: 500 }
    )
  }
}

// POST endpoint for requesting specific data combinations
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

    const body = await request.json()
    const dataRequest: DataRequest = {
      company_id: body.company_id,
      user_id: user.id,
      request_type: body.request_type || 'visibility_data',
      preferences: {
        include_historical: body.include_historical ?? true,
        include_predictions: body.include_predictions ?? true,
        include_competitors: body.include_competitors ?? true,
        max_cache_age_minutes: body.max_cache_age_minutes || 60,
        fallback_to_lite: body.fallback_to_lite ?? true,
        lite_only: body.lite_only ?? false,
        ...body.preferences
      },
      filters: body.filters
    }

    if (!dataRequest.company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      )
    }

    // Verify company access
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, domain')
      .eq('id', dataRequest.company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      )
    }

    // Initialize unified data API
    const unifiedAPI = new UnifiedDataAPI()
    
    // Get data
    const response = await unifiedAPI.getData(dataRequest)

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain
      },
      request_processed: dataRequest,
      ...response
    })

  } catch (error) {
    console.error('Unified data API POST error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve data',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// Options endpoint for API discovery
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    endpoints: {
      'GET /api/max-visibility/data': {
        description: 'Retrieve unified visibility data',
        parameters: {
          required: ['company_id'],
          optional: [
            'request_type',
            'include_historical',
            'include_predictions', 
            'include_competitors',
            'max_cache_age_minutes',
            'fallback_to_lite',
            'lite_only',
            'start_date',
            'end_date',
            'metrics'
          ]
        },
        request_types: [
          'visibility_data',
          'competitive_analysis',
          'trends', 
          'recommendations',
          'full_suite'
        ]
      },
      'POST /api/max-visibility/data': {
        description: 'Request specific data combinations with detailed preferences',
        body_schema: {
          company_id: 'string (required)',
          request_type: 'string (optional)',
          include_historical: 'boolean (optional)',
          include_predictions: 'boolean (optional)',
          include_competitors: 'boolean (optional)',
          max_cache_age_minutes: 'number (optional)',
          fallback_to_lite: 'boolean (optional)',
          lite_only: 'boolean (optional)',
          preferences: 'object (optional)',
          filters: {
            date_range: { start_date: 'string', end_date: 'string' },
            metrics: 'string[]',
            competitors: 'string[]'
          }
        }
      }
    },
    features: [
      'Intelligent MAX/Lite data fallback',
      'Comprehensive caching system',
      'Usage tracking and cost estimation',
      'Upgrade insights for Lite users',
      'Real-time data freshness monitoring',
      'Multi-source data combination'
    ],
    data_sources: [
      'MAX Assessment System',
      'Lite AEO System (Legacy)',
      'Competitive Analysis Engine',
      'Trend Analysis Engine',
      'Recommendation Engine',
      'API Cache Layer'
    ]
  })
} 