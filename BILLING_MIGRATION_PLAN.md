# Split Billing Migration Plan: New Pricing Model Implementation

## 🔍 Current System Analysis

### Current Pricing Plans
```
free      - $0/mo   - 4 scans, no articles, 90-day retention
visibility - $100/mo - 30 scans, no articles, 180-day retention  
plus      - $200/mo - Unlimited scans, 10 articles, 3.75k visitor credits, 360-day retention
pro       - $800/mo - Unlimited scans, 30 articles, 15k visitor credits, multi-domain (3), priority support
```

### Current Add-ons
- **AI Logs**: Metered pricing ($0.25, $0.20, $0.15 per credit in tiers)
- **Extra Articles**: Fixed price per month
- **Extra Domains**: $100/mo per additional domain

### Current Database Schema
- `subscription_plan`: `free`, `visibility`, `plus`, `pro`
- Complex visitor credit system with tiered billing
- SBAC system with usage tracking and limits
- Stripe integration with 6 price IDs + 3 add-on price IDs

---

## 🎯 New Pricing Model

### New Plans
```
starter - $30/mo  - 1 domain, basic features, 10 snapshots/month
pro     - $100/mo - 1 domain, full features, 50 snapshots/month, API access  
team    - $400/mo - 5 domains, unlimited snapshots, team access (5 users)
```

### New Add-ons
- **Extra Domain**: +$100/mo (Pro & Team plans only)
- **Edge Alerts**: +$10/mo (real-time webhook alerts)

---

## 📋 Migration Requirements

### 1. Database Schema Changes

#### Update Subscription Plans
```sql
-- Update subscription_plan constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_plan_check 
CHECK (subscription_plan IN ('starter', 'pro', 'team'));
```

#### Remove Complex Usage Tracking
- Remove visitor credit systems
- Remove article generation limits
- Simplify usage tracking to just snapshots

#### Add Team Features
```sql
-- Add team functionality
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_team_members INTEGER DEFAULT 1;

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. SBAC System Updates

#### New Feature Limits Function
```sql
CREATE OR REPLACE FUNCTION check_feature_access(
    p_user_id UUID,
    p_feature TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan TEXT;
    v_domain_count INTEGER;
    v_team_size INTEGER;
BEGIN
    -- Get user's plan and counts
    SELECT 
        subscription_plan,
        (SELECT COUNT(*) FROM workspaces WHERE user_id = p_user_id),
        team_size
    INTO v_plan, v_domain_count, v_team_size
    FROM profiles WHERE id = p_user_id;
    
    CASE p_feature
        WHEN 'api_access' THEN
            RETURN v_plan IN ('pro', 'team');
        WHEN 'team_access' THEN
            RETURN v_plan = 'team';
        WHEN 'unlimited_snapshots' THEN
            RETURN v_plan = 'team';
        WHEN 'slack_alerts' THEN
            RETURN v_plan IN ('pro', 'team');
        WHEN 'csv_export' THEN
            RETURN v_plan IN ('pro', 'team');
        WHEN 'pdf_reports' THEN
            RETURN v_plan IN ('pro', 'team');
        WHEN 'multi_domain' THEN
            CASE v_plan
                WHEN 'starter' THEN RETURN v_domain_count <= 1;
                WHEN 'pro' THEN RETURN v_domain_count <= 1; -- +add-ons
                WHEN 'team' THEN RETURN v_domain_count <= 5; -- +add-ons
                ELSE RETURN FALSE;
            END CASE;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Snapshot Limits Function
```sql
CREATE OR REPLACE FUNCTION check_snapshot_limit(
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan TEXT;
    v_current_month_count INTEGER;
    v_limit INTEGER;
BEGIN
    SELECT subscription_plan INTO v_plan FROM profiles WHERE id = p_user_id;
    
    -- Count snapshots this month
    SELECT COUNT(*) INTO v_current_month_count
    FROM snapshots 
    WHERE user_id = p_user_id 
    AND created_at >= date_trunc('month', NOW());
    
    -- Set limits
    v_limit := CASE v_plan
        WHEN 'starter' THEN 10
        WHEN 'pro' THEN 50
        WHEN 'team' THEN -1 -- unlimited
        ELSE 0
    END;
    
    RETURN v_limit = -1 OR v_current_month_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Stripe Configuration Updates

#### New Price IDs Required
```env
# Remove old price IDs
# STRIPE_VISIBILITY_MONTHLY_PRICE_ID
# STRIPE_VISIBILITY_ANNUAL_PRICE_ID  
# STRIPE_PLUS_MONTHLY_PRICE_ID
# STRIPE_PLUS_ANNUAL_PRICE_ID
# STRIPE_PRO_MONTHLY_PRICE_ID
# STRIPE_PRO_ANNUAL_PRICE_ID

# Add new price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_starter_monthly_new
STRIPE_STARTER_ANNUAL_PRICE_ID=price_starter_annual_new
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly_new  
STRIPE_PRO_ANNUAL_PRICE_ID=price_pro_annual_new
STRIPE_TEAM_MONTHLY_PRICE_ID=price_team_monthly_new
STRIPE_TEAM_ANNUAL_PRICE_ID=price_team_annual_new

# New add-on price IDs
STRIPE_EDGE_ALERTS_PRICE_ID=price_edge_alerts_new
# Keep: STRIPE_EXTRA_DOMAINS_PRICE_ID (same pricing)

# Remove metered billing
# STRIPE_AI_LOGS_METERED_PRICE_ID
# STRIPE_EXTRA_ARTICLES_PRICE_ID
```

#### Update Stripe Helper Functions
```typescript
// src/lib/stripe.ts updates needed:

export function getPriceId(planId: string, isAnnual: boolean): string | null {
  const priceIds: Record<string, string> = {
    starter_monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    starter_annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!,
    pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
    team_monthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
    team_annual: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID!,
  }

  const billing = isAnnual ? 'annual' : 'monthly'
  const key = `${planId}_${billing}`
  
  return priceIds[key] || null
}

export function getAddOnPriceId(type: 'extra_domains' | 'edge_alerts'): string | null {
  const addOnPriceIds: Record<string, string> = {
    extra_domains: process.env.STRIPE_EXTRA_DOMAINS_PRICE_ID!,
    edge_alerts: process.env.STRIPE_EDGE_ALERTS_PRICE_ID!,
  }
  
  return addOnPriceIds[type] || null
}

export function mapSubscriptionToPlan(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id

  const priceMap: Record<string, string> = {
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!]: 'starter',
    [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!]: 'starter',
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]: 'pro',
    [process.env.STRIPE_PRO_ANNUAL_PRICE_ID!]: 'pro',
    [process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!]: 'team',
    [process.env.STRIPE_TEAM_ANNUAL_PRICE_ID!]: 'team',
  }
  
  return priceMap[priceId] || 'starter' // default to starter, no free plan
}
```

### 4. Frontend Component Updates

#### Update Pricing Constants
```typescript
// src/components/onboarding/utils/onboarding-constants.ts

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Start tracking AI crawler traffic with 10 lines of code',
    monthlyPrice: 30,
    annualPrice: 25, // ~17% discount
    features: [
      '1 domain',
      'Basic crawler tracking',
      'Total daily crawl count',
      '7-day crawl history',
      'Snapshot reports: 10/month',
      'Email alerts (first crawl only)',
      'Immediate billing'
    ],
          buttonText: 'Start Starter',
    buttonStyle: 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]',
    badge: '🧪',
    badgeColor: 'bg-blue-500'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Full visibility + analytics for serious projects',
    monthlyPrice: 100,
    annualPrice: 83, // ~17% discount
    features: [
      '1 domain',
      'Full crawler breakdown',
      'Bot name, company, timestamp, page path',
      '90-day crawl history',
      'Snapshot reports: 50/month',
      'Smart alerts (spike detection, bot-specific)',
      'Page-level crawler logs',
      'API access',
      'CSV export',
      'PDF audit report export'
    ],
    isRecommended: true,
    buttonText: 'Start Pro',
    buttonStyle: 'bg-white hover:bg-[#f5f5f5] text-black',
    badge: '⚡️',
    badgeColor: 'bg-yellow-500'
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For agencies & multi-site operations',
    monthlyPrice: 400,
    annualPrice: 333, // ~17% discount
    features: [
      '5 domains included',
      'Unlimited snapshots',
      'All Pro features',
      'Team access (up to 5 users)',
      'Slack/Discord alerts',
      'Workspace analytics (cross-domain rollup)',
      'Anomaly detection & scheduled reports',
      'Priority support'
    ],
    buttonText: 'Start Team',
    buttonStyle: 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]',
    badge: '🧑‍🤝‍🧑',
    badgeColor: 'bg-purple-500'
  }
]
```

#### Update Billing Settings Component
- Remove visitor credit slider and complex billing logic
- Add team member management UI
- Update add-on management for edge alerts
- Simplify usage display to focus on snapshots and domains

### 5. Migration Strategy

#### Phase 1: Database Preparation
1. Create new subscription plan constraints
2. Add team functionality tables
3. Update SBAC functions
4. Create data migration scripts

#### Phase 2: Stripe Setup
1. Create new products and prices in Stripe
2. Update environment variables
3. Test checkout flows
4. Update webhook handlers

#### Phase 3: Code Updates
1. Update pricing constants
2. Modify billing components
3. Update access control checks
4. Remove complex usage tracking

#### Phase 4: User Migration
1. Migration script for existing users:
   ```sql
   UPDATE profiles SET 
       subscription_plan = CASE subscription_plan
           WHEN 'free' THEN 'starter'
           WHEN 'visibility' THEN 'pro' 
           WHEN 'plus' THEN 'pro'
           WHEN 'pro' THEN 'team'
           ELSE 'starter'
       END
   WHERE subscription_plan IN ('free', 'visibility', 'plus', 'pro');
   ```

#### Phase 5: Clean Up
1. Remove old price IDs
2. Archive unused tables
3. Update documentation

---

## 🚨 Breaking Changes

### Removed Features
- ❌ Free plan completely removed
- ❌ Complex visitor credit system
- ❌ Article generation features
- ❌ Metered AI logs billing
- ❌ Tiered usage pricing

### Changed Features
- ⚠️ API access now requires Pro+ (was Plus+)
- ⚠️ Multi-domain support reduced (Team: 5 domains vs Pro: 3 domains)
- ⚠️ Snapshot limits introduced (Starter: 10, Pro: 50, Team: unlimited)

### New Features
- ✅ Immediate billing for all plans
- ✅ Team access and collaboration (Team plan)
- ✅ Edge alerts add-on
- ✅ Simplified pricing structure

---

## 📊 Expected Impact

### Revenue Impact
- **Positive**: Higher entry price point ($30 vs $0)
- **Positive**: Clearer value proposition per plan
- **Risk**: Potential churn from free users
- **Mitigation**: Competitive pricing attracts immediate conversions

### User Experience
- **Better**: Simpler pricing structure
- **Better**: Clear feature boundaries
- **Risk**: Some users may need to upgrade
- **Mitigation**: Generous migration mapping

### System Complexity
- **Reduced**: Remove complex metered billing
- **Reduced**: Simplified usage tracking
- **Added**: Team management features

---

## 🎯 Implementation Timeline

### Week 1: Planning & Database
- [ ] Database schema updates
- [ ] SBAC function updates
- [ ] Create migration scripts

### Week 2: Stripe Integration
- [ ] Create new Stripe products/prices
- [ ] Update code for new price IDs
- [ ] Test checkout flows
- [ ] Update webhook handling

### Week 3: Frontend Updates
- [ ] Update pricing constants
- [ ] Modify billing components
- [ ] Add team management UI
- [ ] Update access control UI

### Week 4: Migration & Testing
- [ ] User data migration
- [ ] End-to-end testing
- [ ] Monitor for issues
- [ ] Performance validation

### Week 5: Launch & Cleanup
- [ ] Deploy to production
- [ ] Monitor metrics
- [ ] Clean up old code
- [ ] Update documentation

---

## 🔧 Technical Debt Cleanup

This migration provides an opportunity to:
- Remove complex visitor credit calculations
- Simplify billing logic throughout the codebase
- Clean up unused database tables
- Consolidate similar features
- Improve test coverage for billing flows

---

## 📈 Success Metrics

### Key Performance Indicators
- **Conversion Rate**: Trial to paid conversion
- **ARPU**: Average revenue per user increase
- **Churn Rate**: Monitor for acceptable levels
- **Support Tickets**: Pricing confusion reduction
- **User Satisfaction**: Clearer value proposition

### Monitoring Points
- Stripe webhook success rates
- Database query performance
- User migration completion
- Feature usage distribution
- Support ticket volume

---

This migration represents a significant simplification of the billing system while maintaining revenue growth potential through higher entry pricing and clearer value propositions. 