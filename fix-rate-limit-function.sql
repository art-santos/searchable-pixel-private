-- Function to properly increment rate limit counter (fixed parameter naming)
CREATE OR REPLACE FUNCTION increment_user_rate_limit(p_user_id UUID, p_target_day DATE)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO user_rate_limits (user_id, day, requests_count)
  VALUES (p_user_id, p_target_day, 1)
  ON CONFLICT (user_id, day) 
  DO UPDATE SET requests_count = user_rate_limits.requests_count + 1
  RETURNING requests_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql; 