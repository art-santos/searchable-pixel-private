-- Fix knowledge_base_items RLS policies to use correct column name

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own company knowledge items" ON knowledge_base_items;
DROP POLICY IF EXISTS "Users can insert own company knowledge items" ON knowledge_base_items;
DROP POLICY IF EXISTS "Users can update own company knowledge items" ON knowledge_base_items;
DROP POLICY IF EXISTS "Users can delete own company knowledge items" ON knowledge_base_items;

-- Recreate policies with correct column name (submitted_by instead of created_by)

-- Users can only see knowledge items for their own company
CREATE POLICY "Users can view own company knowledge items" ON knowledge_base_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = knowledge_base_items.company_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- Users can insert knowledge items for their own company
CREATE POLICY "Users can insert own company knowledge items" ON knowledge_base_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = knowledge_base_items.company_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- Users can update knowledge items for their own company
CREATE POLICY "Users can update own company knowledge items" ON knowledge_base_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = knowledge_base_items.company_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- Users can delete knowledge items for their own company
CREATE POLICY "Users can delete own company knowledge items" ON knowledge_base_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = knowledge_base_items.company_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- Ensure columns exist on max_visibility_runs table (may already exist)
ALTER TABLE max_visibility_runs ADD COLUMN IF NOT EXISTS knowledge_base_version INTEGER DEFAULT 0;
ALTER TABLE max_visibility_runs ADD COLUMN IF NOT EXISTS knowledge_items_count INTEGER DEFAULT 0;
ALTER TABLE max_visibility_runs ADD COLUMN IF NOT EXISTS context_completeness_score DECIMAL(3,2) DEFAULT 0; 