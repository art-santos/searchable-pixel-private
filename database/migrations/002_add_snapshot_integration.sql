-- Migration: 002_add_snapshot_integration.sql
-- Adds snapshot integration to project_urls and updates status values

-- Add snapshot-related columns to project_urls table
ALTER TABLE project_urls 
ADD COLUMN IF NOT EXISTS snapshot_id UUID REFERENCES snapshot_requests(id),
ADD COLUMN IF NOT EXISTS visibility_score INTEGER CHECK (visibility_score >= 0 AND visibility_score <= 100),
ADD COLUMN IF NOT EXISTS technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
ADD COLUMN IF NOT EXISTS combined_score INTEGER CHECK (combined_score >= 0 AND combined_score <= 100),
ADD COLUMN IF NOT EXISTS issues_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS topic TEXT;

-- Update status values to match the frontend expectations
-- First, create the new constraint
ALTER TABLE project_urls DROP CONSTRAINT IF EXISTS project_urls_status_check;
ALTER TABLE project_urls ADD CONSTRAINT project_urls_status_check 
  CHECK (status IN ('pending', 'processing', 'analyzed', 'failed'));

-- Update existing status values to match new schema
UPDATE project_urls SET status = 'analyzed' WHERE status = 'complete';
UPDATE project_urls SET status = 'failed' WHERE status = 'error';
UPDATE project_urls SET status = 'processing' WHERE status = 'analyzing';

-- Add project_id column to snapshot_requests table if it doesn't exist
ALTER TABLE snapshot_requests 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_urls_snapshot_id ON project_urls(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_project_urls_status_analyzed ON project_urls(status) WHERE status = 'analyzed';
CREATE INDEX IF NOT EXISTS idx_snapshot_requests_project_id ON snapshot_requests(project_id);

-- Create a function to update project URLs when snapshots complete
CREATE OR REPLACE FUNCTION update_project_url_on_snapshot_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if snapshot is completed and has a project_id
  IF NEW.status = 'completed' AND NEW.project_id IS NOT NULL AND OLD.status != 'completed' THEN
    -- Update the corresponding project URL
    UPDATE project_urls 
    SET 
      status = 'analyzed',
      snapshot_id = NEW.id,
      last_analyzed = NEW.completed_at
    WHERE project_id = NEW.project_id 
      AND url = ANY(NEW.urls)
      AND status = 'processing';
  END IF;
  
  -- If snapshot failed, mark project URL as failed
  IF NEW.status = 'failed' AND NEW.project_id IS NOT NULL AND OLD.status != 'failed' THEN
    UPDATE project_urls 
    SET status = 'failed'
    WHERE project_id = NEW.project_id 
      AND url = ANY(NEW.urls)
      AND status = 'processing';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update project URLs when snapshots complete
DROP TRIGGER IF EXISTS trigger_update_project_url_on_snapshot_completion ON snapshot_requests;
CREATE TRIGGER trigger_update_project_url_on_snapshot_completion
  AFTER UPDATE ON snapshot_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_project_url_on_snapshot_completion();

-- Function to update project URL scores when snapshot summaries are created
CREATE OR REPLACE FUNCTION update_project_url_scores()
RETURNS TRIGGER AS $$
DECLARE
  project_url_record RECORD;
  combined_score_value INTEGER;
BEGIN
  -- Find the project URL for this snapshot summary
  SELECT pu.* INTO project_url_record
  FROM project_urls pu
  JOIN snapshot_requests sr ON pu.snapshot_id = sr.id
  WHERE sr.id = NEW.request_id 
    AND pu.url = NEW.url;
  
  IF FOUND THEN
    -- Calculate combined score (40% visibility, 60% technical)
    -- For now, just use visibility score since technical scoring is complex
    combined_score_value := NEW.visibility_score;
    
    -- Update the project URL with scores
    UPDATE project_urls 
    SET 
      visibility_score = NEW.visibility_score,
      combined_score = combined_score_value,
      topic = (SELECT topic FROM snapshot_requests WHERE id = NEW.request_id)
    WHERE id = project_url_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update scores when snapshot summaries are created
DROP TRIGGER IF EXISTS trigger_update_project_url_scores ON snapshot_summaries;
CREATE TRIGGER trigger_update_project_url_scores
  AFTER INSERT ON snapshot_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_project_url_scores();

-- Comments for documentation
COMMENT ON COLUMN project_urls.snapshot_id IS 'Reference to the snapshot request that analyzed this URL';
COMMENT ON COLUMN project_urls.visibility_score IS 'AI visibility score (0-100) from the latest snapshot';
COMMENT ON COLUMN project_urls.technical_score IS 'Technical audit score (0-100) from the latest analysis';
COMMENT ON COLUMN project_urls.combined_score IS 'Combined score calculated from visibility and technical scores';
COMMENT ON COLUMN project_urls.issues_count IS 'Number of technical issues found in the latest analysis';
COMMENT ON COLUMN project_urls.topic IS 'The topic used for the latest AI visibility test';
COMMENT ON COLUMN snapshot_requests.project_id IS 'Reference to the project this snapshot belongs to (for inline mode)'; 