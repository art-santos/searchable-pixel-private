import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export interface WorkspaceSettings {
  crawler_tracking: {
    enabled: boolean
    allowed_crawlers: string[]
    blocked_crawlers: string[]
  }
  data_retention: {
    crawler_logs_days: number
    max_visibility_days: number
  }
  notifications: {
    email_alerts: boolean
    webhook_url?: string
  }
  api_limits: {
    requests_per_minute: number
    requests_per_day: number
  }
}

// Default settings for new workspaces
const DEFAULT_SETTINGS: WorkspaceSettings = {
  crawler_tracking: {
    enabled: true,
    allowed_crawlers: [],
    blocked_crawlers: []
  },
  data_retention: {
    crawler_logs_days: 90,
    max_visibility_days: 365
  },
  notifications: {
    email_alerts: false
  },
  api_limits: {
    requests_per_minute: 60,
    requests_per_day: 10000
  }
}

// GET: Fetch workspace settings
export async function GET(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  const cookieStore = await cookies()
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { workspaceId } = params
  
  // Fetch workspace with settings
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, workspace_settings')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single()
  
  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
  }
  
  // Merge with default settings to ensure all fields exist
  const settings: WorkspaceSettings = {
    ...DEFAULT_SETTINGS,
    ...(workspace.workspace_settings as Partial<WorkspaceSettings> || {})
  }
  
  return NextResponse.json({ settings })
}

// PUT: Update workspace settings
export async function PUT(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  const cookieStore = await cookies()
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { workspaceId } = params
  
  // Verify user owns this workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, workspace_settings')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single()
  
  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
  }
  
  // Parse and validate settings
  const body = await request.json()
  const { settings: newSettings } = body
  
  if (!newSettings || typeof newSettings !== 'object') {
    return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 })
  }
  
  // Validate specific settings
  if (newSettings.data_retention) {
    if (newSettings.data_retention.crawler_logs_days < 7 || newSettings.data_retention.crawler_logs_days > 365) {
      return NextResponse.json({ 
        error: 'Crawler logs retention must be between 7 and 365 days' 
      }, { status: 400 })
    }
    if (newSettings.data_retention.max_visibility_days < 30 || newSettings.data_retention.max_visibility_days > 730) {
      return NextResponse.json({ 
        error: 'Max visibility retention must be between 30 and 730 days' 
      }, { status: 400 })
    }
  }
  
  if (newSettings.api_limits) {
    if (newSettings.api_limits.requests_per_minute < 1 || newSettings.api_limits.requests_per_minute > 1000) {
      return NextResponse.json({ 
        error: 'Requests per minute must be between 1 and 1000' 
      }, { status: 400 })
    }
    if (newSettings.api_limits.requests_per_day < 100 || newSettings.api_limits.requests_per_day > 1000000) {
      return NextResponse.json({ 
        error: 'Requests per day must be between 100 and 1,000,000' 
      }, { status: 400 })
    }
  }
  
  // Merge with existing settings
  const currentSettings = workspace.workspace_settings as Partial<WorkspaceSettings> || {}
  const mergedSettings: WorkspaceSettings = {
    ...DEFAULT_SETTINGS,
    ...currentSettings,
    ...newSettings
  }
  
  // Update workspace settings
  const { data, error } = await supabase
    .from('workspaces')
    .update({ workspace_settings: mergedSettings })
    .eq('id', workspaceId)
    .select('workspace_settings')
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ 
    settings: data.workspace_settings,
    message: 'Settings updated successfully'
  })
}

// PATCH: Partial update workspace settings
export async function PATCH(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  const cookieStore = await cookies()
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { workspaceId } = params
  
  // Verify user owns this workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, workspace_settings')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single()
  
  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
  }
  
  // Parse partial update
  const body = await request.json()
  const updates = body
  
  // Deep merge with existing settings
  const currentSettings = workspace.workspace_settings as Partial<WorkspaceSettings> || {}
  const mergedSettings = deepMerge(
    { ...DEFAULT_SETTINGS, ...currentSettings },
    updates
  )
  
  // Update workspace settings
  const { data, error } = await supabase
    .from('workspaces')
    .update({ workspace_settings: mergedSettings })
    .eq('id', workspaceId)
    .select('workspace_settings')
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ 
    settings: data.workspace_settings,
    message: 'Settings updated successfully'
  })
}

// Helper function for deep merging objects
function deepMerge(target: any, source: any): any {
  const output = { ...target }
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  
  return output
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item)
} 