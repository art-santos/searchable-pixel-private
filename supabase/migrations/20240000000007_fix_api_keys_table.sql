-- Drop the conflicting api_keys table from crawler tracking migration
DROP TABLE IF EXISTS api_keys CASCADE;

-- Drop the old function that references key_hash
DROP FUNCTION IF EXISTS validate_api_key(TEXT);

-- Recreate api_keys table with support for both use cases
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE, -- Store the actual key
    key_hash TEXT UNIQUE, -- Store hashed version for crawler API validation
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domains TEXT[], -- Allowed domains for this key
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own api keys"
    ON public.api_keys
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own api keys"
    ON public.api_keys
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api keys"
    ON public.api_keys
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX api_keys_user_id_idx ON public.api_keys(user_id);
CREATE INDEX api_keys_key_idx ON public.api_keys(key);
CREATE INDEX api_keys_key_hash_idx ON public.api_keys(key_hash);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER handle_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Drop the function again in case it was recreated by migration 006
DROP FUNCTION IF EXISTS validate_api_key(TEXT);

-- Recreate the validate_api_key function for crawler API
CREATE FUNCTION validate_api_key(key_hash TEXT)
RETURNS TABLE (
  user_id UUID,
  domains TEXT[],
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.user_id,
    ak.domains,
    ak.is_active
  FROM api_keys ak
  WHERE ak.key_hash = validate_api_key.key_hash
    AND ak.is_active = true;
  
  -- Update last used timestamp
  UPDATE api_keys
  SET last_used_at = NOW()
  WHERE api_keys.key_hash = validate_api_key.key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 