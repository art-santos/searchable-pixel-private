-- Create a secure function to delete agent credentials
CREATE OR REPLACE FUNCTION delete_agent_credentials(
  credential_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  agent_id_value UUID;
  affected_rows INTEGER;
BEGIN
  -- First, get the agent_id for this credential
  SELECT agent_id INTO agent_id_value
  FROM agent_credentials
  WHERE id = credential_id_param 
    AND user_id = user_id_param;
  
  -- If no agent_id found, credential doesn't exist or doesn't belong to user
  IF agent_id_value IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Delete the credential
  DELETE FROM agent_credentials
  WHERE id = credential_id_param
    AND user_id = user_id_param;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Return success if deletion was successful
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_agent_credentials TO service_role; 