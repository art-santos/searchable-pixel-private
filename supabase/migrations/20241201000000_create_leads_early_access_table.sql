-- Create leads early access table
CREATE TABLE IF NOT EXISTS leads_early_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    company_name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    active_split_user TEXT NOT NULL,
    monthly_traffic TEXT NOT NULL,
    average_contract_value TEXT NOT NULL,
    ideal_customer_profile TEXT NOT NULL,
    selling_to TEXT NOT NULL,
    custom_enrichments TEXT NOT NULL,
    tech_stack TEXT NOT NULL,
    additional_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS idx_leads_early_access_email ON leads_early_access(contact_email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_leads_early_access_created_at ON leads_early_access(created_at DESC);

-- Enable RLS
ALTER TABLE leads_early_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert leads early access requests" ON leads_early_access;
DROP POLICY IF EXISTS "Service role can read leads early access requests" ON leads_early_access;

-- Create policy for inserting (anyone can submit the form, authenticated or not)
CREATE POLICY "Anyone can insert leads early access requests" ON leads_early_access
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Create policy for admin viewing (only service role can read)
CREATE POLICY "Service role can read leads early access requests" ON leads_early_access
    FOR SELECT
    TO service_role
    USING (true); 