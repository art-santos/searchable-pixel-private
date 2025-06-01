// API Route: MAX Visibility Trend Analysis
// GET /api/max-visibility/trends

import { NextRequest, NextResponse } from 'next/server'
import { TrendAnalyzer } from '@/lib/max-visibility/trend-analysis'
import { createClient } from '@/lib/supabase/server'

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

    // Get query parameters
    const companyId = searchParams.get('company_id')
    const days = parseInt(searchParams.get('days') || '90')
    const includePredictions = searchParams.get('include_predictions') !== 'false'
    const alertCheck = searchParams.get('alert_check') !== 'false'

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id parameter is required' },
        { status: 400 }
      )
    }

    // Verify company access
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      )
    }

    // Initialize trend analyzer
    const trendAnalyzer = new TrendAnalyzer()

    // Analyze trends
    const trendSummary = await trendAnalyzer.analyzeTrends(companyId, {
      days,
      include_predictions: includePredictions,
      alert_check: alertCheck
    })

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name
      },
      trend_summary: trendSummary,
      meta: {
        analysis_date: new Date().toISOString(),
        parameters: {
          days,
          include_predictions: includePredictions,
          alert_check: alertCheck
        }
      }
    })

  } catch (error) {
    console.error('Trend analysis error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Insufficient historical data')) {
        return NextResponse.json(
          { 
            error: 'Insufficient data for trend analysis',
            message: 'At least 2 historical assessments are required for trend analysis',
            suggestion: 'Complete more MAX assessments to unlock trend insights'
          },
          { status: 400 }
        )
      }

      if (error.message.includes('Failed to fetch historical data')) {
        return NextResponse.json(
          { 
            error: 'Database error',
            message: 'Unable to retrieve historical assessment data'
          },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze trends',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// POST endpoint for triggering trend-based alerts
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
    const { company_id, alert_thresholds } = body

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      )
    }

    // Initialize trend analyzer with custom thresholds if provided
    const trendAnalyzer = new TrendAnalyzer()
    
    // Override default thresholds if provided
    if (alert_thresholds) {
      // This would require modifying TrendAnalyzer to accept custom thresholds
      // For now, we'll use the default thresholds
    }

    // Run trend analysis with alerts enabled
    const trendSummary = await trendAnalyzer.analyzeTrends(company_id, {
      days: 90,
      include_predictions: false,
      alert_check: true
    })

    // Store alerts in database (if we had an alerts table)
    const alertsToStore = trendSummary.active_alerts
    
    // TODO: Store alerts in database
    // for (const alert of alertsToStore) {
    //   await supabase.from('trend_alerts').insert({
    //     ...alert,
    //     company_id: company_id,
    //     user_id: user.id
    //   })
    // }

    return NextResponse.json({
      success: true,
      alerts_generated: alertsToStore.length,
      alerts: alertsToStore,
      trend_health_score: trendSummary.trend_health_score
    })

  } catch (error) {
    console.error('Alert generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate alerts',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
} 