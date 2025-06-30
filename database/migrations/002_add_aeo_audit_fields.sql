-- Add AEO audit fields to project_urls table
-- Migration: 002_add_aeo_audit_fields.sql

-- Add new columns for comprehensive AEO audit data
ALTER TABLE project_urls ADD COLUMN IF NOT EXISTS render_mode TEXT;
ALTER TABLE project_urls ADD COLUMN IF NOT EXISTS semantic_url_quality TEXT;
ALTER TABLE project_urls ADD COLUMN IF NOT EXISTS meta_description_feedback TEXT;
ALTER TABLE project_urls ADD COLUMN IF NOT EXISTS passage_slicing TEXT;
ALTER TABLE project_urls ADD COLUMN IF NOT EXISTS corporate_jargon_flags TEXT;
ALTER TABLE project_urls ADD COLUMN IF NOT EXISTS schema_suggestions TEXT;
ALTER TABLE project_urls ADD COLUMN IF NOT EXISTS recency_signal TEXT;
ALTER TABLE project_urls ADD COLUMN IF NOT EXISTS micro_niche_specificity TEXT;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_project_urls_render_mode ON project_urls(render_mode);
CREATE INDEX IF NOT EXISTS idx_project_urls_page_summary ON project_urls USING gin(to_tsvector('english', page_summary));
CREATE INDEX IF NOT EXISTS idx_project_urls_content_recs ON project_urls USING gin(to_tsvector('english', content_recommendations));

-- Update existing NULL values to indicate they need analysis
UPDATE project_urls 
SET render_mode = 'UNKNOWN' 
WHERE render_mode IS NULL AND status = 'analyzed';

COMMENT ON COLUMN project_urls.render_mode IS 'SSR, CSR-JS, or STATIC rendering mode detected by AEO audit';
COMMENT ON COLUMN project_urls.semantic_url_quality IS 'URL structure quality assessment from AEO audit';
COMMENT ON COLUMN project_urls.meta_description_feedback IS 'AI feedback on meta description quality';
COMMENT ON COLUMN project_urls.passage_slicing IS 'Examples of strong/weak content sections';
COMMENT ON COLUMN project_urls.corporate_jargon_flags IS 'Detected corporate jargon phrases';
COMMENT ON COLUMN project_urls.schema_suggestions IS 'Recommended schema types to add';
COMMENT ON COLUMN project_urls.recency_signal IS 'Detected recency/freshness signals';
COMMENT ON COLUMN project_urls.micro_niche_specificity IS 'Assessment of content specificity for user needs'; 