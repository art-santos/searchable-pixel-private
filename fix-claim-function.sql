-- Fix the ambiguous column reference in claim_next_snapshot function

CREATE OR REPLACE FUNCTION claim_next_snapshot(worker_id TEXT, lock_timeout_minutes INTEGER DEFAULT 10)
RETURNS TABLE(id UUID, urls TEXT[], topic TEXT) AS $$
BEGIN
  -- First, release any stale locks and increment retry count
  UPDATE snapshot_requests 
  SET 
    status = 'timeout',
    locked_at = NULL,
    locked_by = NULL,
    retry_count = COALESCE(retry_count, 0) + 1,
    last_retry_at = NOW()
  WHERE status = 'processing' 
    AND locked_at < NOW() - INTERVAL '1 minute' * lock_timeout_minutes;

  -- Then claim the next available request
  RETURN QUERY
  UPDATE snapshot_requests AS main_table
  SET 
    locked_at = NOW(),
    locked_by = worker_id,
    status = 'processing'
  WHERE main_table.id = (
    SELECT r.id 
    FROM snapshot_requests r
    WHERE r.status IN ('pending', 'timeout')
      AND (r.retry_count < 3 OR r.retry_count IS NULL)
    ORDER BY 
      CASE WHEN r.status = 'timeout' THEN 1 ELSE 0 END, -- Prioritize retries
      r.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING main_table.id, main_table.urls, main_table.topic;
END;
$$ LANGUAGE plpgsql; 