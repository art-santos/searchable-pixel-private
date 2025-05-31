-- Create table for storing AI crawler visits
CREATE TABLE IF NOT EXISTS crawler_visits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to the user who owns this domain
  domain TEXT NOT NULL,
  path TEXT NOT NULL,
  crawler_name TEXT NOT NULL,
  crawler_company TEXT NOT NULL,
  crawler_category TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  country TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add indexes for common queries
  INDEX idx_crawler_visits_user_domain (user_id, domain),
  INDEX idx_crawler_visits_timestamp (timestamp DESC),
  INDEX idx_crawler_visits_crawler (crawler_name)
);

-- Create aggregated stats table for performance
CREATE TABLE IF NOT EXISTS crawler_stats_daily (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  date DATE NOT NULL,
  crawler_name TEXT NOT NULL,
  crawler_company TEXT NOT NULL,
  visit_count INTEGER DEFAULT 0,
  unique_paths INTEGER DEFAULT 0,
  avg_response_time_ms FLOAT,
  countries JSONB, -- { "US": 10, "UK": 5, ... }
  paths JSONB, -- { "/": 20, "/about": 5, ... }
  
  -- Ensure one row per user/domain/date/crawler
  UNIQUE(user_id, domain, date, crawler_name),
  
  -- Indexes
  INDEX idx_crawler_stats_daily_lookup (user_id, domain, date)
);

-- Create API keys table for authenticating requests
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE, -- Store hashed API key
  name TEXT,
  domains TEXT[], -- Allowed domains for this key
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  INDEX idx_api_keys_hash (key_hash),
  INDEX idx_api_keys_user (user_id)
);

-- Enable RLS
ALTER TABLE crawler_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crawler_visits
CREATE POLICY "Users can view their own crawler visits" ON crawler_visits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "API keys can insert crawler visits" ON crawler_visits
  FOR INSERT
  WITH CHECK (true); -- Will be validated at API level

-- RLS Policies for crawler_stats_daily
CREATE POLICY "Users can view their own crawler stats" ON crawler_stats_daily
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage crawler stats" ON crawler_stats_daily
  FOR ALL
  USING (true); -- Will be managed by backend functions

-- RLS Policies for api_keys
CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL
  USING (auth.uid() = user_id);

-- Function to validate API key and get user info
CREATE OR REPLACE FUNCTION validate_api_key(key_hash TEXT)
RETURNS TABLE (
  user_id UUID,
  domains TEXT[],
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.user_id,
    ak.domains,
    ak.is_active
  FROM api_keys ak
  WHERE ak.key_hash = validate_api_key.key_hash
    AND ak.is_active = true;
    
  -- Update last used timestamp
  UPDATE api_keys
  SET last_used_at = NOW()
  WHERE api_keys.key_hash = validate_api_key.key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for dashboard analytics
CREATE OR REPLACE VIEW crawler_analytics AS
SELECT
  cs.user_id,
  cs.domain,
  cs.date,
  cs.crawler_company,
  SUM(cs.visit_count) as total_visits,
  COUNT(DISTINCT cs.crawler_name) as unique_crawlers,
  AVG(cs.avg_response_time_ms) as avg_response_time,
  JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'crawler', cs.crawler_name,
      'visits', cs.visit_count,
      'paths', cs.unique_paths
    )
  ) as crawler_breakdown
FROM crawler_stats_daily cs
GROUP BY cs.user_id, cs.domain, cs.date, cs.crawler_company; 