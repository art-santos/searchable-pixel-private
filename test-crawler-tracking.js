#!/usr/bin/env node

/**
 * Test script to simulate a crawler visit and verify tracking is working
 */

async function testCrawlerTracking() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  console.log('🧪 Testing crawler tracking...\n')
  
  // Test different crawlers
  const testCases = [
    {
      name: 'GPTBot',
      userAgent: 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)'
    },
    {
      name: 'Claude-Web',
      userAgent: 'Mozilla/5.0 (compatible; Claude-Web/1.0)'
    },
    {
      name: 'PerplexityBot',
      userAgent: 'Mozilla/5.0 (compatible; PerplexityBot/1.0)'
    }
  ]
  
  for (const test of testCases) {
    console.log(`📡 Simulating ${test.name} visit...`)
    
    try {
      const response = await fetch(`${baseUrl}/`, {
        headers: {
          'User-Agent': test.userAgent
        }
      })
      
      if (response.ok) {
        console.log(`✅ ${test.name}: Response received (${response.status})`)
      } else {
        console.log(`⚠️  ${test.name}: Response status ${response.status}`)
      }
    } catch (error) {
      console.error(`❌ ${test.name}: Failed to connect - ${error.message}`)
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n✅ Test complete!')
  console.log('Check your dashboard to see if the crawler visits were tracked.')
  console.log('It may take a few seconds for the data to appear.')
}

testCrawlerTracking().catch(console.error) 