-- Migration: Add domain change tracking and restrictions
-- This enables domain switching with a 7-day cooldown

-- Add domain change tracking column to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS last_domain_change TIMESTAMPTZ;

-- Set initial value for existing workspaces (allow immediate first change)
UPDATE workspaces 
SET last_domain_change = created_at 
WHERE last_domain_change IS NULL;

-- Create domain change history table for audit trail
CREATE TABLE IF NOT EXISTS workspace_domain_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_domain VARCHAR(255),
    new_domain VARCHAR(255) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Index for performance
    CONSTRAINT fk_workspace_domain_changes_workspace 
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_workspace_domain_changes_user 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workspace_domain_changes_workspace_id ON workspace_domain_changes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_domain_changes_user_id ON workspace_domain_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_domain_changes_changed_at ON workspace_domain_changes(changed_at);

-- Enable RLS
ALTER TABLE workspace_domain_changes ENABLE ROW LEVEL SECURITY;

-- RLS policies for domain change history
CREATE POLICY "Users can view their own domain change history" ON workspace_domain_changes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domain changes" ON workspace_domain_changes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to check if domain change is allowed (7-day cooldown)
CREATE OR REPLACE FUNCTION can_change_domain(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_change TIMESTAMPTZ;
BEGIN
    -- Get the last domain change timestamp
    SELECT last_domain_change INTO last_change
    FROM workspaces
    WHERE id = p_workspace_id;
    
    -- If no previous change recorded, allow change
    IF last_change IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if 7 days have passed since last change
    RETURN (NOW() - last_change) >= INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get days until next allowed domain change
CREATE OR REPLACE FUNCTION days_until_domain_change(p_workspace_id UUID)
RETURNS INTEGER AS $$
DECLARE
    last_change TIMESTAMPTZ;
    days_remaining INTEGER;
BEGIN
    -- Get the last domain change timestamp
    SELECT last_domain_change INTO last_change
    FROM workspaces
    WHERE id = p_workspace_id;
    
    -- If no previous change recorded, can change immediately
    IF last_change IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate days remaining in cooldown period
    days_remaining := 7 - EXTRACT(days FROM (NOW() - last_change))::INTEGER;
    
    -- Return 0 if cooldown has passed, otherwise return days remaining
    RETURN GREATEST(0, days_remaining);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to log domain changes
CREATE OR REPLACE FUNCTION log_domain_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if domain actually changed
    IF OLD.domain IS DISTINCT FROM NEW.domain THEN
        -- Update the last_domain_change timestamp
        NEW.last_domain_change = NOW();
        
        -- Insert into audit log
        INSERT INTO workspace_domain_changes (
            workspace_id,
            user_id,
            old_domain,
            new_domain,
            changed_at
        ) VALUES (
            NEW.id,
            NEW.user_id,
            OLD.domain,
            NEW.domain,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for domain change logging
DROP TRIGGER IF EXISTS trigger_log_domain_change ON workspaces;
CREATE TRIGGER trigger_log_domain_change
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION log_domain_change();

-- Grant permissions
GRANT SELECT ON workspace_domain_changes TO authenticated;
GRANT EXECUTE ON FUNCTION can_change_domain(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION days_until_domain_change(UUID) TO authenticated;

-- Add comments
COMMENT ON COLUMN workspaces.last_domain_change IS 'Timestamp of the last domain change for this workspace (used for 7-day cooldown)';
COMMENT ON TABLE workspace_domain_changes IS 'Audit trail for workspace domain changes with 7-day cooldown enforcement';
COMMENT ON FUNCTION can_change_domain(UUID) IS 'Check if workspace can change domain (7-day cooldown)';
COMMENT ON FUNCTION days_until_domain_change(UUID) IS 'Get days remaining until domain can be changed again'; 