#!/usr/bin/env node

/**
 * Multi-Contact Enrichment Test - Uses regular Exa search to get multiple contacts
 * This demonstrates enriching multiple contacts from a single company visit
 */

require('ts-node/register');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function runMultiContactEnrichment() {
  console.log('🚀 Multi-Contact Enrichment Test\n');
  
  // Check environment
  const requiredVars = ['IPINFO_TOKEN', 'EXA_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.log('\n💡 Add these to your .env.local file');
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
  
  // Test with Mercury
  const testCase = {
    company: {
      name: 'Mercury',
      domain: 'mercury.com',
      city: 'New York',
      country: 'US',
      type: 'business'
    },
    icpDescription: 'Senior sales executives',
    page: 'https://split.dev/pricing',
    referrer: 'https://chat.openai.com'
  };
  
  console.log('📊 Test Case:');
  console.log(`   Company: ${testCase.company.name}`);
  console.log(`   Domain: ${testCase.company.domain}`);
  console.log(`   ICP: "${testCase.icpDescription}"`);
  console.log(`   Page: ${testCase.page}`);
  console.log(`   Source: ChatGPT\n`);
  
  try {
    // Step 1: Search for multiple contacts
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Step 1: Search for Multiple Contacts (Exa Search)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`Searching for: "${testCase.icpDescription}" at ${testCase.company.name}`);
    
    const searchResults = await exaClient.searchLinkedInByICP(
      testCase.company.name,
      testCase.icpDescription
    );
    
    console.log(`\nFound ${searchResults.length} LinkedIn profiles`);
    
    if (searchResults.length === 0) {
      console.log('❌ No profiles found');
      return;
    }
    
    // Get full content for top 3 profiles
    const topResults = searchResults.slice(0, 3);
    console.log(`\n📥 Fetching content for top ${topResults.length} profiles...`);
    
    const profileUrls = topResults.map(r => r.url);
    const contents = await exaClient.fetchContents(profileUrls);
    
    // Step 2: Process each candidate
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Step 2: Process All Candidates');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const candidates = [];
    
    for (let i = 0; i < topResults.length; i++) {
      const result = topResults[i];
      const content = contents[i];
      
      console.log(`\n👤 Candidate ${i + 1}:`);
      console.log('─'.repeat(40));
      
      // Parse basic info from content
      if (!content || !content.text) {
        console.log('⚠️  No content available');
        continue;
      }
      
      // Extract basic info from title and text
      const titleParts = (content.title || result.title || '').split(' – ');
      const name = titleParts[0]?.trim() || 'Unknown';
      const jobInfo = titleParts[1]?.trim() || '';
      
      // Simple title extraction
      let title = 'Unknown Title';
      if (jobInfo) {
        // Try to extract title from format "Title at Company"
        const atIndex = jobInfo.indexOf(' at ');
        if (atIndex > -1) {
          title = jobInfo.substring(0, atIndex).trim();
        } else {
          title = jobInfo;
        }
      }
      
      // Check if currently at company (simple text search)
      const companyVariations = [
        testCase.company.name,
        testCase.company.name.toLowerCase(),
        testCase.company.name.toUpperCase()
      ];
      
      const isAtCompany = companyVariations.some(variant => 
        content.text.includes(`at ${variant}`) || 
        content.text.includes(`${variant} ·`) ||
        content.text.includes(`– ${variant}`)
      );
      
      // Simple ICP scoring
      const icpWords = testCase.icpDescription.toLowerCase().split(' ');
      const textLower = (content.text + ' ' + content.title).toLowerCase();
      const icpMatches = icpWords.filter(word => textLower.includes(word)).length;
      const icpScore = icpMatches / icpWords.length;
      
      const confidence = (icpScore * 0.6) + (isAtCompany ? 0.4 : 0);
      
      const candidate = {
        name,
        title,
        company: testCase.company.name,
        titleMatchScore: icpScore,
        companyMatchScore: isAtCompany ? 1 : 0,
        confidenceScore: confidence,
        linkedinUrl: result.url,
        searchScore: result.score || 0.5,
        rawContent: content // Store raw content
      };
      
      console.log(`Name: ${candidate.name}`);
      console.log(`Title: ${candidate.title || 'Unknown'}`);
      console.log(`LinkedIn: ${candidate.linkedinUrl}`);
      console.log(`Title Match: ${(candidate.titleMatchScore * 100).toFixed(0)}%`);
      console.log(`Company Match: ${candidate.companyMatchScore ? 'Yes' : 'No'}`);
      console.log(`Confidence: ${(candidate.confidenceScore * 100).toFixed(0)}%`);
      
      // Show raw data snippet
      console.log(`\nRaw Data Preview:`);
      console.log(JSON.stringify({
        id: result.id,
        url: result.url,
        score: result.score,
        title: result.title,
        text_preview: content.text?.substring(0, 200) + '...'
      }, null, 2));
      
      candidates.push(candidate);
    }
    
    // Step 3: Save to Database
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 Step 3: Save All Candidates to Database');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d'; // Origami Agents
    console.log(`🏢 Using workspace: Origami Agents (${workspaceId})\n`);
    
    // Create user visit
    const visitId = crypto.randomUUID();
    await supabase.from('user_visits').insert({
      id: visitId,
      workspace_id: workspaceId,
      ip_address: '162.255.119.254', // Mercury IP
      page_url: testCase.page,
      referrer: testCase.referrer,
      utm_source: 'chatgpt',
      utm_medium: 'ai',
      attribution_source: 'chatgpt',
      enrichment_status: 'completed',
      session_duration: 180,
      pages_viewed: 3,
      country: testCase.company.country,
      city: testCase.company.city,
      created_at: new Date().toISOString()
    });
    
    console.log(`✅ Visit created: ${visitId}`);
    
    // Process each candidate
    let savedCount = 0;
    for (const candidate of candidates) {
      console.log(`\n💾 Saving ${candidate.name}...`);
      
      // Generate email
      const emailPatterns = emailGenerator.generateEmailPatterns(
        candidate.name,
        testCase.company.domain
      );
      const verifiedEmail = await emailGenerator.verifyFirst(emailPatterns);
      const email = verifiedEmail?.email || emailPatterns[0];
      
      // Create lead with raw data
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          workspace_id: workspaceId,
          user_visit_id: visitId,
          company_name: testCase.company.name,
          company_domain: testCase.company.domain,
          company_city: testCase.company.city,
          company_country: testCase.company.country,
          company_type: testCase.company.type,
          confidence_score: candidate.confidenceScore,
          lead_source: 'exa_search',
          exa_raw: {
            searchScore: candidate.searchScore,
            rawContent: candidate.rawContent,
            titleMatchDetails: {
              score: candidate.titleMatchScore,
              title: candidate.title
            }
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (leadError) {
        console.error(`❌ Failed to save lead:`, leadError.message);
        continue;
      }
      
      console.log(`✅ Lead saved: ${lead.id}`);
      
      // Create contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          lead_id: lead.id,
          name: candidate.name,
          title: candidate.title || 'Unknown',
          email: email,
          linkedin_url: candidate.linkedinUrl,
          headline: candidate.headline,
          summary: candidate.summary,
          current_company: testCase.company.name,
          current_position: candidate.title,
          connection_count: candidate.connectionCount,
          last_activity_date: candidate.lastActivityDate,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (contactError) {
        console.error(`❌ Failed to save contact:`, contactError.message);
      } else {
        console.log(`✅ Contact saved: ${contact.id}`);
        savedCount++;
      }
    }
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Multi-Contact Enrichment Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 Summary:');
    console.log(`   Workspace: Origami Agents (${workspaceId})`);
    console.log(`   Company: ${testCase.company.name} (${testCase.company.domain})`);
    console.log(`   Profiles Found: ${searchResults.length}`);
    console.log(`   Candidates Processed: ${candidates.length}`);
    console.log(`   Leads Saved: ${savedCount}`);
    console.log(`   Attribution: ChatGPT (AI-attributed lead)`);
    
    console.log('\n📄 Raw Data Storage:');
    console.log('   Each lead contains:');
    console.log('   - Search score from Exa');
    console.log('   - Full LinkedIn content');
    console.log('   - Title match details');
    console.log('   - All stored in exa_raw field');
    
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
runMultiContactEnrichment().catch(console.error); 