-- Create page_checklist_results table
CREATE TABLE IF NOT EXISTS page_checklist_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  check_id text NOT NULL,
  check_name text NOT NULL,
  category text NOT NULL,
  weight decimal NOT NULL,
  passed boolean NOT NULL,
  details text,
  rule_parameters jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_page_checklist_results_page_id ON page_checklist_results(page_id);
CREATE INDEX IF NOT EXISTS idx_page_checklist_results_category ON page_checklist_results(category);

-- Drop existing view if it exists, then create table
DROP VIEW IF EXISTS page_audit_overview;

-- Create page_audit_overview table  
CREATE TABLE page_audit_overview (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE UNIQUE,
  aeo_score integer,
  weighted_aeo_score integer,
  rendering_mode text,
  ssr_score_penalty integer,
  total_issues integer DEFAULT 0,
  critical_issues integer DEFAULT 0,
  warning_issues integer DEFAULT 0,
  total_recommendations integer DEFAULT 0,
  checklist_items_evaluated integer DEFAULT 0,
  checklist_items_passed integer DEFAULT 0,
  total_possible_points decimal DEFAULT 0,
  earned_points decimal DEFAULT 0,
  category_scores jsonb,
  analysis_metadata jsonb,
  analyzed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_page_audit_overview_page_id ON page_audit_overview(page_id);

-- Add comment explaining the tables
COMMENT ON TABLE page_checklist_results IS 'Stores individual checklist item results for comprehensive 55-item technical audits';
COMMENT ON TABLE page_audit_overview IS 'Stores summary data for page audits including scores and metadata (replaced previous view with table for better performance)'; 