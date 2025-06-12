-- Email Notifications System Migration
-- Adds email verification, password reset, and notification preferences

-- Add email preferences to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_weekly_email TIMESTAMP;

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens  
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email notification log (for tracking and debugging)
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'welcome', 'verification', 'password_reset', 'first_crawler', 'weekly_report'
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  resend_id TEXT, -- Resend email ID for tracking
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'failed'
  metadata JSONB -- Additional data like crawler name, stats, etc.
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_email_type ON email_notifications(email_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);

-- RLS Policies
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own email verifications
CREATE POLICY "Users can view own email verifications" ON email_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own password resets
CREATE POLICY "Users can view own password resets" ON password_resets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own email notifications
CREATE POLICY "Users can view own email notifications" ON email_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all records (for API operations)
CREATE POLICY "Service role can manage email verifications" ON email_verifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage password resets" ON password_resets
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage email notifications" ON email_notifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  -- Clean up expired email verification tokens
  DELETE FROM email_verifications WHERE expires_at < NOW();
  
  -- Clean up expired password reset tokens
  DELETE FROM password_resets WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has had first crawler detected
CREATE OR REPLACE FUNCTION user_has_first_crawler(user_uuid UUID)
RETURNS boolean AS $$
DECLARE
  has_crawler boolean := false;
BEGIN
  -- Check if user has any crawler visits in their workspaces
  SELECT EXISTS(
    SELECT 1 
    FROM crawler_visits cv
    JOIN workspaces w ON cv.workspace_id = w.id
    WHERE w.user_id = user_uuid
  ) INTO has_crawler;
  
  RETURN has_crawler;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if first crawler email was already sent
CREATE OR REPLACE FUNCTION first_crawler_email_sent(user_uuid UUID)
RETURNS boolean AS $$
DECLARE
  email_sent boolean := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM email_notifications 
    WHERE user_id = user_uuid 
    AND email_type = 'first_crawler'
  ) INTO email_sent;
  
  RETURN email_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 