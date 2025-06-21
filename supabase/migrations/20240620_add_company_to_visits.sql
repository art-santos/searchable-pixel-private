-- Add company information columns to user_visits
ALTER TABLE user_visits 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_domain TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_visits_company_name ON user_visits(company_name);
CREATE INDEX IF NOT EXISTS idx_user_visits_company_domain ON user_visits(company_domain);
CREATE INDEX IF NOT EXISTS idx_user_visits_enrichment_status ON user_visits(enrichment_status); 