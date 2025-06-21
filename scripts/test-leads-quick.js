#!/usr/bin/env node

/**
 * Quick Test for Split Leads Flow
 * This script quickly tests the leads data flow without full enrichment
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ensureWorkspace() {
  // Use the Origami Agents workspace
  const origamiWorkspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d';
  
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, workspace_name, domain')
    .eq('id', origamiWorkspaceId)
    .single();
  
  if (error || !workspace) {
    console.error('❌ Origami Agents workspace not found, trying any workspace...');
    
    // Fall back to any existing workspace
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, workspace_name, domain')
      .limit(1);
    
    if (workspaces && workspaces.length > 0) {
      return workspaces[0];
    }
    
    console.error('❌ No workspaces found');
    return null;
  }
  
  return workspace;
}

async function quickTest() {
  console.log('🚀 Quick Leads Flow Test\n');
  
  // Ensure workspace exists
  const workspace = await ensureWorkspace();
  if (!workspace) {
    console.error('❌ Could not find or create workspace');
    return;
  }
  
  console.log(`📁 Using workspace: ${workspace.workspace_name} (${workspace.domain})\n`);
  
  // 1. Create a test visit with real corporate IP
  const visitId = crypto.randomUUID();
  console.log('1️⃣  Creating test visit...');
  
  const { data: visit, error: visitError } = await supabase
    .from('user_visits')
    .insert({
      id: visitId,
      workspace_id: workspace.id,
      page_url: 'https://split.dev/pricing',
      ip_address: '162.255.119.254', // Mercury.com real IP
      referrer: 'https://chat.openai.com',
      utm_source: 'chatgpt',
      utm_medium: 'ai',
      user_agent: 'Mozilla/5.0 Test Agent',
      session_duration: 180,
      pages_viewed: 3,
      enrichment_status: 'pending'
    })
    .select()
    .single();
  
  if (visitError) {
    console.error('❌ Failed to create visit:', visitError);
    return;
  }
  
  console.log('✅ Visit created:', visitId);
  console.log('   - IP: 162.255.119.254 (Mercury.com)');
  console.log('   - Source: ChatGPT');
  console.log('   - Page: /pricing\n');
  
  // 2. Show enrichment flow
  console.log('2️⃣  Enrichment Flow (what would happen):');
  console.log('   📍 IP Lookup: 162.255.119.254 → Mercury.com, New York, NY');
  console.log('   🔍 Contact Search: Find "Senior sales executives" at Mercury.com');
  console.log('   📧 Email Generation: firstname@mercury.com patterns');
  console.log('   ✅ Email Verification: Check which pattern is valid\n');
  
  // 3. Simulate lead creation
  if (process.env.IPINFO_TOKEN) {
    console.log('3️⃣  Creating simulated lead...');
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspace.id,
        user_visit_id: visit.id,
        company_name: 'Mercury',
        company_domain: 'mercury.com',
        company_city: 'New York',
        company_country: 'US',
        is_ai_attributed: true,
        ai_source: 'chatgpt',
        enrichment_cost_cents: 4
      })
      .select()
      .single();
    
    if (leadError) {
      console.error('❌ Failed to create lead:', leadError);
    } else {
      console.log('✅ Lead created:', lead.id);
      console.log('   - Company: Mercury');
      console.log('   - Location: New York, NY');
      console.log('   - AI Source: ChatGPT');
      console.log('   - Cost: $0.04\n');
      
      // Simulate contact creation
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          lead_id: lead.id,
          name: 'John Smith',
          title: 'VP of Sales',
          email: 'john.smith@mercury.com',
          linkedin_url: 'https://linkedin.com/in/johnsmith',
          title_match_score: 0.85,
          email_verification_status: 'verified'
        })
        .select()
        .single();
      
      if (!contactError) {
        console.log('👤 Contact created:');
        console.log('   - Name: John Smith');
        console.log('   - Title: VP of Sales');
        console.log('   - Email: john.smith@mercury.com');
        console.log('   - Match Score: 85%\n');
      }
    }
  } else {
    console.log('⚠️  No IPINFO_TOKEN - skipping lead simulation\n');
  }
  
  // 4. Query recent activity
  console.log('4️⃣  Recent Activity:\n');
  
  const { data: recentVisits } = await supabase
    .from('user_visits')
    .select('id, page_url, ip_address, utm_source, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('Recent Visits:');
  recentVisits?.forEach(v => {
    console.log(`   ${v.id.substring(0, 8)}... | ${v.page_url} | ${v.ip_address} | ${v.utm_source || 'direct'}`);
  });
  
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, company_name, ai_source, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('\nRecent Leads:');
  recentLeads?.forEach(l => {
    console.log(`   ${l.id.substring(0, 8)}... | ${l.company_name} | ${l.ai_source || 'none'}`);
  });
  
  console.log('\n✅ Quick test complete!');
  console.log('\n💡 The enrichment flow transforms:');
  console.log('   Corporate IP → Company → Contact → Verified Email');
  console.log('\nNext steps:');
  console.log('1. Add API keys to .env.local for real enrichment');
  console.log('2. Run full test: node scripts/test-leads-flow.js');
  console.log('3. Check dashboard: http://localhost:3000/dashboard/leads');
}

quickTest().catch(console.error); 