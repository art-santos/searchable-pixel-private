-- Fix get_current_billing_period function to return all required fields
-- Run this SQL in your Supabase SQL editor or database

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_current_billing_period(UUID);

-- Create the updated function with all required fields
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

-- Grant permissions to the updated function
GRANT EXECUTE ON FUNCTION get_current_billing_period(UUID) TO authenticated; 