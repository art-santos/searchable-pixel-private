require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function backfillWorkspaceIds() {
  try {
    console.log('🔧 Starting crawler visits workspace ID backfill...\n')

    // 1. Get all unique users with visits missing workspace_id
    console.log('1. Finding affected users...')
    const { data: affectedVisits, error: visitsError } = await supabase
      .from('crawler_visits')
      .select('user_id')
      .is('workspace_id', null)
    
    if (visitsError) {
      throw visitsError
    }

    const uniqueUsers = [...new Set(affectedVisits.map(v => v.user_id))]
    console.log(`📊 Found ${affectedVisits.length} visits from ${uniqueUsers.length} unique users without workspace_id\n`)

    if (uniqueUsers.length === 0) {
      console.log('✅ No visits need updating!')
      return
    }

    // 2. Process each user
    let totalUpdated = 0
    let totalErrors = 0

    for (let i = 0; i < uniqueUsers.length; i++) {
      const userId = uniqueUsers[i]
      console.log(`\n[${i + 1}/${uniqueUsers.length}] Processing user ${userId}...`)

      // Get user's workspaces
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id, domain, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      
      if (wsError) {
        console.error(`  ❌ Error fetching workspaces:`, wsError)
        totalErrors++
        continue
      }

      if (!workspaces || workspaces.length === 0) {
        console.log(`  ⚠️  User has no workspaces, skipping...`)
        continue
      }

      // Use the first (oldest) workspace as default
      const defaultWorkspace = workspaces[0]
      console.log(`  📍 Found ${workspaces.length} workspace(s), using default: ${defaultWorkspace.domain} (${defaultWorkspace.id})`)

      // Get all visits for this user without workspace_id
      const { data: userVisits, error: userVisitsError } = await supabase
        .from('crawler_visits')
        .select('id, domain')
        .eq('user_id', userId)
        .is('workspace_id', null)
      
      if (userVisitsError) {
        console.error(`  ❌ Error fetching user visits:`, userVisitsError)
        totalErrors++
        continue
      }

      console.log(`  📊 Found ${userVisits.length} visits to update`)

      // Group visits by domain to potentially match with workspace domains
      const visitsByDomain = {}
      userVisits.forEach(visit => {
        if (!visitsByDomain[visit.domain]) {
          visitsByDomain[visit.domain] = []
        }
        visitsByDomain[visit.domain].push(visit.id)
      })

      // Update visits - try to match by domain first
      for (const [domain, visitIds] of Object.entries(visitsByDomain)) {
        // Check if any workspace matches this domain
        const matchingWorkspace = workspaces.find(ws => 
          ws.domain === domain || 
          ws.domain === domain.replace('www.', '') ||
          ws.domain === 'www.' + domain ||
          domain.includes(ws.domain) ||
          ws.domain.includes(domain)
        )

        const workspaceToUse = matchingWorkspace || defaultWorkspace
        console.log(`  🔄 Updating ${visitIds.length} visits for domain ${domain} -> workspace ${workspaceToUse.domain}`)

        // Update in batches of 100
        for (let j = 0; j < visitIds.length; j += 100) {
          const batch = visitIds.slice(j, j + 100)
          const { error: updateError } = await supabase
            .from('crawler_visits')
            .update({ workspace_id: workspaceToUse.id })
            .in('id', batch)
          
          if (updateError) {
            console.error(`  ❌ Error updating batch:`, updateError)
            totalErrors++
          } else {
            totalUpdated += batch.length
          }
        }
      }
    }

    // 3. Final verification
    console.log('\n' + '='.repeat(50))
    console.log('📊 BACKFILL COMPLETE')
    console.log('='.repeat(50))
    console.log(`✅ Successfully updated: ${totalUpdated} visits`)
    console.log(`❌ Errors encountered: ${totalErrors}`)

    // Check remaining
    const { count: remainingCount } = await supabase
      .from('crawler_visits')
      .select('*', { count: 'exact', head: true })
      .is('workspace_id', null)
    
    console.log(`\n📌 Remaining visits without workspace_id: ${remainingCount || 0}`)

    if (remainingCount > 0) {
      console.log('\n⚠️  Some visits could not be updated. This might be because:')
      console.log('- The users have no workspaces')
      console.log('- There were errors during the update process')
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
  }
}

// Add confirmation prompt
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('⚠️  WARNING: This will update crawler visits in your production database!')
console.log('Make sure you have deployed the latest code to Vercel first.\n')

rl.question('Do you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close()
    backfillWorkspaceIds()
  } else {
    console.log('Cancelled.')
    rl.close()
  }
}) 