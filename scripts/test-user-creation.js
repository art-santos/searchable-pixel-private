#!/usr/bin/env node

/**
 * Script to test user creation and debug any issues
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testUserCreation() {
  console.log('🧪 Testing user creation with detailed logging...\n')

  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'

  try {
    // Step 1: Check current triggers on auth.users
    console.log('📋 Checking current triggers on auth.users table...')
    
    const { data: triggers, error: triggerCheckError } = await supabase.rpc('get_auth_triggers')
    
    if (!triggerCheckError && triggers) {
      console.log('Active triggers:')
      triggers.forEach(t => {
        console.log(`  - ${t.trigger_name} (${t.event_type}) -> ${t.function_name}`)
      })
    } else if (triggerCheckError) {
      console.log('Could not check triggers:', triggerCheckError.message)
    }

    // Step 2: Check if profiles table has any constraints that might cause issues
    console.log('\n📋 Checking profiles table constraints...')
    
    const { data: constraints, error: constraintError } = await supabase.rpc('get_profile_constraints')
    
    if (!constraintError && constraints) {
      console.log('Constraints on profiles table:')
      constraints.forEach(c => {
        console.log(`  - ${c.constraint_name}: ${c.constraint_type}`)
      })
    }

    // Step 3: Try to create a test user with detailed error catching
    console.log(`\n📝 Creating test user: ${testEmail}`)
    
    // First, let's try the regular signup method (what the UI uses)
    console.log('\n1️⃣ Testing regular signup (supabase.auth.signUp)...')
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signupError) {
      console.error('❌ Regular signup failed:', signupError.message)
      console.error('   Error code:', signupError.code)
      console.error('   Error status:', signupError.status)
      console.error('   Full error:', JSON.stringify(signupError, null, 2))
      
      // Try admin method for more details
      console.log('\n2️⃣ Trying admin method (supabase.auth.admin.createUser)...')
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      })

      if (authError) {
        console.error('❌ Admin create also failed:', authError.message)
        console.error('   Error code:', authError.code)
        console.error('   Error status:', authError.status)
        console.error('   Full error:', JSON.stringify(authError, null, 2))
        
        // Let's check the actual database logs
        console.log('\n3️⃣ Checking recent database errors...')
        
        const { data: dbErrors, error: dbLogError } = await supabase.rpc('get_recent_errors')
        
        if (!dbLogError && dbErrors) {
          console.log('Recent database errors:')
          dbErrors.forEach(err => {
            console.log(`  - ${err.error_time}: ${err.error_message}`)
          })
        }
        
        return
      } else {
        console.log('✅ Admin create succeeded where regular signup failed!')
        console.log('   User ID:', authData.user.id)
        
        // Clean up
        await supabase.auth.admin.deleteUser(authData.user.id)
      }
    } else {
      console.log('✅ Regular signup succeeded!')
      console.log('   User ID:', signupData.user?.id)
      
      if (signupData.user) {
        // Check if profile was created
        console.log('\n🔍 Checking if profile was created...')
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single()

        if (profileError) {
          console.error('❌ Profile not found:', profileError.message)
        } else {
          console.log('✅ Profile created successfully')
          console.log('   Profile details:', JSON.stringify(profile, null, 2))
        }
        
        // Clean up
        await supabase.auth.admin.deleteUser(signupData.user.id)
        console.log('🧹 Cleaned up test user')
      }
    }

    // Step 4: Test trigger functions directly
    console.log('\n4️⃣ Testing trigger functions directly...')
    
    // Create a test UUID
    const testUserId = crypto.randomUUID()
    
    console.log('Testing handle_new_user function...')
    const { error: handleNewUserError } = await supabase.rpc('test_handle_new_user', {
      user_id: testUserId,
      user_email: testEmail
    })
    
    if (handleNewUserError) {
      console.error('❌ handle_new_user function failed:', handleNewUserError.message)
      console.error('   Full error:', JSON.stringify(handleNewUserError, null, 2))
    } else {
      console.log('✅ handle_new_user function works')
      
      // Clean up test profile
      await supabase.from('profiles').delete().eq('id', testUserId)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    console.error('Stack trace:', error.stack)
  }
}

// SQL to create helper functions (run these first if needed)
const HELPER_FUNCTIONS_SQL = `
-- Function to get auth triggers
CREATE OR REPLACE FUNCTION get_auth_triggers()
RETURNS TABLE(
  trigger_name text,
  event_type text,
  function_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tgname::text as trigger_name,
    CASE 
      WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
      ELSE 'AFTER'
    END || ' ' ||
    CASE 
      WHEN t.tgtype & 4 = 4 THEN 'INSERT'
      WHEN t.tgtype & 8 = 8 THEN 'DELETE'
      WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
      ELSE 'UNKNOWN'
    END as event_type,
    p.proname::text as function_name
  FROM pg_trigger t
  JOIN pg_proc p ON t.tgfoid = p.oid
  WHERE t.tgrelid = 'auth.users'::regclass
    AND NOT t.tgisinternal
  ORDER BY t.tgname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get profile constraints
CREATE OR REPLACE FUNCTION get_profile_constraints()
RETURNS TABLE(
  constraint_name text,
  constraint_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    con.conname::text as constraint_name,
    CASE con.contype
      WHEN 'c' THEN 'CHECK'
      WHEN 'f' THEN 'FOREIGN KEY'
      WHEN 'p' THEN 'PRIMARY KEY'
      WHEN 'u' THEN 'UNIQUE'
      WHEN 'x' THEN 'EXCLUSION'
      ELSE 'UNKNOWN'
    END as constraint_type
  FROM pg_constraint con
  WHERE con.conrelid = 'public.profiles'::regclass
  ORDER BY con.conname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent errors (if pg_stat_statements is available)
CREATE OR REPLACE FUNCTION get_recent_errors()
RETURNS TABLE(
  error_time timestamp,
  error_message text
) AS $$
BEGIN
  -- This is a placeholder - actual implementation depends on your logging setup
  RETURN QUERY
  SELECT NOW() as error_time, 'Error logging not configured'::text as error_message
  LIMIT 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test handle_new_user directly
CREATE OR REPLACE FUNCTION test_handle_new_user(user_id uuid, user_email text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    created_by,
    updated_by,
    created_at, 
    updated_at
  )
  VALUES (
    user_id, 
    user_email, 
    user_id,
    user_id,
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

console.log('💡 If you get RPC errors, run these SQL commands first:')
console.log(HELPER_FUNCTIONS_SQL)
console.log('\n' + '='.repeat(80) + '\n')

// Add crypto polyfill for Node.js versions that don't have it
if (!global.crypto) {
  global.crypto = require('crypto').webcrypto
}

// Run the test
testUserCreation()
  .then(() => {
    console.log('\n✅ Test complete!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Script failed:', err)
    process.exit(1)
  }) 