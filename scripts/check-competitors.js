#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkCompetitors() {
  console.log('🔍 Checking MAX Visibility competitor data...');
  console.log('='.repeat(60));
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
    console.error(`SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
    process.exit(1);
  }
  
  // Create client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // 1. Check total assessments
    console.log('📊 MAX Visibility Assessments:');
    const { data: assessments, error: assessmentsError } = await supabase
      .from('max_visibility_runs')
      .select('id, company_id, status, total_score, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (assessmentsError) {
      console.error('❌ Error fetching assessments:', assessmentsError);
      return;
    }
    
    console.log(`   Total recent assessments: ${assessments?.length || 0}`);
    if (assessments && assessments.length > 0) {
      assessments.forEach((assessment, i) => {
        console.log(`   ${i + 1}. Assessment ${assessment.id} (Company: ${assessment.company_id})`);
        console.log(`      Status: ${assessment.status}, Score: ${assessment.total_score}`);
        console.log(`      Created: ${assessment.created_at}`);
      });
    }
    
    console.log('\n🏢 MAX Visibility Competitors:');
    
    // 2. Check total competitors
    const { data: allCompetitors, error: competitorsError } = await supabase
      .from('max_visibility_competitors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (competitorsError) {
      console.error('❌ Error fetching competitors:', competitorsError);
      return;
    }
    
    console.log(`   Total competitors: ${allCompetitors?.length || 0}`);
    
    if (allCompetitors && allCompetitors.length > 0) {
      console.log('\n📋 Competitor Details:');
      allCompetitors.forEach((comp, i) => {
        console.log(`   ${i + 1}. "${comp.competitor_name}" (Assessment: ${comp.run_id})`);
        console.log(`      Domain: ${comp.competitor_domain || 'N/A'}`);
        console.log(`      Score: ${comp.ai_visibility_score || 'N/A'}`);
        console.log(`      Rank: ${comp.rank_position || 'N/A'}`);
        console.log(`      Created: ${comp.created_at}`);
        console.log('');
      });
      
      // 3. Group by assessment
      const competitorsByAssessment = {};
      allCompetitors.forEach(comp => {
        if (!competitorsByAssessment[comp.run_id]) {
          competitorsByAssessment[comp.run_id] = [];
        }
        competitorsByAssessment[comp.run_id].push(comp);
      });
      
      console.log('📈 Competitors by Assessment:');
      Object.entries(competitorsByAssessment).forEach(([assessmentId, competitors]) => {
        console.log(`   Assessment ${assessmentId}: ${competitors.length} competitors`);
        competitors.forEach(comp => {
          console.log(`     - ${comp.competitor_name} (${comp.ai_visibility_score || 'No score'})`);
        });
      });
      
      // 4. Check for hardcoded competitors
      const hardcodedNames = ['ZoomInfo', 'Apollo', 'Outreach', 'OpenAI', 'Salesforce', 'HubSpot'];
      const hardcodedCompetitors = allCompetitors.filter(comp => 
        hardcodedNames.includes(comp.competitor_name)
      );
      
      if (hardcodedCompetitors.length > 0) {
        console.log('\n⚠️  Found hardcoded competitors:');
        hardcodedCompetitors.forEach(comp => {
          console.log(`   - ${comp.competitor_name} (Assessment: ${comp.run_id})`);
        });
      } else {
        console.log('\n✅ No hardcoded competitors found');
      }
    } else {
      console.log('   ❌ No competitors found in database');
    }
    
    // 5. Check companies table
    console.log('\n🏭 Companies in database:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, root_url')
      .limit(5);
    
    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError);
    } else {
      console.log(`   Total companies (showing first 5): ${companies?.length || 0}`);
      companies?.forEach((company, i) => {
        console.log(`   ${i + 1}. ${company.company_name} (${company.root_url})`);
      });
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

// Run the check
checkCompetitors()
  .then(() => {
    console.log('\n✅ Competitor check complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error during check:', err);
    process.exit(1);
  }); 