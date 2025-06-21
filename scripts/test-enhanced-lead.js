#!/usr/bin/env node

/**
 * Test script to create an enhanced lead with full media content
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createEnhancedLead() {
  console.log('🚀 Creating Enhanced Lead with Media Content\n');
  
  const workspaceId = '6ee8cf4c-c09c-40e3-a6d2-e872bb8f328d'; // Origami Agents
  
  // Create a user visit
  const visitId = crypto.randomUUID();
  const { data: visit } = await supabase
    .from('user_visits')
    .insert({
      id: visitId,
      workspace_id: workspaceId,
      ip_address: '52.52.32.174', // Salesforce IP
      page_url: 'https://split.dev/features/ai-attribution',
      referrer: 'https://chat.openai.com',
      utm_source: 'chatgpt',
      utm_medium: 'ai',
      attribution_source: 'chatgpt',
      enrichment_status: 'completed',
      session_duration: 420,
      pages_viewed: 5,
      country: 'US',
      city: 'San Francisco',
      region: 'California'
    })
    .select()
    .single();
  
  console.log('✅ Visit created');
  
  // Create lead
  const { data: lead } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      user_visit_id: visitId,
      company_name: 'Salesforce',
      company_domain: 'salesforce.com',
      company_city: 'San Francisco',
      company_country: 'US',
      company_type: 'business',
      is_ai_attributed: true,
      ai_source: 'chatgpt',
      confidence_score: 0.92,
      lead_source: 'exa_search',
      enrichment_quality: 'enhanced',
      public_signals_count: 12
    })
    .select()
    .single();
  
  console.log('✅ Lead created');
  
  // Create contact
  const { data: contact } = await supabase
    .from('contacts')
    .insert({
      lead_id: lead.id,
      name: 'Marc Benioff',
      title: 'Chair, CEO & Co-Founder',
      email: 'marc.benioff@salesforce.com',
      linkedin_url: 'https://www.linkedin.com/in/marcbenioff',
      picture_url: 'https://media.licdn.com/dms/image/C4E03AQG1234567890/profile-displayphoto-shrink_400_400/0/1234567890?e=1234567890&v=beta&t=abcdefghijk',
      headline: 'Chair, CEO, and Co-Founder of Salesforce',
      summary: 'Marc Benioff is Chair, CEO, and Co-Founder of Salesforce, a global leader in customer relationship management. Under his leadership, Salesforce has grown from a startup to the #1 CRM company globally.',
      connection_count: 30000,
      last_activity_date: new Date().toISOString(),
      title_match_score: 1.0,
      confidence_score: 0.92,
      email_verification_status: 'verified',
      enrichment_depth: 'enhanced'
    })
    .select()
    .single();
  
  console.log('✅ Contact created');
  
  // Create rich media content
  const mediaContent = [
    // LinkedIn Posts
    {
      contact_id: contact.id,
      media_type: 'linkedin_post',
      title: 'Announcing Salesforce AI Cloud',
      url: 'https://www.linkedin.com/posts/marcbenioff_ai-salesforce-innovation-activity-7123456789',
      description: 'Today we\'re launching Salesforce AI Cloud - bringing trusted, open, and real-time AI to every company. This is the future of business transformation.',
      published_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
    },
    {
      contact_id: contact.id,
      media_type: 'linkedin_post',
      title: 'The Future of Work is AI + Data + CRM',
      url: 'https://www.linkedin.com/posts/marcbenioff_futureofwork-ai-crm-activity-7123456790',
      description: 'We\'re entering a new era where AI, data, and CRM come together to create incredible customer experiences. Here\'s what this means for your business...',
      published_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks ago
    },
    {
      contact_id: contact.id,
      media_type: 'linkedin_post',
      title: 'Dreamforce 2024 Recap',
      url: 'https://www.linkedin.com/posts/marcbenioff_dreamforce-salesforce-community-activity-7123456791',
      description: 'What an incredible Dreamforce! Over 40,000 Trailblazers came together to learn, connect, and give back. Thank you to everyone who made it special.',
      published_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 1 month ago
    },
    
    // Thought Leadership
    {
      contact_id: contact.id,
      media_type: 'article',
      title: 'How AI Will Transform Every Business',
      url: 'https://fortune.com/2024/marc-benioff-ai-transformation',
      description: 'In this exclusive Fortune interview, Marc Benioff discusses how AI is becoming the most important technology shift since the internet.',
      published_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      platform: 'Fortune'
    },
    {
      contact_id: contact.id,
      media_type: 'podcast',
      title: 'The Tim Ferriss Show: Marc Benioff on Building Salesforce',
      url: 'https://tim.blog/2024/marc-benioff-salesforce',
      description: 'Marc shares the story of building Salesforce from a small apartment to a $200B company, and his philosophy on stakeholder capitalism.',
      published_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      platform: 'The Tim Ferriss Show'
    },
    {
      contact_id: contact.id,
      media_type: 'webinar',
      title: 'CEO Keynote: The AI Revolution in Business',
      url: 'https://www.salesforce.com/events/webinars/ai-revolution-keynote',
      description: 'Watch Marc\'s keynote on how AI is revolutionizing customer relationships and what it means for the future of business.',
      published_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      platform: 'Salesforce Events'
    },
    
    // Press Mentions
    {
      contact_id: contact.id,
      media_type: 'news',
      title: 'Salesforce CEO Marc Benioff Announces Major AI Initiative',
      url: 'https://www.wsj.com/tech/salesforce-ai-initiative-benioff',
      description: 'Salesforce is investing $2 billion in AI research and development, CEO Marc Benioff announced at the company\'s annual conference.',
      published_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      platform: 'Wall Street Journal'
    },
    {
      contact_id: contact.id,
      media_type: 'news',
      title: 'Marc Benioff: "AI Must Be Trusted and Ethical"',
      url: 'https://www.nytimes.com/2024/benioff-ai-ethics',
      description: 'In an op-ed, Salesforce CEO calls for responsible AI development and industry-wide ethical standards.',
      published_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      platform: 'New York Times'
    },
    {
      contact_id: contact.id,
      media_type: 'news',
      title: 'Salesforce Stock Hits Record High on AI Growth',
      url: 'https://www.bloomberg.com/salesforce-stock-ai-growth',
      description: 'CEO Marc Benioff\'s AI strategy is paying off as Salesforce reports record revenue growth driven by AI products.',
      published_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      platform: 'Bloomberg'
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
  
  // Create work experience
  const experiences = [
    {
      contact_id: contact.id,
      company_name: 'Salesforce',
      role_title: 'Chair, CEO & Co-Founder',
      start_date: '1999-03-01',
      is_current: true,
      description: 'Leading the global CRM leader and pioneering the SaaS revolution'
    },
    {
      contact_id: contact.id,
      company_name: 'Oracle Corporation',
      role_title: 'Vice President',
      start_date: '1986-01-01',
      end_date: '1999-02-01',
      is_current: false,
      description: 'Led Oracle\'s direct marketing and sales divisions'
    }
  ];
  
  const { error: expError } = await supabase
    .from('contact_experiences')
    .insert(experiences);
  
  if (expError) {
    console.error('Note: contact_experiences table might not exist yet');
  }
  
  console.log('\n🎉 Enhanced lead created successfully!');
  console.log('\nLead Details:');
  console.log(`- Company: ${lead.company_name}`);
  console.log(`- Contact: ${contact.name} (${contact.title})`);
  console.log(`- Email: ${contact.email}`);
  console.log(`- LinkedIn: ${contact.linkedin_url}`);
  console.log(`- Media Content: ${mediaContent.length} items`);
  console.log(`- Attribution: ChatGPT → AI Attribution page`);
  console.log('\n📊 View in dashboard: http://localhost:3000/dashboard/leads');
}

createEnhancedLead().catch(console.error); 