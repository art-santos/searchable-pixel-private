-- Create companies table (already exists but adding for reference)
-- This table is used for onboarding and MAX Visibility analysis

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  root_url VARCHAR(255) NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Clean up duplicate companies before creating unique index
-- Keep one entry for each (company_name, submitted_by) combination
DELETE FROM companies 
WHERE id NOT IN (
  SELECT DISTINCT ON (company_name, submitted_by) id 
  FROM companies 
  ORDER BY company_name, submitted_by, id
);

-- Indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_companies_submitted_by ON companies(submitted_by);
CREATE INDEX IF NOT EXISTS idx_companies_root_url ON companies(root_url);

-- Create unique index only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_companies_name_user') THEN
    CREATE UNIQUE INDEX idx_companies_name_user ON companies(company_name, submitted_by);
  END IF;
END $$;

-- RLS policies for companies (if not exists)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can view own companies') THEN
    CREATE POLICY "Users can view own companies" ON companies
      FOR SELECT USING (submitted_by = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can create companies') THEN
    CREATE POLICY "Users can create companies" ON companies
      FOR INSERT WITH CHECK (submitted_by = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can update own companies') THEN
    CREATE POLICY "Users can update own companies" ON companies
      FOR UPDATE USING (submitted_by = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can delete own companies') THEN
    CREATE POLICY "Users can delete own companies" ON companies
      FOR DELETE USING (submitted_by = auth.uid());
  END IF;
END $$; 