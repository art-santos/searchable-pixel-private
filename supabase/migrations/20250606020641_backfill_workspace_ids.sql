-- Migration: Backfill workspace_ids for existing data
-- This ensures each workspace has isolated data

-- Function to find workspace by company domain
CREATE OR REPLACE FUNCTION find_workspace_by_company(company_uuid UUID)
RETURNS UUID AS $$
DECLARE
    workspace_uuid UUID;
    company_domain TEXT;
BEGIN
    -- Get the company's domain
    SELECT 
        CASE 
            WHEN root_url LIKE 'https://%' THEN substring(root_url from 9)
            WHEN root_url LIKE 'http://%' THEN substring(root_url from 8)
            ELSE root_url
        END INTO company_domain
    FROM companies 
    WHERE id = company_uuid;
    
    -- Find workspace with matching domain
    SELECT id INTO workspace_uuid
    FROM workspaces
    WHERE domain = company_domain
    OR domain = REPLACE(company_domain, 'www.', '')
    OR domain = 'www.' || company_domain
    LIMIT 1;
    
    RETURN workspace_uuid;
END;
$$ LANGUAGE plpgsql;

-- Backfill max_visibility_runs with workspace_id based on company domain
DO $$ 
DECLARE
    updated_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'max_visibility_runs') THEN
        -- Update runs where workspace_id is null but we can determine it from company
        WITH workspace_matches AS (
            SELECT 
                mvr.id as run_id,
                find_workspace_by_company(mvr.company_id) as matched_workspace_id
            FROM max_visibility_runs mvr
            WHERE mvr.workspace_id IS NULL 
            AND mvr.company_id IS NOT NULL
        )
        UPDATE max_visibility_runs
        SET workspace_id = wm.matched_workspace_id
        FROM workspace_matches wm
        WHERE max_visibility_runs.id = wm.run_id
        AND wm.matched_workspace_id IS NOT NULL;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % max_visibility_runs with workspace_id', updated_count;
        
        -- For any remaining runs without workspace_id, assign to user's primary workspace
        WITH primary_workspace_matches AS (
            SELECT 
                mvr.id as run_id,
                w.id as workspace_id
            FROM max_visibility_runs mvr
            JOIN workspaces w ON w.user_id = mvr.triggered_by AND w.is_primary = true
            WHERE mvr.workspace_id IS NULL 
            AND mvr.triggered_by IS NOT NULL
        )
        UPDATE max_visibility_runs
        SET workspace_id = pwm.workspace_id
        FROM primary_workspace_matches pwm
        WHERE max_visibility_runs.id = pwm.run_id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % additional max_visibility_runs with primary workspace_id', updated_count;
    END IF;
END $$;

-- Backfill knowledge_base_items if not already done
DO $$ 
DECLARE
    updated_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base_items') THEN
        -- First try to match by company domain
        WITH workspace_matches AS (
            SELECT 
                kbi.id as item_id,
                find_workspace_by_company(kbi.company_id) as matched_workspace_id
            FROM knowledge_base_items kbi
            WHERE kbi.workspace_id IS NULL 
            AND kbi.company_id IS NOT NULL
        )
        UPDATE knowledge_base_items
        SET workspace_id = wm.matched_workspace_id
        FROM workspace_matches wm
        WHERE knowledge_base_items.id = wm.item_id
        AND wm.matched_workspace_id IS NOT NULL;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % knowledge_base_items with workspace_id', updated_count;
        
        -- Fallback to primary workspace for remaining items
        UPDATE knowledge_base_items 
        SET workspace_id = get_user_primary_workspace(created_by)
        WHERE workspace_id IS NULL AND created_by IS NOT NULL;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % additional knowledge_base_items with primary workspace_id', updated_count;
    END IF;
END $$;

-- Backfill articles table
DO $$ 
DECLARE
    updated_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles') THEN
        UPDATE articles 
        SET workspace_id = get_user_primary_workspace(user_id)
        WHERE workspace_id IS NULL AND user_id IS NOT NULL;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % articles with workspace_id', updated_count;
    END IF;
END $$;

-- Create indexes for better performance on workspace queries
DO $$ 
BEGIN
    -- Index for finding runs by workspace
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_max_visibility_runs_workspace_company'
    ) THEN
        CREATE INDEX idx_max_visibility_runs_workspace_company 
        ON max_visibility_runs(workspace_id, company_id);
    END IF;
    
    -- Index for finding knowledge base items by workspace
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base_items') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_knowledge_base_items_workspace_company'
        ) THEN
            CREATE INDEX idx_knowledge_base_items_workspace_company 
            ON knowledge_base_items(workspace_id, company_id);
        END IF;
    END IF;
END $$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS find_workspace_by_company(UUID);

-- Add comment for documentation
COMMENT ON COLUMN max_visibility_runs.workspace_id IS 'Associates visibility scan with a specific workspace for data isolation';
