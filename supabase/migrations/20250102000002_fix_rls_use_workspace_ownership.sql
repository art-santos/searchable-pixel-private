-- Drop existing RLS policies that use team_members
DROP POLICY IF EXISTS "Users can access user visits from their workspaces" ON user_visits;
DROP POLICY IF EXISTS "Users can access leads from their workspaces" ON leads;
DROP POLICY IF EXISTS "Users can access contacts from their workspaces" ON contacts;
DROP POLICY IF EXISTS "Users can access public signals from their workspaces" ON public_signals;
DROP POLICY IF EXISTS "Users can access enrichment settings from their workspaces" ON lead_enrichment_settings;
DROP POLICY IF EXISTS "Users can access enrichment usage from their workspaces" ON lead_enrichment_usage;

-- Create new RLS policies based on workspace ownership
CREATE POLICY "Users can access user visits from their own workspaces" ON user_visits
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access leads from their own workspaces" ON leads
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access contacts from their own workspaces" ON contacts
  FOR ALL USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN workspaces w ON l.workspace_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access public signals from their own workspaces" ON public_signals
  FOR ALL USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN workspaces w ON l.workspace_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access enrichment settings from their own workspaces" ON lead_enrichment_settings
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access enrichment usage from their own workspaces" ON lead_enrichment_usage
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE user_id = auth.uid()
    )
  ); 