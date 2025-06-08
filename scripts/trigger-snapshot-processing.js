const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use anon key for client operations
);

async function triggerProcessing() {
  console.log('🚀 Triggering snapshot processing...\n');
  
  try {
    // Get the current user (you need to be logged in)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user found.');
      console.log('   Creating a test snapshot to trigger processing...');
      
      // Create a test snapshot request directly
      const { data: testSnapshot, error: createError } = await supabase
        .from('snapshot_requests')
        .insert({
          user_id: 'e0b8c7d4-9f2a-4b5e-8d3c-1a7e9b6f4c2d', // A test user ID
          urls: ['https://example.com'],
          topic: 'test trigger',
          status: 'pending'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create test snapshot:', createError);
        return;
      }
      
      console.log('✅ Created test snapshot:', testSnapshot.id);
    }
    
    // Now trigger the processing
    console.log('\n📡 Calling API to process snapshots...');
    
    const response = await fetch('http://localhost:3000/api/process-snapshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        user_id: user?.id || 'e0b8c7d4-9f2a-4b5e-8d3c-1a7e9b6f4c2d' 
      })
    });
    
    const result = await response.json();
    console.log('\n📊 API Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run it
triggerProcessing(); 