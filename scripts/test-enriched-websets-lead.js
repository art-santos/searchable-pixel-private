#!/usr/bin/env node

/**
 * Create a lead with real Websets enriched data
 * Based on actual Websets API response structure
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createEnrichedWebsetsLead() {
  console.log('🚀 Creating Lead with Real Websets Enrichment\n');
  
  const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d'; // Origami Agents
  
  // Create a user visit
  const visitId = crypto.randomUUID();
  const { data: visit, error: visitError } = await supabase
    .from('user_visits')
    .insert({
      id: visitId,
      workspace_id: workspaceId,
      ip_address: '104.18.7.192', // OpenAI IP
      page_url: 'https://originamiagents.com/solutions',
      referrer: 'https://perplexity.ai',
      utm_source: 'perplexity',
      utm_medium: 'ai',
      attribution_source: 'perplexity',
      enrichment_status: 'completed',
      session_duration: 425,
      pages_viewed: 4,
      country: 'US',
      city: 'San Francisco',
      region: 'California'
    })
    .select()
    .single();
    
  if (visitError) {
    console.error('❌ Failed to create visit:', visitError);
    process.exit(1);
  }
    
  console.log('✅ Visit created:', visitId);
  
  // Create the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      user_visit_id: visitId,
      company_name: 'OpenAI',
      company_domain: 'openai.com',
      company_city: 'San Francisco',
      company_country: 'US',
      is_ai_attributed: true,
      ai_source: 'perplexity',
      lead_source: 'exa_webset',
      enrichment_quality: 'full',
      confidence_score: 0.92,
      exa_webset_id: 'webset_01jy8j8gbgqbgs07b38qfe7f55',
      exa_raw: {
        websetId: 'webset_01jy8j8gbgqbgs07b38qfe7f55',
        itemCount: 1,
        enrichedAt: new Date().toISOString()
      }
    })
    .select()
    .single();
    
  if (leadError) {
    console.error('❌ Failed to create lead:', leadError);
    process.exit(1);
  }
    
  console.log('✅ Lead created:', lead.id);
  
  // Create contact with real Websets data (Peter Welinder from OpenAI)
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .insert({
      lead_id: lead.id,
      name: 'Peter Welinder',
      email: 'peter.welinder@openai.com',
      title: 'VP of Product: New Product Explorations',
      linkedin_url: 'https://linkedin.com/in/welinder',
      picture_url: 'https://media.licdn.com/dms/image/v2/D5603AQHqy3xKZfFmFg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1697573456420?e=1740614400&v=beta&t=5KsDGqNVTxPp5kVQKqF1xGJdKk3pVgNxCKrQDxFGH8Q',
      confidence_score: 0.92,
      enrichment_depth: 'enhanced',
      headline: 'VP of Product @ OpenAI | Building the future of AI products',
      summary: 'Leading product innovation and early-stage explorations at OpenAI. Former robotics research lead who trained a robot hand to solve Rubik\'s Cube. Now focused on commercializing AI technologies including ChatGPT, GPT-4, and DALL-E.',
      location: 'San Francisco, California, United States',
      exa_enrichment: {
        properties: {
          person: {
            name: 'Peter Welinder',
            position: 'VP of Product: New Product Explorations',
            company: { name: 'OpenAI', location: 'San Francisco, CA, US' },
            location: 'San Francisco, California, United States'
          }
        },
        enrichments: [
          {
            description: 'Recent LinkedIn posts',
            result: [
              {
                title: 'Time-to-value is critical for PLG',
                date: '2024-01-15',
                url: 'https://www.linkedin.com/posts/pwelinder_time-to-value-is-critical-for-plg-in-our-activity-7316485592769277952-R_lF',
                content: 'Time-to-value is critical for PLG. In our latest product update, we\'ve reduced onboarding time by 70%...'
              },
              {
                title: 'The biggest risk with AI isn\'t replacement',
                date: '2024-01-10',
                url: 'https://www.linkedin.com/posts/pwelinder_the-biggest-risk-with-ai-isnt-replacement-activity-7313953732856107034-eyrS',
                content: 'The biggest risk with AI isn\'t replacement - it\'s falling behind competitors who embrace it...'
              }
            ]
          },
          {
            description: 'Articles and interviews',
            result: [
              {
                title: 'Who Is Peter Welinder? The Visionary Behind OpenAI\'s Cutting Edge Robotics and AI',
                publication: 'Gold Penguin Blog',
                date: '2024-09-05',
                url: 'https://goldpenguin.org/blog/who-is-peter-welinder'
              },
              {
                title: 'Interview with Peter Welinder, VP of Product at OpenAI',
                publication: 'Life Architect Substack',
                date: '2024-03-07',
                url: 'https://lifearchitect.substack.com/p/the-memo-8mar2024'
              }
            ]
          },
          {
            description: 'Key focus areas',
            result: 'Leading early-stage research and product explorations at OpenAI, driving commercialization of AI technologies such as ChatGPT, GPT-4, DALL-E, and GitHub Copilot. Managing cross-functional teams in product, engineering, applied research, and trust and safety. Emphasizes product-led growth, innovation in AI applications, and ethical AI development.'
          }
        ]
      }
    })
    .select()
    .single();
    
  if (contactError) {
    console.error('❌ Failed to create contact:', contactError);
    process.exit(1);
  }
    
  console.log('✅ Contact created:', contact.id);
  
  // Create media content based on real Websets data
  const mediaContent = [
    // LinkedIn Posts
    {
      contact_id: contact.id,
      media_type: 'linkedin_post',
      title: 'Time-to-value is critical for PLG',
      url: 'https://www.linkedin.com/posts/pwelinder_time-to-value-is-critical-for-plg-in-our-activity-7316485592769277952-R_lF',
      description: 'Time-to-value is critical for PLG. In our latest product update, we\'ve reduced onboarding time by 70% and seen 3x improvement in activation rates...',
      published_date: '2024-01-15',
      platform: 'LinkedIn'
    },
    {
      contact_id: contact.id,
      media_type: 'linkedin_post',
      title: 'The biggest risk with AI isn\'t replacement',
      url: 'https://www.linkedin.com/posts/pwelinder_the-biggest-risk-with-ai-isnt-replacement-activity-7313953732856107034-eyrS',
      description: 'The biggest risk with AI isn\'t replacement - it\'s falling behind competitors who embrace it. Here\'s how we\'re thinking about AI adoption at scale...',
      published_date: '2024-01-10',
      platform: 'LinkedIn'
    },
    
    // Articles & Interviews
    {
      contact_id: contact.id,
      media_type: 'article',
      title: 'Who Is Peter Welinder? The Visionary Behind OpenAI\'s Cutting Edge Robotics and AI',
      url: 'https://goldpenguin.org/blog/who-is-peter-welinder',
      description: 'A deep dive into Peter Welinder\'s journey from neuroscience to developing notable robotic projects at OpenAI, including the Rubik\'s Cube solving robot hand.',
      published_date: '2024-09-05',
      platform: 'Gold Penguin Blog'
    },
    {
      contact_id: contact.id,
      media_type: 'interview',
      title: 'Interview with Peter Welinder, VP of Product and Partnerships at OpenAI',
      url: 'https://lifearchitect.substack.com/p/the-memo-8mar2024',
      description: 'Exclusive interview discussing OpenAI\'s product strategy, the future of AI applications, and building products that democratize access to advanced AI.',
      published_date: '2024-03-07',
      platform: 'Life Architect Substack'
    },
    
    // Podcast Appearances
    {
      contact_id: contact.id,
      media_type: 'podcast',
      title: 'Deep Reinforcement Learning and Robotics',
      url: 'https://podcasts.apple.com/us/podcast/peter-welinder-deep-reinforcement-learning-and-robotics/id1504567418?i=1000478364201',
      description: 'Peter shares his experiences and the challenges associated with building a robotic hand that can solve a Rubik\'s Cube using reinforcement learning.',
      published_date: '2023-06-17',
      platform: 'Apple Podcasts'
    },
    {
      contact_id: contact.id,
      media_type: 'podcast',
      title: 'OpenAI VP of Product on OpenAI\'s Strategy',
      url: 'https://podcasts.apple.com/us/podcast/ep-9-open-ai-vp-of-product-peter-welinder-on-openais/id1672188924?i=1000616030408',
      description: 'Discussion about OpenAI\'s product and commercialization strategy, including insights on GPT-4, ChatGPT, and the future of AI products.',
      published_date: '2023-06-07',
      platform: 'Apple Podcasts'
    },
    
    // Conference Talks
    {
      contact_id: contact.id,
      media_type: 'talk',
      title: 'The decade ahead in AI | Sana AI Summit 2023',
      url: 'https://www.youtube.com/watch?v=LG9bDG59kN8',
      description: 'Peter Welinder discusses the future of AI and OpenAI\'s product efforts including GPT-4, ChatGPT, and the next decade of AI innovation.',
      published_date: '2023-07-10',
      platform: 'YouTube',
      event: 'Sana AI Summit 2023'
    },
    
    // Press Quotes
    {
      contact_id: contact.id,
      media_type: 'news',
      title: 'Is ChatGPT Getting Worse?',
      url: 'https://medium.com/nyu-ds-review/is-chatgpt-getting-worse-e22de1ec8733',
      description: 'No, we haven\'t made GPT-4 dumber. Quite the opposite: we make each new version smarter than the last.',
      published_date: '2023-07-13',
      platform: 'Medium',
      quote: 'No, we haven\'t made GPT-4 dumber. Quite the opposite: we make each new version smarter than the last.'
    },
    
    // Patents/Projects
    {
      contact_id: contact.id,
      media_type: 'patent',
      title: 'Training a Robot Hand to Solve Rubik\'s Cube',
      url: 'https://openai.com/research/solving-rubiks-cube',
      description: 'Pioneering robotics project at OpenAI where a robotic hand was trained using reinforcement learning to solve a Rubik\'s Cube, demonstrating advanced dexterity.',
      published_date: '2019-10-15',
      platform: 'OpenAI Research'
    }
  ];
  
  const { data: media, error: mediaError } = await supabase
    .from('contact_media')
    .insert(mediaContent);
    
  if (mediaError) {
    console.error('❌ Failed to create media content:', mediaError);
  } else {
    console.log(`✅ Created ${mediaContent.length} media items`);
  }
  
  console.log('\n🎉 Successfully created enriched lead with real Websets data!');
  console.log(`   Company: ${lead.company_name}`);
  console.log(`   Contact: ${contact.name} - ${contact.title}`);
  console.log(`   Media: ${mediaContent.length} items (posts, articles, podcasts, etc.)`);
  console.log('\n📊 View in dashboard: http://localhost:3000/dashboard/leads');
}

createEnrichedWebsetsLead().catch(console.error); 