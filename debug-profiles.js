const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugProfiles() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  try {
    console.log('🔍 Debugging profile creation...');
    
    // Test 1: Check profiles table structure
    console.log('📊 Testing profiles table access...');
    const { data: existingProfiles, error: selectError } = await supabase
      .from('profiles')
      .select('id, email, billing_preferences')
      .limit(3);
    
    if (selectError) {
      console.error('❌ Cannot read profiles table:', selectError);
      return;
    } else {
      console.log('✅ Profiles table accessible, found', existingProfiles.length, 'profiles');
      if (existingProfiles.length > 0) {
        console.log('📋 Sample profile structure:', Object.keys(existingProfiles[0]));
      }
    }
    
    // Test 2: Try to manually create a profile with all required fields
    console.log('\n🧪 Testing manual profile creation...');
    const testId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
    
    const profileData = {
      id: testId,
      email: 'debug@test.com',
      first_name: 'Debug',
      created_by: testId,
      updated_by: testId,
      billing_preferences: {
        "ai_logs_enabled": true,
        "spending_limit_cents": null,
        "overage_notifications": false,
        "auto_billing_enabled": true,
        "analytics_only_mode": false
      }
    };
    
    console.log('📝 Attempting to insert:', profileData);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select();
    
    if (insertError) {
      console.error('❌ Manual profile creation failed:', insertError);
      console.error('🔍 Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Manual profile creation successful!');
      console.log('📋 Created profile:', insertResult);
      
      // Clean up
      await supabase.from('profiles').delete().eq('id', testId);
      console.log('🧹 Test profile cleaned up');
    }
    
    // Test 3: Check if there are any foreign key constraints
    console.log('\n🔗 Checking constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'profiles')
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (!constraintError && constraints) {
      console.log('🔗 Foreign key constraints on profiles:', constraints);
    }
    
  } catch (err) {
    console.error('❌ Debug failed:', err);
  }
}

debugProfiles(); 