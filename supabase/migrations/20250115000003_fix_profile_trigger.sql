-- Fix the handle_new_user function to properly set created_by and updated_by
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    NEW.id,  -- User creates their own profile
    NEW.id,  -- User updates their own profile
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the sync_user_email function
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- First ensure profile exists
  INSERT INTO public.profiles (id, email, created_by, updated_by, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.id, NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 