-- Fix admin billing bypass
-- Update can_bill_overage function to bypass all limits for admin users

CREATE OR REPLACE FUNCTION can_bill_overage(
  p_user_id UUID,
  p_overage_cents INTEGER,
  p_usage_type TEXT DEFAULT 'ai_logs'
) RETURNS BOOLEAN AS $$
DECLARE
  v_billing_prefs JSONB;
  v_current_overage INTEGER;
  v_user_configured_limit INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin first - admins bypass all limits
  SELECT is_admin, billing_preferences 
  INTO v_is_admin, v_billing_prefs
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Admin users bypass all billing restrictions
  IF COALESCE(v_is_admin, false) THEN
    RETURN TRUE;
  END IF;
  
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

-- Also update track_usage_event to bypass billing restrictions for admin users
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
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = p_user_id;
  
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
      
      -- Admin users are always billable (but won't actually be charged)
      -- Non-admin users: only bill if overage and billing is allowed
      IF COALESCE(v_is_admin, false) THEN
        v_billable := true;
        v_cost_cents := 0; -- Don't charge admin users
      ELSIF v_overage_amount > 0 THEN
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
          WHEN v_billable AND NOT COALESCE(v_is_admin, false) THEN COALESCE(overage_amount_cents, 0) + v_cost_cents
          ELSE COALESCE(overage_amount_cents, 0)
        END,
        overage_blocked = CASE 
          WHEN NOT v_billable AND v_overage_amount > 0 AND NOT COALESCE(v_is_admin, false) THEN true
          ELSE false -- Never block admin users
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