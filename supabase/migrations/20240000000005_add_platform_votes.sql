-- Create platform votes table
CREATE TABLE IF NOT EXISTS platform_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_hash TEXT, -- Hashed IP for rate limiting without storing actual IP
  
  -- Ensure one vote per user per platform
  UNIQUE(user_id, platform_id)
);

-- Create index for fast lookups
CREATE INDEX idx_platform_votes_platform ON platform_votes(platform_id);

-- Create view for vote counts
CREATE OR REPLACE VIEW platform_vote_counts AS
SELECT 
  platform_id,
  COUNT(*) as vote_count
FROM platform_votes
GROUP BY platform_id;

-- Enable RLS
ALTER TABLE platform_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own votes
CREATE POLICY "Users can vote for platforms" ON platform_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Anyone can view vote counts (through the view)
CREATE POLICY "Anyone can view platform votes" ON platform_votes
  FOR SELECT
  USING (true); 