#!/usr/bin/env node

/**
 * Simple script to check auth.users triggers
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTriggers() {
  console.log('🔍 Checking triggers on auth.users...\n')

  // Direct SQL query to get triggers
  const sql = `
    SELECT 
      t.tgname AS trigger_name,
      p.proname AS function_name,
      CASE 
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
        ELSE 'OTHER'
      END AS event_type
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgrelid = 'auth.users'::regclass
      AND NOT t.tgisinternal
      AND p.proname IN ('handle_new_user', 'sync_user_email', 'handle_user_email_update')
    ORDER BY t.tgname;
  `

  console.log('SQL Query:')
  console.log(sql)
  console.log('\nPlease run this query in your Supabase SQL Editor to see the triggers.')
  
  console.log('\n📋 Expected state:')
  console.log('- on_auth_user_created -> handle_new_user (INSERT)')
  console.log('- on_auth_user_email_updated -> handle_user_email_update (UPDATE)')
  
  console.log('\n❌ Problematic state:')
  console.log('- sync_user_email_trigger (INSERT or UPDATE) - This should be removed!')
  
  console.log('\n🔧 Fix SQL:')
  console.log('DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;')
  console.log('DROP FUNCTION IF EXISTS sync_user_email();')
}

checkTriggers() 