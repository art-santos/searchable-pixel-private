-- Add columns for citation snippets and competitor names
ALTER TABLE visibility_results
  ADD COLUMN citation_snippet TEXT,           -- How your target is mentioned
  ADD COLUMN competitor_names TEXT[];         -- Actual product/tool names recommended 