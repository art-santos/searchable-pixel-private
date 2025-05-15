-- Function to update an agent's secret
CREATE OR REPLACE FUNCTION update_agent_secret(
  credential_id_param UUID,
  agent_secret_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INT;
BEGIN
  UPDATE agent_credentials
  SET 
    agent_secret_hash = encode(digest(agent_secret_param, 'sha256'), 'hex'),
    agent_secret_encrypted = encrypt_secret(agent_secret_param),
    updated_at = now()
  WHERE 
    id = credential_id_param
    AND user_id = auth.uid()
  RETURNING 1 INTO affected_rows;
  
  -- Return true if we updated a row, false otherwise
  RETURN affected_rows = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to service role
GRANT EXECUTE ON FUNCTION update_agent_secret TO service_role;
