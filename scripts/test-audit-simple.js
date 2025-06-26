#!/usr/bin/env node

/**
 * Simple test for comprehensive audit API (technical + content)
 * Run with: node scripts/test-audit-simple.js
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

async function testComprehensiveAudit() {
  console.log('🧪 Testing Comprehensive Audit API (Technical + Content)');
  console.log('====================================================\n');

  try {
    // Get user inputs
    const baseUrl = await ask('Enter your app URL (default: http://localhost:3000): ') || 'http://localhost:3000';
    const testUrl = await ask('Enter URL to audit (default: https://ramp.com/blog/what-is-an-expense-report): ') || 'https://ramp.com/blog/what-is-an-expense-report';
    const includeContent = await ask('Include content audit? (y/n, default: y): ') || 'y';
    
    rl.close();

    console.log('\n🚀 Starting comprehensive audit test...');
    console.log(`URL to audit: ${testUrl}`);
    console.log(`API endpoint: ${baseUrl}/api/audit/test`);
    console.log(`Content audit: ${includeContent.toLowerCase() === 'y' ? 'Enabled' : 'Disabled'}\n`);

    const startTime = Date.now();

    // Test the comprehensive endpoint
    console.log('📡 Calling comprehensive audit endpoint...');
    
    const response = await fetch(`${baseUrl}/api/audit/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        url: testUrl,
        options: {
          waitFor: 3000,
          timeout: 30000,
          includeContentAudit: includeContent.toLowerCase() === 'y'
        }
      })
    });

    const duration = Date.now() - startTime;
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Error:', JSON.stringify(errorData, null, 2));
      return;
    }

    const data = await response.json();
    
    console.log('\n🎉 Comprehensive audit completed successfully!');
    console.log('===============================================');
    
    // Technical Results
    console.log('\n📊 TECHNICAL ANALYSIS:');
    console.log('========================');
    console.log(`📊 Overall Page Score: ${data.pageScore}/100`);
    console.log(`⚡ Performance Score: ${data.performanceScore}/100`);
    console.log(`📄 HTML Size: ${data.htmlSizeKb}kB`);
    console.log(`🏗️ DOM Size: ${data.domSizeKb}kB`);
    console.log(`📝 Word Count: ${data.seoAnalysis?.wordCount || 'N/A'}`);
    console.log(`🎯 H1 Present: ${data.seoAnalysis?.h1Present ? 'Yes' : 'No'} (${data.seoAnalysis?.h1Count || 0} found)`);
    console.log(`📊 Heading Depth: ${data.seoAnalysis?.headingDepth || 0} levels`);
    console.log(`📋 Meta Description: ${data.seoAnalysis?.metaDescriptionPresent ? 'Yes' : 'No'}`);
    console.log(`🖼️ Images: ${data.imageAnalysis?.totalImages || 0} total, ${data.imageAnalysis?.imageAltPresentPercent || 0}% with alt text`);
    console.log(`🔗 Links: ${data.linkAnalysis?.internalLinkCount || 0} internal, ${data.linkAnalysis?.externalEeatLinks || 0} EEAT`);
    console.log(`⚙️ SSR Rendered: ${data.ssrRendered ? 'Yes' : 'No'}`);
    console.log(`📊 JSON-LD Schema: ${data.schemaAnalysis?.jsonldValid ? 'Yes' : 'No'}`);

    // Content Results (if available)
    if (data.contentAnalysis) {
      console.log('\n🧠 CONTENT QUALITY ANALYSIS:');
      console.log('=============================');
      console.log(`📊 Content Score: ${data.contentAnalysis.overallScore}/100`);
      console.log(`📝 Paragraphs Analyzed: ${data.contentAnalysis.totalParagraphs}`);
      console.log(`✨ Avg Clarity: ${data.contentAnalysis.avgClarity}/5`);
      console.log(`🔍 Avg Factual: ${data.contentAnalysis.avgFactual}/5`);
      console.log(`🏆 Avg Authority: ${data.contentAnalysis.avgAuthority}/5`);
      console.log(`🚨 Red Flags: ${data.contentAnalysis.redFlagCount}/${data.contentAnalysis.totalParagraphs} (${data.contentAnalysis.redFlagPercentage}%)`);
      
      if (data.contentAnalysis.keyTakeaways.length > 0) {
        console.log('\n📋 Content Improvement Recommendations:');
        data.contentAnalysis.keyTakeaways.forEach((takeaway, i) => {
          console.log(`   ${i + 1}. ${takeaway}`);
        });
      }
    } else {
      console.log('\n🧠 CONTENT ANALYSIS: Skipped or failed');
    }

    // Combined Recommendations
    if (data.recommendations) {
      console.log('\n🎯 PRIORITY ACTIONS:');
      console.log('====================');
      
      if (data.recommendations.priorityActions.length > 0) {
        data.recommendations.priorityActions.forEach((action, i) => {
          console.log(`   ${i + 1}. ${action}`);
        });
      }
      
      if (data.recommendations.technicalQuickWin) {
        console.log(`\n💡 Technical Quick Win: ${data.recommendations.technicalQuickWin}`);
      }
    }
    
    console.log(`\n⏱️ Total Duration: ${duration}ms`);
    console.log(`🔧 Analysis Duration: ${data.duration}ms`);
    
    // Debug info
    if (data.debugData) {
      console.log(`\n🔍 Debug: Technical=${data.debugData.technicalScore}/100, Content=${data.debugData.contentScore || 'N/A'}/100`);
    }
    
    console.log('\n📋 Full Response:');
    console.log('================');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js app is running:');
      console.log('   pnpm dev');
    }
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or you can install node-fetch');
  console.log('   npm install node-fetch');
  process.exit(1);
}

testComprehensiveAudit().catch(console.error); 