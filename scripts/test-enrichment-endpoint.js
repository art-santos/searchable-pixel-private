#!/usr/bin/env node

/**
 * Test script that calls the enrichment endpoint directly
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEnrichmentEndpoint() {
  console.log('🚀 Testing Enrichment Endpoint with OpenAI\n');
  
  const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d'; // Origami Agents
  
  try {
    // Step 1: Create user visit with OpenAI IP
    const visitId = crypto.randomUUID();
    const { data: visit, error: visitError } = await supabase
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
        region: 'California',
        user_agent: 'Mozilla/5.0 (compatible; Test/1.0)'
      })
      .select()
      .single();
      
    if (visitError) {
      throw new Error(`Failed to create visit: ${visitError.message}`);
    }
      
    console.log('✅ Visit created:', visitId);
    
    // Step 2: Call enrichment endpoint
    console.log('\n🔄 Calling enrichment endpoint...');
    console.log('   POST http://localhost:3000/api/leads/enrich-websets');
    console.log('   Body:', JSON.stringify({ visitId }, null, 2));
    
    const enrichResponse = await fetch('http://localhost:3000/api/leads/enrich-websets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitId: visitId
      })
    });

    const responseText = await enrichResponse.text();
    let enrichResult;
    
    try {
      enrichResult = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!enrichResponse.ok) {
      console.error('❌ Enrichment failed:', enrichResult);
      throw new Error(`Enrichment failed: ${enrichResult.error || responseText}`);
    }

    console.log('\n📦 ENRICHMENT RESULT:');
    console.log('=====================================');
    console.log(JSON.stringify(enrichResult, null, 2));
    console.log('=====================================');
    
    if (enrichResult.success && enrichResult.contact) {
      console.log(`\n✅ Successfully enriched:`);
      console.log(`   Lead ID: ${enrichResult.leadId}`);
      console.log(`   Webset ID: ${enrichResult.websetId}`);
      console.log(`   Company: ${enrichResult.company.name}`);
      console.log(`   Contact: ${enrichResult.contact.name} - ${enrichResult.contact.title}`);
      console.log(`   Email: ${enrichResult.contact.email}`);
      console.log(`   LinkedIn: ${enrichResult.contact.linkedinUrl}`);
      console.log(`   Confidence: ${(enrichResult.contact.confidence * 100).toFixed(0)}%`);
      
      if (enrichResult.contact.enrichment) {
        console.log('\n📋 Enrichment Data Keys:');
        console.log('   ', Object.keys(enrichResult.contact.enrichment).join(', '));
      }
      
      // Query database to verify data was saved
      const { data: savedLead } = await supabase
        .from('leads')
        .select(`
          *,
          contacts (
            *,
            contact_media (count),
            contact_experiences (count),
            contact_education (count)
          )
        `)
        .eq('id', enrichResult.leadId)
        .single();
        
      if (savedLead) {
        console.log('\n💾 Database Verification:');
        console.log(`   Lead saved: ✅`);
        console.log(`   Contact saved: ${savedLead.contacts ? '✅' : '❌'}`);
        if (savedLead.contacts?.[0]) {
          console.log(`   Media items: ${savedLead.contacts[0].contact_media?.[0]?.count || 0}`);
          console.log(`   Experiences: ${savedLead.contacts[0].contact_experiences?.[0]?.count || 0}`);
          console.log(`   Education: ${savedLead.contacts[0].contact_education?.[0]?.count || 0}`);
        }
      }
      
      console.log('\n📊 View in dashboard: http://localhost:3000/dashboard/leads');
    } else {
      console.log('\n❌ Enrichment was not successful:');
      console.log(`   Status: ${enrichResult.status}`);
      console.log(`   Error: ${enrichResult.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testEnrichmentEndpoint(); 