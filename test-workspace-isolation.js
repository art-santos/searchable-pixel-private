const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-url',
  process.env.SUPABASE_SERVICE_KEY || 'your-key'
);

async function testWorkspaceIsolation() {
  console.log('🔍 Testing workspace isolation...\n');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables');
    console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in your environment or .env.local file');
    return;
  }
  
  const workspaceIds = [
    '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d', // origamiagents.com
    'ea0cc81e-8dc7-4b04-b809-f884005f3d38'  // split.dev
  ];
  
  for (const workspaceId of workspaceIds) {
    console.log(`\n📊 WORKSPACE: ${workspaceId}`);
    
    // Get workspace details
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('domain, workspace_name')
      .eq('id', workspaceId)
      .single();
      
    console.log(`   Domain: ${workspace?.domain}`);
    console.log(`   Name: ${workspace?.workspace_name}`);
    
    // 1. Check MAX Visibility assessments
    console.log(`   \n   📈 MAX VISIBILITY ASSESSMENTS:`);
    const { data: assessments } = await supabase
      .from('max_visibility_runs')
      .select('id, total_score, status, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
      
    console.log(`      Found: ${assessments?.length || 0}`);
    assessments?.forEach((a, i) => {
      console.log(`        ${i+1}. ${a.id} - Score: ${a.total_score}, Status: ${a.status}`);
    });
    
    // 2. Check competitors for this workspace
    if (assessments?.length > 0) {
      const assessmentIds = assessments.map(a => a.id);
      const { data: competitors } = await supabase
        .from('max_visibility_competitors')
        .select('competitor_name, run_id')
        .in('run_id', assessmentIds);
        
      console.log(`      Competitors: ${competitors?.length || 0}`);
      if (competitors?.length > 0) {
        const uniqueCompetitors = [...new Set(competitors.map(c => c.competitor_name))];
        console.log(`      Unique competitors: ${uniqueCompetitors.slice(0, 3).join(', ')}${uniqueCompetitors.length > 3 ? '...' : ''}`);
      }
    }
    
    // 3. Check crawler visits
    console.log(`   \n   🤖 CRAWLER VISITS:`);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: crawlerVisits } = await supabase
      .from('crawler_visits')
      .select('timestamp, crawler_name, crawler_company')
      .eq('workspace_id', workspaceId)
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(100);
      
    console.log(`      Found: ${crawlerVisits?.length || 0} (last 30 days)`);
    if (crawlerVisits?.length > 0) {
      const uniqueCrawlers = [...new Set(crawlerVisits.map(c => c.crawler_name))];
      console.log(`      Unique crawlers: ${uniqueCrawlers.slice(0, 3).join(', ')}${uniqueCrawlers.length > 3 ? '...' : ''}`);
      
      // Show most recent visit
      const mostRecent = crawlerVisits[0];
      console.log(`      Most recent: ${mostRecent.crawler_name} (${mostRecent.crawler_company}) at ${new Date(mostRecent.timestamp).toLocaleDateString()}`);
    }
    
    // 4. Check knowledge base items
    console.log(`   \n   📚 KNOWLEDGE BASE:`);
    const { data: kbItems } = await supabase
      .from('knowledge_base_items')
      .select('id, title, tag')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    console.log(`      Found: ${kbItems?.length || 0} items`);
    if (kbItems?.length > 0) {
      kbItems.forEach((item, i) => {
        console.log(`        ${i+1}. "${item.title}" (${item.tag})`);
      });
    }
    
    // 5. Check articles
    console.log(`   \n   📄 ARTICLES:`);
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, status')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    console.log(`      Found: ${articles?.length || 0} articles`);
    if (articles?.length > 0) {
      articles.forEach((article, i) => {
        console.log(`        ${i+1}. "${article.title}" (${article.status})`);
      });
    }
  }
  
  // 6. Check for any data with null workspace_id (should be minimal after migration)
  console.log(`\n❓ DATA WITH NULL WORKSPACE_ID:`);
  
  const tables = [
    'max_visibility_runs',
    'crawler_visits', 
    'knowledge_base_items',
    'articles'
  ];
  
  for (const table of tables) {
    try {
      const { data: nullWorkspaceData } = await supabase
        .from(table)
        .select('id')
        .is('workspace_id', null)
        .limit(5);
        
      console.log(`   ${table}: ${nullWorkspaceData?.length || 0} records with null workspace_id`);
    } catch (error) {
      console.log(`   ${table}: Table doesn't exist or no access`);
    }
  }
  
  console.log(`\n✅ Workspace isolation test complete!`);
  console.log(`\nIf you see data bleeding between workspaces:`);
  console.log(`1. Check browser cache/localStorage for stale data`);
  console.log(`2. Check for race conditions in frontend hooks`);
  console.log(`3. Verify API calls include proper workspaceId parameters`);
}

testWorkspaceIsolation().catch(console.error); 