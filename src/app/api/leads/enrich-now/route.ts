import { NextRequest, NextResponse } from 'next/server';
import { ipinfoClient } from '@/lib/enrichment/ipinfo-client';
import { exaClient } from '@/lib/enrichment/exa-client';
import { emailGenerator } from '@/lib/enrichment/email-generator';
import { createClient } from '@/lib/supabase/server';

interface UserVisit {
  id: string;
  workspace_id: string;
  ip_address: string;
  page_url: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  user_agent?: string;
}

// AI Attribution Detection
function detectAIAttribution(visit: UserVisit): boolean {
  const aiSources = ['chatgpt', 'perplexity', 'claude', 'copilot', 'openai'];
  const aiMediums = ['ai', 'llm', 'chatbot', 'assistant'];
  
  return (
    (!!visit.utm_source && aiSources.includes(visit.utm_source.toLowerCase())) ||
    (!!visit.utm_medium && aiMediums.includes(visit.utm_medium.toLowerCase())) ||
    (!!visit.referrer && (
      visit.referrer.includes('chat.openai.com') ||
      visit.referrer.includes('perplexity.ai') ||
      visit.referrer.includes('claude.ai') ||
      visit.referrer.includes('copilot.microsoft.com')
    ))
  );
}

function detectAISourceFromReferrer(referrer?: string): string | null {
  if (!referrer) return null;
  
  if (referrer.includes('chat.openai.com')) return 'chatgpt';
  if (referrer.includes('perplexity.ai')) return 'perplexity';
  if (referrer.includes('claude.ai')) return 'claude';
  if (referrer.includes('copilot.microsoft.com')) return 'copilot';
  
  return null;
}

export interface EnrichmentResult {
  success: boolean;
  leadId?: string;
  status: 'enriched' | 'skip_isp' | 'no_contact' | 'email_fail' | 'error';
  company?: {
    name: string;
    domain: string;
    city: string;
    country: string;
  };
  contact?: {
    name: string;
    title: string;
    email: string;
    linkedinUrl: string;
    titleMatchScore: number;
    confidenceScore?: number;
    highlights?: string[];
  };
  insights?: {
    socialProfiles: Array<{platform: string; url: string}>;
    education: string[];
    recentActivity: Array<{title: string; url: string; date: string}>;
  };
  cost?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check admin access first
    const { createClient } = await import('@/lib/supabase/server');
    const authSupabase = await createClient();

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
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
      const { data: profile, error: profileError } = await authSupabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (profileError || !profile?.is_admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const { userVisitId, icpDescription } = await request.json();

    if (!userVisitId) {
      return NextResponse.json(
        { error: 'userVisitId is required' },
        { status: 400 }
      );
    }

    // Use ICP description or default to executives
    const searchDescription = icpDescription || 'Senior executive or decision maker';

    console.log(`[ENRICH] Starting enrichment for user visit: ${userVisitId}`);

    // API routes need service role since there's no auth context
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user visit details
    const { data: userVisit, error: visitError } = await supabase
      .from('user_visits')
      .select('*')
      .eq('id', userVisitId)
      .single();

    if (visitError || !userVisit) {
      console.error('[ENRICH] User visit not found:', visitError);
      return NextResponse.json(
        { error: 'User visit not found' },
        { status: 404 }
      );
    }

    // Step 1: IP → Company (IPInfo)
    console.log(`[ENRICH] Step 1: Looking up IP ${userVisit.ip_address}`);
    const company = await ipinfoClient.lookup(userVisit.ip_address.toString());
    
    if (!company) {
      console.log('[ENRICH] Skipping: Not a business IP');
      return NextResponse.json({
        success: false,
        status: 'skip_isp',
        error: 'Not a business IP or lookup failed'
      } as EnrichmentResult);
    }

    console.log(`[ENRICH] Found company: ${company.name}`);

    // Step 2: Company → Contact (Exa) using ICP description
    console.log(`[ENRICH] Step 2: Searching for "${searchDescription}" at ${company.name} (no location filter)`);
    
    // Remove location filtering to cast wider net
    const searchResults = await exaClient.searchLinkedInByICP(company.name, searchDescription);
    
    if (!searchResults.length) {
      console.log('[ENRICH] No LinkedIn profiles found');
      return NextResponse.json({
        success: false,
        status: 'no_contact',
        company: {
          name: company.name,
          domain: company.domain,
          city: company.city,
          country: company.country
        },
        error: 'No LinkedIn profiles found'
      } as EnrichmentResult);
    }

    // Step 2b: Fetch full content for all profiles
    console.log(`[ENRICH] Step 2b: Fetching full content for ${searchResults.length} profiles`);
    const profileUrls = searchResults.map(r => r.url);
    const contentsResults = await exaClient.fetchContents(profileUrls);

    if (!contentsResults.length) {
      console.log('[ENRICH] Failed to fetch profile contents');
      return NextResponse.json({
        success: false,
        status: 'no_contact',
        company: {
          name: company.name,
          domain: company.domain,
          city: company.city,
          country: company.country
        },
        error: 'Failed to fetch profile contents'
      } as EnrichmentResult);
    }

    // Step 2c: Score and select best contact
    console.log(`[ENRICH] Step 2c: Scoring ${contentsResults.length} profiles`);
    const bestContact = exaClient.scoreAndSelectBestContact(
      searchResults,
      contentsResults,
      company.name,
      undefined, // No location filtering
      searchDescription
    );

    if (!bestContact) {
      console.log('[ENRICH] No contacts met minimum confidence threshold');
      return NextResponse.json({
        success: false,
        status: 'no_contact',
        company: {
          name: company.name,
          domain: company.domain,
          city: company.city,
          country: company.country
        },
        error: 'No contacts met minimum confidence threshold (0.3)'
      } as EnrichmentResult);
    }

    console.log(`[ENRICH] Best contact: ${bestContact.name} (${bestContact.title}) - Confidence: ${bestContact.confidenceScore?.toFixed(2)}`);

    // Step 3: Contact → Email
    console.log(`[ENRICH] Step 3: Generating email patterns for ${bestContact.name}`);
    const emailCandidates = emailGenerator.generateEmailPatterns(bestContact.name, company.domain);
    
    if (!emailCandidates.length) {
      console.log('[ENRICH] Could not generate email patterns');
      return NextResponse.json({
        success: false,
        status: 'email_fail',
        company: {
          name: company.name,
          domain: company.domain,
          city: company.city,
          country: company.country
        },
        error: 'Could not generate email patterns'
      } as EnrichmentResult);
    }

    const verifiedEmail = await emailGenerator.verifyFirst(emailCandidates);
    
    if (!verifiedEmail || verifiedEmail.status !== 'verified') {
      console.log('[ENRICH] Email verification failed');
      return NextResponse.json({
        success: false,
        status: 'email_fail',
        company: {
          name: company.name,
          domain: company.domain,
          city: company.city,
          country: company.country
        },
        error: 'Email verification failed'
      } as EnrichmentResult);
    }

    console.log(`[ENRICH] ✅ Email verified: ${verifiedEmail.email}`);

    // Step 4: Deep enrichment - find additional context about this person
    console.log(`[ENRICH] Step 4: Deep enrichment for ${bestContact.name}`);
    const deepInsights = await exaClient.deepEnrichPerson(bestContact.name, company.name, bestContact.title);

    // Step 5: Detect AI attribution
    const isAIAttributed = detectAIAttribution(userVisit);
    
    // Step 5: Save lead to database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        workspace_id: userVisit.workspace_id,
        user_visit_id: userVisit.id,
        company_name: company.name,
        company_domain: company.domain,
        company_city: company.city,
        company_country: company.country,
        company_type: company.type,
        is_ai_attributed: isAIAttributed,
        ai_source: isAIAttributed ? (userVisit.utm_source || detectAISourceFromReferrer(userVisit.referrer)) : null,
        enrichment_cost_cents: 4, // Estimated $0.04
      })
      .select()
      .single();

    if (leadError) {
      console.error('[ENRICH] Failed to save lead:', leadError);
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      );
    }

    // Save contact details with enhanced data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        lead_id: lead.id,
        name: bestContact.name,
        title: bestContact.title,
        email: verifiedEmail.email,
        linkedin_url: bestContact.linkedinUrl,
        title_match_score: bestContact.titleMatchScore,
        email_verification_status: verifiedEmail.status,
        email_verification_reason: verifiedEmail.reason,
        headline: bestContact.headline,
        summary: bestContact.summary,
        connection_count: bestContact.connectionCount,
        last_activity_date: bestContact.lastActivityDate,
        enrichment_depth: deepInsights ? 'enhanced' : 'basic'
      })
      .select()
      .single();

    if (contactError) {
      console.error('[ENRICH] Failed to save contact:', contactError);
    } else if (contact && deepInsights) {
      // Save media mentions
      if (deepInsights.thoughtLeadership?.length > 0) {
        await supabase
          .from('contact_media')
          .insert(
            deepInsights.thoughtLeadership.map((item: any) => ({
              contact_id: contact.id,
              media_type: item.type,
              title: item.title,
              url: item.url,
              published_at: item.date,
              snippet: item.snippet
            }))
          );
      }

      // Save press quotes
      if (deepInsights.pressQuotes?.length > 0) {
        await supabase
          .from('contact_media')
          .insert(
            deepInsights.pressQuotes.map((item: any) => ({
              contact_id: contact.id,
              media_type: 'news',
              title: item.title,
              url: item.url,
              publication: item.publication,
              published_at: item.date,
              snippet: item.snippet
            }))
          );
      }

      // Save patents
      if (deepInsights.patents?.length > 0) {
        await supabase
          .from('contact_media')
          .insert(
            deepInsights.patents.map((item: any) => ({
              contact_id: contact.id,
              media_type: 'patent',
              title: item.title,
              url: item.url,
              published_at: item.date
            }))
          );
      }

      // Update lead with enrichment quality
      await supabase
        .from('leads')
        .update({
          enrichment_quality: 'enhanced',
          public_signals_count: deepInsights.totalPublicMentions || 0
        })
        .eq('id', lead.id);
    }

    console.log(`[ENRICH] 🎉 Lead enriched successfully: ${lead.id}`);

    return NextResponse.json({
      success: true,
      status: 'enriched',
      leadId: lead.id,
      company: {
        name: company.name,
        domain: company.domain,
        city: company.city,
        country: company.country
      },
      contact: {
        name: bestContact.name,
        title: bestContact.title,
        email: verifiedEmail.email,
        linkedinUrl: bestContact.linkedinUrl,
        titleMatchScore: bestContact.titleMatchScore,
        confidenceScore: bestContact.confidenceScore,
        highlights: bestContact.highlights
      },
      insights: deepInsights || undefined,
              cost: 0.069 // $0.0275 search + $0.005 contents + $0.033 deep enrichment + $0.003 email
    } as EnrichmentResult);

  } catch (error) {
    console.error('[ENRICH] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as EnrichmentResult,
      { status: 500 }
    );
  }
} 