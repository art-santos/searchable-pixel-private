const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearRemainingTables() {
  const tables = ['visibility_results', 'snapshot_questions', 'page_content'];
  
  console.log('🧹 Clearing remaining tables with old citation data...\n');
  
  for (const table of tables) {
    try {
      const { count: beforeCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      const { error } = await supabase
        .from(table)
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      if (!error) {
        console.log(`✅ Cleared ${table} (deleted ${beforeCount || 0} records)`);
      } else {
        console.error(`❌ Failed to clear ${table}:`, error.message);
      }
    } catch (err) {
      console.error(`⚠️ Error with ${table}:`, err.message);
    }
  }
  console.log('\n🎉 All old snapshot data cleared! Ready to test new citation system.');
}

clearRemainingTables(); 