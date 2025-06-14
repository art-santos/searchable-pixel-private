# Edge Case Testing Guide

This document outlines critical edge cases to test for the Split.dev email notification system.

## 🧪 **Testing Scenarios**

### **1. Waitlist Invitation Testing**

#### Duplicate Email Test
```bash
# Test unique email constraint
curl -X POST localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Try again with same email - should fail gracefully
curl -X POST localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

#### Invitation Flow Test
- [ ] Verify invitation email generation for new waitlist members
- [ ] Test email template rendering
- [ ] Confirm unique invite codes are generated

### **2. Forgot Password Edge Cases**

#### Multiple Reset Requests
```bash
# Send multiple password reset requests quickly
for i in {1..3}; do
  curl -X POST localhost:3000/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}' &
done
wait
```

#### Token Expiry Tests
- [ ] Use reset token after 1-hour expiry
- [ ] Use token after it's been marked as `used_at`
- [ ] Test concurrent token usage attempts

### **3. First Crawler Email Tests**

#### Race Condition Test
```javascript
// Simulate multiple crawler events simultaneously
const userId = 'test-user-id'
const requests = Array(5).fill().map(() =>
  fetch('/api/emails/first-crawler', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      crawlerName: 'Googlebot',
      page: '/test',
      userEmail: 'test@example.com'
    })
  })
)

Promise.allSettled(requests).then(results => {
  console.log('Results:', results.map(r => r.status))
  // Should only send ONE email, not multiple
})
```

#### High Volume User Test
- [ ] Test users with >1,000 existing crawler visits
- [ ] Verify count logic works correctly (not using `.length`)
- [ ] Ensure no duplicate first crawler emails

### **4. Weekly Summary Edge Cases**

#### Zero Activity Test
```sql
-- Create user with no visits this week
INSERT INTO profiles (id, email, first_name) 
VALUES ('zero-activity-user', 'zero@test.com', 'Zero');

-- Verify no summary email is sent
```

#### Suppression Window Test
```sql
-- Set last_weekly_email to exactly 6 days ago
UPDATE profiles 
SET last_weekly_email = NOW() - INTERVAL '6 days'
WHERE email = 'test@example.com';

-- Run weekly job - should be suppressed
```

#### High Volume Count Test
```sql
-- Create >1,000 visits in previous week
DO $$ 
BEGIN 
  FOR i IN 1..1500 LOOP
    INSERT INTO crawler_visits (user_id, crawler_name, path, timestamp)
    VALUES (
      'high-volume-user',
      'Googlebot',
      '/page-' || i,
      NOW() - INTERVAL '10 days' + (i || ' seconds')::INTERVAL
    );
  END LOOP;
END $$;
```

### **5. Email Failure Handling**

#### Invalid API Key Test
```bash
# Temporarily set invalid RESEND_API_KEY
export RESEND_API_KEY="invalid-key"

# Trigger email
curl -X POST localhost:3000/api/emails/first-crawler \
  -H "Content-Type: application/json" \
  -d '{...}'

# Check logs for proper error handling
# Verify email_notifications table shows status: 'failed'
```

#### Network Failure Simulation
```javascript
// Mock network failure in test environment
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockRejectedValue(new Error('Network timeout'))
}))
```

## 🛠 **Automated Test Suite**

### Database Setup
```sql
-- Create test users with various scenarios
INSERT INTO profiles (id, email, first_name, email_notifications, last_weekly_email) VALUES
('user-1', 'test1@example.com', 'Test1', true, NULL),
('user-2', 'test2@example.com', 'Test2', false, NULL), -- notifications disabled
('user-3', 'test3@example.com', 'Test3', true, NOW() - INTERVAL '5 days'), -- recent email
('user-high-volume', 'heavy@example.com', 'Heavy', true, NULL);

-- Create test crawler visits
-- (Add various scenarios for edge case testing)
```

### Test Runner Script
```bash
#!/bin/bash
# edge-case-tests.sh

echo "🧪 Running edge case tests..."

# Test 1: Duplicate waitlist
echo "Testing duplicate waitlist entries..."
# ... test commands

# Test 2: Concurrent first crawler
echo "Testing concurrent first crawler emails..."
# ... test commands

# Test 3: High volume weekly summary
echo "Testing high volume weekly summary..."
# ... test commands

echo "✅ Edge case tests completed"
```

## 🚨 **Critical Fixes Applied**

### Count vs Length Issues Fixed
- ✅ **First crawler detection**: Now uses `count` instead of `array.length`
- ✅ **Weekly summary growth**: Now uses proper count queries
- ✅ **Added `head: true`**: Prevents unnecessary data transfer

### Cron Scheduling Added
- ✅ **Weekly emails**: Mondays at 9 AM UTC
- ✅ **Token cleanup**: Daily at 2 AM UTC
- ✅ **Vercel configuration**: Added to `vercel.json`

### Security Improvements
- ✅ **Cron authentication**: All endpoints verify `CRON_SECRET_TOKEN`
- ✅ **Error handling**: Proper logging without exposing internals
- ✅ **Rate limiting**: Consider adding for email endpoints

## 📊 **Monitoring & Alerts**

### Key Metrics to Track
```sql
-- Monitor email success rates
SELECT 
  email_type,
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY email_type) as percentage
FROM email_notifications 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY email_type, status;
```

### Alert Conditions
- Email failure rate > 5%
- Token cleanup removes > 1000 tokens (possible issue)
- Weekly email job duration > 5 minutes
- First crawler email sent to same user multiple times

## 🔄 **Recommended Testing Schedule**

- **Pre-deployment**: Run all edge case tests
- **Weekly**: Verify email delivery rates
- **Monthly**: Check token cleanup effectiveness
- **Quarterly**: Load test with high-volume scenarios 