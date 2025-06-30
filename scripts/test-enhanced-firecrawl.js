#!/usr/bin/env node

// Test the EnhancedFirecrawlClient directly
const { EnhancedFirecrawlClient } = require('../src/lib/services/enhanced-firecrawl-client');

async function testEnhancedFirecrawl() {
  console.log('🔍 Testing Enhanced Firecrawl Client...\n');
  
  const apiKey = process.env.FIRECRAWL_API_KEY;
  
  if (!apiKey) {
    console.error('❌ FIRECRAWL_API_KEY not set in environment');
    console.log('Please set: export FIRECRAWL_API_KEY=your_key');
    return;
  }
  
  const client = new EnhancedFirecrawlClient(apiKey);
  const testUrl = 'https://example.com';
  
  console.log(`Testing URL: ${testUrl}`);
  console.log('-'.repeat(50));
  
  try {
    const result = await client.scrape(testUrl);
    
    if (result.success) {
      console.log('✅ Scraping successful!');
      console.log('\n📊 Results:');
      console.log(`- Title: ${result.title}`);
      console.log(`- Word Count: ${result.wordCount}`);
      console.log(`- Status Code: ${result.statusCode}`);
      console.log(`- HTML Length: ${result.html?.length || 0} chars`);
      console.log(`- EEAT Links: ${result.eeatData?.externalEEATLinks || 0}`);
      console.log(`- Total Images: ${result.imageData?.totalImages || 0}`);
      console.log(`- Rendering Mode: ${result.performanceData?.renderingMode || 'Unknown'}`);
    } else {
      console.log('❌ Scraping failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testEnhancedFirecrawl(); 