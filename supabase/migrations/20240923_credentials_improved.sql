-- Improve the agent_credentials table by adding a secure way to retrieve secrets
-- This approach involves:
-- 1. Storing a hash for verification
-- 2. Using pgcrypto for encryption of the actual secret
-- 3. Adding key rotation capability

-- First, ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a table to store encryption keys
CREATE TABLE IF NOT EXISTS encryption_keys (
  id SERIAL PRIMARY KEY,
  key_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

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

-- Modify the agent_credentials table to include encrypted secret
ALTER TABLE IF EXISTS agent_credentials 
ADD COLUMN IF NOT EXISTS agent_secret_encrypted BYTEA;

-- Create a function to encrypt agent secrets
CREATE OR REPLACE FUNCTION encrypt_secret(secret TEXT)
RETURNS BYTEA AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := get_active_encryption_key();
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'No active encryption key found';
  END IF;
  
  RETURN pgp_sym_encrypt(secret, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to decrypt agent secrets
CREATE OR REPLACE FUNCTION decrypt_secret(encrypted_secret BYTEA)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := get_active_encryption_key();
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'No active encryption key found';
  END IF;
  
  RETURN pgp_sym_decrypt(encrypted_secret, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure API function to get agent secret (only accessible by authorized API endpoints)
CREATE OR REPLACE FUNCTION get_agent_secret(agent_id_param UUID, user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  secret_value TEXT;
  is_authorized BOOLEAN;
BEGIN
  -- Check if the user is authorized to access this agent's secret
  SELECT EXISTS (
    SELECT 1 FROM agent_credentials 
    WHERE agent_id = agent_id_param AND user_id = user_id_param
  ) INTO is_authorized;
  
  IF NOT is_authorized THEN
    RETURN NULL;
  END IF;
  
  -- Get the encrypted secret
  SELECT decrypt_secret(agent_secret_encrypted) INTO secret_value
  FROM agent_credentials
  WHERE agent_id = agent_id_param;
  
  RETURN secret_value;
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
-- IMPORTANT: Store this key securely in your backend environment as well!
INSERT INTO encryption_keys (key_value)
VALUES ('placeholder_encryption_key_change_in_production');

-- Create a function to create new agent credentials with both hash and encrypted secret
CREATE OR REPLACE FUNCTION create_agent_credentials(
  domain_param TEXT,
  user_id_param UUID,
  agent_id_param UUID,
  agent_secret_param TEXT
)
RETURNS UUID AS $$
DECLARE
  inserted_id UUID;
BEGIN
  INSERT INTO agent_credentials (
    domain,
    user_id,
    agent_id,
    agent_secret_hash,
    agent_secret_encrypted
  )
  VALUES (
    domain_param,
    user_id_param,
    agent_id_param,
    encode(digest(agent_secret_param, 'sha256'), 'hex'),
    encrypt_secret(agent_secret_param)
  )
  RETURNING id INTO inserted_id;
  
  RETURN inserted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 