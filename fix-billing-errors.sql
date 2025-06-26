-- Fix for ambiguous column reference errors in get_user_subscription function
-- Run this in your Supabase SQL editor to fix the billing errors

CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  plan_type TEXT,
  plan_status TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  domains_included INTEGER,
  domains_used INTEGER,
  domains_remaining INTEGER,
  workspaces_included INTEGER,
  workspaces_used INTEGER,
  workspaces_remaining INTEGER,
  team_members_included INTEGER,
  team_members_used INTEGER,
  team_members_remaining INTEGER,
  ai_logs_included INTEGER,
  ai_logs_used INTEGER,
  ai_logs_remaining INTEGER,
  extra_domains INTEGER,
  edge_alerts_enabled BOOLEAN,
  billing_preferences JSONB,
  is_admin BOOLEAN
) AS $$
DECLARE
  v_subscription_exists BOOLEAN;
  v_plan_type TEXT;
  v_is_admin BOOLEAN;
  v_workspace_count INTEGER;
  v_ai_logs_count INTEGER;
BEGIN
  -- Check if user has a subscription_info record
  SELECT EXISTS (
    SELECT 1 FROM subscription_info WHERE subscription_info.user_id = p_user_id
  ) INTO v_subscription_exists;

  -- Get user's admin status and plan from profiles
  SELECT 
    profiles.is_admin,
    COALESCE(profiles.subscription_plan, 'starter') 
  INTO 
    v_is_admin,
    v_plan_type
  FROM profiles 
  WHERE profiles.id = p_user_id;

  -- Get current workspace count
  SELECT COUNT(*) INTO v_workspace_count
  FROM workspaces 
  WHERE workspaces.user_id = p_user_id;

  -- Get AI logs count for current period - FIXED: Added table alias
  SELECT COUNT(*) INTO v_ai_logs_count
  FROM crawler_visits cv
  WHERE cv.user_id = p_user_id
  AND cv.timestamp >= date_trunc('month', CURRENT_DATE)
  AND cv.timestamp < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';

  -- If subscription_info exists, return it
  IF v_subscription_exists THEN
    RETURN QUERY
    SELECT 
      si.user_id,
      si.plan_type,
      si.plan_status,
      si.stripe_customer_id,
      si.stripe_subscription_id,
      si.current_period_start,
      si.current_period_end,
      si.trial_end,
      si.cancel_at_period_end,
      si.domains_included,
      COALESCE(si.domains_used, v_workspace_count),
      GREATEST(0, si.domains_included - COALESCE(si.domains_used, v_workspace_count)),
      si.workspaces_included,
      COALESCE(si.workspaces_used, v_workspace_count),
      GREATEST(0, si.workspaces_included - COALESCE(si.workspaces_used, v_workspace_count)),
      si.team_members_included,
      COALESCE(si.team_members_used, 1),
      GREATEST(0, si.team_members_included - COALESCE(si.team_members_used, 1)),
      si.ai_logs_included,
      COALESCE(si.ai_logs_used, v_ai_logs_count),
      GREATEST(0, si.ai_logs_included - COALESCE(si.ai_logs_used, v_ai_logs_count)),
      COALESCE(si.extra_domains, 0),
      COALESCE(si.edge_alerts_enabled, false),
      si.billing_preferences,
      v_is_admin
    FROM subscription_info si
    WHERE si.user_id = p_user_id;
  ELSE
    -- Return default values for new users without subscription_info
    RETURN QUERY
    SELECT 
      p_user_id,
      v_plan_type,
      'active'::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      date_trunc('month', CURRENT_DATE),
      date_trunc('month', CURRENT_DATE) + INTERVAL '1 month',
      NULL::TIMESTAMPTZ,
      false,
      1, -- domains_included (starter plan default)
      v_workspace_count,
      GREATEST(0, 1 - v_workspace_count),
      1, -- workspaces_included
      v_workspace_count,
      GREATEST(0, 1 - v_workspace_count),
      1, -- team_members_included
      1, -- team_members_used
      0, -- team_members_remaining
      1000, -- ai_logs_included (starter plan default)
      v_ai_logs_count,
      GREATEST(0, 1000 - v_ai_logs_count),
      0, -- extra_domains
      false, -- edge_alerts_enabled
      '{}'::JSONB, -- billing_preferences
      v_is_admin;
  END IF;
END;
$$ LANGUAGE plpgsql; 