-- Add Websets support to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS exa_webset_id text,
  ADD COLUMN IF NOT EXISTS exa_raw jsonb,
  ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'legacy' CHECK (lead_source IN ('legacy', 'exa_search', 'exa_webset'));

-- Add confidence score to contacts table
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ADD COLUMN IF NOT EXISTS picture_url text,
  ADD COLUMN IF NOT EXISTS exa_enrichment jsonb;

-- Create index on webset_id for debugging
CREATE INDEX IF NOT EXISTS idx_leads_exa_webset_id ON leads(exa_webset_id) WHERE exa_webset_id IS NOT NULL;

-- Create index on lead_source for analytics
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(lead_source);

-- Create index on confidence_score for ranking
CREATE INDEX IF NOT EXISTS idx_contacts_confidence_score ON contacts(confidence_score DESC) WHERE confidence_score IS NOT NULL;

-- Update default lead source for new records
ALTER TABLE leads ALTER COLUMN lead_source SET DEFAULT 'exa_webset'; 