import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Verify the user has access to this workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, user_id, workspace_name')
      .eq('id', workspaceId)
      .single()
    
    if (workspaceError || !workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      )
    }
    
    if (workspace.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Fetch leads with contact information
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        workspace_id,
        company_name,
        company_domain,
        company_type,
        company_city,
        company_country,
        employee_range,
        is_ai_attributed,
        ai_source,
        created_at,
        updated_at,
        contacts (
          id,
          name,
          title,
          email,
          linkedin_url,
          location,
          title_match_score,
          email_verification_status
        ),
        user_visits (
          page_url,
          referrer,
          utm_source,
          utm_medium,
          utm_campaign,
          country,
          city,
          created_at
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(10) // Limit to 10 most recent leads

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format in the frontend
    const transformedLeads = (leads || []).map(lead => {
      const contact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts
      const userVisit = Array.isArray(lead.user_visits) ? lead.user_visits[0] : lead.user_visits

      return {
        id: lead.id,
        timestamp: userVisit?.created_at || lead.created_at,
        model: lead.ai_source || 'Unknown',
        pageVisited: userVisit?.page_url || '/',
        email: contact?.email || 'N/A',
        fullName: contact?.name || 'N/A',
        company: lead.company_name || 'N/A',
        jobTitle: contact?.title || 'N/A',
        location: contact?.location || lead.company_city || 'N/A',
        linkedinUrl: contact?.linkedin_url || '',
        confidence: contact?.title_match_score ? `${Math.round(contact.title_match_score * 100)}%` : 'N/A',
        picture_url: null, // Not available in current schema
        company_domain: lead.company_domain,
        company_city: lead.company_city,
        company_country: lead.company_country,
        ai_source: lead.ai_source,
        lead_source: userVisit?.utm_source,
        attribution_source: lead.is_ai_attributed ? lead.ai_source : 'direct'
      }
    })

    return NextResponse.json({
      success: true,
      leads: transformedLeads,
      total: transformedLeads.length,
      workspace_id: workspaceId
    })
  } catch (error) {
    console.error('Error in leads API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}