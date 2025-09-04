-- Fix workspace and profile relationship
-- The current logic stores domain in profiles, but workspaces should be the source of truth

-- First, let's ensure we have proper workspace_id reference in profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_workspace_id ON public.profiles(workspace_id);

-- Update existing profiles to link to their primary workspace
UPDATE public.profiles 
SET workspace_id = (
    SELECT w.id 
    FROM public.workspaces w 
    WHERE w.user_id = profiles.id 
    AND w.is_primary = true 
    LIMIT 1
)
WHERE workspace_id IS NULL;

-- Create function to ensure workspace-profile consistency
CREATE OR REPLACE FUNCTION public.ensure_workspace_profile_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- When a workspace is created, update the user's profile to reference it
    IF TG_OP = 'INSERT' AND NEW.is_primary = true THEN
        UPDATE public.profiles 
        SET workspace_id = NEW.id,
            domain = NEW.domain,
            workspace_name = NEW.workspace_name,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    -- When a workspace is updated, sync changes to profile
    IF TG_OP = 'UPDATE' AND NEW.is_primary = true THEN
        UPDATE public.profiles 
        SET domain = NEW.domain,
            workspace_name = NEW.workspace_name,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to maintain consistency
DROP TRIGGER IF EXISTS trigger_workspace_profile_consistency ON public.workspaces;
CREATE TRIGGER trigger_workspace_profile_consistency
    AFTER INSERT OR UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_workspace_profile_consistency();

-- Update RLS policies for profiles to work with workspace_id
CREATE POLICY "Allow workspace-based profile access" ON public.profiles
    FOR ALL USING (
        auth.uid() = id OR 
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = profiles.workspace_id 
            AND w.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.workspaces TO authenticated;