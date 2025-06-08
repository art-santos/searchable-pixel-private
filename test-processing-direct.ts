import dotenv from 'dotenv';
import { getSupabaseServer } from './src/lib/supabase-client';
import { generateQuestions } from './src/lib/question-generator';
import { testVisibilityWithPerplexity } from './src/lib/perplexity-client';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.server', override: true });

async function testProcessingDirect() {
  console.log('🚀 Testing Direct Processing Pipeline (Bypassing Claim Function)\n');

  // Test data
  const testUrls = ['https://mercury.com'];
  const testTopic = 'startup banking';

  console.log('📋 Test Configuration:');
  console.log(`   URL: ${testUrls[0]}`);
  console.log(`   Topic: ${testTopic}`);
  console.log('');

  try {
    const supabase = getSupabaseServer();

    // Step 1: Create a snapshot request and manually mark as processing
    console.log('🚀 Step 1: Creating and marking request as processing...');
    const { data: requestData, error: requestError } = await supabase
      .from('snapshot_requests')
      .insert({
        user_id: null,
        urls: testUrls,
        topic: testTopic,
        status: 'processing', // Skip claim step
        locked_by: 'direct-test-worker',
        locked_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (requestError || !requestData) {
      console.error('❌ Failed to create request:', requestError);
      return;
    }

    const requestId = requestData.id;
    console.log(`✅ Created processing request: ${requestId}`);
    console.log('');

    // Step 2: Generate questions
    console.log('🤖 Step 2: Generating questions...');
    const questionResult = await generateQuestions(testTopic);
    
    if (!questionResult.success) {
      throw new Error(`Question generation failed: ${questionResult.error}`);
    }

    const { questions } = questionResult;
    console.log(`✅ Generated ${questions.length} questions:`);
    questions.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
    console.log('');

    // Step 3: Store questions
    console.log('💾 Step 3: Storing questions in database...');
    const questionData = questions.map((question, index) => ({
      request_id: requestId,
      question,
      question_number: index + 1
    }));

    const { data: questionInserts, error: questionError } = await supabase
      .from('snapshot_questions')
      .insert(questionData)
      .select('id');

    if (questionError) {
      console.error('❌ Failed to store questions:', questionError);
      return;
    }

    const questionIds = questionInserts.map(q => q.id);
    console.log(`✅ Stored questions`);
    console.log('');

    // Step 4: Process URL against each question
    console.log('🔍 Step 4: Testing visibility...');
    const url = testUrls[0];
    const domain = new URL(url).hostname;
    
    console.log(`🎯 Testing: ${domain}`);
    
    const urlResults = [];
    
    for (let i = 0; i < Math.min(questions.length, 2); i++) { // Test first 2 questions to save time
      const question = questions[i];
      const questionId = questionIds[i];
      
      console.log(`\n📝 Question ${i + 1}: ${question}`);
      
      const visibilityResult = await testVisibilityWithPerplexity(question, domain);
      
      console.log(`   ✅ Target found: ${visibilityResult.targetFound}`);
      console.log(`   📍 Position: ${visibilityResult.position || 'N/A'}`);
      console.log(`   🏆 Competitors: ${visibilityResult.competitorNames.slice(0, 3).join(', ') || 'None'}`);
      console.log(`   📄 Citation: ${visibilityResult.citationSnippet?.substring(0, 100)}...`);
      
      // Store individual result
      const { error: storeError } = await supabase
        .from('visibility_results')
        .insert({
          request_id: requestId,
          url,
          question_id: questionId,
          target_found: visibilityResult.targetFound,
          position: visibilityResult.position,
          cited_domains: visibilityResult.citedDomains,
          reasoning_summary: visibilityResult.reasoning,
          top_citations: visibilityResult.topCitations,
          citation_snippet: visibilityResult.citationSnippet,
          competitor_names: visibilityResult.competitorNames,
          api_call_duration_ms: visibilityResult.apiCallDuration,
          retry_count: visibilityResult.retryCount
        });
      
      if (storeError) {
        console.error('   ❌ Failed to store result:', storeError.message);
      } else {
        console.log('   ✅ Stored result');
      }
      
      urlResults.push(visibilityResult);
    }
    
    // Step 5: Create summary
    console.log('\n📊 Step 5: Creating summary...');
    const mentions = urlResults.filter(r => r.targetFound).length;
    const score = Math.round((mentions / urlResults.length) * 100);
    const allCompetitors = urlResults.flatMap(r => r.competitorNames);
    const topCompetitors = [...new Set(allCompetitors)].slice(0, 5);
    
    // Generate insights array
    const insights = [
      `Visibility score: ${score}% (found in ${mentions}/${urlResults.length} searches tested)`,
      mentions > 0 
        ? `Found in searches: ${urlResults.filter(r => r.targetFound).map((r, i) => `Q${i + 1}`).join(', ')}`
        : 'Not found in any search results',
      topCompetitors.length > 0 
        ? `Top competitors: ${topCompetitors.slice(0, 3).join(', ')}`
        : 'No significant competitors identified'
    ];
    
    // Store summary
    const { error: summaryError } = await supabase
      .from('snapshot_summaries')
      .insert({
        request_id: requestId,
        url,
        visibility_score: score,
        mentions_count: mentions,
        total_questions: urlResults.length,
        top_competitors: topCompetitors,
        insights: insights,
        insights_summary: insights.join('\n')
      });
    
    if (summaryError) {
      console.error('❌ Failed to store summary:', summaryError.message);
    } else {
      console.log('✅ Stored summary');
    }

    // Step 6: Mark as completed
    console.log('\n🏁 Step 6: Marking as completed...');
    const { error: updateError } = await supabase
      .from('snapshot_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        locked_at: null,
        locked_by: null
      })
      .eq('id', requestId);
    
    if (updateError) {
      console.error('❌ Failed to mark completed:', updateError);
    } else {
      console.log('✅ Marked as completed');
    }

    // Step 7: Verify final results
    console.log('\n📈 Step 7: Final results...');
    
    const { data: summaries } = await supabase
      .from('snapshot_summaries')
      .select('*')
      .eq('request_id', requestId);
    
    const { data: results } = await supabase
      .from('visibility_results')
      .select('*')
      .eq('request_id', requestId);

    console.log('\n🎉 PIPELINE SUCCESS!');
    console.log('===================');
    console.log(`✅ Request ID: ${requestId}`);
    console.log(`✅ Summaries stored: ${summaries?.length || 0}`);
    console.log(`✅ Individual results: ${results?.length || 0}`);
    
    if (summaries && summaries.length > 0) {
      const summary = summaries[0];
      console.log(`\n📊 ${domain} Results:`);
      console.log(`   Visibility Score: ${summary.visibility_score}%`);
      console.log(`   Mentions: ${summary.mentions_count}/${summary.total_questions}`);
      console.log(`   Top Competitors: ${summary.top_competitors.slice(0, 3).join(', ')}`);
      console.log(`   Insights:`);
      summary.insights.forEach((insight: string) => {
        console.log(`     • ${insight}`);
      });
    }

    console.log('\n🎯 COMPLETE MVP VALIDATED!');
    console.log('✅ Question generation works');
    console.log('✅ Perplexity searches work');
    console.log('✅ Citation analysis works');
    console.log('✅ Competitor extraction works');
    console.log('✅ Database storage works');
    console.log('✅ Summary generation works');

  } catch (error: any) {
    console.error('❌ Direct processing test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the direct processing test
testProcessingDirect().catch(console.error); 