# Stripe Integration Setup

This guide will walk you through setting up Stripe payments for the application. The integration includes both subscription billing and metered usage billing.

## Prerequisites

- Stripe account (test or live)
- Stripe CLI (for webhook testing)
- Access to Stripe Dashboard

## Step 1: Create Stripe Products and Prices

### Base Subscription Plans

Create the following products in your Stripe Dashboard:

1. **Visibility Plan**
   - Product: "Visibility Plan"
   - Prices:
     - Monthly: $40/month
     - Annual: $400/year (save $80)

2. **Plus Plan**
   - Product: "Plus Plan"
   - Prices:
     - Monthly: $200/month
     - Annual: $2000/year (save $400)

3. **Pro Plan**
   - Product: "Pro Plan"
   - Prices:
     - Monthly: $1000/month
     - Annual: $10000/year (save $2000)

### Metered Usage Pricing

Create the following metered pricing for overages and add-ons:

4. **AI Crawler Logs Overage**
   - Product: "AI Crawler Logs"
   - Price: $0.008 per log
   - Billing: Monthly
   - Usage Type: Metered

5. **Extra Articles**
   - Product: "Extra Articles"
   - Price: $10 per article per month
   - Billing: Monthly
   - Usage Type: Licensed (quantity-based)

6. **Extra Domains**
   - Product: "Extra Domains"
   - Price: $100 per domain per month
   - Billing: Monthly
   - Usage Type: Licensed (quantity-based)

## Step 2: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

### Base Subscription Prices
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret

# Base Plan Prices
STRIPE_VISIBILITY_MONTHLY_PRICE_ID=price_VISIBILITY_MONTHLY_ID
STRIPE_VISIBILITY_ANNUAL_PRICE_ID=price_VISIBILITY_ANNUAL_ID
STRIPE_PLUS_MONTHLY_PRICE_ID=price_PLUS_MONTHLY_ID
STRIPE_PLUS_ANNUAL_PRICE_ID=price_PLUS_ANNUAL_ID
STRIPE_PRO_MONTHLY_PRICE_ID=price_PRO_MONTHLY_ID
STRIPE_PRO_ANNUAL_PRICE_ID=price_PRO_ANNUAL_ID

# Metered Usage Prices
STRIPE_AI_LOGS_METERED_PRICE_ID=price_AI_LOGS_METERED_ID
STRIPE_EXTRA_ARTICLES_PRICE_ID=price_EXTRA_ARTICLES_ID
STRIPE_EXTRA_DOMAINS_PRICE_ID=price_EXTRA_DOMAINS_ID
```

## Step 3: Webhook Configuration

### Create Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. Listen to these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.finalized` (for metered billing)

### Webhook Events for Metered Billing

The webhook will handle:
- **invoice.finalized**: When usage charges are calculated
- **customer.subscription.updated**: When add-ons are modified
- **subscription_schedule.updated**: For plan changes with add-ons

## Step 4: Customer Portal Configuration

1. Go to Stripe Dashboard → Settings → Billing → Customer Portal
2. Configure:
   - **Subscriptions**: Allow customers to cancel and switch plans
   - **Invoice history**: Enable
   - **Payment methods**: Allow updates
   - **Proration**: Enable for plan changes
4. Save changes

## Step 5: Usage Tracking Integration

### Automatic Overage Reporting

The system automatically:
1. **Tracks real usage** from database tables (`crawler_visits`, `max_visibility_runs`)
2. **Calculates overages** when users exceed plan limits
3. **Reports to Stripe** via metered usage records
4. **Bills monthly** through Stripe's invoice system

### API Endpoints for Usage

- `GET /api/usage/current` - Get usage data and auto-report overages
- `POST /api/usage/track` - Manually track specific usage events
- `POST /api/billing/manage-addons` - Add/remove subscription add-ons

### Real-Time Billing Flow

```
User exceeds AI logs limit → 
Usage API calculates overage → 
Stripe usage record created → 
Monthly invoice includes overage charges
```

## Step 6: Database Integration

The Stripe integration works with the subscription tracking tables:

```sql
-- Enhanced subscription tracking
subscription_usage (
  ai_logs_included,    -- Plan limits
  ai_logs_used,        -- Actual usage
  stripe_subscription_id -- Linked to Stripe
)

-- Detailed usage events
usage_events (
  event_type,          -- 'ai_log_tracked', 'article_generated'
  billable,            -- Whether this creates charges
  cost_cents,          -- Cost in cents
  metadata             -- Stripe usage record IDs
)

-- Add-ons tracking
subscription_add_ons (
  add_on_type,         -- 'extra_articles', 'extra_domains'
  stripe_subscription_item_id, -- Linked to Stripe subscription item
  quantity,            -- Number of add-ons
  unit_price_cents     -- Price per add-on
)
```

## Step 7: Testing Metered Billing

### Test Overage Billing

1. **Create test subscription** with a plan (e.g., Pro = 1000 AI logs)
2. **Simulate usage** that exceeds limits (e.g., 1200 logs)
3. **Check Stripe Dashboard** for usage records
4. **Verify monthly invoice** includes overage charges ($1.60 for 200 logs × $0.008)

### Test Add-ons

1. **Use add-ons API** to add extra articles/domains
2. **Check Stripe subscription** for new line items
3. **Verify proration** on next invoice

### Test Cards

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

## Step 8: Production Deployment

### Environment Setup

1. **Replace test keys** with live Stripe keys
2. **Update webhook endpoint** to production URL
3. **Verify webhook signing secret** for production

### Monitoring

Monitor these Stripe events:
- **Usage records** being created correctly
- **Invoices** including metered charges
- **Failed payments** and dunning management
- **Subscription modifications** (add-ons)

## Step 9: Pricing Strategy Implementation

### Current Pricing Structure

**Base Plans:**
- Free: 100 AI logs, 1 domain, daily scans
- Visibility ($40/mo): 250 AI logs, 1 domain, daily + MAX scans  
- Plus ($200/mo): 500 AI logs, 1 domain, 10 articles, unlimited scans
- Pro ($1000/mo): 1000 AI logs, 3 domains, 30 articles, unlimited scans

**Metered Overages:**
- AI logs: $0.008 per log beyond plan limits
- Extra articles: $10/article/month (subscription add-on)
- Extra domains: $100/domain/month (subscription add-on)

### Revenue Optimization

The metered billing enables:
- **Predictable base revenue** from subscription plans
- **Usage-based scaling** for high-volume customers
- **Flexible add-ons** for growing businesses
- **No service interruptions** (soft limits with billing)

## Step 10: Customer Communication

### Usage Warnings

The system provides:
- **80% usage warnings** before overages
- **Real-time usage tracking** in dashboard
- **Cost transparency** showing potential charges
- **Upgrade prompts** when approaching limits

### Billing Transparency

Customers see:
- **Current usage** vs plan limits
- **Estimated overage costs** in real-time
- **Add-on pricing** before purchasing
- **Detailed invoices** with usage breakdowns

---

## 🚀 Quick Start Checklist

- [ ] Create Stripe products for base plans
- [ ] Create metered pricing for AI logs, articles, domains
- [ ] Configure environment variables
- [ ] Set up webhook endpoint
- [ ] Configure customer portal
- [ ] Test with Stripe test cards
- [ ] Verify usage tracking and billing
- [ ] Deploy to production with live keys

## 🛠 Troubleshooting

### Common Issues

1. **Usage not being tracked**: Check if user has active subscription and metered price is configured
2. **Webhook failures**: Verify webhook signing secret and endpoint URL
3. **Add-ons not working**: Ensure subscription has the correct price IDs
4. **Overage not billed**: Check if metered usage records are being created in Stripe

### Debug Tools

- Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Check Stripe logs in dashboard for webhook delivery
- Monitor application logs for usage tracking events
- Verify database records match Stripe subscription items

## Security Notes

- Never expose your secret key
- Always verify webhook signatures
- Use HTTPS in production
- Implement proper authentication for API routes
- Store sensitive data in environment variables only 