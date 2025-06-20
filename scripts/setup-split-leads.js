#!/usr/bin/env node

/**
 * Split Leads Setup Script
 * Run this after adding your API keys to set up the enrichment pipeline
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupSplitLeads() {
  console.log('🚀 Setting up Split Leads...\n');

  // Check environment variables
  console.log('1. Checking environment variables...');
  const requiredEnvVars = ['IPINFO_TOKEN', 'EXA_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.log('\n📋 Add these to your .env.local file:');
    console.log('IPINFO_TOKEN=your_key_here  # Get from https://ipinfo.io/account/token');
    console.log('EXA_API_KEY=your_key_here     # Get from https://dashboard.exa.ai/api-keys');
    process.exit(1);
  }
  console.log('✅ All environment variables found\n');

  // Test API connections
  console.log('2. Testing API connections...');
  
  // Test IPInfo
  try {
    const ipinfoResponse = await fetch(`https://ipinfo.io/8.8.8.8?token=${process.env.IPINFO_TOKEN}`);
    if (ipinfoResponse.ok) {
      console.log('✅ IPInfo API connection successful');
    } else {
      console.log('❌ IPInfo API connection failed');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ IPInfo API connection failed:', error.message);
    process.exit(1);
  }

  // Test Exa
  try {
    const exaResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'test query',
        numResults: 1
      })
    });
    
    if (exaResponse.status === 200 || exaResponse.status === 400) { // 400 is expected for test query
      console.log('✅ Exa API connection successful');
    } else {
      console.log('❌ Exa API connection failed');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Exa API connection failed:', error.message);
    process.exit(1);
  }

  console.log('');

  // Check database migration
  console.log('3. Checking database schema...');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('❌ Database tables not found. Run the migration:');
      console.log('   pnpm supabase db push');
      process.exit(1);
    }
    
    console.log('✅ Database schema ready');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  console.log('');
  console.log('🎉 Split Leads setup complete!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Visit: http://localhost:3000/dashboard/leads/enrich-demo');
  console.log('2. Get a visitor event ID from your database');
  console.log('3. Test the enrichment pipeline');
  console.log('');
  console.log('💡 Pro tip: Check your visitor_events table for recent business IPs to test with');
}

setupSplitLeads().catch(console.error); 