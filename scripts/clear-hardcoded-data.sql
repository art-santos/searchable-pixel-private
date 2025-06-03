-- Clear Hardcoded Competitor Data Script
-- This removes hardcoded competitors and forces a clean slate

BEGIN;

-- Step 1: See what hardcoded competitors exist
SELECT 'Current hardcoded competitors:' as info;
SELECT competitor_name, COUNT(*) as count 
FROM max_visibility_competitors 
WHERE competitor_name IN ('ZoomInfo', 'Apollo', 'Outreach', 'OpenAI', 'Salesforce', 'HubSpot')
GROUP BY competitor_name;

-- Step 2: Delete hardcoded competitors directly
DELETE FROM max_visibility_competitors 
WHERE competitor_name IN ('ZoomInfo', 'Apollo', 'Outreach', 'OpenAI', 'Salesforce', 'HubSpot');

-- Step 3: For safety, also delete any assessments that are clearly from the hardcoded era
-- Look for assessments with unrealistic scores that match the hardcoded pattern
DELETE FROM max_visibility_runs 
WHERE total_score IN (70, 60, 40, 22.7) -- These were the hardcoded scores
AND created_at > '2025-01-20'; -- Only recent ones that might have hardcoded data

COMMIT;

-- Verification
SELECT 'After cleanup:' as info;
SELECT 'Total assessments remaining:' as info, COUNT(*) as count FROM max_visibility_runs;
SELECT 'Total competitors remaining:' as info, COUNT(*) as count FROM max_visibility_competitors;
SELECT 'Hardcoded competitors remaining:' as info, COUNT(*) as count 
FROM max_visibility_competitors 
WHERE competitor_name IN ('ZoomInfo', 'Apollo', 'Outreach', 'OpenAI', 'Salesforce', 'HubSpot'); 