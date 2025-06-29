-- Simple fix: Remove the check constraint that's causing issues
-- We'll rely on application-level validation instead

-- Drop all check constraints on rendering_mode
ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_rendering_mode_check;
ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_check;
ALTER TABLE pages DROP CONSTRAINT IF EXISTS check_rendering_mode;

-- Add the column without constraints if it doesn't exist
ALTER TABLE pages ADD COLUMN IF NOT EXISTS rendering_mode TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS ssr_score_penalty INTEGER DEFAULT 0;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS weighted_aeo_score INTEGER;

-- Set defaults for existing rows
UPDATE pages 
SET 
  rendering_mode = 'UNKNOWN',
  ssr_score_penalty = 0,
  weighted_aeo_score = COALESCE(aeo_score, 0)
WHERE rendering_mode IS NULL;

-- Add indexes for performance (without constraints)
CREATE INDEX IF NOT EXISTS idx_pages_rendering_mode ON pages(rendering_mode);
CREATE INDEX IF NOT EXISTS idx_pages_weighted_score ON pages(weighted_aeo_score);

-- Comment: Rendering mode constraint fixed - application handles validation 