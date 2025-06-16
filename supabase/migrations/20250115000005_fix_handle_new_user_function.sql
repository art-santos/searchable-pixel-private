-- Fix the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if profile doesn't already exist
  INSERT INTO public.profiles (
    id, 
    email, 
    created_by,
    updated_by,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.id,
    NEW.id,
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Changed from DO UPDATE to DO NOTHING
  
  RETURN NEW;
EXCEPTION
  WHEN foreign_key_violation THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Could not create profile for user %: foreign key violation', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log any other errors but don't fail the user creation
    RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure the trigger is properly set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user(); 