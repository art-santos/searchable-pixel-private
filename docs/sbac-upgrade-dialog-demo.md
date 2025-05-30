# SBAC Upgrade Dialog Flow

## Overview
When users try to access protected features, they are now redirected to the Settings page with a custom upgrade dialog that:
1. Explains the feature they were trying to access
2. Shows the required plan with pricing
3. Provides a clear upgrade path
4. Automatically selects the billing tab

## How It Works

### 1. User Attempts to Access Protected Route
When a user visits a protected route (e.g., `/content`, `/domains/manage`), the middleware checks their subscription plan.

### 2. Middleware Redirects with Parameters
If access is denied, the middleware redirects to:
```
/settings?tab=billing&showUpgrade=true&feature=generate-content&requiredPlan=plus&fromPath=/content
```

### 3. Settings Page Shows Upgrade Dialog
The settings page:
- Automatically switches to the billing tab
- Shows the upgrade dialog with:
  - Feature icon and description
  - Benefits of the feature
  - Required plan details
  - Pricing toggle (monthly/annual)
  - Clear upgrade button

### 4. User Experience Flow
```
User clicks "Content" → 
  Middleware checks plan → 
    Redirects to Settings → 
      Shows upgrade dialog → 
        User can upgrade or dismiss
```

## Protected Routes and Features

### Content Generation (`/content`)
- **Required Plan**: Plus or Pro
- **Feature**: AI Content Generation
- **Benefits**:
  - Generate unlimited articles
  - SEO optimization built-in
  - Multiple content formats
  - Keyword targeting

### Domain Management (`/domains/*`)
- **Required Plan**: Pro
- **Feature**: Multi-Domain Management
- **Benefits**:
  - Manage up to 3 domains
  - Unified analytics
  - Cross-domain insights
  - Team collaboration

### Competitor Analysis (`/analytics/competitors`)
- **Required Plan**: Plus or Pro
- **Feature**: Competitor Analysis
- **Benefits**:
  - Monitor competitor rankings
  - Track visibility trends
  - Identify content gaps
  - Benchmark performance

### Webhooks (`/settings/webhooks`)
- **Required Plan**: Pro
- **Feature**: Webhooks & API Access
- **Benefits**:
  - Real-time notifications
  - API access
  - Custom integrations
  - Automation support

## Testing the Flow

### 1. As a Free User
```sql
-- Set yourself as a free user
UPDATE profiles SET subscription_plan = 'free' WHERE id = 'your-user-id';
```

### 2. Try Accessing Protected Features
- Visit `/content` → See content generation upgrade dialog
- Visit `/domains/manage` → See multi-domain upgrade dialog
- Visit `/blog/new` → See content generation upgrade dialog

### 3. Dialog Behavior
- Dark overlay covers the settings page
- Dialog shows feature-specific information
- Billing toggle allows monthly/annual selection
- "Upgrade to [Plan]" button initiates checkout
- "Maybe Later" dismisses dialog but stays on billing tab

## Customization

### Adding New Protected Features
1. Add feature info to `FEATURE_INFO` in `upgrade-dialog.tsx`:
```typescript
'your-feature': {
  title: 'Feature Title',
  description: 'What this feature does',
  icon: YourIcon,
  benefits: [
    'Benefit 1',
    'Benefit 2',
    // ...
  ]
}
```

2. Add route to `ROUTE_ACCESS` in `route-config.ts`:
```typescript
{
  path: '/your-route',
  requiredPlan: 'plus',
  feature: 'your-feature',
  softBlock: false
}
```

### Styling
The dialog uses:
- Dark theme matching the app design
- Gradient backgrounds for plan cards
- Motion animations for smooth transitions
- Responsive design for mobile

## Benefits Over Simple Redirect
1. **Context**: Users understand exactly what feature they tried to access
2. **Education**: Shows benefits and value proposition
3. **Conversion**: Direct path to upgrade without confusion
4. **UX**: Smooth transition with visual feedback
5. **Tracking**: Can track which features drive upgrades 