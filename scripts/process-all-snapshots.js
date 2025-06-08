const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function processAllSnapshots() {
  console.log('🚀 Triggering processing of all pending snapshots...\n');
  
  try {
    // Call the edge function to process all snapshots
    const { data, error } = await supabase.functions.invoke('process-snapshot', {
      body: { user_id: 'system' } // Using 'system' as a generic trigger
    });
    
    if (error) {
      console.error('❌ Edge function error:', error);
      return;
    }
    
    console.log('✅ Edge function response:', JSON.stringify(data, null, 2));
    
    if (data?.processedCount > 0) {
      console.log(`\n🎉 Successfully processed ${data.processedCount} snapshot(s)!`);
    } else {
      console.log('\n📭 No snapshots were processed.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run it
processAllSnapshots(); 