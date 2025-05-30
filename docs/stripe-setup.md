# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe for your Split application.

## Prerequisites

1. A Stripe account (create one at https://stripe.com)
2. Access to your Stripe Dashboard

## Step 1: Get Your API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle between Test mode and Live mode (start with Test mode)
3. Go to **Developers** → **API keys**
4. Copy your:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

## Step 2: Create Products and Prices

In your Stripe Dashboard:

1. Go to **Products** → **Add product**

### Create the Visibility Plan
- **Name**: Visibility Plan
- **Description**: Daily visibility scans, citation analysis, single domain tracking
- **Pricing**:
  - Monthly: $40/month (recurring)
  - Annual: $384/year (recurring, equals $32/month)

### Create the Plus Plan
- **Name**: Plus Plan
- **Description**: Daily MAX visibility scans, 10 monthly AI articles, priority support
- **Pricing**:
  - Monthly: $200/month (recurring)
  - Annual: $1,920/year (recurring, equals $160/month)

### Create the Pro Plan
- **Name**: Pro Plan
- **Description**: 30 premium articles, unlimited MAX scans, multi-brand tracking
- **Pricing**:
  - Monthly: $1,000/month (recurring)
  - Annual: $9,600/year (recurring, equals $800/month)

After creating each price, copy the Price ID (starts with `price_`)

## Step 3: Set Up Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Use the Stripe CLI to test webhooks locally:

   **Step 1: Download the Stripe CLI and log in**
   ```bash
   # Download and install the Stripe CLI from https://stripe.com/docs/stripe-cli
   stripe login
   ```
   After running `stripe login`, follow the instructions to authenticate with your Stripe account.

   **Step 2: Forward webhook events to your local server**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   This command will forward Stripe events to your local webhook endpoint.

   **Step 3: Trigger test events with the CLI**
   ```bash
   stripe trigger payment_intent.succeeded
   ```
   You can use `stripe trigger` to simulate various events. See [Stripe CLI docs](https://stripe.com/docs/stripe-cli) for more options.

   For production, set your webhook endpoint to:  
   `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`) 

## Step 4: Configure Environment Variables

Create a `.env.local` file in your project root with the following:

```bash
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Price IDs for each plan
STRIPE_VISIBILITY_MONTHLY_PRICE_ID=price_VISIBILITY_MONTHLY_ID
STRIPE_VISIBILITY_ANNUAL_PRICE_ID=price_VISIBILITY_ANNUAL_ID
STRIPE_PLUS_MONTHLY_PRICE_ID=price_PLUS_MONTHLY_ID
STRIPE_PLUS_ANNUAL_PRICE_ID=price_PLUS_ANNUAL_ID
STRIPE_PRO_MONTHLY_PRICE_ID=price_PRO_MONTHLY_ID
STRIPE_PRO_ANNUAL_PRICE_ID=price_PRO_ANNUAL_ID

# Supabase Service Role Key (required for webhook operations)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## Step 5: Configure Stripe Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Enable the customer portal
3. Configure:
   - **Subscriptions**: Allow customers to cancel and switch plans
   - **Invoice history**: Enable
   - **Payment methods**: Allow updates
4. Save changes

## Step 6: Database Integration

The Stripe integration is configured to work with the `profiles` table in your Supabase database. The webhook handlers (`/api/stripe/webhook/route.ts`) automatically:

1. Store Stripe customer IDs with user profiles
2. Track subscription status and plan details
3. Update user permissions based on their plan

The following columns have been added to the `profiles` table:
```sql
-- Stripe-related columns in the profiles table
stripe_customer_id TEXT UNIQUE,
subscription_status TEXT DEFAULT 'free',
subscription_plan TEXT DEFAULT 'free', 
subscription_period_end TIMESTAMP WITH TIME ZONE,
subscription_id TEXT
```

The integration includes:
- **Helper functions** in `src/lib/stripe-profiles.ts` for managing Stripe data
- **Webhook handlers** that automatically update subscription data
- **API route** at `/api/user/subscription` for fetching subscription status
- **Settings page** integration for managing subscriptions

## Step 7: Testing

### Test Payment Flow:
1. Use Stripe test cards: https://stripe.com/docs/testing
2. Common test card: `4242 4242 4242 4242` (any future date, any CVC)
3. Test the complete flow:
   - Plan selection
   - Checkout redirect
   - Successful payment
   - Webhook processing
   - Customer portal access

### Test Webhook Locally:
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. The CLI will show your webhook signing secret

## Step 8: Verify Integration

The settings page automatically:

1. Fetches the user's Stripe customer ID from the profiles table
2. Shows the current subscription status and plan
3. Enables the "Manage" button for existing customers
4. Handles successful payment redirects

## Step 9: Go Live Checklist

Before going live:

- [ ] Replace test API keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Create live mode products and prices
- [ ] Update environment variables with live price IDs
- [ ] Test the complete flow in live mode with a real card
- [ ] Set up proper error handling and logging
- [ ] Configure Stripe email receipts and branding

## Troubleshooting

### Common Issues:

1. **Webhook signature verification failed**
   - Ensure you're using the correct webhook secret
   - Check that the raw request body is being passed to Stripe

2. **Checkout session fails**
   - Verify all price IDs are correct
   - Check that environment variables are loaded

3. **Customer portal not working**
   - Ensure it's enabled in Stripe settings
   - Verify customer ID is being passed correctly

4. **Subscription data not updating**
   - Check Supabase RLS policies on the profiles table
   - Ensure the webhook endpoint is receiving events
   - Check the webhook logs in Stripe Dashboard
   - Verify SUPABASE_SERVICE_ROLE_KEY is set correctly

### Useful Links:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Support](https://support.stripe.com)

## Security Notes

- Never expose your secret key
- Always verify webhook signatures
- Use HTTPS in production
- Implement proper authentication for API routes
- Store sensitive data in environment variables only 