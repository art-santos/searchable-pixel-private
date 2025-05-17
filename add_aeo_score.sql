-- Add the missing aeo_score column to the pages table
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS aeo_score SMALLINT DEFAULT NULL; 