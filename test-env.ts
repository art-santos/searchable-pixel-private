import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from both files (override=true to merge)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.server', override: true }); // Force merge server keys

console.log('🔍 Environment Test:');
console.log('✅ OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set' : '❌ Missing');
console.log('✅ Perplexity Key:', process.env.PERPLEXITY_API_KEY ? 'Set' : '❌ Missing');
console.log('✅ Firecrawl Key:', process.env.FIRECRAWL_API_KEY ? 'Set' : '❌ Missing');
console.log('✅ Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : '❌ Missing');

// Test Supabase connection with anon key first
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// For testing only - use service key (would be in Edge Function in production)
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function testSupabase() {
  try {
    // Test basic connectivity
    const { data, error } = await supabaseAnon
      .from('snapshot_requests')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ Supabase Error:', error.message);
    } else {
      console.log('✅ Supabase Connected');
    }

    // Test service functions
    const { data: claimData } = await supabaseService
      .rpc('claim_next_snapshot', { worker_id: 'test-worker' });
    
    console.log('✅ Service functions accessible');
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testSupabase(); 