import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

// Hash API key for secure storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

interface ApiKeyValidation {
  user_id: string
  workspace_id: string | null
  is_valid: boolean
  key_type: 'workspace' | 'user'
  permissions: {
    crawler_tracking?: boolean
    read_data?: boolean
  }
}

export async function GET(request: Request) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Missing or invalid authorization header' 
        },
        { status: 401 }
      )
    }
    
    const apiKey = authHeader.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'API key is required' 
        },
        { status: 401 }
      )
    }
    
    // Hash the API key for validation
    const keyHash = hashApiKey(apiKey)
    
    // Validate API key using the new function that checks both workspace and user keys
    const { data: keyData, error: keyError } = await supabaseAdmin
      .rpc('validate_any_api_key', { p_key_hash: keyHash })
      .single<ApiKeyValidation>()
    
    if (keyError || !keyData || !keyData.is_valid) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Invalid API key' 
        },
        { status: 401 }
      )
    }
    
    // Get workspace details based on key type
    let workspaceInfo = null
    let keyName = null
    
    if (keyData.key_type === 'workspace') {
      // Get workspace details directly
      const { data: workspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .select('workspace_name, domain')
        .eq('id', keyData.workspace_id)
        .single()
      
      if (workspace && !workspaceError) {
        workspaceInfo = {
          workspace: workspace.workspace_name,
          domain: workspace.domain
        }
      }
      
      // Get key name
      const { data: apiKeyRecord } = await supabaseAdmin
        .from('workspace_api_keys')
        .select('name')
        .eq('key_hash', keyHash)
        .single()
      
      keyName = apiKeyRecord?.name || 'Workspace API Key'
    } else {
      // For user keys, get the user's PRIMARY workspace (not profile table)
      const { data: workspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .select('workspace_name, domain')
        .eq('user_id', keyData.user_id)
        .eq('is_primary', true)
        .single()
      
      if (workspace && !workspaceError) {
        workspaceInfo = {
          workspace: workspace.workspace_name || 'Primary Workspace',
          domain: workspace.domain
        }
      } else {
        // Fallback if no primary workspace found (shouldn't happen)
        workspaceInfo = {
          workspace: 'Primary Workspace',
          domain: null
        }
      }
      
      // Get key name
      const { data: apiKeyRecord } = await supabaseAdmin
        .from('api_keys')
        .select('name')
        .eq('key_hash', keyHash)
        .single()
      
      keyName = apiKeyRecord?.name || 'User API Key'
    }
    
    // Get user's subscription plan info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_plan')
      .eq('id', keyData.user_id)
      .single()
    
    // Return success with connection info
    return NextResponse.json({
      status: 'ok',
      connection: {
        authenticated: true,
        keyName: keyName,
        keyType: keyData.key_type,
        workspace: workspaceInfo?.workspace || 'Unknown',
        domain: workspaceInfo?.domain || null,
        plan: profile?.subscription_plan || 'free',
        permissions: keyData.permissions
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Ping endpoint error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 