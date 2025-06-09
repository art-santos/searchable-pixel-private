-- Migration: New Pricing Model - Starter/Pro/Team
-- This migration updates the subscription system for the new pricing model

-- 1. First, add team functionality columns (before constraint update)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_team_members INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS monthly_snapshots_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_snapshot_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Migrate existing data to new plan names BEFORE updating constraint
UPDATE profiles SET 
    subscription_plan = CASE subscription_plan
        WHEN 'free' THEN 'starter'
        WHEN 'visibility' THEN 'pro' 
        WHEN 'plus' THEN 'pro'
        WHEN 'pro' THEN 'team'
        ELSE 'starter'  -- fallback for any unexpected values
    END
WHERE subscription_plan IS NOT NULL;

-- 3. Now update subscription_plan constraint to new plans
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_plan_check 
CHECK (subscription_plan IN ('starter', 'pro', 'team'));

-- 4. Create team_members table for collaboration
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 5. Create edge_alerts table for the new add-on
CREATE TABLE IF NOT EXISTS edge_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    alert_type TEXT CHECK (alert_type IN ('spike_detection', 'new_bot', 'threshold_reached')),
    webhook_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on new tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_alerts ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for team_members
CREATE POLICY "Workspace owners can manage team members" ON team_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = team_members.workspace_id
            AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Team members can view their own membership" ON team_members
    FOR SELECT
    USING (auth.uid() = user_id);

-- 8. Create RLS policies for edge_alerts
CREATE POLICY "Users can manage their own edge alerts" ON edge_alerts
    FOR ALL
    USING (auth.uid() = user_id);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_workspace_id ON team_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_user_id ON edge_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_workspace_id ON edge_alerts(workspace_id);

-- 10. Update SBAC functions for new pricing model

-- Function to check feature access based on new plans
CREATE OR REPLACE FUNCTION check_feature_access(
    p_user_id UUID,
    p_feature TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan TEXT;
    v_domain_count INTEGER;
    v_team_size INTEGER;
    v_add_on_domains INTEGER;
BEGIN
    -- Get user's plan and counts
    SELECT 
        subscription_plan,
        team_size
    INTO v_plan, v_team_size
    FROM profiles WHERE id = p_user_id;
    
    -- Count user's domains
    SELECT COUNT(*) INTO v_domain_count
    FROM workspaces 
    WHERE user_id = p_user_id;
    
    -- Get additional domains from add-ons (if applicable)
    -- This would come from subscription_add_ons table
    v_add_on_domains := 0; -- TODO: Implement add-on counting
    
    CASE p_feature
        WHEN 'api_access' THEN
            RETURN v_plan IN ('pro', 'team');
        WHEN 'team_access' THEN
            RETURN v_plan = 'team';
        WHEN 'unlimited_snapshots' THEN
            RETURN v_plan = 'team';
        WHEN 'slack_alerts' THEN
            RETURN v_plan IN ('pro', 'team');
        WHEN 'csv_export' THEN
            RETURN v_plan IN ('pro', 'team');
        WHEN 'pdf_reports' THEN
            RETURN v_plan IN ('pro', 'team');
        WHEN 'edge_alerts' THEN
            -- Check if user has edge alerts add-on
            RETURN EXISTS (
                SELECT 1 FROM subscription_add_ons sa
                WHERE sa.user_id = p_user_id 
                AND sa.add_on_type = 'edge_alerts'
                AND sa.is_active = true
            );
        WHEN 'multi_domain' THEN
            CASE v_plan
                WHEN 'starter' THEN RETURN v_domain_count <= (1 + v_add_on_domains);
                WHEN 'pro' THEN RETURN v_domain_count <= (1 + v_add_on_domains);
                WHEN 'team' THEN RETURN v_domain_count <= (5 + v_add_on_domains);
                ELSE RETURN FALSE;
            END CASE;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check snapshot limits
CREATE OR REPLACE FUNCTION check_snapshot_limit(
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan TEXT;
    v_current_month_count INTEGER;
    v_limit INTEGER;
BEGIN
    SELECT subscription_plan INTO v_plan FROM profiles WHERE id = p_user_id;
    
    -- Count snapshots this month
    SELECT COALESCE(monthly_snapshots_used, 0) INTO v_current_month_count
    FROM profiles 
    WHERE id = p_user_id;
    
    -- Set limits based on plan
    v_limit := CASE v_plan
        WHEN 'starter' THEN 10
        WHEN 'pro' THEN 50
        WHEN 'team' THEN -1 -- unlimited
        ELSE 0
    END;
    
    RETURN v_limit = -1 OR v_current_month_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment snapshot usage
CREATE OR REPLACE FUNCTION increment_snapshot_usage(
    p_user_id UUID,
    p_count INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET monthly_snapshots_used = COALESCE(monthly_snapshots_used, 0) + p_count
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly snapshot usage
CREATE OR REPLACE FUNCTION reset_monthly_snapshot_usage() RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET 
        monthly_snapshots_used = 0,
        last_snapshot_reset_at = NOW()
    WHERE 
        last_snapshot_reset_at <= NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger for updated_at on edge_alerts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_edge_alerts_updated_at
    BEFORE UPDATE ON edge_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_feature_access(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_snapshot_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_snapshot_usage(UUID, INTEGER) TO authenticated;

-- 13. Create view for team management
CREATE OR REPLACE VIEW team_members_with_profiles AS
SELECT 
    tm.*,
    p.email,
    CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) AS full_name,
    p.profile_picture_url AS avatar_url
FROM team_members tm
JOIN auth.users u ON tm.user_id = u.id
JOIN profiles p ON p.id = u.id;

-- Grant access to the view
GRANT SELECT ON team_members_with_profiles TO authenticated;

-- 14. Add comments for documentation
COMMENT ON TABLE team_members IS 'Stores team member relationships for workspaces';
COMMENT ON TABLE edge_alerts IS 'Stores webhook configurations for real-time alerts';
COMMENT ON FUNCTION check_feature_access(UUID, TEXT) IS 'Checks if user has access to specific features based on subscription plan';
COMMENT ON FUNCTION check_snapshot_limit(UUID) IS 'Checks if user can create more snapshots based on monthly limits'; 