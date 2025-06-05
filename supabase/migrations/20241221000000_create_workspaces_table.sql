-- Migration: Create workspaces table for multi-domain support
-- This enables users to have multiple isolated workspaces/domains

-- Create workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    workspace_name VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Workspace-specific settings
    favicon_url TEXT,
    workspace_settings JSONB DEFAULT '{}',
    
    CONSTRAINT unique_user_domain UNIQUE(user_id, domain)
);

-- Create indexes for performance
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_workspaces_domain ON workspaces(domain);

-- Ensure only one primary workspace per user using partial unique index
CREATE UNIQUE INDEX idx_workspaces_user_primary_unique 
ON workspaces(user_id) 
WHERE is_primary = true;

-- Enable RLS on workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own workspaces
CREATE POLICY "Users can view their own workspaces" ON workspaces
    FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policy: Users can insert their own workspaces
CREATE POLICY "Users can create their own workspaces" ON workspaces
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can update their own workspaces
CREATE POLICY "Users can update their own workspaces" ON workspaces
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policy: Users can delete their own workspaces (except primary)
CREATE POLICY "Users can delete their own non-primary workspaces" ON workspaces
    FOR DELETE USING (auth.uid() = user_id AND is_primary = false);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_workspaces_updated_at();

-- Migrate existing users to primary workspaces
-- Create primary workspace for users who have domain/workspace_name in profiles
INSERT INTO workspaces (user_id, domain, workspace_name, is_primary)
SELECT 
    p.id as user_id,
    COALESCE(p.domain, 'example.com') as domain,
    COALESCE(p.workspace_name, 'Primary Workspace') as workspace_name,
    true as is_primary
FROM profiles p
WHERE p.id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM workspaces w 
        WHERE w.user_id = p.id AND w.is_primary = true
    )
ON CONFLICT (user_id, domain) DO NOTHING;

-- Add workspace_id column to content tables (prepare for data isolation)
-- Note: We'll populate these in a separate migration to avoid blocking

-- crawler_visits (original crawler tracking table)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crawler_visits') THEN
        ALTER TABLE crawler_visits 
        ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
    END IF;
END $$;

-- ai_crawler_logs (newer billing/subscription tracking table)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_crawler_logs') THEN
        ALTER TABLE ai_crawler_logs 
        ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
    END IF;
END $$;

-- max_visibility_runs (check if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'max_visibility_runs') THEN
        ALTER TABLE max_visibility_runs 
        ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
    END IF;
END $$;

-- content_articles (check if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_articles') THEN
        ALTER TABLE content_articles 
        ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
    END IF;
END $$;

-- knowledge_base_items (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base_items') THEN
        ALTER TABLE knowledge_base_items 
        ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
    END IF;
END $$;

-- Create indexes for the new workspace_id columns (with existence checks)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crawler_visits') THEN
        CREATE INDEX idx_crawler_visits_workspace_id ON crawler_visits(workspace_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_crawler_logs') THEN
        CREATE INDEX idx_ai_crawler_logs_workspace_id ON ai_crawler_logs(workspace_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'max_visibility_runs') THEN
        CREATE INDEX idx_max_visibility_runs_workspace_id ON max_visibility_runs(workspace_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_articles') THEN
        CREATE INDEX idx_content_articles_workspace_id ON content_articles(workspace_id);
    END IF;
END $$;

-- Create an index on knowledge_base_items if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base_items') THEN
        CREATE INDEX idx_knowledge_base_items_workspace_id ON knowledge_base_items(workspace_id);
    END IF;
END $$;

-- Function to get user's primary workspace
CREATE OR REPLACE FUNCTION get_user_primary_workspace(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM workspaces 
        WHERE user_id = user_uuid AND is_primary = true 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Populate workspace_id for existing data with primary workspace
-- This links all existing user data to their primary workspace

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crawler_visits') THEN
        UPDATE crawler_visits 
        SET workspace_id = get_user_primary_workspace(user_id)
        WHERE workspace_id IS NULL AND user_id IS NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_crawler_logs') THEN
        UPDATE ai_crawler_logs 
        SET workspace_id = get_user_primary_workspace(user_id)
        WHERE workspace_id IS NULL AND user_id IS NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'max_visibility_runs') THEN
        UPDATE max_visibility_runs 
        SET workspace_id = get_user_primary_workspace(triggered_by)
        WHERE workspace_id IS NULL AND triggered_by IS NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_articles') THEN
        UPDATE content_articles 
        SET workspace_id = get_user_primary_workspace(user_id)
        WHERE workspace_id IS NULL AND user_id IS NOT NULL;
    END IF;
END $$;

-- Update knowledge_base_items if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base_items') THEN
        UPDATE knowledge_base_items 
        SET workspace_id = get_user_primary_workspace(created_by)
        WHERE workspace_id IS NULL AND created_by IS NOT NULL;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE workspaces IS 'Multi-domain workspaces for user accounts. Each workspace represents an isolated domain/project.';
COMMENT ON COLUMN workspaces.is_primary IS 'Indicates the primary workspace for a user. Each user must have exactly one primary workspace.';
COMMENT ON COLUMN workspaces.workspace_settings IS 'JSON settings specific to this workspace (crawler config, preferences, etc.)';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON workspaces TO authenticated;
-- Note: PostgreSQL auto-generates the sequence name as workspaces_id_seq, but we use gen_random_uuid() instead 