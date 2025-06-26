import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get audit by job_id and user_id
    const { data: audit, error: auditError } = await supabase
      .from('comprehensive_audits')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .single();

    if (auditError || !audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    // Return different responses based on status
    switch (audit.status) {
      case 'pending':
        return NextResponse.json({
          jobId,
          status: 'pending',
          message: 'Audit is queued and waiting to start',
          url: audit.url,
          createdAt: audit.created_at
        });

      case 'processing':
        return NextResponse.json({
          jobId,
          status: 'processing',
          message: 'Audit is currently in progress',
          url: audit.url,
          createdAt: audit.created_at,
          estimatedTimeRemaining: '30-45 seconds'
        });

      case 'failed':
        return NextResponse.json({
          jobId,
          status: 'failed',
          message: 'Audit failed to complete',
          error: audit.error_message,
          url: audit.url,
          createdAt: audit.created_at,
          duration: audit.analysis_duration_ms
        });

      case 'completed':
        // Get recommendations for this audit
        const { data: recommendations } = await supabase
          .from('audit_recommendations')
          .select('*')
          .eq('audit_id', audit.id)
          .order('priority', { ascending: false });

        // Format the complete audit results
        const auditResults = {
          jobId,
          status: 'completed',
          message: 'Audit completed successfully',
          url: audit.url,
          domain: audit.domain,
          createdAt: audit.created_at,
          analyzedAt: audit.analyzed_at,
          duration: audit.analysis_duration_ms,
          
          // Basic page info
          pageTitle: audit.page_title,
          pageSummary: audit.page_summary,
          
          // Performance metrics
          htmlSizeKb: audit.html_size_kb,
          domSizeKb: audit.dom_size_kb,
          performanceScore: audit.performance_score,
          
          // Technical health
          crawlable: audit.crawlable,
          ssrRendered: audit.ssr_rendered,
          
          // Schema analysis
          schemaAnalysis: {
            faqSchemaPresent: audit.faq_schema_present,
            itemlistSchemaPresent: audit.itemlist_schema_present,
            articleSchemaPresent: audit.article_schema_present,
            breadcrumbSchemaPresent: audit.breadcrumb_schema_present,
            speakableSchemaPresent: audit.speakable_schema_present,
            jsonldValid: audit.jsonld_valid,
            schemaTypes: audit.schema_types || []
          },
          
          // SEO & Structure
          seoAnalysis: {
            canonicalTagValid: audit.canonical_tag_valid,
            titleH1Match: audit.title_h1_match,
            metaDescriptionPresent: audit.meta_description_present,
            h1Present: audit.h1_present,
            h1Count: audit.h1_count,
            headingDepth: audit.heading_depth,
            wordCount: audit.word_count
          },
          
          // Link analysis
          linkAnalysis: {
            externalEeatLinks: audit.external_eeat_links,
            internalLinkCount: audit.internal_link_count
          },
          
          // Image analysis
          imageAnalysis: {
            totalImages: audit.total_images,
            imageAltPresentPercent: audit.image_alt_present_percent,
            avgImageKb: audit.avg_image_kb
          },
          
          // AI analysis
          aiAnalysis: {
            promotionalSentimentPercent: audit.promotional_sentiment_percent,
            llmMentions: audit.llm_mentions || [],
            mentionConfidenceScore: audit.mention_confidence_score
          },
          
          // Quick wins
          recommendations: {
            technicalQuickWin: audit.technical_quick_win,
            contentQuickWin: audit.content_quick_win,
            detailed: recommendations || []
          },
          
          // Overall scoring
          pageScore: audit.page_score,
          confidenceScores: audit.confidence_scores || {},
          
          // Metadata
          schemaVersion: audit.schema_version,
          additionalMetrics: audit.additional_metrics || {}
        };

        return NextResponse.json(auditResults);

      default:
        return NextResponse.json(
          { error: 'Unknown audit status' },
          { status: 500 }
        );
    }

  } catch (error: any) {
    console.error('Error in audit status endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to cancel/delete an audit
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Delete audit (cascade will handle recommendations)
    const { error: deleteError } = await supabase
      .from('comprehensive_audits')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to delete audit:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete audit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Audit deleted successfully',
      jobId
    });

  } catch (error: any) {
    console.error('Error in audit delete endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 