-- Add columns for enhanced question system
-- This supports the new 40-question system with weighted scoring

-- Add question_type and weight to snapshot_questions table
ALTER TABLE snapshot_questions 
ADD COLUMN IF NOT EXISTS question_type text,
ADD COLUMN IF NOT EXISTS weight integer;

-- Add question_type and question_weight to visibility_results table
ALTER TABLE visibility_results 
ADD COLUMN IF NOT EXISTS question_type text,
ADD COLUMN IF NOT EXISTS question_weight integer;

-- Add indexes for better performance on the new columns
CREATE INDEX IF NOT EXISTS idx_snapshot_questions_type ON snapshot_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_visibility_results_type ON visibility_results(question_type);

-- Add comments for documentation
COMMENT ON COLUMN snapshot_questions.question_type IS 'Type of question: direct, indirect, or comparison';
COMMENT ON COLUMN snapshot_questions.weight IS 'Weight value for scoring: 1=direct, 2=indirect, 3=comparison';
COMMENT ON COLUMN visibility_results.question_type IS 'Type of question that generated this result';
COMMENT ON COLUMN visibility_results.question_weight IS 'Weight value for scoring calculation';
