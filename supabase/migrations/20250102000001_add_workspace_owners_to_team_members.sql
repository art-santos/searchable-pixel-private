-- Add workspace owners as team members for all existing workspaces
-- This fixes RLS access for single-user workspaces

INSERT INTO team_members (workspace_id, user_id, role, invited_at, accepted_at)
SELECT 
  w.id as workspace_id,
  w.user_id,
  'owner' as role,
  w.created_at as invited_at,
  w.created_at as accepted_at
FROM workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.workspace_id = w.id AND tm.user_id = w.user_id
);

-- Create a function to automatically add workspace owners as team members
CREATE OR REPLACE FUNCTION add_workspace_owner_to_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (workspace_id, user_id, role, invited_at, accepted_at)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.created_at, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add workspace owners as team members
CREATE TRIGGER workspace_owner_team_member_trigger
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION add_workspace_owner_to_team(); 