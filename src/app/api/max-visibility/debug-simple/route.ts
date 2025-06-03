import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * SIMPLE DEBUG /api/max-visibility/debug-simple
 * Quick test to see basic data without cumulative logic
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔍 SIMPLE DEBUG: Basic data check')

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('workspace_name, domain')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.domain) {
      return NextResponse.json({
        success: false,
        message: 'Profile setup incomplete - missing domain'
      })
    }

    // Find company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name, root_url')
      .eq('root_url', `https://${profile.domain}`)
      .single()

    if (!company) {
      return NextResponse.json({
        success: false,
        message: 'Company not found in database'
      })
    }

    // Get ANY completed assessment (old logic)
    const { data: assessments, error: assessmentError } = await supabase
      .from('max_visibility_runs')
      .select('id, total_score, mention_rate, created_at')
      .eq('company_id', company.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get competitors for latest assessment that has them
    let competitorsData = []
    for (const assessment of assessments || []) {
      const { data: competitors } = await supabase
        .from('max_visibility_competitors')
        .select('competitor_name, competitor_domain, ai_visibility_score')
        .eq('run_id', assessment.id)
        .limit(5)
      
      if (competitors && competitors.length > 0) {
        competitorsData = competitors
        break
      }
    }

    return NextResponse.json({
      success: true,
      debug_data: {
        user_id: user.id,
        profile_domain: profile.domain,
        company_found: company.company_name,
        total_assessments: assessments?.length || 0,
        latest_assessment_id: assessments?.[0]?.id,
        competitors_found: competitorsData.length,
        sample_competitors: competitorsData.slice(0, 3).map(c => c.competitor_name)
      }
    })

  } catch (error) {
    console.error('Simple debug error:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
} 