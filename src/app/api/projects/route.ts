import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { 
  Project, 
  ProjectInsert, 
  ProjectSummary, 
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
 * GET /api/projects
 * List all projects for the authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '10'), 50); // Max 50 per page
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sort_by') || 'updated_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const includeSummary = searchParams.get('include_summary') === 'true';

    // Build query
    let query = supabase
      .from('projects')
      .select(includeSummary ? 
        `
        *,
        project_urls(count),
        technical_audits(
          overall_score,
          analyzed_at
        )
        ` : 
        '*'
      )
      .eq('user_id', user.id);

    // Apply filters
    if (status && ['active', 'paused', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }

    // Apply sorting
    const validSortFields = ['name', 'created_at', 'updated_at', 'last_analyzed_at'];
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Count total records
    const { count, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      throw countError;
    }

    // Apply pagination
    const offset = (page - 1) * perPage;
    query = query.range(offset, offset + perPage - 1);

    const { data: projects, error } = await query;

    if (error) {
      throw error;
    }

    if (includeSummary) {
      // Transform data to include summary information
      const projectSummaries: ProjectSummary[] = await Promise.all(
        (projects || []).map(async (project: any) => {
          // Get additional summary data
          const { data: urlCounts } = await supabase
            .from('project_urls')
            .select('status')
            .eq('project_id', project.id);

          const { data: latestAudit } = await supabase
            .from('technical_audits')
            .select('*')
            .in('project_url_id', 
              (urlCounts || []).map((url: any) => url.id)
            )
            .order('analyzed_at', { ascending: false })
            .limit(1)
            .single();

          const { data: visibilityData } = await supabase
            .from('visibility_tracking')
            .select('visibility_score')
            .eq('project_id', project.id)
            .gte('checked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

          const avgVisibilityScore = visibilityData?.length > 0 
            ? visibilityData.reduce((sum: number, item: any) => sum + (item.visibility_score || 0), 0) / visibilityData.length
            : undefined;

          const statusCounts = {
            pending: urlCounts?.filter((url: any) => url.status === 'pending').length || 0,
            analyzing: urlCounts?.filter((url: any) => url.status === 'analyzing').length || 0,
            complete: urlCounts?.filter((url: any) => url.status === 'complete').length || 0,
            error: urlCounts?.filter((url: any) => url.status === 'error').length || 0,
          };

          return {
            project: project as Project,
            url_count: urlCounts?.length || 0,
            latest_audit: latestAudit,
            avg_visibility_score: avgVisibilityScore,
            critical_issues_count: latestAudit?.issues?.filter((issue: any) => issue.severity === 'critical').length || 0,
            last_analysis_date: latestAudit?.analyzed_at,
            status_counts: statusCounts
          };
        })
      );

      const response: PaginatedResponse<ProjectSummary> = {
        data: projectSummaries,
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: Math.ceil((count || 0) / perPage)
      };

      return NextResponse.json({ success: true, ...response });
    }

    const response: PaginatedResponse<Project> = {
      data: projects as Project[],
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage)
    };

    return NextResponse.json({ success: true, ...response });

  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received project creation request:', body);
    
    // Validate required fields
    let { root_domain, name, description, settings } = body;
    
    if (!root_domain || !name) {
      console.log('Missing required fields:', { root_domain, name });
      return NextResponse.json(
        { success: false, error: 'root_domain and name are required' },
        { status: 400 }
      );
    }

    // Clean up the domain - remove www and common subdomains
    root_domain = root_domain
      .replace(/^(https?:\/\/)?(www\.|m\.|mobile\.)?/i, '') // Remove protocol and common subdomains
      .replace(/\/.*$/, '') // Remove any path
      .toLowerCase()
      .trim();

    console.log('Cleaned domain:', root_domain);

    // Validate domain format - simple and permissive
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(root_domain) || root_domain.includes('..') || root_domain.includes(' ')) {
      console.log('Domain validation failed for:', root_domain);
      return NextResponse.json(
        { success: false, error: `Invalid domain format: ${root_domain}` },
        { status: 400 }
      );
    }

    // Check if project with same domain already exists for this user
    console.log('Checking for existing project...');
    const { data: existingProject, error: existingError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('root_domain', root_domain)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing project:', existingError);
      throw existingError;
    }

    if (existingProject) {
      console.log('Project already exists:', existingProject.id);
      return NextResponse.json(
        { success: false, error: 'A project with this domain already exists' },
        { status: 409 }
      );
    }

    // Create project
    const projectData: ProjectInsert = {
      user_id: user.id,
      root_domain: root_domain, // Already cleaned and lowercased above
      name: name.trim(),
      description: description?.trim(),
      settings: settings || {}
    };

    console.log('Inserting project data:', projectData);
    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }

    console.log('Project created successfully:', project.id);

    // Create default project settings
    console.log('Creating project settings...');
    const { error: settingsError } = await supabase
      .from('project_settings')
      .insert({
        project_id: project.id,
        target_keywords: [],
        target_topics: [],
        competitors: [],
        analysis_frequency: 'daily',
        notifications: { email: true, alerts: true },
        tracked_ai_systems: ['perplexity', 'chatgpt', 'claude']
      });

    if (settingsError) {
      console.error('Error creating project settings:', settingsError);
      // Don't throw here, this is optional
    }

    // Auto-add primary URL if not provided
    console.log('Adding primary URL...');
    const { error: urlError } = await supabase
      .from('project_urls')
      .insert({
        project_id: project.id,
        url: `https://${root_domain}`,
        is_primary: true,
        priority: 10
      });

    if (urlError) {
      console.error('Error creating project URL:', urlError);
      // Don't throw here, this is optional
    }

    console.log(`✅ Created new project: ${name} (${root_domain}) for user ${user.id}`);

    const response: APIResponse<Project> = {
      success: true,
      data: project,
      message: 'Project created successfully'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
} 