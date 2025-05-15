-- Add connection status tracking to sites table
ALTER TABLE IF EXISTS sites 
ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS last_pinged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_ping_result JSONB;

-- Add index for querying by connection status
CREATE INDEX IF NOT EXISTS sites_connection_status_idx ON sites(connection_status);

-- Create view for connection statistics
CREATE OR REPLACE VIEW connection_stats AS
SELECT 
  connection_status,
  COUNT(*) as count,
  MAX(last_pinged_at) as latest_ping
FROM sites
GROUP BY connection_status;

-- Create function to verify all sites for a user
CREATE OR REPLACE FUNCTION verify_user_sites(user_id_param UUID)
RETURNS TABLE (site_id UUID, domain TEXT, status TEXT) AS $$
DECLARE
  site_record RECORD;
BEGIN
  FOR site_record IN 
    SELECT id, domain FROM sites WHERE user_id = user_id_param
  LOOP
    site_id := site_record.id;
    domain := site_record.domain;
    status := 'pending';
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_user_sites TO service_role; 