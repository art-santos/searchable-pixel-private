const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function createTables() {
  try {
    await client.connect()
    console.log('Connected to database')

    // Create user_visits table
    console.log('Creating user_visits table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_visits (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        
        -- Visit details
        ip_address inet NOT NULL,
        user_agent text,
        page_url text NOT NULL,
        referrer text,
        
        -- UTM tracking for AI attribution
        utm_source text,
        utm_medium text,
        utm_campaign text,
        utm_content text,
        utm_term text,
        
        -- Enrichment tracking
        enrichment_status text DEFAULT 'pending',
        enrichment_attempted_at timestamptz,
        enrichment_cost_cents integer DEFAULT 0,
        
        -- Geographic data (from IP)
        country text,
        city text,
        region text,
        
        created_at timestamptz DEFAULT now()
      );
    `)
    console.log('✅ Created user_visits table')

    // Create leads table
    console.log('Creating leads table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_visit_id uuid REFERENCES user_visits(id) ON DELETE SET NULL,
        
        -- Company data from IPInfo
        company_name text NOT NULL,
        company_domain text,
        company_type text,
        company_city text,
        company_country text,
        employee_range text,
        
        -- Attribution
        is_ai_attributed boolean DEFAULT false,
        ai_source text,
        
        -- Enrichment meta
        exa_query text,
        enrichment_cost_cents integer DEFAULT 0,
        
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `)
    console.log('✅ Created leads table')

    // Create contacts table
    console.log('Creating contacts table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        
        -- Contact details
        name text NOT NULL,
        title text NOT NULL,
        email text NOT NULL,
        linkedin_url text,
        location text,
        
        -- Enrichment quality
        title_match_score decimal(3,2) DEFAULT 0.0,
        email_verification_status text DEFAULT 'unknown',
        email_verification_reason text,
        
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        
        UNIQUE(lead_id)
      );
    `)
    console.log('✅ Created contacts table')

    // Create indexes
    console.log('Creating indexes...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS user_visits_workspace_id_idx ON user_visits(workspace_id);
      CREATE INDEX IF NOT EXISTS user_visits_created_at_idx ON user_visits(created_at DESC);
      CREATE INDEX IF NOT EXISTS leads_workspace_id_idx ON leads(workspace_id);
      CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS contacts_lead_id_idx ON contacts(lead_id);
      CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
    `)
    console.log('✅ Created indexes')

    // Enable RLS
    console.log('Enabling RLS...')
    await client.query(`
      ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;
      ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
      ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    `)
    console.log('✅ Enabled RLS')

    // Create RLS policies
    console.log('Creating RLS policies...')
    await client.query(`
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can access user visits from their workspaces" ON user_visits;
      DROP POLICY IF EXISTS "Users can access leads from their workspaces" ON leads;
      DROP POLICY IF EXISTS "Users can access contacts from their workspaces" ON contacts;
    `)

    await client.query(`
      -- Create new policies based on workspace ownership
      CREATE POLICY "Users can access user visits from their workspaces" ON user_visits
        FOR ALL USING (
          workspace_id IN (
            SELECT id FROM workspaces 
            WHERE user_id = auth.uid()
          )
        );
    `)

    await client.query(`
      CREATE POLICY "Users can access leads from their workspaces" ON leads
        FOR ALL USING (
          workspace_id IN (
            SELECT id FROM workspaces 
            WHERE user_id = auth.uid()
          )
        );
    `)

    await client.query(`
      CREATE POLICY "Users can access contacts from their workspaces" ON contacts
        FOR ALL USING (
          lead_id IN (
            SELECT l.id FROM leads l
            JOIN workspaces w ON l.workspace_id = w.id
            WHERE w.user_id = auth.uid()
          )
        );
    `)
    console.log('✅ Created RLS policies')

    console.log('🎉 All tables created successfully!')
    return true
  } catch (error) {
    console.error('Error creating tables:', error)
    return false
  } finally {
    await client.end()
  }
}

createTables()