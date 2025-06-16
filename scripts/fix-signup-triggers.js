#!/usr/bin/env node

/**
 * Emergency fix for signup issues caused by duplicate triggers
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixSignupTriggers() {
  console.log('🔧 Fixing duplicate triggers that are breaking signup...\n')

  try {
    // Drop the redundant trigger
    console.log('📌 Dropping redundant sync_user_email_trigger...')
    const { error: dropTriggerError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;'
    })
    
    if (dropTriggerError) {
      console.log('⚠️  Could not drop trigger via RPC, trying direct SQL...')
      // If RPC doesn't work, we'll need to run this SQL manually
      console.log('\nPlease run this SQL manually:')
      console.log('DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;')
      console.log('DROP FUNCTION IF EXISTS sync_user_email();')
    } else {
      console.log('✅ Dropped sync_user_email_trigger')
      
      // Drop the function too
      console.log('📌 Dropping sync_user_email function...')
      const { error: dropFunctionError } = await supabase.rpc('exec_sql', {
        sql: 'DROP FUNCTION IF EXISTS sync_user_email();'
      })
      
      if (dropFunctionError) {
        console.log('⚠️  Could not drop function via RPC')
      } else {
        console.log('✅ Dropped sync_user_email function')
      }
    }

    // Test if signup works now
    console.log('\n🧪 Testing signup...')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Signup still failing:', authError.message)
      console.log('\n⚠️  Please run these SQL commands manually in Supabase:')
      console.log('-- Drop duplicate triggers')
      console.log('DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;')
      console.log('DROP FUNCTION IF EXISTS sync_user_email();')
      console.log('\n-- Verify only these triggers remain:')
      console.log('-- on_auth_user_created (for new users)')
      console.log('-- on_auth_user_email_updated (for email updates)')
    } else {
      console.log('✅ Signup working! Created test user:', authData.user.email)
      
      // Check if profile was created
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, created_by, updated_by')
        .eq('id', authData.user.id)
        .single()
      
      if (profile) {
        console.log('✅ Profile created successfully:', profile)
      }
      
      // Clean up
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.log('🧹 Cleaned up test user')
    }

    console.log('\n✅ Fix complete! Signup should now work properly.')

  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n📋 Manual fix instructions:')
    console.log('1. Go to Supabase SQL Editor')
    console.log('2. Run these commands:')
    console.log('\n-- Drop duplicate triggers')
    console.log('DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;')
    console.log('DROP FUNCTION IF EXISTS sync_user_email();')
    console.log('\n-- Check remaining triggers')
    console.log(`SELECT t.tgname, p.proname 
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND p.proname LIKE '%user%';`)
  }
}

// Create RPC function if needed
const CREATE_EXEC_SQL = `
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

console.log('💡 Note: This script attempts to fix triggers via RPC.')
console.log('If it fails, you\'ll need to run the SQL commands manually.\n')

// Run the fix
fixSignupTriggers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script failed:', err)
    process.exit(1)
  }) 