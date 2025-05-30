-- SBAC System Migration
-- This migration adds the necessary tables and columns for the Subscription-Based Access Control system

-- 1. Add usage tracking columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_scans_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_articles_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scan_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_articles_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create usage_events table for detailed tracking
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('scan', 'article', 'api_call')),
  event_subtype TEXT CHECK (event_subtype IN ('basic_scan', 'max_scan', 'standard_article', 'premium_article', NULL)),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for usage_events
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON public.usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON public.usage_events(event_type);

-- 3. Create scan_history table for retention management
CREATE TABLE IF NOT EXISTS public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT 'basic' CHECK (scan_type IN ('basic', 'max')),
  domain TEXT NOT NULL,
  score INTEGER,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scan_history
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON public.scan_history(created_at);

-- 4. Create generated_content table
CREATE TABLE IF NOT EXISTS public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'article' CHECK (content_type IN ('article', 'report')),
  quality_tier TEXT DEFAULT 'standard' CHECK (quality_tier IN ('standard', 'premium')),
  metadata JSONB DEFAULT '{}',
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for generated_content
CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON public.generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_slug ON public.generated_content(slug);
CREATE INDEX IF NOT EXISTS idx_generated_content_published ON public.generated_content(published);

-- 5. Create domains table for multi-domain tracking
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- Create indexes for domains
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);

-- 6. Add RLS policies

-- Enable RLS on all new tables
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Usage events policies
CREATE POLICY "Users can view their own usage events"
  ON public.usage_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage events"
  ON public.usage_events FOR INSERT
  WITH CHECK (true); -- Will be restricted by API

-- Scan history policies
CREATE POLICY "Users can view their own scan history"
  ON public.scan_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan history"
  ON public.scan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Generated content policies
CREATE POLICY "Users can view their own content"
  ON public.generated_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own content"
  ON public.generated_content FOR ALL
  USING (auth.uid() = user_id);

-- Domains policies
CREATE POLICY "Users can view their own domains"
  ON public.domains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own domains"
  ON public.domains FOR ALL
  USING (auth.uid() = user_id);

-- 7. Create helper functions

-- Function to check if user can perform action based on limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_feature TEXT,
  p_count INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user's plan
  SELECT subscription_plan INTO v_plan
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check based on feature
  CASE p_feature
    WHEN 'scan' THEN
      SELECT monthly_scans_used INTO v_used
      FROM profiles
      WHERE id = p_user_id;
      
      -- Set limits based on plan
      v_limit := CASE v_plan
        WHEN 'free' THEN 4
        WHEN 'visibility' THEN 30
        ELSE -1 -- unlimited
      END;
      
    WHEN 'article' THEN
      SELECT monthly_articles_used INTO v_used
      FROM profiles
      WHERE id = p_user_id;
      
      v_limit := CASE v_plan
        WHEN 'free' THEN 0
        WHEN 'visibility' THEN 0
        WHEN 'plus' THEN 10
        WHEN 'pro' THEN 30
        ELSE 0
      END;
      
    ELSE
      RETURN FALSE;
  END CASE;
  
  -- Check if within limit (-1 means unlimited)
  RETURN v_limit = -1 OR (v_used + p_count) <= v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_count INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  CASE p_feature
    WHEN 'scan' THEN
      UPDATE profiles
      SET monthly_scans_used = monthly_scans_used + p_count
      WHERE id = p_user_id;
      
    WHEN 'article' THEN
      UPDATE profiles
      SET monthly_articles_used = monthly_articles_used + p_count
      WHERE id = p_user_id;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (to be called by scheduled job)
CREATE OR REPLACE FUNCTION reset_monthly_usage() RETURNS VOID AS $$
BEGIN
  -- Reset scan usage for users whose reset date has passed
  UPDATE profiles
  SET 
    monthly_scans_used = 0,
    last_scan_reset_at = NOW()
  WHERE 
    last_scan_reset_at <= NOW() - INTERVAL '1 month';
    
  -- Reset article usage for users whose reset date has passed
  UPDATE profiles
  SET 
    monthly_articles_used = 0,
    last_articles_reset_at = NOW()
  WHERE 
    last_articles_reset_at <= NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data based on retention policies
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS VOID AS $$
BEGIN
  -- Delete scan history older than retention period
  DELETE FROM scan_history
  WHERE id IN (
    SELECT sh.id
    FROM scan_history sh
    JOIN profiles p ON sh.user_id = p.id
    WHERE 
      (p.subscription_plan = 'free' AND sh.created_at < NOW() - INTERVAL '90 days')
      OR (p.subscription_plan = 'visibility' AND sh.created_at < NOW() - INTERVAL '180 days')
      OR (p.subscription_plan = 'plus' AND sh.created_at < NOW() - INTERVAL '360 days')
  );
  
  -- Delete old usage events (keep last 90 days for all plans)
  DELETE FROM usage_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create updated_at trigger for tables that need it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generated_content_updated_at
  BEFORE UPDATE ON generated_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 