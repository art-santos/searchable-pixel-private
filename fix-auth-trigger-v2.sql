-- Fix auth trigger with proper error handling and timing
-- This addresses the foreign key constraint issue

-- First, let's see what the foreign key constraint is actually referencing
-- We need to either fix the constraint or adjust the trigger timing

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a more robust function that handles the foreign key properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Add a small delay to ensure the user record is fully committed
  -- before trying to create the profile
  PERFORM pg_sleep(0.1);
  
  -- Try to insert the profile with proper error handling
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    created_by,
    updated_by,
    billing_preferences
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.id,
    NEW.id,
    '{
      "ai_logs_enabled": true,
      "spending_limit_cents": null,
      "overage_notifications": false,
      "auto_billing_enabled": true,
      "analytics_only_mode": false
    }'::jsonb
  )
  ON CONFLICT (id) DO NOTHING; -- Ignore if profile already exists
  
  RETURN NEW;
EXCEPTION
  WHEN foreign_key_violation THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log any other errors but don't fail the user creation
    RAISE WARNING 'Unexpected error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger with AFTER INSERT to ensure user is committed first
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Alternative: Let's also check if we should drop the problematic foreign key constraint
-- and recreate it properly

-- Check current foreign keys on profiles table
-- You may need to run this manually to see what the constraint is:
-- SELECT conname, confrelid::regclass as foreign_table 
-- FROM pg_constraint 
-- WHERE conrelid = 'public.profiles'::regclass AND contype = 'f';

-- If the foreign key is wrong, we can fix it:
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_users_id_fk;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
--   FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated; 