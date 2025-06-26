#!/usr/bin/env node

/**
 * Test the audit API with proper authentication
 * Run with: node scripts/test-audit-api.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function testAuditAPI() {
  console.log('🧪 Testing Comprehensive Audit API');
  console.log('===================================\n');

  try {
    // Get user inputs
    const baseUrl = await ask('Enter your app URL (default: http://localhost:3000): ') || 'http://localhost:3000';
    const testUrl = await ask('Enter URL to audit (default: https://example.com): ') || 'https://example.com';
    
    console.log('\n🔐 For authentication, you have a few options:');
    console.log('1. Use browser dev tools to get JWT token from localStorage');
    console.log('2. Use Supabase service role key (for testing)');
    console.log('3. Skip auth test (will show 401 error)\n');
    
    const authChoice = await ask('Choose option (1/2/3): ');
    
    let headers = {
      'Content-Type': 'application/json'
    };

    if (authChoice === '1') {
      const token = await ask('Enter JWT token from browser: ');
      headers['Authorization'] = `Bearer ${token}`;
    } else if (authChoice === '2') {
      const serviceKey = await ask('Enter Supabase service role key: ');
      headers['Authorization'] = `Bearer ${serviceKey}`;
    } else {
      console.log('⚠️ Proceeding without auth (will show 401 error for demo)');
    }

    rl.close();

    console.log('\n🚀 Starting audit test...');
    console.log(`URL to audit: ${testUrl}`);
    console.log(`API endpoint: ${baseUrl}/api/audit/start\n`);

    // Test 1: Start audit
    console.log('1️⃣ Testing audit start...');
    
    const startResponse = await fetch(`${baseUrl}/api/audit/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: testUrl })
    });

    console.log(`Status: ${startResponse.status} ${startResponse.statusText}`);
    
    if (!startResponse.ok) {
      const errorData = await startResponse.json();
      console.log('❌ Error:', errorData);
      
      if (startResponse.status === 401) {
        console.log('\n💡 To fix authentication:');
        console.log('1. Log into your app in browser');
        console.log('2. Open dev tools (F12) → Application → Local Storage');
        console.log('3. Find "supabase.auth.token" and copy the access_token value');
        console.log('4. Re-run this script with that token\n');
      }
      
      return;
    }

    const startData = await startResponse.json();
    console.log('✅ Audit started successfully!');
    console.log('Response:', JSON.stringify(startData, null, 2));

    const jobId = startData.jobId;
    if (!jobId) {
      console.log('❌ No jobId returned');
      return;
    }

    // Test 2: Poll for status
    console.log('\n2️⃣ Polling for audit completion...');
    
    let attempts = 0;
    const maxAttempts = 20; // 2 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds
      attempts++;
      
      console.log(`📊 Checking status (attempt ${attempts}/${maxAttempts})...`);
      
      const statusResponse = await fetch(`${baseUrl}/api/audit/${jobId}`, {
        headers: { 'Authorization': headers['Authorization'] || '' }
      });

      if (!statusResponse.ok) {
        console.log(`❌ Status check failed: ${statusResponse.status}`);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`Status: ${statusData.status}`);
      
      if (statusData.status === 'completed') {
        console.log('\n🎉 Audit completed successfully!');
        console.log('=================================');
        console.log(`📊 Page Score: ${statusData.pageScore}/100`);
        console.log(`⚡ Performance Score: ${statusData.performanceScore}/100`);
        console.log(`📄 HTML Size: ${statusData.htmlSizeKb}kB`);
        console.log(`🏗️ DOM Size: ${statusData.domSizeKb}kB`);
        console.log(`📝 Word Count: ${statusData.seoAnalysis?.wordCount || 'N/A'}`);
        console.log(`🎯 H1 Present: ${statusData.seoAnalysis?.h1Present ? 'Yes' : 'No'}`);
        console.log(`🖼️ Alt Text Coverage: ${statusData.imageAnalysis?.imageAltPresentPercent || 0}%`);
        console.log(`🔗 Internal Links: ${statusData.linkAnalysis?.internalLinkCount || 0}`);
        console.log(`📋 EEAT Links: ${statusData.linkAnalysis?.externalEeatLinks || 0}`);
        console.log(`⚙️ SSR Rendered: ${statusData.ssrRendered ? 'Yes' : 'No'}`);
        console.log(`📊 JSON-LD Present: ${statusData.schemaAnalysis?.jsonldValid ? 'Yes' : 'No'}`);
        
        if (statusData.recommendations?.technicalQuickWin) {
          console.log(`💡 Quick Win: ${statusData.recommendations.technicalQuickWin}`);
        }
        
        console.log(`⏱️ Analysis Duration: ${statusData.duration}ms`);
        console.log('\n✅ Test completed successfully!');
        return;
      } else if (statusData.status === 'failed') {
        console.log('❌ Audit failed:', statusData.error);
        return;
      } else if (statusData.status === 'processing') {
        console.log('⏳ Still processing...');
      } else {
        console.log(`⏳ Status: ${statusData.status}`);
      }
    }
    
    console.log('⏰ Timeout: Audit took longer than expected');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js app is running:');
      console.log('   npm run dev  (or pnpm dev)');
    }
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or you can install node-fetch');
  console.log('   npm install node-fetch');
  process.exit(1);
}

testAuditAPI().catch(console.error); 