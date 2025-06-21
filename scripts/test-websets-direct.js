#!/usr/bin/env node

/**
 * Direct test of Exa Websets API
 * This bypasses the authenticated endpoint and directly uses the Websets client
 */

require('dotenv').config({ path: '.env.local' });

// Check for required env vars
if (!process.env.EXA_API_KEY) {
  console.error('❌ EXA_API_KEY not found in .env.local');
  console.error('   Add: EXA_API_KEY=your_api_key');
  process.exit(1);
}

async function testWebsetsDirect() {
  console.log('🚀 Direct Exa Websets API Test\n');
  console.log('This directly calls the Exa Websets API without authentication');
  console.log('━'.repeat(60) + '\n');

  const TEST_COMPANIES = [
    { name: 'Anthropic', titles: ['VP of Engineering', 'Chief Technology Officer', 'Head of AI Research'] },
    { name: 'OpenAI', titles: ['VP of Product', 'Chief Product Officer', 'Head of Product'] },
    { name: 'Perplexity', titles: ['VP of Sales', 'Chief Revenue Officer', 'Head of Sales'] }
  ];

  // Select company
  const companyIndex = process.argv[2] ? parseInt(process.argv[2]) - 1 : 0;
  const company = TEST_COMPANIES[companyIndex] || TEST_COMPANIES[0];
  
  console.log(`Testing: ${company.name}`);
  console.log(`Titles: ${company.titles.join(', ')}\n`);

  try {
    // Create webset search
    console.log('📤 Creating Webset search...');
    
    const websetBody = {
      search: {
        query: `${company.titles.join(' OR ')} "${company.name}" site:linkedin.com/in/`,
        count: 5,
        entity: { type: 'person' },
        criteria: [
          {
            description: `Currently works at ${company.name} in one of these roles: ${company.titles.join(', ')}`
          }
        ]
      },
      enrichments: [
        {
          description: 'Find the 3 most recent LinkedIn posts or updates by this person. List each with: Post title/topic | Date | URL | First 100 characters of content',
          format: 'text'
        },
        {
          description: 'Find recent articles, blog posts, or interviews featuring this person (2023-2024). List each with: Title | Publication | Date | URL',
          format: 'text'
        },
        {
          description: 'Find recent press quotes or media mentions of this person (2023-2024). List each with: Article title | Publication | Date | The actual quote',
          format: 'text'
        },
        {
          description: 'Find podcast appearances, conference talks, or webinars featuring this person. List each with: Event/Show name | Date | Topic discussed',
          format: 'text'
        },
        {
          description: 'Find any patents, research papers, or notable projects by this person. List each with: Title | Type | Year | Brief description',
          format: 'text'
        },
        {
          description: 'Based on recent activity, what are the key initiatives and focus areas this person is working on? What topics do they discuss most?',
          format: 'text'
        }
      ]
    };

    const createResponse = await fetch('https://api.exa.ai/websets/v0/websets/', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.EXA_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Split-Leads-Test/1.0'
      },
      body: JSON.stringify(websetBody)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      
      if (createResponse.status === 401 && error.includes('does not have access')) {
        console.error('\n❌ Your Exa account needs Pro plan access to use Websets API');
        console.error('   Please upgrade at: https://dashboard.exa.ai/billing\n');
        return;
      }
      
      throw new Error(`Webset creation failed: ${createResponse.status} - ${error}`);
    }

    const { id: websetId, status } = await createResponse.json();
    console.log(`✅ Webset created: ${websetId}`);
    console.log(`   Status: ${status}\n`);

    // Poll for results
    console.log('⏳ Polling for results (this can take 10-30 seconds)...');
    
    const startTime = Date.now();
    const maxWaitTime = 60000; // 60 seconds
    const pollInterval = 2000; // 2 seconds
    
    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await fetch(
        `https://api.exa.ai/websets/v0/websets/${websetId}`,
        {
          headers: {
            'x-api-key': process.env.EXA_API_KEY,
            'User-Agent': 'Split-Leads-Test/1.0'
          }
        }
      );
      
      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      process.stdout.write(`\r   Status: ${statusData.status}...`);
      
      if (statusData.status === 'idle' || statusData.status === 'completed') {
        console.log('\n✅ Webset completed!\n');
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Get results
    console.log('📥 Fetching results...');
    
    const itemsResponse = await fetch(
      `https://api.exa.ai/websets/v0/websets/${websetId}/items?limit=10`,
      {
        headers: {
          'x-api-key': process.env.EXA_API_KEY,
          'User-Agent': 'Split-Leads-Test/1.0'
        }
      }
    );
    
    if (!itemsResponse.ok) {
      throw new Error(`Failed to fetch items: ${itemsResponse.status}`);
    }
    
    const { data: items } = await itemsResponse.json();
    console.log(`✅ Retrieved ${items.length} results\n`);

    // Display results
    console.log('📊 Results:');
    console.log('━'.repeat(60));
    
    // First, let's see the raw structure (just the first item)
    if (items.length > 0) {
      console.log('\nRaw API Response (first item):');
      console.log(JSON.stringify(items[0], null, 2));
      console.log('\n' + '━'.repeat(60));
    }
    
    items.forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.title || 'Person Result'}`);
      console.log(`   URL: ${item.url || 'N/A'}`);
      console.log(`   Score: ${item.score?.toFixed(3) || 'N/A'}`);
      
      // Access person data from properties.person structure (per Exa docs)
      if (item.properties?.person) {
        const person = item.properties.person;
        console.log(`   Name: ${person.name || 'N/A'}`);
        console.log(`   Position: ${person.position || person.title || 'N/A'}`);
        if (person.company) {
          const company = typeof person.company === 'object' ? person.company.name : person.company;
          console.log(`   Company: ${company || 'N/A'}`);
        }
        if (person.location) {
          console.log(`   Location: ${person.location}`);
        }
        if (person.pictureUrl) {
          console.log(`   Picture: ${person.pictureUrl}`);
        }
      }
      
      // Display enrichments
      if (item.enrichments && Array.isArray(item.enrichments)) {
        console.log('\n   📋 Enrichments:');
        item.enrichments.forEach((e, i) => {
          const desc = e.description || e.name || `Enrichment ${i+1}`;
          console.log(`\n   ${i+1}. ${desc}`);
          
          if (e.result !== undefined && e.result !== null) {
            // Try to parse and display the result nicely
            try {
              let resultData = e.result;
              if (typeof resultData === 'string' && resultData.trim().startsWith('[')) {
                // Try to parse JSON array strings
                resultData = JSON.parse(resultData);
              }
              
              if (Array.isArray(resultData)) {
                console.log(`      Found ${resultData.length} items:`);
                resultData.slice(0, 3).forEach((item, idx) => {
                  if (typeof item === 'object') {
                    console.log(`      ${idx + 1}. ${item.title || item.name || 'Item'}`);
                    if (item.url) console.log(`         URL: ${item.url}`);
                    if (item.date || item.published_date) console.log(`         Date: ${item.date || item.published_date}`);
                    if (item.snippet || item.description) {
                      const text = item.snippet || item.description;
                      console.log(`         ${text.substring(0, 100)}...`);
                    }
                  } else {
                    console.log(`      - ${String(item).substring(0, 100)}...`);
                  }
                });
                if (resultData.length > 3) {
                  console.log(`      ... and ${resultData.length - 3} more`);
                }
              } else if (typeof resultData === 'string') {
                console.log(`      ${resultData.substring(0, 200)}${resultData.length > 200 ? '...' : ''}`);
              } else {
                console.log(`      ${JSON.stringify(resultData).substring(0, 200)}...`);
              }
            } catch (parseError) {
              // If parsing fails, just show as string
              console.log(`      ${String(e.result).substring(0, 200)}...`);
            }
          } else {
            console.log(`      ❌ No result returned`);
          }
        });
      } else {
        console.log('\n   ❌ No enrichments found');
      }
    });

    console.log('\n' + '━'.repeat(60));
    console.log('\n🎉 Test completed successfully!');
    console.log('\nThis was a REAL API call to Exa Websets.');
    console.log('The data above is actual enriched data from the API.\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your EXA_API_KEY in .env.local');
    console.error('2. Ensure your account has Pro plan access');
    console.error('3. Check your API quota/credits');
  }
}

// Usage
console.log('Usage: node test-websets-direct.js [company]');
console.log('Companies:');
console.log('  1. Anthropic');
console.log('  2. OpenAI');
console.log('  3. Perplexity\n');

testWebsetsDirect().catch(console.error); 