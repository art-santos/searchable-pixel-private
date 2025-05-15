-- This migration updates the schema for the site audit feature to support enhanced Firecrawl capabilities

-- Update the crawls table with new fields
ALTER TABLE crawls
ADD COLUMN IF NOT EXISTS document_percentage SMALLINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS schema_percentage SMALLINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS llms_coverage SMALLINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS media_accessibility_score SMALLINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS include_documents BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS check_media_accessibility BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS perform_interactive_actions BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_purpose TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT NULL, 
ADD COLUMN IF NOT EXISTS key_features TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS primary_services TEXT DEFAULT NULL;

-- Update the pages table with new fields
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS is_document BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS media_count SMALLINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS media_accessibility_score SMALLINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS schema_types TEXT[] DEFAULT NULL;

-- Update the issues table with fix suggestions
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS fix_suggestion TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS resource_url TEXT DEFAULT NULL;

-- Create screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crawl_id UUID NOT NULL REFERENCES crawls(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_implemented BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pages_crawl_id ON pages(crawl_id);
CREATE INDEX IF NOT EXISTS idx_issues_page_id ON issues(page_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_page_id ON recommendations(page_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_crawl_id ON screenshots(crawl_id);
CREATE INDEX IF NOT EXISTS idx_crawls_status ON crawls(status);

-- Create a view for site audit summary
CREATE OR REPLACE VIEW site_audit_summary AS
SELECT 
  c.id as crawl_id,
  c.site_id,
  c.status,
  c.aeo_score,
  c.total_pages,
  c.document_percentage,
  c.schema_percentage,
  c.llms_coverage,
  c.media_accessibility_score,
  c.started_at,
  c.completed_at,
  s.domain,
  COUNT(DISTINCT p.id) AS pages_count,
  COUNT(DISTINCT i.id) AS issues_count,
  SUM(CASE WHEN i.severity = 'high' THEN 1 ELSE 0 END) AS critical_issues_count,
  SUM(CASE WHEN i.severity = 'medium' THEN 1 ELSE 0 END) AS warning_issues_count,
  SUM(CASE WHEN i.severity = 'low' THEN 1 ELSE 0 END) AS info_issues_count
FROM 
  crawls c
JOIN 
  sites s ON c.site_id = s.id
LEFT JOIN 
  pages p ON c.id = p.crawl_id
LEFT JOIN 
  issues i ON p.id = i.page_id
GROUP BY 
  c.id, s.domain; 