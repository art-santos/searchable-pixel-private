# Stripe Products Setup Guide

## 🎯 New Split Pricing Model - Stripe Configuration

Copy these exact configurations into your Stripe Dashboard to match the new pricing structure.

---

## 📦 Product 1: Split Starter Plan

**Product Name**: `Split Starter Plan`  
**Description**: `Start tracking AI crawler traffic with 10 lines of code`

### Prices:
- **Monthly**: `$30.00 USD` - Recurring every 1 month
- **Annual**: `$25.00 USD` - Recurring every 1 year

### Features (for reference):
- 1 domain
- Simple code snippet setup
- Basic crawler tracking
- 7-day crawl history  
- 10 snapshots/month
- Email alerts (first crawl only)
- 7-day free trial

---

## 📦 Product 2: Split Pro Plan  

**Product Name**: `Split Pro Plan`  
**Description**: `Full visibility + analytics ready in under 10 lines of codes or a simple snippet.`

### Prices:
- **Monthly**: `$100.00 USD` - Recurring every 1 month  
- **Annual**: `$83.00 USD` - Recurring every 1 year (17% discount)

### Features (for reference):
- 1 domain
- Full crawler breakdown
- Bot name, company, timestamp, page path
- 90-day crawl history
- 50 snapshots/month
- Smart alerts (spike detection, bot-specific)
- Page-level crawler logs
- API access
- CSV export  
- PDF audit report export

---

## 📦 Product 3: Split Team Plan

**Product Name**: `Split Team Plan`  
**Description**: `For agencies & multi-site operations`

### Prices:
- **Monthly**: `$400.00 USD` - Recurring every 1 month
- **Annual**: `$333.00 USD` - Recurring every 1 year (17% discount)

### Features (for reference):
- 5 domains included
- Unlimited snapshots
- All Pro features
- Team access (up to 5 users)
- Slack/Discord alerts
- Workspace analytics (cross-domain rollup)
- Anomaly detection & scheduled reports
- Priority support

---

## 🧩 Add-on Products

### Product 4: Extra Domain Add-on

**Product Name**: `Extra Domain Add-on`  
**Description**: `Add an additional domain to your plan`

### Price:
- **Monthly**: `$100.00 USD` - Recurring every 1 month

**Note**: Available for Pro & Team plans only

---

### Product 5: Edge Alerts Add-on

**Product Name**: `Edge Alerts Add-on`  
**Description**: `Real-time webhook alerts for crawler spikes or new bot activity`

### Price:
- **Monthly**: `$10.00 USD` - Recurring every 1 month

**Note**: Available for all plans

---

## 🔑 After Creating Products

1. **Copy the Price IDs** from each product (they start with `price_`)
2. **Update your `.env.local`** with the actual price IDs:

```env
# Starter Plan
STRIPE_STARTER_MONTHLY_PRICE_ID=price_abc123starter_monthly
STRIPE_STARTER_ANNUAL_PRICE_ID=price_abc123starter_annual

# Pro Plan  
STRIPE_PRO_MONTHLY_PRICE_ID=price_abc123pro_monthly
STRIPE_PRO_ANNUAL_PRICE_ID=price_abc123pro_annual

# Team Plan
STRIPE_TEAM_MONTHLY_PRICE_ID=price_abc123team_monthly
STRIPE_TEAM_ANNUAL_PRICE_ID=price_abc123team_annual

# Add-ons
STRIPE_EXTRA_DOMAINS_PRICE_ID=price_abc123extra_domains
STRIPE_EDGE_ALERTS_PRICE_ID=price_abc123edge_alerts
```

3. **Test checkout flows** in Stripe test mode first
4. **Update webhooks** to handle the new plan names

---

## 🎛️ Stripe Dashboard Steps

### Step 1: Create Products
1. Go to **Products** in your Stripe Dashboard
2. Click **"Add product"**
3. Enter the product name and description from above
4. Set pricing model to **"Standard pricing"**
5. Choose **"Recurring"** 
6. Set the price and billing interval
7. Click **"Save product"**
8. **Repeat for each price tier** (monthly/annual)

### Step 2: Configure Trial (Starter Plan Only)
1. For Starter plan, in the **Checkout Settings**:
2. Enable **"Free trial"**
3. Set trial period to **7 days**

### Step 3: Copy Price IDs
1. In each product, click on the price
2. Copy the **Price ID** (starts with `price_`)
3. Update your environment variables

### Step 4: Test Integration
1. Use Stripe's test mode
2. Test checkout flows for each plan
3. Verify webhooks receive correct plan names
4. Test trial functionality for Starter plan

---

## 🚨 Important Notes

### Plan Mapping Changes:
- ❌ **No Free Plan** - Removed completely
- ✅ **Starter replaces Free** - $30/mo with 7-day trial
- ✅ **Pro simplified** - No visitor credits complexity  
- ✅ **Team gets multi-workspace** - 5 workspaces included

### Workspace Limits:
- **Starter & Pro**: 1 workspace only
- **Team**: 5 workspaces included (1 primary + 4 additional)
- **Add-on domains**: Available for Pro & Team plans

### Trial Configuration:
- **Starter Plan**: 7-day free trial
- **Pro & Team**: No trial (immediate billing)

---

## ✅ Verification Checklist

- [ ] All 3 main products created with correct pricing
- [ ] Both monthly and annual prices for each plan  
- [ ] 2 add-on products created
- [ ] Price IDs copied to environment variables
- [ ] Starter plan configured with 7-day trial
- [ ] Test checkout sessions work
- [ ] Webhook endpoints handle new plan names
- [ ] Team plan workspace limits enforced

---

This setup eliminates the complex visitor credit system and domain add-on billing, creating a much cleaner pricing structure that's easier to understand and manage. 