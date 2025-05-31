import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET: Fetch all API keys for the authenticated user
export async function GET() {
  const cookieStore = await cookies()
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data: apiKeys, error } = await supabase
    .from('api_keys')
    .select('id, name, created_at, key')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Mask the API keys for security
  const maskedKeys = apiKeys?.map(key => ({
    ...key,
    key: `${key.key.substring(0, 12)}${'*'.repeat(20)}`,
    maskedKey: true
  }))
  
  return NextResponse.json({ apiKeys: maskedKeys || [] })
}

// POST: Create a new API key
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { name } = body
  
  // Auto-generate name if not provided
  const keyName = name?.trim() || `API Key ${new Date().toLocaleDateString()}`
  
  // Generate a secure API key with timestamp and random string
  const timestamp = Date.now().toString(36)
  const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const apiKey = `split_live_${timestamp}_${randomString}`
  
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      name: keyName,
      key: apiKey,
      user_id: user.id
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ 
    apiKey: {
      ...data,
      key: apiKey // Return the full key only on creation
    }
  })
}

// DELETE: Revoke an API key
export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const keyId = searchParams.get('id')
  
  if (!keyId) {
    return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
  }
  
  // Delete the API key
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', user.id) // Ensure user owns this key
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
} 