#!/usr/bin/env node

/**
 * Test if the frontend can retrieve and display enhanced recommendations
 */

const url = process.argv[2] || 'https://split.dev';

async function testFrontendIntegration() {
  console.log('🔍 Testing Frontend Integration with Enhanced Recommendations\n');
  console.log(`URL: ${url}`);
  console.log('='.repeat(60));
  
  try {
    // Test the retrieve endpoint (what the frontend uses)
    console.log('\n1️⃣ Testing /api/audit/retrieve endpoint...');
    const retrieveResponse = await fetch(`http://localhost:3000/api/audit/retrieve?url=${encodeURIComponent(url)}`);
    const retrieveData = await retrieveResponse.json();
    
    if (retrieveData.exists && retrieveData.data) {
      console.log('✅ Found existing audit data');
      
      const audit = retrieveData.data;
      
      // Check for enhanced recommendation fields
      console.log('\n2️⃣ Checking for enhanced recommendation fields:');
      console.log(`- Page Summary: ${audit.recommendations?.pageSummary ? '✅ Present' : '❌ Missing'}`);
      console.log(`- Technical Quick Win: ${audit.recommendations?.technicalQuickWin ? '✅ Present' : '❌ Missing'}`);
      console.log(`- Content Quick Win: ${audit.recommendations?.contentQuickWin ? '✅ Present' : '❌ Missing'}`);
      console.log(`- Formatted Markdown: ${audit.recommendations?.formattedMarkdown ? '✅ Present' : '❌ Missing'}`);
      
      if (audit.recommendations?.pageSummary) {
        console.log('\n3️⃣ Page Summary Preview:');
        console.log(audit.recommendations.pageSummary.substring(0, 200) + '...');
      }
      
      console.log('\n✅ Frontend should display:');
      console.log('- Page Summary section');
      console.log('- Technical Quick Win (blue box)');
      console.log('- Content Quick Win (amber box)');
      console.log('- "View Detailed Recommendations" expandable section');
      
    } else {
      console.log('❌ No existing data found');
      console.log('\n💡 Run a comprehensive audit first:');
      console.log(`node scripts/test-enhanced-quick.js ${url}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📌 To see the enhanced UI:');
  console.log('1. Navigate to a completed snapshot in the dashboard');
  console.log('2. Click on the "Link Audit" tab');
  console.log('3. Look for "Enhanced Analysis & Recommendations" section');
}

testFrontendIntegration(); 