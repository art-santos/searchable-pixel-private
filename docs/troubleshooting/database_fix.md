# Database Migration SQL

Based on the error logs, you need to add both `aeo_score` and `seo_score` columns to the `pages` table, along with other missing columns that your application is trying to use.

```sql
-- Add AEO and SEO score columns to pages table
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS aeo_score SMALLINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS seo_score SMALLINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_score SMALLINT DEFAULT NULL;

-- Add additional columns that your application is trying to use
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS is_document BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS media_count SMALLINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS media_accessibility_score SMALLINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS schema_types TEXT[] DEFAULT NULL;

-- Add AEO and SEO score columns to crawls table for sitewide averages
ALTER TABLE public.crawls
ADD COLUMN IF NOT EXISTS aeo_score SMALLINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS seo_score SMALLINT DEFAULT NULL;
``` 