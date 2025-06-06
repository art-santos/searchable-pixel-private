const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Simple .env.local parser
function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value;
      }
    });
  } catch (error) {
    console.log('⚠️ Could not load .env.local file');
  }
}

loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixCrawlerWorkspaceIsolation() {
  console.log('🚀 Fixing crawler visits workspace isolation...\n');
  
  console.log('🔑 Environment check:');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing');
  console.log('Service Key:', process.env.SUPABASE_SERVICE_KEY ? '✅ Found' : '❌ Missing');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('\n❌ Missing required environment variables');
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local');
    return;
  }
  
  try {
    console.log('1. 📊 Checking current state...');
    
    // Check visits with null workspace_id
    const { data: nullVisits, count: nullCount } = await supabase
      .from('crawler_visits')
      .select('*', { count: 'exact', head: true })
      .is('workspace_id', null);
      
    console.log(`   Found ${nullCount || 0} visits with null workspace_id`);
    
    if (!nullCount || nullCount === 0) {
      console.log('✅ All visits already have workspace_id assigned');
      return;
    }
    
    console.log('\n2. 🔧 Getting user workspaces...');
    
    // Get all workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, user_id, domain, is_primary')
      .order('is_primary', { ascending: false }); // Primary workspaces first
      
    console.log(`   Found ${workspaces?.length || 0} workspaces`);
    workspaces?.forEach(w => {
      console.log(`   - User ${w.user_id}: ${w.domain} ${w.is_primary ? '(PRIMARY)' : ''}`);
    });
    
    console.log('\n3. 🔄 Assigning visits to primary workspaces...');
    
    let totalFixed = 0;
    
    for (const workspace of workspaces || []) {
      if (!workspace.is_primary) continue; // Only process primary workspaces
      
      // Update visits for this user to use their primary workspace
      const { data: updatedVisits, error: updateError } = await supabase
        .from('crawler_visits')
        .update({ workspace_id: workspace.id })
        .eq('user_id', workspace.user_id)
        .is('workspace_id', null)
        .select('id');
        
      if (updateError) {
        console.error(`   ❌ Failed to update visits for user ${workspace.user_id}:`, updateError);
      } else {
        const count = updatedVisits?.length || 0;
        totalFixed += count;
        console.log(`   ✅ User ${workspace.user_id} (${workspace.domain}): ${count} visits assigned`);
      }
    }
    
    console.log(`\n4. 📋 RESULTS:`);
    console.log(`   ✅ Fixed ${totalFixed} crawler visits`);
    console.log(`   🎯 All visits now properly isolated by workspace`);
    
    // Verify the fix
    console.log('\n5. ✅ Verification...');
    const { data: remainingNullVisits, count: remainingCount } = await supabase
      .from('crawler_visits')
      .select('*', { count: 'exact', head: true })
      .is('workspace_id', null);
      
    console.log(`   Remaining null workspace_id visits: ${remainingCount || 0}`);
    
    if (remainingCount && remainingCount > 0) {
      console.warn('⚠️ Some visits still have null workspace_id - manual review needed');
    } else {
      console.log('🎉 All crawler visits now have proper workspace isolation!');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Refresh your browser to clear any cached data');
    console.log('2. Test workspace switching');
    console.log('3. Verify split.dev shows no data (if it should be empty)');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixCrawlerWorkspaceIsolation().catch(console.error); 