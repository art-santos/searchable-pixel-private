// API Route: MAX Visibility Recommendations
// POST /api/max-visibility/recommendations

import { NextRequest, NextResponse } from 'next/server'
import { RecommendationEngine } from '@/lib/max-visibility/recommendation-engine'
import { TrendAnalyzer } from '@/lib/max-visibility/trend-analysis'
import { CompetitiveAnalyzer } from '@/lib/max-visibility/competitive-analysis'
import { EnhancedScoringEngine } from '@/lib/max-visibility/scoring'
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

    const body = await request.json()
    const { 
      company_id, 
      assessment_id, 
      include_trend_analysis = true,
      include_competitive_analysis = true,
      include_enhanced_scoring = true,
      user_preferences 
    } = body

    if (!company_id || !assessment_id) {
      return NextResponse.json(
        { error: 'company_id and assessment_id are required' },
        { status: 400 }
      )
    }

    // Get assessment data
    const { data: assessment, error: assessmentError } = await supabase
      .from('max_assessments')
      .select(`
        *,
        companies!inner(id, name, domain, description, industry)
      `)
      .eq('id', assessment_id)
      .eq('company_id', company_id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 404 }
      )
    }

    // Get question analyses
    const { data: analyses, error: analysesError } = await supabase
      .from('max_question_analyses')
      .select('*')
      .eq('assessment_id', assessment_id)
      .order('processed_at')

    if (analysesError) {
      throw analysesError
    }

    // Build assessment result object
    const assessmentResult = {
      assessment_id: assessment.id,
      company: assessment.companies,
      visibility_scores: assessment.visibility_scores,
      question_analyses: analyses || [],
      completed_at: assessment.completed_at,
      processing_time_ms: assessment.processing_time_ms || 0
    }

    // Initialize engines
    const recommendationEngine = new RecommendationEngine()
    let trendData = undefined
    let competitiveData = undefined
    let enhancedScoring = undefined

    // Get trend analysis if requested
    if (include_trend_analysis) {
      try {
        const trendAnalyzer = new TrendAnalyzer()
        trendData = await trendAnalyzer.analyzeTrends(company_id, {
          days: 90,
          include_predictions: true,
          alert_check: false
        })
      } catch (error) {
        console.warn('Trend analysis failed:', error)
        // Continue without trend data
      }
    }

    // Get competitive analysis if requested
    if (include_competitive_analysis) {
      try {
        const competitiveAnalyzer = new CompetitiveAnalyzer()
        competitiveData = await competitiveAnalyzer.analyzeCompetitiveLandscape(
          {
            id: assessment.companies.id,
            name: assessment.companies.name,
            domain: assessment.companies.domain,
            industry: assessment.companies.industry,
            description: assessment.companies.description
          },
          analyses,
          {
            includeIndustryCompetitors: true,
            maxCompetitors: 5,
            generateNewQuestions: false
          }
        )
      } catch (error) {
        console.warn('Competitive analysis failed:', error)
        // Continue without competitive data
      }
    }

    // Get enhanced scoring if requested
    if (include_enhanced_scoring) {
      try {
        const scoringEngine = new EnhancedScoringEngine()
        enhancedScoring = await scoringEngine.calculateEnhancedScore(
          analyses || [],
          company_id,
          undefined, // Use default weights
          assessment.companies.industry
        )
      } catch (error) {
        console.warn('Enhanced scoring failed:', error)
        // Continue without enhanced scoring
      }
    }

    // Generate recommendations
    const recommendationSuite = await recommendationEngine.generateRecommendations({
      company_id,
      assessment_data: assessmentResult,
      trend_data: trendData,
      competitive_data: competitiveData,
      enhanced_scoring: enhancedScoring,
      user_preferences
    })

    return NextResponse.json({
      success: true,
      company: {
        id: assessment.companies.id,
        name: assessment.companies.name,
        domain: assessment.companies.domain
      },
      assessment: {
        id: assessment.id,
        completed_at: assessment.completed_at,
        overall_score: assessment.visibility_scores?.overall_score
      },
      recommendation_suite: recommendationSuite,
      analysis_components: {
        trend_analysis_included: !!trendData,
        competitive_analysis_included: !!competitiveData,
        enhanced_scoring_included: !!enhancedScoring
      },
      meta: {
        generated_at: new Date().toISOString(),
        recommendations_count: recommendationSuite.recommendations.length,
        content_gaps_identified: recommendationSuite.content_gaps.length,
        optimization_opportunities: recommendationSuite.optimization_opportunities.length
      }
    })

  } catch (error) {
    console.error('Recommendation generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate recommendations',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving existing recommendations
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const companyId = searchParams.get('company_id')
    const assessmentId = searchParams.get('assessment_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id parameter is required' },
        { status: 400 }
      )
    }

    // This would query a recommendations table if we had one
    // For now, return guidance on generating new recommendations
    
    return NextResponse.json({
      success: true,
      message: 'Recommendations are generated on-demand',
      guidance: {
        endpoint: '/api/max-visibility/recommendations',
        method: 'POST',
        required_params: ['company_id', 'assessment_id'],
        optional_params: [
          'include_trend_analysis',
          'include_competitive_analysis', 
          'include_enhanced_scoring',
          'user_preferences'
        ]
      },
      recent_assessments: {
        note: 'Use these assessment IDs to generate recommendations',
        // This would include actual recent assessments
        example_url: `/api/max-visibility/recommendations?company_id=${companyId}&assessment_id=<assessment_id>`
      }
    })

  } catch (error) {
    console.error('Recommendations retrieval error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve recommendations',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
} 