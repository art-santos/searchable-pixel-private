-- AI Crawler Logs Feature Migration
-- Run this SQL in your Supabase SQL editor

-- Add AI logs tracking fields to subscription_usage table
ALTER TABLE subscription_usage 
ADD COLUMN IF NOT EXISTS ai_logs_included INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_logs_used INTEGER NOT NULL DEFAULT 0;

-- Create AI Crawler Log events table
CREATE TABLE IF NOT EXISTS ai_crawler_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_usage_id UUID REFERENCES subscription_usage(id) ON DELETE CASCADE,
  
  -- Log details
  domain VARCHAR(255) NOT NULL,
  ai_platform VARCHAR(50), -- 'chatgpt', 'claude', 'perplexity', 'gemini', etc.
  query_text TEXT,
  mention_context TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 1.00, -- 0.00 to 1.00
  source_url TEXT,
  
  -- Billing details
  billed BOOLEAN DEFAULT FALSE,
  cost_cents INTEGER DEFAULT 0, -- $0.008 = 0.8 cents
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_crawler_logs_user_id ON ai_crawler_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_crawler_logs_domain ON ai_crawler_logs(domain);
CREATE INDEX IF NOT EXISTS idx_ai_crawler_logs_platform ON ai_crawler_logs(ai_platform);
CREATE INDEX IF NOT EXISTS idx_ai_crawler_logs_detected_at ON ai_crawler_logs(detected_at);
CREATE INDEX IF NOT EXISTS idx_ai_crawler_logs_billed ON ai_crawler_logs(billed);

-- Enable RLS
ALTER TABLE ai_crawler_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI crawler logs" ON ai_crawler_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all AI crawler logs" ON ai_crawler_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Update get_current_billing_period function to include AI logs
DROP FUNCTION IF EXISTS get_current_billing_period(UUID);

CREATE OR REPLACE FUNCTION get_current_billing_period(p_user_id UUID)
RETURNS TABLE (
  usage_id UUID,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  article_credits_included INTEGER,
  article_credits_used INTEGER,
  article_credits_purchased INTEGER,
  article_credits_remaining INTEGER,
  domains_included INTEGER,
  domains_used INTEGER,
  domains_purchased INTEGER,
  domains_remaining INTEGER,
  ai_logs_included INTEGER,
  ai_logs_used INTEGER,
  ai_logs_remaining INTEGER,
  max_scans_used INTEGER,
  daily_scans_used INTEGER,
  plan_type TEXT,
  plan_status TEXT,
  stripe_subscription_id TEXT,
  next_billing_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    su.id,
    su.billing_period_start,
    su.billing_period_end,
    su.article_credits_included,
    su.article_credits_used,
    su.article_credits_purchased,
    (su.article_credits_included + su.article_credits_purchased - su.article_credits_used) AS credits_remaining,
    su.domains_included,
    su.domains_used,
    su.domains_purchased,
    (su.domains_included + su.domains_purchased - su.domains_used) AS domains_remaining,
    su.ai_logs_included,
    su.ai_logs_used,
    (su.ai_logs_included - su.ai_logs_used) AS ai_logs_remaining,
    su.max_scans_used,
    su.daily_scans_used,
    su.plan_type,
    su.plan_status,
    su.stripe_subscription_id,
    su.next_billing_date
  FROM subscription_usage su
  WHERE su.user_id = p_user_id
    AND su.billing_period_start <= NOW()
    AND su.billing_period_end > NOW()
    AND su.plan_status = 'active'
  ORDER BY su.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update track_usage_event function to handle AI logs
DROP FUNCTION IF EXISTS track_usage_event(UUID, TEXT, INTEGER, JSONB);

CREATE OR REPLACE FUNCTION track_usage_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_amount INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_subscription_usage_id UUID;
  v_event_id UUID;
  v_cost_cents INTEGER := 0;
BEGIN
  -- Get current billing period
  SELECT usage_id INTO v_subscription_usage_id
  FROM get_current_billing_period(p_user_id);
  
  IF v_subscription_usage_id IS NULL THEN
    RAISE EXCEPTION 'No active billing period found for user %', p_user_id;
  END IF;
  
  -- Calculate cost based on event type
  CASE p_event_type
    WHEN 'article_generated' THEN
      v_cost_cents := p_amount * 1000; -- $10 per article
    WHEN 'domain_added' THEN
      v_cost_cents := p_amount * 10000; -- $100 per domain
    WHEN 'ai_log_detected' THEN
      v_cost_cents := p_amount * 1; -- $0.008 per log (rounded to 1 cent for simplicity)
    ELSE
      v_cost_cents := 0;
  END CASE;
  
  -- Insert usage event
  INSERT INTO usage_events (
    user_id,
    subscription_usage_id,
    event_type,
    amount,
    metadata,
    cost_cents
  ) VALUES (
    p_user_id,
    v_subscription_usage_id,
    p_event_type,
    p_amount,
    p_metadata,
    v_cost_cents
  ) RETURNING id INTO v_event_id;
  
  -- Update subscription usage counters
  CASE p_event_type
    WHEN 'article_generated' THEN
      UPDATE subscription_usage 
      SET article_credits_used = article_credits_used + p_amount,
          updated_at = NOW()
      WHERE id = v_subscription_usage_id;
    WHEN 'domain_added' THEN
      UPDATE subscription_usage 
      SET domains_used = domains_used + p_amount,
          updated_at = NOW()
      WHERE id = v_subscription_usage_id;
    WHEN 'domain_removed' THEN
      UPDATE subscription_usage 
      SET domains_used = GREATEST(0, domains_used - p_amount),
          updated_at = NOW()
      WHERE id = v_subscription_usage_id;
    WHEN 'ai_log_detected' THEN
      UPDATE subscription_usage 
      SET ai_logs_used = ai_logs_used + p_amount,
          updated_at = NOW()
      WHERE id = v_subscription_usage_id;
    WHEN 'max_scan_performed' THEN
      UPDATE subscription_usage 
      SET max_scans_used = max_scans_used + p_amount,
          updated_at = NOW()
      WHERE id = v_subscription_usage_id;
    WHEN 'daily_scan_performed' THEN
      UPDATE subscription_usage 
      SET daily_scans_used = daily_scans_used + p_amount,
          updated_at = NOW()
      WHERE id = v_subscription_usage_id;
  END CASE;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update initialize_subscription function to include AI logs
DROP FUNCTION IF EXISTS initialize_subscription(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION initialize_subscription(
  p_user_id UUID,
  p_plan_type TEXT DEFAULT 'free',
  p_stripe_subscription_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_period_start TIMESTAMP WITH TIME ZONE := NOW();
  v_period_end TIMESTAMP WITH TIME ZONE := NOW() + INTERVAL '1 month';
  v_article_credits INTEGER := 0;
  v_domains INTEGER := 1;
  v_ai_logs INTEGER := 0;
BEGIN
  -- Set plan defaults
  CASE p_plan_type
    WHEN 'free' THEN
      v_article_credits := 0;
      v_domains := 1;
      v_ai_logs := 100;
    WHEN 'visibility' THEN
      v_article_credits := 0;
      v_domains := 1;
      v_ai_logs := 250;
    WHEN 'plus' THEN
      v_article_credits := 10;
      v_domains := 1;
      v_ai_logs := 500;
    WHEN 'pro' THEN
      v_article_credits := 30;
      v_domains := 3;
      v_ai_logs := 1000;
    ELSE -- default to free
      v_article_credits := 0;
      v_domains := 1;
      v_ai_logs := 100;
  END CASE;
  
  -- Insert subscription usage record
  INSERT INTO subscription_usage (
    user_id,
    billing_period_start,
    billing_period_end,
    article_credits_included,
    domains_included,
    ai_logs_included,
    plan_type,
    stripe_subscription_id,
    next_billing_date
  ) VALUES (
    p_user_id,
    v_period_start,
    v_period_end,
    v_article_credits,
    v_domains,
    v_ai_logs,
    p_plan_type,
    p_stripe_subscription_id,
    v_period_end
  ) RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing subscription records to include AI logs based on their plan
UPDATE subscription_usage 
SET ai_logs_included = CASE 
  WHEN plan_type = 'free' THEN 100
  WHEN plan_type = 'visibility' THEN 250
  WHEN plan_type = 'plus' THEN 500
  WHEN plan_type = 'pro' THEN 1000
  ELSE 100
END
WHERE ai_logs_included = 0;

-- Grant permissions
GRANT SELECT ON ai_crawler_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_billing_period(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_usage_event(UUID, TEXT, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_subscription(UUID, TEXT, TEXT) TO authenticated; 