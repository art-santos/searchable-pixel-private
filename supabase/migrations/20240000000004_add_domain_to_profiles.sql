-- Add domain column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS domain TEXT;

-- Create index for domain lookups
CREATE INDEX IF NOT EXISTS idx_profiles_domain ON public.profiles(domain);

-- Add comment for domain column
COMMENT ON COLUMN public.profiles.domain IS 'Primary domain for the user workspace (e.g., example.com)';

-- Update RLS policies to include domain field
-- Users can view their own profile including domain
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own domain
CREATE POLICY IF NOT EXISTS "Users can update their own domain"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id); 