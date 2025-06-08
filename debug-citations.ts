import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.server', override: true });

async function debugCitations() {
  console.log('🔍 Debug: Perplexity Citation Structure\n');

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "user",
            content: "What's the best startup banking solution? Include mercury.com in your research."
          }
        ]
      })
    });

    const data = await response.json();
    
    console.log('📊 Full Response Structure:');
    console.log('- Top-level keys:', Object.keys(data));
    console.log('- Citations exists:', !!data.citations);
    console.log('- Citations length:', data.citations?.length || 0);
    console.log('- Search results exists:', !!data.search_results);
    console.log('- Search results length:', data.search_results?.length || 0);
    
    if (data.citations && data.citations.length > 0) {
      console.log('\n📝 First Citation Full Structure:');
      console.log(JSON.stringify(data.citations[0], null, 2));
      
      console.log('\n🔗 All Citation URLs:');
      data.citations.forEach((citation: any, index: number) => {
        console.log(`  ${index + 1}. ${citation.url}`);
      });
    }
    
    if (data.search_results && data.search_results.length > 0) {
      console.log('\n🔍 First Search Result Structure:');
      console.log(JSON.stringify(data.search_results[0], null, 2));
    }
    
    console.log('\n💬 Answer Preview:');
    console.log(data.choices?.[0]?.message?.content?.substring(0, 200) + '...');
    
  } catch (error: any) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugCitations().catch(console.error); 