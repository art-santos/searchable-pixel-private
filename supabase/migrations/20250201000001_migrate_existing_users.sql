-- Migration: Migrate existing users to new pricing model
-- This migration handles the transition of existing users from old plans to new plans

-- 1. Create a backup of current subscription data
CREATE TABLE IF NOT EXISTS pricing_migration_backup AS
SELECT 
    id,
    subscription_plan,
    subscription_status,
    stripe_customer_id,
    subscription_id
FROM profiles
WHERE subscription_plan IS NOT NULL;

-- 2. Migration mapping for existing users
-- free -> starter (but starter requires payment, so we'll handle this carefully)
-- visibility -> pro (good match in price and features)
-- plus -> pro (consolidating complexity)
-- pro -> team (upgrading to maintain multi-domain features)

UPDATE profiles SET 
    subscription_plan = CASE subscription_plan
        WHEN 'free' THEN 'starter'
        WHEN 'visibility' THEN 'pro' 
        WHEN 'plus' THEN 'pro'
        WHEN 'pro' THEN 'team'
        ELSE 'starter'
    END,
    -- Set team size based on old plan
    max_team_members = CASE subscription_plan
        WHEN 'pro' THEN 5  -- Old pro users get team plan with 5 members
        ELSE 1
    END,
    -- Reset snapshot usage for new limits
    monthly_snapshots_used = 0,
    last_snapshot_reset_at = NOW()
WHERE subscription_plan IN ('free', 'visibility', 'plus', 'pro');

-- 3. Handle free plan users specially
-- Free users will be migrated to 'starter' but with a grace period
-- Add special handling for free users
UPDATE profiles SET 
    subscription_status = 'trialing',
    subscription_period_end = NOW() + INTERVAL '14 days' -- 14-day grace period
WHERE subscription_plan = 'starter' 
AND stripe_customer_id IS NULL;

-- 4. Create grandfathered pricing records for smooth transition
CREATE TABLE IF NOT EXISTS grandfathered_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    old_plan TEXT NOT NULL,
    new_plan TEXT NOT NULL,
    grandfathered_until TIMESTAMP WITH TIME ZONE,
    special_pricing JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE grandfathered_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own grandfathered pricing" ON grandfathered_pricing
    FOR SELECT
    USING (auth.uid() = user_id);

-- 5. Insert grandfathered pricing for existing paid users
INSERT INTO grandfathered_pricing (user_id, old_plan, new_plan, grandfathered_until, special_pricing, notes)
SELECT 
    p.id as user_id,
    pmb.subscription_plan as old_plan,
    p.subscription_plan as new_plan,
    NOW() + INTERVAL '6 months' as grandfathered_until,
    jsonb_build_object(
        'maintain_old_pricing', true,
        'migration_date', NOW(),
        'special_terms', 'Grandfathered pricing for 6 months during transition'
    ) as special_pricing,
    'Automatic migration from ' || pmb.subscription_plan || ' to ' || p.subscription_plan
FROM profiles p
JOIN pricing_migration_backup pmb ON p.id = pmb.id
WHERE pmb.subscription_plan != 'free' 
AND p.stripe_customer_id IS NOT NULL;

-- 6. Create notification records for users about plan changes
CREATE TABLE IF NOT EXISTS plan_change_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    old_plan TEXT,
    new_plan TEXT,
    notification_type TEXT CHECK (notification_type IN ('upgrade', 'migration', 'trial_ending', 'feature_change')),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE plan_change_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON plan_change_notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON plan_change_notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 7. Insert notifications for all migrated users
INSERT INTO plan_change_notifications (user_id, old_plan, new_plan, notification_type, message)
SELECT 
    p.id as user_id,
    pmb.subscription_plan as old_plan,
    p.subscription_plan as new_plan,
    CASE 
        WHEN pmb.subscription_plan = 'free' THEN 'trial_ending'
        WHEN p.subscription_plan = 'team' THEN 'upgrade'
        ELSE 'migration'
    END as notification_type,
    CASE 
        WHEN pmb.subscription_plan = 'free' THEN 
            'Your account has been migrated to our new Starter plan with a 14-day trial. Please update your billing to continue service.'
        WHEN p.subscription_plan = 'team' THEN 
            'Great news! Your account has been upgraded to our new Team plan with enhanced collaboration features at the same price.'
        ELSE 
            'Your account has been migrated to our simplified ' || p.subscription_plan || ' plan. You''ll maintain your current pricing for 6 months.'
    END as message
FROM profiles p
JOIN pricing_migration_backup pmb ON p.id = pmb.id;

-- 8. Update workspace quotas based on new plans
UPDATE profiles SET
    -- Set domain limits based on new plan structure
    max_team_members = CASE subscription_plan
        WHEN 'starter' THEN 1
        WHEN 'pro' THEN 1
        WHEN 'team' THEN 5
        ELSE 1
    END
WHERE subscription_plan IN ('starter', 'pro', 'team');

-- 9. Clean up old usage tracking that's no longer needed
-- Keep the columns for now but reset them
UPDATE profiles SET
    monthly_scans_used = 0,
    monthly_articles_used = 0
WHERE monthly_scans_used IS NOT NULL OR monthly_articles_used IS NOT NULL;

-- 10. Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_grandfathered_pricing_user_id ON grandfathered_pricing(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_change_notifications_user_id ON plan_change_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_change_notifications_read ON plan_change_notifications(is_read);

-- 11. Add helper function to check if user has grandfathered pricing
CREATE OR REPLACE FUNCTION has_grandfathered_pricing(p_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM grandfathered_pricing gp
        WHERE gp.user_id = p_user_id
        AND gp.grandfathered_until > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Function to get effective pricing for user
CREATE OR REPLACE FUNCTION get_effective_pricing(p_user_id UUID)
RETURNS TABLE (
    plan_name TEXT,
    is_grandfathered BOOLEAN,
    grandfathered_until TIMESTAMP WITH TIME ZONE,
    special_terms JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.subscription_plan as plan_name,
        (gp.id IS NOT NULL AND gp.grandfathered_until > NOW()) as is_grandfathered,
        gp.grandfathered_until,
        gp.special_pricing as special_terms
    FROM profiles p
    LEFT JOIN grandfathered_pricing gp ON gp.user_id = p.id AND gp.grandfathered_until > NOW()
    WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION has_grandfathered_pricing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_effective_pricing(UUID) TO authenticated;

-- 13. Add comments
COMMENT ON TABLE grandfathered_pricing IS 'Tracks users with special pricing during transition period';
COMMENT ON TABLE plan_change_notifications IS 'Stores notifications about plan changes for users';
COMMENT ON FUNCTION has_grandfathered_pricing(UUID) IS 'Checks if user has grandfathered pricing still active';
COMMENT ON FUNCTION get_effective_pricing(UUID) IS 'Returns effective pricing information for a user';

-- 14. Log migration completion
INSERT INTO usage_events (user_id, event_type, metadata)
SELECT 
    p.id as user_id,
    'billing_cycle_reset' as event_type,
    jsonb_build_object(
        'event_subtype', 'plan_migration',
        'migration_type', 'pricing_model_update',
        'old_plan', pmb.subscription_plan,
        'new_plan', p.subscription_plan,
        'migration_date', NOW(),
        'grandfathered', (p.stripe_customer_id IS NOT NULL)
    ) as metadata
FROM profiles p
JOIN pricing_migration_backup pmb ON p.id = pmb.id;

-- 15. Final verification - count migrated users
DO $$
DECLARE
    migrated_count INTEGER;
    free_users_count INTEGER;
    paid_users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM pricing_migration_backup;
    SELECT COUNT(*) INTO free_users_count FROM pricing_migration_backup WHERE subscription_plan = 'free';
    SELECT COUNT(*) INTO paid_users_count FROM pricing_migration_backup WHERE subscription_plan != 'free';
    
    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE '- Total users migrated: %', migrated_count;
    RAISE NOTICE '- Free users (now starter with trial): %', free_users_count;
    RAISE NOTICE '- Paid users (grandfathered): %', paid_users_count;
END $$; 