# Phase 3: Middleware & Route Protection Usage Guide

## Overview
The SBAC system now includes middleware-based route protection that automatically checks user subscription levels and enforces access controls.

## How It Works

### 1. Middleware Protection
The middleware (`src/middleware.ts`) automatically:
- Checks if user is authenticated
- Fetches user's subscription plan
- Enforces route access based on `route-config.ts`
- Adds headers for soft blocks
- Redirects for hard blocks

### 2. Route Configuration
Routes are configured in `src/lib/subscription/route-config.ts`:

```typescript
{
  path: '/content',
  requiredPlan: 'plus',
  feature: 'generate-content',
  softBlock: false, // Hard block - redirects to upgrade
}
```

## Usage Examples

### Client Components

#### 1. Basic Protection (Hard Block)
```tsx
import { ProtectedRoute } from '@/components/subscription/protected-route'

export default function ContentPage() {
  return (
    <ProtectedRoute requiredPlan="plus" feature="generate-content">
      {/* Your protected content */}
    </ProtectedRoute>
  )
}
```

#### 2. Soft Block (Show Preview)
```tsx
import { ProtectedFeature } from '@/components/subscription/protected-feature'

export default function AnalyticsPage() {
  return (
    <ProtectedFeature 
      requiredPlan="plus" 
      feature="competitor-analysis"
      soft={true}
    >
      {/* Content shown blurred with upgrade prompt */}
    </ProtectedFeature>
  )
}
```

#### 3. Using the Hook
```tsx
import { useSubscription } from '@/hooks/useSubscription'

export function MyComponent() {
  const { subscription, hasFeature, canPerformAction } = useSubscription()
  
  const handleAction = async () => {
    if (await canPerformAction('scan')) {
      // Perform scan
    } else {
      // Show upgrade prompt
    }
  }
  
  return (
    <div>
      {hasFeature('generate-content') && (
        <button>Generate Content</button>
      )}
    </div>
  )
}
```

### Server Components

#### 1. Reading Headers
```tsx
import { getSubscriptionHeaders } from '@/lib/subscription/server-utils'

export default async function ServerPage() {
  const { userPlan, isSoftBlocked } = getSubscriptionHeaders()
  
  if (userPlan === 'free') {
    // Show limited features
  }
  
  return <div>...</div>
}
```

#### 2. Conditional Rendering
```tsx
import { getUserPlanFromHeaders } from '@/lib/subscription/server-utils'
import { isAtLeastPlan } from '@/lib/subscription/config'

export default async function DashboardPage() {
  const userPlan = getUserPlanFromHeaders()
  const showAdvanced = isAtLeastPlan(userPlan, 'plus')
  
  return (
    <div>
      {showAdvanced ? (
        <AdvancedFeatures />
      ) : (
        <BasicFeatures />
      )}
    </div>
  )
}
```

## Protected Routes

### Currently Protected Routes:
- `/content/*` - Plus+ (hard block)
- `/domains/manage` - Pro only (hard block)
- `/domains/add` - Pro only (hard block)
- `/analytics/competitors` - Plus+ (soft block)
- `/analytics/custom-reports` - Pro only (soft block)
- `/settings/webhooks` - Pro only (hard block)
- `/blog/new` - Plus+ (hard block)
- `/blog/generate` - Plus+ (hard block)

### Adding New Protected Routes:
1. Add to `ROUTE_ACCESS` in `route-config.ts`
2. Routes are automatically protected by middleware
3. Use `ProtectedRoute` or `ProtectedFeature` components

## Best Practices

### 1. Choose the Right Protection Type
- **Hard Block**: For features that require payment (content generation, API access)
- **Soft Block**: For preview features (analytics, reports)

### 2. Provide Clear Upgrade Paths
- Always explain why upgrade is needed
- Show what features they'll get
- Make upgrade process simple

### 3. Handle Edge Cases
- Loading states
- Error handling
- Offline access

### 4. Test Different Plans
```bash
# Update your profile to test different plans
UPDATE profiles SET subscription_plan = 'plus' WHERE id = 'your-user-id';
```

## Middleware Headers

The middleware sets these headers:
- `X-User-Plan`: Current user's plan
- `X-Subscription-Soft-Block`: "true" if soft blocked
- `X-Required-Plan`: Plan required for the route
- `X-Feature`: Feature name for the route

## Troubleshooting

### Route Not Protected
1. Check if route is in `ROUTE_ACCESS`
2. Verify middleware is running (check console logs)
3. Ensure user is authenticated

### Soft Block Not Showing
1. Check `softBlock: true` in route config
2. Verify `ProtectedFeature` has `soft={true}`
3. Check browser console for errors

### Redirect Loop
1. Check redirect destinations in route config
2. Verify settings page isn't protected
3. Check middleware logic 