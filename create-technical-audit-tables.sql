-- Technical Audit Database Schema
-- Creates tables for storing Firecrawl technical audit results

-- Pages table for storing analyzed web pages
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  domain TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  content TEXT, -- Truncated page content for storage
  markdown TEXT, -- Markdown version of content
  word_count INTEGER DEFAULT 0,
  
  -- AEO Scores
  aeo_score INTEGER DEFAULT 0 CHECK (aeo_score >= 0 AND aeo_score <= 100),
  content_quality_score INTEGER DEFAULT 0 CHECK (content_quality_score >= 0 AND content_quality_score <= 100),
  technical_health_score INTEGER DEFAULT 0 CHECK (technical_health_score >= 0 AND technical_health_score <= 100),
  media_accessibility_score INTEGER DEFAULT 0 CHECK (media_accessibility_score >= 0 AND media_accessibility_score <= 100),
  schema_markup_score INTEGER DEFAULT 0 CHECK (schema_markup_score >= 0 AND schema_markup_score <= 100),
  ai_optimization_score INTEGER DEFAULT 0 CHECK (ai_optimization_score >= 0 AND ai_optimization_score <= 100),
  
  -- Metadata
  analysis_metadata JSONB, -- Analysis duration, AI usage, etc.
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_domain ON pages(domain);
CREATE INDEX IF NOT EXISTS idx_pages_aeo_score ON pages(aeo_score);
CREATE INDEX IF NOT EXISTS idx_pages_analyzed_at ON pages(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_pages_url_hash ON pages(url);

-- Page issues table for storing technical problems found
CREATE TABLE IF NOT EXISTS page_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  category TEXT NOT NULL CHECK (category IN ('seo', 'performance', 'accessibility', 'content', 'schema', 'metadata')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  fix_priority INTEGER DEFAULT 5 CHECK (fix_priority >= 1 AND fix_priority <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique issues per page
  UNIQUE(page_id, title)
);

-- Create indexes for issue queries
CREATE INDEX IF NOT EXISTS idx_page_issues_page_id ON page_issues(page_id);
CREATE INDEX IF NOT EXISTS idx_page_issues_severity ON page_issues(severity);
CREATE INDEX IF NOT EXISTS idx_page_issues_category ON page_issues(category);
CREATE INDEX IF NOT EXISTS idx_page_issues_priority ON page_issues(fix_priority DESC);

-- Page recommendations table for storing optimization suggestions
CREATE TABLE IF NOT EXISTS page_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('content', 'technical', 'seo', 'accessibility', 'performance')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  implementation TEXT NOT NULL,
  expected_impact TEXT NOT NULL,
  effort_level TEXT NOT NULL CHECK (effort_level IN ('low', 'medium', 'high')),
  priority_score INTEGER DEFAULT 5 CHECK (priority_score >= 1 AND priority_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique recommendations per page
  UNIQUE(page_id, title)
);

-- Create indexes for recommendation queries
CREATE INDEX IF NOT EXISTS idx_page_recommendations_page_id ON page_recommendations(page_id);
CREATE INDEX IF NOT EXISTS idx_page_recommendations_category ON page_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_page_recommendations_effort ON page_recommendations(effort_level);
CREATE INDEX IF NOT EXISTS idx_page_recommendations_priority ON page_recommendations(priority_score DESC);

-- Audit runs table for tracking audit campaigns
CREATE TABLE IF NOT EXISTS audit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Optional: link to auth.users if authentication is set up
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Configuration
  target_urls TEXT[] NOT NULL,
  crawl_depth INTEGER DEFAULT 1,
  max_pages INTEGER DEFAULT 10,
  
  -- Results summary
  pages_analyzed INTEGER DEFAULT 0,
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  warning_issues INTEGER DEFAULT 0,
  info_issues INTEGER DEFAULT 0,
  total_recommendations INTEGER DEFAULT 0,
  average_aeo_score DECIMAL(5,2) DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link pages to audit runs
CREATE TABLE IF NOT EXISTS audit_run_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id UUID REFERENCES audit_runs(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(audit_run_id, page_id)
);

-- Create indexes for audit run queries
CREATE INDEX IF NOT EXISTS idx_audit_runs_user_id ON audit_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_runs_status ON audit_runs(status);
CREATE INDEX IF NOT EXISTS idx_audit_runs_created_at ON audit_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_run_pages_run_id ON audit_run_pages(audit_run_id);

-- Helper function to calculate audit run statistics
CREATE OR REPLACE FUNCTION update_audit_run_stats(run_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE audit_runs 
  SET 
    pages_analyzed = (
      SELECT COUNT(*)
      FROM audit_run_pages arp
      JOIN pages p ON arp.page_id = p.id
      WHERE arp.audit_run_id = run_id
    ),
    total_issues = (
      SELECT COUNT(*)
      FROM audit_run_pages arp
      JOIN page_issues pi ON arp.page_id = pi.page_id
      WHERE arp.audit_run_id = run_id
    ),
    critical_issues = (
      SELECT COUNT(*)
      FROM audit_run_pages arp
      JOIN page_issues pi ON arp.page_id = pi.page_id
      WHERE arp.audit_run_id = run_id AND pi.severity = 'critical'
    ),
    warning_issues = (
      SELECT COUNT(*)
      FROM audit_run_pages arp
      JOIN page_issues pi ON arp.page_id = pi.page_id
      WHERE arp.audit_run_id = run_id AND pi.severity = 'warning'
    ),
    info_issues = (
      SELECT COUNT(*)
      FROM audit_run_pages arp
      JOIN page_issues pi ON arp.page_id = pi.page_id
      WHERE arp.audit_run_id = run_id AND pi.severity = 'info'
    ),
    total_recommendations = (
      SELECT COUNT(*)
      FROM audit_run_pages arp
      JOIN page_recommendations pr ON arp.page_id = pr.page_id
      WHERE arp.audit_run_id = run_id
    ),
    average_aeo_score = (
      SELECT COALESCE(AVG(p.aeo_score), 0)
      FROM audit_run_pages arp
      JOIN pages p ON arp.page_id = p.id
      WHERE arp.audit_run_id = run_id
    ),
    updated_at = NOW()
  WHERE id = run_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get page audit summary
CREATE OR REPLACE FUNCTION get_page_audit_summary(page_url TEXT)
RETURNS TABLE(
  url TEXT,
  title TEXT,
  aeo_score INTEGER,
  total_issues BIGINT,
  critical_issues BIGINT,
  warning_issues BIGINT,
  total_recommendations BIGINT,
  last_analyzed TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.url,
    p.title,
    p.aeo_score,
    COUNT(DISTINCT pi.id) as total_issues,
    COUNT(DISTINCT pi.id) FILTER (WHERE pi.severity = 'critical') as critical_issues,
    COUNT(DISTINCT pi.id) FILTER (WHERE pi.severity = 'warning') as warning_issues,
    COUNT(DISTINCT pr.id) as total_recommendations,
    p.analyzed_at as last_analyzed
  FROM pages p
  LEFT JOIN page_issues pi ON p.id = pi.page_id
  LEFT JOIN page_recommendations pr ON p.id = pr.page_id
  WHERE p.url = page_url
  GROUP BY p.id, p.url, p.title, p.aeo_score, p.analyzed_at;
END;
$$ LANGUAGE plpgsql;

-- Sample query views for common operations
CREATE OR REPLACE VIEW page_audit_overview AS
SELECT 
  p.id,
  p.url,
  p.domain,
  p.title,
  p.aeo_score,
  p.content_quality_score,
  p.technical_health_score,
  p.media_accessibility_score,
  p.schema_markup_score,
  p.ai_optimization_score,
  COUNT(DISTINCT pi.id) as total_issues,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.severity = 'critical') as critical_issues,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.severity = 'warning') as warning_issues,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.severity = 'info') as info_issues,
  COUNT(DISTINCT pr.id) as total_recommendations,
  p.analyzed_at
FROM pages p
LEFT JOIN page_issues pi ON p.id = pi.page_id
LEFT JOIN page_recommendations pr ON p.id = pr.page_id
GROUP BY p.id, p.url, p.domain, p.title, p.aeo_score, p.content_quality_score, 
         p.technical_health_score, p.media_accessibility_score, p.schema_markup_score,
         p.ai_optimization_score, p.analyzed_at;

-- Grant permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE ON pages TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON page_issues TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON page_recommendations TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON audit_runs TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON audit_run_pages TO authenticated; 