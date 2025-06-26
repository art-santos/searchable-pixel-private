-- Comprehensive Audit System Database Schema
-- Run this in Supabase SQL Editor

-- =====================================================
-- MAIN AUDIT TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS comprehensive_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID UNIQUE, -- For async processing
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Basic Page Info
  page_title TEXT,
  page_summary TEXT, -- LLM-generated (gated)
  
  -- Performance Metrics (lightweight)
  html_size_kb DECIMAL,
  dom_size_kb DECIMAL,
  performance_score INTEGER, -- Quick performance proxy score
  
  -- Crawlability & Rendering
  crawlable BOOLEAN,
  ssr_rendered BOOLEAN,
  
  -- Schema Analysis
  faq_schema_present BOOLEAN DEFAULT FALSE,
  itemlist_schema_present BOOLEAN DEFAULT FALSE,
  article_schema_present BOOLEAN DEFAULT FALSE,
  breadcrumb_schema_present BOOLEAN DEFAULT FALSE,
  speakable_schema_present BOOLEAN DEFAULT FALSE,
  jsonld_valid BOOLEAN DEFAULT FALSE,
  schema_types TEXT[], -- Array of detected schema types
  
  -- SEO & Structure
  canonical_tag_valid BOOLEAN DEFAULT FALSE,
  title_h1_match BOOLEAN DEFAULT FALSE,
  meta_description_present BOOLEAN DEFAULT FALSE,
  h1_present BOOLEAN DEFAULT FALSE,
  h1_count INTEGER DEFAULT 0,
  heading_depth INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  
  -- Link Analysis
  external_eeat_links INTEGER DEFAULT 0,
  internal_link_count INTEGER DEFAULT 0,
  
  -- Image Analysis
  image_alt_present_percent DECIMAL DEFAULT 0,
  avg_image_kb DECIMAL DEFAULT 0,
  total_images INTEGER DEFAULT 0,
  
  -- AI Analysis
  promotional_sentiment_percent DECIMAL, -- (gated)
  llm_mentions TEXT[], -- Array of detected mentions
  mention_confidence_score DECIMAL,
  
  -- Recommendations
  technical_quick_win TEXT,
  content_quick_win TEXT, -- (gated)
  
  -- Scoring
  page_score INTEGER CHECK (page_score >= 0 AND page_score <= 100),
  
  -- Metadata
  schema_version INTEGER DEFAULT 1,
  additional_metrics JSONB DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}', -- e.g., {"schema": "high", "images": "medium"}
  error_message TEXT, -- For failed audits
  analyzed_at TIMESTAMP WITH TIME ZONE,
  analysis_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(url, user_id)
);

-- =====================================================
-- SCORING WEIGHTS TABLE (for dynamic scoring)
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_scoring_weights (
  id SERIAL PRIMARY KEY,
  metric_name TEXT UNIQUE NOT NULL,
  weight DECIMAL NOT NULL,
  category TEXT NOT NULL, -- 'content', 'technical', 'schema', 'performance', 'ai'
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RECOMMENDATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES comprehensive_audits(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('technical', 'content', 'seo', 'schema', 'performance')),
  priority INTEGER CHECK (priority >= 1 AND priority <= 10),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  implementation TEXT,
  effort_level TEXT CHECK (effort_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_comprehensive_audits_user_id ON comprehensive_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_audits_domain ON comprehensive_audits(domain);
CREATE INDEX IF NOT EXISTS idx_comprehensive_audits_status ON comprehensive_audits(status);
CREATE INDEX IF NOT EXISTS idx_comprehensive_audits_job_id ON comprehensive_audits(job_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_audits_created_at ON comprehensive_audits(created_at);
CREATE INDEX IF NOT EXISTS idx_comprehensive_audits_page_score ON comprehensive_audits(page_score);
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_audit_id ON audit_recommendations(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_category ON audit_recommendations(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE comprehensive_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_scoring_weights ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audits
CREATE POLICY "Users can view own audits" ON comprehensive_audits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audits" ON comprehensive_audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audits" ON comprehensive_audits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audits" ON comprehensive_audits
  FOR DELETE USING (auth.uid() = user_id);

-- Users can see recommendations for their audits
CREATE POLICY "Users can view own audit recommendations" ON audit_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM comprehensive_audits 
      WHERE id = audit_recommendations.audit_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert recommendations" ON audit_recommendations
  FOR INSERT WITH CHECK (true); -- System service can insert

-- Scoring weights are readable by all authenticated users
CREATE POLICY "Authenticated users can view scoring weights" ON audit_scoring_weights
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can modify scoring weights
CREATE POLICY "Service role can manage scoring weights" ON audit_scoring_weights
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- DEFAULT SCORING WEIGHTS
-- =====================================================

INSERT INTO audit_scoring_weights (metric_name, weight, category, description) VALUES
-- Content Analysis (40% total)
('word_count', 0.15, 'content', 'Content length and depth'),
('heading_structure', 0.10, 'content', 'Proper heading hierarchy'),
('title_h1_match', 0.05, 'content', 'Title and H1 alignment'),
('meta_description_present', 0.10, 'content', 'Meta description presence'),

-- Technical Health (30% total)
('ssr_rendered', 0.10, 'technical', 'Server-side rendering'),
('canonical_tag_valid', 0.05, 'technical', 'Canonical URL validity'),
('crawlable', 0.10, 'technical', 'Page crawlability'),
('performance_score', 0.05, 'performance', 'Lightweight performance proxy'),

-- Schema & Structured Data (20% total)
('jsonld_valid', 0.10, 'schema', 'Valid JSON-LD markup'),
('schema_types_count', 0.05, 'schema', 'Number of schema types'),
('faq_schema_present', 0.02, 'schema', 'FAQ schema markup'),
('article_schema_present', 0.03, 'schema', 'Article schema markup'),

-- AI Optimization (10% total)
('llm_mentions', 0.05, 'ai', 'AI mentions and visibility'),
('mention_confidence', 0.05, 'ai', 'AI mention confidence score')

ON CONFLICT (metric_name) DO NOTHING;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for comprehensive_audits
DROP TRIGGER IF EXISTS update_comprehensive_audits_updated_at ON comprehensive_audits;
CREATE TRIGGER update_comprehensive_audits_updated_at
    BEFORE UPDATE ON comprehensive_audits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for audit_scoring_weights
DROP TRIGGER IF EXISTS update_audit_scoring_weights_updated_at ON audit_scoring_weights;
CREATE TRIGGER update_audit_scoring_weights_updated_at
    BEFORE UPDATE ON audit_scoring_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate page score based on weights
CREATE OR REPLACE FUNCTION calculate_page_score(audit_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    total_score DECIMAL := 0;
    weight_record RECORD;
    metric_value DECIMAL;
BEGIN
    -- Loop through active scoring weights
    FOR weight_record IN 
        SELECT metric_name, weight FROM audit_scoring_weights WHERE is_active = TRUE
    LOOP
        -- Extract metric value from audit data
        metric_value := COALESCE((audit_data ->> weight_record.metric_name)::DECIMAL, 0);
        
        -- Add weighted score
        total_score := total_score + (metric_value * weight_record.weight);
    END LOOP;
    
    -- Return score capped at 100
    RETURN LEAST(100, GREATEST(0, ROUND(total_score * 100)::INTEGER));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CLEANUP FUNCTION (for old audits)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_audits()
RETURNS void AS $$
BEGIN
    -- Delete audits older than 6 months (adjust as needed)
    DELETE FROM comprehensive_audits 
    WHERE created_at < NOW() - INTERVAL '6 months'
    AND status IN ('completed', 'failed');
    
    -- Log cleanup
    RAISE NOTICE 'Cleaned up old comprehensive audits';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (optional - for testing)
-- =====================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO comprehensive_audits (
    url, domain, user_id, status, page_title, html_size_kb, dom_size_kb, 
    crawlable, ssr_rendered, word_count, page_score
) VALUES (
    'https://example.com', 'example.com', auth.uid(), 'completed',
    'Example Page', 45.2, 1200, TRUE, TRUE, 850, 78
);
*/

-- =====================================================
-- GRANTS (if needed for service role)
-- =====================================================

-- Grant necessary permissions to service role for background processing
GRANT ALL ON comprehensive_audits TO service_role;
GRANT ALL ON audit_recommendations TO service_role;
GRANT ALL ON audit_scoring_weights TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role; 