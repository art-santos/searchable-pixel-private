import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEnhancedRecommendations, formatRecommendationsAsMarkdown } from '@/lib/aeo/enhanced-recommendations';
import { PageContent, AEOAnalysisResult } from '@/lib/aeo/technical-analyzer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Get authenticated user (optional for now)
    const supabase = createClient();
    
    // Normalize URL to match how comprehensive audit stores it
    function normalizeUrl(inputUrl: string): string {
      try {
        let normalizedUrl = inputUrl.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          normalizedUrl = `https://${normalizedUrl}`;
        }
        
        const u = new URL(normalizedUrl);
        // Strip www. prefix to use apex domain (matches comprehensive audit logic)
        u.hostname = u.hostname.replace(/^www\./, '');
        // Remove trailing slash if it's just the root path
        if (u.pathname === '/') {
          u.pathname = '/';
        } else {
          u.pathname = u.pathname.replace(/\/$/, '');
        }
        return u.toString();
      } catch (error) {
        console.warn(`⚠️ URL normalization failed for "${inputUrl}":`, error);
        return inputUrl.trim();
      }
    }
    
    const normalizedUrl = normalizeUrl(url);
    console.log('🔍 Retrieving comprehensive audit data for:', normalizedUrl);
    
    // Also try the original URL in case normalization differs
    const urlsToTry = [normalizedUrl];
    if (normalizedUrl !== url) {
      urlsToTry.push(url);
    }
    // Try with/without trailing slash
    if (normalizedUrl.endsWith('/')) {
      urlsToTry.push(normalizedUrl.slice(0, -1));
    } else {
      urlsToTry.push(normalizedUrl + '/');
    }

    // First, try to get data from pages table (technical audit)
    console.log('🔍 Trying URLs:', urlsToTry);
    
    let pageData = null;
    let pageError = null;
    
    // Try each URL variation until we find data
    for (const tryUrl of urlsToTry) {
      console.log(`   Checking: ${tryUrl}`);
      const { data, error } = await supabase
        .from('pages')
        .select(`
          *,
          page_issues!page_issues_page_id_fkey(
            severity,
            category,
            title,
            description,
            impact,
            fix_priority,
            diagnostic,
            html_snippet,
            rule_parameters
          ),
          page_recommendations!page_recommendations_page_id_fkey(
            category,
            title,
            description,
            implementation,
            expected_impact,
            effort_level,
            priority_score
          ),
          page_checklist_results!page_checklist_results_page_id_fkey(
            check_id,
            check_name,
            category,
            weight,
            passed,
            details,
            rule_parameters
          )
        `)
        .eq('url', tryUrl)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data && !error) {
        pageData = data;
        pageError = error;
        console.log(`✅ Found data for URL: ${tryUrl}`);
        break;
      } else if (error) {
        console.log(`❌ Error querying ${tryUrl}:`, error.message);
        pageError = error;
      } else {
        console.log(`   No data found for: ${tryUrl}`);
      }
    }

    // Also try to get visibility data from snapshot_summaries with URL variations
    let visibilityData = null;
    for (const tryUrl of urlsToTry) {
      const { data } = await supabase
        .from('snapshot_summaries')
        .select('*')
        .eq('url', tryUrl)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        visibilityData = data;
        break;
      }
    }

    // Check if we have recent data (within 24 hours)
    const hasRecentData = pageData && pageData.analyzed_at && 
      (Date.now() - new Date(pageData.analyzed_at).getTime()) < (24 * 60 * 60 * 1000);

    if (!pageData || !hasRecentData) {
      return NextResponse.json({
        exists: false,
        message: 'No recent comprehensive audit data found',
        lastAnalyzed: pageData?.analyzed_at || null
      });
    }

    console.log('✅ Found existing comprehensive audit data');
    
    // Generate enhanced recommendations from stored data
    let enhancedRecommendations = null;
    try {
      // Reconstruct PageContent from stored data
      const pageContent: PageContent = {
        url: pageData.url,
        title: pageData.title,
        meta_description: pageData.meta_description,
        content: pageData.content || '',
        markdown: pageData.markdown || '',
        html: pageData.html || '',
        word_count: pageData.word_count || 0,
        metadata: {
          statusCode: pageData.analysis_metadata?.status_code || 200,
          ogTitle: pageData.analysis_metadata?.og_title,
          ogDescription: pageData.analysis_metadata?.og_description,
          ogImage: pageData.analysis_metadata?.og_image,
          canonicalUrl: pageData.analysis_metadata?.canonical_url,
          language: pageData.analysis_metadata?.language,
          author: pageData.analysis_metadata?.author,
          publishDate: pageData.analysis_metadata?.publish_date,
          modifiedDate: pageData.analysis_metadata?.modified_date,
          schema: pageData.analysis_metadata?.schema,
          links: pageData.analysis_metadata?.links,
          images: pageData.analysis_metadata?.images,
          htmlSize: pageData.analysis_metadata?.html_size,
          domNodes: pageData.analysis_metadata?.dom_nodes,
          hasJsonLd: pageData.analysis_metadata?.jsonld_valid,
          schemaTypes: pageData.analysis_metadata?.schema_types,
          headings: pageData.analysis_metadata?.headings
        }
      };
      
      // Reconstruct AEOAnalysisResult from stored data
      const analysisResult: AEOAnalysisResult = {
        url: pageData.url,
        overall_score: pageData.aeo_score || 0,
        weighted_score: pageData.weighted_aeo_score || pageData.aeo_score || 0,
        category_scores: {
          content_quality: pageData.content_quality_score || 0,
          technical_health: pageData.technical_health_score || 0,
          media_accessibility: pageData.media_accessibility_score || 0,
          schema_markup: pageData.schema_markup_score || 0,
          ai_optimization: pageData.ai_optimization_score || 0
        },
        rendering_mode: (pageData.rendering_mode || pageData.analysis_metadata?.rendering_mode || 'UNKNOWN') as 'SSR' | 'CSR' | 'HYBRID',
        ssr_score_penalty: pageData.ssr_score_penalty || pageData.analysis_metadata?.ssr_score_penalty || 0,
        issues: pageData.page_issues || [],
        recommendations: pageData.page_recommendations || [],
        analysis_metadata: {
          analyzed_at: pageData.analyzed_at,
          analysis_duration_ms: pageData.analysis_metadata?.analysis_duration_ms || 0,
          content_length: pageData.word_count || 0,
          ai_analysis_used: pageData.analysis_metadata?.ai_analysis_used || false,
          total_rules_evaluated: pageData.analysis_metadata?.total_rules_evaluated || 0,
          diagnostics_generated: pageData.analysis_metadata?.diagnostics_generated || 0,
          scoring_weights: pageData.analysis_metadata?.scoring_weights || {
            content_quality: 0.25,
            technical_health: 0.20,
            ai_optimization: 0.20,
            media_accessibility: 0.15,
            schema_markup: 0.20
          }
        }
      };
      
      // Generate enhanced recommendations
      enhancedRecommendations = await generateEnhancedRecommendations(
        pageContent,
        analysisResult,
        pageData.analysis_metadata // This contains the enhanced data
      );
      
      console.log('✅ Generated enhanced recommendations');
    } catch (recError: any) {
      console.error('⚠️ Failed to generate enhanced recommendations:', recError.message);
    }

    // Format the response to match the test API structure
    const comprehensiveAudit = {
      status: 'completed',
      url: pageData.url,
      pageScore: pageData.aeo_score || 0,
      htmlSizeKb: pageData.analysis_metadata?.html_size_kb || 0,
      domSizeKb: pageData.analysis_metadata?.dom_size_kb || 0,
      crawlable: true,
      ssrRendered: (pageData.rendering_mode === 'SSR') || (pageData.analysis_metadata?.rendering_mode === 'SSR'),
      pageTitle: pageData.title,
      metaDescription: pageData.meta_description,
      
      // Technical SEO Analysis
      seoAnalysis: {
        metaDescriptionPresent: !!pageData.meta_description,
        h1Present: pageData.analysis_metadata?.h1_present || false,
        h1Count: pageData.analysis_metadata?.h1_count || 0,
        headingDepth: pageData.analysis_metadata?.heading_depth || 0,
        wordCount: pageData.word_count || 0
      },

      // Link Analysis with EEAT data
      linkAnalysis: {
        internalLinkCount: pageData.analysis_metadata?.internal_link_count || 0,
        externalEeatLinks: pageData.analysis_metadata?.external_eeat_links || 0,
        totalLinks: pageData.analysis_metadata?.total_links || 0
      },

      // Image Analysis
      imageAnalysis: {
        totalImages: pageData.analysis_metadata?.total_images || 0,
        imageAltPresentPercent: pageData.analysis_metadata?.image_alt_present_percent || 0
      },

      // Schema Analysis
      schemaAnalysis: {
        jsonldValid: pageData.analysis_metadata?.jsonld_valid || false,
        schemaTypes: pageData.analysis_metadata?.schema_types || []
      },

      // Performance metrics
      technicalMetrics: {
        htmlSize: pageData.analysis_metadata?.html_size || 0,
        domNodes: pageData.analysis_metadata?.dom_nodes || 0,
        renderingMode: pageData.rendering_mode || pageData.analysis_metadata?.rendering_mode || 'UNKNOWN',
        ssrScorePenalty: pageData.ssr_score_penalty || pageData.analysis_metadata?.ssr_score_penalty || 0
      },

      // Issues and recommendations
      issues: pageData.page_issues || [],
      recommendations: {
        detailed: pageData.page_recommendations || [],
        technicalQuickWin: enhancedRecommendations?.technicalRecommendations?.quickWin,
        contentQuickWin: enhancedRecommendations?.contentRecommendations?.quickWin,
        pageSummary: enhancedRecommendations?.pageSummary,
        formattedMarkdown: enhancedRecommendations ? formatRecommendationsAsMarkdown(enhancedRecommendations) : null
      },

      // Checklist results
      checklistResults: pageData.page_checklist_results || [],

      // Visibility data if available
      visibility: visibilityData ? {
        score: visibilityData.visibility_score,
        mentions: visibilityData.mentions_count,
        totalQuestions: visibilityData.total_questions,
        topCompetitors: visibilityData.top_competitors || [],
        insights: visibilityData.insights || []
      } : null,

      // Metadata
      lastAnalyzed: pageData.analyzed_at,
      analysisDuration: pageData.analysis_metadata?.analysis_duration_ms || 0,
      dataSource: 'stored' // Indicate this is retrieved data
    };

    return NextResponse.json({
      exists: true,
      data: comprehensiveAudit,
      message: 'Retrieved existing comprehensive audit data'
    });

  } catch (error: any) {
    console.error('❌ Error retrieving comprehensive audit data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve audit data',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 