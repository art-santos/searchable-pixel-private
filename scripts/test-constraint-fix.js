#!/usr/bin/env node

/**
 * Quick test to verify the rendering_mode constraint fix
 */

async function testConstraintFix() {
  console.log('🧪 Testing Constraint Fix');
  console.log('==========================\n');

  const testUrl = 'https://mercury.com'; // The URL that was failing
  const baseUrl = 'http://localhost:3000';

  try {
    console.log('🚀 Testing comprehensive audit with Mercury.com...');
    
    const response = await fetch(`${baseUrl}/api/comprehensive-audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [testUrl],
        topic: 'business banking',
        userId: 'test-user',
        auditType: 'technical'
      })
    });

    console.log(`Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Error:', JSON.stringify(errorData, null, 2));
      return;
    }

    const data = await response.json();
    
    console.log('\n✅ Comprehensive audit completed successfully!');
    console.log('============================================');
    console.log(`Audit Run ID: ${data.auditRunId}`);
    console.log(`URLs Processed: ${data.summary.urlsProcessed}/${data.summary.totalUrls}`);
    console.log(`Average AEO Score: ${data.summary.averageAeoScore}/100`);
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log('\n📊 First URL Results:');
      console.log(`   Technical Score: ${result.technical?.overallScore || 'N/A'}/100`);
      console.log(`   Issues Found: ${result.technical?.issuesCount || 0}`);
      console.log(`   Recommendations: ${result.technical?.recommendationsCount || 0}`);
    }

    console.log('\n🎉 Test passed! Constraint issue appears to be fixed.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConstraintFix().catch(console.error); 