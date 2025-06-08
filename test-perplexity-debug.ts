import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.server', override: true });

async function debugPerplexity() {
  console.log('🔍 Debugging Perplexity API...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log('- PERPLEXITY_API_KEY exists:', !!process.env.PERPLEXITY_API_KEY);
  console.log('- Key length:', process.env.PERPLEXITY_API_KEY?.length || 0);
  console.log('- Key prefix:', process.env.PERPLEXITY_API_KEY?.substring(0, 8) + '...');

  // Test different API formats
  const testCases = [
    {
      name: 'Current format',
      url: 'https://api.perplexity.ai/search',
      body: {
        query: "test",
        source: "web"
      }
    },
    {
      name: 'Chat completions format',
      url: 'https://api.perplexity.ai/chat/completions',
      body: {
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "user",
            content: "test search"
          }
        ]
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log('================================');

    try {
      const response = await fetch(testCase.url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(testCase.body)
      });

      console.log('Status:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('Response length:', responseText.length);
      
      if (!response.ok) {
        console.log('Error response:', responseText.substring(0, 200));
      } else {
        const data = JSON.parse(responseText);
        console.log('✅ Success! Response keys:', Object.keys(data));
        if (data.citations) {
          console.log('Citations found:', data.citations.length);
        }
        if (data.choices) {
          console.log('Choices found:', data.choices.length);
        }
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
    }
  }
}

debugPerplexity().catch(console.error); 