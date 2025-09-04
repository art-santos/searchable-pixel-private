const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function addMissingColumns() {
  try {
    await client.connect()
    console.log('Connected to database')

    console.log('=== Adding missing columns to user_visits ===')
    
    // Add device info to user_visits
    await client.query(`
      ALTER TABLE user_visits 
      ADD COLUMN IF NOT EXISTS device_type text, -- 'desktop', 'mobile', 'tablet'
      ADD COLUMN IF NOT EXISTS device_info jsonb, -- detailed device info
      ADD COLUMN IF NOT EXISTS session_id text; -- cookie-based session tracking
    `)
    console.log('✅ Added device_type, device_info, session_id to user_visits')

    // Create index for session tracking
    await client.query(`
      CREATE INDEX IF NOT EXISTS user_visits_session_id_idx ON user_visits(session_id);
    `)

    console.log('=== Adding missing columns to crawler_visits ===')
    
    // First, let's see what crawler_visits currently looks like and add missing essential columns
    await client.query(`
      ALTER TABLE crawler_visits 
      ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS crawler_company text,
      ADD COLUMN IF NOT EXISTS crawler_category text,
      ADD COLUMN IF NOT EXISTS user_agent text,
      ADD COLUMN IF NOT EXISTS status_code integer,
      ADD COLUMN IF NOT EXISTS response_time_ms integer,
      ADD COLUMN IF NOT EXISTS country text,
      ADD COLUMN IF NOT EXISTS device_type text, -- 'desktop', 'mobile', 'tablet'  
      ADD COLUMN IF NOT EXISTS device_info jsonb, -- detailed device info
      ADD COLUMN IF NOT EXISTS session_id text, -- cookie-based session tracking
      ADD COLUMN IF NOT EXISTS referrer text, -- referring page/platform
      ADD COLUMN IF NOT EXISTS llm_referral_source text, -- specific LLM platform (chatgpt, claude, perplexity, etc)
      ADD COLUMN IF NOT EXISTS metadata jsonb, -- additional metadata
      ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
    `)
    console.log('✅ Added comprehensive columns to crawler_visits')

    // Add indexes for crawler_visits
    await client.query(`
      CREATE INDEX IF NOT EXISTS crawler_visits_session_id_idx ON crawler_visits(session_id);
      CREATE INDEX IF NOT EXISTS crawler_visits_device_type_idx ON crawler_visits(device_type);
      CREATE INDEX IF NOT EXISTS crawler_visits_llm_referral_source_idx ON crawler_visits(llm_referral_source);
      CREATE INDEX IF NOT EXISTS crawler_visits_referrer_idx ON crawler_visits(referrer);
      CREATE INDEX IF NOT EXISTS crawler_visits_user_id_idx ON crawler_visits(user_id);
      CREATE INDEX IF NOT EXISTS crawler_visits_created_at_idx ON crawler_visits(created_at DESC);
    `)
    console.log('✅ Created indexes for new columns')

    // Add device info index to user_visits 
    await client.query(`
      CREATE INDEX IF NOT EXISTS user_visits_device_type_idx ON user_visits(device_type);
    `)

    // Let's also make sure the timestamp in crawler_visits is properly timestamptz
    await client.query(`
      ALTER TABLE crawler_visits 
      ALTER COLUMN timestamp TYPE timestamptz USING timestamp AT TIME ZONE 'UTC';
    `)
    console.log('✅ Updated timestamp column to timestamptz')

    console.log('=== Enhanced user_visits for better LLM referral tracking ===')
    
    // Add specific LLM referral source to user_visits too for consistency
    await client.query(`
      ALTER TABLE user_visits 
      ADD COLUMN IF NOT EXISTS llm_referral_source text; -- specific LLM platform
    `)
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS user_visits_llm_referral_source_idx ON user_visits(llm_referral_source);
    `)
    console.log('✅ Added LLM referral source to user_visits')

    console.log('🎉 All missing columns added successfully!')
    
    // Show updated schemas
    console.log('\n=== UPDATED SCHEMAS ===')
    
    console.log('\nCRAWLER_VISITS columns:')
    const crawlerCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'crawler_visits' 
      ORDER BY ordinal_position;
    `)
    crawlerCols.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`))

    console.log('\nUSER_VISITS columns:')
    const userCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_visits' 
      ORDER BY ordinal_position;
    `)
    userCols.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`))

  } catch (error) {
    console.error('Error adding columns:', error)
  } finally {
    await client.end()
  }
}

addMissingColumns()