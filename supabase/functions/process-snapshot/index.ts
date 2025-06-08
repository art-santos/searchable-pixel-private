// @ts-ignore - Deno edge function remote import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore - Deno requires .ts extension for local imports
import { analyzePageWithAEO, type PageContent, type AEOAnalysisResult } from './technical-analyzer.ts';

const supabaseServer = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req: Request) => {
  console.log('🔄 Snapshot processor starting...');
  
  try {
    const body = await req.json();
    const { user_id } = body;
    
    // Process all pending snapshots in a waterfall queue
    let processedCount = 0;
    let lastRequestId: string | undefined;
    const maxSnapshots = 10; // Prevent infinite loops and timeouts
    
    console.log('🌊 Starting waterfall queue processing...');
    
    while (processedCount < maxSnapshots) {
      const result = await processNextSnapshot(user_id);
      
      if (!result.success && result.error) {
        // If there was an actual error, stop processing
        console.error(`❌ Stopping queue due to error: ${result.error}`);
        return new Response(JSON.stringify(result), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (result.message === 'No pending snapshots') {
        // No more snapshots to process
        console.log('✅ Queue empty, all snapshots processed');
        break;
      }
      
      if (result.requestId) {
        processedCount++;
        lastRequestId = result.requestId;
        console.log(`✅ Processed snapshot ${processedCount}: ${result.requestId}`);
        
        // Small delay between snapshots to prevent overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`🎉 Waterfall complete: Processed ${processedCount} snapshot(s)`);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: processedCount > 0 
        ? `Successfully processed ${processedCount} snapshot(s)` 
        : 'No pending snapshots to process',
      processedCount,
      lastRequestId
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function processNextSnapshot(preferredUserId?: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  requestId?: string;
}> {
  console.log('🔍 Looking for pending snapshots...');
  
  let currentRequestId: string | undefined;
  
  try {
    // Claim the next pending snapshot
    const workerId = `edge-function-${Date.now()}`;
    const { data: claimedRequest, error: claimError } = await supabaseServer
      .rpc('claim_next_snapshot', { 
        worker_id: workerId,
        lock_timeout_minutes: 10 
      });
    
    if (claimError) {
      console.error('❌ Error claiming snapshot:', claimError);
      return { 
        success: false, 
        error: claimError.message 
      };
    }
    
    if (!claimedRequest || claimedRequest.length === 0) {
      console.log('📭 No pending snapshots to process');
      return { 
        success: true, 
        message: 'No pending snapshots' 
      };
    }
    
    // Extract the first (and only) result from the array
    const snapshot = claimedRequest[0];
    currentRequestId = snapshot.id;
    console.log(`🔄 Processing snapshot: ${currentRequestId}`);
    console.log(`   URLs: ${snapshot.urls.join(', ')}`);
    console.log(`   Topic: ${snapshot.topic}`);
    
    // Process each URL in the request
    let successfulUrls = 0;
    for (const url of snapshot.urls) {
      try {
        await processUrl(currentRequestId!, url, snapshot.topic);
        successfulUrls++;
      } catch (urlError: any) {
        console.error(`❌ Failed to process URL ${url}:`, urlError.message);
        // Continue with other URLs even if one fails
      }
    }
    
    // Generate summary and complete the snapshot
    try {
      await generateSnapshotSummary(currentRequestId!);
    } catch (summaryError: any) {
      console.error(`⚠️ Summary generation failed:`, summaryError.message);
      // Continue anyway - summary is not critical
    }
    
    await completeSnapshot(currentRequestId!);
    
    console.log(`✅ Completed snapshot: ${currentRequestId} (${successfulUrls}/${snapshot.urls.length} URLs processed)`);
    
    return {
      success: true,
      message: 'Snapshot processed successfully',
      requestId: currentRequestId
    };
    
  } catch (error: any) {
    console.error('❌ Processing error:', error);
    
    // If we have a request ID, mark it as failed so it doesn't block the queue
    if (currentRequestId) {
      console.log(`🚨 Marking snapshot ${currentRequestId} as failed to unblock queue`);
      try {
        await supabaseServer
          .from('snapshot_requests')
          .update({ 
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', currentRequestId);
      } catch (updateError: any) {
        console.error('Failed to update snapshot status:', updateError);
      }
    }
    
    // Return success: true with an error message to continue processing other snapshots
    return {
      success: true,
      message: 'Snapshot failed but queue continues',
      error: error.message,
      requestId: currentRequestId
    };
  }
}

async function processUrl(requestId: string, url: string, topic: string): Promise<void> {
  console.log(`🔄 Processing URL: ${url} for topic: ${topic}`);
  
  // Set a 5-minute timeout for processing a single URL
  const timeoutMs = 5 * 60 * 1000; // 5 minutes
  const startTime = Date.now();
  
  try {
    // Extract domain from URL
    const domain = new URL(url).hostname.replace(/^www\./, '');
    
      // Generate questions for this topic
  const { questions, success: questionsSuccess } = await generateQuestions(topic, domain);
  
  if (!questionsSuccess) {
    console.log('⚠️ Question generation failed, using fallbacks');
  }
  
  // Store questions in database
  await storeQuestions(requestId, questions);
  
  // Test visibility for each question in concurrent batches of 10
  const results = [];
  const batchSize = 10;
  
  console.log(`🚀 Processing ${questions.length} questions in batches of ${batchSize}`);
  
  for (let batchStart = 0; batchStart < questions.length; batchStart += batchSize) {
    const batch = questions.slice(batchStart, batchStart + batchSize);
    const batchNumber = Math.floor(batchStart / batchSize) + 1;
    const totalBatches = Math.ceil(questions.length / batchSize);
    
    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} questions)`);
    
    // Process batch concurrently
    const batchPromises = batch.map(async (questionObj, batchIndex) => {
      const globalIndex = batchStart + batchIndex;
      const questionNumber = globalIndex + 1;
      
      console.log(`🔍 Testing question ${questionNumber} (${questionObj.type}): ${questionObj.text}`);
      
      try {
        const result = await testVisibilityWithPerplexity(questionObj.text, domain);
        
        // Store individual result with enhanced metadata
        console.log(`💾 Storing result for Q${questionNumber}:`, {
          target_found: result.targetFound,
          position: result.position,
          citation_snippet_preview: result.citationSnippet?.substring(0, 100) + '...',
          citation_snippet_length: result.citationSnippet?.length
        });
        
        const { error: storeError } = await supabaseServer
          .from('visibility_results')
          .insert({
            request_id: requestId,
            url,
            question_text: questionObj.text,
            question_number: questionNumber,
            question_type: questionObj.type,
            question_weight: questionObj.weight,
            target_found: result.targetFound,
            position: result.position,
            cited_domains: result.citedDomains,
            competitor_domains: result.competitors,
            competitor_names: result.competitorNames,
            citation_snippet: result.citationSnippet,
            reasoning_summary: result.reasoning,
            search_results_metadata: {
              api_call_duration_ms: result.apiCallDuration,
              retry_count: result.retryCount,
              top_citations: result.topCitations
            }
          });
        
        if (storeError) {
          console.error(`Failed to store visibility result for question ${questionNumber}:`, storeError);
        } else {
          console.log(`💾 Stored result for question ${questionNumber}`);
        }
        
        return { success: true, result, questionNumber };
        
      } catch (error: any) {
        console.error(`❌ Failed to test question ${questionNumber} "${questionObj.text}":`, error.message);
        
        // Store failed result
        await supabaseServer
          .from('visibility_results')
          .insert({
            request_id: requestId,
            url,
            question_text: questionObj.text,
            question_number: questionNumber,
            question_type: questionObj.type,
            question_weight: questionObj.weight,
            target_found: false,
            position: null,
            cited_domains: [],
            competitor_domains: [],
            competitor_names: [],
            citation_snippet: null,
            reasoning_summary: `Test failed: ${error.message}`,
            search_results_metadata: {
              api_call_duration_ms: 0,
              retry_count: 0,
              error: error.message
            }
          });
          
        return { success: false, error: error.message, questionNumber };
      }
    });
    
    // Wait for entire batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Collect successful results
    batchResults.forEach(batchResult => {
      if (batchResult.success) {
        results.push(batchResult.result);
      }
    });
    
    console.log(`✅ Batch ${batchNumber} completed: ${batchResults.filter(r => r.success).length}/${batch.length} successful`);
    
    // Small delay between batches to be respectful to APIs
    if (batchStart + batchSize < questions.length) {
      console.log(`⏱️ Waiting 2s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Scrape page content and run technical audit
  try {
    const pageContentRecord = await scrapePageContent(requestId, url);
    
    // Run technical audit if scraping was successful
    if (pageContentRecord && pageContentRecord.scrape_success) {
      console.log(`🔍 Running technical audit for: ${url}`);
      
      try {
        // Prepare page content for technical analysis
        const pageContent: PageContent = {
          url: pageContentRecord.url,
          title: pageContentRecord.title,
          meta_description: pageContentRecord.meta_description,
          content: pageContentRecord.raw_content,
          markdown: pageContentRecord.raw_markdown,
          html: pageContentRecord.raw_html,
          word_count: pageContentRecord.word_count,
          metadata: pageContentRecord.firecrawl_metadata
        };
        
        // Run enhanced technical analysis
        const technicalResult = await analyzePageWithAEO(pageContent);
        
        // Store technical audit results in enhanced database tables
        await storeTechnicalAuditResults(requestId, url, technicalResult);
        
        console.log(`✅ Technical audit complete: ${technicalResult.weighted_score}/100 (${technicalResult.rendering_mode})`);
        console.log(`   Found ${technicalResult.issues.length} issues, ${technicalResult.recommendations.length} recommendations`);
        
      } catch (auditError: any) {
        console.error(`❌ Technical audit failed for ${url}:`, auditError.message);
        // Continue with snapshot processing even if technical audit fails
      }
    } else {
      console.log(`⚠️ Skipping technical audit - page scraping failed for ${url}`);
    }
    
  } catch (scrapeError: any) {
    console.error(`⚠️ Page scraping failed for ${url}:`, scrapeError.message);
    // Don't fail the whole process if scraping fails
  }
  
    console.log(`✅ Completed processing ${url} - ${results.length} questions tested`);
    
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= timeoutMs) {
      console.error(`⏱️ URL processing timeout after ${Math.round(elapsedTime / 1000)}s: ${url}`);
      throw new Error(`Processing timeout for ${url} after ${Math.round(elapsedTime / 1000)} seconds`);
    }
    console.error(`❌ Error processing URL ${url}:`, error.message);
    throw error;
  }
}

async function generateSnapshotSummary(requestId: string): Promise<void> {
  console.log(`📊 Generating summary for request: ${requestId}`);
  
  try {
    // Get all visibility results for this request grouped by URL
    const { data: results, error: resultsError } = await supabaseServer
      .from('visibility_results')
      .select('*')
      .eq('request_id', requestId);
    
    if (resultsError || !results) {
      console.error('Failed to fetch results for summary:', resultsError);
      return;
    }
    
    // Group results by URL
    const resultsByUrl = results.reduce((acc: Record<string, any[]>, result: any) => {
      if (!acc[result.url]) acc[result.url] = [];
      acc[result.url].push(result);
      return acc;
    }, {});
    
    // Generate summary for each URL with enhanced weighted scoring
    for (const [url, urlResults] of Object.entries(resultsByUrl)) {
      const urlResultsTyped = urlResults as any[];
      
      // Group by question type for weighted scoring
      const directHits = urlResultsTyped.filter((r: any) => r.question_type === 'direct' && r.target_found).length;
      const indirectHits = urlResultsTyped.filter((r: any) => r.question_type === 'indirect' && r.target_found).length;
      const comparisonHits = urlResultsTyped.filter((r: any) => r.question_type === 'comparison' && r.target_found).length;
      
      const directTotal = urlResultsTyped.filter((r: any) => r.question_type === 'direct').length;
      const indirectTotal = urlResultsTyped.filter((r: any) => r.question_type === 'indirect').length;
      const comparisonTotal = urlResultsTyped.filter((r: any) => r.question_type === 'comparison').length;
      
      // Calculate weighted score using the enhanced formula (10 direct + 20 indirect + 10 comparison = 40 total)
      const weightedScore = (
        (directHits / Math.max(directTotal, 1)) * 1 +
        (indirectHits / Math.max(indirectTotal, 1)) * 2 +
        (comparisonHits / Math.max(comparisonTotal, 1)) * 3
      ) / 6; // total weighted prompt "value"
      
      // Scale to 0-100 with scoring bands and apply floor
      let visibilityScore = Math.round(weightedScore * 100);
      
      // Apply scoring bands with floor
      if (visibilityScore > 0 && visibilityScore < 15) {
        visibilityScore = 15; // Floor for any visibility
      }
      
      // Cap at 100
      visibilityScore = Math.min(visibilityScore, 100);
      
      const totalQuestions = urlResultsTyped.length;
      const mentionsCount = directHits + indirectHits + comparisonHits;
      
      console.log(`📊 Enhanced scoring for ${url}:`, {
        direct: `${directHits}/${directTotal}`,
        indirect: `${indirectHits}/${indirectTotal}`,
        comparison: `${comparisonHits}/${comparisonTotal}`,
        weighted_score: weightedScore,
        final_score: visibilityScore
      });
      
      // Collect all competitor names
      const allCompetitors = urlResultsTyped.flatMap((r: any) => r.competitor_names || []);
      const topCompetitors = [...new Set(allCompetitors)].slice(0, 5);
      
      // Generate enhanced insights based on scoring bands and question types
      const insights = [];
      
      // Scoring band insights
      if (visibilityScore >= 81) {
        insights.push(`🏆 AI-native category leader: Dominant presence across all search types (${visibilityScore}/100)`);
        insights.push(`Your brand is exceptionally well-positioned in AI search results`);
      } else if (visibilityScore >= 61) {
        insights.push(`🎯 Dominant AI visibility: Strong performance across search categories (${visibilityScore}/100)`);
        insights.push(`Your brand consistently appears in relevant AI responses`);
      } else if (visibilityScore >= 41) {
        insights.push(`👀 Good AI visibility: Notable presence in search results (${visibilityScore}/100)`);
        insights.push(`You're competing well but have room for improvement in category queries`);
      } else if (visibilityScore >= 21) {
        insights.push(`💡 Light AI presence: Found in some searches (${visibilityScore}/100)`);
        insights.push(`Focus on improving content depth and category positioning`);
      } else {
        insights.push(`🔍 Limited AI visibility: Minimal presence detected (${visibilityScore}/100)`);
        insights.push(`Priority: Establish foundational content strategy for AI discoverability`);
      }
      
      // Question type-specific insights
      if (directHits === 0 && directTotal > 0) {
        insights.push(`📝 Direct queries: Not found for brand-specific searches - improve brand authority content`);
      } else if (directHits > 0) {
        insights.push(`✅ Direct queries: ${directHits}/${directTotal} brand mentions found`);
      }
      
      if (indirectHits === 0 && indirectTotal > 0) {
        insights.push(`🎯 Category queries: Missing from ${indirectTotal} category searches - expand use case content`);
      } else if (indirectHits > 0) {
        insights.push(`🔍 Category visibility: Appearing in ${indirectHits}/${indirectTotal} category searches`);
      }
      
      if (comparisonHits === 0 && comparisonTotal > 0) {
        insights.push(`⚔️ Competitive queries: Not mentioned in ${comparisonTotal} comparison searches`);
      } else if (comparisonHits > 0) {
        insights.push(`🥊 Competitive presence: Featured in ${comparisonHits}/${comparisonTotal} comparison results`);
      }
      
      if (topCompetitors.length > 0) {
        insights.push(`🏢 Main competitors mentioned: ${topCompetitors.slice(0, 3).join(', ')}`);
      }
      
      // Store summary
      const { error: summaryError } = await supabaseServer
        .from('snapshot_summaries')
        .insert({
          request_id: requestId,
          url,
          visibility_score: visibilityScore,
          mentions_count: mentionsCount,
          total_questions: totalQuestions,
          top_competitors: topCompetitors,
          insights,
          insights_summary: insights.join(' ')
        });
      
      if (summaryError) {
        console.error(`Failed to store summary for ${url}:`, summaryError);
      } else {
        console.log(`💾 Stored summary for ${url} - ${visibilityScore}% visibility`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Summary generation failed:', error);
  }
}

async function completeSnapshot(requestId: string): Promise<void> {
  console.log(`✅ Completing snapshot: ${requestId}`);
  
  try {
    const { error } = await supabaseServer.rpc('complete_snapshot', {
      request_id: requestId,
      success: true,
      error_msg: null
    });
    
    if (error) {
      console.error('Failed to complete snapshot:', error);
      // Fallback: update directly
      await supabaseServer
        .from('snapshot_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);
    } else {
      console.log(`🎉 Snapshot ${requestId} marked as completed`);
    }
  } catch (error: any) {
    console.error('❌ Error completing snapshot:', error);
  }
}

/**
 * Stores technical audit results in enhanced database tables
 */
async function storeTechnicalAuditResults(
  requestId: string, 
  url: string, 
  technicalResult: AEOAnalysisResult
): Promise<void> {
  console.log(`💾 Storing technical audit results for: ${url}`);
  
  try {
    // Store in pages table with enhanced fields
    const { data: pageData, error: pageError } = await supabaseServer
      .from('pages')
      .upsert({
        url,
        domain: new URL(url).hostname,
        title: technicalResult.url === url ? '' : technicalResult.url, // Extract title from technical result
        meta_description: '',
        content: '',
        word_count: technicalResult.analysis_metadata.content_length,
        aeo_score: technicalResult.overall_score,
        weighted_aeo_score: technicalResult.weighted_score,
        rendering_mode: technicalResult.rendering_mode,
        ssr_score_penalty: technicalResult.ssr_score_penalty,
        content_quality_score: technicalResult.category_scores.content_quality,
        technical_health_score: technicalResult.category_scores.technical_health,
        media_accessibility_score: technicalResult.category_scores.media_accessibility,
        schema_markup_score: technicalResult.category_scores.schema_markup,
        ai_optimization_score: technicalResult.category_scores.ai_optimization,
        analysis_metadata: technicalResult.analysis_metadata,
        analyzed_at: technicalResult.analysis_metadata.analyzed_at
      }, { onConflict: 'url' })
      .select('id')
      .single();
    
    if (pageError) {
      console.error(`❌ Failed to store page data:`, pageError);
      return;
    }
    
    const pageId = pageData.id;
    console.log(`✅ Stored page with ID: ${pageId}`);
    
    // Store issues with AI diagnostics
    if (technicalResult.issues.length > 0) {
      const issueData = technicalResult.issues.map(issue => ({
        page_id: pageId,
        severity: issue.severity,
        category: issue.category,
        title: issue.title,
        description: issue.description,
        impact: issue.impact,
        fix_priority: issue.fix_priority,
        diagnostic: issue.diagnostic || null,
        html_snippet: issue.html_snippet || null,
        rule_parameters: issue.rule_parameters || null
      }));
      
      const { error: issueError } = await supabaseServer
        .from('page_issues')
        .upsert(issueData, { onConflict: 'page_id,title' });
      
      if (issueError) {
        console.error(`❌ Failed to store issues:`, issueError);
      } else {
        console.log(`🚨 Stored ${technicalResult.issues.length} issues with diagnostics`);
      }
    }
    
    // Store recommendations
    if (technicalResult.recommendations.length > 0) {
      const recData = technicalResult.recommendations.map(rec => ({
        page_id: pageId,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        implementation: rec.implementation,
        expected_impact: rec.expected_impact,
        effort_level: rec.effort_level,
        priority_score: rec.priority_score
      }));
      
      const { error: recError } = await supabaseServer
        .from('page_recommendations')
        .upsert(recData, { onConflict: 'page_id,title' });
      
      if (recError) {
        console.error(`❌ Failed to store recommendations:`, recError);
      } else {
        console.log(`💡 Stored ${technicalResult.recommendations.length} recommendations`);
      }
    }
    
    // TODO: Link page to snapshot request when audit_runs schema is properly set up
    // For now, we skip this linking step to avoid foreign key constraint violations
    console.log(`📋 Page stored successfully (linking skipped for now)`);
    
    console.log(`✅ Technical audit results stored successfully`);
    
  } catch (error: any) {
    console.error(`❌ Error storing technical audit results:`, error);
  }
}

// Helper functions for Edge Function context

async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  requestsToday: number;
  limit: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabaseServer
    .from('user_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('day', today)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    console.error('Rate limit check failed:', error);
    return { allowed: false, requestsToday: 0, limit: 5 };
  }
  
  const currentCount = data?.requests_count || 0;
  const limit = 5;
  
  return {
    allowed: currentCount < limit,
    requestsToday: currentCount,
    limit
  };
}

async function incrementRateLimit(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { error } = await supabaseServer.rpc('increment_user_rate_limit', {
      p_user_id: userId,
      p_target_day: today
    });
      
    return !error;
  } catch (error: any) {
    console.error('Rate limit increment error:', error);
    return false;
  }
}

async function storeQuestions(
  requestId: string, 
  questions: { text: string; type: 'direct' | 'indirect' | 'comparison'; weight: number }[]
): Promise<{ success: boolean; questionIds: string[] }> {
  try {
    const questionData = questions.map((questionObj, index) => ({
      request_id: requestId,
      question: questionObj.text,
      question_number: index + 1,
      question_type: questionObj.type,
      weight: questionObj.weight
    }));

    const { data, error } = await supabaseServer
      .from('snapshot_questions')
      .insert(questionData)
      .select('id');

    if (error) {
      console.error('❌ Failed to store questions:', error);
      return { success: false, questionIds: [] };
    }

    return { success: true, questionIds: data.map((q: any) => q.id) };
  } catch (error: any) {
    console.error('❌ Store questions error:', error);
    return { success: false, questionIds: [] };
  }
}

async function scrapePageContent(requestId: string, url: string): Promise<{
  url: string;
  title: string;
  meta_description: string;
  raw_content: string;
  raw_markdown: string;
  raw_html: string;
  word_count: number;
  firecrawl_metadata: any;
  scrape_success: boolean;
} | null> {
  console.log(`🕷️ Scraping content for: ${url}`);
  const startTime = Date.now();
  const domain = new URL(url).hostname;
  
  try {
    // Create an AbortController for timeout (failsafe)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 75s failsafe timeout
    
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('FIRECRAWL_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        includeTags: ['title', 'meta'],
        excludeTags: ['script', 'style', 'nav', 'footer'],
        waitFor: 3000, // Wait 3s for dynamic content
        timeout: 60000 // 60s timeout (more reasonable for complex sites)
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Scraped ${url} in ${duration}ms`);

    // Extract content and metadata
    const content = data.data?.content || '';
    const markdown = data.data?.markdown || '';
    const html = data.data?.html || '';
    const metadata = data.data?.metadata || {};
    
    // Truncate HTML if too large (keep under 100KB)
    const truncatedHtml = html.length > 100000 ? html.substring(0, 100000) + '...[truncated]' : html;
    
    const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;

    const pageContentData = {
      url,
        title: metadata.title || '',
        meta_description: metadata.description || '',
        raw_content: content,
        raw_markdown: markdown,
        raw_html: truncatedHtml,
        word_count: wordCount,
        firecrawl_metadata: {
          statusCode: metadata.statusCode,
          error: metadata.error,
          sourceURL: metadata.sourceURL,
          ogTitle: metadata.ogTitle,
          ogDescription: metadata.ogDescription,
          scrapedAt: new Date().toISOString()
        },
        scrape_success: true
    };

    // Store in database
    const { error } = await supabaseServer
      .from('page_content')
      .insert({
        request_id: requestId,
        ...pageContentData,
        domain,
        scrape_duration_ms: duration
      });

    if (error) {
      console.error(`Failed to store page content for ${url}:`, error);
    } else {
      console.log(`💾 Stored ${wordCount} words of content for ${domain}`);
    }
    
    // Return the page content data for technical analysis
    return pageContentData;

  } catch (error: any) {
    console.error(`❌ Failed to scrape ${url}:`, error.message);
    
    // Store error record
    const { error: storeError } = await supabaseServer
      .from('page_content')
      .insert({
        request_id: requestId,
        url,
        domain,
        title: '',
        meta_description: '',
        raw_content: '',
        raw_markdown: '',
        raw_html: '',
        word_count: 0,
        firecrawl_metadata: { error: error.message },
        scrape_duration_ms: Date.now() - startTime,
        scrape_success: false,
        scrape_error: error.message
      });

    if (storeError) {
      console.error(`Failed to store error record for ${url}:`, storeError);
    }
    
    return null;
  }
}

// Core tested functions - using our production-ready implementations

async function generateQuestions(topic: string, targetDomain: string): Promise<{
  questions: { text: string; type: 'direct' | 'indirect' | 'comparison'; weight: number }[];
  success: boolean;
  error?: string;
}> {
  console.log(`🎯 Generating enhanced question set for topic: "${topic}", domain: "${targetDomain}"`);
  
  try {
    const brandName = targetDomain.split('.')[0];
    
    // Generate all three types of questions in parallel
    const [directQuestions, indirectQuestions, comparisonQuestions] = await Promise.all([
      generateDirectQuestions(brandName, topic),
      generateIndirectQuestions(topic),
      generateComparisonQuestions(brandName, topic)
    ]);
    
    const allQuestions = [
      ...directQuestions.map(q => ({ text: q, type: 'direct' as const, weight: 1 })),
      ...indirectQuestions.map(q => ({ text: q, type: 'indirect' as const, weight: 2 })),
      ...comparisonQuestions.map(q => ({ text: q, type: 'comparison' as const, weight: 3 }))
    ];
    
    console.log(`✅ Generated ${allQuestions.length} enhanced questions:`, {
      direct: directQuestions.length,
      indirect: indirectQuestions.length,  
      comparison: comparisonQuestions.length,
      total: allQuestions.length
    });
    
    return {
      questions: allQuestions,
      success: true
    };
  } catch (error: any) {
    console.error('❌ Question generation failed:', error);
    
    // Fallback to basic questions
    const fallbackQuestions = [
      { text: `What is ${targetDomain.split('.')[0]}?`, type: 'direct' as const, weight: 1 },
      { text: `Best ${topic} tools for businesses`, type: 'indirect' as const, weight: 2 },
      { text: `${topic} software comparison 2024`, type: 'indirect' as const, weight: 2 },
      { text: `Top ${topic} platforms`, type: 'indirect' as const, weight: 2 },
      { text: `${topic} recommendations`, type: 'indirect' as const, weight: 2 }
    ];
    
    return {
      questions: fallbackQuestions,
      success: false,
      error: error.message
    };
  }
}

async function generateDirectQuestions(brandName: string, topic: string): Promise<string[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'Generate direct brand questions that users would ask about a specific company. Focus on informational queries.' 
        },
        { 
          role: 'user', 
          content: `Brand: "${brandName}"\nTopic: "${topic}"\n\nGenerate exactly 10 direct questions about this brand. Examples:\n- "What is ${brandName}?"\n- "How does ${brandName} work?"\n- "Who is ${brandName} for?"\n- "${brandName} pricing"\n- "${brandName} features"\n\nReturn only the questions, one per line.` 
        }
      ],
      max_tokens: 200,
      temperature: 0.8
    })
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  const questions = content.split('\n')
    .map((line: string) => line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter((q: string) => q.length > 5)
    .slice(0, 10);

  // Ensure we have exactly 10 questions
  const fallbacks = [
    `What is ${brandName}?`,
    `How does ${brandName} work?`,
    `Who is ${brandName} for?`,
    `${brandName} pricing`,
    `${brandName} features and benefits`,
    `${brandName} review`,
    `${brandName} vs competitors`,
    `${brandName} use cases`,
    `${brandName} integration options`,
    `${brandName} customer support`
  ];
  
  while (questions.length < 10) {
    questions.push(fallbacks[questions.length]);
  }
  
  return questions.slice(0, 10);
}

async function generateIndirectQuestions(topic: string): Promise<string[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'Generate category/topic questions that would surface product recommendations. Focus on "best", "top", "compare" queries.' 
        },
        { 
          role: 'user', 
          content: `Topic: "${topic}"\n\nGenerate exactly 20 indirect questions about this category. Examples:\n- "Best ${topic} tools for startups"\n- "Top ${topic} software 2024"\n- "Compare ${topic} platforms"\n- "${topic} recommendations for small business"\n\nReturn only the questions, one per line.` 
        }
      ],
      max_tokens: 300,
      temperature: 0.9
    })
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  const questions = content.split('\n')
    .map((line: string) => line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter((q: string) => q.length > 10)
    .slice(0, 20);

  // Ensure we have exactly 20 questions with fallbacks
  const fallbacks = [
    `Best ${topic} tools for businesses`,
    `Top ${topic} software 2024`,
    `${topic} platform comparison`,
    `${topic} recommendations`,
    `Most popular ${topic} tools`,
    `${topic} software for startups`,
    `Enterprise ${topic} solutions`,
    `${topic} tools for small business`,
    `${topic} platform reviews`,
    `${topic} software pricing comparison`,
    `${topic} automation tools`,
    `${topic} integration platforms`,
    `${topic} SaaS solutions`,
    `${topic} tool alternatives`,
    `${topic} software features`,
    `${topic} platform benefits`,
    `${topic} tool comparison guide`,
    `${topic} software selection`,
    `${topic} platform evaluation`,
    `${topic} solution providers`
  ];
  
  while (questions.length < 20) {
    questions.push(fallbacks[questions.length]);
  }
  
  return questions.slice(0, 20);
}

async function generateComparisonQuestions(brandName: string, topic: string): Promise<string[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'Generate comparison questions that pit a specific brand against competitors or alternatives.' 
        },
        { 
          role: 'user', 
          content: `Brand: "${brandName}"\nTopic: "${topic}"\n\nGenerate exactly 10 comparison questions. Examples:\n- "${brandName} vs [competitor]"\n- "Alternatives to ${brandName}"\n- "${brandName} competitors"\n- "Is ${brandName} better than [alternative]?"\n\nReturn only the questions, one per line.` 
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  const questions = content.split('\n')
    .map((line: string) => line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter((q: string) => q.length > 5)
    .slice(0, 10);

  // Ensure we have exactly 10 questions
  const fallbacks = [
    `${brandName} alternatives`,
    `${brandName} competitors`,
    `${brandName} vs other ${topic} tools`,
    `Is ${brandName} the best ${topic} solution?`,
    `${brandName} comparison`,
    `${brandName} vs top competitors`,
    `Better alternatives to ${brandName}`,
    `${brandName} competitive analysis`,
    `${brandName} vs market leaders`,
    `${brandName} compared to other options`
  ];
  
  while (questions.length < 10) {
    questions.push(fallbacks[questions.length]);
  }
  
  return questions.slice(0, 10);
}

async function testVisibilityWithPerplexity(question: string, targetDomain: string): Promise<{
  targetFound: boolean;
  position: number | null;
  citedDomains: string[];
  competitors: string[];
  competitorNames: string[];
  citationSnippet: string | null;
  reasoning: string;
  topCitations: any[];
  apiCallDuration: number;
  retryCount: number;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const data = await response.json();
    const citations = data.search_results || [];
    const aiAnswer = data.choices?.[0]?.message?.content || '';
    
    // Helper function to safely extract and normalize hostname
    function extractHostname(url: string): string | null {
      try {
        if (!url || typeof url !== 'string') return null;
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        const hostname = new URL(fullUrl).hostname.toLowerCase();
        return hostname.replace(/^www\./, '');
      } catch (error) {
        return null;
      }
    }

    // Normalize target domain
    const normalizedTarget = targetDomain.toLowerCase().replace(/^www\./, '');
    const targetBrandName = normalizedTarget.split('.')[0];
    
    // ALWAYS capture the AI answer as the primary citation snippet
    let citationSnippet = null;
    console.log(`🤖 Raw AI Answer (${aiAnswer.length} chars):`, aiAnswer.substring(0, 200) + '...');
    
    if (aiAnswer && aiAnswer.length > 0) {
      // Extract first 1-2 sentences or up to 300 characters
      const sentences = aiAnswer.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
      if (sentences.length >= 2) {
        citationSnippet = (sentences[0] + '.' + sentences[1] + '.').trim();
      } else if (sentences.length >= 1) {
        citationSnippet = (sentences[0] + '.').trim();
      } else {
        // Fallback to first 300 characters
        citationSnippet = aiAnswer.substring(0, 300).trim();
      }
      
      // Ensure reasonable length (50-400 characters for good readability)
      if (citationSnippet.length > 400) {
        citationSnippet = citationSnippet.substring(0, 397) + '...';
      }
      
      console.log(`📝 Extracted Citation Snippet (${citationSnippet.length} chars):`, citationSnippet);
    } else {
      citationSnippet = 'No AI response available for this query.';
      console.log(`⚠️ No AI answer received from Perplexity`);
    }

    // Check if target brand is mentioned in the AI answer
    const targetBrandLower = targetBrandName.toLowerCase();
    const answerLower = aiAnswer.toLowerCase();
    const brandMentionIndex = answerLower.indexOf(targetBrandLower);
    
    let targetFound = false;
    let targetPosition = null;
    
    if (brandMentionIndex !== -1) {
      targetFound = true;
      targetPosition = 1; // AI mentioned the brand in its answer
    } else {
      // Check if any search result URLs contain the target domain
      for (let i = 0; i < citations.length; i++) {
        const citation = citations[i];
        const hostname = extractHostname(citation.url);
        
        if (hostname && (hostname.includes(normalizedTarget) || normalizedTarget.includes(hostname))) {
          targetFound = true;
          targetPosition = i + 1;
          break;
        }
      }
    }

    // Extract competitor product names from the AI answer
    const competitorNames = aiAnswer.length > 0 
      ? await extractCompetitorsFromSnippets([aiAnswer], targetBrandName)
      : [];
    
    // Extract all domains for legacy compatibility
    const allDomains = citations
      .map((citation: any) => extractHostname(citation.url))
      .filter(Boolean);

    // Extract competitor domains (not matching target)
    const competitors = allDomains
      .filter((domain: string) => {
        return !domain.includes(normalizedTarget) && !normalizedTarget.includes(domain);
      })
      .slice(0, 5);

    const citedDomains = allDomains;

    // Store only top 5 citations to save space
    const topCitations = citations.slice(0, 5).map((citation: any) => ({
      url: citation.url,
      title: citation.title?.substring(0, 200),
      rank: citation.rank || 1
    }));

    return {
      targetFound,
      position: targetPosition,
      citedDomains,
      competitors, // Domain-based competitors (legacy)
      competitorNames, // AI-extracted product names (new)
      citationSnippet,
      reasoning: targetFound
        ? `Target found at position ${targetPosition}. Citation: "${citationSnippet?.substring(0, 100)}..."`
        : `Target not found in search results. AI identified competitors: ${competitorNames.slice(0, 3).join(', ')}`,
      topCitations,
      apiCallDuration: Date.now() - startTime,
      retryCount: 0
    };
  } catch (error: any) {
    return {
      targetFound: false,
      position: null,
      citedDomains: [],
      competitors: [],
      competitorNames: [],
      citationSnippet: null,
      reasoning: 'Search failed: ' + error.message,
      topCitations: [],
      apiCallDuration: Date.now() - startTime,
      retryCount: 0
    };
  }
}

// Extract competitor product/tool names from search result snippets
async function extractCompetitorsFromSnippets(
  snippets: string[],
  targetBrand: string
): Promise<string[]> {
  // Skip if no snippets
  if (!snippets.length || snippets.every(s => !s)) {
    return [];
  }

  const prompt = `
You are analyzing search results about "${targetBrand}" to find competing products or services mentioned.

Extract ONLY the product/service names (not website domains) that are mentioned as alternatives, competitors, or comparisons to "${targetBrand}".

Examples of what to extract:
- "Brex" (not brex.com)
- "Silicon Valley Bank" (not svb.com)  
- "Chase Business Banking" (not chase.com)
- "QuickBooks" (not intuit.com)

Do NOT include:
- Website domains (mercury.com, stripe.com, etc.)
- Generic terms (banking, fintech, startup)
- The target brand "${targetBrand}" itself

Return ONLY a JSON array of product names. If no competitors are mentioned, return [].

Search result snippets to analyze:
${snippets.map((s,i) => `${i+1}. "${s}"`).join('\n\n')}

JSON array of competitor product names:`.trim();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Extract product/tool names from text snippets. Return only a JSON array of strings.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.0
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    // Strip markdown code blocks if present
    const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    
    const competitors = JSON.parse(cleanContent);
    
    return Array.isArray(competitors) ? competitors.slice(0, 10) : [];
  } catch (error: any) {
    console.error('❌ Competitor extraction failed:', error.message);
    return [];
  }
} 