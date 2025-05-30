# SBAC Implementation Plan

## Phase 1: Database Setup ✅

### Required Database Changes

#### 1. Update `profiles` table
```sql
-- Add usage tracking columns to profiles (simpler approach)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_scans_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_articles_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scan_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_articles_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

#### 2. Create `usage_events` table (for detailed tracking)
```sql
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'scan', 'article', 'api_call'
  event_subtype TEXT, -- 'basic_scan', 'max_scan', 'standard_article', 'premium_article'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX idx_usage_events_created_at ON public.usage_events(created_at);
CREATE INDEX idx_usage_events_type ON public.usage_events(event_type);
```

#### 3. Create `scan_history` table (for retention management)
```sql
CREATE TABLE IF NOT EXISTS public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT 'basic', -- 'basic' or 'max'
  domain TEXT NOT NULL,
  score INTEGER,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX idx_scan_history_created_at ON public.scan_history(created_at);
```

#### 4. Create `generated_content` table
```sql
CREATE TABLE IF NOT EXISTS public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'article', -- 'article', 'report'
  quality_tier TEXT DEFAULT 'standard', -- 'standard', 'premium'
  metadata JSONB DEFAULT '{}',
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_generated_content_user_id ON public.generated_content(user_id);
CREATE INDEX idx_generated_content_slug ON public.generated_content(slug);
```

## Phase 2: Core Utilities Implementation ✅

### 1. Create Subscription Config (`src/lib/subscription/config.ts`) ✅
```typescript
export const PLANS = {
  free: { order: 0, name: 'Free' },
  visibility: { order: 1, name: 'Visibility' },
  plus: { order: 2, name: 'Plus' },
  pro: { order: 3, name: 'Pro' }
} as const

export const LIMITS = {
  free: {
    scans: { max: 4, period: 'month' as const },
    scanType: 'basic',
    articles: { max: 0 },
    domains: { max: 1 },
    dataRetention: 90, // days
  },
  visibility: {
    scans: { max: 30, period: 'month' as const },
    scanType: 'basic',
    articles: { max: 0 },
    domains: { max: 1 },
    dataRetention: 180,
  },
  plus: {
    scans: { max: -1 }, // unlimited
    scanType: 'max',
    articles: { max: 10, period: 'month' as const },
    domains: { max: 1 },
    dataRetention: 360,
  },
  pro: {
    scans: { max: -1 },
    scanType: 'max',
    articles: { max: 30, period: 'month' as const },
    domains: { max: 3 },
    dataRetention: -1, // unlimited
  },
}
```

### 2. Create Subscription Hook (`src/hooks/useSubscription.ts`) ✅
```typescript
export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData>()
  const [usage, setUsage] = useState<UsageData>()
  
  // Fetch subscription and usage data
  // Check feature access
  // Return helper methods
}
```

### 3. Create Usage Tracking Service (`src/lib/subscription/usage.ts`) ✅
```typescript
export async function trackUsage(userId: string, eventType: string) {
  // Record usage event
  // Update counters
  // Check limits
}

export async function checkLimit(userId: string, feature: string) {
  // Check if user can use feature
  // Return remaining usage
}

export async function resetMonthlyUsage() {
  // Scheduled job to reset counters
}
```

## Phase 2 Implementation Status ✅

### Completed Files:
1. ✅ `src/lib/subscription/config.ts` - Plan definitions, limits, features, and helper functions
2. ✅ `src/lib/subscription/usage.ts` - Usage tracking, limit checking, history management
3. ✅ `src/hooks/useSubscription.ts` - React hook for subscription data and actions
4. ✅ `src/components/subscription/usage-display.tsx` - UI component for showing usage
5. ✅ `src/components/subscription/protected-feature.tsx` - Wrapper for feature gating
6. ✅ `src/components/subscription/scan-limit-check.tsx` - Example integration
7. ✅ `src/app/api/usage/route.ts` - API endpoint for fetching usage data
8. ✅ `src/app/api/cron/reset-usage/route.ts` - Cron job endpoint for resetting usage

### Key Features Implemented:
- **Plan Configuration**: Centralized plan definitions with limits and features
- **Usage Tracking**: Track scans, articles, and other usage events
- **Limit Enforcement**: Check and enforce usage limits before actions
- **Data Retention**: Automatic cleanup based on plan retention policies
- **React Integration**: Hook and components for easy integration
- **API Endpoints**: RESTful endpoints for usage data and maintenance

### Environment Variables Needed:
```env
CRON_SECRET_TOKEN=your-secret-token-for-cron-jobs
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

## Phase 3: Middleware & Route Protection ✅

### 1. Update `src/middleware.ts` ✅
- Added subscription plan checking
- Implemented soft blocks (show upgrade prompts)
- Added headers for client-side access control

### 2. Create Protected Route Components ✅
- `ProtectedRoute` - For page-level protection
- `ProtectedFeature` - For feature-level protection
- Support for both hard and soft blocks

## Phase 3 Implementation Status ✅

### Completed Files:
1. ✅ `src/lib/subscription/route-config.ts` - Route access configuration
2. ✅ `src/middleware.ts` - Enhanced with subscription checking
3. ✅ `src/components/subscription/protected-route.tsx` - Route protection wrapper
4. ✅ `src/lib/subscription/server-utils.ts` - Server component utilities
5. ✅ Example implementations in `src/app/examples/`
6. ✅ `docs/sbac-phase3-usage-guide.md` - Developer documentation

### Key Features:
- **Automatic Route Protection**: Middleware checks all configured routes
- **Soft Blocks**: Show preview with upgrade prompts
- **Hard Blocks**: Redirect to upgrade page
- **Server Component Support**: Headers for SSR
- **Client Component Support**: Hooks and components

### Protected Routes Configured:
- `/content/*` - Plus+ (hard block)
- `/domains/*` - Pro only (hard block)
- `/analytics/competitors` - Plus+ (soft block)
- `/analytics/custom-reports` - Pro (soft block)
- `/settings/webhooks` - Pro (hard block)
- `/blog/new`, `/blog/generate` - Plus+ (hard block)

## Phase 4: Feature Integration

### 1. Update Visibility Page (`/visibility`)
- Check scan limits before allowing scans
- Show different UI based on plan (basic vs MAX scan)
- Display usage counters
- Add upgrade prompts at limits

### 2. Update Content Page (`/content`)
- Block access for Free/Visibility plans
- Track article generation
- Enforce monthly limits
- Quality tier selection for Pro

### 3. Update Settings Page
- Show current plan and usage
- Display limits and remaining quotas
- Quick upgrade buttons

## Phase 5: Scheduled Jobs & Maintenance

### 1. Monthly Usage Reset
- Cron job to reset monthly counters
- Send usage summary emails

### 2. Data Retention Cleanup
- Remove old scan history based on plan
- Archive old content

### 3. Usage Analytics
- Track feature usage patterns
- Generate insights for upgrades

## Implementation Order

1. **Week 1**: Database setup + core utilities ✅
2. **Week 2**: Middleware + route protection ✅
3. **Week 3**: Feature integration (visibility, content)
4. **Week 4**: Testing + scheduled jobs

## What We Need From You

1. **Approve database schema** - Should we proceed with these tables? ✅
2. **Confirm usage reset timing** - Monthly on billing date or calendar month?
3. **Clarify scan types** - What exactly differentiates basic vs MAX scans?
4. **Define grace periods** - How long for downgrades?
5. **Specify upgrade UI** - Modal, page redirect, or inline prompts?

## Next Steps

~~Once you approve the database schema, we can:~~
1. ~~Create the migration files~~ ✅
2. ~~Build the core subscription utilities~~ ✅
3. ~~Implement middleware & route protection~~ ✅
4. Start integrating into existing features (Phase 4)

Ready to proceed with Phase 4 (Feature Integration)? 