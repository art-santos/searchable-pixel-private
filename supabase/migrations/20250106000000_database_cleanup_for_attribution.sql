-- Database Cleanup for AI Crawler Attribution System
-- This migration removes old visibility/content systems and enhances crawler tracking for attribution

-- =============================================================================
-- STEP 1: DROP OLD VISIBILITY SYSTEM TABLES
-- =============================================================================

-- Drop old MAX visibility tables in correct order (dependencies first)
DROP TABLE IF EXISTS max_visibility_metrics CASCADE;
DROP TABLE IF EXISTS max_visibility_topics CASCADE;  
DROP TABLE IF EXISTS max_visibility_competitors CASCADE;
DROP TABLE IF EXISTS max_visibility_citations CASCADE;
DROP TABLE IF EXISTS max_visibility_responses CASCADE;
DROP TABLE IF EXISTS max_visibility_questions CASCADE;
DROP TABLE IF EXISTS max_visibility_runs CASCADE;

-- Drop old visibility custom types
DROP TYPE IF EXISTS max_question_type CASCADE;
DROP TYPE IF EXISTS mention_position_enum CASCADE;
DROP TYPE IF EXISTS sentiment_enum CASCADE;
DROP TYPE IF EXISTS citation_bucket_enum CASCADE;

-- Drop old visibility views and functions
DROP VIEW IF EXISTS max_visibility_run_summary CASCADE;

-- =============================================================================
-- STEP 2: DROP OLD CONTENT GENERATION TABLES
-- =============================================================================

-- Drop knowledge base tables
DROP TABLE IF EXISTS knowledge_base_items CASCADE;

-- Drop content generation tables (if they exist)
DROP TABLE IF EXISTS content_articles CASCADE;
DROP TABLE IF EXISTS generated_content CASCADE;

-- =============================================================================
-- STEP 3: DROP SITE AUDIT TABLES (NOT NEEDED FOR ATTRIBUTION)
-- =============================================================================

-- Drop site audit tables in dependency order
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS screenshots CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS crawls CASCADE;
DROP TABLE IF EXISTS sites CASCADE;

-- Drop site audit views
DROP VIEW IF EXISTS site_audit_summary CASCADE;

-- =============================================================================
-- STEP 4: ENHANCE EXISTING CRAWLER_VISITS TABLE FOR ATTRIBUTION
-- =============================================================================

-- Add new attribution-specific columns to existing crawler_visits table
ALTER TABLE crawler_visits 
ADD COLUMN IF NOT EXISTS crawler_confidence DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS estimated_query TEXT,
ADD COLUMN IF NOT EXISTS query_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('article', 'homepage', 'product', 'about', 'other')),
ADD COLUMN IF NOT EXISTS company_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS request_headers JSONB DEFAULT '{}';

-- Add comments for new fields
COMMENT ON COLUMN crawler_visits.crawler_confidence IS 'Confidence score (0-1) for crawler detection accuracy';
COMMENT ON COLUMN crawler_visits.estimated_query IS 'AI-inferred search query that may have triggered this visit';
COMMENT ON COLUMN crawler_visits.query_confidence IS 'Confidence score (0-1) for query estimation';
COMMENT ON COLUMN crawler_visits.content_type IS 'Categorized type of content that was crawled';
COMMENT ON COLUMN crawler_visits.company_info IS 'Company attribution data (rb2b style): {name, domain, industry, size, location, confidence}';
COMMENT ON COLUMN crawler_visits.ip_address IS 'IP address of the crawler for company attribution';
COMMENT ON COLUMN crawler_visits.referrer IS 'HTTP referrer header if available';
COMMENT ON COLUMN crawler_visits.session_id IS 'Session identifier for grouping related visits';
COMMENT ON COLUMN crawler_visits.request_headers IS 'Additional HTTP headers for attribution analysis';

-- Create additional indexes for attribution queries
CREATE INDEX IF NOT EXISTS idx_crawler_visits_crawler_confidence ON crawler_visits(crawler_confidence);
CREATE INDEX IF NOT EXISTS idx_crawler_visits_content_type ON crawler_visits(content_type);
CREATE INDEX IF NOT EXISTS idx_crawler_visits_estimated_query ON crawler_visits USING gin(to_tsvector('english', estimated_query)) WHERE estimated_query IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crawler_visits_ip_address ON crawler_visits(ip_address) WHERE ip_address IS NOT NULL;

-- =============================================================================
-- STEP 5: CREATE NEW ATTRIBUTION-SPECIFIC TABLES
-- =============================================================================

-- Crawler detection rules for identifying AI crawlers
CREATE TABLE crawler_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_agent_pattern TEXT NOT NULL,
  ip_ranges TEXT[],
  additional_headers JSONB DEFAULT '{}',
  crawler_type TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attribution reports for generated insights
CREATE TABLE attribution_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  timeframe_start TIMESTAMPTZ NOT NULL,
  timeframe_end TIMESTAMPTZ NOT NULL,
  timeframe_label TEXT NOT NULL, -- "Last 30 days", "This week", etc.
  
  -- Summary stats
  total_visits INTEGER DEFAULT 0,
  unique_crawlers INTEGER DEFAULT 0,
  unique_companies INTEGER DEFAULT 0,
  
  -- Attribution score breakdown
  attribution_score DECIMAL(5,2) DEFAULT 0, -- Overall score 0-100
  crawler_diversity DECIMAL(5,2) DEFAULT 0, -- How many different AI models
  content_coverage DECIMAL(5,2) DEFAULT 0,  -- Percentage of site being crawled
  attribution_quality DECIMAL(5,2) DEFAULT 0, -- Attribution confidence
  trend_change DECIMAL(5,2) DEFAULT 0,      -- Change from previous period
  
  -- Full report data
  report_data JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content performance tracking
CREATE TABLE content_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url_path TEXT NOT NULL,
  url_title TEXT,
  
  -- Performance metrics
  total_visits INTEGER DEFAULT 0,
  unique_crawlers INTEGER DEFAULT 0,
  last_crawled_at TIMESTAMPTZ,
  
  -- Attribution insights
  estimated_queries TEXT[],
  interested_companies JSONB DEFAULT '[]', -- Array of company attribution objects
  crawler_breakdown JSONB DEFAULT '{}',    -- {crawler_type: visit_count}
  
  -- Metadata
  content_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workspace_id, url_path)
);

-- =============================================================================
-- STEP 6: CREATE INDEXES FOR NEW TABLES
-- =============================================================================

-- Indexes for crawler_detection_rules
CREATE INDEX idx_crawler_detection_rules_active ON crawler_detection_rules(active);
CREATE INDEX idx_crawler_detection_rules_crawler_type ON crawler_detection_rules(crawler_type);

-- Indexes for attribution_reports  
CREATE INDEX idx_attribution_reports_workspace_id ON attribution_reports(workspace_id);
CREATE INDEX idx_attribution_reports_timeframe ON attribution_reports(timeframe_start, timeframe_end);
CREATE INDEX idx_attribution_reports_generated_at ON attribution_reports(generated_at);

-- Indexes for content_attribution
CREATE INDEX idx_content_attribution_workspace_id ON content_attribution(workspace_id);
CREATE INDEX idx_content_attribution_url_path ON content_attribution(url_path);
CREATE INDEX idx_content_attribution_total_visits ON content_attribution(total_visits);
CREATE INDEX idx_content_attribution_last_crawled ON content_attribution(last_crawled_at);

-- =============================================================================
-- STEP 7: ENABLE RLS ON NEW TABLES
-- =============================================================================

-- Enable RLS
ALTER TABLE crawler_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_attribution ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crawler_detection_rules (global rules, viewable by all)
CREATE POLICY "Anyone can view active detection rules" ON crawler_detection_rules
  FOR SELECT USING (active = true);

CREATE POLICY "Service role can manage detection rules" ON crawler_detection_rules
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for attribution_reports (workspace-scoped)
CREATE POLICY "Users can view their workspace attribution reports" ON attribution_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = attribution_reports.workspace_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attribution reports for their workspaces" ON attribution_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = attribution_reports.workspace_id
      AND w.user_id = auth.uid()
    )
  );

-- RLS Policies for content_attribution (workspace-scoped)
CREATE POLICY "Users can view their workspace content attribution" ON content_attribution
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = content_attribution.workspace_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage content attribution" ON content_attribution
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- STEP 8: INSERT DEFAULT CRAWLER DETECTION RULES
-- =============================================================================

-- Insert common AI crawler patterns
INSERT INTO crawler_detection_rules (name, user_agent_pattern, crawler_type, confidence_score) VALUES
('GPTBot (OpenAI)', '^GPTBot', 'chatgpt', 0.95),
('ChatGPT-User', 'ChatGPT-User', 'chatgpt', 0.90),
('OpenAI API', 'OpenAI', 'chatgpt', 0.85),
('PerplexityBot', 'PerplexityBot', 'perplexity', 0.95),
('Perplexity Search', 'perplexity\.ai', 'perplexity', 0.90),
('Claude-Web', 'Claude-Web', 'claude', 0.95),
('ClaudeBot', 'ClaudeBot', 'claude', 0.90),
('Anthropic', 'anthropic', 'claude', 0.85),
('Google Bard', 'Bard', 'gemini', 0.90),
('Gemini', 'Gemini', 'gemini', 0.85),
('Bing AI', 'BingBot.*AI', 'bing_ai', 0.80),
('Microsoft Copilot', 'Copilot', 'bing_ai', 0.80)
ON CONFLICT (name) DO NOTHING; -- Avoid duplicates if re-running migration

-- =============================================================================
-- STEP 9: CREATE UTILITY FUNCTIONS
-- =============================================================================

-- Function to calculate attribution score for a workspace
CREATE OR REPLACE FUNCTION calculate_attribution_score(workspace_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  total_visits INTEGER;
  unique_crawlers INTEGER;
  unique_companies INTEGER;
  crawler_diversity DECIMAL(5,2);
  content_coverage DECIMAL(5,2);
  attribution_quality DECIMAL(5,2);
  overall_score DECIMAL(5,2);
BEGIN
  -- Get basic metrics from last N days
  SELECT 
    COUNT(*),
    COUNT(DISTINCT crawler_name),
    COUNT(DISTINCT (company_info->>'name')) FILTER (WHERE company_info->>'name' IS NOT NULL)
  INTO total_visits, unique_crawlers, unique_companies
  FROM crawler_visits 
  WHERE workspace_id = workspace_uuid 
    AND timestamp >= NOW() - INTERVAL '1 day' * days_back;
  
  -- Calculate component scores
  crawler_diversity := LEAST(100, (unique_crawlers * 20)::DECIMAL(5,2)); -- Max at 5 different crawlers
  content_coverage := LEAST(100, (total_visits / 10.0)::DECIMAL(5,2));   -- Max at 100 visits
  attribution_quality := LEAST(100, (unique_companies * 10)::DECIMAL(5,2)); -- Max at 10 companies
  
  -- Overall score (weighted average)
  overall_score := (crawler_diversity * 0.4 + content_coverage * 0.3 + attribution_quality * 0.3)::DECIMAL(5,2);
  
  RETURN jsonb_build_object(
    'overall_score', overall_score,
    'crawler_diversity', crawler_diversity,
    'content_coverage', content_coverage,
    'attribution_quality', attribution_quality,
    'total_visits', total_visits,
    'unique_crawlers', unique_crawlers,
    'unique_companies', unique_companies
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get crawler stats for dashboard
CREATE OR REPLACE FUNCTION get_crawler_stats_for_workspace(workspace_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  crawler_type TEXT,
  display_name TEXT,
  total_visits BIGINT,
  unique_sessions BIGINT,
  top_pages JSONB,
  trend_change DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cv.crawler_name as crawler_type,
    cv.crawler_company as display_name,
    COUNT(*) as total_visits,
    COUNT(DISTINCT cv.session_id) as unique_sessions,
    jsonb_agg(
      jsonb_build_object(
        'url', cv.domain || cv.path,
        'visits', COUNT(*),
        'last_visit', MAX(cv.timestamp)
      )
    ) as top_pages,
    0::DECIMAL(5,2) as trend_change -- TODO: Calculate actual trend
  FROM crawler_visits cv
  WHERE cv.workspace_id = workspace_uuid
    AND cv.timestamp >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY cv.crawler_name, cv.crawler_company
  ORDER BY total_visits DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 10: UPDATE UPDATED_AT TRIGGERS
-- =============================================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_crawler_detection_rules_updated_at 
  BEFORE UPDATE ON crawler_detection_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_attribution_updated_at 
  BEFORE UPDATE ON content_attribution 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 11: CLEAN UP OLD FUNCTIONS AND VIEWS
-- =============================================================================

-- Drop old MAX visibility functions (if they exist)
DROP FUNCTION IF EXISTS update_max_runs_updated_at CASCADE;
DROP FUNCTION IF EXISTS validate_max_visibility_access CASCADE;

-- =============================================================================
-- FINAL STEP: ADD HELPFUL COMMENTS
-- =============================================================================

COMMENT ON TABLE crawler_visits IS 'Core table for AI crawler visit tracking and attribution';
COMMENT ON TABLE crawler_detection_rules IS 'Rules for identifying different AI crawlers from user agents and headers';
COMMENT ON TABLE attribution_reports IS 'Generated attribution reports with scores and insights';
COMMENT ON TABLE content_attribution IS 'Content performance tracking for attribution analysis';

-- Log completion
DO $$ 
BEGIN
  RAISE NOTICE '✅ Database cleanup completed successfully';
  RAISE NOTICE '✅ Removed: MAX visibility system, content generation, site audit';
  RAISE NOTICE '✅ Enhanced: crawler_visits table for attribution';
  RAISE NOTICE '✅ Added: attribution_reports, content_attribution, detection rules';
  RAISE NOTICE '✅ Ready for AI Crawler Attribution system!';
END $$; 