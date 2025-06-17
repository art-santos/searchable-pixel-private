-- Fix snapshot_requests RLS policies
-- This migration adds the missing RLS policies for the snapshot_requests table

-- Create RLS policy: Users can insert their own snapshot requests
CREATE POLICY "Users can insert own snapshot requests"
ON snapshot_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can read their own snapshot requests
CREATE POLICY "Users can read own snapshot requests"
ON snapshot_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policy: Users can update their own snapshot requests
CREATE POLICY "Users can update own snapshot requests"
ON snapshot_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Service role can perform all operations (for edge functions)
CREATE POLICY "Service role can manage all snapshots"
ON snapshot_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create RLS policy: Allow edge functions to claim snapshots (for the claim_next_snapshot function)
CREATE POLICY "Service role can claim snapshots"
ON snapshot_requests
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled (should already be, but confirm)
ALTER TABLE snapshot_requests ENABLE ROW LEVEL SECURITY; 