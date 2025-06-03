import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DEBUG /api/max-visibility/debug
 * Quick debug endpoint to see what data exists in the database
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔍 DEBUG: Checking MAX Visibility database state')

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // 1. Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('workspace_name, domain')
      .eq('id', user.id)
      .single()

    console.log('📋 User profile:', { profile, error: profileError })

    // 2. Check companies in database  
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, root_url')
      .limit(5)

    console.log('🏢 Companies in database:', { count: companies?.length, companies, error: companiesError })

    // 3. Check assessments
    const { data: assessments, error: assessmentsError } = await supabase
      .from('max_visibility_runs')
      .select('id, company_id, status, total_score, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('📊 Recent assessments:', { count: assessments?.length, assessments, error: assessmentsError })

    // 4. If user has domain, try to find their company
    let userCompany = null
    if (profile?.domain) {
      const domainToMatch = profile.domain
      const domainWithProtocol = `https://${profile.domain}`
      const domainWithWww = `www.${profile.domain}`
      const domainWithProtocolAndWww = `https://www.${profile.domain}`

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, company_name, root_url')
        .or(`root_url.eq.${domainToMatch},root_url.eq.${domainWithProtocol},root_url.eq.${domainWithWww},root_url.eq.${domainWithProtocolAndWww}`)
        .single()

      userCompany = { company, error: companyError }
      console.log('🔍 User company lookup:', userCompany)
    }

    // 5. If user has a company, check their assessments
    let userAssessments = null
    if (userCompany?.company?.id) {
      const { data: userAssmts, error: userAssError } = await supabase
        .from('max_visibility_runs')
        .select('id, status, total_score, created_at')
        .eq('company_id', userCompany.company.id)
        .order('created_at', { ascending: false })
        .limit(5)

      userAssessments = { assessments: userAssmts, error: userAssError }
      console.log('📈 User assessments:', userAssessments)
    }

    return NextResponse.json({
      success: true,
      debug_data: {
        user_id: user.id,
        profile: profile,
        profile_complete: !!(profile?.workspace_name && profile?.domain),
        total_companies: companies?.length || 0,
        sample_companies: companies?.slice(0, 3),
        total_assessments: assessments?.length || 0,
        recent_assessments: assessments?.slice(0, 3),
        user_company: userCompany?.company,
        user_company_error: userCompany?.error?.message,
        user_assessments: userAssessments?.assessments,
        user_assessments_count: userAssessments?.assessments?.length || 0,
        completed_assessments: userAssessments?.assessments?.filter(a => a.status === 'completed').length || 0
      }
    })

  } catch (error) {
    console.error('DEBUG API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Debug failed',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
} 