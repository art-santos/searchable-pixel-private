#!/usr/bin/env node

/**
 * Test script that calls the /api/leads/enrich-now endpoint
 * This uses the existing API that handles websets enrichment
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

async function createInitialLead(company) {
  console.log(`\n📝 Creating initial lead for ${company.name}...`);
  
  const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d';
  
  // Create user visit
  const visitId = crypto.randomUUID();
  const { data: visit } = await supabase
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
    
  // Create lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      user_visit_id: visitId,
      company_name: company.name,
      company_domain: company.domain,
      company_city: 'San Francisco',
      company_country: 'US',
      is_ai_attributed: true,
      ai_source: 'perplexity',
      lead_source: 'exa_webset',
      enrichment_quality: 'basic'
    })
    .select()
    .single();
    
  if (leadError) {
    console.error('Lead creation error:', leadError);
    throw new Error(`Failed to create lead: ${leadError.message}`);
  }
    
  console.log(`✅ Lead created: ${lead.id}`);
  return lead;
}

async function enrichLead(leadId) {
  console.log(`\n🔍 Calling enrichment API for lead ${leadId}...`);
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/leads/enrich-now`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ leadId })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API call failed: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ Enrichment completed:', result.message);
    
    if (result.contacts) {
      console.log(`   Found ${result.contacts.length} contacts`);
      result.contacts.forEach(c => {
        console.log(`   - ${c.name} (${c.title})`);
      });
    }
    
    if (result.mediaCount) {
      console.log(`   Created ${result.mediaCount} media items`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Enrichment failed:', error.message);
    throw error;
  }
}

async function testApiEnrichment() {
  console.log('🚀 API Enrichment Test\n');
  console.log('This test uses the /api/leads/enrich-now endpoint');
  console.log('Make sure your dev server is running: pnpm dev');
  console.log('━'.repeat(60) + '\n');
  
  // Select company
  const companyIndex = process.argv[2] ? parseInt(process.argv[2]) - 1 : 0;
  const company = TEST_COMPANIES[companyIndex] || TEST_COMPANIES[0];
  
  console.log(`Testing with: ${company.name}`);
  
  try {
    // Create initial lead
    const lead = await createInitialLead(company);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enrich the lead
    await enrichLead(lead.id);
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📊 View results at: http://localhost:3000/dashboard/leads');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Your dev server is running (pnpm dev)');
    console.log('   2. You have valid API keys in .env.local');
    console.log('   3. Your Exa account has Pro plan for Websets');
  }
}

// Usage
console.log('Usage: node test-api-enrichment.js [company]');
console.log('Companies:');
TEST_COMPANIES.forEach((c, i) => {
  console.log(`  ${i + 1}. ${c.name}`);
});
console.log('');

testApiEnrichment().catch(console.error); 