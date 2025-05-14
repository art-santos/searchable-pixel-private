// Simple script to test Supabase connection
// Run with: node test-supabase.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabase() {
  console.log('Testing Supabase connection...');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables:');
    console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
    console.error(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌'}`);
    return;
  }
  
  // Create client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test connection by getting the PostgreSQL version
    const { data, error } = await supabase.rpc('get_pg_version');
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('PostgreSQL version:', data);
    
    // Test auth functionality
    console.log('\nTesting auth functionality...');
    const authResponse = await supabase.auth.getSession();
    
    if (authResponse.error) {
      console.error('❌ Auth test failed:', authResponse.error);
    } else {
      console.log('✅ Auth is working!');
    }
    
    // Test profiles table
    console.log('\nTesting profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table test failed:', profilesError);
    } else {
      console.log('✅ Profiles table is accessible!');
      console.log('Sample profile:', profiles.length ? JSON.stringify(profiles[0], null, 2) : 'No profiles found');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testSupabase(); 