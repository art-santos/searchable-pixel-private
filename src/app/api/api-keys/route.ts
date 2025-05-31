import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Generate a secure API key
function generateApiKey(): string {
  // Format: split_live_<random_32_chars>
  const randomBytes = crypto.randomBytes(24).toString('base64url')
  return `split_live_${randomBytes}`
}

// Hash API key for secure storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

// GET: List user's API keys
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's API keys (without exposing the actual keys)
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, domains, created_at, last_used_at, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[API Keys] Error fetching keys:', error)
      throw error
    }

    return NextResponse.json({
      keys: apiKeys || []
    })
  } catch (error) {
    console.error('[API Keys] Error in GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST: Create a new API key
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, domains } = body

    // Check if user already has an API key (limit to 5 for now)
    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (count && count >= 5) {
      return NextResponse.json(
        { error: 'Maximum number of API keys reached (5)' },
        { status: 400 }
      )
    }

    // Generate new API key
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)

    // Insert into database
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_hash: keyHash,
        name: name || 'Unnamed Key',
        domains: domains || []
      })
      .select()
      .single()

    if (error) {
      console.error('[API Keys] Error creating key:', error)
      throw error
    }

    // Return the actual key only on creation
    // User won't be able to see it again
    return NextResponse.json({
      key: {
        id: data.id,
        name: data.name,
        domains: data.domains,
        created_at: data.created_at,
        api_key: apiKey // Only returned on creation!
      },
      message: 'Save this API key - you won\'t be able to see it again!'
    })
  } catch (error) {
    console.error('[API Keys] Error in POST:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}

// DELETE: Revoke an API key
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID required' },
        { status: 400 }
      )
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', user.id) // Ensure user owns this key

    if (error) {
      console.error('[API Keys] Error revoking key:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    })
  } catch (error) {
    console.error('[API Keys] Error in DELETE:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
} 