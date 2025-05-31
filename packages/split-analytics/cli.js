#!/usr/bin/env node

const { testInstallation, isAICrawler, getCrawlerInfo } = require('./dist/index.js');

// Check if --test flag is passed
if (process.argv.includes('--test') || process.argv.includes('test')) {
  console.log('🧪 Testing @split.dev/analytics installation...\n');

  (async () => {
    try {
      // Run comprehensive installation test
      const results = await testInstallation();
      
      // Report results
      console.log('📦 Package Import:', results.packageImport ? '✅ Success' : '❌ Failed');
      console.log('🤖 Crawler Detection:', results.crawlerDetection ? '✅ Success' : '❌ Failed');
      
      // Test a few more crawlers to show it's working
      if (results.crawlerDetection) {
        console.log('\n🔍 Testing crawler detection:');
        const testCrawlers = [
          'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)',
          'ClaudeBot/1.0',
          'PerplexityBot/1.0',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ];
        
        testCrawlers.forEach(ua => {
          const detected = isAICrawler(ua);
          const info = getCrawlerInfo(ua);
          const name = ua.includes('GPTBot') ? 'GPTBot' : ua.includes('ClaudeBot') ? 'ClaudeBot' : ua.includes('PerplexityBot') ? 'PerplexityBot' : 'Regular Browser';
          console.log(`   ${name}: ${detected ? '✅ Detected' : '⚪ Not a crawler'} ${info ? `(${info.name} - ${info.company})` : ''}`);
        });
      }
      
      // API connection test (will show not tested if no API key)
      console.log('\n🌐 API Connection: ⚪ Not tested (no API key provided)');
      console.log('   💡 To test API connection, run: npx @split.dev/analytics --test-api YOUR_API_KEY');
      
      // Overall result
      if (results.packageImport && results.crawlerDetection) {
        console.log('\n🎉 Installation test passed! Package is working correctly.');
        console.log('\n📚 Next steps:');
        console.log('   1. Get your API key from: https://split.dev/dashboard');
        console.log('   2. Add to your environment: SPLIT_API_KEY=your_key_here');
        console.log('   3. Test API connection: npx @split.dev/analytics --test-api YOUR_API_KEY');
        console.log('   4. Integrate into your app: https://docs.split.dev');
      } else {
        console.log('\n❌ Installation test failed. Please check your setup.');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.log('\n🔍 Debugging info:');
      console.log('   Node version:', process.version);
      console.log('   Package version:', require('./package.json').version);
      console.log('   Working directory:', process.cwd());
      process.exit(1);
    }
  })();
  
} else if (process.argv.includes('--test-api')) {
  // Test API connection with provided key
  const apiKeyIndex = process.argv.indexOf('--test-api');
  const apiKey = process.argv[apiKeyIndex + 1];
  
  if (!apiKey) {
    console.error('❌ Please provide an API key: npx @split.dev/analytics --test-api YOUR_API_KEY');
    process.exit(1);
  }
  
  console.log('🌐 Testing API connection...\n');
  
  (async () => {
    try {
      const results = await testInstallation({ apiKey, debug: true });
      
      console.log('📦 Package Import:', results.packageImport ? '✅ Success' : '❌ Failed');
      console.log('🤖 Crawler Detection:', results.crawlerDetection ? '✅ Success' : '❌ Failed');
      console.log('🌐 API Connection:', results.apiConnection ? '✅ Success' : '❌ Failed');
      
      if (results.apiConnectionDetails) {
        console.log('\n📊 API Response Details:');
        console.log('   Status:', results.apiConnectionDetails.status);
        if (results.apiConnectionDetails.status === 'ok' && results.apiConnectionDetails.connection) {
          console.log('   Workspace:', results.apiConnectionDetails.connection.workspace);
          console.log('   Plan:', results.apiConnectionDetails.connection.plan || 'N/A');
          console.log('   Key Type:', apiKey.startsWith('split_test_') ? 'Test Key' : 'Live Key');
        } else if (results.apiConnectionDetails.message) {
          console.log('   Error:', results.apiConnectionDetails.message);
        }
      }
      
      if (results.packageImport && results.crawlerDetection && results.apiConnection) {
        console.log('\n🎉 Everything is working! Your integration is ready.');
        console.log('\n📚 Documentation: https://docs.split.dev');
      } else {
        console.log('\n⚠️  Some tests failed. Check the details above.');
        if (!results.apiConnection && results.apiConnectionDetails?.message) {
          console.log('\n💡 Common solutions:');
          console.log('   • Verify your API key is correct');
          console.log('   • Check your internet connection');
          console.log('   • Try again in a few minutes');
        }
      }
      
    } catch (error) {
      console.error('❌ API test failed:', error.message);
      process.exit(1);
    }
  })();
  
} else {
  // Show help
  console.log('@split.dev/analytics - AI Crawler Analytics');
  console.log('');
  console.log('Usage:');
  console.log('  npx @split.dev/analytics --test                    Test package installation');
  console.log('  npx @split.dev/analytics --test-api YOUR_API_KEY   Test API connection');
  console.log('');
  console.log('Documentation: https://docs.split.dev');
  console.log('Dashboard: https://split.dev');
} 