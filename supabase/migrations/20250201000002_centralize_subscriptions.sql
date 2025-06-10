-- Centralize Subscription System Migration
-- This migration creates a single source of truth for all subscription data

-- Create the centralized subscription_info table
CREATE TABLE IF NOT EXISTS subscription_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core subscription data
    plan_type TEXT NOT NULL DEFAULT 'starter' CHECK (plan_type IN ('starter', 'pro', 'team', 'admin')),
    plan_status TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
    
    -- Stripe integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    
    -- Billing periods
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Plan limits (based on plan_type)
    domains_included INTEGER NOT NULL DEFAULT 1,
    workspaces_included INTEGER NOT NULL DEFAULT 1,
    team_members_included INTEGER NOT NULL DEFAULT 1,
    ai_logs_included INTEGER NOT NULL DEFAULT 1000,
    
    -- Usage tracking (current period)
    domains_used INTEGER DEFAULT 0,
    workspaces_used INTEGER DEFAULT 1,
    team_members_used INTEGER DEFAULT 1,
    ai_logs_used INTEGER DEFAULT 0,
    
    -- Add-ons
    extra_domains INTEGER DEFAULT 0,
    edge_alerts_enabled BOOLEAN DEFAULT FALSE,
    
    -- Billing preferences
    billing_preferences JSONB DEFAULT '{
        "ai_logs_enabled": true,
        "overage_notifications": true,
        "auto_billing_enabled": true,
        "analytics_only_mode": false,
        "spending_limit_cents": null
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one subscription per user
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_subscription_info_user_id ON subscription_info(user_id);
CREATE INDEX idx_subscription_info_plan_type ON subscription_info(plan_type);
CREATE INDEX idx_subscription_info_stripe_customer ON subscription_info(stripe_customer_id);
CREATE INDEX idx_subscription_info_stripe_subscription ON subscription_info(stripe_subscription_id);
CREATE INDEX idx_subscription_info_period ON subscription_info(current_period_start, current_period_end);

-- Enable RLS
ALTER TABLE subscription_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription" ON subscription_info
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON subscription_info
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON subscription_info
    FOR ALL USING (auth.role() = 'service_role');

-- Function to get plan limits based on plan type
CREATE OR REPLACE FUNCTION get_plan_limits(p_plan_type TEXT)
RETURNS TABLE (
    domains_included INTEGER,
    workspaces_included INTEGER,
    team_members_included INTEGER,
    ai_logs_included INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE p_plan_type
            WHEN 'starter' THEN 1
            WHEN 'pro' THEN 1
            WHEN 'team' THEN 5
            WHEN 'admin' THEN 999
            ELSE 1
        END as domains_included,
        CASE p_plan_type
            WHEN 'starter' THEN 1
            WHEN 'pro' THEN 1
            WHEN 'team' THEN 5
            WHEN 'admin' THEN 999
            ELSE 1
        END as workspaces_included,
        CASE p_plan_type
            WHEN 'starter' THEN 1
            WHEN 'pro' THEN 1
            WHEN 'team' THEN 5
            WHEN 'admin' THEN 999
            ELSE 1
        END as team_members_included,
        CASE p_plan_type
            WHEN 'starter' THEN 1000
            WHEN 'pro' THEN 5000
            WHEN 'team' THEN 25000
            WHEN 'admin' THEN 999999
            ELSE 1000
        END as ai_logs_included;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate existing subscription data
CREATE OR REPLACE FUNCTION migrate_subscription_data()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    plan_limits RECORD;
    migrated_count INTEGER := 0;
BEGIN
    -- Migrate data from profiles table
    FOR user_record IN 
        SELECT 
            p.id as user_id,
            COALESCE(p.subscription_plan, 'starter') as plan_type,
            COALESCE(p.subscription_status, 'active') as plan_status,
            p.stripe_customer_id,
            p.subscription_id as stripe_subscription_id,
            p.subscription_period_end,
            p.is_admin,
            p.billing_preferences,
            COALESCE(su.ai_logs_used, 0) as ai_logs_used,
            COALESCE(su.domains_used, 1) as domains_used
        FROM profiles p
        LEFT JOIN subscription_usage su ON p.id = su.user_id
        WHERE p.id IS NOT NULL
    LOOP
        -- Determine the correct plan type
                 DECLARE
             final_plan_type TEXT;
             final_plan_status TEXT;
         BEGIN
             IF user_record.is_admin THEN
                 final_plan_type := 'admin';
             ELSE
                 final_plan_type := COALESCE(user_record.plan_type, 'starter');
             END IF;
             
             -- Map old plan_status values to new valid ones
             final_plan_status := CASE user_record.plan_status
                 WHEN 'free' THEN 'active'
                 WHEN 'active' THEN 'active'
                 WHEN 'canceled' THEN 'canceled'
                 WHEN 'past_due' THEN 'past_due'
                 WHEN 'trialing' THEN 'trialing'
                 WHEN 'incomplete' THEN 'incomplete'
                 ELSE 'active'
             END;
            
            -- Get plan limits
            SELECT * INTO plan_limits FROM get_plan_limits(final_plan_type);
            
            -- Insert into subscription_info (or update if exists)
            INSERT INTO subscription_info (
                user_id,
                plan_type,
                plan_status,
                stripe_customer_id,
                stripe_subscription_id,
                current_period_end,
                domains_included,
                workspaces_included,
                team_members_included,
                ai_logs_included,
                ai_logs_used,
                domains_used,
                billing_preferences
            ) VALUES (
                user_record.user_id,
                final_plan_type,
                final_plan_status,
                user_record.stripe_customer_id,
                user_record.stripe_subscription_id,
                COALESCE(user_record.subscription_period_end, NOW() + INTERVAL '1 month'),
                plan_limits.domains_included,
                plan_limits.workspaces_included,
                plan_limits.team_members_included,
                plan_limits.ai_logs_included,
                user_record.ai_logs_used,
                user_record.domains_used,
                COALESCE(user_record.billing_preferences, '{
                    "ai_logs_enabled": true,
                    "overage_notifications": true,
                    "auto_billing_enabled": true,
                    "analytics_only_mode": false,
                    "spending_limit_cents": null
                }'::jsonb)
            ) ON CONFLICT (user_id) DO UPDATE SET
                plan_type = EXCLUDED.plan_type,
                plan_status = EXCLUDED.plan_status,
                stripe_customer_id = EXCLUDED.stripe_customer_id,
                stripe_subscription_id = EXCLUDED.stripe_subscription_id,
                current_period_end = EXCLUDED.current_period_end,
                domains_included = EXCLUDED.domains_included,
                workspaces_included = EXCLUDED.workspaces_included,
                team_members_included = EXCLUDED.team_members_included,
                ai_logs_included = EXCLUDED.ai_logs_included,
                ai_logs_used = EXCLUDED.ai_logs_used,
                domains_used = EXCLUDED.domains_used,
                billing_preferences = EXCLUDED.billing_preferences,
                updated_at = NOW();
                
            migrated_count := migrated_count + 1;
        END;
    END LOOP;
    
    RETURN format('Successfully migrated %s user subscriptions', migrated_count);
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_subscription_data();

-- Function to get current subscription info (replaces multiple API calls)
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
BEGIN
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
        si.domains_included + si.extra_domains as domains_included,
        si.domains_used,
        GREATEST(0, (si.domains_included + si.extra_domains) - si.domains_used) as domains_remaining,
        si.workspaces_included,
        si.workspaces_used,
        GREATEST(0, si.workspaces_included - si.workspaces_used) as workspaces_remaining,
        si.team_members_included,
        si.team_members_used,
        GREATEST(0, si.team_members_included - si.team_members_used) as team_members_remaining,
        si.ai_logs_included,
        si.ai_logs_used,
        GREATEST(0, si.ai_logs_included - si.ai_logs_used) as ai_logs_remaining,
        si.extra_domains,
        si.edge_alerts_enabled,
        si.billing_preferences,
        COALESCE(p.is_admin, false) as is_admin
    FROM subscription_info si
    LEFT JOIN profiles p ON si.user_id = p.id
    WHERE si.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription plan
CREATE OR REPLACE FUNCTION update_subscription_plan(
    p_user_id UUID,
    p_plan_type TEXT,
    p_stripe_subscription_id TEXT DEFAULT NULL,
    p_stripe_price_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    plan_limits RECORD;
    result_message TEXT;
BEGIN
    -- Get new plan limits
    SELECT * INTO plan_limits FROM get_plan_limits(p_plan_type);
    
    -- Update subscription_info
    UPDATE subscription_info SET
        plan_type = p_plan_type,
        stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
        stripe_price_id = COALESCE(p_stripe_price_id, stripe_price_id),
        domains_included = plan_limits.domains_included,
        workspaces_included = plan_limits.workspaces_included,
        team_members_included = plan_limits.team_members_included,
        ai_logs_included = plan_limits.ai_logs_included,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Also update profiles table for backward compatibility
    UPDATE profiles SET
        subscription_plan = p_plan_type
    WHERE id = p_user_id;
    
    result_message := format('Successfully updated subscription to %s plan', p_plan_type);
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, UPDATE ON subscription_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_subscription_plan(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_plan_limits(TEXT) TO authenticated;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_info_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_info_timestamp
    BEFORE UPDATE ON subscription_info
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_info_timestamp();

-- Clean up your specific subscription data inconsistency
DO $$
BEGIN
    -- Fix the specific user (you) to have team plan everywhere
    IF EXISTS (SELECT 1 FROM subscription_info WHERE user_id = 'e0390b8d-f121-4c65-8e63-cb60a2414f97'::UUID) THEN
        PERFORM update_subscription_plan(
            'e0390b8d-f121-4c65-8e63-cb60a2414f97'::UUID,
            'team'
        );
    END IF;
END;
$$; 