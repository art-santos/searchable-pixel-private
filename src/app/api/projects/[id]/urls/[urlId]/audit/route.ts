import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; urlId: string }> }
): Promise<NextResponse> {
  try {
    const { id: projectId, urlId } = await params
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the URL with project info
    const { data: url, error: urlError } = await supabase
      .from('project_urls')
      .select(`
        *,
        project:projects!inner(*)
      `)
      .eq('id', urlId)
      .eq('project.user_id', user.id)
      .single()

    if (urlError || !url) {
      return NextResponse.json(
        { success: false, error: 'URL not found' },
        { status: 404 }
      )
    }

    // Try to get detailed audit data from the pages table
    const { data: pageData } = await supabase
      .from('pages')
      .select('*')
      .eq('url', url.url)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single()

    if (!pageData) {
      return NextResponse.json({
        success: true,
        data: {
          url: url,
          audit: null,
          message: 'No audit data available'
        }
      })
    }

    // Format the comprehensive audit data
    const comprehensiveAudit = {
      status: 'completed',
      url: pageData.url,
      pageScore: pageData.aeo_score || 0,
      htmlSizeKb: pageData.analysis_metadata?.html_size_kb || 0,
      domSizeKb: pageData.analysis_metadata?.dom_size_kb || 0,
      crawlable: true,
      ssrRendered: pageData.analysis_metadata?.rendering_mode === 'SSR',
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
        renderingMode: pageData.analysis_metadata?.rendering_mode || 'UNKNOWN',
        ssrScorePenalty: pageData.analysis_metadata?.ssr_score_penalty || 0
      },

      // Category scores
      categoryScores: {
        content_quality: pageData.content_quality_score || 0,
        technical_health: pageData.technical_health_score || 0,
        media_accessibility: pageData.media_accessibility_score || 0,
        schema_markup: pageData.schema_markup_score || 0,
        ai_optimization: pageData.ai_optimization_score || 0
      },

      // Issues and recommendations
      issues: pageData.page_issues || [],
      recommendations: pageData.page_recommendations || [],

      // Metadata
      lastAnalyzed: pageData.analyzed_at,
      analysisDuration: pageData.analysis_metadata?.analysis_duration_ms || 0,
      dataSource: 'stored'
    }

    return NextResponse.json({
      success: true,
      data: {
        url: url,
        audit: comprehensiveAudit
      }
    })

  } catch (error: any) {
    console.error('URL audit fetch error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit data' },
      { status: 500 }
    )
  }
} 