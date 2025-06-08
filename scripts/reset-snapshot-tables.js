const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const readline = require('readline');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetSnapshotTables() {
  console.log('🗑️  Resetting snapshot tables...\n');
  
  try {
    // First, let's see what we're about to delete
    const { data: snapshots, error: countError } = await supabase
      .from('snapshot_requests')
      .select('id, status, topic, created_at');
    
    if (countError) {
      console.error('❌ Error counting snapshots:', countError);
      return;
    }
    
    console.log(`📊 Found ${snapshots?.length || 0} total snapshots to delete:`);
    console.log(`   - Pending: ${snapshots?.filter(s => s.status === 'pending').length || 0}`);
    console.log(`   - Processing: ${snapshots?.filter(s => s.status === 'processing').length || 0}`);
    console.log(`   - Completed: ${snapshots?.filter(s => s.status === 'completed').length || 0}`);
    console.log(`   - Failed: ${snapshots?.filter(s => s.status === 'failed').length || 0}`);
    console.log('');
    
    // Delete all data from related tables (in order due to foreign keys)
    const tables = [
      'visibility_results',
      'snapshot_summaries', 
      'snapshot_questions',
      'page_content',
      'audit_run_pages',
      'snapshot_requests'
    ];
    
    console.log('🔥 Deleting data from tables:\n');
    
    for (const table of tables) {
      try {
        // Get count before deletion
        const { count: beforeCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        // Delete all records
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .gte('created_at', '2000-01-01'); // Delete everything
        
        if (deleteError) {
          console.error(`   ❌ Failed to clear ${table}:`, deleteError.message);
        } else {
          console.log(`   ✅ Cleared ${table} (deleted ${beforeCount || 0} records)`);
        }
      } catch (err) {
        console.error(`   ⚠️  Error with ${table}:`, err.message);
      }
    }
    
    console.log('\n✅ Snapshot tables have been reset!');
    console.log('   You can now create new snapshots without any pending/stuck data.');
    
    // Also clear rate limits for a fresh start
    console.log('\n🔧 Clearing rate limits...');
    const { error: rateLimitError } = await supabase
      .from('user_rate_limits')
      .delete()
      .gte('created_at', '2000-01-01');
    
    if (!rateLimitError) {
      console.log('   ✅ Rate limits cleared');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Confirmation prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will DELETE ALL snapshot data!');
console.log('   This includes:');
console.log('   - All snapshot requests (pending, completed, failed)');
console.log('   - All visibility test results');
console.log('   - All technical audit results');
console.log('   - All stored questions and summaries');
console.log('');

rl.question('Are you SURE you want to delete all snapshot data? Type "DELETE" to confirm: ', (answer) => {
  if (answer === 'DELETE') {
    console.log('');
    resetSnapshotTables().then(() => {
      rl.close();
    });
  } else {
    console.log('\n❌ Cancelled - no data was deleted.');
    rl.close();
  }
}); 