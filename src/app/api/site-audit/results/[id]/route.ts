import { NextRequest, NextResponse } from 'next/server';
// Removed: import { getSiteAuditResults } from '@/services/crawler'; // We are querying directly
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const crawlId = params.id; // Access after cookies() if strict mode requires, but often fine here for GET.

  if (!crawlId) {
    return NextResponse.json({ error: 'Crawl ID is required' }, { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { cookies: { get: async (name: string) => cookieStore.get(name)?.value } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Step 1: Fetch summary data from the site_audit_summary view
    const { data: summaryData, error: summaryError } = await supabase
      .from('site_audit_summary')
      .select('*') // Select all columns from the view for this crawl
      .eq('crawl_id', crawlId)
      .maybeSingle();

    if (summaryError) {
      console.error('Error fetching from site_audit_summary view:', summaryError);
      return NextResponse.json({ error: 'Failed to fetch crawl summary data', details: summaryError.message }, { status: 500 });
    }

    if (!summaryData) {
      return NextResponse.json({ error: 'Crawl summary not found' }, { status: 404 });
    }

    // Step 2: Fetch all pages for this crawl_id, including their individual issues
    const { data: pagesData, error: pagesError } = await supabase
      .from('pages')
      .select(`
        *,
        aeo_score,
        seo_score,
        issues (*)
      `)
      .eq('crawl_id', crawlId);

    if (pagesError) {
      console.error('Error fetching pages with issues:', pagesError);
      return NextResponse.json({ error: 'Failed to fetch page details', details: pagesError.message }, { status: 500 });
    }

    // Step 3: Fetch AI summary markdown from the crawls table
    const { data: crawlSpecificData, error: crawlSpecificError } = await supabase
        .from('crawls')
        .select('aeo_score, seo_score, ai_summary_markdown, started_at, completed_at, site_id') // site_id for siteUrl if needed
        .eq('id', crawlId)
        .single(); 

    if (crawlSpecificError) {
        console.error('Error fetching crawl-specific data (AI summary, dates):', crawlSpecificError);
        // Not necessarily fatal, could proceed without AI summary
    }
    
    // Step 4: Get siteUrl (domain) using site_id from crawlSpecificData or summaryData
    let siteUrl = summaryData.domain; // From summary view
    if (!siteUrl && crawlSpecificData?.site_id) {
        const { data: siteInfo, error: siteError } = await supabase
            .from('sites')
            .select('domain')
            .eq('id', crawlSpecificData.site_id)
            .single();
        if (siteInfo) siteUrl = siteInfo.domain;
    }

    // Construct the final response object matching Client-side CrawlData interface
    const processedData = {
      siteUrl: siteUrl || 'N/A', // Ensure it's always absolute in the client if not already
      status: summaryData.status || 'completed',
      totalPages: summaryData.total_pages || 0,
      crawledPages: summaryData.pages_count || pagesData?.length || 0,
      aeoScore: crawlSpecificData?.aeo_score ?? summaryData.aeo_score ?? 0,
      seoScore: crawlSpecificData?.seo_score ?? summaryData.seo_score ?? 0,
      issues: {
        critical: summaryData.critical_issues_count || 0,
        warning: summaryData.warning_issues_count || 0,
        info: summaryData.info_issues_count || 0,
      },
      metricScores: {
        aiVisibility: summaryData.aeo_score || 0,
        seo: summaryData.seo_score ?? crawlSpecificData?.seo_score ?? 0,
        contentQuality: summaryData.content_quality_score || 0, // Assuming view has these, or calculate
        technical: summaryData.technical_seo_score || 0,       // Assuming view has these, or calculate
        performance: summaryData.performance_score || 0,     // Assuming view has these, or calculate
        mediaAccessibility: summaryData.media_accessibility_score || 0, // from crawls table / view
      },
      pages: pagesData || [],
      ai_summary_markdown: crawlSpecificData?.ai_summary_markdown || null,
      started_at: crawlSpecificData?.started_at || summaryData.started_at,
      completed_at: crawlSpecificData?.completed_at || summaryData.completed_at,
      // Include any other fields from summaryData or crawlSpecificData that CrawlData interface expects
      document_percentage: summaryData.document_percentage,
      schema_percentage: summaryData.schema_percentage,
      llms_coverage: summaryData.llms_coverage,
      // screenshots would need a separate fetch if not included in pages or summary
    };

    console.log('[API Route /results] Processed data being sent to UI:', JSON.stringify(processedData, null, 2));
    return NextResponse.json(processedData);

  } catch (err: any) {
    console.error('Unexpected error in GET /api/site-audit/results/[id]:', err);
    return NextResponse.json({ error: 'An unexpected server error occurred', details: err.message }, { status: 500 });
  }
} 