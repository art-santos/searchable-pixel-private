# Stripe Domain Add-on Fix Guide

## The Problem

Domains were incorrectly configured as **metered pricing** (usage-based billing like AI logs) instead of **fixed monthly subscription items**. This caused several issues:

1. ❌ Domains show as "usage pings" instead of monthly line items
2. ❌ Multiple charges appear (prorated + monthly)  
3. ❌ Stripe Customer Portal can't manage individual add-ons
4. ❌ Webhooks don't handle subscription item changes
5. ❌ Billing display is confusing for users

## The Solution

### 1. Create Correct Stripe Products

In your Stripe Dashboard, you need **TWO DIFFERENT** product types:

#### For AI Logs (Usage-Based) ✅ 
- **Product Type**: "Metered usage"
- **Billing Model**: "Usage is metered"
- **Price ID**: Use for `STRIPE_AI_LOGS_METERED_PRICE_ID`

#### For Domains (Fixed Monthly) ⚠️ **NEEDS FIXING**
- **Product Type**: "Recurring"  
- **Billing Model**: "Standard pricing"
- **Price**: $100.00 USD per month
- **Price ID**: Use for `STRIPE_EXTRA_DOMAINS_PRICE_ID`

### 2. Update Environment Variables

```bash
# ✅ Correct - Metered pricing for AI logs
STRIPE_AI_LOGS_METERED_PRICE_ID=price_metered_ai_logs_xxx

# ⚠️ CHANGE - Fixed monthly pricing for domains  
STRIPE_EXTRA_DOMAINS_PRICE_ID=price_monthly_domains_xxx

# ⚠️ CHANGE - Fixed monthly pricing for articles
STRIPE_EXTRA_ARTICLES_PRICE_ID=price_monthly_articles_xxx
```

### 3. Stripe Product Setup Instructions

#### Step 1: Create "Extra Domain" Product
1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. **Name**: "Extra Domain"
4. **Description**: "Additional domain tracking ($100/month)"
5. **Pricing model**: Standard pricing
6. **Price**: $100.00 USD
7. **Billing period**: Monthly
8. **Usage type**: Licensed (not metered)
9. Save and copy the Price ID

#### Step 2: Update Environment Variable
```bash
STRIPE_EXTRA_DOMAINS_PRICE_ID=price_1234567890abcdef
```

### 4. Test the Fix

After updating the Stripe products and environment variables:

1. **Test Adding Domain**: Should show as $100/month line item
2. **Check Customer Portal**: Should allow managing individual add-ons
3. **Verify Billing**: Should show clean monthly charges, not usage pings
4. **Test Removal**: Should allow removing just the domain add-on

### 5. Current vs Fixed Behavior

#### ❌ Current (Broken) Behavior:
```
Prorated charge for Extra Project/Domain: $100.00
Visibility Plan: $40.00  
Extra Project/Domain: $100.00
```

#### ✅ Fixed Behavior:
```
Visibility Plan: $40.00
Extra Domain: $100.00
```

### 6. Database Migration (Optional)

If you have existing domain add-ons that were created with metered pricing, you may need to clean them up:

```sql
-- Check existing add-ons
SELECT * FROM subscription_add_ons WHERE add_on_type = 'extra_domains';

-- If needed, clean up old metered add-ons and let users re-add them
-- with the correct pricing structure
```

## Testing Checklist

- [ ] Create fixed monthly Stripe product for domains
- [ ] Update `STRIPE_EXTRA_DOMAINS_PRICE_ID` environment variable
- [ ] Deploy the updated code
- [ ] Test adding a domain add-on
- [ ] Verify it shows as monthly line item, not usage
- [ ] Test Stripe Customer Portal can manage the add-on
- [ ] Test removing the add-on without canceling subscription

## Notes

- **AI Logs**: Keep as metered pricing (usage-based) ✅
- **Domains**: Change to fixed monthly pricing ⚠️ 
- **Articles**: Change to fixed monthly pricing ⚠️
- The code changes I made will handle both pricing models correctly 