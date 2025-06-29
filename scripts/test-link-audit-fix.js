#!/usr/bin/env node

/**
 * Test script to verify link audit fixes
 * This tests data storage, retrieval, EEAT data, and SSR detection
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

async function testLinkAuditFixes() {
  console.log('🧪 Testing Link Audit Fixes');
  console.log('============================\n');

  try {
    // Get test parameters
    const baseUrl = await ask('Enter your app URL (default: http://localhost:3000): ') || 'http://localhost:3000';
    const testUrl = await ask('Enter URL to test (default: https://split.dev): ') || 'https://split.dev';
    
    rl.close();

    console.log('\n🔍 Step 1: Testing data retrieval (should find no existing data)');
    console.log('================================================================');
    
    const retrieveResponse = await fetch(`${baseUrl}/api/audit/retrieve?url=${encodeURIComponent(testUrl)}`);
    const retrieveData = await retrieveResponse.json();
    
    console.log(`Status: ${retrieveResponse.status}`);
    console.log(`Response:`, JSON.stringify(retrieveData, null, 2));
    
    if (retrieveData.exists) {
      console.log('✅ Found existing data - testing data structure...');
      
      // Test data structure
      const audit = retrieveData.data;
      console.log('\n📊 Data Structure Validation:');
      console.log(`   SSR Rendered: ${audit.ssrRendered ? '✅ Yes' : '❌ No'}`);
      console.log(`   EEAT Links: ${audit.linkAnalysis?.externalEeatLinks || 0}`);
      console.log(`   Internal Links: ${audit.linkAnalysis?.internalLinkCount || 0}`);
      console.log(`   Rendering Mode: ${audit.technicalMetrics?.renderingMode || 'Unknown'}`);
      console.log(`   SSR Penalty: ${audit.technicalMetrics?.ssrScorePenalty || 0}`);
      console.log(`   Page Score: ${audit.pageScore || 0}/100`);
      console.log(`   Last Analyzed: ${audit.lastAnalyzed || 'Unknown'}`);
      console.log(`   Data Source: ${audit.dataSource || 'Unknown'}`);
      
    } else {
      console.log('ℹ️ No existing data found (expected for first run)');
    }

    console.log('\n🚀 Step 2: Running new comprehensive audit');
    console.log('============================================');
    
    const startTime = Date.now();
    
    const auditResponse = await fetch(`${baseUrl}/api/audit/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url: testUrl,
        options: {
          includeContentAudit: true,
          waitFor: 3000,
          timeout: 45000
        }
      })
    });

    const duration = Date.now() - startTime;
    console.log(`Status: ${auditResponse.status} (${duration}ms)`);
    
    if (!auditResponse.ok) {
      const errorData = await auditResponse.json();
      console.log('❌ Error:', JSON.stringify(errorData, null, 2));
      return;
    }

    const auditData = await auditResponse.json();
    
    console.log('\n✅ Audit completed successfully!');
    console.log('=================================');
    
    // Validate key data points
    console.log('\n📊 Key Metrics:');
    console.log(`   Overall Score: ${auditData.pageScore}/100`);
    console.log(`   HTML Size: ${auditData.htmlSizeKb}kB`);
    console.log(`   DOM Size: ${auditData.domSizeKb}kB`);
    console.log(`   Word Count: ${auditData.seoAnalysis?.wordCount || 'N/A'}`);
    
    console.log('\n🔗 Link Analysis (EEAT Data):');
    console.log(`   Internal Links: ${auditData.linkAnalysis?.internalLinkCount || 0}`);
    console.log(`   External EEAT Links: ${auditData.linkAnalysis?.externalEeatLinks || 0}`);
    console.log(`   Total Links: ${auditData.linkAnalysis?.totalLinks || 0}`);
    
    console.log('\n⚙️ SSR Detection:');
    console.log(`   SSR Rendered: ${auditData.ssrRendered ? '✅ Yes' : '❌ No'}`);
    console.log(`   Rendering Mode: ${auditData.technicalMetrics?.renderingMode || 'Unknown'}`);
    console.log(`   SSR Penalty: ${auditData.technicalMetrics?.ssrScorePenalty || 0}`);
    
    console.log('\n🖼️ Image Analysis:');
    console.log(`   Total Images: ${auditData.imageAnalysis?.totalImages || 0}`);
    console.log(`   Alt Text Coverage: ${auditData.imageAnalysis?.imageAltPresentPercent || 0}%`);
    
    console.log('\n📋 Schema Analysis:');
    console.log(`   JSON-LD Valid: ${auditData.schemaAnalysis?.jsonldValid ? '✅ Yes' : '❌ No'}`);
    
    // Wait a moment for data to be stored
    console.log('\n⏳ Step 3: Waiting 2 seconds for data storage...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n🔍 Step 4: Testing data retrieval (should find stored data)');
    console.log('============================================================');
    
    const retrieveResponse2 = await fetch(`${baseUrl}/api/audit/retrieve?url=${encodeURIComponent(testUrl)}`);
    const retrieveData2 = await retrieveResponse2.json();
    
    console.log(`Status: ${retrieveResponse2.status}`);
    
    if (retrieveData2.exists) {
      console.log('✅ Successfully retrieved stored data!');
      console.log('\n📊 Stored Data Validation:');
      
      const stored = retrieveData2.data;
      
      // Compare key metrics
      const scoreMatch = Math.abs((stored.pageScore || 0) - (auditData.pageScore || 0)) < 5;
      const ssrMatch = stored.ssrRendered === auditData.ssrRendered;
      const eeatMatch = stored.linkAnalysis?.externalEeatLinks === auditData.linkAnalysis?.externalEeatLinks;
      
      console.log(`   Score Match: ${scoreMatch ? '✅' : '❌'} (Stored: ${stored.pageScore}, Live: ${auditData.pageScore})`);
      console.log(`   SSR Match: ${ssrMatch ? '✅' : '❌'} (Stored: ${stored.ssrRendered}, Live: ${auditData.ssrRendered})`);
      console.log(`   EEAT Match: ${eeatMatch ? '✅' : '❌'} (Stored: ${stored.linkAnalysis?.externalEeatLinks}, Live: ${auditData.linkAnalysis?.externalEeatLinks})`);
      console.log(`   Data Source: ${stored.dataSource}`);
      console.log(`   Last Analyzed: ${stored.lastAnalyzed}`);
      
      if (scoreMatch && ssrMatch && eeatMatch) {
        console.log('\n🎉 All tests passed! Data storage and retrieval working correctly.');
      } else {
        console.log('\n⚠️ Some data mismatches detected. Check storage logic.');
      }
      
    } else {
      console.log('❌ Failed to retrieve stored data');
      console.log('Response:', JSON.stringify(retrieveData2, null, 2));
    }

    console.log('\n🔍 Step 5: Testing cached retrieval (should be instant)');
    console.log('========================================================');
    
    const cacheStartTime = Date.now();
    const cacheResponse = await fetch(`${baseUrl}/api/audit/retrieve?url=${encodeURIComponent(testUrl)}`);
    const cacheDuration = Date.now() - cacheStartTime;
    
    console.log(`Status: ${cacheResponse.status} (${cacheDuration}ms)`);
    
    if (cacheResponse.ok && cacheDuration < 500) {
      console.log('✅ Cache retrieval is fast and working correctly!');
    } else {
      console.log('⚠️ Cache retrieval may be slow or not working optimally');
    }

    console.log('\n🎉 Link Audit Fix Test Complete!');
    console.log('=================================');
    console.log('Summary:');
    console.log('- Data storage: Enhanced with EEAT, SSR, and comprehensive metrics');
    console.log('- Data retrieval: New API endpoint for cached results');
    console.log('- UI updates: Snapshot page now checks for existing data first');
    console.log('- No more regeneration: Data persists and loads from cache');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Self-executing test
testLinkAuditFixes().catch(console.error); 