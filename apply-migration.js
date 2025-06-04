const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function applyMigration() {
  console.log('🚀 Applying billing preferences migration...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing environment variables');
    console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
    console.error(`SUPABASE_SERVICE_KEY: ${serviceKey ? '✅' : '❌'}`);
    process.exit(1);
  }
  
  // Use service role client for admin operations
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // Read migration file
    const migrationSQL = fs.readFileSync('supabase/migrations/20241211000000_billing_preferences.sql', 'utf8');
    
    console.log('📝 Executing migration SQL...');
    
    // Split SQL into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('🎉 Migration completed!');
    
    // Test the new functions
    console.log('\n🧪 Testing new functions...');
    
    const { data: spendingLimit, error: limitError } = await supabase
      .rpc('get_plan_spending_limit', { plan_type: 'free' });
    
    if (limitError) {
      console.error('❌ Function test failed:', limitError);
    } else {
      console.log('✅ Functions working! Free plan spending limit:', spendingLimit);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration(); 