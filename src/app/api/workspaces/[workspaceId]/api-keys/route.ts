import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

interface WorkspaceApiKey {
  id: string
  workspace_id: string
  name: string
  api_key?: string // Only returned on creation
  permissions: {
    crawler_tracking: boolean
    read_data: boolean
  }
  is_active: boolean
  last_used_at: string | null
  created_at: string
  updated_at: string
}

// GET: Fetch all API keys for a workspace
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
  
  // Verify user owns this workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single()
  
  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
  }
  
  // Fetch API keys for this workspace
  const { data: apiKeys, error } = await supabase
    .from('workspace_api_keys')
    .select('id, name, created_at, is_active, last_used_at, permissions, metadata')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Map keys to expected format (without exposing the actual key)
  const maskedKeys = apiKeys?.map(key => ({
    id: key.id,
    workspace_id: workspaceId,
    name: key.name,
    permissions: key.permissions || { crawler_tracking: true, read_data: true },
    is_active: key.is_active,
    last_used_at: key.last_used_at,
    created_at: key.created_at,
    metadata: key.metadata
  }))
  
  return NextResponse.json({ apiKeys: maskedKeys || [] })
}

// POST: Create a new API key for a workspace
export async function POST(
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
    .select('workspace_name')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single()
  
  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
  }
  
  const body = await request.json()
  const { name, keyType = 'live', permissions } = body
  
  // Check API key limit (max 10 per workspace)
  const { count } = await supabase
    .from('workspace_api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
  
  if (count && count >= 10) {
    return NextResponse.json(
      { error: 'Maximum number of API keys (10) reached for this workspace' },
      { status: 400 }
    )
  }
  
  // Auto-generate name if not provided
  const keyTypeName = keyType === 'test' ? 'Test' : 'Live'
  const keyName = name?.trim() || `${workspace.workspace_name} ${keyTypeName} Key ${new Date().toLocaleDateString()}`
  
  // Generate a secure API key with appropriate prefix
  const timestamp = Date.now().toString(36)
  const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const prefix = keyType === 'test' ? 'split_test_' : 'split_live_'
  const apiKey = `${prefix}${timestamp}_${randomString}`
  
  // Generate hash for API validation
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
  
  // Set default permissions if not provided
  const keyPermissions = permissions || {
    crawler_tracking: true,
    read_data: true
  }
  
  const { data, error } = await supabase
    .from('workspace_api_keys')
    .insert({
      workspace_id: workspaceId,
      name: keyName,
      api_key: apiKey,
      key_hash: keyHash,
      permissions: keyPermissions,
      metadata: {
        created_by: user.id,
        key_type: keyType
      }
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ 
    apiKey: {
      id: data.id,
      workspace_id: data.workspace_id,
      name: data.name,
      api_key: apiKey, // Return the full key only on creation
      permissions: data.permissions,
      is_active: data.is_active,
      last_used_at: data.last_used_at,
      created_at: data.created_at,
      key_type: keyType
    }
  })
}

// DELETE: Revoke an API key
export async function DELETE(
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
  const { searchParams } = new URL(request.url)
  const keyId = searchParams.get('id')
  
  if (!keyId) {
    return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
  }
  
  // Verify user owns this workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single()
  
  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
  }
  
  // Delete the API key
  const { error } = await supabase
    .from('workspace_api_keys')
    .delete()
    .eq('id', keyId)
    .eq('workspace_id', workspaceId)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}

// PATCH: Update an API key (toggle active status or update permissions)
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
  const body = await request.json()
  const { keyId, is_active, permissions } = body
  
  if (!keyId) {
    return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
  }
  
  // Verify user owns this workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single()
  
  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
  }
  
  // Prepare update object
  const updateData: any = {}
  if (is_active !== undefined) updateData.is_active = is_active
  if (permissions !== undefined) updateData.permissions = permissions
  
  // Update the API key
  const { data, error } = await supabase
    .from('workspace_api_keys')
    .update(updateData)
    .eq('id', keyId)
    .eq('workspace_id', workspaceId)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ 
    apiKey: {
      id: data.id,
      workspace_id: data.workspace_id,
      name: data.name,
      permissions: data.permissions,
      is_active: data.is_active,
      last_used_at: data.last_used_at,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  })
} 