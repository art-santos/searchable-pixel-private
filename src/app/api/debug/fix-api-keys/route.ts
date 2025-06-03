import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST() {
  try {
    const supabase = await createClient()
    
    console.log('🔧 [Fix API Keys] Starting hash fix process...')
    
    // Get all API keys that don't have key_hash set or have empty key_hash
    const { data: apiKeys, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, key, key_hash, user_id, created_at')
      .or('key_hash.is.null,key_hash.eq.')
    
    if (fetchError) {
      console.error('❌ [Fix API Keys] Error fetching keys:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    
    console.log(`📋 [Fix API Keys] Found ${apiKeys?.length || 0} keys needing hash updates`)
    
    if (!apiKeys || apiKeys.length === 0) {
      return NextResponse.json({ 
        message: 'All API keys already have valid hashes!', 
        updated: 0 
      })
    }
    
    const results = []
    
    for (const apiKey of apiKeys) {
      console.log(`\n🔑 [Fix API Keys] Processing: ${apiKey.key.substring(0, 20)}...`)
      
      // Generate SHA256 hash (same as used in crawler-events validation)
      const keyHash = crypto.createHash('sha256').update(apiKey.key).digest('hex')
      console.log(`🔒 [Fix API Keys] Generated hash: ${keyHash.substring(0, 16)}...`)
      
      // Update the record with the hash
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ key_hash: keyHash })
        .eq('id', apiKey.id)
      
      if (updateError) {
        console.error(`❌ [Fix API Keys] Failed to update key ${apiKey.id}:`, updateError)
        results.push({
          key: apiKey.key.substring(0, 20) + '...',
          status: 'failed',
          error: updateError.message
        })
      } else {
        console.log(`✅ [Fix API Keys] Updated successfully`)
        results.push({
          key: apiKey.key.substring(0, 20) + '...',
          status: 'updated',
          hash: keyHash.substring(0, 16) + '...'
        })
      }
    }
    
    console.log(`\n🎉 [Fix API Keys] Completed! Updated ${results.filter(r => r.status === 'updated').length} keys`)
    
    return NextResponse.json({
      message: 'API key hash fix completed',
      totalKeys: apiKeys.length,
      updated: results.filter(r => r.status === 'updated').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    })
    
  } catch (error) {
    console.error('❌ [Fix API Keys] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all API keys and their hash status
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, key, key_hash, user_id, created_at, is_active')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const analysis = apiKeys?.map(key => ({
      id: key.id,
      key: key.key.substring(0, 20) + '...',
      hasHash: !!key.key_hash,
      hashPreview: key.key_hash ? key.key_hash.substring(0, 16) + '...' : 'null',
      isActive: key.is_active,
      created: key.created_at
    })) || []
    
    return NextResponse.json({
      totalKeys: apiKeys?.length || 0,
      keysWithoutHash: apiKeys?.filter(k => !k.key_hash).length || 0,
      keysWithHash: apiKeys?.filter(k => !!k.key_hash).length || 0,
      keys: analysis
    })
    
  } catch (error) {
    console.error('❌ [Debug API Keys] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 