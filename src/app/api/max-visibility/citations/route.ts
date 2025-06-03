import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/max-visibility/citations
 * Returns citation data from completed MAX Visibility assessments
 */
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

    // Get user's profile to find company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('domain')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.domain) {
      return NextResponse.json({
        success: true,
        data: {
          citations: [],
          total: 0,
          filters: { engines: [], match_types: [] }
        }
      })
    }

    // Get the user's company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('root_url', profile.domain)
      .single()

    if (companyError || !company) {
      return NextResponse.json({
        success: true,
        data: {
          citations: [],
          total: 0,
          filters: { engines: [], match_types: [] }
        }
      })
    }

    // Get citations from latest completed assessment
    const { data: latestAssessment, error: assessmentError } = await supabase
      .from('max_visibility_runs')
      .select('id')
      .eq('company_id', company.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (assessmentError || !latestAssessment) {
      return NextResponse.json({
        success: true,
        data: {
          citations: [],
          total: 0,
          filters: { engines: ['perplexity'], match_types: ['direct', 'indirect'] }
        }
      })
    }

    // Get citations (simplified for now - would need to join through responses)
    const citationsData = [] // Would implement full citation retrieval here

    return NextResponse.json({
      success: true,
      data: {
        citations: citationsData,
        total: 0,
        filters: {
          engines: ['perplexity'],
          match_types: ['direct', 'indirect']
        }
      }
    })

  } catch (error) {
    console.error('Citations API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve citations',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
} 