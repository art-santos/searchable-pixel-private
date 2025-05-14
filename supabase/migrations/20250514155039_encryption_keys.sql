-- Create encryption_keys table
CREATE TABLE IF NOT EXISTS encryption_keys (
  id SERIAL PRIMARY KEY,
  key_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to get the current active encryption key
CREATE OR REPLACE FUNCTION get_active_encryption_key()
RETURNS TEXT AS $$
DECLARE
  active_key TEXT;
BEGIN
  SELECT key_value INTO active_key
  FROM encryption_keys
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN active_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policy for encryption_keys to be admin-only
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view encryption keys"
  ON encryption_keys FOR SELECT
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Only admins can insert encryption keys"
  ON encryption_keys FOR INSERT
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Only admins can update encryption keys"
  ON encryption_keys FOR UPDATE
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Insert an initial encryption key (in production, use a strong random key)
INSERT INTO encryption_keys (key_value, is_active)
VALUES ('6f3e4f1a8b2c9d6e7f3a2b1c8d9e4f5a6b3c8d9e4f5a6b3c8d9e4f5a', true);

-- Grant permissions to service role
GRANT EXECUTE ON FUNCTION get_active_encryption_key TO service_role; 