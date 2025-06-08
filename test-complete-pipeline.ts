import dotenv from 'dotenv';
import { getSupabaseServer } from './src/lib/supabase-client';
import { generateQuestions } from './src/lib/question-generator';
import { testVisibilityWithPerplexity } from './src/lib/perplexity-client';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.server', override: true });

async function testCompletePipeline() {
  console.log('🚀 Testing Complete Snapshot Processing Pipeline\n');

  // Test data - create a request first
  const testUrls = ['https://mercury.com', 'https://notion.so'];
  const testTopic = 'startup banking and productivity tools';

  console.log('📋 Test Configuration:');
  console.log(`   URLs: ${testUrls.join(', ')}`);
  console.log(`   Topic: ${testTopic}`);
  console.log('');

  try {
    const supabase = getSupabaseServer();

    // Step 1: Create a snapshot request
    console.log('🚀 Step 1: Creating snapshot request...');
    const { data: requestData, error: requestError } = await supabase
      .from('snapshot_requests')
      .insert({
        user_id: null, // Testing without user
        urls: testUrls,
        topic: testTopic,
        status: 'pending'
      })
      .select('id')
      .single();

    if (requestError || !requestData) {
      console.error('❌ Failed to create request:', requestError);
      return;
    }

    const requestId = requestData.id;
    console.log(`✅ Created snapshot request: ${requestId}`);
    console.log('');

    // Step 2: Simulate claiming the job (like Edge Function would)
    console.log('🔄 Step 2: Claiming job for processing...');
    const { data: claimData, error: claimError } = await supabase
      .rpc('claim_next_snapshot', { 
        worker_id: 'test-worker',
        lock_timeout_minutes: 10
      });

    if (claimError || !claimData?.[0]) {
      console.error('❌ Failed to claim job:', claimError);
      return;
    }

    const job = claimData[0];
    console.log(`✅ Claimed job: ${job.id}`);
    console.log(`   URLs: ${job.urls.length}`);
    console.log(`   Topic: ${job.topic}`);
    console.log('');

    // Step 3: Generate questions
    console.log('🤖 Step 3: Generating questions...');
    const questionResult = await generateQuestions(job.topic);
    
    if (!questionResult.success) {
      throw new Error(`Question generation failed: ${questionResult.error}`);
    }

    const { questions } = questionResult;
    console.log(`✅ Generated ${questions.length} questions:`);
    questions.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
    console.log('');

    // Step 4: Store questions
    console.log('💾 Step 4: Storing questions in database...');
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
    console.log(`✅ Stored questions with IDs: ${questionIds.slice(0, 2).join(', ')}...`);
    console.log('');

    // Step 5: Process each URL against each question
    console.log('🔍 Step 5: Testing visibility for each URL...');
    const allResults = [];

    for (const url of job.urls) {
      console.log(`\n🎯 Testing URL: ${url}`);
      
      // Extract domain from URL for visibility testing
      const domain = new URL(url).hostname;
      console.log(`   Domain: ${domain}`);
      
      const urlResults = [];
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionId = questionIds[i];
        
        console.log(`   📝 Question ${i + 1}: ${question.substring(0, 50)}...`);
        
        const visibilityResult = await testVisibilityWithPerplexity(question, domain);
        
        console.log(`      Target found: ${visibilityResult.targetFound}`);
        console.log(`      Position: ${visibilityResult.position || 'N/A'}`);
        console.log(`      Competitors: ${visibilityResult.competitorNames.slice(0, 2).join(', ')}`);
        
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
          console.error('      ❌ Failed to store result:', storeError.message);
        } else {
          console.log('      ✅ Stored result');
        }
        
        urlResults.push(visibilityResult);
      }
      
      // Create summary for this URL
      const mentions = urlResults.filter(r => r.targetFound).length;
      const score = Math.round((mentions / questions.length) * 100);
      const allCompetitors = urlResults.flatMap(r => r.competitorNames);
      const topCompetitors = [...new Set(allCompetitors)].slice(0, 5);
      
      // Generate insights array
      const insights = [
        `Visibility score: ${score}% (found in ${mentions}/${questions.length} searches)`,
        mentions > 0 
          ? `Best performance on: ${urlResults.filter(r => r.targetFound).map(r => r.reasoning).slice(0, 2).join('; ')}`
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
          total_questions: questions.length,
          top_competitors: topCompetitors,
          insights: insights,
          insights_summary: insights.join('\n')
        });
      
      if (summaryError) {
        console.error(`   ❌ Failed to store summary:`, summaryError.message);
      } else {
        console.log(`   ✅ Stored summary (${score}% visibility)`);
      }
      
      allResults.push({
        url,
        domain,
        score,
        mentions,
        topCompetitors: topCompetitors.slice(0, 3)
      });
    }

    // Step 6: Mark job as completed
    console.log('\n🏁 Step 6: Marking job as completed...');
    const { error: completeError } = await supabase.rpc('complete_snapshot', {
      request_id: requestId,
      success: true,
      error_msg: null
    });
    
    if (completeError) {
      console.error('❌ Failed to mark job complete:', completeError);
    } else {
      console.log('✅ Job marked as completed');
    }

    // Step 7: Verify final results
    console.log('\n📊 Step 7: Verifying stored results...');
    
    const { data: summaries } = await supabase
      .from('snapshot_summaries')
      .select('*')
      .eq('request_id', requestId);
    
    const { data: results } = await supabase
      .from('visibility_results')
      .select('*')
      .eq('request_id', requestId);

    console.log(`✅ Final verification:`);
    console.log(`   Summaries stored: ${summaries?.length || 0}`);
    console.log(`   Individual results: ${results?.length || 0}`);
    
    // Display final results
    console.log('\n🎉 FINAL RESULTS:');
    console.log('================');
    
    if (summaries && summaries.length > 0) {
      summaries.forEach((summary, index) => {
        console.log(`\n${index + 1}. ${new URL(summary.url).hostname}`);
        console.log(`   Visibility Score: ${summary.visibility_score}%`);
        console.log(`   Mentions: ${summary.mentions_count}/${summary.total_questions}`);
        console.log(`   Top Competitors: ${summary.top_competitors.slice(0, 3).join(', ')}`);
        console.log(`   Key Insights:`);
        summary.insights.forEach((insight: string) => {
          console.log(`     • ${insight}`);
        });
      });
    }

    console.log(`\n🎯 Complete Pipeline Test: SUCCESS!`);
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Total API calls: ${allResults.length * questions.length}`);
    console.log(`   Processing complete: ${allResults.map(r => `${r.domain}: ${r.score}%`).join(', ')}`);

  } catch (error: any) {
    console.error('❌ Pipeline test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the complete pipeline test
testCompletePipeline().catch(console.error); 