import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

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
    
    // Validate API key
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, user_id, name')
      .eq('key', apiKey)
      .single()
    
    if (keyError || !keyData) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Invalid API key' 
        },
        { status: 401 }
      )
    }
    
    // Get user profile info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('workspace_name, domain')
      .eq('id', keyData.user_id)
      .single()
    
    // Return success with connection info
    return NextResponse.json({
      status: 'ok',
      connection: {
        authenticated: true,
        keyName: keyData.name,
        workspace: profile?.workspace_name || 'Unknown',
        domain: profile?.domain || null
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