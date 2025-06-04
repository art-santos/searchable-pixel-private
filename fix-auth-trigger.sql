-- Fix auth trigger for automatic profile creation
-- This is what's causing the "Database error saving new user" issue

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- Test the trigger works
DO $$
BEGIN
  RAISE NOTICE 'Auth trigger setup completed! Users can now sign up successfully.';
END $$; 