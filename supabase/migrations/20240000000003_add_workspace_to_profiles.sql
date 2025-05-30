-- Add workspace-related columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS workspace_name TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);

-- Add RLS policies for workspace fields
-- Users can update their own workspace data
CREATE POLICY "Users can update their own workspace data"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile data
CREATE POLICY "Users can insert their own profile data"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id); 