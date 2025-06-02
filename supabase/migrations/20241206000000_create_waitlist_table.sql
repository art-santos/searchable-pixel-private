-- Create waitlist table for early access signups
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  
  -- Website information
  website_url TEXT NOT NULL,
  hosting_platform TEXT NOT NULL,
  
  -- Metadata
  loops_submitted BOOLEAN DEFAULT FALSE,
  loops_submitted_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role can manage all waitlist entries
CREATE POLICY "Service role can manage waitlist" ON waitlist
  FOR ALL USING (auth.role() = 'service_role');

-- Public can insert into waitlist (for unauthenticated signups)
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Users can view their own waitlist entry
CREATE POLICY "Users can view own waitlist entry" ON waitlist
  FOR SELECT USING (email = auth.email());

-- Updated_at trigger
CREATE TRIGGER update_waitlist_updated_at 
  BEFORE UPDATE ON waitlist 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE waitlist IS 'Early access waitlist for new users';
COMMENT ON COLUMN waitlist.first_name IS 'User first name';
COMMENT ON COLUMN waitlist.last_name IS 'User last name';
COMMENT ON COLUMN waitlist.email IS 'User email address (unique)';
COMMENT ON COLUMN waitlist.website_url IS 'URL of the website they want to track';
COMMENT ON COLUMN waitlist.hosting_platform IS 'How their website is hosted (e.g., Vercel, Netlify, WordPress, etc.)';
COMMENT ON COLUMN waitlist.loops_submitted IS 'Whether the email has been submitted to Loops';
COMMENT ON COLUMN waitlist.loops_submitted_at IS 'When the email was submitted to Loops'; 