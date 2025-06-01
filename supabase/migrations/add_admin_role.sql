-- Add admin role to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Update your user to be admin (replace with your actual user ID)
-- UPDATE public.profiles SET is_admin = true WHERE id = 'YOUR_USER_ID_HERE';

-- Function to automatically upgrade admins to pro plan
CREATE OR REPLACE FUNCTION auto_upgrade_admin_to_pro()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is being set to admin, automatically give them pro plan
  IF NEW.is_admin = true AND (OLD.is_admin IS NULL OR OLD.is_admin = false) THEN
    NEW.subscription_plan := 'pro';
    NEW.subscription_status := 'active';
    NEW.subscription_period_end := NOW() + INTERVAL '10 years'; -- Essentially permanent
  END IF;
  
  -- If user is being removed from admin, optionally downgrade (commented out for safety)
  -- IF NEW.is_admin = false AND OLD.is_admin = true THEN
  --   NEW.subscription_plan := 'free';
  --   NEW.subscription_status := 'free';
  --   NEW.subscription_period_end := NULL;
  -- END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-upgrade admins
CREATE TRIGGER trigger_auto_upgrade_admin_to_pro
  BEFORE UPDATE OF is_admin ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_upgrade_admin_to_pro();

-- Also handle new admin users (if someone is created as admin directly)
CREATE OR REPLACE FUNCTION auto_upgrade_new_admin_to_pro()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin = true THEN
    NEW.subscription_plan := 'pro';
    NEW.subscription_status := 'active';
    NEW.subscription_period_end := NOW() + INTERVAL '10 years';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new admin users
CREATE TRIGGER trigger_auto_upgrade_new_admin_to_pro
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_upgrade_new_admin_to_pro();
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles admin_profile 
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.is_admin = true
      )
    );

-- Update existing admins to pro plan (if any exist)
UPDATE public.profiles 
SET 
  subscription_plan = 'pro',
  subscription_status = 'active',
  subscription_period_end = NOW() + INTERVAL '10 years'
WHERE is_admin = true; 