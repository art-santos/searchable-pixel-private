const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearStuckSnapshots() {
  console.log('🔧 Clearing stuck snapshots...\n');
  
  try {
    // Find snapshots that have been locked for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    // Get stuck snapshots
    const { data: stuck, error: fetchError } = await supabase
      .from('snapshot_requests')
      .select('*')
      .eq('status', 'processing')
      .lt('locked_at', tenMinutesAgo);
    
    if (fetchError) {
      console.error('❌ Error fetching stuck snapshots:', fetchError);
      return;
    }
    
    if (!stuck || stuck.length === 0) {
      console.log('✅ No stuck snapshots found!');
      return;
    }
    
    console.log(`Found ${stuck.length} stuck snapshot(s). Resetting...\n`);
    
    // Reset each stuck snapshot
    for (const snapshot of stuck) {
      console.log(`Resetting snapshot ${snapshot.id}...`);
      
      const { error: updateError } = await supabase
        .from('snapshot_requests')
        .update({
          status: 'pending',
          locked_at: null,
          locked_by: null
        })
        .eq('id', snapshot.id);
      
      if (updateError) {
        console.error(`  ❌ Failed to reset: ${updateError.message}`);
      } else {
        console.log(`  ✅ Reset to pending`);
      }
    }
    
    console.log('\n✅ Done! Stuck snapshots have been reset to pending.');
    console.log('   They will be processed when the edge function runs next.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Confirmation prompt
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  This will reset all snapshots that have been locked for > 10 minutes.');
readline.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    clearStuckSnapshots().then(() => {
      readline.close();
    });
  } else {
    console.log('Cancelled.');
    readline.close();
  }
}); 