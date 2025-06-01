-- MAX Visibility System Database Schema
-- Migration: 20241205000000_max_visibility_schema.sql

-- Create custom types for MAX visibility system
CREATE TYPE max_question_type AS ENUM (
  'direct_conversational',      -- "Help me choose between X and competitors"
  'indirect_conversational',    -- "What should I know about AI platforms?"
  'comparison_query',           -- "Compare X vs Y for my use case"
  'recommendation_request',     -- "Recommend the best tool for Z"
  'explanatory_query'          -- "Explain the differences between..."
);

CREATE TYPE mention_position_enum AS ENUM (
  'primary',      -- First/main mention in response
  'secondary',    -- Supporting mention
  'passing',      -- Brief/casual mention
  'none'          -- Not mentioned
);

CREATE TYPE sentiment_enum AS ENUM (
  'very_positive',
  'positive', 
  'neutral',
  'negative',
  'very_negative'
);

CREATE TYPE citation_bucket_enum AS ENUM (
  'owned',       -- Company's own content
  'operated',    -- Company's social/profiles  
  'earned',      -- Third-party mentions
  'competitor'   -- Competitor content
);

-- Main MAX visibility runs table
CREATE TABLE max_visibility_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  triggered_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Run configuration
  question_count INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Results summary
  total_score DECIMAL(5,2),
  mention_rate DECIMAL(5,4),           -- Percentage of questions where mentioned (0-1)
  sentiment_score DECIMAL(5,2),        -- Average sentiment (-1 to 1)
  citation_score DECIMAL(5,2),         -- Citation influence score (0-100)
  competitive_score DECIMAL(5,2),      -- Competitive positioning score (0-100)
  consistency_score DECIMAL(5,2),      -- Response consistency score (0-100)
  
  -- Metadata
  computed_at TIMESTAMP DEFAULT NOW(),
  raw_json_path TEXT,                  -- Path to raw analysis data in storage
  error_message TEXT,                  -- If status = 'failed'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Questions asked during analysis
CREATE TABLE max_visibility_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES max_visibility_runs(id) ON DELETE CASCADE,
  
  -- Question details
  question TEXT NOT NULL,
  question_type max_question_type NOT NULL,
  position INTEGER NOT NULL,           -- Order in the analysis (1-N)
  
  -- Question metadata
  template_used TEXT,                  -- Which template generated this question
  customization_context JSONB,        -- Company-specific customizations
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Perplexity responses and analysis
CREATE TABLE max_visibility_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES max_visibility_questions(id) ON DELETE CASCADE,
  
  -- Perplexity response data
  perplexity_response_id TEXT,         -- Perplexity's internal response ID
  full_response TEXT NOT NULL,         -- Complete AI response text
  response_length INTEGER,             -- Character count of response
  
  -- Mention analysis
  mention_detected BOOLEAN DEFAULT FALSE,
  mention_position mention_position_enum DEFAULT 'none',
  mention_sentiment sentiment_enum DEFAULT 'neutral',
  mention_context TEXT,               -- Surrounding text context
  mention_confidence DECIMAL(5,4),    -- AI confidence in mention detection (0-1)
  
  -- Response metadata
  citation_count INTEGER DEFAULT 0,
  response_quality_score DECIMAL(5,2), -- Quality assessment of the response
  processing_time_ms INTEGER,          -- Time taken to process this response
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  analyzed_at TIMESTAMP
);

-- Source citations from Perplexity responses
CREATE TABLE max_visibility_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES max_visibility_responses(id) ON DELETE CASCADE,
  
  -- Citation details
  citation_url TEXT NOT NULL,
  citation_title TEXT,
  citation_domain TEXT,
  citation_excerpt TEXT,              -- Relevant excerpt from the source
  
  -- Classification
  bucket citation_bucket_enum NOT NULL,
  influence_score DECIMAL(5,4),       -- How much this source influenced the response (0-1)
  position_in_citations INTEGER,      -- Order in citation list (1-N)
  
  -- Authority metrics
  domain_authority DECIMAL(5,2),      -- SEO authority score if available
  relevance_score DECIMAL(5,4),       -- Relevance to the question (0-1)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Competitive analysis results
CREATE TABLE max_visibility_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES max_visibility_runs(id) ON DELETE CASCADE,
  
  -- Competitor details
  competitor_name TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  competitor_description TEXT,
  
  -- Mention metrics
  mention_count INTEGER DEFAULT 0,
  mention_rate DECIMAL(5,4),           -- Percentage of questions where mentioned
  sentiment_average DECIMAL(5,2),     -- Average sentiment for this competitor
  
  -- Positioning metrics
  ai_visibility_score DECIMAL(5,2),   -- Overall AI visibility score
  rank_position INTEGER,              -- Rank among all competitors
  share_of_voice DECIMAL(5,4),        -- Share of total mentions
  
  -- Citation metrics
  citation_count INTEGER DEFAULT 0,
  owned_citations INTEGER DEFAULT 0,
  operated_citations INTEGER DEFAULT 0,
  earned_citations INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Topic analysis results  
CREATE TABLE max_visibility_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES max_visibility_runs(id) ON DELETE CASCADE,
  
  -- Topic details
  topic_name TEXT NOT NULL,
  topic_category TEXT,                 -- Broader category this topic belongs to
  topic_description TEXT,
  
  -- Mention metrics
  mention_count INTEGER DEFAULT 0,
  mention_percentage DECIMAL(5,2),     -- Percentage of total mentions
  sentiment_score DECIMAL(5,2),        -- Average sentiment for this topic
  
  -- Positioning metrics
  rank_position INTEGER,               -- Rank among all topics
  change_vs_previous DECIMAL(5,2),     -- Change from previous analysis
  competitive_strength DECIMAL(5,2),   -- How well positioned vs competitors
  
  -- Context analysis
  question_types TEXT[],               -- Which question types mention this topic
  conversation_contexts TEXT[],        -- Common conversation contexts
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Detailed response metrics and insights
CREATE TABLE max_visibility_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES max_visibility_runs(id) ON DELETE CASCADE,
  
  -- Metric details
  metric_name TEXT NOT NULL,           -- e.g., 'avg_response_length', 'hallucination_rate'
  metric_value DECIMAL(10,4),          -- Numeric value
  metric_unit TEXT,                    -- Unit of measurement
  metric_category TEXT,                -- Category: 'quality', 'performance', 'accuracy'
  
  -- Context and metadata
  metric_description TEXT,
  metric_metadata JSONB,               -- Additional structured data
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance and optimization indexes
CREATE INDEX idx_max_runs_company_date ON max_visibility_runs(company_id, created_at DESC);
CREATE INDEX idx_max_runs_status ON max_visibility_runs(status);
CREATE INDEX idx_max_questions_run ON max_visibility_questions(run_id, position);
CREATE INDEX idx_max_responses_question ON max_visibility_responses(question_id);
CREATE INDEX idx_max_responses_mention ON max_visibility_responses(mention_detected, mention_position);
CREATE INDEX idx_max_citations_response ON max_visibility_citations(response_id);
CREATE INDEX idx_max_citations_bucket ON max_visibility_citations(bucket);
CREATE INDEX idx_max_competitors_run ON max_visibility_competitors(run_id, rank_position);
CREATE INDEX idx_max_topics_run ON max_visibility_topics(run_id, rank_position);
CREATE INDEX idx_max_metrics_run_category ON max_visibility_metrics(run_id, metric_category);

-- RLS (Row Level Security) policies
ALTER TABLE max_visibility_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE max_visibility_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE max_visibility_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE max_visibility_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE max_visibility_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE max_visibility_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE max_visibility_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for max_visibility_runs
CREATE POLICY "Users can view runs for their companies" ON max_visibility_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = max_visibility_runs.company_id 
      AND companies.submitted_by = auth.uid()
    )
  );

CREATE POLICY "Users can create runs for their companies" ON max_visibility_runs
  FOR INSERT WITH CHECK (
    triggered_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = max_visibility_runs.company_id 
      AND companies.submitted_by = auth.uid()
    )
  );

CREATE POLICY "Users can update runs they triggered" ON max_visibility_runs
  FOR UPDATE USING (triggered_by = auth.uid());

-- RLS Policies for related tables (inherit from runs)
CREATE POLICY "Users can view questions for their runs" ON max_visibility_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM max_visibility_runs 
      WHERE max_visibility_runs.id = max_visibility_questions.run_id 
      AND EXISTS (
        SELECT 1 FROM companies 
        WHERE companies.id = max_visibility_runs.company_id 
        AND companies.submitted_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert questions for their runs" ON max_visibility_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM max_visibility_runs 
      WHERE max_visibility_runs.id = max_visibility_questions.run_id 
      AND max_visibility_runs.triggered_by = auth.uid()
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can view responses for their runs" ON max_visibility_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM max_visibility_questions 
      JOIN max_visibility_runs ON max_visibility_runs.id = max_visibility_questions.run_id
      WHERE max_visibility_questions.id = max_visibility_responses.question_id 
      AND EXISTS (
        SELECT 1 FROM companies 
        WHERE companies.id = max_visibility_runs.company_id 
        AND companies.submitted_by = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage all MAX data" ON max_visibility_runs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all MAX questions" ON max_visibility_questions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all MAX responses" ON max_visibility_responses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all MAX citations" ON max_visibility_citations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all MAX competitors" ON max_visibility_competitors
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all MAX topics" ON max_visibility_topics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all MAX metrics" ON max_visibility_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to runs table
CREATE TRIGGER update_max_runs_updated_at 
  BEFORE UPDATE ON max_visibility_runs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE max_visibility_runs IS 'Main table for MAX visibility analysis runs';
COMMENT ON TABLE max_visibility_questions IS 'Conversational questions asked during MAX analysis';
COMMENT ON TABLE max_visibility_responses IS 'Perplexity AI responses with mention analysis';
COMMENT ON TABLE max_visibility_citations IS 'Source citations from AI responses';
COMMENT ON TABLE max_visibility_competitors IS 'Competitive analysis results';
COMMENT ON TABLE max_visibility_topics IS 'Topic-based conversation analysis';
COMMENT ON TABLE max_visibility_metrics IS 'Detailed metrics and insights from analysis';

-- Create a view for easy access to complete run data
CREATE VIEW max_visibility_run_summary AS
SELECT 
  r.id,
  r.company_id,
  r.triggered_by,
  r.status,
  r.question_count,
  r.total_score,
  r.mention_rate,
  r.sentiment_score,
  r.citation_score,
  r.competitive_score,
  r.consistency_score,
  r.started_at,
  r.completed_at,
  r.created_at,
  c.root_url as company_domain,
  c.company_name as company_name,
  p.first_name || ' ' || p.last_name as triggered_by_name,
  COUNT(q.id) as actual_question_count,
  COUNT(CASE WHEN resp.mention_detected = true THEN 1 END) as mentions_found,
  COUNT(cit.id) as total_citations
FROM max_visibility_runs r
LEFT JOIN companies c ON c.id = r.company_id
LEFT JOIN profiles p ON p.id = r.triggered_by
LEFT JOIN max_visibility_questions q ON q.run_id = r.id
LEFT JOIN max_visibility_responses resp ON resp.question_id = q.id
LEFT JOIN max_visibility_citations cit ON cit.response_id = resp.id
GROUP BY r.id, c.root_url, c.company_name, p.first_name, p.last_name; 