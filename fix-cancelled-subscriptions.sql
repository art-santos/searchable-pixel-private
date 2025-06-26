-- Fix for cancelled subscriptions not showing properly
-- This updates the cancel_at_period_end field for subscriptions that are cancelled in Stripe

-- First, let's check hogansam17@gmail.com's subscription status
SELECT 
  p.id,
  p.email,
  p.subscription_plan,
  p.subscription_status,
  p.subscription_period_end,
  si.plan_type,
  si.plan_status,
  si.current_period_end,
  si.cancel_at_period_end,
  si.stripe_subscription_id
FROM profiles p
LEFT JOIN subscription_info si ON si.user_id = p.id
WHERE p.email = 'hogansam17@gmail.com';

-- Update hogansam17@gmail.com's subscription to show it's cancelled
-- You'll need to verify with Stripe if this subscription is actually set to cancel
UPDATE subscription_info
SET 
  cancel_at_period_end = true,
  updated_at = NOW()
WHERE user_id = (SELECT id FROM profiles WHERE email = 'hogansam17@gmail.com');

-- Find all users who might have this issue
-- (active subscriptions with period end dates that suggest they might be cancelled)
SELECT 
  p.email,
  p.subscription_status,
  p.subscription_period_end,
  si.cancel_at_period_end,
  si.stripe_subscription_id,
  si.current_period_end
FROM profiles p
JOIN subscription_info si ON si.user_id = p.id
WHERE p.subscription_status = 'active'
  AND si.cancel_at_period_end = false
  AND p.subscription_plan IN ('pro', 'starter')
ORDER BY p.subscription_period_end DESC;

-- To manually fix a specific subscription after verifying with Stripe:
-- UPDATE subscription_info
-- SET cancel_at_period_end = true, updated_at = NOW()
-- WHERE stripe_subscription_id = 'sub_1RbbH3DItjqY6n3DcvZounA8'; 