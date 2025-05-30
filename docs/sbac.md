# Subscription-Based Access Control (SBAC) System

## Overview

Split uses a Subscription-Based Access Control system where features and limits are determined by the user's subscription plan. This document outlines the access levels for each tier and implementation guidelines.

## Subscription Tiers

### 🆓 FREE Plan
**Target**: Users exploring AI visibility
- **Price**: $0/month
- **Purpose**: Basic visibility awareness and trial experience

### 👁️ VISIBILITY Plan  
**Target**: Small businesses and individuals
- **Price**: $40/month or $32/month (annual)
- **Purpose**: Regular visibility monitoring and basic insights

### ⚡ PLUS Plan
**Target**: Growing businesses and content creators
- **Price**: $200/month or $160/month (annual)
- **Purpose**: Active visibility improvement with content generation

### 🚀 PRO Plan
**Target**: Agencies and multi-brand companies
- **Price**: $1,000/month or $800/month (annual)
- **Purpose**: Complete visibility management across multiple brands

## Feature Access Matrix

### Core Features

| Feature | FREE | VISIBILITY | PLUS | PRO |
|---------|------|------------|------|-----|
| **Visibility Scans** |
| Basic Scan | 4/month | Daily (base, minimal compute 100 queries) | daily (MAX, 200+ queries) | Unlimited (MAX) |
| MAX Scan (Deep Analysis) | ❌ | ❌ | Daily | Unlimited |
| Scan History | 30 days | 90 days | 180 days | Unlimited |
| Export Scan Results | ❌ | CSV | CSV/JSON | CSV/JSON/API |
| **AI Content Generation** |
| Articles per Month | ❌ | ❌ | 10 | 30 |
| Article Quality | - | - | Standard | Premium |
| Content Optimization | - | - | Basic | Advanced |
| Bulk Generation | - | - | ❌ | ✅ |
| **Domain Management** |
| Domains Tracked | 1 | 1 | 1 | 3 |
| Domain Switching | ❌ | Monthly | Weekly | Anytime |
| Subdomain Tracking | ❌ | ❌ | ✅ | ✅ |
| **Analytics & Insights** |
| Basic Score Display | ✅ | ✅ | ✅ | ✅ |
| Detailed Breakdowns | ❌ | ✅ | ✅ | ✅ |
| Citation Analysis | ❌ | ✅ | ✅ | ✅ |
| Competitor Benchmarking | ❌ | ❌ | ✅ | ✅ |
| Keyword Trend Analysis | ❌ | ❌ | ✅ | ✅ |
| Custom Reports | ❌ | ❌ | ❌ | ✅ |

### Platform Features

| Feature | FREE | VISIBILITY | PLUS | PRO |
|---------|------|------------|------|-----|
| **Integrations** |
| Google Analytics | ❌ | Read-only | Full | Full |
| Vercel Analytics | ❌ | ❌ | ✅ | ✅ |
| Custom Webhooks | ❌ | ❌ | ❌ | ✅ |
| **Support & Features** |
| Email Support | ❌ | Standard | Priority | Priority |
| Onboarding Call | ❌ | ❌ | ❌ | ✅ |
| Custom Training | ❌ | ❌ | ❌ | ✅ |
| Feature Requests | ❌ | ❌ | Considered | Priority |
| **Data & Storage** |
| Data Retention | 90 days | 180 days | 360 days | Unlimited |
| Export Options | ❌ | Basic | Advanced | Full |
| Backup Access | ❌ | ❌ | ✅ | ✅ |

## Page-Level Access Control

### `/visibility` - Visibility & Analytics Dashboard
- **FREE**: Can run basic scan (counts against monthly limit) and view basic score overview
- **VISIBILITY**: Daily basic scans with full results and access to detailed visibility metrics
- **PLUS**: Daily MAX scans with competitive analysis and full analytics with trends
- **PRO**: Unlimited scans with bulk testing options and advanced analytics with custom reports

### `/content` - AI Article Generation
- **FREE**: View demo only, cannot generate
- **VISIBILITY**: Access denied (redirect to upgrade)
- **PLUS**: Generate up to 10 articles/month
- **PRO**: Generate up to 30 premium articles/month

### `/settings` - Account Settings
- **FREE**: Basic settings only (no billing management)
- **VISIBILITY+**: Full settings access with Stripe portal

### `/api-keys` - delete, no longer exists

### `/blog` - Content Management
- **FREE**: Cannot publish
- **VISIBILITY**: Cannot access
- **PLUS**: Manage generated articles
- **PRO**: Full content management suite

## Implementation Guidelines

### 1. Middleware Protection (show page with an upgrade to unlock for users without access)
```typescript
// middleware.ts
const protectedRoutes = {
  '/content': ['plus', 'pro'],
  '/api-keys': ['visibility', 'plus', 'pro'],
  '/analytics/advanced': ['plus', 'pro'],
  '/domains/manage': ['pro']
}
```

### 2. Component-Level Guards
```typescript
// useSubscription hook
export function useSubscription() {
  const plan = getUserPlan()
  
  return {
    plan,
    hasAccess: (feature: string) => checkFeatureAccess(plan, feature),
    isAtLeast: (minPlan: string) => comparePlans(plan, minPlan) >= 0
  }
}
```

### 3. API Rate Limiting
```typescript
// Rate limits by plan
const rateLimits = {
  free: { scans: 5, period: 'month' },
  visibility: { scans: 30, period: 'month' },
  plus: { scans: 'unlimited', articles: 10 },
  pro: { scans: 'unlimited', articles: 30 }
}
```

### 4. Feature Flags
```typescript
// features.config.ts
export const features = {
  maxScan: ['plus', 'pro'],
  competitorAnalysis: ['plus', 'pro'],
  multiDomain: ['pro'],
  customReports: ['pro'],
  bulkOperations: ['pro']
}
```

## Usage Tracking

### Database Schema
```sql
-- usage_tracking table
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  feature TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enforcement Points
1. **Pre-action**: Check limits before allowing action
2. **Post-action**: Increment usage counters
3. **Scheduled**: Reset counters at period boundaries

## Upgrade Prompts

### Smart Upgrade Suggestions
- Show upgrade prompts when users hit limits
- Display what they're missing with current plan
- One-click upgrade to appropriate tier

### Soft Limits
- Warning at 80% of limit
- Hard stop at 100% with upgrade prompt
- Grace period for downgrades (7 days)

## Migration Considerations

### Plan Changes
- **Upgrades**: Immediate access to new features
- **Downgrades**: Grace period until next billing cycle
- **Refunds**: Prorated based on unused time

### Data Retention
- **Downgrade**: Keep data for 30 days
- **Cancellation**: Export window of 7 days
- **Reactivation**: Restore data if within retention period

## Security Considerations

1. **Server-side validation**: Always verify access on backend
2. **Client-side hints**: Use for UI/UX only, not security
3. **Audit logging**: Track all restricted actions
4. **Webhook verification**: Ensure subscription status is current

## Testing Strategy

### Test Scenarios
1. Free user attempting premium features
2. Limit enforcement at boundaries  
3. Plan upgrade/downgrade flows
4. Grace period behavior
5. Multi-domain access (PRO only)

### Test Accounts
- One test account per plan level
- Automated tests for limit enforcement
- Integration tests for Stripe webhooks 