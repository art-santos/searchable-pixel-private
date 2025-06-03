#!/usr/bin/env node

/**
 * Fix API Key Hashes Script
 * Ensures all API keys have the correct key_hash for validation
 */

const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixApiKeyHashes() {
  console.log('🔧 Fixing API key hashes...\n')
  
  try {
    // Get all API keys that don't have key_hash set
    const { data: apiKeys, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, key, key_hash')
      .or('key_hash.is.null,key_hash.eq.')
    
    if (fetchError) {
      console.error('❌ Error fetching API keys:', fetchError)
      return
    }
    
    if (!apiKeys || apiKeys.length === 0) {
      console.log('✅ All API keys already have valid hashes!')
      return
    }
    
    console.log(`📋 Found ${apiKeys.length} API keys needing hash updates:`)
    
    for (const apiKey of apiKeys) {
      console.log(`\n🔑 Processing key: ${apiKey.key.substring(0, 20)}...`)
      
      // Generate hash
      const keyHash = crypto.createHash('sha256').update(apiKey.key).digest('hex')
      console.log(`🔒 Generated hash: ${keyHash.substring(0, 16)}...`)
      
      // Update the record
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ key_hash: keyHash })
        .eq('id', apiKey.id)
      
      if (updateError) {
        console.error(`❌ Failed to update key ${apiKey.id}:`, updateError)
      } else {
        console.log(`✅ Updated key hash successfully`)
      }
    }
    
    console.log(`\n🎉 Completed! Updated ${apiKeys.length} API keys.`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  fixApiKeyHashes().then(() => {
    console.log('\n🏁 Script completed')
    process.exit(0)
  }).catch(error => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })
}

module.exports = { fixApiKeyHashes } 