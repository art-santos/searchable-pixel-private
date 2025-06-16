-- Drop the redundant sync_user_email_trigger since handle_new_user already handles inserts
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;

-- Drop the sync_user_email function as it's redundant
DROP FUNCTION IF EXISTS sync_user_email();

-- Keep only the handle_new_user trigger for inserts and handle_user_email_update for updates
-- This prevents conflicts when creating new users 