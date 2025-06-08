import dotenv from 'dotenv';
import { generateQuestions } from './src/lib/question-generator.ts';
import { testVisibilityWithPerplexity } from './src/lib/perplexity-client.ts';
import { checkRateLimit, incrementRateLimit, getSupabaseServer } from './src/lib/supabase-client.ts';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.server', override: true });

async function testCoreComponents() {
  console.log('🧪 Testing Core Components...\n');

  // Test 1: Question Generation
  console.log('1️⃣ Testing Question Generation');
  console.log('================================');
  
  try {
    const questionResult = await generateQuestions('startup banking');
    console.log('✅ Question generation success:', questionResult.success);
    console.log('📝 Generated questions:');
    questionResult.questions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q}`);
    });
    console.log('🔢 Tokens used:', questionResult.tokensUsed);
    console.log('🔄 Retry count:', questionResult.retryCount);
  } catch (error) {
    console.error('❌ Question generation failed:', error);
  }

  console.log('\n2️⃣ Testing Perplexity Visibility');
  console.log('==================================');
  
  try {
    const visibilityResult = await testVisibilityWithPerplexity(
      "What's the best startup banking solution?",
      "mercury.com"
    );
    
    console.log('✅ Perplexity search completed');
    console.log('🎯 Target found:', visibilityResult.targetFound);
    console.log('📍 Position:', visibilityResult.position);
    console.log('⏱️ Duration:', visibilityResult.apiCallDuration + 'ms');
    console.log('🌐 Domain competitors:', visibilityResult.competitors.slice(0, 3));
    console.log('🏆 Product competitors:', visibilityResult.competitorNames.slice(0, 3));
    console.log('📄 Citation snippet:', visibilityResult.citationSnippet?.substring(0, 100) + '...');
    console.log('📋 Reasoning:', visibilityResult.reasoning);
  } catch (error) {
    console.error('❌ Perplexity test failed:', error);
  }

  console.log('\n3️⃣ Testing Rate Limiting (Mock User)');
  console.log('=====================================');
  
  try {
    // Use a proper UUID format for testing
    const mockUserId = '00000000-0000-0000-0000-000000000123';
    
    // Check current rate limit
    const rateLimitStatus = await checkRateLimit(mockUserId);
    console.log('📊 Current rate limit status:');
    console.log('   - Allowed:', rateLimitStatus.allowed);
    console.log('   - Requests today:', rateLimitStatus.requestsToday);
    console.log('   - Limit:', rateLimitStatus.limit);
    
    if (rateLimitStatus.allowed) {
      console.log('🔼 Testing increment...');
      const incrementSuccess = await incrementRateLimit(mockUserId);
      console.log('✅ Increment success:', incrementSuccess);
      
      // Check again
      const newStatus = await checkRateLimit(mockUserId);
      console.log('📊 New rate limit status:');
      console.log('   - Requests today:', newStatus.requestsToday);
    }
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error);
  }

  console.log('\n🎉 Core component testing complete!');
}

// Run the tests
testCoreComponents().catch(console.error); 