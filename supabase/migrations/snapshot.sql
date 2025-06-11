-- =====================================================
-- COMPLETE SNAPSHOT USAGE TRACKING IMPLEMENTATION
-- =====================================================

-- 1. Add snapshot columns to subscription_usage table
ALTER TABLE subscription_usage 
ADD COLUMN IF NOT EXISTS snapshots_included INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS snapshots_used INTEGER NOT NULL DEFAULT 0;

-- 2. Update the usage_events constraint to include new event types
ALTER TABLE usage_events DROP CONSTRAINT IF EXISTS usage_events_event_type_check;
ALTER TABLE usage_events ADD CONSTRAINT usage_events_event_type_check 
CHECK (event_type IN (
  'article_generated', 
  'domain_added', 
  'domain_removed', 
  'max_scan_performed', 
  'daily_scan_performed',
  'credits_purchased',
  'billing_cycle_reset',
  'ai_log_tracked',
  'snapshot_created'
));

-- 3. Update the plan_type constraint to include starter and team plans
ALTER TABLE subscription_usage DROP CONSTRAINT IF EXISTS subscription_usage_plan_type_check;
ALTER TABLE subscription_usage ADD CONSTRAINT subscription_usage_plan_type_check 
CHECK (plan_type IN ('free', 'visibility', 'plus', 'pro', 'starter', 'team'));

-- 4. Update existing subscription_usage records with snapshot limits based on plan
UPDATE subscription_usage 
SET 
  snapshots_included = CASE 
    WHEN plan_type = 'free' THEN 10
    WHEN plan_type = 'visibility' THEN 10
    WHEN plan_type = 'plus' THEN 25
    WHEN plan_type = 'pro' THEN 50
    WHEN plan_type = 'starter' THEN 10
    WHEN plan_type = 'team' THEN 100
    ELSE 10
  END,
  snapshots_used = 0,
  updated_at = NOW()
WHERE snapshots_included = 0;

-- 5. Drop and recreate get_current_billing_period function with snapshots support
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
  snapshots_included INTEGER,
  snapshots_used INTEGER,
  snapshots_remaining INTEGER,
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
    (su.article_credits_included + su.article_credits_purchased - su.article_credits_used) AS article_credits_remaining,
    su.domains_included,
    su.domains_used,
    su.domains_purchased,
    (su.domains_included + su.domains_purchased - su.domains_used) AS domains_remaining,
    su.ai_logs_included,
    su.ai_logs_used,
    (su.ai_logs_included - su.ai_logs_used) AS ai_logs_remaining,
    su.snapshots_included,
    su.snapshots_used,
    (su.snapshots_included - su.snapshots_used) AS snapshots_remaining,
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

-- 6. Drop and recreate track_usage_event function with snapshot support
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
    WHEN 'snapshot_created' THEN
      -- Snapshots are included in plan (no overage billing)
      v_cost_cents := 0;
      v_billable := false;
      
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
    WHEN 'snapshot_created' THEN
      UPDATE subscription_usage 
      SET 
        snapshots_used = snapshots_used + p_amount,
        updated_at = NOW()
      WHERE id = v_subscription_usage_id;
      
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

-- 7. Update initialize_subscription function to include snapshots
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
  v_snapshots INTEGER := 0;
BEGIN
  -- Set plan defaults
  CASE p_plan_type
    WHEN 'free' THEN
      v_article_credits := 0;
      v_domains := 1;
      v_ai_logs := 100;
      v_snapshots := 10;
    WHEN 'visibility' THEN
      v_article_credits := 0;
      v_domains := 1;
      v_ai_logs := 250;
      v_snapshots := 10;
    WHEN 'plus' THEN
      v_article_credits := 10;
      v_domains := 1;
      v_ai_logs := 500;
      v_snapshots := 25;
    WHEN 'pro' THEN
      v_article_credits := 30;
      v_domains := 3;
      v_ai_logs := 1000;
      v_snapshots := 50;
    WHEN 'starter' THEN
      v_article_credits := 0;
      v_domains := 1;
      v_ai_logs := 250;
      v_snapshots := 10;
    WHEN 'team' THEN
      v_article_credits := 50;
      v_domains := 10;
      v_ai_logs := 2500;
      v_snapshots := 100;
    ELSE -- default to free
      v_article_credits := 0;
      v_domains := 1;
      v_ai_logs := 100;
      v_snapshots := 10;
  END CASE;
  
  -- Insert subscription usage record
  INSERT INTO subscription_usage (
    user_id,
    billing_period_start,
    billing_period_end,
    article_credits_included,
    domains_included,
    ai_logs_included,
    snapshots_included,
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
    v_snapshots,
    p_plan_type,
    p_stripe_subscription_id,
    v_period_end
  ) RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Track the specific snapshot that was created
SELECT track_usage_event(
  '5031bf9e-62f7-4779-b4e3-8093b9e6e4ce'::UUID,
  'snapshot_created',
  1,
  '{"snapshot_id": "a7cacc05-a114-4609-8289-abd0b98cab37", "urls_count": 1, "topic": "test"}'::JSONB
) as tracked_event_id;

-- 9. Verify the results
SELECT 
  snapshots_included,
  snapshots_used,
  snapshots_remaining,
  plan_type,
  ai_logs_included,
  ai_logs_used
FROM get_current_billing_period('5031bf9e-62f7-4779-b4e3-8093b9e6e4ce');

-- 10. Check the usage event was created
SELECT 
  event_type,
  amount,
  metadata->>'snapshot_id' as snapshot_id,
  created_at
FROM usage_events 
WHERE user_id = '5031bf9e-62f7-4779-b4e3-8093b9e6e4ce' 
AND event_type = 'snapshot_created'
ORDER BY created_at DESC 
LIMIT 1;

-- =====================================================
-- SNAPSHOT USAGE TRACKING COMPLETE
-- =====================================================