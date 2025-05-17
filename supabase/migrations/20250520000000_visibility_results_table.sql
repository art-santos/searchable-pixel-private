-- Create the visibility_results table
CREATE TABLE IF NOT EXISTS public.visibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add indexes for performance
  CONSTRAINT fk_visibility_results_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_visibility_results_user_id ON public.visibility_results(user_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_visibility_results_created_at ON public.visibility_results(created_at);

-- Create index on domain for domain-specific lookups
CREATE INDEX IF NOT EXISTS idx_visibility_results_domain ON public.visibility_results(domain);

-- Add a function to limit results per user (optional)
CREATE OR REPLACE FUNCTION limit_visibility_results() RETURNS TRIGGER AS $$
BEGIN
  -- Keep only the most recent 20 results per user
  DELETE FROM public.visibility_results
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id
    FROM public.visibility_results
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to limit results
CREATE TRIGGER tr_limit_visibility_results
AFTER INSERT ON public.visibility_results
FOR EACH ROW
EXECUTE FUNCTION limit_visibility_results();

-- Create RLS policies
ALTER TABLE public.visibility_results ENABLE ROW LEVEL SECURITY;

-- Users can only see their own results
CREATE POLICY visibility_results_select_policy ON public.visibility_results
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own results
CREATE POLICY visibility_results_insert_policy ON public.visibility_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own results
CREATE POLICY visibility_results_update_policy ON public.visibility_results
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own results
CREATE POLICY visibility_results_delete_policy ON public.visibility_results
  FOR DELETE
  USING (auth.uid() = user_id); 