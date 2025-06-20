import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the user with better error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (has @split.dev email OR is_admin=true in profile)
    const hasAdminEmail = user.email?.endsWith('@split.dev')
    
    if (!hasAdminEmail) {
      // Check if user has admin role in profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (profileError || !profile?.is_admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    // Verify workspace access
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get settings
    const { data: settings, error: settingsError } = await supabase
      .from('lead_enrichment_settings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return default settings if none exist
    const defaultSettings = {
      target_titles: ['CEO', 'CTO', 'VP of Engineering', 'Head of Product'],
      custom_prompt: '',
      is_enabled: true, // Default to enabled
      track_attribution_sources: ['google', 'chatgpt', 'perplexity', 'claude']
    };

    return NextResponse.json(settings || defaultSettings);

  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, ...settingsData } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the user with better error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (has @split.dev email OR is_admin=true in profile)
    const hasAdminEmail = user.email?.endsWith('@split.dev')
    
    if (!hasAdminEmail) {
      // Check if user has admin role in profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (profileError || !profile?.is_admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    // Verify workspace access
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Upsert settings
    const { data: settings, error: settingsError } = await supabase
      .from('lead_enrichment_settings')
      .upsert({
        workspace_id,
        target_titles: settingsData.target_titles,
        is_enabled: settingsData.is_enabled,
        custom_prompt: settingsData.custom_prompt,
        track_attribution_sources: settingsData.track_attribution_sources || ['google', 'chatgpt', 'perplexity', 'claude'],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'workspace_id'
      })
      .select()
      .single();

    if (settingsError) {
      console.error('Error saving settings:', settingsError);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 