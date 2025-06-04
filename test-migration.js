const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testMigration() {
  console.log('🔑 Environment check:');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing');
  console.log('Service Key:', process.env.SUPABASE_SERVICE_KEY ? '✅ Found' : '❌ Missing');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  try {
    console.log('🧪 Testing if migration was applied...');
    
    // Test 1: Try to call the new function
    console.log('🔧 Testing get_plan_spending_limit function...');
    const { data: planLimit, error: funcError } = await supabase
      .rpc('get_plan_spending_limit', { plan_type: 'free' });
    
    if (funcError) {
      console.error('❌ Function test failed:', funcError);
    } else {
      console.log('✅ Function works! Free plan limit:', planLimit);
    }
    
    // Test 2: Check if dismissed_notifications table exists
    console.log('📊 Testing dismissed_notifications table...');
    const { data: tableTest, error: tableError } = await supabase
      .from('dismissed_notifications')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table test failed:', tableError);
    } else {
      console.log('✅ dismissed_notifications table exists');
    }
    
    // Test 3: Check profiles table structure
    console.log('👤 Testing profiles table access...');
    const { data: profileTest, error: profileError } = await supabase
      .from('profiles')
      .select('billing_preferences')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Profiles billing_preferences test failed:', profileError);
    } else {
      console.log('✅ Profiles table with billing_preferences accessible');
    }
    
    // Test 4: Try creating a test profile entry
    console.log('🧪 Testing profile creation (simulate signup)...');
    const testUserId = '00000000-0000-0000-0000-000000000001'; // Fake UUID for testing
    
    const { data: insertTest, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: testUserId,
        email: 'test@example.com',
        first_name: 'Test',
        workspace_name: 'Test Workspace'
      }, { 
        onConflict: 'id',
        ignoreDuplicates: true 
      })
      .select();
    
    if (insertError) {
      console.error('❌ Profile creation test failed:', insertError);
      console.error('🔍 This is likely the cause of signup failures!');
    } else {
      console.log('✅ Profile creation works fine');
      
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', testUserId);
    }
    
  } catch (err) {
    console.error('❌ Migration test failed:', err);
  }
}

testMigration(); 