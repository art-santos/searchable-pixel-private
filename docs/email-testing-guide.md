# 📧 Email Campaign Testing Guide

This guide provides multiple easy ways to test your email campaigns during development and before production deployment.

## 🚀 **Quick Start Methods**

### **1. Browser-Based Testing (Easiest)**

Visit: `http://localhost:3000/dev/email-tester`

- ✅ **Visual interface** - No command line needed
- ✅ **Instant feedback** - See results immediately  
- ✅ **Test all types** - One-click testing of all campaigns
- ✅ **Auto cleanup** - Test data is automatically removed

**Steps:**
1. Enter your email address
2. Select email type to test
3. Click "Send Test Email" or "Test All Email Types"
4. Check your inbox!

### **2. Command Line Testing (Fast)**

```bash
# Set your test email
export TEST_EMAIL="your-email@example.com"

# Test all campaigns
node scripts/test-email-campaigns.js

# Test specific campaign
node scripts/test-email-campaigns.js first-crawler
node scripts/test-email-campaigns.js weekly
node scripts/test-email-campaigns.js concurrent
node scripts/test-email-campaigns.js high-volume
```

### **3. API Testing (Flexible)**

```bash
# First crawler email
curl -X POST localhost:3000/api/dev/test-emails \
  -H "Content-Type: application/json" \
  -d '{"type":"first-crawler","testEmail":"test@example.com"}'

# Weekly report  
curl -X POST localhost:3000/api/dev/test-emails \
  -H "Content-Type: application/json" \
  -d '{"type":"weekly-report","testEmail":"test@example.com"}'
```

## 📋 **Testing Scenarios by Email Type**

### **First Crawler Email**
```javascript
// Test: Basic first crawler
{
  "type": "first-crawler",
  "testEmail": "test@example.com"
}

// Test: High volume user (should reject)
// Run after creating 1000+ visits for user
```

**What to verify:**
- ✅ Email arrives with correct crawler name
- ✅ Page URL is included correctly
- ✅ Email is only sent once per user
- ✅ High-volume users don't get duplicate emails

### **Weekly Report Email**
```javascript
// Test: Standard weekly report
{
  "type": "weekly-report", 
  "testEmail": "test@example.com"
}
```

**What to verify:**
- ✅ Correct visit count and growth calculation
- ✅ Top pages are accurate
- ✅ Unique crawler count is correct
- ✅ Only sent to users with email_notifications: true

### **Password Reset Email**
```javascript
// Test: Password reset
{
  "type": "password-reset",
  "testEmail": "test@example.com"  
}
```

**What to verify:**
- ✅ Reset link works and is secure
- ✅ Token expires after 1 hour
- ✅ Token can only be used once

## 🛠 **Email Service Testing**

### **Using Email Testing Services**

#### **Option 1: MailHog (Local SMTP)**
```bash
# Install MailHog
brew install mailhog  # macOS
# or download from: https://github.com/mailhog/MailHog

# Start MailHog
mailhog

# Update .env.local
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# View emails at: http://localhost:8025
```

#### **Option 2: Ethereal Email (Online)**
```javascript
// Add to your email testing
const testAccount = await nodemailer.createTestAccount()
console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
```

#### **Option 3: Mailtrap (Staging)**
```bash
# Update .env.local for staging
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
```

### **Using Resend in Test Mode**
```bash
# Set test API key in .env.local
RESEND_API_KEY=re_test_your_test_key

# All emails will be caught in Resend dashboard
# No real emails sent to users
```

## 🧪 **Automated Testing Setup**

### **Jest Testing Suite**
```javascript
// __tests__/email-campaigns.test.js
import { testFirstCrawlerEmail } from '../scripts/test-email-campaigns'

describe('Email Campaigns', () => {
  test('first crawler email sends correctly', async () => {
    const result = await testFirstCrawlerEmail()
    expect(result.success).toBe(true)
  })

  test('high volume users rejected', async () => {
    // Create 1500+ visits
    const result = await testFirstCrawlerWithHighVolume()
    expect(result.success).toBe(false)
    expect(result.message).toContain('Not the first crawler')
  })
})
```

### **GitHub Actions CI Testing**
```yaml
# .github/workflows/test-emails.yml
name: Test Email Campaigns
on: [push, pull_request]

jobs:
  test-emails:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: node scripts/test-email-campaigns.js all
        env:
          TEST_EMAIL: test@example.com
          RESEND_API_KEY: ${{ secrets.RESEND_TEST_KEY }}
```

## 📊 **Monitoring & Debugging**

### **Email Success Rate Monitoring**
```sql
-- Check email success rates
SELECT 
  email_type,
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY email_type), 2) as percentage
FROM email_notifications 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY email_type, status
ORDER BY email_type, status;
```

### **Debug Failed Emails**
```sql
-- Find recent failures
SELECT 
  email_type,
  recipient_email,
  error_message,
  created_at
FROM email_notifications 
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### **Real-time Email Logs**
```bash
# Watch email logs in development
tail -f .next/server.log | grep -E "(Email|RESEND|ERROR)"

# Or use the dashboard
curl localhost:3000/api/dev/test-emails?action=logs
```

## ⚠️ **Testing Best Practices**

### **Environment Separation**
```bash
# Development (.env.local)
RESEND_API_KEY=re_test_...
TEST_EMAIL=dev@yourcompany.com

# Staging (.env.staging)  
RESEND_API_KEY=re_staging_...
TEST_EMAIL=staging@yourcompany.com

# Production (.env.production)
RESEND_API_KEY=re_live_...
# No TEST_EMAIL in production
```

### **Data Cleanup**
```javascript
// Always clean up test data
afterEach(async () => {
  await supabase
    .from('profiles')
    .delete()
    .like('id', 'test-%')
    
  await supabase
    .from('crawler_visits')
    .delete()
    .like('user_id', 'test-%')
})
```

### **Rate Limiting**
```javascript
// Add delays between tests to avoid rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

for (const test of emailTests) {
  await runTest(test)
  await delay(1000) // 1 second between tests
}
```

## 🎯 **Edge Case Testing Checklist**

### **Before Every Release**
- [ ] Test all email types with fresh data
- [ ] Verify high-volume scenarios (>1000 visits)
- [ ] Test concurrent email requests
- [ ] Check suppression logic (don't send duplicates)
- [ ] Verify email template rendering
- [ ] Test with invalid/expired tokens
- [ ] Check error handling and logging

### **Weekly Monitoring**
- [ ] Email delivery success rate > 95%
- [ ] No duplicate emails sent
- [ ] Failed email queue is empty
- [ ] Email templates render correctly
- [ ] All links in emails work

## 🚨 **Troubleshooting Common Issues**

### **"Email not received"**
1. Check spam folder
2. Verify RESEND_API_KEY is correct
3. Check email_notifications table for status
4. Verify domain is not blocked

### **"Template rendering errors"**
1. Check email template syntax
2. Verify all variables are provided
3. Test with minimal data first

### **"High volume users getting emails"**
1. Verify count logic uses `count`, not `array.length`
2. Check if `head: true` is set in query
3. Test with exactly 1000+ visits

### **"Duplicate emails"**
1. Check email_notifications table for duplicates
2. Verify unique constraints are working
3. Test concurrent request handling

## 📈 **Performance Testing**

### **Load Testing Email API**
```javascript
// Test 100 concurrent email requests
const requests = Array(100).fill().map(() =>
  fetch('/api/emails/first-crawler', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  })
)

const results = await Promise.allSettled(requests)
console.log('Success rate:', results.filter(r => r.status === 'fulfilled').length)
```

## 💡 **Pro Tips**

1. **Use different test emails** for different campaigns to easily identify them
2. **Set up email rules** to automatically sort test emails into folders
3. **Keep a testing checklist** and check it before each deployment
4. **Monitor email metrics** in your Resend dashboard
5. **Test on different email clients** (Gmail, Outlook, Apple Mail)
6. **Use meaningful test data** that mimics real user scenarios

---

## 🎉 **Quick Testing Workflow**

For **daily development:**
```bash
# Quick test
curl -X POST localhost:3000/api/dev/test-emails \
  -H "Content-Type: application/json" \
  -d '{"type":"first-crawler","testEmail":"yourname@company.com"}'
```

For **pre-deployment:**
```bash
# Full test suite
node scripts/test-email-campaigns.js all
```

For **debugging:**
```bash
# Visit the email tester UI
open http://localhost:3000/dev/email-tester
```

Your email campaigns should now be bullet-proof! 🛡️ 