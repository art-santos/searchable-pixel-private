const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAuthTrigger() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  try {
    console.log('🧪 Testing auth trigger...');
    
    // Test 1: Check if the function exists
    const { data: functions, error: funcCheckError } = await supabase
      .rpc('exec', { 
        sql: "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'handle_new_user';" 
      });
    
    if (funcCheckError) {
      console.error('❌ Could not check for function:', funcCheckError);
    } else {
      console.log('✅ handle_new_user function exists');
    }
    
    // Test 2: Check if trigger exists
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec', { 
        sql: "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';" 
      });
    
    if (triggerError) {
      console.error('❌ Could not check for trigger:', triggerError);
    } else {
      console.log('✅ on_auth_user_created trigger exists');
    }
    
    // Test 3: Try a real signup with a test email
    console.log('🧪 Testing actual signup...');
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signupError) {
      console.error('❌ Signup test failed:', signupError);
    } else {
      console.log('✅ Signup successful!');
      console.log('👤 User created:', signupData.user?.id);
      
      // Check if profile was auto-created
      if (signupData.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Profile not created:', profileError);
        } else {
          console.log('✅ Profile auto-created with billing preferences!');
          console.log('📋 Profile:', {
            id: profile.id,
            email: profile.email,
            billing_preferences: profile.billing_preferences
          });
        }
        
        // Clean up test user
        await supabase.auth.admin.deleteUser(signupData.user.id);
        console.log('🧹 Test user cleaned up');
      }
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testAuthTrigger(); 