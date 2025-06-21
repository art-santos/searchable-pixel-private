#!/usr/bin/env node

/**
 * Full Enrichment Test Using Real APIs
 * This script demonstrates the complete enrichment pipeline with actual API calls
 */

// Set up TypeScript transpilation for imports
require('ts-node/register');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function runFullEnrichment() {
  console.log('🚀 Full Enrichment Test with Real APIs\n');
  
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
    console.log('\nOr run: bash scripts/setup-api-keys.sh');
    process.exit(1);
  }
  
  // Import enrichment modules
  const { ipinfoClient } = require('../src/lib/enrichment/ipinfo-client');
  const { exaClient } = require('../src/lib/enrichment/exa-client');
  const { emailGenerator } = require('../src/lib/enrichment/email-generator');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test case: Mercury.com visitor
  const testCase = {
    ip: '162.255.119.254',
    expectedCompany: 'Mercury',
    icpDescription: 'Senior sales executives',
    page: 'https://split.dev/pricing',
    referrer: 'https://chat.openai.com'
  };
  
  console.log('📊 Test Case:');
  console.log(`   IP: ${testCase.ip}`);
  console.log(`   Expected: ${testCase.expectedCompany}`);
  console.log(`   ICP: "${testCase.icpDescription}"`);
  console.log(`   Page: ${testCase.page}`);
  console.log(`   Source: ChatGPT\n`);
  
  try {
    // Step 1: IP → Company
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Step 1: IP → Company (IPInfo)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let company = await ipinfoClient.lookup(testCase.ip);
    
    if (!company) {
      console.log('❌ No company found for this IP (might be residential/ISP)');
      
      // Try another IP
      console.log('\nTrying Apple IP (17.0.0.1)...');
      const appleCompany = await ipinfoClient.lookup('17.0.0.1');
      if (appleCompany) {
        console.log(`✅ Found: ${appleCompany.name}`);
        console.log('Continuing with Apple for demonstration...\n');
        company = appleCompany; // Fix: assign directly instead of Object.assign
      } else {
        console.log('Unable to find any company. Check your IPInfo token.');
        process.exit(1);
      }
    }
    
    if (company) {
      console.log(`✅ Company found: ${company.name}`);
      console.log(`   Domain: ${company.domain}`);
      console.log(`   Location: ${company.city}, ${company.country}`);
      console.log(`   Type: ${company.type || 'Business'}\n`);
    }
    
    // Step 2: Company → Contacts
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Step 2: Company → Contacts (Exa Search)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`Searching for: "${testCase.icpDescription}" at ${company.name}`);
    
    const searchResults = await exaClient.searchLinkedInByICP(
      company.name,
      testCase.icpDescription
    );
    
    console.log(`\nFound ${searchResults.length} LinkedIn profiles`);
    
    if (searchResults.length === 0) {
      console.log('❌ No profiles found. The search might be too specific.');
      console.log('In production, we would try broader searches.');
      return;
    }
    
    // Get full content for profiles
    console.log('\nFetching full profile content...');
    const profileUrls = searchResults.slice(0, 3).map(r => r.url);
    const contents = await exaClient.fetchContents(profileUrls);
    
    // Score and select best match
    const bestContact = exaClient.scoreAndSelectBestContact(
      searchResults,
      contents,
      company.name,
      undefined,
      testCase.icpDescription
    );
    
    if (!bestContact) {
      console.log('❌ No contacts met the confidence threshold');
      return;
    }
    
    console.log(`\n✅ Best match found:`);
    console.log(`   Name: ${bestContact.name}`);
    console.log(`   Title: ${bestContact.title}`);
    console.log(`   LinkedIn: ${bestContact.linkedinUrl}`);
    console.log(`   Match Score: ${(bestContact.titleMatchScore * 100).toFixed(0)}%`);
    console.log(`   Confidence: ${(bestContact.confidenceScore * 100).toFixed(0)}%`);
    
    // Step 3: Contact → Email
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Step 3: Contact → Email');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const emailPatterns = emailGenerator.generateEmailPatterns(
      bestContact.name,
      company.domain
    );
    
    console.log('Generated email patterns:');
    emailPatterns.slice(0, 4).forEach(email => console.log(`   - ${email}`));
    
    console.log('\nVerifying emails...');
    const verifiedEmail = await emailGenerator.verifyFirst(emailPatterns);
    
    if (verifiedEmail && verifiedEmail.status === 'verified') {
      console.log(`✅ Verified email: ${verifiedEmail.email}`);
    } else {
      console.log('⚠️  Could not verify email (using first pattern)');
      verifiedEmail = { email: emailPatterns[0], status: 'unverified' };
    }
    
    // Step 4: Deep Enrichment
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔬 Step 4: Deep Enrichment (Optional)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Searching for additional insights...');
    const deepInsights = await exaClient.deepEnrichPerson(
      bestContact.name,
      company.name,
      bestContact.title
    );
    
    if (deepInsights) {
      console.log(`✅ Found additional insights:`);
      if (deepInsights.thoughtLeadership?.length > 0) {
        console.log(`   - ${deepInsights.thoughtLeadership.length} thought leadership pieces`);
      }
      if (deepInsights.pressQuotes?.length > 0) {
        console.log(`   - ${deepInsights.pressQuotes.length} press mentions`);
      }
      if (deepInsights.companyNews?.length > 0) {
        console.log(`   - ${deepInsights.companyNews.length} company news items`);
      }
    }
    
    // Step 5: Save to Database
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 Step 5: Save to Database');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d'; // Origami Agents
    console.log(`🏢 Using workspace: Origami Agents (${workspaceId})`)
    
    // Step 5a: Create user visit (no separate company record needed)
    const visitId = crypto.randomUUID();
    const { data: visit, error: visitError } = await supabase
      .from('user_visits')
      .insert({
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
      })
      .select()
      .single();
    
    if (visitError) {
      console.error('❌ Failed to save visit:', visitError);
      return;
    }
    console.log(`✅ Visit saved: ${visitId}`);
    
    // Step 5b: Create lead with company data
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
        confidence_score: bestContact.confidenceScore || 0.8,
        lead_source: 'exa_search',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (leadError) {
      console.error('❌ Failed to save lead:', leadError);
      return;
    }
    console.log(`✅ Lead saved: ${lead.id}`);
    
    // Step 5c: Create contact linked to lead
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        lead_id: lead.id,
        name: bestContact.name,
        title: bestContact.title,
        email: verifiedEmail.email,
        linkedin_url: bestContact.linkedinUrl,
        headline: bestContact.headline,
        summary: bestContact.summary,
        current_company: company.name,
        current_position: bestContact.title,
        connection_count: bestContact.connectionCount,
        last_activity_date: bestContact.lastActivityDate,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (contactError) {
      console.error('❌ Failed to save contact:', contactError);
      return;
    }
    console.log(`✅ Contact saved: ${contact.id}`);
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Enrichment Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 Summary:');
    console.log(`   Workspace: Origami Agents (${workspaceId})`);
    console.log(`   Company: ${company.name} (${company.domain})`);
    console.log(`   Contact: ${bestContact.name} - ${bestContact.title}`);
    console.log(`   Email: ${verifiedEmail.email}`);
    console.log(`   Attribution: ChatGPT (AI-attributed lead)`);
    console.log(`   Cost: $0.04`);
    
    console.log('\n🔗 View in dashboard:');
    console.log('   http://localhost:3000/dashboard/leads');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your API keys are valid');
    console.error('2. Ensure you have API credits/quota');
    console.error('3. Check network connectivity');
  }
}

// Run the test
runFullEnrichment().catch(console.error); 