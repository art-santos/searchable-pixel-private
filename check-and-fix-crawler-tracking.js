require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function checkAndFix() {
  try {
    console.log('🔍 Checking production database status...\n')

    // 1. Check if new validation function exists
    console.log('1. Checking for validate_any_api_key function...')
    const { data: functions, error: funcError } = await supabase
      .rpc('pg_catalog.pg_proc')
      .select('proname')
      .ilike('proname', '%validate%api%')
    
    if (funcError) {
      console.log('❌ Could not check functions (this is normal, checking alternative way)')
      
      // Try calling the function directly
      try {
        const testHash = 'test_hash_that_should_fail'
        const { data, error } = await supabase.rpc('validate_any_api_key', { p_key_hash: testHash })
        console.log('✅ validate_any_api_key function exists!')
      } catch (e) {
        console.log('❌ validate_any_api_key function NOT found - you need to run the migration!')
      }
    }

    // 2. Check for crawler visits without workspace_id
    console.log('\n2. Checking for crawler visits without workspace_id...')
    const { data: visitsWithoutWorkspace, count, error: countError } = await supabase
      .from('crawler_visits')
      .select('*', { count: 'exact', head: true })
      .is('workspace_id', null)
    
    if (countError) {
      console.error('❌ Error counting visits:', countError)
    } else {
      console.log(`📊 Found ${count || 0} crawler visits without workspace_id`)
    }

    // 3. Get a sample of recent visits without workspace_id
    if (count > 0) {
      console.log('\n3. Getting sample of recent visits without workspace_id...')
      const { data: sampleVisits, error: sampleError } = await supabase
        .from('crawler_visits')
        .select('id, user_id, domain, timestamp, crawler_name')
        .is('workspace_id', null)
        .order('timestamp', { ascending: false })
        .limit(10)
      
      if (sampleVisits && sampleVisits.length > 0) {
        console.log('\nSample visits missing workspace_id:')
        sampleVisits.forEach(visit => {
          console.log(`- ${visit.timestamp}: ${visit.domain} (${visit.crawler_name}) - User: ${visit.user_id}`)
        })
      }
    }

    // 4. Check unique users with visits missing workspace_id
    console.log('\n4. Checking unique users affected...')
    const { data: affectedUsers, error: usersError } = await supabase
      .from('crawler_visits')
      .select('user_id')
      .is('workspace_id', null)
      .limit(1000)
    
    if (affectedUsers) {
      const uniqueUsers = [...new Set(affectedUsers.map(v => v.user_id))]
      console.log(`👥 ${uniqueUsers.length} unique users have visits without workspace_id`)
      
      // For each user, check their default workspace
      console.log('\n5. Checking default workspaces for affected users...')
      for (const userId of uniqueUsers.slice(0, 5)) { // Check first 5 users
        const { data: workspaces, error: wsError } = await supabase
          .from('workspaces')
          .select('id, domain')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
        
        if (workspaces && workspaces.length > 0) {
          console.log(`\nUser ${userId}:`)
          console.log(`  - Has ${workspaces.length} workspace(s)`)
          console.log(`  - Default workspace: ${workspaces[0].domain} (${workspaces[0].id})`)
        }
      }
    }

    // 5. Check recent crawler visits WITH workspace_id to see the format
    console.log('\n6. Checking recent visits WITH workspace_id...')
    const { data: recentGoodVisits, error: recentError } = await supabase
      .from('crawler_visits')
      .select('id, user_id, workspace_id, domain, timestamp')
      .not('workspace_id', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(5)
    
    if (recentGoodVisits && recentGoodVisits.length > 0) {
      console.log('\nRecent visits with proper workspace_id:')
      recentGoodVisits.forEach(visit => {
        console.log(`- ${visit.timestamp}: ${visit.domain} - Workspace: ${visit.workspace_id}`)
      })
    }

    // 6. Offer to fix by backfilling workspace_ids
    if (count > 0) {
      console.log('\n' + '='.repeat(50))
      console.log('📌 RECOMMENDED ACTION:')
      console.log('='.repeat(50))
      console.log('\n1. First, ensure the new code is deployed to Vercel')
      console.log('2. Then run the backfill script to fix existing data')
      console.log('\nTo backfill workspace IDs for existing crawler visits:')
      console.log('Run: node backfill-crawler-workspace-ids.js')
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
  }
}

checkAndFix() 