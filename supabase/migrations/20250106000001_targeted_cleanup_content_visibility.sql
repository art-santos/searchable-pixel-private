-- Targeted Cleanup: Remove ONLY Content Generation and Visibility Systems
-- Preserves: users, workspaces, crawler_visits, billing, authentication, general functions

-- =============================================================================
-- STEP 1: DROP VISIBILITY SYSTEM TABLES ONLY
-- =============================================================================

-- Drop visibility tables in dependency order
DROP TABLE IF EXISTS max_visibility_metrics CASCADE;
DROP TABLE IF EXISTS max_visibility_topics CASCADE;  
DROP TABLE IF EXISTS max_visibility_competitors CASCADE;
DROP TABLE IF EXISTS max_visibility_citations CASCADE;
DROP TABLE IF EXISTS max_visibility_responses CASCADE;
DROP TABLE IF EXISTS max_visibility_questions CASCADE;
DROP TABLE IF EXISTS max_visibility_runs CASCADE;

-- Drop visibility custom types
DROP TYPE IF EXISTS max_question_type CASCADE;
DROP TYPE IF EXISTS mention_position_enum CASCADE;
DROP TYPE IF EXISTS sentiment_enum CASCADE;
DROP TYPE IF EXISTS citation_bucket_enum CASCADE;

-- Drop visibility views and functions
DROP VIEW IF EXISTS max_visibility_run_summary CASCADE;
DROP FUNCTION IF EXISTS update_max_runs_updated_at() CASCADE;
DROP FUNCTION IF EXISTS validate_max_visibility_access() CASCADE;

-- =============================================================================
-- STEP 2: DROP CONTENT GENERATION TABLES ONLY
-- =============================================================================

-- Drop content generation tables
DROP TABLE IF EXISTS knowledge_base_items CASCADE;
DROP TABLE IF EXISTS generated_content CASCADE;
DROP TABLE IF EXISTS content_articles CASCADE;

-- =============================================================================
-- STEP 3: LOG WHAT WAS REMOVED
-- =============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Targeted cleanup completed successfully';
  RAISE NOTICE '✅ Removed: MAX visibility system (max_visibility_*)';
  RAISE NOTICE '✅ Removed: Content generation (knowledge_base_items, generated_content)';
  RAISE NOTICE '✅ Preserved: crawler_visits, users, workspaces, billing, authentication';
  RAISE NOTICE '✅ Ready for targeted code cleanup!';
END $$; 