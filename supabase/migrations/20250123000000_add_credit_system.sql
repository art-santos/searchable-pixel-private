-- Add credit tracking support for new Pro plan credit system
-- Run this migration to add credit tracking to existing subscription_usage table

-- Add lead credit columns to subscription_usage table if they don't exist
ALTER TABLE subscription_usage 
ADD COLUMN IF NOT EXISTS lead_credits_included INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_credits_purchased INTEGER DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN subscription_usage.lead_credits_included IS 'Monthly lead credits included in plan (for Pro plan credit tiers)';
COMMENT ON COLUMN subscription_usage.lead_credits_used IS 'Lead credits used in current billing period';
COMMENT ON COLUMN subscription_usage.lead_credits_purchased IS 'Additional lead credits purchased';

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_subscription_usage_lead_credits ON subscription_usage(user_id, lead_credits_used);

-- Function to track lead credit usage
CREATE OR REPLACE FUNCTION track_lead_credit_usage(
  p_user_id UUID,
  p_credits_used INTEGER DEFAULT 1,
  p_lead_type TEXT DEFAULT 'normal' -- 'normal' = 1 credit, 'max' = 5 credits
) RETURNS BOOLEAN AS $$
DECLARE
  v_usage_id UUID;
  v_current_used INTEGER;
  v_credits_included INTEGER;
  v_credits_purchased INTEGER;
  v_total_available INTEGER;
BEGIN
  -- Get current billing period
  SELECT 
    id,
    lead_credits_used,
    lead_credits_included,
    lead_credits_purchased
  INTO 
    v_usage_id,
    v_current_used,
    v_credits_included,
    v_credits_purchased
  FROM subscription_usage 
  WHERE user_id = p_user_id 
  AND billing_period_start <= NOW() 
  AND billing_period_end > NOW()
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_usage_id IS NULL THEN
    RAISE EXCEPTION 'No active billing period found for user %', p_user_id;
    RETURN FALSE;
  END IF;

  -- Calculate total available credits
  v_total_available := v_credits_included + v_credits_purchased;

  -- Check if user has enough credits
  IF (v_current_used + p_credits_used) > v_total_available THEN
    RAISE EXCEPTION 'Insufficient credits. Used: %, Requested: %, Available: %', 
      v_current_used, p_credits_used, v_total_available;
    RETURN FALSE;
  END IF;

  -- Update usage
  UPDATE subscription_usage 
  SET 
    lead_credits_used = lead_credits_used + p_credits_used,
    updated_at = NOW()
  WHERE id = v_usage_id;

  -- Log the usage event
  INSERT INTO usage_events (
    user_id,
    subscription_usage_id,
    event_type,
    amount,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    v_usage_id,
    'lead_generation',
    p_credits_used,
    jsonb_build_object('lead_type', p_lead_type),
    NOW()
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error tracking lead credit usage: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_lead_credit_balance(p_user_id UUID)
RETURNS TABLE(
  credits_included INTEGER,
  credits_used INTEGER,
  credits_purchased INTEGER,
  credits_remaining INTEGER,
  billing_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    su.lead_credits_included,
    su.lead_credits_used,
    su.lead_credits_purchased,
    (su.lead_credits_included + su.lead_credits_purchased - su.lead_credits_used) as credits_remaining,
    su.billing_period_end
  FROM subscription_usage su
  WHERE su.user_id = p_user_id 
  AND su.billing_period_start <= NOW() 
  AND su.billing_period_end > NOW()
  ORDER BY su.created_at DESC 
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION track_lead_credit_usage(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_lead_credit_balance(UUID) TO authenticated; 