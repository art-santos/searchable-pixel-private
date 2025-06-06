# Split AI Attribution Platform - Implementation Plan

## 🎯 Core Features Overview

Split is transitioning to a focused AI attribution platform with three core features:

1. **AI-crawler attribution data analytics** (existing `crawler_visits`)
2. **LLM-attributed visitor leads** (RB2B-style) - **NOT YET IMPLEMENTED**
3. **Snapshots** (URL visibility and link health analysis) - **NOT YET IMPLEMENTED**

## 💳 New Pricing Structure

### Plans
- **Plus — $99/mo**: Solo operators tracking basic AI visibility
- **Pro — $299/mo**: Teams wanting attribution and insights
- **Enterprise — Custom**: AI-native platforms and large agencies

### Workspace-Centric Design
- 1 domain/project included in all plans
- +$100/mo per additional domain/workspace (regardless of plan tier)
- Attribution credits are **account-level**, not workspace-level
- All billing goes through same Stripe portal (centralized billing)

## ✅ Completed Updates

### Subscription Config (`src/lib/subscription/config.ts`)
- [x] Updated plans: `plus`, `pro`, `enterprise`
- [x] New pricing: $99, $299, custom
- [x] Attribution credits system defined
- [x] Snapshots limits configured
- [x] Feature flags for upcoming functionality

### Settings Page (`src/app/settings/page.tsx`)
- [x] Updated pricing plans display
- [x] Removed old visibility scan references
- [x] Updated to focus on AI crawler attribution
- [x] Workspace-centric domain management preserved

## 🚧 Pending Implementation

### 1. Database Schema Updates

#### New Tables Needed:
```sql
-- Attribution credits tracking (account-level)
CREATE TABLE attribution_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  credits_included integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  credits_purchased integer NOT NULL DEFAULT 0, -- from credit packs
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Visitor leads (RB2B-style) - workspace-specific
CREATE TABLE visitor_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  ip_address inet,
  company_name text,
  domain text,
  industry text,
  employee_count integer,
  revenue_range text,
  technologies text[], -- JSON array of detected technologies
  visit_data jsonb, -- pages visited, time on site, etc.
  attribution_method text, -- how we identified this lead
  confidence_score numeric(3,2), -- 0.00 to 1.00
  credits_used integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Snapshots - workspace-specific
CREATE TABLE snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  url text NOT NULL,
  snapshot_type text DEFAULT 'full', -- 'full', 'quick', 'competitive'
  status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  results jsonb, -- snapshot analysis results
  visibility_score numeric(5,2),
  link_health_score numeric(5,2),
  ai_visibility jsonb, -- AI model visibility breakdown
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Snapshot usage tracking (workspace-specific)
CREATE TABLE snapshot_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshots_included integer NOT NULL DEFAULT 0,
  snapshots_used integer NOT NULL DEFAULT 0,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. API Endpoints to Implement

#### Attribution Credits
- `GET /api/attribution/credits` - Get current credit balance
- `POST /api/attribution/credits/purchase` - Buy credit packs
- `POST /api/attribution/credits/use` - Use credits for visitor attribution

#### Visitor Leads (RB2B-style)
- `GET /api/visitor-leads` - List attributed visitor leads
- `POST /api/visitor-leads/identify` - Identify visitor from IP/session
- `GET /api/visitor-leads/[id]` - Get detailed lead information
- `POST /api/visitor-leads/export` - Export leads to CRM

#### Snapshots
- `GET /api/snapshots` - List snapshots for workspace
- `POST /api/snapshots` - Create new snapshot
- `GET /api/snapshots/[id]` - Get snapshot results
- `DELETE /api/snapshots/[id]` - Delete snapshot

### 3. Usage Tracking Updates

#### Current Usage Interface Updates (`UsageData`)
```typescript
interface UsageData {
  // ... existing fields ...
  
  // NEW: Attribution credits (account-level)
  attributionCredits: {
    included: number
    used: number
    purchased: number
    remaining: number
    percentage: number
    overage: number
    overageCost: number
    pricePerCredit: number
  }
  
  // NEW: Snapshots (workspace-specific)
  snapshots: {
    included: number
    used: number
    remaining: number
    percentage: number
  }
  
  // NEW: Visitor leads count (workspace-specific)
  visitorLeads: {
    totalThisMonth: number
    attributedToday: number
    creditsUsedForAttribution: number
  }
}
```

### 4. Frontend Components to Build

#### Attribution Credits Management
- Credit balance display
- Credit pack purchase flow
- Credit usage analytics
- Per-workspace credit attribution tracking

#### Visitor Leads Dashboard
- Lead list with company information
- Lead detail view with visit analytics
- Attribution confidence indicators
- CRM export functionality

#### Snapshots Interface
- Snapshot creation form
- Snapshot results dashboard
- Historical snapshot comparison
- Link health monitoring

### 5. Billing System Updates

#### Stripe Integration Updates
- Add credit pack products to Stripe
- Update webhook handlers for credit purchases
- Implement usage-based billing for attribution credits
- Add snapshot usage to billing calculations

#### Pricing Logic Updates
```typescript
// Account-level credit billing
const calculateCreditOverage = (plan: PlanType, used: number, included: number) => {
  if (used <= included) return 0
  const overage = used - included
  const pricePerCredit = getSubscriptionLimits(plan).attributionCredits.price
  return overage * pricePerCredit
}

// Workspace-level domain billing (existing, but needs validation)
const calculateDomainCosts = (extraWorkspaces: number) => {
  return extraWorkspaces * 100 // $100 per additional domain/workspace
}
```

## 📋 Implementation Priority

### Phase 1: Core Infrastructure (Week 1-2)
1. Database schema updates
2. Basic API endpoints for new features
3. Updated usage tracking interfaces
4. Billing system integration for credits

### Phase 2: Visitor Leads Feature (Week 3-4)
1. IP-to-company identification service integration
2. Visitor leads dashboard
3. Attribution credit consumption logic
4. Basic visitor analytics

### Phase 3: Snapshots Feature (Week 5-6)
1. URL analysis engine
2. Snapshots creation and management
3. Results visualization
4. Historical comparison tools

### Phase 4: Advanced Features (Week 7-8)
1. CRM integrations (Enterprise)
2. Slack alerts for Pro/Enterprise
3. Advanced attribution analytics
4. Custom models for Enterprise

## 🔄 Migration Considerations

### Existing Customer Migration
- Map `visibility` plan to `plus` plan
- Preserve existing domain add-ons
- Grandfather existing pricing for 3 months
- Migrate crawler_visits data (no changes needed)

### Data Retention Updates
- Update retention policies: 30 days (Plus), 90 days (Pro), unlimited (Enterprise)
- Implement data cleanup jobs for expired retention periods

## 📊 Analytics & Monitoring

### New Metrics to Track
- Attribution credits usage per account
- Visitor leads conversion rates
- Snapshot usage patterns
- Feature adoption by plan tier
- Credit pack purchase patterns

### Business Intelligence
- Revenue per attribution credit
- Cost per attributed visitor lead
- Snapshot ROI analysis
- Workspace scaling patterns

## 🚀 Next Steps

1. **Immediate**: Fix remaining TypeScript errors in settings page
2. **This Week**: Implement database schema updates
3. **Next Week**: Start visitor leads API development
4. **Following Week**: Begin snapshots infrastructure

## 📝 Notes

- Keep existing `crawler_visits` table unchanged - it's the foundation
- Attribution credits are shared across all user's workspaces
- Snapshots and visitor leads are workspace-specific
- All billing remains centralized through one Stripe customer
- Credit packs can be purchased anytime and persist across billing periods 