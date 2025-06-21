#!/usr/bin/env node

/**
 * Test the full production flow: tracking → enrichment → dashboard
 */

require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

async function testProductionFlow() {
  console.log('🚀 Testing Full Production Flow\n');
  
  const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d'; // Origami Agents
  const visitorId = crypto.randomUUID();
  
  try {
    // Step 1: Simulate tracking pixel hit
    console.log('📡 Step 1: Simulating tracking pixel hit...');
    console.log('   Visitor ID:', visitorId);
    console.log('   Workspace ID:', workspaceId);
    console.log('   Simulated IP: OpenAI (104.18.7.192)');
    
    const trackingData = {
      v: visitorId,
      w: workspaceId,
      u: 'https://originamiagents.com/ai-solutions?utm_source=perplexity&utm_medium=ai',
      r: 'https://perplexity.ai',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      tz: 'America/Los_Angeles',
      t: new Date().toISOString(),
      vp: { w: 1920, h: 1080 },
      sp: { w: 1920, h: 1080 }
    };
    
    const trackResponse = await fetch('http://localhost:3000/api/tracking/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '104.18.7.192' // Simulate OpenAI IP
      },
      body: JSON.stringify(trackingData)
    });

    if (!trackResponse.ok) {
      const error = await trackResponse.text();
      throw new Error(`Tracking failed: ${error}`);
    }

    console.log('✅ Tracking successful!');
    
    // Step 2: Wait for enrichment to process
    console.log('\n⏳ Step 2: Waiting for enrichment to process...');
    console.log('   This may take 30-45 seconds for Websets API...');
    
    // Poll for lead creation (max 60 seconds)
    const startTime = Date.now();
    const timeout = 60000; // 60 seconds
    let leadFound = false;
    let leadData = null;
    
    while (!leadFound && (Date.now() - startTime < timeout)) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
      
      try {
        // Query leads created in the last minute
        const leadsResponse = await fetch(`http://localhost:3000/api/leads?workspaceId=${workspaceId}`, {
          headers: {
            'Cookie': 'your-auth-cookie-here' // You'll need to add auth
          }
        });
        
        if (leadsResponse.ok) {
          const { leads } = await leadsResponse.json();
          // Find lead created in the last minute
          const recentLead = leads.find(lead => {
            const createdAt = new Date(lead.timestamp);
            const minuteAgo = new Date(Date.now() - 60000);
            return createdAt > minuteAgo;
          });
          
          if (recentLead) {
            leadFound = true;
            leadData = recentLead;
            console.log('✅ Lead found!');
          } else {
            console.log('   Still processing...');
          }
        }
      } catch (error) {
        console.log('   Waiting for lead creation...');
      }
    }
    
    if (leadFound && leadData) {
      console.log('\n🎉 Step 3: Lead Successfully Created and Enriched!');
      console.log('   Lead ID:', leadData.id);
      console.log('   Company:', leadData.company);
      console.log('   Contact:', leadData.fullName, '-', leadData.jobTitle);
      console.log('   Email:', leadData.email);
      console.log('   LinkedIn:', leadData.linkedinUrl);
      console.log('   Confidence:', leadData.confidence);
      console.log('   Attribution:', leadData.model);
      
      if (leadData.exa_webset_id) {
        console.log('\n✨ Enhanced with Websets:');
        console.log('   Webset ID:', leadData.exa_webset_id);
        
        if (leadData.enrichment_data) {
          console.log('   Enrichment Keys:', Object.keys(leadData.enrichment_data));
          
          if (leadData.enrichment_data.focus_areas) {
            console.log('\n   Current Focus Areas:');
            console.log('   ', leadData.enrichment_data.focus_areas.substring(0, 150) + '...');
          }
        }
      }
      
      console.log('\n📊 View in dashboard: http://localhost:3000/dashboard/leads');
    } else {
      console.log('\n⚠️  Timeout: Lead creation took too long');
      console.log('   This could mean:');
      console.log('   - The IP was not detected as a business IP');
      console.log('   - The enrichment failed');
      console.log('   - The Websets API is slow');
      console.log('\n   Check the server logs for more details');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Note about authentication
console.log('⚠️  Note: The leads API requires authentication.');
console.log('   For full testing, you need to:');
console.log('   1. Be logged in as an admin user');
console.log('   2. Copy your auth cookie from the browser');
console.log('   3. Add it to the script\n');

testProductionFlow(); 