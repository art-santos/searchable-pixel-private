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
    const { userVisitId, icpDescription, internalApiKey } = await request.json();

    // Allow internal calls with API key OR authenticated admin users
    const isInternalCall = internalApiKey === process.env.INTERNAL_API_KEY;
    
    if (!isInternalCall) {
      // Check admin access for external calls
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
    }

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

    // LOG THE CONTACT DATA WE'RE ABOUT TO SAVE
    console.log('\n💾 SAVING LEAD WITH FULL DATA:');
    console.log('=====================================');
    console.log('Company:', company.name);
    console.log('Contact:', bestContact.name, '-', bestContact.title);
    console.log('Enrichment Data Keys:', Object.keys(bestContact.enrichment || {}));
    console.log('\nFull Enrichment:');
    console.log(JSON.stringify(bestContact.enrichment, null, 2));
    console.log('=====================================\n');

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
        exa_raw: bestContact._raw || bestContact, // Store raw webset item with ALL data
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
        exa_enrichment: bestContact, // Store ENTIRE bestContact object with ALL enrichments
        enrichment_depth: 'enhanced',
        location: bestContact.location,
        summary: bestContact.summary || bestContact.enrichment?.summary || null
      })
      .select()
      .single();

    if (contactError) {
      console.error('[WEBSETS-ENRICH] Failed to save contact:', contactError);
      return NextResponse.json(
        { error: 'Failed to save contact' },
        { status: 500 }
      );
    }

    // Process and save enrichment data to related tables
    if (bestContact.enrichment && contact) {
      console.log('[WEBSETS-ENRICH] Processing enrichment data...');
      
      // Parse enrichment results
      const enrichments = bestContact.enrichment;
      const mediaToInsert = [];
      const experiencesToInsert = [];
      const educationToInsert = [];
      
      // LinkedIn Posts
      if (enrichments.linkedin_posts) {
        const posts = parseLinkedInPosts(enrichments.linkedin_posts);
        posts.forEach(post => {
          mediaToInsert.push({
            contact_id: contact.id,
            media_type: 'linkedin_post',
            title: post.content.substring(0, 100),
            url: post.url,
            description: post.content,
            snippet: post.content,
            published_date: new Date().toISOString(),
            platform: 'LinkedIn'
          });
        });
      }
      
      // Media Mentions
      if (enrichments.media_mentions) {
        const mentions = parseMediaMentions(enrichments.media_mentions);
        mentions.forEach(mention => {
          mediaToInsert.push({
            contact_id: contact.id,
            media_type: 'article',
            title: mention.title,
            url: mention.url,
            published_date: mention.date,
            platform: mention.publication,
            publication: mention.publication
          });
        });
      }
      
      // Press Quotes
      if (enrichments.press_quotes) {
        const quotes = parsePressQuotes(enrichments.press_quotes);
        quotes.forEach(quote => {
          mediaToInsert.push({
            contact_id: contact.id,
            media_type: 'quote',
            title: quote.source,
            description: quote.quote,
            quote: quote.quote,
            published_date: quote.date,
            platform: quote.publication,
            publication: quote.publication
          });
        });
      }
      
      // Speaking Engagements
      if (enrichments.speaking_engagements) {
        const events = parseSpeakingEngagements(enrichments.speaking_engagements);
        events.forEach(event => {
          mediaToInsert.push({
            contact_id: contact.id,
            media_type: 'podcast',
            title: event.title,
            description: event.description,
            published_date: new Date().toISOString(),
            event: event.title
          });
        });
      }
      
      // Key Works (Patents, Projects, Papers)
      if (enrichments.key_works) {
        const works = parseKeyWorks(enrichments.key_works);
        works.forEach(work => {
          mediaToInsert.push({
            contact_id: contact.id,
            media_type: work.type === 'Patent' ? 'patent' : 'project',
            title: work.title,
            description: work.description,
            published_date: work.year || new Date().toISOString()
          });
        });
      }
      
      // Work Experience
      if (enrichments.work_history) {
        const experiences = parseWorkHistory(enrichments.work_history);
        experiences.forEach(exp => {
          experiencesToInsert.push({
            contact_id: contact.id,
            company_name: exp.company,
            role_title: exp.role,
            start_date: exp.startDate,
            end_date: exp.endDate,
            is_current: exp.isCurrent,
            description: exp.description || ''
          });
        });
      }
      
      // Education
      if (enrichments.education_history) {
        const educations = parseEducationHistory(enrichments.education_history);
        educations.forEach(edu => {
          educationToInsert.push({
            contact_id: contact.id,
            institution_name: edu.institution,
            degree: edu.degree,
            field_of_study: edu.field,
            start_year: edu.startYear,
            end_year: edu.endYear
          });
        });
      }
      
      // Insert media content
      if (mediaToInsert.length > 0) {
        const { error: mediaError } = await supabase
          .from('contact_media')
          .insert(mediaToInsert);
        
        if (mediaError) {
          console.error('[WEBSETS-ENRICH] Failed to save media:', mediaError);
        } else {
          console.log(`[WEBSETS-ENRICH] Saved ${mediaToInsert.length} media items`);
        }
      }
      
      // Insert work experiences
      if (experiencesToInsert.length > 0) {
        const { error: expError } = await supabase
          .from('contact_experiences')
          .insert(experiencesToInsert);
        
        if (expError) {
          console.error('[WEBSETS-ENRICH] Failed to save experiences:', expError);
        } else {
          console.log(`[WEBSETS-ENRICH] Saved ${experiencesToInsert.length} experiences`);
        }
      }
      
      // Insert education
      if (educationToInsert.length > 0) {
        const { error: eduError } = await supabase
          .from('contact_education')
          .insert(educationToInsert);
        
        if (eduError) {
          console.error('[WEBSETS-ENRICH] Failed to save education:', eduError);
        } else {
          console.log(`[WEBSETS-ENRICH] Saved ${educationToInsert.length} education items`);
        }
      }
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

// Helper functions to parse Websets enrichment data
function parseLinkedInPosts(text: string): Array<{content: string, url: string}> {
  const posts = [];
  const lines = text.split('\n\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Parse format: "content" - action. URL: https://...
    const contentMatch = line.match(/"([^"]+)"/);
    const urlMatch = line.match(/URL:\s*(https:\/\/[^\s]+)/);
    
    if (contentMatch || urlMatch) {
      posts.push({
        content: contentMatch ? contentMatch[1] : line.split('-')[0].trim(),
        url: urlMatch ? urlMatch[1] : ''
      });
    }
  }
  
  return posts.slice(0, 5); // Limit to 5 posts
}

function parseMediaMentions(text: string): Array<{title: string, publication: string, date: string, url: string}> {
  const mentions = [];
  const lines = text.split('\n\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Parse format: "Title" - Publication, Date, URL
    const titleMatch = line.match(/"([^"]+)"/);
    const parts = line.split(' - ');
    if (parts.length > 1) {
      const afterTitle = parts[1].split(', ');
      const publication = afterTitle[0];
      const date = afterTitle[1];
      const urlMatch = line.match(/https:\/\/[^\s]+/);
      
      mentions.push({
        title: titleMatch ? titleMatch[1] : parts[0].replace(/"/g, ''),
        publication: publication || 'Unknown',
        date: date || new Date().toISOString(),
        url: urlMatch ? urlMatch[0] : ''
      });
    }
  }
  
  return mentions.slice(0, 10);
}

function parsePressQuotes(text: string): Array<{quote: string, source: string, publication: string, date: string}> {
  const quotes = [];
  const lines = text.split('\n\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Parse format: "Quote" - Person, quoted in Publication (Date)
    const quoteMatch = line.match(/"([^"]+)"/);
    const sourceMatch = line.match(/quoted in\s+([^(]+)/i);
    const dateMatch = line.match(/\(([^)]+)\)/);
    
    if (quoteMatch) {
      quotes.push({
        quote: quoteMatch[1],
        source: line.split(' - ')[0] || 'Press Quote',
        publication: sourceMatch ? sourceMatch[1].trim() : 'Media',
        date: dateMatch ? dateMatch[1] : new Date().toISOString()
      });
    }
  }
  
  return quotes.slice(0, 5);
}

function parseSpeakingEngagements(text: string): Array<{title: string, description: string}> {
  const events = [];
  const lines = text.split('\n\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Parse podcasts and speaking events
    if (line.toLowerCase().includes('podcast') || line.toLowerCase().includes('episode') || 
        line.toLowerCase().includes('conference') || line.toLowerCase().includes('summit')) {
      events.push({
        title: line.split('.')[0] || 'Speaking Engagement',
        description: line
      });
    }
  }
  
  return events.slice(0, 5);
}

function parseKeyWorks(text: string): Array<{title: string, type: string, description: string, year?: string}> {
  const works = [];
  const lines = text.split('\n\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Parse format: "Title" (Type, Year) - Description
    const titleMatch = line.match(/"([^"]+)"/);
    const typeMatch = line.match(/\(([^,]+),/);
    const yearMatch = line.match(/,\s*(\d{4})\)/);
    const descMatch = line.match(/\)\s*-\s*(.+)/);
    
    if (titleMatch || line.includes('Project') || line.includes('Patent')) {
      works.push({
        title: titleMatch ? titleMatch[1] : line.split('(')[0].trim(),
        type: typeMatch ? typeMatch[1] : 'Project',
        description: descMatch ? descMatch[1] : line,
        year: yearMatch ? yearMatch[1] : undefined
      });
    }
  }
  
  return works.slice(0, 10);
}

function parseWorkHistory(text: string): Array<{company: string, role: string, startDate: string, endDate: string, isCurrent: boolean, description?: string}> {
  const experiences = [];
  
  // Remove header line if present
  const cleanText = text.replace(/^.*Work History:?\s*/i, '');
  const lines = cleanText.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Parse format: Role at Company, Start - End
    // Or: Role: Department at Company, Start - End
    const atMatch = line.match(/^([^:]+?)(?::\s*[^:]+)?\s+at\s+([^,]+),\s*(.+)/);
    
    if (atMatch) {
      const [_, role, company, dateRange] = atMatch;
      const dates = dateRange.split(' - ');
      
      experiences.push({
        role: role.trim(),
        company: company.trim(),
        startDate: dates[0]?.trim() || '',
        endDate: dates[1]?.trim() || 'Present',
        isCurrent: dates[1]?.toLowerCase().includes('present') || false
      });
    }
  }
  
  return experiences;
}

function parseEducationHistory(text: string): Array<{institution: string, degree: string, field: string, startYear?: number, endYear?: number}> {
  const educations = [];
  const lines = text.split(/(?=Ph\.D\.|BSc|MSc|BA|BS|MS|MBA)/);
  
  for (const line of lines) {
    if (line.trim()) {
      // Parse format: Degree in Field from Institution (Years)
      const degreeMatch = line.match(/^(Ph\.D\.|BSc|MSc|BA|BS|MS|MBA)\s+in\s+([^f]+)\s+from\s+([^(]+)/);
      const yearMatch = line.match(/\((\d{4})-(\d{4})\)/);
      
      if (degreeMatch) {
        educations.push({
          degree: degreeMatch[1].trim(),
          field: degreeMatch[2].trim(),
          institution: degreeMatch[3].trim(),
          startYear: yearMatch ? parseInt(yearMatch[1]) : undefined,
          endYear: yearMatch ? parseInt(yearMatch[2]) : undefined
        });
      } else {
        // Fallback parsing
        const institution = line.match(/(?:from|at)\s+([^(]+)/)?.[1]?.trim() || '';
        educations.push({
          degree: line.split(' ')[0] || '',
          field: 'Unknown',
          institution: institution
        });
      }
    }
  }
  
  return educations;
} 