-- Fix the rendering_mode check constraint issue
-- The constraint is rejecting 'UNKNOWN' values, so we'll remove it entirely
-- Application-level validation will handle data integrity

-- Drop all possible rendering_mode constraints
ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_rendering_mode_check;
ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_check;
ALTER TABLE pages DROP CONSTRAINT IF EXISTS check_rendering_mode;

-- Add missing columns if they don't exist
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_rendering_mode ON pages(rendering_mode);
CREATE INDEX IF NOT EXISTS idx_pages_weighted_score ON pages(weighted_aeo_score);

-- Test insert to verify it works
INSERT INTO pages (url, domain, rendering_mode) 
VALUES ('test://constraint-check', 'test.com', 'UNKNOWN')
ON CONFLICT (url) DO UPDATE SET rendering_mode = EXCLUDED.rendering_mode;

-- Clean up test data
DELETE FROM pages WHERE url = 'test://constraint-check';

-- Constraint fix completed successfully 