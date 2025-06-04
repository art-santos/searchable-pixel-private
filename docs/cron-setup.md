# 🕒 Cron Job Setup for Billing Management

This document explains how to set up automated billing cycle processing for the subscription system.

## 📋 Overview

The billing system uses cron jobs to:
- Reset usage counters monthly
- Calculate overage charges
- Send usage alerts
- Process billing cycles automatically

## 🛠 Environment Variables

Add these to your `.env.local`:

```bash
# Cron job security
CRON_SECRET=your-secure-random-string-here

# Billing configuration  
BILLING_OVERAGE_ARTICLE_PRICE_CENTS=1000  # $10 per article
BILLING_OVERAGE_DOMAIN_PRICE_CENTS=10000  # $100 per domain
```

## 🚀 Deployment Options

### Option 1: Vercel Cron Jobs (Recommended)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/billing-cycle",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

This runs the billing cycle processor on the 1st of every month at midnight UTC.

### Option 2: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or GitHub Actions:

**Schedule**: `0 0 1 * *` (Monthly on 1st)
**URL**: `https://yourapp.vercel.app/api/cron/billing-cycle`
**Method**: POST
**Headers**: 
```
Authorization: Bearer your-cron-secret
Content-Type: application/json
```

### Option 3: GitHub Actions

Create `.github/workflows/billing-cron.yml`:

```yaml
name: Monthly Billing Cycle
on:
  schedule:
    - cron: '0 0 1 * *'  # 1st of every month
  workflow_dispatch:  # Allow manual trigger

jobs:
  billing:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Billing Cycle
        run: |
          curl -X POST "${{ vars.APP_URL }}/api/cron/billing-cycle" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

## 🧪 Testing

### Manual Testing

```bash
# Test the cron endpoint (development)
curl -X POST "http://localhost:3000/api/cron/billing-cycle" \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

### Response Format

```json
{
  "message": "Billing cycle processing complete",
  "results": {
    "processed": 5,
    "errors": 0,
    "usageAlerts": 2
  }
}
```

## 📊 What the Cron Job Does

### 1. Usage Reset
- Resets `article_credits_used` to 0
- Resets `max_scans_used` and `daily_scans_used` to 0
- Updates billing period dates

### 2. Overage Calculation
- Calculates charges for usage beyond limits
- Stores overage amounts for Stripe billing
- Logs billing events for audit trail

### 3. Alert Generation
- Sends alerts when usage exceeds 80% of limits
- Logs usage warnings
- (Future: Email notifications)

### 4. Billing Period Management
- Advances billing period by 1 month
- Maintains purchased add-ons across cycles
- Updates next billing date

## 🔍 Monitoring

### Logs to Watch
```bash
# Successful processing
✅ Processed billing cycle for user abc123

# Usage alerts
⚠️  Usage alert for user xyz789: Articles: 90%, Domains: 75%

# Processing summary
🎉 Billing cycle processing complete: {"processed": 5, "errors": 0, "usageAlerts": 2}
```

### Database Queries

Check billing events:
```sql
SELECT * FROM usage_events 
WHERE event_type = 'billing_cycle_reset' 
ORDER BY created_at DESC 
LIMIT 10;
```

Check subscription status:
```sql
SELECT 
  user_id,
  plan_type,
  billing_period_start,
  billing_period_end,
  article_credits_used,
  article_credits_included,
  overage_amount_cents
FROM subscription_usage 
WHERE plan_status = 'active'
ORDER BY billing_period_end ASC;
```

## 🚨 Error Handling

The cron job handles errors gracefully:
- Individual subscription failures don't stop the entire process
- Errors are logged with user IDs for investigation
- Results summary shows success/error counts

### Common Issues

1. **Database Connection**: Ensure service role client has proper permissions
2. **Timezone Handling**: All dates stored in UTC
3. **Rate Limiting**: Processes subscriptions sequentially to avoid overload

## 🔐 Security

- Use a strong `CRON_SECRET` (32+ characters)
- Restrict endpoint access to authorized sources only
- Monitor cron job logs for unauthorized access attempts
- Consider IP whitelisting for external cron services

## 📈 Scaling

For high-volume deployments:
- Consider batch processing in chunks
- Add queue system for large subscription counts
- Implement retry logic for failed billing cycles
- Add monitoring and alerting for cron job failures

---

> 💡 **Tip**: Test billing cycles on staging environment first with a small subset of users before deploying to production. 