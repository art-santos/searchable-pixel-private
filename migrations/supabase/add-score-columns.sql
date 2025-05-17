-- Add AEO and SEO score columns to pages and crawls

-- Add columns to pages table
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS aeo_score SMALLINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS seo_score SMALLINT DEFAULT NULL;

-- Add columns to crawls table for sitewide averages
ALTER TABLE crawls
ADD COLUMN IF NOT EXISTS aeo_score SMALLINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS seo_score SMALLINT DEFAULT NULL;
