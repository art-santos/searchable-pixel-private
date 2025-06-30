import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SiteMapper, SitemapDiscoveryResult, ImportResult, CrawlDiscoveryResult } from '@/lib/discovery/site-mapper';
import { APIResponse } from '@/lib/types/database';

/**
 * Create Supabase client with proper authentication
 */
async function createSupabaseServer() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

/**
 * POST /api/projects/[id]/urls/discover
 * Discover URLs from various sources and import them
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, root_domain, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }
      throw projectError;
    }

    const body = await request.json();
    const { method, urls, max_pages = 50, auto_import = true } = body;

    if (!method || !['sitemap', 'bulk', 'crawl'].includes(method)) {
      return NextResponse.json(
        { success: false, error: 'Method must be one of: sitemap, bulk, crawl' },
        { status: 400 }
      );
    }

    const siteMapper = new SiteMapper();
    let discoveredUrls: string[] = [];
    let discoveryResult: any = {};

    console.log(`🔍 Starting URL discovery for project ${project.name} using method: ${method}`);

    switch (method) {
      case 'sitemap':
        console.log(`🗺️ Discovering URLs using Firecrawl map for ${project.root_domain}`);
        
        // Extract options for Firecrawl map
        const mapOptions = {
          includeSubdomains: body.include_subdomains || false,
          sitemapOnly: body.sitemap_only || false,
          maxUrls: Math.min(body.max_urls || 5000, 30000), // Firecrawl limit
          searchFilter: body.search_filter
        };
        
        const sitemapResult: SitemapDiscoveryResult = await siteMapper.discoverFromSitemap(project.root_domain, mapOptions);
        discoveredUrls = sitemapResult.urls;
        discoveryResult = {
          method: sitemapResult.method,
          total_discovered: sitemapResult.total_urls,
          errors: sitemapResult.errors,
          discovery_time_ms: sitemapResult.discovery_time_ms,
          map_options: mapOptions
        };
        break;

      case 'bulk':
        if (!urls || typeof urls !== 'string') {
          return NextResponse.json(
            { success: false, error: 'URLs string is required for bulk import' },
            { status: 400 }
          );
        }
        
        console.log(`📥 Processing bulk URL input`);
        discoveredUrls = SiteMapper.parseBulkUrlInput(urls);
        discoveryResult = {
          method: 'bulk',
          total_discovered: discoveredUrls.length,
          raw_input_lines: urls.split('\n').length
        };
        break;

      case 'crawl':
        const startUrl = `https://${project.root_domain}`;
        console.log(`🕷️ Crawling ${startUrl} for URL discovery`);
        const crawlResult: CrawlDiscoveryResult = await siteMapper.crawlForDiscovery(startUrl, max_pages);
        discoveredUrls = crawlResult.discovered_urls;
        discoveryResult = {
          method: 'crawl',
          total_discovered: crawlResult.discovered_urls.length,
          internal_links: crawlResult.internal_links,
          external_links: crawlResult.external_links,
          depth_reached: crawlResult.depth_reached,
          errors: crawlResult.errors
        };
        break;
    }

    if (discoveredUrls.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          discovery: discoveryResult,
          import: null,
          message: 'No URLs discovered'
        }
      });
    }

    // Prioritize and validate URLs
    const prioritizedUrls = await siteMapper.validateAndPrioritize(discoveredUrls, project.root_domain);
    
    let importResult: ImportResult | null = null;

    if (auto_import && prioritizedUrls.length > 0) {
      // Import discovered URLs
      console.log(`📥 Auto-importing ${prioritizedUrls.length} discovered URLs`);
      importResult = await siteMapper.bulkImportUrls(
        prioritizedUrls.map(u => u.url),
        id,
        supabase
      );

      // Update project last_analyzed_at to indicate new URLs added
      await supabase
        .from('projects')
        .update({ last_analyzed_at: new Date().toISOString() })
        .eq('id', id);

      console.log(`✅ Discovery and import complete: ${importResult.added_urls} URLs added`);
    }

    const response: APIResponse<{
      discovery: any;
      import: ImportResult | null;
      prioritized_urls?: any[];
      message: string;
    }> = {
      success: true,
      data: {
        discovery: discoveryResult,
        import: importResult,
        prioritized_urls: auto_import ? undefined : prioritizedUrls.slice(0, 20), // Preview first 20 if not auto-importing
        message: importResult 
          ? `Discovery complete: ${importResult.added_urls} URLs added, ${importResult.skipped_urls} skipped`
          : `Discovery complete: ${prioritizedUrls.length} URLs found`
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in URL discovery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to discover URLs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/urls/discover
 * Preview URLs that would be discovered without importing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, root_domain')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }
      throw projectError;
    }

    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method') || 'sitemap';

    if (!['sitemap', 'crawl'].includes(method)) {
      return NextResponse.json(
        { success: false, error: 'Method must be one of: sitemap, crawl' },
        { status: 400 }
      );
    }

    const siteMapper = new SiteMapper();
    let discoveredUrls: string[] = [];
    let discoveryResult: any = {};

    switch (method) {
      case 'sitemap':
        const sitemapResult = await siteMapper.discoverFromSitemap(project.root_domain);
        discoveredUrls = sitemapResult.urls;
        discoveryResult = {
          method: 'sitemap',
          sitemaps_found: sitemapResult.sitemaps_found,
          total_discovered: sitemapResult.total_urls,
          errors: sitemapResult.errors
        };
        break;

      case 'crawl':
        const crawlResult = await siteMapper.crawlForDiscovery(`https://${project.root_domain}`, 25);
        discoveredUrls = crawlResult.discovered_urls;
        discoveryResult = {
          method: 'crawl',
          total_discovered: crawlResult.discovered_urls.length,
          internal_links: crawlResult.internal_links,
          depth_reached: crawlResult.depth_reached,
          errors: crawlResult.errors
        };
        break;
    }

    // Get existing URLs to show what's new
    const { data: existingUrls } = await supabase
      .from('project_urls')
      .select('url')
      .eq('project_id', id);

    const existingUrlSet = new Set(existingUrls?.map(u => u.url) || []);

    // Prioritize and filter
    const prioritizedUrls = await siteMapper.validateAndPrioritize(discoveredUrls, project.root_domain);
    const newUrls = prioritizedUrls.filter(u => !existingUrlSet.has(u.url));

    const response: APIResponse<{
      discovery: any;
      new_urls: any[];
      existing_urls: number;
      preview_message: string;
    }> = {
      success: true,
      data: {
        discovery: discoveryResult,
        new_urls: newUrls.slice(0, 50), // Preview first 50
        existing_urls: prioritizedUrls.length - newUrls.length,
        preview_message: `Found ${newUrls.length} new URLs (${prioritizedUrls.length - newUrls.length} already exist)`
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in URL discovery preview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to preview URLs' },
      { status: 500 }
    );
  }
} 