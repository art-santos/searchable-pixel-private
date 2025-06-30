-- Migration: 001_create_projects_schema.sql
-- Creates the foundational tables for the project-based AI visibility platform

-- Projects table (replaces snapshots as the core entity)
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  root_domain TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_domain CHECK (root_domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$'),
  CONSTRAINT name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- Project URLs - individual pages within a project
CREATE TABLE project_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'complete', 'error')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  tags JSONB DEFAULT '[]',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed TIMESTAMPTZ,
  next_analysis_at TIMESTAMPTZ,
  
  -- Ensure unique URLs within a project
  UNIQUE(project_id, url),
  
  -- Constraints
  CONSTRAINT valid_url CHECK (url ~ '^https?://')
);

-- Visibility tracking (time-series data for AI visibility)
CREATE TABLE visibility_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  ai_system TEXT NOT NULL CHECK (ai_system IN ('perplexity', 'chatgpt', 'claude', 'google_ai', 'bing_copilot')),
  visibility_score INTEGER CHECK (visibility_score >= 0 AND visibility_score <= 100),
  position INTEGER,
  cited_urls JSONB DEFAULT '[]', -- URLs from this project that were cited
  competitors JSONB DEFAULT '[]', -- Competitor analysis data
  response_data JSONB DEFAULT '{}', -- Full AI response data
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technical audits (time-series data for technical analysis)
CREATE TABLE technical_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_url_id UUID REFERENCES project_urls(id) ON DELETE CASCADE NOT NULL,
  
  -- Scores
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
  
  -- Technical details
  rendering_mode TEXT CHECK (rendering_mode IN ('SSR', 'CSR', 'HYBRID')),
  ssr_score_penalty INTEGER DEFAULT 0,
  
  -- Analysis data
  issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  
  -- H1 and heading analysis
  h1_detected BOOLEAN DEFAULT false,
  h1_text TEXT,
  h1_detection_method TEXT,
  h1_confidence NUMERIC(3,2),
  heading_structure JSONB DEFAULT '{}',
  
  -- Enhanced metadata
  eeat_links JSONB DEFAULT '[]',
  schema_types JSONB DEFAULT '[]',
  meta_tags JSONB DEFAULT '{}',
  
  -- Analysis metadata
  analysis_duration_ms INTEGER,
  firecrawl_method TEXT, -- 'firecrawl', 'puppeteer', 'fetch'
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project settings and configuration
CREATE TABLE project_settings (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Target keywords and topics
  target_keywords JSONB DEFAULT '[]',
  target_topics JSONB DEFAULT '[]',
  
  -- Competitor tracking
  competitors JSONB DEFAULT '[]',
  
  -- Analysis frequency
  analysis_frequency TEXT DEFAULT 'daily' CHECK (analysis_frequency IN ('daily', 'weekly', 'monthly')),
  
  -- Notification settings
  notifications JSONB DEFAULT '{"email": true, "alerts": true}',
  
  -- AI systems to track
  tracked_ai_systems JSONB DEFAULT '["perplexity", "chatgpt", "claude"]',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts and notifications
CREATE TABLE project_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('visibility_drop', 'technical_issue', 'competitor_gain', 'new_opportunity')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance optimization indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status) WHERE status = 'active';
CREATE INDEX idx_project_urls_project_id ON project_urls(project_id);
CREATE INDEX idx_project_urls_status ON project_urls(status);
CREATE INDEX idx_project_urls_next_analysis ON project_urls(next_analysis_at) WHERE status = 'pending';

-- Time-series data indexes
CREATE INDEX idx_visibility_project_query ON visibility_tracking(project_id, query, checked_at DESC);
CREATE INDEX idx_visibility_ai_system ON visibility_tracking(ai_system, checked_at DESC);
CREATE INDEX idx_technical_audits_url_time ON technical_audits(project_url_id, analyzed_at DESC);
CREATE INDEX idx_technical_audits_scores ON technical_audits(overall_score, analyzed_at DESC);
CREATE INDEX idx_alerts_project_time ON project_alerts(project_id, created_at DESC);
CREATE INDEX idx_alerts_unread ON project_alerts(project_id, is_read, created_at DESC) WHERE is_read = false;

-- Unique constraint for primary URLs (only one primary URL per project)
CREATE UNIQUE INDEX idx_project_urls_one_primary ON project_urls(project_id) WHERE is_primary = true;

-- Partitioning setup for time-series tables (for better performance with large datasets)
-- Note: This would be implemented based on expected data volume and retention policies

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own projects
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access URLs from their projects
CREATE POLICY "Users can manage URLs from their projects" ON project_urls
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can only access visibility data from their projects
CREATE POLICY "Users can access their project visibility data" ON visibility_tracking
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can only access audit data from their projects
CREATE POLICY "Users can access their project audit data" ON technical_audits
  FOR ALL USING (
    project_url_id IN (
      SELECT pu.id FROM project_urls pu
      JOIN projects p ON pu.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Users can only access settings from their projects
CREATE POLICY "Users can manage their project settings" ON project_settings
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can only access alerts from their projects
CREATE POLICY "Users can manage their project alerts" ON project_alerts
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Functions and triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update timestamps
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_settings_updated_at 
  BEFORE UPDATE ON project_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate next analysis time
CREATE OR REPLACE FUNCTION calculate_next_analysis(frequency TEXT)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE frequency
    WHEN 'daily' THEN RETURN NOW() + INTERVAL '1 day';
    WHEN 'weekly' THEN RETURN NOW() + INTERVAL '1 week';
    WHEN 'monthly' THEN RETURN NOW() + INTERVAL '1 month';
    ELSE RETURN NOW() + INTERVAL '1 day';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE projects IS 'Core projects table - each project represents a domain/brand being tracked';
COMMENT ON TABLE project_urls IS 'Individual URLs within a project that are being analyzed';
COMMENT ON TABLE visibility_tracking IS 'Time-series data tracking AI visibility across different systems';
COMMENT ON TABLE technical_audits IS 'Time-series data for technical analysis of URLs';
COMMENT ON TABLE project_settings IS 'Configuration and preferences for each project';
COMMENT ON TABLE project_alerts IS 'Notifications and alerts for project changes';

COMMENT ON COLUMN projects.settings IS 'JSON configuration including analysis preferences, keywords, etc.';
COMMENT ON COLUMN visibility_tracking.competitors IS 'Array of competitor data including domains and their visibility scores';
COMMENT ON COLUMN technical_audits.issues IS 'Array of technical issues found during analysis';
COMMENT ON COLUMN technical_audits.recommendations IS 'Array of recommended improvements';
COMMENT ON COLUMN technical_audits.metrics IS 'Detailed metrics from the analysis (load times, content metrics, etc.)'; 