-- Create agent_credentials table
CREATE TABLE IF NOT EXISTS agent_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  agent_id UUID NOT NULL UNIQUE,
  agent_secret_hash TEXT NOT NULL, -- We store the hash, not the raw secret
  webhook_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Add index for faster lookups
CREATE INDEX agent_credentials_user_id_idx ON agent_credentials(user_id);
CREATE INDEX agent_credentials_domain_idx ON agent_credentials(domain);
CREATE INDEX agent_credentials_agent_id_idx ON agent_credentials(agent_id);

-- Enable RLS (Row Level Security)
ALTER TABLE agent_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
-- 1. Users can view their own credentials
CREATE POLICY "Users can view their own credentials"
  ON agent_credentials FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Users can insert their own credentials
CREATE POLICY "Users can insert their own credentials"
  ON agent_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own credentials
CREATE POLICY "Users can update their own credentials"
  ON agent_credentials FOR UPDATE
  USING (auth.uid() = user_id);

-- Create content_deliveries table to track content sent to webhooks
CREATE TABLE IF NOT EXISTS content_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agent_credentials(agent_id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL, -- 'delivered', 'failed', 'pending', etc.
  delivered_at TIMESTAMP WITH TIME ZONE,
  indexed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX content_deliveries_agent_id_idx ON content_deliveries(agent_id);
CREATE INDEX content_deliveries_domain_idx ON content_deliveries(domain);
CREATE INDEX content_deliveries_slug_idx ON content_deliveries(slug);

-- Enable RLS
ALTER TABLE content_deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for content_deliveries
CREATE POLICY "Users can view their own content deliveries"
  ON content_deliveries FOR SELECT
  USING (agent_id IN (
    SELECT agent_id FROM agent_credentials WHERE user_id = auth.uid()
  ));

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for agent_credentials
CREATE TRIGGER update_agent_credentials_updated_at
BEFORE UPDATE ON agent_credentials
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column(); 