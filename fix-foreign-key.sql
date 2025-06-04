-- Fix the foreign key constraint that's preventing profile creation
-- The error shows it's looking for table "users" but should be "auth.users"

-- First, check what foreign key constraints exist on profiles table
-- (Run this first to see what we're dealing with)
SELECT 
  conname as constraint_name,
  confrelid::regclass as foreign_table,
  conkey,
  confkey
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass AND contype = 'f';

-- Drop the problematic foreign key constraint
-- Based on the error, it seems to be named "profiles_id_users_id_fk"
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_users_id_fk;

-- Also check for any other variations
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fk;

-- Recreate the foreign key constraint properly to reference auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Test that profiles can now be created
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraint fixed! Profiles should now reference auth.users properly.';
END $$; 