-- Create a test user for rate limiting tests
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  phone_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000123',
  'authenticated',
  'authenticated', 
  'test@example.com',
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING; 