-- Add interests column to waitlist table
ALTER TABLE waitlist 
ADD COLUMN interests TEXT[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN waitlist.interests IS 'Array of user interests for early access (multi-select)'; 