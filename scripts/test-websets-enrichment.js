#!/usr/bin/env node

/**
 * Websets Enrichment Test - Uses Exa Websets API for multiple contact enrichment
 * This creates a webset with enrichments and saves all results to the database
 */

require('ts-node/register');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function runWebsetsEnrichment() {
  console.log('🚀 Websets Enrichment Test with Multiple Contacts\n');
  
  // Check environment
  const requiredVars = ['IPINFO_TOKEN', 'EXA_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.log('\n💡 To get full results, you need:');
    console.log('1. Create a .env.local file with your API keys');
    console.log('2. Get IPInfo token from: https://ipinfo.io/account/token');
    console.log('3. Get Exa API key from: https://dashboard.exa.ai/api-keys');
    console.log('   ⚠️  Note: Websets API requires Exa Pro plan');
    process.exit(1);
  }
  
  // Import enrichment modules
  const { ipinfoClient } = require('../src/lib/enrichment/ipinfo-client');
  const { exaWebsetsClient } = require('../src/lib/enrichment/exa-websets-client');
  const { emailGenerator } = require('../src/lib/enrichment/email-generator');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test case - using a known working company
  const testCase = {
    ip: '104.16.123.96', // Fallback IP
    expectedCompany: 'Mercury',
    companyOverride: { // Direct company data to bypass IP lookup
      name: 'Mercury',
      domain: 'mercury.com',
      city: 'New York',
      country: 'US',
      type: 'business'
    },
    icpTitles: ['Senior Sales Executive', 'VP Sales', 'Director of Sales', 'Sales Manager'],
    page: 'https://split.dev/pricing',
    referrer: 'https://chat.openai.com'
  };
  
  console.log('📊 Test Case:');
  console.log(`   IP: ${testCase.ip}`);
  console.log(`   Expected: ${testCase.expectedCompany}`);
  console.log(`   ICP Titles: ${testCase.icpTitles.join(', ')}`);
  console.log(`   Page: ${testCase.page}`);
  console.log(`   Source: ChatGPT\n`);
  
  try {
    // Step 1: IP → Company
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Step 1: IP → Company (IPInfo)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let company;
    try {
      company = await ipinfoClient.lookup(testCase.ip);
    } catch (error) {
      console.log('⚠️  IPInfo lookup failed, using override company data');
    }
    
    if (!company && testCase.companyOverride) {
      console.log('✅ Using override company data');
      company = testCase.companyOverride;
    } else if (!company) {
      console.log('❌ No company found and no override provided');
      process.exit(1);
    }
    
    console.log(`✅ Company: ${company.name}`);
    console.log(`   Domain: ${company.domain}`);
    console.log(`   Location: ${company.city}, ${company.country}`);
    console.log(`   Type: ${company.type || 'Business'}\n`);
    
    // Step 2: Create Webset Search
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Step 2: Create Webset Search (Exa Websets API)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`Creating webset for: "${testCase.icpTitles.join(', ')}" at ${company.name}`);
    
    let websetId;
    try {
      websetId = await exaWebsetsClient.createWebsetSearch(
        company.name,
        testCase.icpTitles,
        company.city
      );
      console.log(`✅ Webset created: ${websetId}\n`);
    } catch (error) {
      if (error.message.includes('Pro plan')) {
        console.error('❌ Websets API requires Exa Pro plan access');
        console.log('\n💡 Alternative: Using regular search API instead...\n');
        
        // Fall back to regular search for demo
        console.log('⚠️  Demo mode: Creating simulated results');
        await createSimulatedResults(supabase, company, testCase);
        return;
      }
      throw error;
    }
    
    // Step 3: Poll for Results
    console.log('⏳ Polling for webset results (up to 10 seconds)...');
    const items = await exaWebsetsClient.pollWebsetResults(websetId);
    
    console.log(`\n✅ Found ${items.length} candidates!\n`);
    
    // Step 4: Process All Results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Step 3: Process All Candidates');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Display raw data for the first 3 items
    const candidatesToProcess = items.slice(0, 3);
    
    candidatesToProcess.forEach((item, index) => {
      console.log(`\n📄 Candidate ${index + 1} - Raw Data:`);
      console.log('─'.repeat(40));
      console.log(JSON.stringify(item, null, 2));
      console.log('─'.repeat(40));
    });
    
    // Step 5: Save to Database
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 Step 4: Save All Candidates to Database');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d'; // Origami Agents
    console.log(`🏢 Using workspace: Origami Agents (${workspaceId})\n`);
    
    // Create user visit
    const visitId = crypto.randomUUID();
    await supabase.from('user_visits').insert({
      id: visitId,
      workspace_id: workspaceId,
      ip_address: testCase.ip,
      page_url: testCase.page,
      referrer: testCase.referrer,
      utm_source: 'chatgpt',
      utm_medium: 'ai',
      attribution_source: 'chatgpt',
      enrichment_status: 'completed',
      session_duration: 180,
      pages_viewed: 3,
      country: company.country || 'US',
      city: company.city || 'Unknown',
      region: company.region || 'Unknown',
      created_at: new Date().toISOString()
    });
    
    console.log(`✅ Visit created: ${visitId}`);
    
    // Process each candidate
    for (let i = 0; i < candidatesToProcess.length; i++) {
      const item = candidatesToProcess[i];
      console.log(`\n👤 Processing Candidate ${i + 1}:`);
      
      // Extract contact info from webset item
      const contact = extractContactFromWebsetItem(item, company.name);
      
      if (!contact.name) {
        console.log('   ⚠️  Skipping - no name found');
        continue;
      }
      
      console.log(`   Name: ${contact.name}`);
      console.log(`   Title: ${contact.title}`);
      console.log(`   LinkedIn: ${contact.linkedinUrl}`);
      
      // Generate email
      const emailPatterns = emailGenerator.generateEmailPatterns(contact.name, company.domain);
      const verifiedEmail = await emailGenerator.verifyFirst(emailPatterns);
      const email = verifiedEmail?.email || emailPatterns[0];
      console.log(`   Email: ${email}`);
      
      // Create lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          workspace_id: workspaceId,
          user_visit_id: visitId,
          company_name: company.name,
          company_domain: company.domain,
          company_city: company.city || 'Unknown',
          company_country: company.country || 'US',
          company_type: company.type || 'business',
          confidence_score: contact.confidence || 0.7,
          lead_source: 'exa_webset',
          exa_webset_id: websetId,
          exa_raw: item, // Store the entire raw webset item
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (leadError) {
        console.error(`   ❌ Failed to save lead:`, leadError);
        continue;
      }
      
      console.log(`   ✅ Lead saved: ${lead.id}`);
      
      // Create contact
      const { data: contactRecord, error: contactError } = await supabase
        .from('contacts')
        .insert({
          lead_id: lead.id,
          name: contact.name,
          title: contact.title,
          email: email,
          linkedin_url: contact.linkedinUrl,
          picture_url: contact.pictureUrl,
          headline: contact.headline,
          current_company: company.name,
          current_position: contact.title,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (contactError) {
        console.error(`   ❌ Failed to save contact:`, contactError);
      } else {
        console.log(`   ✅ Contact saved: ${contactRecord.id}`);
      }
    }
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Websets Enrichment Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 Summary:');
    console.log(`   Workspace: Origami Agents (${workspaceId})`);
    console.log(`   Company: ${company.name} (${company.domain})`);
    console.log(`   Webset ID: ${websetId}`);
    console.log(`   Candidates Found: ${items.length}`);
    console.log(`   Candidates Processed: ${candidatesToProcess.length}`);
    console.log(`   Attribution: ChatGPT (AI-attributed lead)`);
    
    console.log('\n🔗 View in dashboard:');
    console.log('   http://localhost:3000/dashboard/leads');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your API keys are valid');
    console.error('2. Ensure you have Exa Pro plan for Websets API');
    console.error('3. Check network connectivity');
  }
}

// Helper function to extract contact info from webset item
function extractContactFromWebsetItem(item, companyName) {
  let name = '';
  let title = '';
  let linkedinUrl = '';
  let pictureUrl = '';
  let headline = '';
  let confidence = 0.7;
  
  // Try to extract from properties.person first
  if (item.properties?.person) {
    const p = item.properties.person;
    name = p.name || '';
    title = p.headline || p.title || '';
    linkedinUrl = p.linkedinUrl || '';
    pictureUrl = p.pictureUrl || '';
    headline = p.headline || '';
  }
  
  // Fall back to top-level fields
  if (!name && item.title) name = item.title;
  if (!linkedinUrl && item.url) linkedinUrl = item.url;
  
  // Extract from enrichments if available
  if (item.enrichments && Array.isArray(item.enrichments)) {
    item.enrichments.forEach(e => {
      if (e.result && e.description?.includes('job title') && !title) {
        title = e.result;
      }
    });
  }
  
  // Calculate confidence based on available data
  if (item.score) confidence = item.score;
  
  return {
    name,
    title: title || 'Unknown Title',
    company: companyName,
    linkedinUrl: linkedinUrl || item.id || '',
    pictureUrl,
    headline: headline || title,
    confidence
  };
}

// Simulated results for demo purposes (when Pro plan not available)
async function createSimulatedResults(supabase, company, testCase) {
  console.log('Creating simulated webset results for demonstration...\n');
  
  const simulatedCandidates = [
    {
      name: 'John Smith',
      title: 'VP of Sales',
      linkedinUrl: 'https://linkedin.com/in/johnsmith',
      confidence: 0.85
    },
    {
      name: 'Sarah Johnson',
      title: 'Senior Sales Executive',
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
      confidence: 0.78
    },
    {
      name: 'Michael Chen',
      title: 'Director of Sales Operations',
      linkedinUrl: 'https://linkedin.com/in/michaelchen',
      confidence: 0.72
    }
  ];
  
  const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d';
  
  // Create visit
  const visitId = crypto.randomUUID();
  await supabase.from('user_visits').insert({
    id: visitId,
    workspace_id: workspaceId,
    ip_address: testCase.ip,
    page_url: testCase.page,
    referrer: testCase.referrer,
    utm_source: 'chatgpt',
    utm_medium: 'ai',
    attribution_source: 'chatgpt',
    enrichment_status: 'completed',
    session_duration: 180,
    pages_viewed: 3,
    country: company.country || 'US',
    city: company.city || 'Unknown',
    created_at: new Date().toISOString()
  });
  
  console.log(`✅ Visit created: ${visitId}`);
  
  // Create leads for each candidate
  for (const candidate of simulatedCandidates) {
    console.log(`\n👤 Creating lead for ${candidate.name}:`);
    
    const { data: lead } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        user_visit_id: visitId,
        company_name: company.name,
        company_domain: company.domain,
        company_city: company.city || 'Unknown',
        company_country: company.country || 'US',
        confidence_score: candidate.confidence,
        lead_source: 'websets_demo',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (lead) {
      console.log(`   ✅ Lead created: ${lead.id}`);
      
      // Create contact
      const email = `${candidate.name.toLowerCase().replace(' ', '.')}@${company.domain}`;
      await supabase.from('contacts').insert({
        lead_id: lead.id,
        name: candidate.name,
        title: candidate.title,
        email: email,
        linkedin_url: candidate.linkedinUrl,
        current_company: company.name,
        current_position: candidate.title,
        created_at: new Date().toISOString()
      });
      
      console.log(`   ✅ Contact created: ${candidate.name} - ${email}`);
    }
  }
  
  console.log('\n🎉 Demo leads created successfully!');
  console.log('\nView them at: http://localhost:3000/dashboard/leads');
}

// Run the test
runWebsetsEnrichment().catch(console.error); 