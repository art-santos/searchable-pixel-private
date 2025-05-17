-- Add company-related fields to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_domain TEXT,
ADD COLUMN IF NOT EXISTS company_category TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS company_industry TEXT;

-- Create index on company_domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_company_domain ON public.profiles(company_domain);

-- Add RLS policies for profiles table if they don't exist already
-- First check if RLS is enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    -- Enable row level security
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY profiles_select_policy ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
    
    CREATE POLICY profiles_insert_policy ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
    
    CREATE POLICY profiles_update_policy ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
    
    CREATE POLICY profiles_delete_policy ON public.profiles
      FOR DELETE
      USING (auth.uid() = id);
  END IF;
END $$; 