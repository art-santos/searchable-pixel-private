#!/usr/bin/env node

/**
 * Test Script for Split Leads Flow
 * This script tests the complete leads enrichment pipeline:
 * 1. Creates a test user visit
 * 2. Triggers enrichment
 * 3. Monitors the enrichment process
 * 4. Displays the results
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Check environment setup
function checkEnvironment() {
  console.log(`${colors.bright}🔍 Checking environment setup...${colors.reset}\n`);
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'IPINFO_TOKEN',
    'EXA_API_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`${colors.red}❌ Missing required environment variables:${colors.reset}`);
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.log(`\n${colors.yellow}📋 Add these to your .env.local file${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ All environment variables found${colors.reset}\n`);
}

// Real corporate IPs for testing
const testScenarios = [
  {
    name: 'Mercury.com - AI-Attributed Sales Lead',
    visit: {
      page_url: 'https://split.dev/pricing',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      ip_address: '162.255.119.254', // Mercury.com IP
      referrer: 'https://chat.openai.com',
      utm_source: 'chatgpt',
      utm_medium: 'ai',
      utm_campaign: 'analytics_research',
      attribution_source: 'chatgpt',
      session_duration: 180,
      pages_viewed: 3
    },
    icpDescription: 'Senior sales executives'
  },
  {
    name: 'Stripe - Direct Traffic Technical Lead',
    visit: {
      page_url: 'https://split.dev/demo',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      ip_address: '54.187.216.72', // Stripe IP
      referrer: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      attribution_source: 'direct',
      session_duration: 420,
      pages_viewed: 5
    },
    icpDescription: 'VP of Engineering or CTO'
  },
  {
    name: 'Salesforce - Perplexity Marketing Lead',
    visit: {
      page_url: 'https://split.dev/features',
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      ip_address: '136.147.46.1', // Salesforce IP
      referrer: 'https://perplexity.ai',
      utm_source: 'perplexity',
      utm_medium: 'ai',
      utm_campaign: null,
      attribution_source: 'perplexity',
      session_duration: 240,
      pages_viewed: 4
    },
    icpDescription: 'Chief Marketing Officer or VP Marketing'
  }
];

async function ensureWorkspace(supabase) {
  console.log(`${colors.cyan}🏢 Setting up workspace...${colors.reset}`);
  
  // Use the Origami Agents workspace
  const origamiWorkspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d';
  
  // Verify it exists
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, workspace_name, domain')
    .eq('id', origamiWorkspaceId)
    .single();
  
  if (error || !workspace) {
    console.error(`${colors.red}❌ Origami Agents workspace not found${colors.reset}`);
    console.log(`\n${colors.yellow}Looking for any existing workspace...${colors.reset}`);
    
    // Fall back to any existing workspace
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, workspace_name, domain')
      .limit(1);
    
    if (workspaces && workspaces.length > 0) {
      console.log(`   Using workspace: ${workspaces[0].workspace_name} (${workspaces[0].domain})`);
      return workspaces[0].id;
    }
    
    console.error(`${colors.red}❌ No workspaces found${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`   Using workspace: ${workspace.workspace_name} (${workspace.domain})`);
  return workspace.id;
}

async function createTestVisit(supabase, scenario, workspaceId) {
  const visitId = crypto.randomUUID();
  
  console.log(`${colors.cyan}📝 Creating test visit: ${scenario.name}${colors.reset}`);
  console.log(`   Visit ID: ${visitId}`);
  console.log(`   IP: ${scenario.visit.ip_address}`);
  console.log(`   Page: ${scenario.visit.page_url}`);
  console.log(`   Attribution: ${scenario.visit.attribution_source || 'none'}`);
  console.log(`   ICP Target: "${scenario.icpDescription}"`);
  
  const { data, error } = await supabase
    .from('user_visits')
    .insert({
      id: visitId,
      workspace_id: workspaceId,
      ...scenario.visit,
      enrichment_status: 'pending',
      country: 'US',
      city: 'Unknown',
      region: 'Unknown'
    })
    .select()
    .single();
  
  if (error) {
    console.error(`${colors.red}❌ Failed to create visit:${colors.reset}`, error.message);
    return null;
  }
  
  console.log(`${colors.green}✅ Visit created successfully${colors.reset}\n`);
  return data;
}

async function testIpLookup(ip) {
  console.log(`${colors.cyan}🌐 Testing IP lookup for ${ip}...${colors.reset}`);
  
  try {
    const response = await fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`);
    const data = await response.json();
    
    if (data.company) {
      console.log(`${colors.green}✅ Company found:${colors.reset}`);
      console.log(`   Name: ${data.company.name}`);
      console.log(`   Domain: ${data.company.domain}`);
      console.log(`   Location: ${data.city}, ${data.region}, ${data.country}`);
      return data.company;
    } else {
      console.log(`${colors.yellow}⚠️  No company data for this IP${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.error(`${colors.red}❌ IP lookup failed:${colors.reset}`, error.message);
    return null;
  }
}

async function simulateEnrichmentFlow(visitId, icpDescription) {
  console.log(`\n${colors.bright}🔄 Simulating Enrichment Flow${colors.reset}`);
  console.log('━'.repeat(50));
  
  console.log(`\n${colors.cyan}Step 1: IP → Company (IPInfo)${colors.reset}`);
  console.log('This would normally happen in the API endpoint');
  
  console.log(`\n${colors.cyan}Step 2: Company → Contacts (Exa Search)${colors.reset}`);
  console.log(`Searching for: "${icpDescription}"`);
  console.log('This would search LinkedIn profiles at the company');
  
  console.log(`\n${colors.cyan}Step 3: Contact → Email (Pattern Generation)${colors.reset}`);
  console.log('Would generate patterns like:');
  console.log('   - firstname@company.com');
  console.log('   - firstname.lastname@company.com');
  console.log('   - f.lastname@company.com');
  
  console.log(`\n${colors.cyan}Step 4: Email Verification${colors.reset}`);
  console.log('Would verify which email pattern is valid');
  
  console.log('\n' + '━'.repeat(50));
}

async function enrichVisit(visitId, authToken, icpDescription) {
  console.log(`${colors.cyan}🔄 Triggering enrichment...${colors.reset}`);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/leads/enrich-now`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        userVisitId: visitId,
        icpDescription: icpDescription
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error(`${colors.red}❌ Enrichment failed:${colors.reset}`, result.error);
      return null;
    }
    
    return result;
  } catch (error) {
    console.error(`${colors.red}❌ API call failed:${colors.reset}`, error.message);
    return null;
  }
}

async function displayResults(supabase, leadId) {
  console.log(`\n${colors.bright}📊 Enrichment Results${colors.reset}`);
  console.log('━'.repeat(50));
  
  // Get lead details
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select(`
      *,
      contacts (
        *,
        contact_media (*)
      )
    `)
    .eq('id', leadId)
    .single();
  
  if (leadError || !lead) {
    console.error(`${colors.red}❌ Failed to fetch lead:${colors.reset}`, leadError?.message);
    return;
  }
  
  // Display company info
  console.log(`\n${colors.bright}🏢 Company Information${colors.reset}`);
  console.log(`   Name: ${lead.company_name}`);
  console.log(`   Domain: ${lead.company_domain}`);
  console.log(`   Location: ${lead.company_city}, ${lead.company_country}`);
  console.log(`   Type: ${lead.company_type || 'Unknown'}`);
  
  // Display attribution
  if (lead.is_ai_attributed) {
    console.log(`\n${colors.bright}🤖 AI Attribution${colors.reset}`);
    console.log(`   Source: ${lead.ai_source || 'Unknown'}`);
    console.log(`   ${colors.green}✅ AI-attributed lead!${colors.reset}`);
  }
  
  // Display contact info
  if (lead.contacts && lead.contacts.length > 0) {
    const contact = lead.contacts[0];
    console.log(`\n${colors.bright}👤 Contact Information${colors.reset}`);
    console.log(`   Name: ${contact.name}`);
    console.log(`   Title: ${contact.title}`);
    console.log(`   Email: ${contact.email}`);
    console.log(`   LinkedIn: ${contact.linkedin_url}`);
    console.log(`   Match Score: ${(contact.title_match_score * 100).toFixed(0)}%`);
    
    // Display media mentions if any
    if (contact.contact_media && contact.contact_media.length > 0) {
      console.log(`\n${colors.bright}📰 Public Signals (${contact.contact_media.length})${colors.reset}`);
      contact.contact_media.slice(0, 3).forEach(media => {
        console.log(`   • ${media.title}`);
        console.log(`     ${media.url}`);
      });
    }
  }
  
  // Display cost
  console.log(`\n${colors.bright}💰 Enrichment Cost${colors.reset}`);
  console.log(`   $${(lead.enrichment_cost_cents / 100).toFixed(2)}`);
  
  console.log('\n' + '━'.repeat(50));
}

async function runTest() {
  checkEnvironment();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Ensure we have a workspace
  const workspaceId = await ensureWorkspace(supabase);
  
  // Get auth token for API calls
  console.log(`\n${colors.cyan}🔐 Getting authentication token...${colors.reset}`);
  
  // For testing, we'll use the service role key as bearer token
  // In production, you'd get this from a real user session
  const authToken = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Select scenario
  const scenarioIndex = process.argv[2] ? parseInt(process.argv[2]) - 1 : 0;
  const scenario = testScenarios[scenarioIndex] || testScenarios[0];
  
  console.log(`\n${colors.bright}🧪 Test Scenario: ${scenario.name}${colors.reset}\n`);
  
  // Test IP lookup first
  const company = await testIpLookup(scenario.visit.ip_address);
  
  if (!company) {
    console.log(`\n${colors.yellow}⚠️  Continuing with test despite IP lookup issue${colors.reset}`);
  }
  
  // Create test visit
  const visit = await createTestVisit(supabase, scenario, workspaceId);
  if (!visit) {
    process.exit(1);
  }
  
  // Show what would happen in enrichment
  await simulateEnrichmentFlow(visit.id, scenario.icpDescription);
  
  // Trigger enrichment
  const enrichmentResult = await enrichVisit(visit.id, authToken, scenario.icpDescription);
  
  if (!enrichmentResult) {
    console.log(`\n${colors.yellow}💡 Note: Enrichment requires:${colors.reset}`);
    console.log('   1. The API server running (pnpm dev)');
    console.log('   2. Admin access (user with @split.dev email or is_admin=true)');
    console.log('   3. Valid API keys for IPInfo and Exa');
    console.log(`\n${colors.cyan}To see the flow without API calls, check the simulation above${colors.reset}`);
    process.exit(1);
  }
  
  if (enrichmentResult.success) {
    console.log(`${colors.green}✅ Enrichment successful!${colors.reset}`);
    console.log(`   Status: ${enrichmentResult.status}`);
    console.log(`   Lead ID: ${enrichmentResult.leadId}`);
    
    // Display full results
    await displayResults(supabase, enrichmentResult.leadId);
    
    console.log(`\n${colors.green}🎉 Test completed successfully!${colors.reset}`);
    console.log(`\n${colors.cyan}The enrichment flow:${colors.reset}`);
    console.log('1. IP lookup found: ' + (enrichmentResult.company?.name || 'Unknown'));
    console.log('2. Searched for: "' + scenario.icpDescription + '"');
    console.log('3. Found contact: ' + (enrichmentResult.contact?.name || 'None'));
    console.log('4. Verified email: ' + (enrichmentResult.contact?.email || 'None'));
    
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
    console.log('1. Check the leads dashboard: http://localhost:3000/dashboard/leads');
    console.log('2. View this specific lead in the database');
    console.log('3. Test email deliverability with the verified email');
  } else {
    console.log(`${colors.yellow}⚠️  Enrichment completed with status: ${enrichmentResult.status}${colors.reset}`);
    console.log(`   Message: ${enrichmentResult.error || 'No additional details'}`);
    
    if (enrichmentResult.company) {
      console.log(`\n${colors.cyan}Company found:${colors.reset}`);
      console.log(`   ${enrichmentResult.company.name} (${enrichmentResult.company.domain})`);
    }
  }
}

// Run the test
console.log(`${colors.bright}🚀 Split Leads Flow Test${colors.reset}\n`);
console.log('Usage: node test-leads-flow.js [scenario]');
console.log('Scenarios:');
testScenarios.forEach((s, i) => {
  console.log(`  ${i + 1}. ${s.name}`);
});
console.log('');

runTest().catch(error => {
  console.error(`${colors.red}❌ Test failed:${colors.reset}`, error);
  process.exit(1);
}); 