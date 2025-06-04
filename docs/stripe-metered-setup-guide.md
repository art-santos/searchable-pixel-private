# 🎯 **Simple Stripe Metered Pricing Setup Guide**

A step-by-step guide to create the 3 metered pricing products in your Stripe Dashboard.

## **📋 What We're Creating**

1. **AI Crawler Logs** - $0.008 per log (metered usage)
2. **Extra Articles** - $10 per article per month (quantity-based)
3. **Extra Domains** - $100 per domain per month (quantity-based)

---

## **🚀 Step-by-Step Setup**

### **1. AI Crawler Logs Overage ($0.008 per log)**

1. **Go to Stripe Dashboard** → **Products** → **Add product**

2. **Product Details:**
   - **Name**: `AI Crawler Logs`
   - **Description**: `Overage billing for AI crawler logs beyond plan limits`

3. **Pricing:**
   - **Pricing model**: `Standard pricing`
   - **Price**: `$0.008` 
   - **Billing period**: `Monthly`
   - **Usage type**: `Metered` ⭐
   - **Aggregate usage during period**: `Sum`
   - **Unit label**: `logs` (optional)

4. **Click Save**

5. **Copy the Price ID** (starts with `price_`) - you'll need this for environment variables

---

### **2. Extra Articles ($10 per article)**

1. **Add another product** → **Products** → **Add product**

2. **Product Details:**
   - **Name**: `Extra Articles`
   - **Description**: `Additional AI-generated articles beyond plan limits`

3. **Pricing:**
   - **Pricing model**: `Standard pricing`
   - **Price**: `$10.00`
   - **Billing period**: `Monthly`
   - **Usage type**: `Licensed` ⭐
   - **Charge for metered usage**: `Per unit`

4. **Click Save**

5. **Copy the Price ID**

---

### **3. Extra Domains ($100 per domain)**

1. **Add another product** → **Products** → **Add product**

2. **Product Details:**
   - **Name**: `Extra Domains`
   - **Description**: `Additional domain tracking beyond plan limits`

3. **Pricing:**
   - **Pricing model**: `Standard pricing`
   - **Price**: `$100.00`
   - **Billing period**: `Monthly`
   - **Usage type**: `Licensed` ⭐
   - **Charge for metered usage**: `Per unit`

4. **Click Save**

5. **Copy the Price ID**

---

## **⚙️ Add Environment Variables**

Once you have all 3 Price IDs, add them to your `.env.local` file:

```bash
# Metered Usage Prices (replace with your actual price IDs)
STRIPE_AI_LOGS_METERED_PRICE_ID=price_1234567890abcdef
STRIPE_EXTRA_ARTICLES_PRICE_ID=price_0987654321fedcba  
STRIPE_EXTRA_DOMAINS_PRICE_ID=price_abcdef1234567890
```
---

## **🧪 Test Your Setup**

Once configured, test it with our built-in endpoint:

```bash
# Test if everything is configured correctly
curl -X POST http://localhost:3000/api/test/metered-billing \
  -H "Content-Type: application/json" \
  -d '{"action": "check_setup"}'
```

**Expected Response:**
```json
{
  "success": true,
  "environment_check": {
    "all_env_vars_set": true,
    "missing_vars": [],
    "metered_price_ids": {
      "ai_logs": "price_1234567890abcdef",
      "extra_articles": "price_0987654321fedcba",
      "extra_domains": "price_abcdef1234567890"
    }
  }
}
```

---

## **🎯 Key Differences Explained**

### **Metered vs Licensed:**

**Metered (AI Logs):**
- Charges based on actual usage consumed
- Perfect for "pay per log" billing
- Usage gets reported throughout the month
- Billed at end of billing cycle

**Licensed (Articles/Domains):**
- Charges based on quantity subscribed to  
- User subscribes to "5 extra articles"
- Charged immediately when added
- Prorated billing on changes

---

## **🔍 Verification Checklist**

- [ ] All 3 products created in Stripe Dashboard
- [ ] Price IDs copied to `.env.local`
- [ ] Test endpoint returns `all_env_vars_set: true`
- [ ] Price IDs are not null/undefined in response

---

## **💡 Pro Tips**

1. **Start in Test Mode** - Create these in Stripe test mode first
2. **Test Cards** - Use `4242 4242 4242 4242` for testing
3. **Webhook Setup** - You'll need webhooks for invoice handling
4. **Monitor Usage** - Check Stripe Dashboard for usage records being created

---

## **🚨 Common Issues**

**❌ Price ID not found:**
- Double-check you copied the full price ID
- Make sure environment variables are loaded (restart server)

**❌ Metered billing not working:**
- Verify usage type is set to "Metered" for AI logs
- Check that subscription has the metered price attached

**❌ Add-ons not appearing:**
- Ensure user has an active Stripe subscription
- Verify Licensed pricing is configured correctly

---

## **📸 Screenshots Guide**

### Creating AI Crawler Logs (Metered):
```
Products > Add product
┌─────────────────────────────────────┐
│ Name: AI Crawler Logs               │
│ Description: Overage billing...     │
│                                     │
│ Pricing model: Standard pricing     │
│ Price: $0.008                       │
│ Billing period: Monthly             │
│ Usage type: Metered ⭐             │
│ Aggregate: Sum                      │
│ Unit label: logs                    │
└─────────────────────────────────────┘
```

### Creating Extra Articles (Licensed):
```
Products > Add product
┌─────────────────────────────────────┐
│ Name: Extra Articles                │
│ Description: Additional AI...       │
│                                     │
│ Pricing model: Standard pricing     │
│ Price: $10.00                       │
│ Billing period: Monthly             │
│ Usage type: Licensed ⭐            │
│ Charge: Per unit                    │
└─────────────────────────────────────┘
```

---

## **🎉 Next Steps**

Once you complete this setup, your metered billing system will be fully functional! Users will automatically get billed for:

- **AI log overages** at $0.008 per log
- **Extra articles** they subscribe to at $10/month each  
- **Extra domains** they add at $100/month each

The system will handle all the usage tracking and billing automatically!

For testing the complete integration, see: [`docs/stripe-setup.md`](./stripe-setup.md) 