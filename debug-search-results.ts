import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.server', override: true });

async function debugSearchResults() {
  console.log('🔍 Debug: Perplexity Search Results Structure\n');

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
            content: "What's the best startup banking solution? Include Mercury, Brex, and Silicon Valley Bank in your analysis."
          }
        ]
      })
    });

    const data = await response.json();
    
    console.log('📊 Response Keys:', Object.keys(data));
    
    if (data.search_results && data.search_results.length > 0) {
      console.log('\n🔍 Search Results Analysis:');
      console.log('- Total results:', data.search_results.length);
      
      data.search_results.forEach((result: any, index: number) => {
        console.log(`\n📋 Result ${index + 1}:`);
        console.log('- Keys:', Object.keys(result));
        console.log('- URL:', result.url);
        console.log('- Title:', result.title?.substring(0, 80) + '...');
        console.log('- Has snippet:', !!result.snippet);
        console.log('- Snippet length:', result.snippet?.length || 0);
        if (result.snippet) {
          console.log('- Snippet preview:', result.snippet.substring(0, 150) + '...');
        }
      });
    }
    
    if (data.citations && data.citations.length > 0) {
      console.log('\n📚 Citations Analysis:');
      console.log('- Total citations:', data.citations.length);
      console.log('- Citation type:', typeof data.citations[0]);
      console.log('- First citation:', data.citations[0]);
    }
    
    console.log('\n💬 Answer Preview:');
    console.log(data.choices?.[0]?.message?.content?.substring(0, 300) + '...');
    
  } catch (error: any) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugSearchResults().catch(console.error); 