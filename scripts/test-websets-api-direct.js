#!/usr/bin/env node

/**
 * Test script that calls the REAL Websets API endpoint
 * /api/leads/enrich-websets
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_COMPANIES = [
  { 
    name: 'Anthropic',
    domain: 'anthropic.com',
    ip: '104.18.6.192'
  },
  { 
    name: 'OpenAI',
    domain: 'openai.com', 
    ip: '104.18.7.192'
  },
  {
    name: 'Perplexity',
    domain: 'perplexity.ai',
    ip: '172.66.40.125'
  }
];

async function createInitialVisit(company) {
  console.log(`\n📝 Creating user visit for ${company.name}...`);
  
  const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d';
  
  // Create user visit
  const visitId = crypto.randomUUID();
  const { data: visit, error } = await supabase
    .from('user_visits')
    .insert({
      id: visitId,
      workspace_id: workspaceId,
      ip_address: company.ip,
      page_url: 'https://split.dev/demo',
      referrer: 'https://perplexity.ai',
      utm_source: 'perplexity',
      utm_medium: 'ai',
      enrichment_status: 'pending',
      session_duration: 180,
      pages_viewed: 3,
      country: 'US',
      city: 'San Francisco'
    })
    .select()
    .single();
    
  if (error) {
    console.error('Visit creation error:', error);
    throw new Error(`Failed to create visit: ${error.message}`);
  }
    
  console.log(`✅ Visit created: ${visit.id}`);
  return visit;
}

async function enrichWithWebsets(userVisitId) {
  console.log(`\n🔍 Calling WEBSETS enrichment API for visit ${userVisitId}...`);
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/leads/enrich-websets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userVisitId,
        icpTitles: ['VP of Engineering', 'Chief Technology Officer', 'VP of Product', 'Head of AI']
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API call failed: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ Websets enrichment completed:', result.message || 'Success');
    
    if (result.leadId) {
      console.log(`   Lead ID: ${result.leadId}`);
    }
    
    if (result.company) {
      console.log(`   Company: ${result.company.name} (${result.company.domain})`);
    }
    
    if (result.contact) {
      console.log(`   Contact: ${result.contact.name}`);
      console.log(`   Title: ${result.contact.title}`);
      console.log(`   Email: ${result.contact.email}`);
      console.log(`   LinkedIn: ${result.contact.linkedinUrl}`);
      console.log(`   Confidence: ${(result.contact.confidence * 100).toFixed(0)}%`);
    }
    
    if (result.enrichment) {
      console.log(`   Enrichments: ${Object.keys(result.enrichment).length} data points`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Websets enrichment failed:', error.message);
    throw error;
  }
}

async function testWebsetsApiDirect() {
  console.log('🚀 REAL Websets API Test\n');
  console.log('This test uses the /api/leads/enrich-websets endpoint');
  console.log('which calls the ACTUAL Exa Websets API (requires Pro plan)');
  console.log('Make sure your dev server is running: pnpm dev');
  console.log('━'.repeat(60) + '\n');
  
  // Select company
  const companyIndex = process.argv[2] ? parseInt(process.argv[2]) - 1 : 0;
  const company = TEST_COMPANIES[companyIndex] || TEST_COMPANIES[0];
  
  console.log(`Testing with: ${company.name}`);
  
  try {
    // Create initial visit
    const visit = await createInitialVisit(company);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enrich with Websets
    await enrichWithWebsets(visit.id);
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📊 View results at: http://localhost:3000/dashboard/leads');
    console.log('\n💡 The lead should have:');
    console.log('   - Enhanced badge (from Websets)');
    console.log('   - Rich enrichment data');
    console.log('   - High confidence score');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure your dev server is running (pnpm dev)');
    console.log('   2. Check you have EXA_API_KEY in .env.local');
    console.log('   3. Ensure your Exa account has Pro plan for Websets');
    console.log('   4. Check server logs for detailed error messages');
  }
}

// Usage
console.log('Usage: node test-websets-api-direct.js [company]');
console.log('Companies:');
TEST_COMPANIES.forEach((c, i) => {
  console.log(`  ${i + 1}. ${c.name}`);
});
console.log('');

testWebsetsApiDirect().catch(console.error); 