-- Create user_visits table (for human visitors, not AI crawlers)
CREATE TABLE user_visits (
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
  enrichment_status text DEFAULT 'pending', -- 'pending', 'enriched', 'skipped', 'failed'
  enrichment_attempted_at timestamptz,
  enrichment_cost_cents integer DEFAULT 0,
  
  -- Geographic data (from IP)
  country text,
  city text,
  region text,
  
  created_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE leads (
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
  ai_source text, -- 'chatgpt', 'perplexity', 'claude', etc
  
  -- Enrichment meta
  exa_query text,
  enrichment_cost_cents integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table (one-to-one with leads for MVP)
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Contact details
  name text NOT NULL,
  title text NOT NULL,
  email text NOT NULL,
  linkedin_url text,
  location text,
  
  -- Enrichment quality
  title_match_score decimal(3,2) DEFAULT 0.0, -- 0.00 to 1.00
  email_verification_status text DEFAULT 'unknown', -- 'verified', 'invalid', 'unknown'
  email_verification_reason text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(lead_id) -- One contact per lead for MVP
);

-- Create public signals table (for future use)
CREATE TABLE public_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Signal data
  title text NOT NULL,
  url text NOT NULL,
  snippet text,
  published_date timestamptz,
  source text, -- 'blog', 'podcast', 'news', etc
  
  created_at timestamptz DEFAULT now()
);

-- Workspace settings for lead enrichment
CREATE TABLE lead_enrichment_settings (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  
  is_enabled boolean DEFAULT false,
  target_titles text[] DEFAULT ARRAY['CEO', 'CFO', 'Chief Executive Officer', 'Chief Financial Officer'], -- Job titles to search
  daily_spend_limit_cents integer DEFAULT 800, -- $8/day default
  
  -- Email patterns to try for this workspace's domain
  email_patterns text[] DEFAULT ARRAY['first.last', 'first', 'flast', 'last', 'firstlast'],
  
  -- Webhooks
  webhook_url text,
  webhook_secret text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Track daily spend per workspace
CREATE TABLE lead_enrichment_usage (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  date date NOT NULL,
  
  enrichment_attempts integer DEFAULT 0,
  enrichment_successes integer DEFAULT 0,
  total_cost_cents integer DEFAULT 0,
  
  PRIMARY KEY (workspace_id, date)
);

-- Indexes for user_visits
CREATE INDEX user_visits_workspace_id_idx ON user_visits(workspace_id);
CREATE INDEX user_visits_ip_address_idx ON user_visits(ip_address);
CREATE INDEX user_visits_enrichment_status_idx ON user_visits(enrichment_status) WHERE enrichment_status = 'pending';
CREATE INDEX user_visits_utm_source_idx ON user_visits(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX user_visits_created_at_idx ON user_visits(created_at DESC);

-- Create indexes for performance
CREATE INDEX leads_workspace_id_idx ON leads(workspace_id);
CREATE INDEX leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX leads_company_name_idx ON leads(company_name);
CREATE INDEX leads_ai_attributed_idx ON leads(is_ai_attributed) WHERE is_ai_attributed = true;

CREATE INDEX contacts_lead_id_idx ON contacts(lead_id);
CREATE INDEX contacts_email_idx ON contacts(email);
CREATE INDEX contacts_title_match_score_idx ON contacts(title_match_score DESC);

CREATE INDEX public_signals_lead_id_idx ON public_signals(lead_id);



-- Enable RLS (Row Level Security)
ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_enrichment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_enrichment_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies (workspace-based access)
CREATE POLICY "Users can access user visits from their workspaces" ON user_visits
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access leads from their workspaces" ON leads
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access contacts from their workspaces" ON contacts
  FOR ALL USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN team_members tm ON l.workspace_id = tm.workspace_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access public signals from their workspaces" ON public_signals
  FOR ALL USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN team_members tm ON l.workspace_id = tm.workspace_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access enrichment settings from their workspaces" ON lead_enrichment_settings
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access enrichment usage from their workspaces" ON lead_enrichment_usage
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Insert default settings for existing workspaces
INSERT INTO lead_enrichment_settings (workspace_id, is_enabled)
SELECT id, false FROM workspaces
ON CONFLICT (workspace_id) DO NOTHING; 