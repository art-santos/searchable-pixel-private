const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function forceProcessSnapshots() {
  console.log('🚀 Force processing all pending snapshots...\n');
  
  try {
    // First, let's check how many pending snapshots we have
    const { data: pendingSnapshots, error: checkError } = await supabase
      .from('snapshot_requests')
      .select('id, topic, urls, status')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true });
    
    if (checkError) {
      console.error('❌ Error checking snapshots:', checkError);
      return;
    }
    
    console.log(`📊 Found ${pendingSnapshots?.length || 0} pending/processing snapshots\n`);
    
    // Reset any stuck processing snapshots to pending
    const processingSnapshots = pendingSnapshots?.filter(s => s.status === 'processing') || [];
    if (processingSnapshots.length > 0) {
      console.log(`🔧 Resetting ${processingSnapshots.length} stuck processing snapshots...`);
      
      for (const snapshot of processingSnapshots) {
        const { error: resetError } = await supabase
          .from('snapshot_requests')
          .update({
            status: 'pending',
            locked_at: null,
            locked_by: null
          })
          .eq('id', snapshot.id);
        
        if (resetError) {
          console.error(`   ❌ Failed to reset ${snapshot.id}:`, resetError.message);
        } else {
          console.log(`   ✅ Reset ${snapshot.id} to pending`);
        }
      }
      console.log('');
    }
    
    // Now invoke the edge function
    console.log('📡 Invoking edge function to process all snapshots...\n');
    
    const { data, error } = await supabase.functions.invoke('process-snapshot', {
      body: { 
        user_id: 'system-admin' // Using a system identifier
      }
    });
    
    if (error) {
      console.error('❌ Edge function error:', error);
      console.error('   Details:', error.message);
      
      // If edge function fails, let's try a different approach
      console.log('\n🔄 Trying alternative approach...');
      
      // Get the first pending snapshot's user_id
      const { data: firstSnapshot } = await supabase
        .from('snapshot_requests')
        .select('user_id')
        .eq('status', 'pending')
        .limit(1)
        .single();
      
      if (firstSnapshot?.user_id) {
        console.log('   Using user_id:', firstSnapshot.user_id);
        
        const { data: retryData, error: retryError } = await supabase.functions.invoke('process-snapshot', {
          body: { user_id: firstSnapshot.user_id }
        });
        
        if (retryError) {
          console.error('   ❌ Retry also failed:', retryError.message);
        } else {
          console.log('   ✅ Retry successful!');
          console.log('   Response:', JSON.stringify(retryData, null, 2));
        }
      }
      
      return;
    }
    
    console.log('✅ Edge function response:', JSON.stringify(data, null, 2));
    
    if (data?.processedCount > 0) {
      console.log(`\n🎉 Successfully triggered processing of ${data.processedCount} snapshot(s)!`);
      console.log('   Check the logs at: https://supabase.com/dashboard/project/xeclltopgmpwjpvwdnxu/functions/process-snapshot/logs');
    } else {
      console.log('\n📭 No snapshots were processed.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run it
console.log('🔑 Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('🔑 Service key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('');

forceProcessSnapshots(); 