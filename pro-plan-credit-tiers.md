# Pro Plan Credit Tiers

## Overview

The Split Pro plan offers flexible credit-based pricing for lead generation. All Pro plans include the same features: unlimited AI-Crawler Tracking, Snapshot Audits, Historical Dashboards, CSV Export, Zapier/Make.com integrations, Three Seats & Multiple Workspaces, and Priority email & chat support. The only difference is the number of lead credits included each month.

**Credit Usage:**
- **Normal Lead**: 1 credit (standard company + contact enrichment)
- **Max Lead**: 5 credits (enhanced enrichment with social signals, media mentions, etc.)

---

## Credit Tiers

### Pro - 250 Credits
**Monthly:** $100/month ($0.40 per credit)  
**Annual:** $83/month ($996/year) - *17% savings*

**Description:** 250 lead generation credits per month with all Pro features included.

---

### Pro - 500 Credits
**Monthly:** $180/month ($0.36 per credit)  
**Annual:** $149/month ($1,788/year) - *17% savings*

**Description:** 500 lead generation credits per month with all Pro features included.

---

### Pro - 1,000 Credits
**Monthly:** $300/month ($0.30 per credit)  
**Annual:** $249/month ($2,988/year) - *17% savings*

**Description:** 1,000 lead generation credits per month with all Pro features included.

---

### Pro - 2,500 Credits
**Monthly:** $650/month ($0.26 per credit)  
**Annual:** $540/month ($6,480/year) - *17% savings*

**Description:** 2,500 lead generation credits per month with all Pro features included.

---

### Pro - 5,000 Credits
**Monthly:** $1,100/month ($0.22 per credit)  
**Annual:** $913/month ($10,956/year) - *17% savings*

**Description:** 5,000 lead generation credits per month with all Pro features included.

---

### Pro - 10,000 Credits
**Monthly:** $1,800/month ($0.18 per credit)  
**Annual:** $1,494/month ($17,928/year) - *17% savings*

**Description:** 10,000 lead generation credits per month with all Pro features included.

---

## Credit Economics

| Credits | Monthly Cost | Cost per Credit | Annual Savings |
|---------|--------------|-----------------|----------------|
| 250 | $100 | $0.40 | $204/year |
| 500 | $180 | $0.36 | $372/year |
| 1,000 | $300 | $0.30 | $612/year |
| 2,500 | $650 | $0.26 | $1,320/year |
| 5,000 | $1,100 | $0.22 | $2,244/year |
| 10,000 | $1,800 | $0.18 | $3,672/year |

## What's Included (All Pro Plans)

### Core Features
- ✅ Unlimited AI-Crawler Tracking
- ✅ Unlimited Snapshot Audits  
- ✅ Historical Dashboards (all timeframes)
- ✅ Single Workspace
- ✅ Email support during business hours

### Pro Features
- ✅ Lead Credits (credit amount varies by plan)
- ✅ CSV Export
- ✅ Zapier/Make.com integrations
- ✅ Three Seats & Multiple Workspaces
- ✅ Priority email & chat support

### Lead Generation Features
- ✅ Company identification and enrichment
- ✅ Contact discovery and verification
- ✅ Basic firmographic data
- ✅ Email finding and verification
- ✅ LinkedIn profile matching
- ✅ Technology stack detection

### Max Lead Enrichment (5 credits)
- ✅ Advanced social signals
- ✅ Media mentions and publications
- ✅ Thought leadership scoring
- ✅ Professional experience details
- ✅ Education and certification data
- ✅ Recent activity and engagement

## Migration Information

### Existing Users
- Current Pro users automatically receive 250 credits at their existing $100/month rate
- No disruption to existing workflows
- Can upgrade to higher credit tiers at any time
- Annual subscribers maintain their billing schedule

### Upgrade Path
- Users can upgrade tiers immediately with prorated billing
- Unused credits roll over within the same billing period
- Downgrades take effect at the next billing cycle

---

## Implementation Notes

### Stripe Price IDs Required

#### Monthly Price IDs
```env
STRIPE_PRO_250_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_500_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_1000_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_2500_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_5000_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_10000_MONTHLY_PRICE_ID=price_xxx
```

#### Annual Price IDs
```env
STRIPE_PRO_250_ANNUAL_PRICE_ID=price_xxx
STRIPE_PRO_500_ANNUAL_PRICE_ID=price_xxx
STRIPE_PRO_1000_ANNUAL_PRICE_ID=price_xxx
STRIPE_PRO_2500_ANNUAL_PRICE_ID=price_xxx
STRIPE_PRO_5000_ANNUAL_PRICE_ID=price_xxx
STRIPE_PRO_10000_ANNUAL_PRICE_ID=price_xxx
```

### Database Schema
- Credit allocation stored in `subscription_usage.lead_credits_included`
- Usage tracking via `subscription_usage.lead_credits_used`
- Credit metadata passed through Stripe webhook

---

*Need more than 10,000 credits? [Contact Sales](mailto:sam@split.dev) for custom Enterprise pricing with 1,500+ credits per month, direct connectors, unlimited seats, and dedicated success engineering.* 