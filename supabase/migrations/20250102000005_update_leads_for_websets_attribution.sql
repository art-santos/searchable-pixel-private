-- Update user_visits table for attribution tracking
ALTER TABLE user_visits ADD COLUMN IF NOT EXISTS attribution_source text; -- 'google', 'chatgpt', 'perplexity', 'claude', 'direct', etc
ALTER TABLE user_visits ADD COLUMN IF NOT EXISTS session_duration integer; -- in seconds
ALTER TABLE user_visits ADD COLUMN IF NOT EXISTS pages_viewed integer DEFAULT 1;

-- Update leads table for websets integration
ALTER TABLE leads ADD COLUMN IF NOT EXISTS exa_webset_id text; -- Webset ID from Exa
ALTER TABLE leads ADD COLUMN IF NOT EXISTS exa_raw jsonb; -- Raw Exa response
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'legacy'; -- 'legacy', 'websets'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS confidence_score decimal(3,2) DEFAULT 0.0; -- 0.00 to 1.00

-- Update contacts table for enhanced websets data
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS picture_url text; -- LinkedIn profile image
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS headline text; -- LinkedIn headline
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS summary text; -- LinkedIn summary
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS current_company text; -- Current company from LinkedIn
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS current_position text; -- Current role from LinkedIn
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenure_months integer; -- How long at current company
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS skills text[]; -- Array of skills
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS education text[]; -- Array of education entries
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS social_handles jsonb; -- {twitter: "handle", github: "handle"}
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS thought_leadership_score decimal(3,2) DEFAULT 0.0; -- 0.00 to 1.00
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS interests text[]; -- Array of interests
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS volunteer_work text[]; -- Array of volunteer work
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS connection_count integer; -- LinkedIn connection count
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_activity_date timestamptz; -- Last LinkedIn activity
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS exa_enrichment jsonb; -- Raw enrichment data from Exa

-- Create contact_media table for rich media content
CREATE TABLE IF NOT EXISTS contact_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  
  media_type text NOT NULL, -- 'article', 'podcast', 'video', 'post', 'patent', 'press'
  title text NOT NULL,
  url text NOT NULL,
  description text,
  published_date timestamptz,
  platform text, -- 'linkedin', 'twitter', 'medium', 'youtube', etc
  engagement_metrics jsonb, -- {views: 1000, likes: 50, shares: 10}
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(contact_id, url) -- Prevent duplicates
);

-- Create contact_experiences table for work history
CREATE TABLE IF NOT EXISTS contact_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  
  company_name text NOT NULL,
  role_title text NOT NULL,
  start_date date,
  end_date date, -- NULL if current
  is_current boolean DEFAULT false,
  description text,
  location text,
  
  created_at timestamptz DEFAULT now()
);

-- Create contact_education table for education history
CREATE TABLE IF NOT EXISTS contact_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  
  institution_name text NOT NULL,
  degree text,
  field_of_study text,
  start_year integer,
  end_year integer,
  description text,
  
  created_at timestamptz DEFAULT now()
);

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS user_visits_attribution_source_idx ON user_visits(attribution_source) WHERE attribution_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_lead_source_idx ON leads(lead_source);
CREATE INDEX IF NOT EXISTS leads_confidence_score_idx ON leads(confidence_score DESC);
CREATE INDEX IF NOT EXISTS leads_exa_webset_id_idx ON leads(exa_webset_id) WHERE exa_webset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS contacts_picture_url_idx ON contacts(picture_url) WHERE picture_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS contacts_current_company_idx ON contacts(current_company);
CREATE INDEX IF NOT EXISTS contacts_thought_leadership_score_idx ON contacts(thought_leadership_score DESC);

CREATE INDEX IF NOT EXISTS contact_media_contact_id_idx ON contact_media(contact_id);
CREATE INDEX IF NOT EXISTS contact_media_media_type_idx ON contact_media(media_type);
CREATE INDEX IF NOT EXISTS contact_media_published_date_idx ON contact_media(published_date DESC);

CREATE INDEX IF NOT EXISTS contact_experiences_contact_id_idx ON contact_experiences(contact_id);
CREATE INDEX IF NOT EXISTS contact_experiences_is_current_idx ON contact_experiences(is_current) WHERE is_current = true;

CREATE INDEX IF NOT EXISTS contact_education_contact_id_idx ON contact_education(contact_id);

-- Enable RLS for new tables
ALTER TABLE contact_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_education ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can access contact media from their workspaces" ON contact_media
  FOR ALL USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN leads l ON c.lead_id = l.id
      JOIN team_members tm ON l.workspace_id = tm.workspace_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access contact experiences from their workspaces" ON contact_experiences
  FOR ALL USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN leads l ON c.lead_id = l.id
      JOIN team_members tm ON l.workspace_id = tm.workspace_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access contact education from their workspaces" ON contact_education
  FOR ALL USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN leads l ON c.lead_id = l.id
      JOIN team_members tm ON l.workspace_id = tm.workspace_id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Update lead_enrichment_settings for attribution tracking
ALTER TABLE lead_enrichment_settings ADD COLUMN IF NOT EXISTS track_attribution_sources text[] DEFAULT ARRAY['google', 'chatgpt', 'perplexity', 'claude'];
ALTER TABLE lead_enrichment_settings ADD COLUMN IF NOT EXISTS min_confidence_score decimal(3,2) DEFAULT 0.6; -- Minimum confidence to create lead 