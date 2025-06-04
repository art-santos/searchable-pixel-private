-- Billing Preferences and User Controls Migration
-- Addresses critical issues from pricing audit

-- Add billing preferences to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS billing_preferences JSONB DEFAULT '{
  "ai_logs_enabled": true,
  "spending_limit_cents": null,
  "overage_notifications": false,
  "auto_billing_enabled": true,
  "analytics_only_mode": false
}'::jsonb;

-- Create table to track dismissed notifications
CREATE TABLE IF NOT EXISTS dismissed_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  notification_key TEXT NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, notification_type, notification_key)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_dismissed_notifications_user_type 
ON dismissed_notifications(user_id, notification_type);

-- Grant permissions
GRANT ALL ON dismissed_notifications TO authenticated;

-- Add spending limits per plan (in cents)
CREATE OR REPLACE FUNCTION get_plan_spending_limit(plan_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE plan_type
    WHEN 'free' THEN RETURN 0;        -- No overages allowed
    WHEN 'visibility' THEN RETURN 2500; -- $25/month max
    WHEN 'plus' THEN RETURN 10000;    -- $100/month max  
    WHEN 'pro' THEN RETURN 50000;     -- $500/month max
    ELSE RETURN 2500; -- Default to visibility limit
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add overage tracking to subscription_usage
ALTER TABLE subscription_usage 
ADD COLUMN IF NOT EXISTS overage_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_overage_warning_sent TIMESTAMP WITH TIME ZONE;

-- Function to check if overage billing is allowed for user
CREATE OR REPLACE FUNCTION can_bill_overage(
  p_user_id UUID,
  p_overage_cents INTEGER,
  p_usage_type TEXT DEFAULT 'ai_logs'
) RETURNS BOOLEAN AS $$
DECLARE
  v_billing_prefs JSONB;
  v_current_overage INTEGER;
  v_user_configured_limit INTEGER;
BEGIN
  -- Get user's billing preferences
  SELECT billing_preferences 
  INTO v_billing_prefs
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Check if user has disabled billing for this usage type
  IF p_usage_type = 'ai_logs' AND NOT COALESCE((v_billing_prefs->>'ai_logs_enabled')::boolean, true) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if auto billing is disabled
  IF NOT COALESCE((v_billing_prefs->>'auto_billing_enabled')::boolean, true) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if in analytics-only mode
  IF COALESCE((v_billing_prefs->>'analytics_only_mode')::boolean, false) THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's explicitly configured spending limit (null if not set)
  v_user_configured_limit := (v_billing_prefs->>'spending_limit_cents')::integer;
  
  -- If user has not configured a spending limit, allow billing (no limit enforcement)
  IF v_user_configured_limit IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Get current overage amount this billing period
  SELECT COALESCE(overage_amount_cents, 0)
  INTO v_current_overage
  FROM subscription_usage su
  WHERE su.user_id = p_user_id
    AND su.billing_period_start <= NOW()
    AND su.billing_period_end > NOW()
    AND su.plan_status = 'active';
  
  -- Check if new overage would exceed user's configured limit
  IF (v_current_overage + p_overage_cents) > v_user_configured_limit THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get usage warning levels
CREATE OR REPLACE FUNCTION get_usage_warning_level(
  p_user_id UUID,
  p_usage_type TEXT DEFAULT 'ai_logs'
) RETURNS TEXT AS $$
DECLARE
  v_usage_data RECORD;
  v_percentage DECIMAL;
BEGIN
  -- Get current usage for AI logs
  IF p_usage_type = 'ai_logs' THEN
    SELECT 
      ai_logs_used,
      ai_logs_included,
      CASE 
        WHEN ai_logs_included > 0 THEN (ai_logs_used::decimal / ai_logs_included::decimal) * 100
        ELSE 0 
      END as usage_percentage
    INTO v_usage_data
    FROM subscription_usage su
    WHERE su.user_id = p_user_id
      AND su.billing_period_start <= NOW()
      AND su.billing_period_end > NOW()
      AND su.plan_status = 'active';
    
    v_percentage := COALESCE(v_usage_data.usage_percentage, 0);
    
    IF v_percentage >= 100 THEN
      RETURN 'overage';
    ELSIF v_percentage >= 95 THEN
      RETURN 'critical';
    ELSIF v_percentage >= 80 THEN
      RETURN 'warning';
    ELSE
      RETURN 'normal';
    END IF;
  END IF;
  
  RETURN 'normal';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the track_usage_event function to respect billing preferences
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
  v_billable BOOLEAN := false;
  v_overage_amount INTEGER := 0;
BEGIN
  -- Get current billing period
  SELECT usage_id INTO v_subscription_usage_id
  FROM get_current_billing_period(p_user_id);
  
  IF v_subscription_usage_id IS NULL THEN
    RAISE EXCEPTION 'No active billing period found for user %', p_user_id;
  END IF;
  
  -- Calculate cost and overage based on event type
  CASE p_event_type
    WHEN 'ai_log_tracked' THEN
      -- Check current AI logs usage
      SELECT 
        GREATEST(0, (ai_logs_used + p_amount) - ai_logs_included) 
      INTO v_overage_amount
      FROM subscription_usage 
      WHERE id = v_subscription_usage_id;
      
      -- Only bill if overage and billing is allowed
      IF v_overage_amount > 0 THEN
        v_cost_cents := v_overage_amount * 1; -- $0.008 = 0.8 cents, rounded to 1
        v_billable := can_bill_overage(p_user_id, v_cost_cents, 'ai_logs');
      END IF;
      
    WHEN 'article_generated' THEN
      v_cost_cents := p_amount * 1000; -- $10 per article
      v_billable := true; -- Articles are always billable
      
    WHEN 'domain_added' THEN
      v_cost_cents := p_amount * 10000; -- $100 per domain
      v_billable := true; -- Domains are always billable
      
    ELSE
      v_cost_cents := 0;
      v_billable := false;
  END CASE;
  
  -- Insert usage event
  INSERT INTO usage_events (
    user_id,
    subscription_usage_id,
    event_type,
    amount,
    metadata,
    cost_cents,
    billable
  ) VALUES (
    p_user_id,
    v_subscription_usage_id,
    p_event_type,
    p_amount,
    p_metadata,
    v_cost_cents,
    v_billable
  ) RETURNING id INTO v_event_id;
  
  -- Update subscription usage counters
  CASE p_event_type
    WHEN 'ai_log_tracked' THEN
      UPDATE subscription_usage 
      SET 
        ai_logs_used = ai_logs_used + p_amount,
        overage_amount_cents = CASE 
          WHEN v_billable THEN COALESCE(overage_amount_cents, 0) + v_cost_cents
          ELSE COALESCE(overage_amount_cents, 0)
        END,
        overage_blocked = CASE 
          WHEN NOT v_billable AND v_overage_amount > 0 THEN true
          ELSE overage_blocked
        END,
        updated_at = NOW()
      WHERE id = v_subscription_usage_id;
      
    WHEN 'article_generated' THEN
      UPDATE subscription_usage 
      SET 
        article_credits_used = article_credits_used + p_amount,
        overage_amount_cents = COALESCE(overage_amount_cents, 0) + v_cost_cents,
        updated_at = NOW()
      WHERE id = v_subscription_usage_id;
      
    WHEN 'domain_added' THEN
      UPDATE subscription_usage 
      SET 
        domains_used = domains_used + p_amount,
        overage_amount_cents = COALESCE(overage_amount_cents, 0) + v_cost_cents,
        updated_at = NOW()
      WHERE id = v_subscription_usage_id;
      
    WHEN 'domain_removed' THEN
      UPDATE subscription_usage 
      SET 
        domains_used = GREATEST(0, domains_used - p_amount),
        updated_at = NOW()
      WHERE id = v_subscription_usage_id;
  END CASE;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_plan_spending_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_bill_overage(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_warning_level(UUID, TEXT) TO authenticated; 