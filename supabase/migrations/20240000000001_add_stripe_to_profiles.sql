-- Add Stripe-related columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'canceled', 'incomplete', 'past_due', 'trialing', 'unpaid')),
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'visibility', 'plus', 'pro')),
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON public.profiles(subscription_plan);

-- Add RLS policies for Stripe fields
-- Users can view their own Stripe data
CREATE POLICY "Users can view their own Stripe data"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Only the system (service role) can update Stripe fields
CREATE POLICY "Service role can update Stripe fields"
    ON public.profiles
    FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role'); 