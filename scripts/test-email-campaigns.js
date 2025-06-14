#!/usr/bin/env node

/**
 * Email Campaign Testing Script
 * Run with: node scripts/test-email-campaigns.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'

async function testFirstCrawlerEmail() {
  console.log('\n🤖 Testing First Crawler Email...')
  
  // Create test user
  const testUserId = `test-user-${Date.now()}`
  
  try {
    // Insert test user
    await supabase.from('profiles').insert({
      id: testUserId,
      email: TEST_EMAIL,
      first_name: 'Test User'
    })

    // Trigger first crawler email
    const response = await fetch(`${BASE_URL}/api/emails/first-crawler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        crawlerName: 'Googlebot',
        page: '/test-page',
        userEmail: TEST_EMAIL,
        userName: 'Test User'
      })
    })

    const result = await response.json()
    console.log('✅ First crawler email result:', result)

    // Clean up
    await supabase.from('profiles').delete().eq('id', testUserId)
    
  } catch (error) {
    console.error('❌ First crawler email test failed:', error)
  }
}

async function testWeeklyEmailWithData() {
  console.log('\n📊 Testing Weekly Email with Sample Data...')
  
  const testUserId = `weekly-test-${Date.now()}`
  
  try {
    // Create test user
    await supabase.from('profiles').insert({
      id: testUserId,
      email: TEST_EMAIL,
      first_name: 'Weekly Test',
      email_notifications: true,
      last_weekly_email: null
    })

    // Create sample crawler visits (last 7 days)
    const visits = []
    const now = new Date()
    
    for (let i = 0; i < 25; i++) {
      const visitDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      visits.push({
        user_id: testUserId,
        crawler_name: ['Googlebot', 'Bingbot', 'DuckDuckBot'][Math.floor(Math.random() * 3)],
        crawler_company: ['Google', 'Microsoft', 'DuckDuckGo'][Math.floor(Math.random() * 3)],
        path: `/page-${i}`,
        timestamp: visitDate.toISOString(),
        user_agent: 'Mozilla/5.0 (compatible; Test crawler)',
        ip_address: '127.0.0.1'
      })
    }

    await supabase.from('crawler_visits').insert(visits)

    // Trigger weekly email
    const response = await fetch(`${BASE_URL}/api/emails/weekly-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        userEmail: TEST_EMAIL,
        userName: 'Weekly Test',
        stats: {
          totalVisits: 25,
          uniqueCrawlers: 3,
          topPage: '/page-1',
          growth: 25
        }
      })
    })

    const result = await response.json()
    console.log('✅ Weekly email result:', result)

    // Clean up
    await supabase.from('crawler_visits').delete().eq('user_id', testUserId)
    await supabase.from('profiles').delete().eq('id', testUserId)
    
  } catch (error) {
    console.error('❌ Weekly email test failed:', error)
  }
}

async function testHighVolumeScenario() {
  console.log('\n🏋️ Testing High Volume Scenario (>1000 visits)...')
  
  const testUserId = `high-volume-${Date.now()}`
  
  try {
    // Create test user
    await supabase.from('profiles').insert({
      id: testUserId,
      email: TEST_EMAIL,
      first_name: 'High Volume User'
    })

    console.log('Creating 1500 test visits...')
    
    // Create visits in batches to avoid payload limits
    const batchSize = 100
    const totalVisits = 1500
    
    for (let batch = 0; batch < Math.ceil(totalVisits / batchSize); batch++) {
      const visits = []
      const batchStart = batch * batchSize
      const batchEnd = Math.min(batchStart + batchSize, totalVisits)
      
      for (let i = batchStart; i < batchEnd; i++) {
        visits.push({
          user_id: testUserId,
          crawler_name: 'Googlebot',
          path: `/page-${i}`,
          timestamp: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
        })
      }
      
      await supabase.from('crawler_visits').insert(visits)
      process.stdout.write(`\rProgress: ${Math.round((batchEnd / totalVisits) * 100)}%`)
    }
    
    console.log('\n✅ Created 1500 visits')

    // Test first crawler detection with high volume
    const response = await fetch(`${BASE_URL}/api/emails/first-crawler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        crawlerName: 'Googlebot',
        page: '/test',
        userEmail: TEST_EMAIL
      })
    })

    const result = await response.json()
    console.log('First crawler result (should be rejected):', result)

    // Clean up
    console.log('Cleaning up test data...')
    await supabase.from('crawler_visits').delete().eq('user_id', testUserId)
    await supabase.from('profiles').delete().eq('id', testUserId)
    
  } catch (error) {
    console.error('❌ High volume test failed:', error)
  }
}

async function testConcurrentFirstCrawler() {
  console.log('\n⚡ Testing Concurrent First Crawler Emails...')
  
  const testUserId = `concurrent-${Date.now()}`
  
  try {
    // Create test user
    await supabase.from('profiles').insert({
      id: testUserId,
      email: TEST_EMAIL,
      first_name: 'Concurrent User'
    })

    // Send 5 concurrent requests
    console.log('Sending 5 concurrent first crawler requests...')
    const requests = Array(5).fill().map((_, i) =>
      fetch(`${BASE_URL}/api/emails/first-crawler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          crawlerName: `Bot-${i}`,
          page: `/concurrent-test-${i}`,
          userEmail: TEST_EMAIL
        })
      })
    )

    const results = await Promise.allSettled(requests)
    
    let successCount = 0
    let rejectedCount = 0
    
    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        const data = await result.value.json()
        console.log(`Request ${index + 1}:`, data.success ? '✅ SUCCESS' : '❌ REJECTED')
        if (data.success) successCount++
        else rejectedCount++
      }
    }
    
    console.log(`\n📊 Results: ${successCount} sent, ${rejectedCount} rejected`)
    console.log(successCount === 1 ? '✅ Perfect! Only 1 email sent' : '❌ Issue: Multiple emails sent')

    // Clean up
    await supabase.from('crawler_visits').delete().eq('user_id', testUserId)
    await supabase.from('profiles').delete().eq('id', testUserId)
    
  } catch (error) {
    console.error('❌ Concurrent test failed:', error)
  }
}

async function testEmailNotificationTracking() {
  console.log('\n📧 Testing Email Notification Tracking...')
  
  try {
    // Check recent email notifications
    const { data: notifications, error } = await supabase
      .from('email_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching notifications:', error)
      return
    }

    console.log(`Found ${notifications.length} recent email notifications:`)
    notifications.forEach((notif, i) => {
      console.log(`${i + 1}. ${notif.email_type} - ${notif.status} - ${notif.recipient_email}`)
    })

    // Check for failed emails
    const { data: failedEmails } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (failedEmails && failedEmails.length > 0) {
      console.log(`⚠️  Found ${failedEmails.length} failed emails in last 24h`)
    } else {
      console.log('✅ No failed emails in last 24h')
    }
    
  } catch (error) {
    console.error('❌ Email tracking test failed:', error)
  }
}

async function runAllTests() {
  console.log('🧪 Starting Email Campaign Tests...')
  console.log(`📧 Test email: ${TEST_EMAIL}`)
  console.log(`🌐 Base URL: ${BASE_URL}`)
  
  await testFirstCrawlerEmail()
  await testWeeklyEmailWithData()
  await testConcurrentFirstCrawler()
  await testHighVolumeScenario()
  await testEmailNotificationTracking()
  
  console.log('\n🎉 All tests completed!')
}

// CLI interface
const command = process.argv[2]

switch (command) {
  case 'first-crawler':
    testFirstCrawlerEmail()
    break
  case 'weekly':
    testWeeklyEmailWithData()
    break
  case 'concurrent':
    testConcurrentFirstCrawler()
    break
  case 'high-volume':
    testHighVolumeScenario()
    break
  case 'tracking':
    testEmailNotificationTracking()
    break
  case 'all':
  default:
    runAllTests()
} 