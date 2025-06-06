# AI Crawler Tracking & Billing Logic

## Overview
This document outlines the bulletproof billing logic for AI crawler tracking to prevent revenue loss and ensure proper usage limits.

## User Types & Permissions

### 1. **Admin Users**
- **Tracking**: UNLIMITED crawler event tracking
- **Viewing**: UNLIMITED dashboard data (paginated fetch)
- **Billing**: NO billing charges
- **Payment**: NO payment method required
- **Detection**: `is_admin === true` in profiles table

### 2. **Users WITH Payment Method** 
- **Tracking**: UNLIMITED crawler event tracking
- **Viewing**: UNLIMITED dashboard data (paginated fetch)
- **Billing**: Charged $0.008 per crawler log over plan limit
- **Payment**: Required (Stripe customer with active subscription)
- **Detection**: `stripe_customer_id` exists AND `subscription_status === 'active'`

### 3. **Users WITHOUT Payment Method**
- **Tracking**: LIMITED to plan allowance
- **Viewing**: LIMITED to plan allowance
- **Billing**: NO overages possible (hard blocked)
- **Payment**: Not on file
- **Plan Limits**:
  - Visibility Plan: 250 logs/month
  - Plus Plan: 500 logs/month  
  - Pro Plan: 1,000 logs/month
  - Free Plan: 0 logs

## Implementation Details

### Dashboard Display (`/api/dashboard/crawler-visits` & `/api/dashboard/crawler-stats`)
```javascript
// Pseudo-logic
if (isAdmin) {
  // Fetch ALL data using pagination (chunks of 1000)
  fetchAllDataInChunks()
} else if (hasPaymentMethod) {
  // Fetch ALL data using pagination (chunks of 1000)
  fetchAllDataInChunks()
} else {
  // Apply plan limits
  fetchDataWithLimit(planLimits[subscriptionPlan])
}
```

### Crawler Event Tracking (`/api/crawler-events`)
```javascript
// Pseudo-logic
if (isAdmin) {
  // Always allow tracking, no billing
  insertEvents()
  skipBilling()
} else if (hasPaymentMethod) {
  // Always allow tracking, bill for overages
  insertEvents()
  trackUsageForBilling()
} else {
  // Check current usage vs plan limit
  if (currentUsage >= planLimit) {
    blockWithMessage("Add payment method to continue tracking")
  } else {
    insertEvents()
    trackUsageForBilling()
  }
}
```

## Critical Safety Measures

### 1. **Payment Method Detection**
```typescript
const hasPaymentMethod = !!(
  userProfile?.stripe_customer_id && 
  userProfile?.subscription_status === 'active'
)
```
- Must have BOTH Stripe customer ID AND active subscription
- Prevents false positives from cancelled/expired subscriptions

### 2. **Pagination for Large Datasets**
```typescript
// Supabase has a hard 1000 row limit per query
const chunkSize = 1000
for (let i = 0; i < totalChunks; i++) {
  const chunk = await query.range(i * chunkSize, (i + 1) * chunkSize - 1)
  allData = allData.concat(chunk)
}
```
- Bypasses Supabase's 1000 row limit
- Ensures admins and paying users see ALL their data

### 3. **Billing Preferences**
Users can control:
- **ai_logs_enabled**: Turn off tracking entirely
- **analytics_only_mode**: Track but don't bill (for testing)
- **spending_limit_cents**: Set custom overage caps
- **auto_billing_enabled**: Disable automatic billing

### 4. **Usage Tracking**
- Events tracked in `crawler_visits` table
- Usage aggregated in `subscription_usage` table
- Billing tracked via `track_usage_event` function
- Overage costs: $0.008 per log (0.8 cents)

## Error Messages & User Experience

### No Payment Method
```
"You've reached your [plan] plan limit of [X] crawler logs. 
Add a payment method to continue tracking."
```

### Tracking Disabled
```
"AI crawler tracking is disabled for your account"
```

### Analytics-Only Mode
```
"Usage tracked (analytics-only mode) - no billing"
```

## Database Functions

### `can_bill_overage(user_id, overage_cents, usage_type)`
- Returns `true` for admin users (always)
- Checks billing preferences for regular users
- Respects spending limits and billing toggles

### `track_usage_event(user_id, event_type, amount, metadata)`
- Updates usage counters
- Calculates overage costs
- Respects billing preferences

## Testing Checklist

- [ ] Admin users can see unlimited data
- [ ] Admin users are never charged
- [ ] Users with payment method see unlimited data
- [ ] Users with payment method are charged for overages
- [ ] Users without payment method are limited to plan
- [ ] Users without payment method cannot exceed limits
- [ ] Billing preferences are respected
- [ ] Error messages are clear and actionable
- [ ] Pagination works for large datasets (>1000 rows)
- [ ] Cross-tab workspace switching maintains limits

## Revenue Protection

1. **Hard blocks** for users without payment methods
2. **Clear messaging** about adding payment method
3. **Real-time usage tracking** to prevent overruns
4. **Automatic billing** for overages (if enabled)
5. **Admin bypass** for internal testing without costs 