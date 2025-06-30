#!/usr/bin/env node

const url = process.argv[2] || 'https://split.dev';

async function testRecommendations() {
  try {
    console.log('🔍 Running comprehensive audit with enhanced recommendations...\n');
    
    const response = await fetch('http://localhost:3000/api/comprehensive-audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        topic: 'expense management',
        userId: 'test-user',
        auditType: 'technical'
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.results?.[0]) {
      const result = data.results[0];
      
      console.log('📊 Audit Results:');
      console.log(`URL: ${result.url}`);
      console.log(`Technical Score: ${result.technical?.overallScore}/100`);
      console.log(`Rendering Mode: ${result.technical?.renderingMode}`);
      console.log(`SSR Penalty: ${result.technical?.ssrPenalty}%`);
      
      if (result.enhancedRecommendations) {
        console.log('\n✨ ENHANCED RECOMMENDATIONS:');
        console.log('='.repeat(80));
        console.log(result.enhancedRecommendations.formattedMarkdown);
        console.log('='.repeat(80));
        
        console.log('\n💡 Quick Wins:');
        console.log(`Technical: ${result.enhancedRecommendations.technicalQuickWin}`);
        console.log(`Content: ${result.enhancedRecommendations.contentQuickWin}`);
      } else {
        console.log('\n❌ No enhanced recommendations generated');
      }
    } else {
      console.log('❌ Audit failed:', data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRecommendations(); 