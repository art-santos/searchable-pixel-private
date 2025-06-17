-- Fix profiles RLS policies to allow signup trigger to work
-- This migration adds the missing policies for profile creation during signup

-- The main issue is that the signup trigger function needs to insert profiles
-- but the existing INSERT policies require auth.uid() = id, which may not work
-- during the trigger execution. We need a more permissive policy.

-- Add policy to allow the handle_new_user function to insert profiles
-- This policy allows the signup trigger (running as SECURITY DEFINER) to create profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Allow signup trigger to create profiles'
  ) THEN
    CREATE POLICY "Allow signup trigger to create profiles"
    ON profiles
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Note: Service role policies already exist, so we don't need to add them

-- The existing user INSERT policies should be sufficient as backup 