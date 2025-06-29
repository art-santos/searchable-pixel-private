-- Fix pages table schema to support comprehensive audit data storage
-- This adds missing columns needed for proper data storage and retrieval

-- Add rendering mode and SSR penalty columns
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS rendering_mode TEXT CHECK (rendering_mode IN ('SSR', 'CSR', 'HYBRID', 'UNKNOWN'));

ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS ssr_score_penalty INTEGER DEFAULT 0;

ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS weighted_aeo_score INTEGER;

-- Ensure analysis_metadata JSONB column exists for storing comprehensive data
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_rendering_mode ON pages(rendering_mode);
CREATE INDEX IF NOT EXISTS idx_pages_weighted_aeo_score ON pages(weighted_aeo_score);

-- Update existing records to have proper defaults
UPDATE pages 
SET 
  rendering_mode = 'UNKNOWN',
  ssr_score_penalty = 0,
  weighted_aeo_score = COALESCE(aeo_score, 0),
  analysis_metadata = COALESCE(analysis_metadata, '{}')
WHERE 
  rendering_mode IS NULL 
  OR ssr_score_penalty IS NULL 
  OR weighted_aeo_score IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN pages.rendering_mode IS 'Detected rendering mode: SSR (server-side), CSR (client-side), HYBRID, or UNKNOWN';
COMMENT ON COLUMN pages.ssr_score_penalty IS 'Score penalty applied for non-SSR pages (0-20 points)';
COMMENT ON COLUMN pages.weighted_aeo_score IS 'Business-weighted AEO score (may differ from simple average)';
COMMENT ON COLUMN pages.analysis_metadata IS 'Comprehensive metadata including EEAT data, link analysis, image data, SSR analysis, etc.';

-- Ensure page_issues has enhanced columns for diagnostics
ALTER TABLE page_issues 
ADD COLUMN IF NOT EXISTS diagnostic TEXT;

ALTER TABLE page_issues 
ADD COLUMN IF NOT EXISTS html_snippet TEXT;

ALTER TABLE page_issues 
ADD COLUMN IF NOT EXISTS rule_parameters JSONB;

-- Add comments for issue diagnostics
COMMENT ON COLUMN page_issues.diagnostic IS 'AI-generated 1-2 sentence explanation and fix for the issue';
COMMENT ON COLUMN page_issues.html_snippet IS 'Raw HTML snippet where the issue was detected';
COMMENT ON COLUMN page_issues.rule_parameters IS 'Parameters used in the rule check (e.g., title length, word count)';

-- Ensure we have the audit overview table for performance
CREATE TABLE IF NOT EXISTS page_audit_overview (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE UNIQUE,
  aeo_score INTEGER,
  weighted_aeo_score INTEGER,
  rendering_mode TEXT,
  ssr_score_penalty INTEGER,
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  warning_issues INTEGER DEFAULT 0,
  total_recommendations INTEGER DEFAULT 0,
  checklist_items_evaluated INTEGER DEFAULT 0,
  checklist_items_passed INTEGER DEFAULT 0,
  total_possible_points DECIMAL DEFAULT 0,
  earned_points DECIMAL DEFAULT 0,
  category_scores JSONB,
  analysis_metadata JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_audit_overview_page_id ON page_audit_overview(page_id);

-- Output completion message
DO $$
BEGIN
  RAISE NOTICE 'Pages table schema updated successfully with comprehensive audit support';
  RAISE NOTICE 'Added columns: rendering_mode, ssr_score_penalty, weighted_aeo_score';
  RAISE NOTICE 'Enhanced analysis_metadata JSONB storage for EEAT data, link analysis, and SSR detection';
  RAISE NOTICE 'Updated page_issues table with diagnostic columns';
END $$; 