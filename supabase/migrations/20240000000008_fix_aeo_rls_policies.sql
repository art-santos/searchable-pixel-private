-- Fix RLS policies for AEO tables to allow server-side insertions
-- This migration updates the RLS policies to work with both client-side and server-side operations

-- Drop ALL existing policies on AEO tables to avoid conflicts
DROP POLICY IF EXISTS "Owner can view questions" ON aeo_questions;
DROP POLICY IF EXISTS "Owner can view results" ON aeo_results;
DROP POLICY IF EXISTS "Owner can manage runs" ON aeo_runs;
DROP POLICY IF EXISTS "Users can view their company runs" ON aeo_runs;
DROP POLICY IF EXISTS "Users can create runs for their companies" ON aeo_runs;
DROP POLICY IF EXISTS "Users can update their company runs" ON aeo_runs;
DROP POLICY IF EXISTS "Users can view questions for their runs" ON aeo_questions;
DROP POLICY IF EXISTS "Users can create questions for their runs" ON aeo_questions;
DROP POLICY IF EXISTS "Users can view results for their questions" ON aeo_results;
DROP POLICY IF EXISTS "Users can create results for their questions" ON aeo_results;
DROP POLICY IF EXISTS "Service role full access to aeo_runs" ON aeo_runs;
DROP POLICY IF EXISTS "Service role full access to aeo_questions" ON aeo_questions;
DROP POLICY IF EXISTS "Service role full access to aeo_results" ON aeo_results;

-- aeo_runs policies
-- Allow authenticated users to view runs for companies they submitted
CREATE POLICY "Users can view their company runs" ON aeo_runs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = aeo_runs.company_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- Allow authenticated users to insert runs for companies they own
CREATE POLICY "Users can create runs for their companies" ON aeo_runs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- Allow authenticated users to update runs for companies they own
CREATE POLICY "Users can update their company runs" ON aeo_runs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = aeo_runs.company_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- aeo_questions policies  
-- Allow authenticated users to view questions for runs of companies they own
CREATE POLICY "Users can view questions for their runs" ON aeo_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM aeo_runs 
      JOIN companies ON companies.id = aeo_runs.company_id
      WHERE aeo_runs.id = aeo_questions.run_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- Allow authenticated users to insert questions for runs of companies they own
CREATE POLICY "Users can create questions for their runs" ON aeo_questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aeo_runs 
      JOIN companies ON companies.id = aeo_runs.company_id
      WHERE aeo_runs.id = run_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- aeo_results policies
-- Allow authenticated users to view results for questions in runs of companies they own
CREATE POLICY "Users can view results for their questions" ON aeo_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM aeo_questions 
      JOIN aeo_runs ON aeo_runs.id = aeo_questions.run_id
      JOIN companies ON companies.id = aeo_runs.company_id
      WHERE aeo_questions.id = aeo_results.question_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- Allow authenticated users to insert results for questions in runs of companies they own
CREATE POLICY "Users can create results for their questions" ON aeo_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aeo_questions 
      JOIN aeo_runs ON aeo_runs.id = aeo_questions.run_id
      JOIN companies ON companies.id = aeo_runs.company_id
      WHERE aeo_questions.id = question_id 
      AND companies.submitted_by = auth.uid()
    )
  );

-- CRITICAL: Add service role bypass policies for server-side operations
-- These policies allow the service role to bypass RLS for server-side insertions

-- Service role can do anything with aeo_runs
CREATE POLICY "Service role full access to aeo_runs" ON aeo_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role can do anything with aeo_questions  
CREATE POLICY "Service role full access to aeo_questions" ON aeo_questions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role can do anything with aeo_results
CREATE POLICY "Service role full access to aeo_results" ON aeo_results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled on all tables
ALTER TABLE aeo_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_results ENABLE ROW LEVEL SECURITY; 