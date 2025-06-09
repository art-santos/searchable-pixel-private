-- Migration: Workspace Deletion System
-- Adds tables and functions for safe workspace deletion with audit trail

-- 1. Create workspace deletion log table
CREATE TABLE IF NOT EXISTS workspace_deletion_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL, -- Don't reference workspaces since it's deleted
    domain TEXT NOT NULL,
    workspace_name TEXT NOT NULL,
    reason TEXT DEFAULT 'user_deletion' CHECK (reason IN (
        'user_deletion', 
        'plan_downgrade', 
        'addon_removal', 
        'billing_failure', 
        'admin_deletion'
    )),
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_deletion_log_user_id ON workspace_deletion_log(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_deletion_log_deleted_at ON workspace_deletion_log(deleted_at);

-- 3. Enable RLS on workspace deletion log
ALTER TABLE workspace_deletion_log ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy for workspace deletion log
CREATE POLICY "Users can view their own deletion logs" ON workspace_deletion_log
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Function to get workspace allocation for a user
CREATE OR REPLACE FUNCTION get_workspace_allocation(p_user_id UUID)
RETURNS TABLE (
    plan TEXT,
    included_workspaces INTEGER,
    extra_domain_addons INTEGER,
    total_allowed_workspaces INTEGER,
    current_workspaces INTEGER,
    available_slots INTEGER,
    requires_deletion INTEGER
) AS $$
DECLARE
    v_plan TEXT;
    v_included INTEGER;
    v_addons INTEGER;
    v_current INTEGER;
BEGIN
    -- Get user's plan
    SELECT subscription_plan INTO v_plan 
    FROM profiles 
    WHERE id = p_user_id;
    
    -- Set included workspaces based on plan
    v_included := CASE v_plan
        WHEN 'starter' THEN 1
        WHEN 'pro' THEN 1
        WHEN 'team' THEN 5
        ELSE 1
    END;
    
    -- Get extra domain add-ons
    SELECT COALESCE(SUM(quantity), 0) INTO v_addons
    FROM subscription_add_ons
    WHERE user_id = p_user_id 
    AND add_on_type = 'extra_domains'
    AND is_active = true;
    
    -- Get current workspace count
    SELECT COUNT(*) INTO v_current
    FROM workspaces
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT
        v_plan,
        v_included,
        v_addons,
        v_included + v_addons,
        v_current,
        GREATEST(0, (v_included + v_addons) - v_current),
        GREATEST(0, v_current - (v_included + v_addons));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to validate plan change and return required deletions
CREATE OR REPLACE FUNCTION validate_plan_change(
    p_user_id UUID,
    p_new_plan TEXT
) RETURNS TABLE (
    can_change BOOLEAN,
    workspaces_to_delete INTEGER,
    warning_message TEXT
) AS $$
DECLARE
    v_current_workspaces INTEGER;
    v_new_included INTEGER;
    v_current_addons INTEGER;
    v_excess INTEGER;
BEGIN
    -- Get current workspace count
    SELECT COUNT(*) INTO v_current_workspaces
    FROM workspaces
    WHERE user_id = p_user_id;
    
    -- Get current extra domain add-ons
    SELECT COALESCE(SUM(quantity), 0) INTO v_current_addons
    FROM subscription_add_ons
    WHERE user_id = p_user_id 
    AND add_on_type = 'extra_domains'
    AND is_active = true;
    
    -- Calculate new plan included workspaces
    v_new_included := CASE p_new_plan
        WHEN 'starter' THEN 1
        WHEN 'pro' THEN 1
        WHEN 'team' THEN 5
        ELSE 1
    END;
    
    -- Calculate excess workspaces
    v_excess := v_current_workspaces - (v_new_included + v_current_addons);
    
    IF v_excess <= 0 THEN
        RETURN QUERY SELECT
            true,
            0,
            'Plan change allowed without workspace deletion';
    ELSE
        RETURN QUERY SELECT
            false,
            v_excess,
            format('You have %s workspaces but the new plan allows %s + %s add-ons = %s total. You need to delete %s workspace%s.',
                v_current_workspaces,
                v_new_included,
                v_current_addons,
                v_new_included + v_current_addons,
                v_excess,
                CASE WHEN v_excess > 1 THEN 's' ELSE '' END
            );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant necessary permissions
GRANT SELECT ON workspace_deletion_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_workspace_allocation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_plan_change(UUID, TEXT) TO authenticated;

-- 8. Add comments for documentation
COMMENT ON TABLE workspace_deletion_log IS 'Audit trail for deleted workspaces';
COMMENT ON FUNCTION get_workspace_allocation(UUID) IS 'Get workspace allocation breakdown for a user';
COMMENT ON FUNCTION validate_plan_change(UUID, TEXT) IS 'Validate if a plan change is allowed and calculate required deletions'; 