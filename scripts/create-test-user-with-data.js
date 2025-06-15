#!/usr/bin/env node

/**
 * Create Test User with Crawler Visit Data
 * 
 * This script creates a test user with realistic crawler visit data
 * for testing the email system with real statistics.
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Test user configuration
const TEST_USER = {
  email: 'testuser@example.com',
  firstName: 'Test',
  domain: 'testsite.com',
  workspaceName: 'Test Workspace'
}

// Crawler configurations
const CRAWLERS = [
  { name: 'Googlebot', company: 'Google', category: 'search' },
  { name: 'GPTBot', company: 'OpenAI', category: 'ai' },
  { name: 'Bingbot', company: 'Microsoft', category: 'search' },
  { name: 'Claude-Web', company: 'Anthropic', category: 'ai' },
  { name: 'DuckDuckBot', company: 'DuckDuckGo', category: 'search' },
]

const PAGES = [
  '/',
  '/about',
  '/blog',
  '/blog/ai-seo-guide',
  '/blog/crawler-optimization',
  '/products',
  '/contact',
  '/pricing',
  '/docs',
  '/docs/getting-started'
]

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomDate(daysAgo) {
  const now = new Date()
  const pastDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime())
  return new Date(randomTime)
}

async function createTestUser() {
  console.log('🔧 Creating test user...')
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: 'testpassword123',
      email_confirm: true
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  User already exists, fetching existing user...')
        const { data: existingUser, error: fetchError } = await supabase.auth.admin.listUsers()
        if (fetchError) throw fetchError
        
        const user = existingUser.users.find(u => u.email === TEST_USER.email)
        if (!user) throw new Error('Could not find existing user')
        
        return user.id
      }
      throw authError
    }

    const userId = authData.user.id
    console.log(`✅ Created auth user: ${userId}`)

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: TEST_USER.email,
        first_name: TEST_USER.firstName,
        domain: TEST_USER.domain,
        workspace_name: TEST_USER.workspaceName,
        email_notifications: true,
        last_weekly_email: null
      })

    if (profileError) throw profileError
    console.log('✅ Created user profile')

    // Create workspace
    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .upsert({
        user_id: userId,
        domain: TEST_USER.domain,
        workspace_name: TEST_USER.workspaceName,
        is_primary: true
      })
      .select()
      .single()

    if (workspaceError) throw workspaceError
    const workspaceId = workspaceData.id
    console.log(`✅ Created workspace: ${workspaceId}`)

    return { userId, workspaceId }

  } catch (error) {
    console.error('❌ Error creating test user:', error)
    throw error
  }
}

async function createCrawlerVisits(userId, workspaceId) {
  console.log('🕷️  Creating crawler visit data...')
  
  const visits = []
  const now = new Date()
  
  // Create visits for the last 14 days (so we have comparison data)
  for (let day = 0; day < 14; day++) {
    const visitsPerDay = Math.floor(Math.random() * 10) + 5 // 5-15 visits per day
    
    for (let i = 0; i < visitsPerDay; i++) {
      const crawler = getRandomElement(CRAWLERS)
      const page = getRandomElement(PAGES)
      const visitDate = getRandomDate(day)
      
      visits.push({
        user_id: userId,
        workspace_id: workspaceId,
        domain: TEST_USER.domain,
        path: page,
        crawler_name: crawler.name,
        crawler_company: crawler.company,
        crawler_category: crawler.category,
        user_agent: `Mozilla/5.0 (compatible; ${crawler.name}/1.0)`,
        timestamp: visitDate.toISOString(),
        status_code: 200,
        response_time_ms: Math.floor(Math.random() * 500) + 100,
        country: getRandomElement(['US', 'UK', 'CA', 'DE', 'FR']),
        metadata: {}
      })
    }
  }

  // Insert visits in batches
  const batchSize = 100
  for (let i = 0; i < visits.length; i += batchSize) {
    const batch = visits.slice(i, i + batchSize)
    const { error } = await supabase
      .from('crawler_visits')
      .insert(batch)
    
    if (error) throw error
    console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(visits.length / batchSize)}`)
  }

  console.log(`✅ Created ${visits.length} crawler visits`)
  return visits
}

async function generateStats(userId) {
  console.log('📊 Generating statistics preview...')
  
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  // Get this week's visits
  const { data: thisWeekVisits, error: thisWeekError } = await supabase
    .from('crawler_visits')
    .select('crawler_name, path')
    .eq('user_id', userId)
    .gte('timestamp', oneWeekAgo.toISOString())

  if (thisWeekError) throw thisWeekError

  // Get last week's visits for comparison
  const { count: lastWeekCount, error: lastWeekError } = await supabase
    .from('crawler_visits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('timestamp', twoWeeksAgo.toISOString())
    .lt('timestamp', oneWeekAgo.toISOString())

  if (lastWeekError) throw lastWeekError

  // Calculate stats
  const totalVisits = thisWeekVisits.length
  const uniqueCrawlers = new Set(thisWeekVisits.map(v => v.crawler_name)).size
  
  // Find most visited page
  const pageCounts = new Map()
  thisWeekVisits.forEach(visit => {
    const count = pageCounts.get(visit.path) || 0
    pageCounts.set(visit.path, count + 1)
  })
  
  let topPage = '/'
  let maxCount = 0
  pageCounts.forEach((count, page) => {
    if (count > maxCount) {
      maxCount = count
      topPage = page
    }
  })

  // Calculate growth
  let growth = 0
  if (lastWeekCount > 0) {
    growth = Math.round(((totalVisits - lastWeekCount) / lastWeekCount) * 100)
  } else if (totalVisits > 0) {
    growth = 100
  }

  const stats = {
    totalVisits,
    uniqueCrawlers,
    topPage,
    growth,
    lastWeekCount
  }

  console.log('\n📈 Weekly Email Stats Preview:')
  console.log(`   Total Visits: ${stats.totalVisits}`)
  console.log(`   Unique Crawlers: ${stats.uniqueCrawlers}`)
  console.log(`   Top Page: ${stats.topPage}`)
  console.log(`   Growth: ${stats.growth}% (vs ${stats.lastWeekCount} last week)`)
  
  return stats
}

async function main() {
  console.log('🚀 Creating test user with crawler visit data...\n')
  
  try {
    // Create test user and workspace
    const { userId, workspaceId } = await createTestUser()
    
    // Create crawler visits
    await createCrawlerVisits(userId, workspaceId)
    
    // Generate stats preview
    await generateStats(userId)
    
    console.log('\n✅ Test user setup complete!')
    console.log('\n📧 You can now test emails with real data using:')
    console.log(`   Email: ${TEST_USER.email}`)
    console.log(`   User ID: ${userId}`)
    console.log(`   Workspace ID: ${workspaceId}`)
    console.log('\n💡 In the admin email testing interface, enable "Use real user data" to test with this data.')
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { createTestUser, createCrawlerVisits, generateStats } 