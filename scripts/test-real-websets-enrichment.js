#!/usr/bin/env node

/**
 * Test script for REAL Websets enrichment with comprehensive data
 * This actually calls the Exa Websets API to get real enriched data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const TEST_COMPANIES = [
  { 
    name: 'Anthropic',
    domain: 'anthropic.com',
    ip: '104.18.6.192',
    titles: ['VP of Engineering', 'Chief Technology Officer', 'Head of AI Research']
  },
  { 
    name: 'OpenAI',
    domain: 'openai.com', 
    ip: '104.18.7.192',
    titles: ['VP of Product', 'Chief Product Officer', 'Head of Product']
  },
  {
    name: 'Stripe',
    domain: 'stripe.com',
    ip: '54.187.216.72',
    titles: ['VP of Sales', 'Chief Revenue Officer', 'Head of Sales']
  }
];

async function createEnhancedWebset(company) {
  console.log(`\n🔍 Creating Enhanced Webset for ${company.name}\n`);
  
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error('EXA_API_KEY not found in environment');
  }

  // Create webset with comprehensive enrichments
  const websetBody = {
    search: {
      query: `${company.titles.join(' OR ')} at ${company.name} site:linkedin.com`,
      count: 3,
      entity: { type: 'person' }
    },
    enrichments: [
      // Basic info
      {
        description: 'Full LinkedIn profile URL',
        format: 'text'
      },
      {
        description: 'Current job title and company name',
        format: 'text'
      },
      {
        description: 'Profile picture URL from LinkedIn',
        format: 'text'
      },
      {
        description: 'Professional headline and summary',
        format: 'text'
      },
      // Recent activity
      {
        description: 'Three most recent LinkedIn posts or articles published by this person with titles, dates and URLs',
        format: 'text'
      },
      {
        description: 'Recent thought leadership content (articles, blog posts, interviews) published in the last 6 months with titles, publication names and URLs',
        format: 'text'
      },
      {
        description: 'Recent press quotes or media mentions in the last 6 months with publication names, dates and quotes',
        format: 'text'
      },
      {
        description: 'Patents filed or awarded to this person with titles and filing dates',
        format: 'text'
      },
      {
        description: 'Speaking engagements, podcasts, or webinars in the last year with event names, dates and topics',
        format: 'text'
      },
      {
        description: 'Awards, recognitions, or achievements with organization names and dates',
        format: 'text'
      }
    ]
  };

  console.log('📤 Sending webset request to Exa API...');
  
  const createResponse = await fetch('https://api.exa.ai/websets/v0/websets/', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'Split-Leads/1.1'
    },
    body: JSON.stringify(websetBody)
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    console.error('❌ Failed to create webset:', error);
    
    if (createResponse.status === 401 && error.includes('does not have access')) {
      console.error('\n⚠️  Your Exa account needs Pro plan access to use Websets API');
      console.error('   Please upgrade at: https://dashboard.exa.ai/billing\n');
    }
    
    throw new Error(`Webset creation failed: ${createResponse.status}`);
  }

  const { id: websetId } = await createResponse.json();
  console.log(`✅ Webset created: ${websetId}`);
  
  return websetId;
}

async function waitForWebsetCompletion(websetId) {
  console.log('\n⏳ Waiting for webset to complete...');
  
  const apiKey = process.env.EXA_API_KEY;
  const maxWaitTime = 60000; // 60 seconds
  const pollInterval = 2000; // 2 seconds
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const statusResponse = await fetch(
      `https://api.exa.ai/websets/v0/websets/${websetId}`,
      {
        headers: {
          'x-api-key': apiKey,
          'User-Agent': 'Split-Leads/1.1'
        }
      }
    );
    
    if (!statusResponse.ok) {
      throw new Error(`Failed to check webset status: ${statusResponse.status}`);
    }
    
    const status = await statusResponse.json();
    console.log(`   Status: ${status.status}`);
    
    if (status.status === 'idle' || status.status === 'completed') {
      console.log('✅ Webset completed!');
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  console.log('⚠️  Webset timed out, attempting to get partial results...');
  return false;
}

async function getWebsetResults(websetId) {
  console.log('\n📥 Fetching webset results...');
  
  const apiKey = process.env.EXA_API_KEY;
  
  const itemsResponse = await fetch(
    `https://api.exa.ai/websets/v0/websets/${websetId}/items?limit=10`,
    {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': 'Split-Leads/1.1'
      }
    }
  );
  
  if (!itemsResponse.ok) {
    throw new Error(`Failed to fetch items: ${itemsResponse.status}`);
  }
  
  const { data: items } = await itemsResponse.json();
  console.log(`✅ Retrieved ${items.length} results`);
  
  return items;
}

async function saveEnrichedLeads(company, items) {
  console.log(`\n💾 Saving ${items.length} enriched leads to database...`);
  
  const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d'; // Origami Agents
  
  for (const item of items) {
    // Extract person data
    const person = item.properties?.person || {};
    const enrichments = item.enrichments || [];
    
    // Parse enrichment results
    let linkedinPosts = [];
    let thoughtLeadership = [];
    let pressQuotes = [];
    let patents = [];
    let speakingEngagements = [];
    let awards = [];
    
    enrichments.forEach((e, idx) => {
      if (e.result) {
        // Parse text enrichments into structured data
        const result = e.result;
        
        if (e.description?.includes('LinkedIn posts')) {
          // Parse LinkedIn posts from text
          const lines = result.split('\n').filter(l => l.trim());
          linkedinPosts = lines.map(line => ({
            title: line,
            url: '#',
            date: new Date().toISOString(),
            content: line
          }));
        } else if (e.description?.includes('thought leadership')) {
          // Parse thought leadership content
          const lines = result.split('\n').filter(l => l.trim());
          thoughtLeadership = lines.map(line => ({
            title: line,
            type: 'article',
            url: '#',
            date: new Date().toISOString(),
            description: line
          }));
        } else if (e.description?.includes('press quotes')) {
          // Parse press mentions
          const lines = result.split('\n').filter(l => l.trim());
          pressQuotes = lines.map(line => ({
            title: 'Press Mention',
            quote: line,
            url: '#',
            date: new Date().toISOString(),
            publication: 'Media'
          }));
        } else if (e.description?.includes('Patents')) {
          // Parse patents
          const lines = result.split('\n').filter(l => l.trim());
          patents = lines.map(line => ({
            title: line,
            url: '#',
            date: new Date().toISOString()
          }));
        } else if (e.description?.includes('Speaking')) {
          // Parse speaking engagements
          const lines = result.split('\n').filter(l => l.trim());
          speakingEngagements = lines.map(line => ({
            title: line,
            type: 'speaking',
            url: '#',
            date: new Date().toISOString()
          }));
        } else if (e.description?.includes('Awards')) {
          // Parse awards
          const lines = result.split('\n').filter(l => l.trim());
          awards = lines.map(line => ({
            title: line,
            type: 'award',
            date: new Date().toISOString()
          }));
        }
      }
    });
    
    // Create user visit
    const visitId = crypto.randomUUID();
    await supabase.from('user_visits').insert({
      id: visitId,
      workspace_id: workspaceId,
      ip_address: company.ip,
      page_url: 'https://split.dev/demo',
      referrer: 'https://chat.openai.com',
      utm_source: 'chatgpt',
      utm_medium: 'ai',
      enrichment_status: 'completed',
      session_duration: 300,
      pages_viewed: 4,
      country: 'US',
      city: 'San Francisco'
    });
    
    // Create lead
    const { data: lead } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        user_visit_id: visitId,
        company_name: company.name,
        company_domain: company.domain,
        company_city: 'San Francisco',
        company_country: 'US',
        is_ai_attributed: true,
        ai_source: 'chatgpt',
        lead_source: 'exa_webset',
        enrichment_quality: 'enhanced',
        exa_webset_id: item.websetId,
        exa_raw: item,
        public_signals_count: linkedinPosts.length + thoughtLeadership.length + pressQuotes.length
      })
      .select()
      .single();
    
    if (!lead) continue;
    
    // Create contact
    const { data: contact } = await supabase
      .from('contacts')
      .insert({
        lead_id: lead.id,
        name: person.name || item.title || 'Unknown',
        title: enrichments[1]?.result || person.title || 'Unknown Title',
        email: `${(person.name || 'contact').toLowerCase().replace(' ', '.')}@${company.domain}`,
        linkedin_url: enrichments[0]?.result || person.linkedinUrl || '',
        picture_url: enrichments[2]?.result || person.pictureUrl || '',
        headline: enrichments[3]?.result?.split('\n')[0] || person.headline || '',
        summary: enrichments[3]?.result || '',
        enrichment_depth: 'enhanced',
        confidence_score: item.score || 0.85
      })
      .select()
      .single();
    
    if (!contact) continue;
    
    // Save media content
    const mediaItems = [];
    
    // LinkedIn posts
    linkedinPosts.forEach(post => {
      if (post && typeof post === 'object') {
        mediaItems.push({
          contact_id: contact.id,
          media_type: 'linkedin_post',
          title: post.title || 'LinkedIn Post',
          url: post.url || '#',
          description: post.content || post.description || '',
          published_date: post.date || new Date().toISOString()
        });
      }
    });
    
    // Thought leadership
    thoughtLeadership.forEach(item => {
      if (item && typeof item === 'object') {
        mediaItems.push({
          contact_id: contact.id,
          media_type: item.type || 'article',
          title: item.title || 'Thought Leadership',
          url: item.url || '#',
          description: item.description || '',
          published_date: item.date || new Date().toISOString(),
          platform: item.publication || item.platform
        });
      }
    });
    
    // Press mentions
    pressQuotes.forEach(quote => {
      if (quote && typeof quote === 'object') {
        mediaItems.push({
          contact_id: contact.id,
          media_type: 'news',
          title: quote.title || 'Press Mention',
          url: quote.url || '#',
          description: quote.quote || quote.description || '',
          published_date: quote.date || new Date().toISOString(),
          platform: quote.publication
        });
      }
    });
    
    // Patents
    patents.forEach(patent => {
      if (patent && typeof patent === 'object') {
        mediaItems.push({
          contact_id: contact.id,
          media_type: 'patent',
          title: patent.title || 'Patent',
          url: patent.url || '#',
          description: patent.description || '',
          published_date: patent.date || new Date().toISOString()
        });
      }
    });
    
    if (mediaItems.length > 0) {
      await supabase.from('contact_media').insert(mediaItems);
      console.log(`   ✅ Saved ${mediaItems.length} media items for ${person.name || 'Unknown'}`);
    }
    
    console.log(`   ✅ Lead created: ${person.name || 'Unknown'} - ${company.name}`);
  }
}

async function testRealWebsetsEnrichment() {
  console.log('🚀 Real Websets Enrichment Test\n');
  console.log('This test uses the ACTUAL Exa Websets API to get real enriched data');
  console.log('━'.repeat(60) + '\n');
  
  // Select company to test
  const companyIndex = process.argv[2] ? parseInt(process.argv[2]) - 1 : 0;
  const company = TEST_COMPANIES[companyIndex] || TEST_COMPANIES[0];
  
  console.log(`Testing with: ${company.name}`);
  console.log(`Target titles: ${company.titles.join(', ')}\n`);
  
  try {
    // Create webset
    const websetId = await createEnhancedWebset(company);
    
    // Wait for completion
    await waitForWebsetCompletion(websetId);
    
    // Get results
    const items = await getWebsetResults(websetId);
    
    // Display results
    console.log('\n📊 Results Summary:');
    items.forEach((item, idx) => {
      const person = item.properties?.person || {};
      console.log(`\n${idx + 1}. ${person.name || item.title || 'Unknown'}`);
      console.log(`   Score: ${(item.score || 0).toFixed(2)}`);
      console.log(`   Enrichments: ${item.enrichments?.length || 0}`);
    });
    
    // Save to database
    await saveEnrichedLeads(company, items);
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📊 View results at: http://localhost:3000/dashboard/leads');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.message.includes('Pro plan')) {
      console.log('\n💡 To use Websets API:');
      console.log('   1. Go to https://dashboard.exa.ai/billing');
      console.log('   2. Upgrade to Pro plan');
      console.log('   3. Run this test again');
    }
  }
}

// Usage instructions
console.log('Usage: node test-real-websets-enrichment.js [company]');
console.log('Companies:');
TEST_COMPANIES.forEach((c, i) => {
  console.log(`  ${i + 1}. ${c.name}`);
});
console.log('');

testRealWebsetsEnrichment().catch(console.error); 