const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function createSampleData() {
  try {
    await client.connect()
    console.log('Connected to database')

    // First, get a workspace ID to use
    const workspaceResult = await client.query('SELECT id, user_id FROM workspaces LIMIT 1')
    if (workspaceResult.rows.length === 0) {
      console.log('❌ No workspaces found. Please create a workspace first.')
      return
    }
    
    const workspace = workspaceResult.rows[0]
    console.log('Using workspace:', workspace.id)

    // Create sample user visits
    const userVisitId1 = await client.query(`
      INSERT INTO user_visits (
        workspace_id, 
        ip_address, 
        user_agent, 
        page_url, 
        referrer,
        utm_source,
        utm_campaign,
        country,
        city
      ) VALUES (
        $1, 
        '192.168.1.100', 
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
        '/pricing',
        'https://chat.openai.com/',
        'chatgpt',
        'ai-referral',
        'US',
        'San Francisco'
      ) RETURNING id
    `, [workspace.id])

    const userVisitId2 = await client.query(`
      INSERT INTO user_visits (
        workspace_id, 
        ip_address, 
        user_agent, 
        page_url, 
        referrer,
        utm_source,
        utm_campaign,
        country,
        city
      ) VALUES (
        $1, 
        '192.168.1.101', 
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 
        '/features',
        'https://perplexity.ai/',
        'perplexity',
        'ai-search',
        'US',
        'New York'
      ) RETURNING id
    `, [workspace.id])

    console.log('✅ Created sample user visits')

    // Create sample leads
    const leadId1 = await client.query(`
      INSERT INTO leads (
        workspace_id,
        user_visit_id,
        company_name,
        company_domain,
        company_type,
        company_city,
        company_country,
        employee_range,
        is_ai_attributed,
        ai_source
      ) VALUES (
        $1,
        $2,
        'Acme Corp',
        'acme.com',
        'Technology',
        'San Francisco',
        'United States',
        '100-500',
        true,
        'chatgpt'
      ) RETURNING id
    `, [workspace.id, userVisitId1.rows[0].id])

    const leadId2 = await client.query(`
      INSERT INTO leads (
        workspace_id,
        user_visit_id,
        company_name,
        company_domain,
        company_type,
        company_city,
        company_country,
        employee_range,
        is_ai_attributed,
        ai_source
      ) VALUES (
        $1,
        $2,
        'TechStart Inc',
        'techstart.com',
        'Software',
        'New York',
        'United States',
        '50-100',
        true,
        'perplexity'
      ) RETURNING id
    `, [workspace.id, userVisitId2.rows[0].id])

    console.log('✅ Created sample leads')

    // Create sample contacts
    await client.query(`
      INSERT INTO contacts (
        lead_id,
        name,
        title,
        email,
        linkedin_url,
        location,
        title_match_score,
        email_verification_status
      ) VALUES (
        $1,
        'John Smith',
        'CEO',
        'john.smith@acme.com',
        'https://linkedin.com/in/johnsmith',
        'San Francisco, CA',
        0.95,
        'verified'
      )
    `, [leadId1.rows[0].id])

    await client.query(`
      INSERT INTO contacts (
        lead_id,
        name,
        title,
        email,
        linkedin_url,
        location,
        title_match_score,
        email_verification_status
      ) VALUES (
        $1,
        'Sarah Johnson',
        'CTO',
        'sarah.johnson@techstart.com',
        'https://linkedin.com/in/sarahjohnson',
        'New York, NY',
        0.88,
        'verified'
      )
    `, [leadId2.rows[0].id])

    console.log('✅ Created sample contacts')
    console.log('🎉 Sample data created successfully!')
    console.log('Workspace ID for testing:', workspace.id)

  } catch (error) {
    console.error('Error creating sample data:', error)
  } finally {
    await client.end()
  }
}

createSampleData()