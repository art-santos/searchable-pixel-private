-- Create table to log Stripe webhook errors for debugging
CREATE TABLE IF NOT EXISTS public.stripe_webhook_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  stripe_customer_id TEXT,
  email TEXT,
  subscription_id TEXT,
  error_details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_stripe_webhook_errors_stripe_customer_id ON public.stripe_webhook_errors(stripe_customer_id);
CREATE INDEX idx_stripe_webhook_errors_email ON public.stripe_webhook_errors(email);
CREATE INDEX idx_stripe_webhook_errors_resolved ON public.stripe_webhook_errors(resolved);
CREATE INDEX idx_stripe_webhook_errors_created_at ON public.stripe_webhook_errors(created_at DESC);

-- Add RLS policies
ALTER TABLE public.stripe_webhook_errors ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook errors
CREATE POLICY "Admins can view webhook errors" ON public.stripe_webhook_errors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Service role can insert errors
CREATE POLICY "Service role can insert webhook errors" ON public.stripe_webhook_errors
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.stripe_webhook_errors IS 'Logs Stripe webhook processing errors for debugging payment issues'; 