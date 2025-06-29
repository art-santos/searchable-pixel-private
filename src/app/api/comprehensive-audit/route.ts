import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateQuestions } from '@/lib/question-generator';
import { testVisibilityWithPerplexity } from '@/lib/perplexity-client';
import { analyzePageWithAEO, type PageContent } from '@/lib/aeo/technical-analyzer';

/**
 * Enhanced URL normalization to avoid www/apex domain issues
 */
function normalizeUrl(url: string): string {
  try {
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    
    const u = new URL(url);
    // Strip www. prefix to use apex domain (more reliable for crawling)
    u.hostname = u.hostname.replace(/^www\./, '');
    // Remove trailing slash
    u.pathname = u.pathname.replace(/\/$/, '') || '/';
    return u.toString();
  } catch (error) {
    console.warn(`⚠️ URL normalization failed for "${url}":`, error);
    // Fallback to simple normalization
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/$/, '');
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 Comprehensive Audit API called');
  console.log('='.repeat(80));
  
  try {
    const body = await request.json();
    const { urls, topic, userId, auditType = 'both' } = body; // 'visibility', 'technical', or 'both'
    
    console.log('📋 Audit Configuration:');
    console.log(`   URLs: ${urls?.length || 0}`);
    console.log(`   Topic: "${topic || 'not specified'}"`);
    console.log(`   User ID: ${userId || 'anonymous'}`);
    console.log(`   Audit Type: ${auditType}`);
    console.log('');
    
    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }
    
    if (urls.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 URLs allowed per comprehensive audit' },
        { status: 400 }
      );
    }
    
    if ((auditType === 'visibility' || auditType === 'both') && !topic) {
      return NextResponse.json(
        { error: 'Topic is required for visibility audits' },
        { status: 400 }
      );
    }
    
    // Environment check
    console.log('🔍 Environment Check:');
    const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasFirecrawl = !!process.env.FIRECRAWL_API_KEY;
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log(`   Perplexity API: ${hasPerplexity ? '✅' : '❌'}`);
    console.log(`   OpenAI API: ${hasOpenAI ? '✅' : '❌'}`);
    console.log(`   Firecrawl API: ${hasFirecrawl ? '✅' : '❌'}`);
    console.log(`   Supabase: ${hasSupabase ? '✅' : '❌'}`);
    console.log('');
    
    if (!hasSupabase) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 }
      );
    }
    
    if (auditType === 'technical' || auditType === 'both') {
      if (!hasFirecrawl) {
        return NextResponse.json(
          { error: 'Firecrawl API key required for technical audits' },
          { status: 500 }
        );
      }
    }
    
    if (auditType === 'visibility' || auditType === 'both') {
      if (!hasPerplexity || !hasOpenAI) {
        return NextResponse.json(
          { error: 'Perplexity and OpenAI API keys required for visibility audits' },
          { status: 500 }
        );
      }
    }
    
    // Setup Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Create audit run record
    console.log('💾 Creating audit run record...');
    
    // Handle user_id - if it's not a valid UUID, use null or generate one
    let validUserId = null;
    if (userId) {
      // Check if userId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(userId)) {
        validUserId = userId;
      } else {
        console.log(`⚠️ Non-UUID user_id provided: "${userId}", proceeding without user_id`);
      }
    }
    
    const { data: auditRun, error: auditError } = await supabase
      .from('audit_runs')
      .insert({
        user_id: validUserId, // Use null if not a valid UUID
        name: `Comprehensive Audit - ${topic || 'Technical'}`,
        description: `${auditType} audit for ${urls.length} URL(s)${userId && !validUserId ? ` (user: ${userId})` : ''}`,
        target_urls: urls,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (auditError || !auditRun) {
      console.error('❌ Failed to create audit run:', auditError);
      return NextResponse.json(
        { error: 'Failed to create audit run' },
        { status: 500 }
      );
    }
    
    const auditRunId = auditRun.id;
    console.log(`✅ Created audit run: ${auditRunId}`);
    console.log('');
    
    // Process each URL
    const results = [];
    let totalIssues = 0;
    let totalRecommendations = 0;
    let totalVisibilityScore = 0;
    let totalAeoScore = 0;
    let processedUrls = 0;
    
    for (let i = 0; i < urls.length; i++) {
      const originalUrl = urls[i];
      const normalizedUrl = normalizeUrl(originalUrl);
      
      console.log(`🔄 Processing ${i + 1}/${urls.length}: ${normalizedUrl}`);
      console.log('-'.repeat(60));
      
      try {
        let visibilityResult = null;
        let technicalResult = null;
        let pageContent = null;
        
        // Step 1: Scrape content with Firecrawl (needed for both audits)
        if (auditType === 'technical' || auditType === 'both') {
          console.log('🕷️ Step 1: Scraping content with Firecrawl...');
          pageContent = await scrapeWithFirecrawl(normalizedUrl);
          
          if (!pageContent) {
            console.error('❌ Firecrawl scraping failed, skipping technical audit');
            if (auditType === 'technical') {
              continue; // Skip this URL entirely if technical audit fails
            }
          } else {
            console.log(`✅ Scraped: ${pageContent.word_count} words, status ${pageContent.metadata?.statusCode}`);
          }
        }
        
        // Step 2: AI Visibility Testing
        if ((auditType === 'visibility' || auditType === 'both') && topic) {
          console.log('🤖 Step 2: AI Visibility Testing...');
          
          const domain = new URL(normalizedUrl).hostname.replace(/^www\./, '');
          console.log(`   Target domain: ${domain}`);
          
          // Generate questions
          const questionResult = await generateQuestions(topic, domain);
          if (!questionResult.success) {
            console.warn('⚠️ Question generation failed, using fallbacks');
          }
          
          const questions = questionResult.questions;
          console.log(`   Generated ${questions.length} questions`);
          
          // Test visibility for each question
          const visibilityTests = [];
          let mentions = 0;
          let totalPositions = 0;
          let foundCount = 0;
          
          for (let j = 0; j < questions.length; j++) {
            const question = questions[j];
            console.log(`   🎯 Testing question ${j + 1}: "${question}"`);
            
            try {
              const result = await testVisibilityWithPerplexity(question, domain);
              visibilityTests.push(result);
              
              if (result.targetFound) {
                mentions++;
                foundCount++;
                if (result.position) {
                  totalPositions += result.position;
                }
              }
              
              console.log(`   📊 Result: ${result.targetFound ? `Found at position ${result.position}` : 'Not found'}`);
              
              // Small delay between questions
              if (j < questions.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
            } catch (questionError: any) {
              console.error(`   ❌ Question test failed: ${questionError.message}`);
              visibilityTests.push({
                targetFound: false,
                position: null,
                citedDomains: [],
                competitorNames: [],
                competitorDomains: [],
                citationSnippet: null,
                reasoning: `Test failed: ${questionError.message}`,
                topCitations: [],
                apiCallDuration: 0,
                retryCount: 0
              });
            }
          }
          
          const visibilityScore = Math.round((mentions / questions.length) * 100);
          const averagePosition = foundCount > 0 ? totalPositions / foundCount : null;
          
          visibilityResult = {
            questions,
            tests: visibilityTests,
            score: visibilityScore,
            mentions,
            totalQuestions: questions.length,
            averagePosition,
            allCompetitors: visibilityTests.flatMap(t => t.competitorNames || [])
          };
          
          totalVisibilityScore += visibilityScore;
          console.log(`✅ Visibility testing complete: ${visibilityScore}% visibility`);
        }
        
        // Step 3: Technical Analysis
        if ((auditType === 'technical' || auditType === 'both') && pageContent) {
          console.log('🔍 Step 3: Technical AEO Analysis...');
          
          technicalResult = await analyzePageWithAEO(pageContent);
          totalIssues += technicalResult.issues.length;
          totalRecommendations += technicalResult.recommendations.length;
          totalAeoScore += technicalResult.overall_score;
          
          console.log(`✅ Technical analysis complete: ${technicalResult.overall_score}/100 score`);
          console.log(`   Found ${technicalResult.issues.length} issues, ${technicalResult.recommendations.length} recommendations`);
        }
        
        // Step 4: Store results in database
        console.log('💾 Step 4: Storing results...');
        
        let pageId: string | null = null;
        
        if (technicalResult && pageContent) {
          // Store technical audit results with enhanced metadata
          const enhancedMetadata = {
            ...technicalResult.analysis_metadata,
            // Add comprehensive link analysis data
            internal_link_count: pageContent.metadata?.links?.filter(l => l.isInternal)?.length || 0,
            external_eeat_links: pageContent.metadata?.links?.filter(l => l.isEEAT)?.length || 0,
            total_links: pageContent.metadata?.links?.length || 0,
            // Add image analysis data
            total_images: pageContent.metadata?.images?.length || 0,
            image_alt_present_percent: pageContent.metadata?.images?.length > 0 ? 
              Math.round((pageContent.metadata.images.filter(img => img.hasAlt).length / pageContent.metadata.images.length) * 100) : 0,
            // Add technical metrics
            html_size: pageContent.metadata?.htmlSize || 0,
            html_size_kb: pageContent.metadata?.htmlSize ? Math.round((pageContent.metadata.htmlSize / 1024) * 100) / 100 : 0,
            dom_nodes: pageContent.metadata?.domNodes || 0,
            dom_size_kb: pageContent.metadata?.domNodes ? Math.round((pageContent.metadata.domNodes / 1000) * 100) / 100 : 0,
            // Add schema data
            jsonld_valid: pageContent.metadata?.hasJsonLd || false,
            schema_types: pageContent.metadata?.schemaTypes || [],
            // Add content structure data
            h1_present: pageContent.metadata?.headings?.some(h => h.level === 1) || false,
            h1_count: pageContent.metadata?.headings?.filter(h => h.level === 1)?.length || 0,
            heading_depth: pageContent.metadata?.headings?.length > 0 ? 
              Math.max(...pageContent.metadata.headings.map(h => h.level)) : 0,
            // Store timestamp and rendering info in metadata
            processed_at: new Date().toISOString(),
            rendering_mode: technicalResult.rendering_mode || 'UNKNOWN',
            ssr_score_penalty: technicalResult.ssr_score_penalty || 0
          };

          // Store page data without problematic constraint columns
          const { data: pageData, error: pageError } = await supabase
            .from('pages')
            .upsert({
              url: normalizedUrl,
              domain: new URL(normalizedUrl).hostname,
              title: pageContent.title,
              meta_description: pageContent.meta_description,
              content: pageContent.content.substring(0, 50000),
              markdown: pageContent.markdown.substring(0, 50000),
              word_count: pageContent.word_count,
              aeo_score: technicalResult.overall_score,
              content_quality_score: technicalResult.category_scores.content_quality,
              technical_health_score: technicalResult.category_scores.technical_health,
              media_accessibility_score: technicalResult.category_scores.media_accessibility,
              schema_markup_score: technicalResult.category_scores.schema_markup,
              ai_optimization_score: technicalResult.category_scores.ai_optimization,
              analysis_metadata: enhancedMetadata,
              scraped_at: new Date().toISOString(),
              analyzed_at: technicalResult.analysis_metadata.analyzed_at || new Date().toISOString()
            }, {
              onConflict: 'url'
            })
            .select('id')
            .single();

          if (pageError) {
            console.error('❌ Page storage failed:', pageError.message);
          } else {
            pageId = pageData.id;
            console.log(`✅ Stored page data: ${pageId}`);
          }
        }
        
        // Compile result summary
        const urlResult = {
          url: normalizedUrl,
          visibility: visibilityResult ? {
            score: visibilityResult.score,
            mentions: visibilityResult.mentions,
            totalQuestions: visibilityResult.totalQuestions,
            averagePosition: visibilityResult.averagePosition,
            topCompetitors: [...new Set(visibilityResult.allCompetitors)].slice(0, 3)
          } : null,
          technical: technicalResult ? {
            overallScore: technicalResult.overall_score,
            categoryScores: technicalResult.category_scores,
            issuesCount: technicalResult.issues.length,
            recommendationsCount: technicalResult.recommendations.length,
            criticalIssues: technicalResult.issues.filter(i => i.severity === 'critical').length,
            warningIssues: technicalResult.issues.filter(i => i.severity === 'warning').length
          } : null,
          pageId
        };
        
        results.push(urlResult);
        processedUrls++;
        
        console.log(`🎉 Completed ${normalizedUrl}`);
        console.log('='.repeat(80));
        console.log('');
        
        // Small delay between URLs
        if (i < urls.length - 1) {
          console.log('⏳ Waiting 3 seconds before next URL...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (urlError: any) {
        console.error(`❌ Error processing ${normalizedUrl}:`, urlError.message);
        console.error('Stack:', urlError.stack);
        
        results.push({
          url: normalizedUrl,
          error: urlError.message,
          visibility: null,
          technical: null,
          pageId: null
        });
      }
    }
    
    // Update audit run with final results
    console.log('📊 Updating audit run statistics...');
    
    const avgVisibilityScore = processedUrls > 0 ? Math.round(totalVisibilityScore / processedUrls) : 0;
    const avgAeoScore = processedUrls > 0 ? Math.round(totalAeoScore / processedUrls) : 0;
    
    await supabase
      .from('audit_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        pages_analyzed: processedUrls,
        total_issues: totalIssues,
        total_recommendations: totalRecommendations,
        average_aeo_score: avgAeoScore
      })
      .eq('id', auditRunId);
    
    // Update detailed stats if we have the function
    try {
      await supabase.rpc('update_audit_run_stats', { run_id: auditRunId });
    } catch (statsError) {
      console.warn('⚠️ Failed to update detailed stats:', statsError);
    }
    
    console.log('🏁 Comprehensive audit complete!');
    console.log('');
    console.log('📊 Final Summary:');
    console.log(`   URLs processed: ${processedUrls}/${urls.length}`);
    console.log(`   Total issues found: ${totalIssues}`);
    console.log(`   Total recommendations: ${totalRecommendations}`);
    console.log(`   Average visibility score: ${avgVisibilityScore}%`);
    console.log(`   Average AEO score: ${avgAeoScore}/100`);
    console.log(`   Audit run ID: ${auditRunId}`);
    
    return NextResponse.json({
      success: true,
      auditRunId,
      summary: {
        urlsProcessed: processedUrls,
        totalUrls: urls.length,
        totalIssues,
        totalRecommendations,
        averageVisibilityScore: avgVisibilityScore,
        averageAeoScore: avgAeoScore,
        auditType,
        topic: topic || null
      },
      results,
      message: `Comprehensive audit completed successfully. Processed ${processedUrls}/${urls.length} URLs.`
    });
    
  } catch (error: any) {
    console.error('❌ Comprehensive audit error:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({
      error: error.message || 'Comprehensive audit failed',
      details: error.stack
    }, { status: 500 });
  }
}

/**
 * Scrapes content using Firecrawl API with retry logic
 */
async function scrapeWithFirecrawl(url: string): Promise<PageContent | null> {
  console.log(`   🌐 Scraping: ${url}`);
  
  // Retry logic for timeouts and server errors
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`   🔄 Attempt ${attempt}/3...`);
      
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          formats: ['markdown', 'html'],
          includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'img'],
          excludeTags: ['script', 'style', 'nav', 'footer', 'aside'],
          waitFor: attempt === 1 ? 8000 : (attempt === 2 ? 5000 : 3000), // Progressive reduction: 8s -> 5s -> 3s  
          timeout: attempt === 1 ? 35000 : (attempt === 2 ? 25000 : 20000), // Progressive reduction: 35s -> 25s -> 20s
          onlyMainContent: true // Focus on main content to speed up processing
        })
      });

      if (!response.ok) {
        // Retry on server errors (5xx) and timeouts (408)
        if ((response.status >= 500 || response.status === 408) && attempt < 3) {
          console.log(`   ⚠️ ${response.status} ${response.statusText}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Progressive delay
          continue;
        }
        throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`   ✅ Firecrawl response received (attempt ${attempt})`);
      
      const content = data.data?.content || '';
      const markdown = data.data?.markdown || '';
      const html = data.data?.html || '';
      const metadata = data.data?.metadata || {};
      
      const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;
      
      const pageContent: PageContent = {
        url,
        title: metadata.title || '',
        meta_description: metadata.description || '',
        content,
        markdown,
        html: html.length > 100000 ? html.substring(0, 100000) + '...[truncated]' : html,
        word_count: wordCount,
        metadata: {
          statusCode: metadata.statusCode || 200,
          ogTitle: metadata.ogTitle,
          ogDescription: metadata.ogDescription,
          ogImage: metadata.ogImage,
          canonicalUrl: metadata.canonicalUrl,
          language: metadata.language,
          author: metadata.author,
          publishDate: metadata.publishDate,
          modifiedDate: metadata.modifiedDate,
          schema: metadata.schema
        }
      };
      
      console.log(`   📊 Processed: ${wordCount} words, ${html.length} chars HTML`);
      
      return pageContent;
      
    } catch (error: any) {
      console.error(`   ❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === 3) {
        console.error(`   💥 All retry attempts failed for ${url}`);
        return null;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
  
  return null;
} 