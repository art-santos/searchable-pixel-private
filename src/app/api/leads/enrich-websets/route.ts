import { NextRequest, NextResponse } from 'next/server';
import { ipinfoClient } from '@/lib/enrichment/ipinfo-client';
import { exaWebsetsClient, LeadCandidate } from '@/lib/enrichment/exa-websets-client';
import { emailGenerator } from '@/lib/enrichment/email-generator';

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

export interface WebsetsEnrichmentResult {
  success: boolean;
  leadId?: string;
  websetId?: string;
  status: 'enriched' | 'skip_isp' | 'no_contact' | 'email_fail' | 'webset_timeout' | 'error';
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
    confidence: number;
    pictureUrl?: string;
    headline?: string;
    enrichment?: any;
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
    const icpTitles = [
      'CEO', 'CTO', 'CFO', 'Chief Executive Officer', 'Chief Technology Officer', 
      'VP', 'Vice President', 'Director', 'Head of Product', 'Senior Product Manager',
      searchDescription
    ];

    console.log(`[WEBSETS-ENRICH] Starting enrichment for user visit: ${userVisitId}`);

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
      console.error('[WEBSETS-ENRICH] User visit not found:', visitError);
      return NextResponse.json(
        { error: 'User visit not found' },
        { status: 404 }
      );
    }

    // Step 1: IP → Company (IPInfo)
    console.log(`[WEBSETS-ENRICH] Step 1: Looking up IP ${userVisit.ip_address}`);
    const company = await ipinfoClient.lookup(userVisit.ip_address.toString());
    
    if (!company) {
      console.log('[WEBSETS-ENRICH] Skipping: Not a business IP');
      return NextResponse.json({
        success: false,
        status: 'skip_isp',
        error: 'Not a business IP or lookup failed'
      } as WebsetsEnrichmentResult);
    }

    console.log(`[WEBSETS-ENRICH] Found company: ${company.name}`);

    // Step 2: Company → Contact (Exa Websets)
    console.log(`[WEBSETS-ENRICH] Step 2: Using Websets to find contact at ${company.name}`);
    
    let websetId: string | undefined;
    let bestContact: LeadCandidate | null = null;
    
    try {
      // Create webset and get best contact
      websetId = await exaWebsetsClient.createWebsetSearch(company.name, icpTitles);
      const items = await exaWebsetsClient.pollWebsetResults(websetId);
      bestContact = exaWebsetsClient.pickBestContact(items, company.name, icpTitles);
    } catch (error) {
      console.error('[WEBSETS-ENRICH] Websets failed:', error);
      
      if (error instanceof Error && error.message.includes('timed-out')) {
        return NextResponse.json({
          success: false,
          status: 'webset_timeout',
          websetId,
          company: {
            name: company.name,
            domain: company.domain,
            city: company.city,
            country: company.country
          },
          error: 'Webset processing timed out'
        } as WebsetsEnrichmentResult);
      }
      
      throw error; // Re-throw other errors
    }

    if (!bestContact) {
      console.log('[WEBSETS-ENRICH] No suitable contacts found');
      return NextResponse.json({
        success: false,
        status: 'no_contact',
        websetId,
        company: {
          name: company.name,
          domain: company.domain,
          city: company.city,
          country: company.country
        },
        error: 'No contacts found with current employment'
      } as WebsetsEnrichmentResult);
    }

    console.log(`[WEBSETS-ENRICH] Best contact: ${bestContact.name} (confidence: ${bestContact.confidence.toFixed(2)})`);

    // Step 3: Contact → Email
    console.log(`[WEBSETS-ENRICH] Step 3: Generating email patterns for ${bestContact.name}`);
    const emailCandidates = emailGenerator.generateEmailPatterns(bestContact.name, company.domain);
    
    if (!emailCandidates.length) {
      console.log('[WEBSETS-ENRICH] Could not generate email patterns');
      return NextResponse.json({
        success: false,
        status: 'email_fail',
        websetId,
        company: {
          name: company.name,
          domain: company.domain,
          city: company.city,
          country: company.country
        },
        error: 'Could not generate email patterns'
      } as WebsetsEnrichmentResult);
    }

    const verifiedEmail = await emailGenerator.verifyFirst(emailCandidates);
    
    if (!verifiedEmail || verifiedEmail.status !== 'verified') {
      console.log('[WEBSETS-ENRICH] Email verification failed');
      return NextResponse.json({
        success: false,
        status: 'email_fail',
        websetId,
        company: {
          name: company.name,
          domain: company.domain,
          city: company.city,
          country: company.country
        },
        error: 'Email verification failed'
      } as WebsetsEnrichmentResult);
    }

    console.log(`[WEBSETS-ENRICH] ✅ Email verified: ${verifiedEmail.email}`);

    // Step 4: Detect AI attribution
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
        enrichment_cost_cents: 35, // Estimated $0.35 for Websets
        exa_webset_id: websetId,
        exa_raw: bestContact,
        lead_source: 'exa_webset',
        enrichment_quality: 'enhanced'
      })
      .select()
      .single();

    if (leadError) {
      console.error('[WEBSETS-ENRICH] Failed to save lead:', leadError);
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
        title_match_score: 0.9, // High since Websets pre-filtered
        email_verification_status: verifiedEmail.status,
        email_verification_reason: verifiedEmail.reason,
        headline: bestContact.headline,
        picture_url: bestContact.pictureUrl,
        confidence_score: bestContact.confidence,
        exa_enrichment: bestContact.enrichment,
        enrichment_depth: 'enhanced'
      })
      .select()
      .single();

    if (contactError) {
      console.error('[WEBSETS-ENRICH] Failed to save contact:', contactError);
    }

    console.log(`[WEBSETS-ENRICH] 🎉 Lead enriched successfully: ${lead.id}`);

    return NextResponse.json({
      success: true,
      status: 'enriched',
      leadId: lead.id,
      websetId,
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
        confidence: bestContact.confidence,
        pictureUrl: bestContact.pictureUrl,
        headline: bestContact.headline,
        enrichment: bestContact.enrichment
      },
      cost: 0.35 // $0.35 for Websets (25-35 credits)
    } as WebsetsEnrichmentResult);

  } catch (error) {
    console.error('[WEBSETS-ENRICH] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as WebsetsEnrichmentResult,
      { status: 500 }
    );
  }
} 