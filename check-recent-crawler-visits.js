require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function checkRecentVisits() {
  try {
    console.log('🔍 Checking recent crawler visits...\n')

    // Get the last 2-3 hours of data
    const threeHoursAgo = new Date()
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3)

    console.log(`Checking visits from: ${threeHoursAgo.toISOString()} to now\n`)

    // 1. Get visits WITH workspace_id
    const { data: visitsWithWorkspace, error: error1 } = await supabase
      .from('crawler_visits')
      .select('id, user_id, workspace_id, domain, crawler_name, timestamp')
      .gte('timestamp', threeHoursAgo.toISOString())
      .not('workspace_id', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(10)

    console.log('✅ Recent visits WITH workspace_id:')
    if (visitsWithWorkspace && visitsWithWorkspace.length > 0) {
      visitsWithWorkspace.forEach(visit => {
        console.log(`  - ${visit.timestamp}: ${visit.domain} (${visit.crawler_name})`)
        console.log(`    Workspace: ${visit.workspace_id}`)
      })
    } else {
      console.log('  None found')
    }

    // 2. Get visits WITHOUT workspace_id
    console.log('\n❌ Recent visits WITHOUT workspace_id:')
    const { data: visitsWithoutWorkspace, error: error2 } = await supabase
      .from('crawler_visits')
      .select('id, user_id, workspace_id, domain, crawler_name, timestamp')
      .gte('timestamp', threeHoursAgo.toISOString())
      .is('workspace_id', null)
      .order('timestamp', { ascending: false })
      .limit(10)

    if (visitsWithoutWorkspace && visitsWithoutWorkspace.length > 0) {
      visitsWithoutWorkspace.forEach(visit => {
        console.log(`  - ${visit.timestamp}: ${visit.domain} (${visit.crawler_name})`)
        console.log(`    User: ${visit.user_id}`)
      })
    } else {
      console.log('  None found')
    }

    // 3. Check hourly counts for the last 3 hours
    console.log('\n📊 Hourly counts (last 3 hours):')
    for (let i = 0; i < 3; i++) {
      const hourStart = new Date()
      hourStart.setHours(hourStart.getHours() - i - 1)
      hourStart.setMinutes(0, 0, 0)
      
      const hourEnd = new Date(hourStart)
      hourEnd.setHours(hourEnd.getHours() + 1)

      const { count: withWorkspace } = await supabase
        .from('crawler_visits')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', hourStart.toISOString())
        .lt('timestamp', hourEnd.toISOString())
        .not('workspace_id', 'is', null)

      const { count: withoutWorkspace } = await supabase
        .from('crawler_visits')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', hourStart.toISOString())
        .lt('timestamp', hourEnd.toISOString())
        .is('workspace_id', null)

      const hour = hourStart.getHours()
      const hourStr = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
      
      console.log(`  ${hourStr}: ${withWorkspace || 0} with workspace, ${withoutWorkspace || 0} without`)
    }

    // 4. Check specific user from the logs
    const specificUserId = 'e0390b8d-f121-4c65-8e63-cb60a2414f97'
    console.log(`\n🔍 Checking specific user from logs: ${specificUserId}`)
    
    const { data: userWorkspaces } = await supabase
      .from('workspaces')
      .select('id, domain')
      .eq('user_id', specificUserId)
    
    if (userWorkspaces && userWorkspaces.length > 0) {
      console.log(`  User has ${userWorkspaces.length} workspace(s):`)
      userWorkspaces.forEach(ws => {
        console.log(`  - ${ws.domain} (${ws.id})`)
      })
    }

    const { data: recentUserVisits } = await supabase
      .from('crawler_visits')
      .select('timestamp, domain, workspace_id')
      .eq('user_id', specificUserId)
      .order('timestamp', { ascending: false })
      .limit(5)
    
    if (recentUserVisits && recentUserVisits.length > 0) {
      console.log(`\n  Recent visits for this user:`)
      recentUserVisits.forEach(visit => {
        console.log(`  - ${visit.timestamp}: ${visit.domain} -> Workspace: ${visit.workspace_id || 'MISSING'}`)
      })
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
  }
}

checkRecentVisits() 