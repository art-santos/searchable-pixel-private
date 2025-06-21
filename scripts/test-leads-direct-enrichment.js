#!/usr/bin/env node

/**
 * Direct Enrichment Test - Bypasses auth to show full enrichment flow
 * This directly calls the enrichment services to demonstrate the complete pipeline
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Import the enrichment clients directly
async function testDirectEnrichment() {
  console.log('🚀 Direct Enrichment Test\n');
  
  // Check for required API keys
  if (!process.env.IPINFO_TOKEN || !process.env.EXA_API_KEY) {
    console.error('❌ Missing required API keys!');
    console.log('\nCreate a .env.local file with:');
    console.log('IPINFO_TOKEN=your_ipinfo_token');
    console.log('EXA_API_KEY=your_exa_api_key');
    console.log('\nGet keys from:');
    console.log('- IPInfo: https://ipinfo.io/account/token');
    console.log('- Exa: https://dashboard.exa.ai/api-keys');
    process.exit(1);
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test corporate IPs with known companies
  const testIPs = [
    { ip: '162.255.119.254', expected: 'Mercury', icp: 'Senior sales executives' },
    { ip: '54.187.216.72', expected: 'Stripe', icp: 'VP of Engineering' },
    { ip: '136.147.46.1', expected: 'Salesforce', icp: 'Chief Marketing Officer' },
    { ip: '17.0.0.1', expected: 'Apple', icp: 'Senior product manager' },
    { ip: '20.112.52.29', expected: 'Microsoft', icp: 'Enterprise sales director' }
  ];
  
  console.log('Testing IP enrichment...\n');
  
  for (const test of testIPs) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Testing IP: ${test.ip} (Expected: ${test.expected})`);
    console.log(`ICP Target: "${test.icp}"`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    try {
      // Step 1: IP → Company
      console.log('📍 Step 1: IP → Company (IPInfo)');
      const ipResponse = await fetch(`https://ipinfo.io/${test.ip}?token=${process.env.IPINFO_TOKEN}`);
      const ipData = await ipResponse.json();
      
      if (ipData.company) {
        console.log(`✅ Company found: ${ipData.company.name}`);
        console.log(`   Domain: ${ipData.company.domain}`);
        console.log(`   Location: ${ipData.city}, ${ipData.region}, ${ipData.country}`);
        console.log(`   Type: ${ipData.company.type || 'Business'}`);
        
        // Step 2: Company → Contacts
        console.log(`\n🔍 Step 2: Company → Contacts (Exa Search)`);
        console.log(`   Searching for: "${test.icp}" at ${ipData.company.name}`);
        
        const exaSearchBody = {
          query: `site:linkedin.com/in/ "${ipData.company.name}" "${test.icp}"`,
          numResults: 5,
          useAutoprompt: false,
          type: "neural"
        };
        
        const exaResponse = await fetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXA_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(exaSearchBody)
        });
        
        if (exaResponse.ok) {
          const exaData = await exaResponse.json();
          console.log(`✅ Found ${exaData.results?.length || 0} LinkedIn profiles`);
          
          if (exaData.results && exaData.results.length > 0) {
            // Show top result
            const topResult = exaData.results[0];
            console.log(`\n👤 Top Match:`);
            console.log(`   Title: ${topResult.title}`);
            console.log(`   URL: ${topResult.url}`);
            console.log(`   Score: ${topResult.score?.toFixed(3) || 'N/A'}`);
            
            // Step 3: Email Pattern Generation
            console.log(`\n📧 Step 3: Email Pattern Generation`);
            
            // Extract name from LinkedIn title (simplified)
            const nameMatch = topResult.title.match(/^([^-,|]+)/);
            const fullName = nameMatch ? nameMatch[1].trim() : 'Unknown Person';
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0]?.toLowerCase() || 'john';
            const lastName = nameParts[nameParts.length - 1]?.toLowerCase() || 'doe';
            
            const emailPatterns = [
              `${firstName}@${ipData.company.domain}`,
              `${firstName}.${lastName}@${ipData.company.domain}`,
              `${firstName[0]}.${lastName}@${ipData.company.domain}`,
              `${firstName}${lastName}@${ipData.company.domain}`
            ];
            
            console.log(`   Generated patterns for ${fullName}:`);
            emailPatterns.forEach(email => console.log(`   - ${email}`));
            
            // Save to database
            const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d'; // Origami Agents
            
            // Create visit
            const visitId = crypto.randomUUID();
            await supabase.from('user_visits').insert({
              id: visitId,
              workspace_id: workspaceId,
              ip_address: test.ip,
              page_url: 'https://split.dev/demo',
              referrer: 'https://chat.openai.com',
              utm_source: 'test',
              enrichment_status: 'completed'
            });
            
            // Create lead
            const { data: lead } = await supabase
              .from('leads')
              .insert({
                workspace_id: workspaceId,
                user_visit_id: visitId,
                company_name: ipData.company.name,
                company_domain: ipData.company.domain,
                company_city: ipData.city,
                company_country: ipData.country,
                company_type: ipData.company.type,
                is_ai_attributed: true,
                ai_source: 'test',
                enrichment_cost_cents: 4
              })
              .select()
              .single();
            
            if (lead) {
              console.log(`\n✅ Lead created: ${lead.id}`);
              
              // Create contact
              await supabase.from('contacts').insert({
                lead_id: lead.id,
                name: fullName,
                title: topResult.title,
                email: emailPatterns[0],
                linkedin_url: topResult.url,
                title_match_score: topResult.score || 0.8
              });
            }
          }
        } else {
          console.log(`❌ Exa search failed: ${exaResponse.status}`);
        }
        
      } else {
        console.log(`❌ No company data found (might be residential/ISP IP)`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n\n✅ Direct enrichment test complete!');
  console.log('\nView results at: http://localhost:3000/dashboard/leads');
}

testDirectEnrichment().catch(console.error); 