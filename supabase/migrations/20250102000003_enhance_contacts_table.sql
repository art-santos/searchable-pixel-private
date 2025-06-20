-- Add enhanced fields to contacts table
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS tenure_months integer,
  ADD COLUMN IF NOT EXISTS highest_degree text,
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS twitter_handle text,
  ADD COLUMN IF NOT EXISTS github_handle text,
  ADD COLUMN IF NOT EXISTS thought_leadership_score float DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interests text[],
  ADD COLUMN IF NOT EXISTS volunteer text,
  ADD COLUMN IF NOT EXISTS connection_count integer,
  ADD COLUMN IF NOT EXISTS last_activity_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS enrichment_depth text DEFAULT 'basic' CHECK (enrichment_depth IN ('basic', 'enhanced', 'full'));

-- Create table for storing public signals (media mentions, talks, etc)
CREATE TABLE IF NOT EXISTS contact_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('podcast', 'talk', 'interview', 'blog', 'news', 'patent', 'webinar')),
  title text NOT NULL,
  url text NOT NULL,
  publication text,
  published_at date,
  snippet text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for contact experiences (work history)
CREATE TABLE IF NOT EXISTS contact_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  duration_months integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for contact education
CREATE TABLE IF NOT EXISTS contact_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  degree text,
  school text NOT NULL,
  field_of_study text,
  graduation_year integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_media_contact_id ON contact_media(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_media_type ON contact_media(media_type);
CREATE INDEX IF NOT EXISTS idx_contact_experiences_contact_id ON contact_experiences(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_education_contact_id ON contact_education(contact_id);

-- Update leads table to track enrichment quality
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS enrichment_quality text DEFAULT 'basic' CHECK (enrichment_quality IN ('basic', 'enhanced', 'full')),
  ADD COLUMN IF NOT EXISTS public_signals_count integer DEFAULT 0;

-- Add RLS policies
ALTER TABLE contact_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_education ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view contact media for their workspace leads" ON contact_media;
    DROP POLICY IF EXISTS "Users can view contact experiences for their workspace leads" ON contact_experiences;
    DROP POLICY IF EXISTS "Users can view contact education for their workspace leads" ON contact_education;
END $$;

-- RLS policies for contact_media
CREATE POLICY "Users can view contact media for their workspace leads"
  ON contact_media FOR SELECT
  USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN leads l ON c.lead_id = l.id
      WHERE l.workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

-- RLS policies for contact_experiences
CREATE POLICY "Users can view contact experiences for their workspace leads"
  ON contact_experiences FOR SELECT
  USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN leads l ON c.lead_id = l.id
      WHERE l.workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

-- RLS policies for contact_education
CREATE POLICY "Users can view contact education for their workspace leads"
  ON contact_education FOR SELECT
  USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN leads l ON c.lead_id = l.id
      WHERE l.workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  ); 