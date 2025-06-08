const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPendingSnapshots() {
  console.log('🔍 Checking pending snapshots...\n');
  
  try {
    // Get all pending snapshots
    const { data: pending, error: pendingError } = await supabase
      .from('snapshot_requests')
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true });
    
    if (pendingError) {
      console.error('❌ Error fetching pending snapshots:', pendingError);
      return;
    }
    
    if (!pending || pending.length === 0) {
      console.log('✅ No pending snapshots in the queue!');
      return;
    }
    
    console.log(`📊 Found ${pending.length} pending snapshot(s):\n`);
    
    pending.forEach((snapshot, index) => {
      console.log(`${index + 1}. Snapshot ID: ${snapshot.id}`);
      console.log(`   Status: ${snapshot.status}`);
      console.log(`   Topic: ${snapshot.topic}`);
      console.log(`   URLs: ${snapshot.urls.join(', ')}`);
      console.log(`   Created: ${new Date(snapshot.created_at).toLocaleString()}`);
      if (snapshot.locked_at) {
        console.log(`   🔒 Locked at: ${new Date(snapshot.locked_at).toLocaleString()}`);
      }
      console.log('');
    });
    
    // Check if any are stuck (locked for more than 10 minutes)
    const stuckSnapshots = pending.filter(s => {
      if (!s.locked_at) return false;
      const lockedMinutes = (Date.now() - new Date(s.locked_at).getTime()) / 1000 / 60;
      return lockedMinutes > 10;
    });
    
    if (stuckSnapshots.length > 0) {
      console.log(`⚠️  Found ${stuckSnapshots.length} potentially stuck snapshot(s) (locked > 10 minutes)`);
      console.log('   You may want to reset these manually.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkPendingSnapshots(); 