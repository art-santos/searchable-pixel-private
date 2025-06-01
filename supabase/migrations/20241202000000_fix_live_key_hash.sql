-- Fix key_hash for existing live API keys that don't have it set
-- This specifically targets live keys that were created before the key_hash fix

DO $$
DECLARE
    api_key_record RECORD;
    computed_hash TEXT;
BEGIN
    -- Loop through all API keys that don't have key_hash set
    FOR api_key_record IN 
        SELECT id, key FROM api_keys 
        WHERE key_hash IS NULL 
        AND (key LIKE 'split_live_%' OR key LIKE 'split_test_%')
    LOOP
        -- Compute the SHA256 hash (same as used in crawler-events validation)
        computed_hash := encode(digest(api_key_record.key, 'sha256'), 'hex');
        
        -- Update the record with the computed hash
        UPDATE api_keys 
        SET key_hash = computed_hash 
        WHERE id = api_key_record.id;
        
        RAISE NOTICE 'Updated key_hash for API key: %', api_key_record.key;
    END LOOP;
    
    -- Log completion
    RAISE NOTICE 'Completed fixing key_hash for existing API keys';
END
$$; 