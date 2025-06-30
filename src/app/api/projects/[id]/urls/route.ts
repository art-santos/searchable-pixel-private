import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { 
  ProjectUrl, 
  ProjectUrlInsert, 
  APIResponse, 
  PaginatedResponse 
} from '@/lib/types/database';

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
 * Validate URL format and domain
 */
function validateUrl(url: string, rootDomain: string): { isValid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    // Check if URL is HTTP/HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    // Check if URL domain matches or is subdomain of root domain
    const urlDomain = urlObj.hostname.toLowerCase();
    const root = rootDomain.toLowerCase();
    
    if (urlDomain !== root && !urlDomain.endsWith('.' + root)) {
      return { isValid: false, error: `URL domain must match or be a subdomain of ${rootDomain}` };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * GET /api/projects/[id]/urls
 * List all URLs for a specific project
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '20'), 100);
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sort_by') || 'priority';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const includeAudits = searchParams.get('include_audits') === 'true';

    // Build query
    let selectClause = '*';
    if (includeAudits) {
      selectClause += `, technical_audits(
        id, overall_score, technical_score, content_score, 
        rendering_mode, h1_detected, analyzed_at, issues
      )`;
    }

    let query = supabase
      .from('project_urls')
      .select(selectClause)
      .eq('project_id', id);

    // Apply filters
    if (status && ['pending', 'analyzing', 'complete', 'error'].includes(status)) {
      query = query.eq('status', status);
    }

    // Apply sorting
    const validSortFields = ['url', 'priority', 'added_at', 'last_analyzed', 'status'];
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Primary URLs first, then by priority
    if (sortBy === 'priority') {
      query = query.order('is_primary', { ascending: false });
    }

    // Count total records
    const { count, error: countError } = await supabase
      .from('project_urls')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);

    if (countError) {
      throw countError;
    }

    // Apply pagination
    const offset = (page - 1) * perPage;
    query = query.range(offset, offset + perPage - 1);

    const { data: urls, error } = await query;

    if (error) {
      throw error;
    }

    // Enhance data with summary information if requested
    let enhancedUrls = urls;
    if (includeAudits && urls) {
      enhancedUrls = urls.map((url: any) => ({
        ...url,
        latest_audit: url.technical_audits?.[0],
        audit_count: url.technical_audits?.length || 0,
        critical_issues: url.technical_audits?.[0]?.issues?.filter((issue: any) => issue.severity === 'critical').length || 0
      }));
    }

    const response: PaginatedResponse<ProjectUrl> = {
      data: enhancedUrls as ProjectUrl[],
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage)
    };

    return NextResponse.json({ success: true, ...response });

  } catch (error: any) {
    console.error('Error fetching project URLs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project URLs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/urls
 * Add a new URL to a project
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

    const body = await request.json();
    const { url, is_primary = false, priority = 5, tags = [] } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format and domain
    const urlValidation = validateUrl(url, project.root_domain);
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { success: false, error: urlValidation.error },
        { status: 400 }
      );
    }

    // Check if URL already exists in this project
    const { data: existingUrl } = await supabase
      .from('project_urls')
      .select('id')
      .eq('project_id', id)
      .eq('url', url)
      .single();

    if (existingUrl) {
      return NextResponse.json(
        { success: false, error: 'This URL is already added to the project' },
        { status: 409 }
      );
    }

    // If setting as primary, unset current primary URL
    if (is_primary) {
      await supabase
        .from('project_urls')
        .update({ is_primary: false })
        .eq('project_id', id)
        .eq('is_primary', true);
    }

    // Create URL entry
    const urlData: ProjectUrlInsert = {
      project_id: id,
      url: url.trim(),
      is_primary,
      priority: Math.min(Math.max(priority, 1), 10), // Clamp between 1-10
      tags: tags || [],
      status: 'pending'
    };

    const { data: newUrl, error: insertError } = await supabase
      .from('project_urls')
      .insert(urlData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: newUrl
    });

  } catch (error: any) {
    console.error('Error adding URL to project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add URL to project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/urls
 * Batch operations on project URLs
 */
export async function PATCH(
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
      .select('id, user_id')
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
    const { action, url_ids, updates } = body;

    if (!action || !Array.isArray(url_ids) || url_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'action and url_ids are required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'delete':
        // Delete selected URLs
        const { error: deleteError } = await supabase
          .from('project_urls')
          .delete()
          .eq('project_id', id)
          .in('id', url_ids);

        if (deleteError) {
          throw deleteError;
        }

        result = { deleted: url_ids.length };
        break;

      case 'update_priority':
        if (!updates?.priority || typeof updates.priority !== 'number') {
          return NextResponse.json(
            { success: false, error: 'priority value is required for update_priority action' },
            { status: 400 }
          );
        }

        const { error: priorityError } = await supabase
          .from('project_urls')
          .update({ priority: Math.min(Math.max(updates.priority, 1), 10) })
          .eq('project_id', id)
          .in('id', url_ids);

        if (priorityError) {
          throw priorityError;
        }

        result = { updated: url_ids.length };
        break;

      case 'trigger_analysis':
        // Update status to trigger re-analysis
        const { error: analysisError } = await supabase
          .from('project_urls')
          .update({ 
            status: 'pending',
            last_analyzed: null 
          })
          .eq('project_id', id)
          .in('id', url_ids);

        if (analysisError) {
          throw analysisError;
        }

        result = { triggered: url_ids.length };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Supported actions: delete, update_priority, trigger_analysis' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result
    });

  } catch (error: any) {
    console.error('Error processing batch URL operation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process batch URL operation' },
      { status: 500 }
    );
  }
} 