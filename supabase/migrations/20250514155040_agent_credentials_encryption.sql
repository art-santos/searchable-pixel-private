-- Modify the agent_credentials table to include encrypted secret if it doesn't exist
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

-- Create a secure API function to get agent secret
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

-- Create a function to create new agent credentials
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

-- Grant permissions to service role
GRANT EXECUTE ON FUNCTION create_agent_credentials TO service_role;
GRANT EXECUTE ON FUNCTION get_agent_secret TO service_role;
GRANT EXECUTE ON FUNCTION encrypt_secret TO service_role;
GRANT EXECUTE ON FUNCTION decrypt_secret TO service_role; 