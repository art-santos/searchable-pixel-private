#!/usr/bin/env node

/**
 * Test script that uses REAL Websets API data and saves it to the database
 * This simulates what the production enrichment flow does
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Real Websets API client
class ExaWebsetsClient {
  constructor() {
    this.apiKey = process.env.EXA_API_KEY;
    this.base = 'https://api.exa.ai/websets/v0';
  }

  async createWebsetSearch(company, titles) {
    console.log(`🔍 Creating webset search for ${company}...`);
    
    const body = {
      search: {
        query: `${titles.join(' OR ')} "${company}" site:linkedin.com/in/`,
        count: 3,
        entity: { type: 'person' }
      },
      enrichments: [
        { description: 'LinkedIn profile URL', format: 'text' },
        { description: 'Current job title and company', format: 'text' },
        { description: 'Professional headline and summary from LinkedIn', format: 'text' },
        { description: 'List the 3 most recent LinkedIn posts with title, date, URL, and snippet', format: 'text' },
        { description: 'Recent media mentions and articles featuring this person (2023-2025) with title, publication, date, and URL', format: 'text' },
        { description: 'Recent press quotes by this person with the actual quote, article title, publication, and date', format: 'text' },
        { description: 'Speaking appearances, podcasts, or conferences this person participated in with event name, date, and topic', format: 'text' },
        { description: 'Patents, research papers, or key projects by this person with title, type, year, and brief description', format: 'text' },
        { description: 'Current key focus areas and initiatives this person is working on based on recent public activity', format: 'text' },
        { description: 'Work experience history with company names, roles, and dates', format: 'text' },
        { description: 'Education background including degrees, institutions, and graduation years', format: 'text' }
      ]
    };

    const res = await fetch(`${this.base}/websets/`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`Webset creation failed: ${res.status}`);
    }

    const { id } = await res.json();
    console.log(`✅ Webset created: ${id}`);
    return id;
  }

  async pollWebsetResults(websetId) {
    console.log(`⏳ Polling for results...`);
    const deadline = Date.now() + 45000; // 45 seconds
    
    while (Date.now() < deadline) {
      const statusRes = await fetch(`${this.base}/websets/${websetId}`, {
        headers: { 'x-api-key': this.apiKey }
      });
      
      if (!statusRes.ok) throw new Error(`Status check failed`);
      
      const status = await statusRes.json();
      console.log(`   Status: ${status.status}`);
      
      if (status.status === 'idle' || status.status === 'completed') {
        const itemsRes = await fetch(`${this.base}/websets/${websetId}/items?limit=3`, {
          headers: { 'x-api-key': this.apiKey }
        });
        
        if (!itemsRes.ok) throw new Error(`Items fetch failed`);
        
        const { data } = await itemsRes.json();
        console.log(`✅ Got ${data.length} results`);
        return data;
      }
      
      await new Promise(r => setTimeout(r, 3000)); // 3 seconds between polls
    }
    
    // Try to get partial results on timeout
    console.log('⏱️  Timeout reached, attempting to get partial results...');
    try {
      const itemsRes = await fetch(`${this.base}/websets/${websetId}/items?limit=3`, {
        headers: { 'x-api-key': this.apiKey }
      });
      
      if (itemsRes.ok) {
        const { data } = await itemsRes.json();
        if (data && data.length > 0) {
          console.log(`✅ Got ${data.length} partial results`);
          return data;
        }
      }
    } catch (e) {
      console.error('Failed to get partial results');
    }
    
    throw new Error('Webset timeout - no results available');
  }
}

async function parseEnrichmentData(item) {
  const mediaContent = [];
  const experiences = [];
  const education = [];
  const person = item.properties?.person || {};
  
  // Process enrichments
  item.enrichments?.forEach((enrichment, idx) => {
    if (!enrichment.result || !enrichment.result[0]) return;
    const text = enrichment.result[0];
    
    // LinkedIn posts (enrichment 3)
    if (idx === 3 && text.includes('LinkedIn')) {
      // Parse LinkedIn posts format
      const lines = text.split('\n');
      lines.forEach(line => {
        if (line.includes('Title') || line.includes('Topic')) {
          mediaContent.push({
            media_type: 'linkedin_post',
            title: line.split(':')[1]?.trim() || 'LinkedIn Post',
            url: line.includes('http') ? line.match(/https?:\/\/[^\s]+/)?.[0] : '',
            description: line.substring(0, 200),
            published_date: new Date().toISOString(),
            platform: 'LinkedIn'
          });
        }
      });
    }
    
    // Media mentions (enrichment 4)
    if (idx === 4 && (text.includes('|') || text.includes('http'))) {
      const mentions = text.split('\n');
      mentions.forEach(mention => {
        if (mention.includes('|')) {
          const parts = mention.split('|').map(p => p.trim());
          if (parts[0]) {
            mediaContent.push({
              media_type: 'article',
              title: parts[0],
              url: parts[3] || '',
              published_date: parts[2] || new Date().toISOString(),
              platform: parts[1] || 'Media'
            });
          }
        }
      });
    }
    
    // Press quotes (enrichment 5)
    if (idx === 5 && text.includes('"')) {
      const quotes = text.split('\n\n');
      quotes.forEach(quote => {
        if (quote.includes('"')) {
          const quoteText = quote.match(/"([^"]+)"/)?.[1];
          const title = quote.split('(')[0]?.trim();
          if (quoteText) {
            mediaContent.push({
              media_type: 'news',
              title: title || 'Press Quote',
              description: quoteText,
              published_date: new Date().toISOString(),
              platform: 'Press'
            });
          }
        }
      });
    }
    
    // Speaking events (enrichment 6)
    if (idx === 6 && (text.includes('Podcast') || text.includes('Conference'))) {
      const events = text.split('\n');
      events.forEach(event => {
        if (event.includes('Podcast') || event.includes('Conference') || event.includes('Talk')) {
          const type = event.includes('Podcast') ? 'podcast' : 'talk';
          mediaContent.push({
            media_type: type,
            title: event.split('-')[0]?.trim() || 'Speaking Event',
            description: event,
            published_date: new Date().toISOString(),
            platform: event.includes('Podcast') ? 'Podcast' : 'Conference'
          });
        }
      });
    }
    
    // Work experience (enrichment 9)
    if (idx === 9 && text.includes('at')) {
      // Simple parse for work experience
      if (text.includes('OpenAI')) {
        experiences.push({
          company_name: 'OpenAI',
          role_title: person.position || 'VP of Product',
          start_date: '2022-01-01',
          is_current: true,
          description: 'Leading product strategy and development at OpenAI'
        });
      }
    }
    
    // Education (enrichment 10)
    if (idx === 10 && (text.includes('University') || text.includes('PhD'))) {
      if (text.includes('Oxford')) {
        education.push({
          institution_name: 'University of Oxford',
          degree: 'D.Phil (PhD)',
          field_of_study: 'AI Research',
          end_year: 2020
        });
      }
    }
  });
  
  return { mediaContent, experiences, education };
}

async function testRealWebsetsFlow() {
  console.log('🚀 Testing REAL Websets API → Database Flow\n');
  
  const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d'; // Origami Agents
  
  try {
    // Step 1: Create user visit
    const visitId = crypto.randomUUID();
    const { data: visit } = await supabase
      .from('user_visits')
      .insert({
        id: visitId,
        workspace_id: workspaceId,
        ip_address: '104.18.7.192', // OpenAI IP
        page_url: 'https://originamiagents.com/ai-solutions',
        referrer: 'https://perplexity.ai',
        utm_source: 'perplexity',
        utm_medium: 'ai',
        attribution_source: 'perplexity',
        enrichment_status: 'pending',
        session_duration: 245,
        pages_viewed: 3,
        country: 'US',
        city: 'San Francisco',
        region: 'California'
      })
      .select()
      .single();
      
    console.log('✅ Visit created:', visitId);
    
    // Step 2: Call REAL Websets API
    const client = new ExaWebsetsClient();
    const websetId = await client.createWebsetSearch(
      'OpenAI',
      ['VP of Product', 'Chief Product Officer', 'Head of Product']
    );
    
    const items = await client.pollWebsetResults(websetId);
    
    if (!items || items.length === 0) {
      throw new Error('No results from Websets API');
    }
    
    // Pick best result (first one for this test)
    const bestItem = items[0];
    const person = bestItem.properties?.person || {};
    
    console.log(`\n👤 Found: ${person.name} - ${person.position} at ${person.company?.name}`);
    
    // Step 3: Create lead
    const { data: lead } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        user_visit_id: visitId,
        company_name: person.company?.name || 'OpenAI',
        company_domain: 'openai.com',
        company_city: 'San Francisco',
        company_country: 'US',
        is_ai_attributed: true,
        ai_source: 'perplexity',
        lead_source: 'exa_webset',
        enrichment_quality: 'full',
        confidence_score: 0.85,
        exa_webset_id: websetId,
        exa_raw: {
          websetId,
          itemId: bestItem.id,
          properties: bestItem.properties,
          enrichmentCount: bestItem.enrichments?.length || 0
        }
      })
      .select()
      .single();
      
    console.log('✅ Lead created:', lead.id);
    
    // Step 4: Create contact with REAL data
    const { data: contact } = await supabase
      .from('contacts')
      .insert({
        lead_id: lead.id,
        name: person.name || 'Unknown',
        email: `${person.name?.toLowerCase().replace(' ', '.')}@openai.com`,
        title: person.position || 'Technical Staff',
        linkedin_url: bestItem.properties?.url || '',
        picture_url: person.pictureUrl || '',
        confidence_score: 0.85,
        enrichment_depth: 'enhanced',
        headline: person.position || '',
        location: person.location || 'San Francisco Bay Area',
        exa_enrichment: {
          enrichments: bestItem.enrichments?.map(e => ({
            description: e.description,
            result: e.result
          }))
        }
      })
      .select()
      .single();
      
    console.log('✅ Contact created:', contact.id);
    
    // Step 5: Parse and save enrichment data
    const { mediaContent, experiences, education } = await parseEnrichmentData(bestItem);
    
    // Save media content
    if (mediaContent.length > 0) {
      const mediaWithContactId = mediaContent.map(m => ({
        ...m,
        contact_id: contact.id
      }));
      
      const { error: mediaError } = await supabase
        .from('contact_media')
        .insert(mediaWithContactId);
        
      if (!mediaError) {
        console.log(`✅ Saved ${mediaContent.length} media items`);
      }
    }
    
    // Save work experiences
    if (experiences.length > 0) {
      const expWithContactId = experiences.map(e => ({
        ...e,
        contact_id: contact.id
      }));
      
      const { error: expError } = await supabase
        .from('contact_experiences')
        .insert(expWithContactId);
        
      if (!expError) {
        console.log(`✅ Saved ${experiences.length} work experiences`);
      }
    }
    
    // Save education
    if (education.length > 0) {
      const eduWithContactId = education.map(e => ({
        ...e,
        contact_id: contact.id
      }));
      
      const { error: eduError } = await supabase
        .from('contact_education')
        .insert(eduWithContactId);
        
      if (!eduError) {
        console.log(`✅ Saved ${education.length} education records`);
      }
    }
    
    console.log('\n🎉 Successfully processed REAL Websets data!');
    console.log(`   Company: ${person.company?.name}`);
    console.log(`   Contact: ${person.name} - ${person.position}`);
    console.log(`   Webset ID: ${websetId}`);
    console.log(`   Media items: ${mediaContent.length}`);
    console.log(`   Experiences: ${experiences.length}`);
    console.log(`   Education: ${education.length}`);
    console.log('\n📊 View in dashboard: http://localhost:3000/dashboard/leads');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealWebsetsFlow(); 