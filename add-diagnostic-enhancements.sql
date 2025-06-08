-- Add diagnostic columns to store AI-generated explanations for each issue
ALTER TABLE page_issues 
ADD COLUMN diagnostic TEXT;

ALTER TABLE page_issues 
ADD COLUMN html_snippet TEXT;

ALTER TABLE page_issues 
ADD COLUMN rule_parameters JSONB;

-- Add rendering mode detection to pages table
ALTER TABLE pages
ADD COLUMN rendering_mode TEXT CHECK (rendering_mode IN ('SSR', 'CSR', 'HYBRID'));

ALTER TABLE pages
ADD COLUMN ssr_score_penalty INTEGER DEFAULT 0;

ALTER TABLE pages
ADD COLUMN weighted_aeo_score INTEGER;

-- Add comment for clarity
COMMENT ON COLUMN page_issues.diagnostic IS 'AI-generated 1-2 sentence explanation and fix for the issue';
COMMENT ON COLUMN page_issues.html_snippet IS 'Raw HTML snippet where the issue was detected';
COMMENT ON COLUMN page_issues.rule_parameters IS 'Parameters used in the rule check (e.g., title length, word count)';
COMMENT ON COLUMN pages.rendering_mode IS 'Detected rendering mode: SSR (server-side), CSR (client-side), or HYBRID';
COMMENT ON COLUMN pages.ssr_score_penalty IS 'Score penalty applied for non-SSR pages (0-20 points)';
COMMENT ON COLUMN pages.weighted_aeo_score IS 'Business-weighted AEO score (may differ from simple average)';

-- Drop existing view to avoid column name conflicts
DROP VIEW IF EXISTS page_audit_overview;

-- Create the enhanced audit summary view with new fields
CREATE VIEW page_audit_overview AS
SELECT 
  p.id,
  p.url,
  p.domain,
  p.title,
  p.aeo_score,
  p.weighted_aeo_score,
  p.rendering_mode,
  p.ssr_score_penalty,
  p.word_count,
  p.analyzed_at,
  COUNT(DISTINCT pi.id) as total_issues,
  COUNT(DISTINCT CASE WHEN pi.severity = 'critical' THEN pi.id END) as critical_issues,
  COUNT(DISTINCT CASE WHEN pi.severity = 'warning' THEN pi.id END) as warning_issues,
  COUNT(DISTINCT pr.id) as total_recommendations,
  COUNT(DISTINCT CASE WHEN pr.effort_level = 'low' THEN pr.id END) as quick_wins,
  ARRAY_AGG(DISTINCT pi.category) FILTER (WHERE pi.id IS NOT NULL) as issue_categories,
  AVG(pr.priority_score) as avg_recommendation_priority
FROM pages p
LEFT JOIN page_issues pi ON p.id = pi.page_id
LEFT JOIN page_recommendations pr ON p.id = pr.page_id
GROUP BY p.id, p.url, p.domain, p.title, p.aeo_score, p.weighted_aeo_score, 
         p.rendering_mode, p.ssr_score_penalty, p.word_count, p.analyzed_at;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_issues_diagnostic ON page_issues(diagnostic) WHERE diagnostic IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pages_rendering_mode ON pages(rendering_mode);
CREATE INDEX IF NOT EXISTS idx_pages_weighted_score ON pages(weighted_aeo_score DESC); 