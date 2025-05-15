-- Sites table to store site information
CREATE TABLE IF NOT EXISTS public.sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, domain)
);

-- Crawls table to store crawl sessions
CREATE TABLE IF NOT EXISTS public.crawls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('started', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_pages INTEGER DEFAULT 0,
  aeo_score INTEGER,
  apify_run_id TEXT
);

-- Pages table to store crawled pages
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crawl_id UUID REFERENCES public.crawls(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  title TEXT,
  has_llms_reference BOOLEAN DEFAULT FALSE,
  has_schema BOOLEAN DEFAULT FALSE,
  is_markdown BOOLEAN DEFAULT FALSE,
  content_length INTEGER,
  ai_visibility_score INTEGER,
  
  UNIQUE(crawl_id, url)
);

-- Issues table to store page issues
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  message TEXT NOT NULL,
  context JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS crawls_site_id_idx ON public.crawls (site_id);
CREATE INDEX IF NOT EXISTS pages_crawl_id_idx ON public.pages (crawl_id);
CREATE INDEX IF NOT EXISTS issues_page_id_idx ON public.issues (page_id);

-- Create RLS policies for sites table
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY sites_select_policy ON public.sites 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY sites_insert_policy ON public.sites 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY sites_update_policy ON public.sites 
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY sites_delete_policy ON public.sites 
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for crawls table
ALTER TABLE public.crawls ENABLE ROW LEVEL SECURITY;

CREATE POLICY crawls_select_policy ON public.crawls 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sites 
      WHERE sites.id = crawls.site_id 
      AND sites.user_id = auth.uid()
    )
  );

-- Create RLS policies for pages table
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pages_select_policy ON public.pages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.crawls
      JOIN public.sites ON sites.id = crawls.site_id
      WHERE crawls.id = pages.crawl_id 
      AND sites.user_id = auth.uid()
    )
  );

-- Create RLS policies for issues table
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY issues_select_policy ON public.issues 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pages
      JOIN public.crawls ON crawls.id = pages.crawl_id
      JOIN public.sites ON sites.id = crawls.site_id
      WHERE pages.id = issues.page_id 
      AND sites.user_id = auth.uid()
    )
  ); 