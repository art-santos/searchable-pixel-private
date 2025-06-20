import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the user with better error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (has @split.dev email OR is_admin=true in profile)
    const hasAdminEmail = user.email?.endsWith('@split.dev')
    
    if (!hasAdminEmail) {
      // Check if user has admin role in profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (profileError || !profile?.is_admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    // Verify workspace access
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Fetch leads with contact and company data
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        created_at,
        confidence_score,
        lead_source,
        exa_webset_id,
        exa_raw,
        contacts!inner (
          id,
          name,
          title,
          email,
          linkedin_url,
          picture_url,
          headline,
          summary,
          current_company,
          current_position,
          tenure_months,
          skills,
          education,
          social_handles,
          thought_leadership_score,
          interests,
          volunteer_work,
          connection_count,
          last_activity_date,
          exa_enrichment
        ),
        user_visits!inner (
          id,
          page_url,
          ip_address,
          user_agent,
          session_duration,
          pages_viewed,
          attribution_source,
          companies!inner (
            id,
            name,
            domain,
            city,
            country
          )
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // Fetch related media content and work experience for each contact
    const contactIds = leads?.map(lead => {
      const contact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts;
      return contact?.id;
    }).filter(Boolean) || [];
    
    const [mediaData, experienceData] = await Promise.all([
      contactIds.length > 0 ? supabase
        .from('contact_media')
        .select('*')
        .in('contact_id', contactIds)
        .order('published_date', { ascending: false })
        .limit(3) : { data: [] },
      contactIds.length > 0 ? supabase
        .from('contact_experiences')
        .select('*')
        .in('contact_id', contactIds)
        .order('is_current', { ascending: false })
        .limit(5) : { data: [] }
    ]);

    // Transform the data to match our interface
    const transformedLeads = (leads || []).map(lead => {
      const contact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts;
      const visit = Array.isArray(lead.user_visits) ? lead.user_visits[0] : lead.user_visits;
      const company = visit && Array.isArray(visit.companies) ? visit.companies : visit?.companies;
      
      // Get media content for this contact
      const mediaContent = mediaData.data?.filter(media => media.contact_id === contact?.id) || [];
      
      // Get work experience for this contact
      const workExperience = experienceData.data?.filter(exp => exp.contact_id === contact?.id) || [];

      return {
        id: lead.id,
        created_at: lead.created_at,
        company_name: (Array.isArray(company) ? company[0]?.name : company?.name) || 'Unknown Company',
        company_domain: (Array.isArray(company) ? company[0]?.domain : company?.domain) || '',
        company_city: (Array.isArray(company) ? company[0]?.city : company?.city) || '',
        company_country: (Array.isArray(company) ? company[0]?.country : company?.country) || '',
        contact_name: contact?.name || 'Unknown Contact',
        contact_title: contact?.title || '',
        contact_email: contact?.email || '',
        contact_linkedin_url: contact?.linkedin_url || '',
        confidence_score: lead.confidence_score || 0,
        picture_url: contact?.picture_url,
        headline: contact?.headline,
        summary: contact?.summary,
        current_company: contact?.current_company,
        current_role: contact?.current_position,
        tenure_months: contact?.tenure_months,
        skills: contact?.skills || [],
        education: contact?.education || [],
        social_handles: contact?.social_handles || {},
        thought_leadership_score: contact?.thought_leadership_score,
        interests: contact?.interests || [],
        volunteer_work: contact?.volunteer_work || [],
        connection_count: contact?.connection_count,
        last_activity_date: contact?.last_activity_date,
        enrichment_data: contact?.exa_enrichment,
        lead_source: lead.lead_source || 'legacy',
        attribution_source: visit?.attribution_source || 'direct',
        page_visited: visit?.page_url || '',
        ip_address: visit?.ip_address || '',
        user_agent: visit?.user_agent,
        session_duration: visit?.session_duration,
        pages_viewed: visit?.pages_viewed,
        exa_webset_id: lead.exa_webset_id,
        media_content: mediaContent.map(media => ({
          type: media.media_type,
          title: media.title,
          url: media.url,
          description: media.description,
          published_date: media.published_date,
          platform: media.platform
        })),
        work_experience: workExperience.map(exp => ({
          company: exp.company_name,
          role: exp.role_title,
          start_date: exp.start_date,
          end_date: exp.end_date,
          is_current: exp.is_current,
          description: exp.description
        }))
      };
    });

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLeads = transformedLeads.filter(lead => 
      new Date(lead.created_at) >= today
    );

    const highConfidenceLeads = transformedLeads.filter(lead => 
      lead.confidence_score >= 0.8
    );

    const avgConfidence = transformedLeads.length > 0 
      ? transformedLeads.reduce((sum, lead) => sum + lead.confidence_score, 0) / transformedLeads.length
      : 0;

    const stats = {
      total: transformedLeads.length,
      today: todayLeads.length,
      highConfidence: highConfidenceLeads.length,
      avgConfidence: avgConfidence
    };

    return NextResponse.json({
      leads: transformedLeads,
      stats
    });

  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 