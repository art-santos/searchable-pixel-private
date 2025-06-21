import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Parse enrichment data from different formats
function parseEnrichmentData(exaEnrichment: any) {
  if (!exaEnrichment) return null;
  
  // Handle new format with enrichments array
  if (exaEnrichment.enrichments && Array.isArray(exaEnrichment.enrichments)) {
    const parsed: any = {};
    
    exaEnrichment.enrichments.forEach((item: any, idx: number) => {
      if (!item.result || !item.result[0]) return;
      
      const resultText = item.result[0];
      
      // Map by index (based on the order in websets client)
      switch(idx) {
        case 0: // LinkedIn URL
          parsed.linkedin_url = resultText;
          break;
        case 1: // Current focus areas
          parsed.focus_areas = resultText;
          break;
        case 2: // Work history
          parsed.work_history = resultText;
          break;
        case 3: // Education
          parsed.education_history = resultText;
          break;
        case 4: // Current title
          parsed.current_title = resultText;
          break;
        case 5: // Headline & Summary
          parsed.headline_summary = resultText;
          break;
        case 6: // LinkedIn posts
          parsed.linkedin_posts = resultText;
          break;
        case 7: // Media mentions
          parsed.media_mentions = resultText;
          break;
        case 8: // Press quotes
          parsed.press_quotes = resultText;
          break;
        case 9: // Speaking engagements
          parsed.speaking_engagements = resultText;
          break;
        case 10: // Key works
          parsed.key_works = resultText;
          break;
      }
    });
    
    return parsed;
  }
  
  // Handle legacy format or direct enrichment object
  return exaEnrichment.enrichment || exaEnrichment;
}

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

    // Fetch leads with contact data
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        created_at,
        company_name,
        company_domain,
        company_city,
        company_country,
        company_type,
        is_ai_attributed,
        ai_source,
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
          exa_enrichment,
          confidence_score
        ),
        user_visits (
          id,
          page_url,
          ip_address,
          user_agent,
          session_duration,
          pages_viewed,
          utm_source,
          utm_medium,
          utm_campaign,
          referrer
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
    
    const [mediaData, experienceData, educationData] = await Promise.all([
      contactIds.length > 0 ? supabase
        .from('contact_media')
        .select('*')
        .in('contact_id', contactIds)
        .order('published_date', { ascending: false }) : { data: [] },
      contactIds.length > 0 ? supabase
        .from('contact_experiences')
        .select('*')
        .in('contact_id', contactIds)
        .order('is_current', { ascending: false }) : { data: [] },
      contactIds.length > 0 ? supabase
        .from('contact_education')
        .select('*')
        .in('contact_id', contactIds)
        .order('end_year', { ascending: false }) : { data: [] }
    ]);

    // Transform the data to match our interface
    const transformedLeads = (leads || []).map(lead => {
      const contact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts;
      const visit = Array.isArray(lead.user_visits) ? lead.user_visits[0] : lead.user_visits;
      
      // Get media content for this contact
      const mediaContent = mediaData.data?.filter(media => media.contact_id === contact?.id) || [];
      
      // Get work experience for this contact
      const workExperience = experienceData.data?.filter(exp => exp.contact_id === contact?.id) || [];
      
      // Get education for this contact
      const educationRecords = educationData.data?.filter(edu => edu.contact_id === contact?.id) || [];
      
      // Also extract media from enrichment data if available
      const enrichedData = parseEnrichmentData(contact?.exa_enrichment);
      if (enrichedData && mediaContent.length === 0) {
        // Parse LinkedIn posts from enrichment
        if (enrichedData.linkedin_posts) {
          const posts = enrichedData.linkedin_posts.split('\n').filter((line: string) => line.includes('URL:'));
          posts.forEach((post: string) => {
            const titleMatch = post.match(/Title:\s*"([^"]+)"/);
            const urlMatch = post.match(/URL:\s*(https:\/\/[^\s]+)/);
            if (titleMatch || urlMatch) {
              mediaContent.push({
                type: 'post',
                title: titleMatch?.[1] || 'LinkedIn Post',
                url: urlMatch?.[1] || '',
                description: post.substring(0, 200),
                published_date: new Date().toISOString(),
                platform: 'LinkedIn'
              });
            }
          });
        }
        
        // Parse press quotes from enrichment
        if (enrichedData.press_quotes) {
          const quotes = enrichedData.press_quotes.split('\n\n').filter((q: string) => q.includes('"'));
          quotes.forEach((quote: string) => {
            const quoteMatch = quote.match(/"([^"]+)"/);
            if (quoteMatch) {
              mediaContent.push({
                type: 'quote',
                title: 'Press Quote',
                quote: quoteMatch[1],
                description: quoteMatch[1],
                published_date: new Date().toISOString(),
                platform: 'Press'
              });
            }
          });
        }
      }

      // Extract confidence level based on score
      const getConfidenceLevel = (score: number) => {
        if (score >= 0.8) return 'high';
        if (score >= 0.5) return 'medium';
        return 'low';
      };

      // Detect model/attribution source
      const getModel = (source: string | null, referrer?: string | null) => {
        // First check AI source from leads table
        if (source && source !== 'direct') {
          if (source.includes('chatgpt') || source === 'openai') return 'GPT-4o';
          if (source.includes('perplexity')) return 'Perplexity';
          if (source.includes('claude')) return 'Claude';
          if (source.includes('google') || source.includes('gemini')) return 'Gemini';
          return source.charAt(0).toUpperCase() + source.slice(1);
        }
        
        // Then check referrer
        if (referrer) {
          if (referrer.includes('chat.openai.com')) return 'GPT-4o';
          if (referrer.includes('perplexity.ai')) return 'Perplexity';
          if (referrer.includes('claude.ai')) return 'Claude';
          if (referrer.includes('google.com')) return 'Gemini';
        }
        
        return 'Direct';
      };

      return {
        // Match frontend Lead interface
        id: lead.id,
        timestamp: lead.created_at,
        model: getModel(lead.ai_source, visit?.referrer),
        pageVisited: visit?.page_url || '/',
        
        // Individual enrichment data
        email: contact?.email || '',
        fullName: contact?.name || 'Unknown',
        firstName: contact?.name?.split(' ')[0] || '',
        lastName: contact?.name?.split(' ').slice(1).join(' ') || '',
        company: lead.company_name || contact?.current_company || 'Unknown Company',
        jobTitle: contact?.title || contact?.current_position || 'Unknown',
        location: `${lead.company_city || ''}, ${lead.company_country || ''}`.replace(', ', '').trim() || 'Unknown',
        linkedinUrl: contact?.linkedin_url || '',
        confidence: getConfidenceLevel(contact?.confidence_score || lead.confidence_score || 0),
        
        // Additional metadata
        ipAddress: visit?.ip_address || '',
        userAgent: visit?.user_agent,
        sessionDuration: visit?.session_duration,
        pagesViewed: visit?.pages_viewed,
        
        // Extended data for detail view
        company_name: lead.company_name || 'Unknown Company',
        company_domain: lead.company_domain || '',
        company_city: lead.company_city || '',
        company_country: lead.company_country || '',
        contact_name: contact?.name || 'Unknown Contact',
        contact_title: contact?.title || '',
        contact_email: contact?.email || '',
        contact_linkedin_url: contact?.linkedin_url || '',
        confidence_score: contact?.confidence_score || lead.confidence_score || 0,
        picture_url: contact?.picture_url,
        headline: contact?.headline,
        summary: contact?.summary,
        current_company: contact?.current_company,
        current_role: contact?.current_position,
        tenure_months: contact?.tenure_months,
        skills: contact?.skills || [],

        social_handles: contact?.social_handles || {},
        thought_leadership_score: contact?.thought_leadership_score,
        interests: contact?.interests || [],
        volunteer_work: contact?.volunteer_work || [],
        connection_count: contact?.connection_count,
        last_activity_date: contact?.last_activity_date,
        enrichment_data: enrichedData || parseEnrichmentData(contact?.exa_enrichment),
        lead_source: lead.lead_source || 'legacy',
        attribution_source: lead.ai_source || visit?.utm_source || 'direct',
        exa_webset_id: lead.exa_webset_id,
        exa_raw: lead.exa_raw,
        media_content: mediaContent.map(media => ({
          type: media.media_type,
          title: media.title,
          url: media.url,
          description: media.description || media.snippet,
          published_date: media.published_date,
          platform: media.platform || media.publication
        })),
        work_experience: workExperience.map(exp => ({
          company: exp.company_name,
          role: exp.role_title,
          start_date: exp.start_date,
          end_date: exp.end_date,
          is_current: exp.is_current,
          description: exp.description
        })),
        education: educationRecords.map(edu => ({
          institution: edu.institution_name,
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          start_year: edu.start_year,
          end_year: edu.end_year
        }))
      };
    });

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLeads = transformedLeads.filter(lead => 
      new Date(lead.timestamp) >= today
    );

    const highConfidenceLeads = transformedLeads.filter(lead => 
      lead.confidence_score >= 0.8
    );

    const websetsEnrichedLeads = transformedLeads.filter(lead =>
      lead.exa_webset_id !== null && lead.exa_webset_id !== undefined
    );

    const avgConfidence = transformedLeads.length > 0 
      ? transformedLeads.reduce((sum, lead) => sum + lead.confidence_score, 0) / transformedLeads.length
      : 0;

    // Get most common model
    const modelCounts = transformedLeads.reduce((acc, lead) => {
      acc[lead.model] = (acc[lead.model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topModel = Object.entries(modelCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    // Get most visited page
    const pageCounts = transformedLeads.reduce((acc, lead) => {
      const page = lead.pageVisited;
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCrawledPage = Object.entries(pageCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '/';

    const stats = {
      total: transformedLeads.length,
      today: todayLeads.length,
      highConfidence: highConfidenceLeads.length,
      avgConfidence: avgConfidence,
      websetsEnriched: websetsEnrichedLeads.length,
      leadsToday: todayLeads.length,
      topModel: topModel,
      topModelCount: modelCounts[topModel] || 0,
      mostCrawledPage: mostCrawledPage.length > 20 ? mostCrawledPage.slice(0, 20) + '...' : mostCrawledPage,
      topTopic: 'AI-attributed leads'
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