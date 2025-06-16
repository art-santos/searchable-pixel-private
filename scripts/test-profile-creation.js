#!/usr/bin/env node

/**
 * Test if the handle_new_user function works correctly
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testProfileCreation() {
  console.log('🧪 Testing profile creation function...\n')

  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'

  try {
    // First, let's check the handle_new_user function source
    console.log('📋 Checking handle_new_user function...')
    console.log('Run this SQL to see the function definition:')
    console.log(`
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
    `)

    // Test creating a profile directly
    console.log('\n🔧 Testing direct profile creation...')
    const testUserId = crypto.randomUUID()
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        created_by: testUserId,
        updated_by: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Direct profile creation failed:', profileError.message)
      console.error('   Error details:', JSON.stringify(profileError, null, 2))
    } else {
      console.log('✅ Direct profile creation succeeded!')
      console.log('   Profile:', profile)
      
      // Clean up
      await supabase.from('profiles').delete().eq('id', testUserId)
      console.log('🧹 Cleaned up test profile')
    }

    // Now test actual signup
    console.log('\n📝 Testing actual signup...')
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message)
      console.error('   Status:', signupError.status)
      
      // Check if it's a specific constraint violation
      if (signupError.message.includes('constraint') || signupError.message.includes('violates')) {
        console.log('\n⚠️  This might be a constraint violation in the handle_new_user function.')
        console.log('Check if all required fields are being set properly.')
      }
    } else {
      console.log('✅ Signup succeeded!')
      console.log('   User ID:', signupData.user?.id)
      
      if (signupData.user) {
        // Check profile
        const { data: profile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single()

        if (profileCheckError) {
          console.error('❌ Profile not created:', profileCheckError.message)
        } else {
          console.log('✅ Profile created by trigger!')
          console.log('   Email:', profile.email)
          console.log('   Created by:', profile.created_by)
          console.log('   Updated by:', profile.updated_by)
        }

        // Clean up
        await supabase.auth.admin.deleteUser(signupData.user.id)
        console.log('🧹 Cleaned up test user')
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Add crypto polyfill for Node.js
if (!global.crypto) {
  global.crypto = require('crypto').webcrypto
}

testProfileCreation() 