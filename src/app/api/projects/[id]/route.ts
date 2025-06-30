import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { 
  Project, 
  ProjectUpdate, 
  ProjectSummary, 
  APIResponse 
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
 * GET /api/projects/[id]
 * Get a specific project with optional detailed information
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
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

    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('include_details') === 'true';
    const includeUrls = searchParams.get('include_urls') === 'true';
    const includeSettings = searchParams.get('include_settings') === 'true';

    // Build base query
    let selectClause = '*';
    if (includeUrls) {
      selectClause += ', project_urls(*)';
    }
    if (includeSettings) {
      selectClause += ', project_settings(*)';
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select(selectClause)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    if (includeDetails) {
      // Get detailed analytics and summaries
      const [
        { data: urlCounts },
        { data: latestAudits },
        { data: visibilityData },
        { data: alertCounts }
      ] = await Promise.all([
        supabase
          .from('project_urls')
          .select('id, status')
          .eq('project_id', id),
        
        supabase
          .from('technical_audits')
          .select('*, project_urls!inner(project_id)')
          .eq('project_urls.project_id', id)
          .order('analyzed_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('visibility_tracking')
          .select('visibility_score, checked_at, ai_system')
          .eq('project_id', id)
          .gte('checked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('checked_at', { ascending: false }),
        
        supabase
          .from('project_alerts')
          .select('severity, is_read')
          .eq('project_id', id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const statusCounts = {
        pending: urlCounts?.filter(url => url.status === 'pending').length || 0,
        analyzing: urlCounts?.filter(url => url.status === 'analyzing').length || 0,
        complete: urlCounts?.filter(url => url.status === 'complete').length || 0,
        error: urlCounts?.filter(url => url.status === 'error').length || 0,
      };

      const avgVisibilityScore = visibilityData?.length > 0 
        ? visibilityData.reduce((sum, item) => sum + (item.visibility_score || 0), 0) / visibilityData.length
        : undefined;

      const criticalIssuesCount = latestAudits?.reduce((count, audit) => {
        return count + (audit.issues?.filter((issue: any) => issue.severity === 'critical').length || 0);
      }, 0) || 0;

      const projectSummary: ProjectSummary = {
        project: project as Project,
        url_count: urlCounts?.length || 0,
        latest_audit: latestAudits?.[0],
        avg_visibility_score: avgVisibilityScore,
        critical_issues_count: criticalIssuesCount,
        last_analysis_date: latestAudits?.[0]?.analyzed_at,
        status_counts: statusCounts
      };

      // Add additional analytics
      const analytics = {
        recent_audits: latestAudits?.slice(0, 5) || [],
        visibility_trend: visibilityData?.map(item => ({
          date: item.checked_at,
          score: item.visibility_score,
          ai_system: item.ai_system
        })) || [],
        alert_summary: {
          total: alertCounts?.length || 0,
          unread: alertCounts?.filter(alert => !alert.is_read).length || 0,
          critical: alertCounts?.filter(alert => alert.severity === 'critical').length || 0
        }
      };

      const response: APIResponse<ProjectSummary & { analytics: any }> = {
        success: true,
        data: { ...projectSummary, analytics }
      };

      return NextResponse.json(response);
    }

    const response: APIResponse<Project> = {
      success: true,
      data: project as Project
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update a specific project
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
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

    const body = await request.json();
    const { name, description, settings, status } = body;

    // Validate fields
    const updates: Partial<ProjectUpdate> = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Description must be a string' },
          { status: 400 }
        );
      }
      updates.description = description.trim() || null;
    }

    if (status !== undefined) {
      if (!['active', 'paused', 'archived'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Status must be one of: active, paused, archived' },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    if (settings !== undefined) {
      if (typeof settings !== 'object' || settings === null) {
        return NextResponse.json(
          { success: false, error: 'Settings must be an object' },
          { status: 400 }
        );
      }
      updates.settings = settings;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    // Update project
    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: updatedProject
    });

  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a specific project (soft delete by setting status to 'archived')
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
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

    // Parse query parameters to determine delete type
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // Permanent deletion - delete project and all related data
      // This will cascade to all related tables due to foreign key constraints
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Project not found' },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Project permanently deleted'
      });
    } else {
      // Soft deletion - just mark as archived
      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Project not found' },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: updatedProject,
        message: 'Project archived'
      });
    }

  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]
 * Partial update for specific actions (e.g., trigger analysis, restore from archive)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
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

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, status')
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

    let result;

    switch (action) {
      case 'restore':
        if (project.status !== 'archived') {
          return NextResponse.json(
            { success: false, error: 'Only archived projects can be restored' },
            { status: 400 }
          );
        }

        const { data: restoredProject, error: restoreError } = await supabase
          .from('projects')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (restoreError) throw restoreError;
        result = { project: restoredProject };
        break;

      case 'pause':
        if (project.status !== 'active') {
          return NextResponse.json(
            { success: false, error: 'Only active projects can be paused' },
            { status: 400 }
          );
        }

        const { data: pausedProject, error: pauseError } = await supabase
          .from('projects')
          .update({ 
            status: 'paused',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (pauseError) throw pauseError;
        result = { project: pausedProject };
        break;

      case 'trigger_analysis':
        // Trigger analysis for all project URLs
        const { error: triggerError } = await supabase
          .from('project_urls')
          .update({ 
            status: 'pending',
            last_analyzed: null
          })
          .eq('project_id', id);

        if (triggerError) throw triggerError;

        // Update project last_analyzed_at
        await supabase
          .from('projects')
          .update({ 
            last_analyzed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        result = { message: 'Analysis triggered for all project URLs' };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Supported actions: restore, pause, trigger_analysis' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result
    });

  } catch (error: any) {
    console.error('Error processing project action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process project action' },
      { status: 500 }
    );
  }
} 