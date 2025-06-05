-- Fix workspace assignment for existing crawler visits
-- This migration ensures all crawler visits are properly assigned to workspaces

-- First, ensure workspace_id column exists in crawler_visits
DO $$ 
BEGIN
    -- Check if workspace_id column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crawler_visits' 
        AND column_name = 'workspace_id'
    ) THEN
        ALTER TABLE crawler_visits 
        ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
        
        -- Create index for performance
        CREATE INDEX idx_crawler_visits_workspace_id ON crawler_visits(workspace_id);
    END IF;
END $$;

-- Function to safely get or create primary workspace for a user
CREATE OR REPLACE FUNCTION get_or_create_primary_workspace(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    workspace_uuid UUID;
    user_domain TEXT;
    user_workspace_name TEXT;
BEGIN
    -- Try to find existing primary workspace
    SELECT id INTO workspace_uuid 
    FROM workspaces 
    WHERE user_id = user_uuid AND is_primary = true 
    LIMIT 1;
    
    -- If found, return it
    IF workspace_uuid IS NOT NULL THEN
        RETURN workspace_uuid;
    END IF;
    
    -- If not found, get user's domain and workspace_name from profiles
    SELECT domain, workspace_name INTO user_domain, user_workspace_name
    FROM profiles 
    WHERE id = user_uuid;
    
    -- Create primary workspace with fallback values
    INSERT INTO workspaces (
        user_id, 
        domain, 
        workspace_name, 
        is_primary
    ) VALUES (
        user_uuid,
        COALESCE(user_domain, 'example.com'),
        COALESCE(user_workspace_name, 'Primary Workspace'),
        true
    ) 
    ON CONFLICT (user_id, domain) DO UPDATE SET 
        is_primary = true
    RETURNING id INTO workspace_uuid;
    
    RETURN workspace_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update all crawler_visits that don't have workspace_id set
DO $$
DECLARE
    rec RECORD;
    workspace_uuid UUID;
BEGIN
    -- Process each user who has crawler visits but no workspace assignment
    FOR rec IN 
        SELECT DISTINCT user_id 
        FROM crawler_visits 
        WHERE workspace_id IS NULL 
        AND user_id IS NOT NULL
    LOOP
        -- Get or create primary workspace for this user
        workspace_uuid := get_or_create_primary_workspace(rec.user_id);
        
        -- Update all their crawler visits
        UPDATE crawler_visits 
        SET workspace_id = workspace_uuid
        WHERE user_id = rec.user_id 
        AND workspace_id IS NULL;
        
        RAISE NOTICE 'Updated crawler visits for user % with workspace %', rec.user_id, workspace_uuid;
    END LOOP;
END $$;

-- Clean up function (optional, can be dropped later)
DROP FUNCTION IF EXISTS get_or_create_primary_workspace(UUID);

-- Add comment for documentation
COMMENT ON COLUMN crawler_visits.workspace_id IS 'Links crawler visits to specific workspaces for data isolation. NULL values are treated as legacy data filtered by user_id.'; 