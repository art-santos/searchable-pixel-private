-- Fix profiles table schema by adding missing columns and relationships
-- Add created_by and updated_by columns and establish proper foreign key relationships

-- Add created_by and updated_by columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Set default values for existing records
UPDATE public.profiles 
SET created_by = id, updated_by = id 
WHERE created_by IS NULL OR updated_by IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON public.profiles(created_by);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_by ON public.profiles(updated_by);

-- Update the handle_new_user function to set created_by and updated_by
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_by, updated_by, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.id, NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_by = NEW.id,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS policies allow the created_by and updated_by fields
-- Update existing policies to handle the new columns properly
DROP POLICY IF EXISTS "Allow signup trigger to create profiles" ON public.profiles;

CREATE POLICY "Allow signup trigger to create profiles"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id OR auth.uid() = created_by);

-- Add policy for updates with created_by/updated_by
CREATE POLICY "Allow profile updates by owner or creator" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id OR auth.uid() = created_by OR auth.uid() = updated_by);

-- Comment about domain relationship
-- Note: We'll handle the domain foreign key relationship after reviewing 
-- the workspace creation process to ensure proper data flow