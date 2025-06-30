import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateQuestions } from '@/lib/question-generator';
import { testVisibilityWithPerplexity } from '@/lib/perplexity-client';
import { analyzePageWithAEO, type PageContent } from '@/lib/aeo/technical-analyzer';
import { generateEnhancedRecommendations, formatRecommendationsAsMarkdown } from '@/lib/aeo/enhanced-recommendations'
import { generateAIContentRecommendations } from '@/lib/aeo/ai-content-recommendations';
import { generateAEOAudit } from '@/lib/aeo/aeo-auditor';
import { EnhancedFirecrawlClient } from '@/lib/services/enhanced-firecrawl-client';

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
    
    // Only require topic for visibility audits
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
        let enhancedData = null;
        
        // Step 1: Scrape content with Enhanced Firecrawl (needed for both audits)
        if (auditType === 'technical' || auditType === 'both') {
          console.log('🕷️ Step 1: Scraping content with Enhanced Firecrawl...');
          
          const firecrawlClient = new EnhancedFirecrawlClient(process.env.FIRECRAWL_API_KEY!);
          
          try {
            // Try different URL variations if needed
            const urlVariations = [
              normalizedUrl,
              normalizedUrl.replace(/^https?:\/\//, 'https://www.'), // Add www
              normalizedUrl.replace(/^https?:\/\/www\./, 'https://'), // Remove www
            ];
            
            let successfulCrawl = null;
            
            for (const urlVariant of urlVariations) {
              console.log(`🔄 Trying URL variant: ${urlVariant}`);
              
              try {
                const crawlResult = await firecrawlClient.crawlUrl(urlVariant, {
                  timeout: 60000, // 60 second timeout
                  waitFor: 5000,  // Wait 5 seconds for JS
                  includeHtml: true,
                  includeMarkdown: true,
                  extractMainContent: false // Get full content
                });
                
                if (crawlResult && crawlResult.success) {
                  successfulCrawl = crawlResult;
                  console.log(`✅ Successfully crawled with variant: ${urlVariant}`);
                  break;
                }
              } catch (variantError: any) {
                console.log(`❌ Variant ${urlVariant} failed: ${variantError.message}`);
              }
            }
            
            if (!successfulCrawl) {
              throw new Error('All URL variations failed');
            }
            
            enhancedData = successfulCrawl;
            
            // Convert enhanced data to PageContent format
            const crawlData = enhancedData.data!;
            const content = crawlData.content || '';
            const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
            
            // Extract headings from HTML for better H1 detection
            const headings: any[] = [];
            const h1Matches = crawlData.html?.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
            for (const match of h1Matches) {
              headings.push({ level: 1, text: match[1].replace(/<[^>]+>/g, '').trim() });
            }
            
            pageContent = {
              url: normalizedUrl,
              title: crawlData.metadata?.title || '',
              meta_description: crawlData.metadata?.description || crawlData.metadata?.['og:description'] || '',
              content: content,
              markdown: crawlData.markdown || '',
              html: crawlData.html || '',
              word_count: wordCount,
              metadata: {
                ...crawlData.metadata,
                links: crawlData.links?.map((href: string) => ({ 
                  href, 
                  isInternal: href.includes(new URL(normalizedUrl).hostname),
                  isEEAT: false // Will be determined by analyzer
                })) || [],
                images: [], // Will be extracted by analyzer
                htmlSize: crawlData.html?.length || 0,
                domNodes: 0, // Will be calculated by analyzer
                hasJsonLd: false, // Will be determined by analyzer
                schemaTypes: [], // Will be determined by analyzer
                headings: headings // Pre-extracted headings for better detection
              }
            };
            
            console.log(`✅ Enhanced scraping complete: ${pageContent.word_count} words, ${headings.filter(h => h.level === 1).length} H1s found, method: ${enhancedData.method}`);
            
          } catch (scrapeError: any) {
            console.error('❌ Enhanced Firecrawl scraping failed:', scrapeError.message);
            console.log('📌 Falling back to standard Firecrawl...');
            
            // Fallback to standard scraping
            try {
              pageContent = await scrapeWithFirecrawl(normalizedUrl);
              if (!pageContent) {
                throw new Error('Standard Firecrawl also failed');
              }
              console.log('✅ Standard Firecrawl succeeded');
            } catch (fallbackError: any) {
              console.error('❌ Fallback scraping also failed:', fallbackError.message);
              if (auditType === 'technical') {
                continue; // Skip this URL entirely if technical audit fails
              }
              pageContent = null;
            }
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
        let enhancedRecommendations = null;
        if ((auditType === 'technical' || auditType === 'both') && pageContent) {
          console.log('🔍 Step 3: Technical AEO Analysis...');
          
          technicalResult = await analyzePageWithAEO(pageContent);
          totalIssues += technicalResult.issues.length;
          totalRecommendations += technicalResult.recommendations.length;
          totalAeoScore += technicalResult.overall_score;
          
          console.log(`✅ Technical analysis complete: ${technicalResult.overall_score}/100 score`);
          console.log(`   Found ${technicalResult.issues.length} issues, ${technicalResult.recommendations.length} recommendations`);
          
          // Step 3.5: Generate AEO Audit with GPT-4o
          let aeoAuditResult = null;
          if (process.env.OPENAI_API_KEY) {
            console.log('🤖 Generating AEO audit with GPT-4o...');
            try {
              aeoAuditResult = await generateAEOAudit({
                url: normalizedUrl,
                html: pageContent.html || '',
                content: pageContent.content,
                metadata: {
                  title: pageContent.title,
                  description: pageContent.meta_description,
                  headings: pageContent.metadata?.headings || [],
                  links: pageContent.metadata?.links || [],
                  images: pageContent.metadata?.images || [],
                  hasJsonLd: pageContent.metadata?.hasJsonLd || false,
                  schemaTypes: pageContent.metadata?.schemaTypes || [],
                  htmlSize: pageContent.metadata?.htmlSize || 0,
                  domNodes: pageContent.metadata?.domNodes || 0
                }
              });
              console.log('✅ AEO audit generated with actionable recommendations');
            } catch (aeoError: any) {
              console.warn('⚠️ AEO audit failed, falling back to enhanced recommendations:', aeoError.message);
            }
          }
          
          // Step 3.6: Generate Enhanced Recommendations (fallback)
          console.log('📝 Generating enhanced recommendations...');
          try {
            enhancedRecommendations = await generateEnhancedRecommendations(
              pageContent,
              technicalResult,
              enhancedData
            );
            
            // If we have AEO audit results, use those instead of default recommendations
            if (aeoAuditResult) {
              enhancedRecommendations.contentRecommendations = {
                quickWin: aeoAuditResult.content_recommendations,
                bullets: [aeoAuditResult.content_recommendations]
              };
              enhancedRecommendations.technicalRecommendations = {
                quickWin: aeoAuditResult.technical_recommendations,
                bullets: [aeoAuditResult.technical_recommendations]
              };
              enhancedRecommendations.pageSummary = aeoAuditResult.page_summary;
              enhancedRecommendations.aeoAudit = aeoAuditResult;
            } else if (process.env.OPENAI_API_KEY) {
              // Generate AI-powered content recommendations as fallback
              console.log('🤖 Generating AI-powered content recommendations...');
              try {
                const aiContentRecs = await generateAIContentRecommendations(
                  pageContent,
                  technicalResult,
                  topic
                );
                // Override the default content recommendations with AI-generated ones
                enhancedRecommendations.contentRecommendations = {
                  quickWin: aiContentRecs.quickWin,
                  bullets: aiContentRecs.bullets
                };
                console.log('✅ AI content recommendations generated');
              } catch (aiError: any) {
                console.warn('⚠️ AI content recommendations failed, using default:', aiError.message);
              }
            }
            
            console.log('✅ Enhanced recommendations generated');
          } catch (recError: any) {
            console.error('⚠️ Failed to generate enhanced recommendations:', recError.message);
          }
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
            warningIssues: technicalResult.issues.filter(i => i.severity === 'warning').length,
            renderingMode: technicalResult.rendering_mode,
            ssrPenalty: technicalResult.ssr_score_penalty
          } : null,
          enhancedRecommendations: enhancedRecommendations ? {
            pageSummary: enhancedRecommendations.pageSummary,
            technicalQuickWin: enhancedRecommendations.technicalRecommendations.quickWin,
            contentQuickWin: enhancedRecommendations.contentRecommendations.quickWin,
            technicalActions: enhancedRecommendations.technicalRecommendations.bullets.length,
            contentActions: enhancedRecommendations.contentRecommendations.bullets.length,
            formattedMarkdown: formatRecommendationsAsMarkdown(enhancedRecommendations)
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
  
  // Try different URL variations
  const urlVariations = [
    url,
    url.replace(/^https?:\/\//, 'https://www.'), // Add www
    url.replace(/^https?:\/\/www\./, 'https://'), // Remove www
  ];
  
  for (const urlVariant of urlVariations) {
    console.log(`   🔄 Trying URL variant: ${urlVariant}`);
    
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
            url: urlVariant,
            formats: ['markdown', 'html'],
            includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'img', 'a'],
            excludeTags: ['script', 'style'],
            waitFor: 10000, // Wait 10s for JS to load
            timeout: 60000, // 60s timeout
            onlyMainContent: false // Get full content for better H1 detection
          })
        });

        if (!response.ok) {
          // Retry on server errors (5xx) and timeouts (408)
          if ((response.status >= 500 || response.status === 408) && attempt < 3) {
            console.log(`   ⚠️ ${response.status} ${response.statusText}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 3000)); // Longer delay
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
        
        // Extract H1s from HTML
        const headings: any[] = [];
        const h1Matches = html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi);
        for (const match of h1Matches) {
          const h1Text = match[1].replace(/<[^>]+>/g, '').trim();
          if (h1Text) {
            headings.push({ level: 1, text: h1Text });
          }
        }
        
        // Also check for H1s in markdown
        const mdH1Matches = markdown.matchAll(/^#\s+(.+)$/gm);
        for (const match of mdH1Matches) {
          const h1Text = match[1].trim();
          if (h1Text && !headings.some(h => h.text === h1Text)) {
            headings.push({ level: 1, text: h1Text });
          }
        }
        
        // Extract links for EEAT analysis
        const links: any[] = [];
        const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
        const urlObj = new URL(urlVariant);
        
        for (const match of linkMatches) {
          const href = match[1];
          try {
            const linkUrl = new URL(href, urlVariant);
            links.push({
              href: linkUrl.href,
              isInternal: linkUrl.hostname === urlObj.hostname,
              isEEAT: false // Will be determined by analyzer
            });
          } catch {
            // Invalid URL, skip
          }
        }
        
        const pageContent: PageContent = {
          url: url, // Return original URL, not variant
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
            schema: metadata.schema,
            headings: headings,
            links: links,
            htmlSize: html.length
          }
        };
        
        console.log(`   📊 Processed: ${wordCount} words, ${html.length} chars HTML, ${headings.filter(h => h.level === 1).length} H1s found`);
        
        return pageContent;
        
      } catch (error: any) {
        console.error(`   ❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt === 3) {
          console.error(`   💥 All retry attempts failed for ${urlVariant}`);
          // Try next URL variant
          break;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, attempt * 3000));
      }
    }
  }
  
  console.error(`   💥 All URL variations failed for ${url}`);
  return null;
} 