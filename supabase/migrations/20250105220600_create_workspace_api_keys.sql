-- Migration: Create workspace_api_keys table
-- This enables workspace-level API keys for better isolation and management

-- Create workspace_api_keys table
CREATE TABLE workspace_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash for secure validation
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Workspace-specific permissions
    permissions JSONB DEFAULT '{"crawler_tracking": true, "read_data": true}'::jsonb,
    -- Optional metadata for tracking
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_workspace_api_keys_workspace_id ON workspace_api_keys(workspace_id);
CREATE INDEX idx_workspace_api_keys_api_key ON workspace_api_keys(api_key);
CREATE INDEX idx_workspace_api_keys_key_hash ON workspace_api_keys(key_hash);
CREATE INDEX idx_workspace_api_keys_is_active ON workspace_api_keys(is_active);

-- Enable RLS on workspace_api_keys table
ALTER TABLE workspace_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only workspace owners can manage their API keys

-- Policy: Users can view API keys for workspaces they own
CREATE POLICY "Users can view workspace API keys" ON workspace_api_keys
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = workspace_api_keys.workspace_id
            AND w.user_id = auth.uid()
        )
    );

-- Policy: Users can create API keys for workspaces they own
CREATE POLICY "Users can create workspace API keys" ON workspace_api_keys
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = workspace_api_keys.workspace_id
            AND w.user_id = auth.uid()
        )
    );

-- Policy: Users can update API keys for workspaces they own
CREATE POLICY "Users can update workspace API keys" ON workspace_api_keys
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = workspace_api_keys.workspace_id
            AND w.user_id = auth.uid()
        )
    );

-- Policy: Users can delete API keys for workspaces they own
CREATE POLICY "Users can delete workspace API keys" ON workspace_api_keys
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = workspace_api_keys.workspace_id
            AND w.user_id = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER trigger_update_workspace_api_keys_updated_at
    BEFORE UPDATE ON workspace_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_workspaces_updated_at();

-- Function to validate workspace API key (similar to existing validate_api_key)
CREATE OR REPLACE FUNCTION validate_workspace_api_key(p_key_hash TEXT)
RETURNS TABLE (
    workspace_id UUID,
    user_id UUID,
    is_valid BOOLEAN,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wak.workspace_id,
        w.user_id,
        wak.is_active,
        wak.permissions
    FROM workspace_api_keys wak
    JOIN workspaces w ON w.id = wak.workspace_id
    WHERE wak.key_hash = p_key_hash
        AND wak.is_active = true;
    
    -- Update last used timestamp (non-blocking)
    UPDATE workspace_api_keys
    SET last_used_at = NOW()
    WHERE workspace_api_keys.key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate either workspace or user API key (backwards compatibility)
CREATE OR REPLACE FUNCTION validate_any_api_key(p_key_hash TEXT)
RETURNS TABLE (
    user_id UUID,
    workspace_id UUID,
    is_valid BOOLEAN,
    key_type TEXT, -- 'workspace' or 'user'
    permissions JSONB
) AS $$
BEGIN
    -- First, check workspace API keys
    IF EXISTS (SELECT 1 FROM workspace_api_keys WHERE key_hash = p_key_hash AND is_active = true) THEN
        RETURN QUERY
        SELECT 
            w.user_id,
            wak.workspace_id,
            wak.is_active,
            'workspace'::TEXT,
            wak.permissions
        FROM workspace_api_keys wak
        JOIN workspaces w ON w.id = wak.workspace_id
        WHERE wak.key_hash = p_key_hash
            AND wak.is_active = true;
        
        -- Update last used timestamp
        UPDATE workspace_api_keys
        SET last_used_at = NOW()
        WHERE key_hash = p_key_hash;
    -- Fall back to user API keys
    ELSIF EXISTS (SELECT 1 FROM api_keys WHERE key_hash = p_key_hash AND is_active = true) THEN
        RETURN QUERY
        SELECT 
            ak.user_id,
            w.id as workspace_id, -- Use primary workspace for user keys
            ak.is_active,
            'user'::TEXT,
            '{"crawler_tracking": true, "read_data": true}'::JSONB -- Default permissions for user keys
        FROM api_keys ak
        LEFT JOIN workspaces w ON w.user_id = ak.user_id AND w.is_primary = true
        WHERE ak.key_hash = p_key_hash
            AND ak.is_active = true;
        
        -- Update last used timestamp
        UPDATE api_keys
        SET last_used_at = NOW()
        WHERE key_hash = p_key_hash;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TABLE workspace_api_keys IS 'API keys scoped to specific workspaces for better isolation and access control';
COMMENT ON COLUMN workspace_api_keys.permissions IS 'JSON object defining what operations this API key can perform';
COMMENT ON COLUMN workspace_api_keys.metadata IS 'Optional metadata for tracking purposes (e.g., created by, purpose, etc.)';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION validate_workspace_api_key TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_any_api_key TO anon, authenticated; 