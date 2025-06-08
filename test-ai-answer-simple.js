const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.server', override: true });

// Simple test without TypeScript compilation issues
async function testAIAnswerExtraction() {
  console.log('🧪 Testing AI Answer Extraction & Competitor Identification (Simple Test)\n');

  // Import dynamically to avoid module issues
  const { testVisibilityWithPerplexity } = await import('./src/lib/perplexity-client.js');

  const testCases = [
    {
      question: "What's the best startup banking solution? Compare Mercury, Brex, and Silicon Valley Bank.",
      targetDomain: "mercury.com",
      expectedCompetitors: ["Brex", "Silicon Valley Bank"]
    },
    {
      question: "Compare project management tools like Notion, Asana, and Trello.",
      targetDomain: "notion.so", 
      expectedCompetitors: ["Asana", "Trello"]
    }
  ];

  for (const testCase of testCases) {
    console.log(`🎯 Testing: "${testCase.question}"`);
    console.log(`📍 Target: ${testCase.targetDomain}`);
    console.log(`🏆 Expected competitors: ${testCase.expectedCompetitors.join(', ')}`);
    
    try {
      const result = await testVisibilityWithPerplexity(
        testCase.question,
        testCase.targetDomain
      );
      
      console.log('\n📊 Results:');
      console.log('- Target found:', result.targetFound);
      console.log('- Position:', result.position);
      console.log('- Citation snippet available:', !!result.citationSnippet);
      if (result.citationSnippet) {
        console.log('- Citation preview:', result.citationSnippet.substring(0, 100) + '...');
      }
      console.log('- Product competitors found:', result.competitorNames.length);
      console.log('- Competitor names:', result.competitorNames);
      console.log('- Reasoning:', result.reasoning);
      
      // Check if we found expected competitors
      const foundExpected = testCase.expectedCompetitors.filter(expected => 
        result.competitorNames.some(found => 
          found.toLowerCase().includes(expected.toLowerCase())
        )
      );
      console.log('- Expected competitors found:', foundExpected);
      
      console.log('\n' + '='.repeat(80) + '\n');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testAIAnswerExtraction().catch(console.error); 