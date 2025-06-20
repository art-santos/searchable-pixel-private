require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUserVisit() {
  const visitId = '09ade746-e5a7-40de-b773-8e89db6d7379'; // Test visit ID
  
  // First delete any existing visit with this ID
  const { error: deleteError } = await supabase
    .from('user_visits')
    .delete()
    .eq('id', visitId);
    
  if (deleteError) {
    console.log('Error deleting existing visit:', deleteError.message);
  }
  
  // Create new user visit for the user's workspace
  const { data, error } = await supabase
    .from('user_visits')
    .insert({
      id: visitId,
      workspace_id: '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d', // User's workspace
      page_url: 'https://split.dev/pricing',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ip_address: '17.0.0.1', // Apple IP for testing
      referrer: 'https://chat.openai.com',
      utm_source: 'chatgpt',
      utm_medium: 'ai',
      utm_campaign: 'analytics_research',
      utm_content: null,
      utm_term: null,
      attribution_source: 'chatgpt',
      session_duration: 180,
      pages_viewed: 3,
      enrichment_status: 'pending',
      enrichment_attempted_at: null,
      enrichment_cost_cents: null,
      country: 'US',
      city: 'Cupertino',
      region: 'CA'
    })
    .select();
    
  if (error) {
    console.error('Error creating user visit:', error);
  } else {
    console.log('✅ Created user visit:', data);
    console.log('\n🎯 Test Scenario:');
    console.log('- Company: Apple (detected from IP 17.0.0.1)');
    console.log('- Attribution: ChatGPT referral');
    console.log('- Page: /pricing (high intent)');
    console.log('- Session: 3 minutes, 3 pages viewed');
    console.log('\nNow you can enrich this visit by calling the API or using the websets demo page');
    console.log(`Visit ID: ${visitId}`);
  }
}

createTestUserVisit(); 