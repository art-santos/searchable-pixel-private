const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testDomainSaving() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  try {
    console.log('🧪 Testing domain saving...');
    
    // Create a test profile with domain
    const testId = '11111111-1111-1111-1111-111111111111';
    const testDomain = 'example.com';
    
    const profileData = {
      id: testId,
      email: 'domain-test@example.com',
      first_name: 'Domain',
      workspace_name: 'Test Workspace',
      domain: testDomain, // This should save properly now
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
    
    console.log('📝 Testing profile creation with domain:', testDomain);
    
    // Since we don't have an auth user, let's test if we can manually insert
    const { data: insertResult, error: insertError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select();
    
    if (insertError) {
      console.error('❌ Profile creation failed:', insertError);
    } else {
      console.log('✅ Profile created successfully!');
      console.log('📋 Domain saved as:', insertResult[0]?.domain);
      
      // Verify the domain is properly saved
      const { data: fetchResult, error: fetchError } = await supabase
        .from('profiles')
        .select('domain, workspace_name')
        .eq('id', testId)
        .single();
      
      if (fetchError) {
        console.error('❌ Could not fetch profile:', fetchError);
      } else {
        console.log('✅ Domain verification:');
        console.log('   Domain from DB:', fetchResult.domain);
        console.log('   Workspace name:', fetchResult.workspace_name);
        console.log('   Should NOT be:', fetchResult.workspace_name + '.com');
      }
      
      // Clean up
      await supabase.from('profiles').delete().eq('id', testId);
      console.log('🧹 Test profile cleaned up');
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testDomainSaving(); 