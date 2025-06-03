-- Add progress tracking columns to max_visibility_runs table
-- This enables real-time progress updates from the pipeline

ALTER TABLE max_visibility_runs 
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN IF NOT EXISTS progress_stage TEXT DEFAULT 'setup',
ADD COLUMN IF NOT EXISTS progress_message TEXT DEFAULT '';

-- Add index for progress queries
CREATE INDEX IF NOT EXISTS idx_max_runs_progress ON max_visibility_runs(status, progress_percentage);

-- Add comment for documentation
COMMENT ON COLUMN max_visibility_runs.progress_percentage IS 'Real-time progress percentage (0-100) from pipeline';
COMMENT ON COLUMN max_visibility_runs.progress_stage IS 'Current pipeline stage: setup, questions, analysis, scoring, complete, error';
COMMENT ON COLUMN max_visibility_runs.progress_message IS 'Human-readable progress message for UI display'; 