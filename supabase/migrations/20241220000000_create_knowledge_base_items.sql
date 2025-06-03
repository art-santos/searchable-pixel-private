-- Create knowledge_base_items table
CREATE TABLE knowledge_base_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tag VARCHAR(50) NOT NULL,
  word_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2) DEFAULT NULL, -- AI confidence in categorization
  source_context TEXT DEFAULT NULL, -- Original text context this was extracted from
  extraction_batch_id UUID DEFAULT NULL, -- Groups items extracted together
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_knowledge_base_company_id ON knowledge_base_items(company_id);
CREATE INDEX idx_knowledge_base_tag ON knowledge_base_items(tag);
CREATE INDEX idx_knowledge_base_created_at ON knowledge_base_items(created_at);
CREATE INDEX idx_knowledge_base_extraction_batch ON knowledge_base_items(extraction_batch_id);

-- Full text search index
CREATE INDEX idx_knowledge_base_content_search ON knowledge_base_items 
USING gin(to_tsvector('english', content));

-- Update max_visibility_runs table to track knowledge base usage
ALTER TABLE max_visibility_runs ADD COLUMN IF NOT EXISTS knowledge_base_version INTEGER DEFAULT 0;
ALTER TABLE max_visibility_runs ADD COLUMN IF NOT EXISTS knowledge_items_count INTEGER DEFAULT 0;
ALTER TABLE max_visibility_runs ADD COLUMN IF NOT EXISTS context_completeness_score DECIMAL(3,2) DEFAULT 0;

-- RLS policies for knowledge_base_items
ALTER TABLE knowledge_base_items ENABLE ROW LEVEL SECURITY;

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