import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.server', override: true });

async function simpleTest() {
  console.log('🧪 Simple API Test...\n');

  // Test 1: OpenAI
  console.log('1️⃣ Testing OpenAI Connection');
  console.log('===============================');
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: 'Generate 3 startup banking questions. Be brief.' }
      ],
      max_tokens: 150,
    });

    console.log('✅ OpenAI connected successfully');
    console.log('📝 Sample response:', response.choices[0]?.message?.content?.substring(0, 100) + '...');
    console.log('🔢 Tokens used:', response.usage?.total_tokens);
  } catch (error: any) {
    console.error('❌ OpenAI test failed:', error.message);
  }

  console.log('\n2️⃣ Testing Perplexity API');
  console.log('==========================');
  
  try {
    const response = await fetch("https://api.perplexity.ai/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: "best startup banking",
        source: "web"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Perplexity connected successfully');
    console.log('📊 Citations found:', data.citations?.length || 0);
    console.log('🔗 First citation:', data.citations?.[0]?.url || 'None');
  } catch (error: any) {
    console.error('❌ Perplexity test failed:', error.message);
  }

  console.log('\n3️⃣ Testing Supabase Connection');
  console.log('===============================');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Test database query
    const { data, error } = await supabase
      .from('snapshot_requests')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Supabase connected successfully');
    console.log('📋 Query result:', data.length + ' records found');

    // Test custom function
    const { data: funcData, error: funcError } = await supabase
      .rpc('claim_next_snapshot', { worker_id: 'test-worker' });

    if (funcError) {
      console.log('⚠️ Function call result:', funcError.message);
    } else {
      console.log('✅ Custom functions accessible');
    }

  } catch (error: any) {
    console.error('❌ Supabase test failed:', error.message);
  }

  console.log('\n4️⃣ Testing Firecrawl API');
  console.log('=========================');
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        formats: ['markdown']
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Firecrawl connected successfully');
    console.log('📄 Content length:', data.data?.content?.length || 0, 'characters');
  } catch (error: any) {
    console.error('❌ Firecrawl test failed:', error.message);
  }

  console.log('\n🎉 Simple API testing complete!');
}

// Run the test
simpleTest().catch(console.error); 