# Multi-Domain Workspace Implementation Plan

## Overview
Transform Split Analytics from single-domain to multi-domain workspaces where each domain operates as an isolated project within a user's account.

## 🎯 Goals
- **Plus/Pro users**: Start with 1 domain, pay $100 for additional domains
- **Domain isolation**: Each domain = separate workspace with own data
- **Seamless switching**: Easy domain/workspace switching in top bar
- **Upgrade flow**: Clear path for free/visibility users to unlock multi-domain

---

## 🏛️ **Hybrid Architecture Model**

### Account-Level (User-based)
- **Billing & Subscription**: One subscription covers all workspaces
- **Usage Aggregation**: AI logs, articles counted across all workspaces
- **Settings Management**: Billing controls, spending limits, domain add-ons
- **Domain Slots**: Purchase domain slots that apply to account

### Workspace-Level (Domain-based)  
- **Content Data**: Articles, scans, knowledge base isolated per workspace
- **Domain-Specific Settings**: Crawler settings, domain configuration
- **Data Isolation**: No cross-workspace data contamination

### Key Insight
```
User Account (Billing Hub)
├── Subscription: Plus Plan + 2 Extra Domains ($400/month total)
├── Usage: 450 AI logs across all workspaces (for billing)
├── Settings: Spending limits apply to all workspaces
│
├── Workspace 1: acme.com (150 AI logs)
│   ├── 5 articles written
│   ├── 10 visibility scans
│   └── Knowledge base (50 items)
│
├── Workspace 2: shop.acme.com (200 AI logs) 
│   ├── 3 articles written
│   ├── 5 visibility scans
│   └── Knowledge base (30 items)
│
└── Workspace 3: blog.acme.com (100 AI logs)
    ├── 8 articles written  
    ├── 12 visibility scans
    └── Knowledge base (75 items)
```

---

## 🏗️ Architecture Changes

### 1. Database Schema Changes

#### New Tables
```sql
-- Workspaces (domains) table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    workspace_name VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Workspace-specific settings
    favicon_url TEXT,
    workspace_settings JSONB DEFAULT '{}',
    
    UNIQUE(user_id, domain),
    INDEX(user_id, is_primary)
);

-- Workspace members (for future team features)
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(workspace_id, user_id)
);
```

#### Updated Tables (Add workspace_id)
```sql
-- CONTENT TABLES: Add workspace_id (workspace-isolated)
ALTER TABLE visibility_scans ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE content_articles ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE knowledge_base_items ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE competitive_analysis ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- BILLING TABLES: Keep user_id based (account-level aggregation)
-- ai_crawler_logs - Keep user_id for billing, add workspace_id for filtering
ALTER TABLE ai_crawler_logs ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
-- subscription_usage - Remains user_id based (account-level billing)
-- subscription_add_ons - Remains user_id based (account-level add-ons)

-- Create indexes for performance
CREATE INDEX visibility_scans_workspace_idx ON visibility_scans(workspace_id);
CREATE INDEX content_articles_workspace_idx ON content_articles(workspace_id);
CREATE INDEX ai_crawler_logs_workspace_idx ON ai_crawler_logs(workspace_id, user_id);

-- Update existing data to use primary workspace
-- (Migration script needed)
```

#### Billing vs Content Data Split
```sql
-- ACCOUNT-LEVEL (user_id based) - Billing & Subscription
- subscription_usage (aggregated across workspaces)
- subscription_add_ons (domain slots purchased)
- billing_preferences (spending limits, notifications)
- ai_crawler_logs (for billing counting, but workspace filterable)

-- WORKSPACE-LEVEL (workspace_id based) - Content & Data  
- visibility_scans (isolated per domain)
- content_articles (isolated per domain)
- knowledge_base_items (isolated per domain)
- competitive_analysis (isolated per domain)
```

### 2. User Context Changes

#### Current State
- User has single domain in `profiles.domain`
- All data tied directly to `user_id`

#### New State  
- User has multiple workspaces in `workspaces` table
- All data tied to `workspace_id`
- Active workspace stored in session/context

---

## 🔧 Implementation Steps

### Phase 1: Database & Backend Foundation

#### 1.1 Database Migration
```sql
-- Migration script
DO $$
DECLARE
    user_record RECORD;
    primary_workspace_id UUID;
BEGIN
    -- For each existing user, create primary workspace
    FOR user_record IN SELECT id, domain, workspace_name FROM profiles WHERE domain IS NOT NULL
    LOOP
        -- Create primary workspace
        INSERT INTO workspaces (user_id, domain, workspace_name, is_primary)
        VALUES (user_record.id, user_record.domain, user_record.workspace_name, TRUE)
        RETURNING id INTO primary_workspace_id;
        
        -- Update all existing data to reference this workspace
        UPDATE ai_crawler_logs SET workspace_id = primary_workspace_id WHERE user_id = user_record.id;
        UPDATE visibility_scans SET workspace_id = primary_workspace_id WHERE user_id = user_record.id;
        -- ... repeat for all tables
    END LOOP;
END $$;
```

#### 1.2 API Route Updates
- Update all API routes to filter by `workspace_id` instead of `user_id`
- Add workspace validation middleware
- Create workspace management endpoints

```typescript
// New API routes needed
POST   /api/workspaces              // Create new workspace
GET    /api/workspaces              // List user's workspaces  
PUT    /api/workspaces/[id]         // Update workspace
DELETE /api/workspaces/[id]         // Delete workspace
POST   /api/workspaces/[id]/switch  // Switch active workspace

// Updated API routes with workspace context
GET    /api/content/articles        // Filter by current workspace
GET    /api/visibility/scans        // Filter by current workspace  
POST   /api/ai-logs                 // Save to current workspace + user billing

// Account-level routes (no workspace filtering)
GET    /api/usage/current           // Aggregate across all workspaces
GET    /api/billing/preferences     // Account-level settings
POST   /api/billing/manage-addons   // Account-level domain add-ons
```

#### Workspace Context in APIs
```typescript
// Content APIs - Workspace filtered
app.get('/api/content/articles', async (req, res) => {
  const { user, currentWorkspace } = await getAuthContext(req)
  
  const articles = await supabase
    .from('content_articles')
    .select('*')
    .eq('workspace_id', currentWorkspace.id) // Workspace filtered
  
  return articles
})

// Billing APIs - Account aggregated  
app.get('/api/usage/current', async (req, res) => {
  const { user } = await getAuthContext(req)
  
  // Aggregate usage across all user's workspaces
  const totalUsage = await calculateAccountUsage(user.id)
  
  return totalUsage
})

// AI Logs - Dual context (workspace + billing)
app.post('/api/ai-logs', async (req, res) => {
  const { user, currentWorkspace } = await getAuthContext(req)
  
  await supabase.from('ai_crawler_logs').insert({
    user_id: user.id,           // For billing aggregation
    workspace_id: currentWorkspace.id, // For workspace filtering
    ...logData
  })
})
```

### Phase 2: Frontend Context & UI

#### 2.1 Workspace Context
```typescript
// contexts/WorkspaceContext.tsx
interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  switchWorkspace: (workspaceId: string) => Promise<void>
  createWorkspace: (domain: string, name: string) => Promise<Workspace>
  deleteWorkspace: (workspaceId: string) => Promise<void>
  isLoading: boolean
}
```

#### 2.2 Domain Selector Enhancement
```typescript
// components/custom/domain-selector.tsx - Enhanced
interface DomainSelectorProps {
  showAddButton?: boolean
  onAddDomain?: () => void
  position?: 'welcome' | 'topbar'
}

function DomainSelector({ showAddButton = false, position = 'welcome' }) {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()
  const { user } = useAuth()
  const { subscription } = useSubscription()
  
  const canAddDomains = subscription?.plan === 'plus' || subscription?.plan === 'pro'
  const hasAvailableSlots = workspaces.length < getMaxDomains(subscription?.plan)
  
  const handleAddDomain = () => {
    if (!canAddDomains) {
      // Redirect to upgrade
      router.push('/settings?tab=billing&showUpgrade=true&feature=multi-domain')
    } else if (!hasAvailableSlots) {
      // Redirect to billing to purchase more domains
      router.push('/settings?tab=billing&highlight=domains')
    } else {
      // Open add domain dialog
      onAddDomain?.()
    }
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`${position === 'topbar' ? 'h-8 text-sm' : ''}`}>
          <WorkspaceFavicon domain={currentWorkspace?.domain} />
          <span>{currentWorkspace?.domain || 'Select workspace'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {workspaces.map(workspace => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => switchWorkspace(workspace.id)}
            className={currentWorkspace?.id === workspace.id ? 'bg-accent' : ''}
          >
            <WorkspaceFavicon domain={workspace.domain} />
            <span>{workspace.domain}</span>
            {workspace.is_primary && <Badge variant="secondary">Primary</Badge>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {showAddButton && (
          <DropdownMenuItem onClick={handleAddDomain}>
            <Plus className="h-4 w-4" />
            <span>
              {!canAddDomains 
                ? 'Upgrade to add domains' 
                : !hasAvailableSlots
                ? 'Purchase domain slots'
                : 'Add new domain'
              }
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### 2.3 Top Bar Integration
```typescript
// components/layout/split-topbar.tsx
export function SplitTopbar() {
  return (
    <div className="h-16 border-b border-[#222222] bg-[#0c0c0c] flex items-center justify-between px-4">
      <SearchBar />
      <DomainSelector showAddButton position="topbar" />
    </div>
  )
}
```

### Phase 3: Billing Integration

#### 3.1 Subscription Add-on Updates
```typescript
// Update domain add-on logic
const handleDomainPurchase = async (quantity: number) => {
  // Check if user has available workspace slots
  const maxDomains = getMaxDomains(subscription.plan)
  const currentDomains = workspaces.length
  
  if (currentDomains + quantity > maxDomains) {
    // Purchase additional domain slots
    await purchaseDomainSlots(quantity)
  }
  
  // After successful payment, allow domain creation
  setCanCreateDomains(true)
}

const getMaxDomains = (plan: string) => {
  switch (plan) {
    case 'plus': return 1 + purchasedDomainSlots
    case 'pro': return 3 + purchasedDomainSlots  
    default: return 1 // visibility plan
  }
}
```

#### 3.2 Domain Limits by Plan
```typescript
const PLAN_LIMITS = {
  free: { domains: 1, canPurchaseMore: false },
  visibility: { domains: 1, canPurchaseMore: false },
  plus: { domains: 1, canPurchaseMore: true },
  pro: { domains: 3, canPurchaseMore: true }
}
```

### Phase 4: Data Isolation & Security

#### 4.1 Row Level Security (RLS)
```sql
-- Enable RLS on all workspace-related tables
ALTER TABLE ai_crawler_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_articles ENABLE ROW LEVEL SECURITY;

-- Create policies for workspace access
CREATE POLICY "Users can only access their workspace data" ON ai_crawler_logs
  FOR ALL USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w 
      WHERE w.user_id = auth.uid()
    )
  );

-- Repeat for all tables...
```

#### 4.2 API Middleware
```typescript
// middleware/workspace-auth.ts
export async function validateWorkspaceAccess(
  workspaceId: string, 
  userId: string
): Promise<boolean> {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('user_id', userId)
    .single()
  
  return !!workspace
}
```

---

## 🎨 User Experience Flow

### 1. New User Onboarding
```
New User Signs Up →
  Create Primary Workspace (from domain in onboarding) →
    Set as active workspace →
      Normal dashboard experience
```

### 2. Adding Additional Domains
```
Plus/Pro User Clicks "Add Domain" →
  Check domain slots available →
    If available: Show "Add Domain" dialog →
      Create new workspace →
        Switch to new workspace →
          Empty state with setup wizard
    
    If no slots: Redirect to billing →
      Purchase domain slots →
        Return to "Add Domain" flow
```

### 3. Workspace Switching
```
User Clicks Domain Selector →
  Show list of workspaces →
    User selects different workspace →
      Switch active workspace context →
        Reload all data for new workspace →
          Update URL with workspace identifier
```

### 4. Free/Visibility User Upgrade
```
Free User Clicks Domain Selector →
  Shows "Add domain (upgrade required)" →
    Click triggers upgrade dialog →
      "Multi-domain workspaces available on Plus & Pro plans" →
        Redirect to billing with upgrade flow
```

### 5. Settings Page Access (Hybrid Model)
```
User Clicks Settings (from any workspace) →
  Settings page opens with account-level view →
    Billing Tab: Shows aggregated usage from all workspaces →
    Domain Management: Lists all workspaces with controls →
    API Keys: Account-level keys that work across workspaces →
  
  User can switch workspaces from settings →
    Returns to dashboard in new workspace context
```

### 6. Domain Add-on Management  
```
Plus/Pro User in Settings → Billing Tab →
  See "Domains: 2/1 (1 extra domain: +$100/month)" →
    Click "Manage Domains" →
      Shows workspace list with add/remove controls →
        Add domain: Purchase slot + create workspace →
        Remove domain: Cancel billing + archive workspace data
```

---

## 🔄 Migration Strategy

### For Existing Users
1. **Automatic Migration**: Create primary workspace for each user
2. **Data Migration**: Link all existing data to primary workspace
3. **Graceful Fallback**: If no workspace context, default to primary
4. **User Communication**: Email about new multi-domain features

### Rollout Plan
1. **Phase 1**: Backend changes + migrations (no UI changes)
2. **Phase 2**: Update domain selector in welcome card
3. **Phase 3**: Move to top bar + billing integration  
4. **Phase 4**: Full workspace isolation + RLS

---

## 🚨 Potential Challenges

### 1. Data Consistency
- **Challenge**: Ensuring all queries filter by workspace_id
- **Solution**: Database-level RLS + comprehensive testing

### 2. Performance
- **Challenge**: Additional JOIN operations on workspace_id
- **Solution**: Proper indexing + query optimization

### 3. User Confusion
- **Challenge**: Users might lose data when switching workspaces
- **Solution**: Clear workspace indicator + breadcrumbs

### 4. Billing Complexity
- **Challenge**: Domain add-ons vs workspace slots
- **Solution**: Clear pricing model + usage visualization

### 5. Hybrid Data Model Complexity
- **Challenge**: Some data is workspace-scoped, some is account-scoped
- **Solution**: Clear data architecture documentation + strict API patterns

### 6. Settings Page Context Confusion
- **Challenge**: Users might expect workspace-specific settings but see account-level
- **Solution**: Clear labeling + workspace context breadcrumbs

### 7. Usage Aggregation Performance
- **Challenge**: Calculating totals across many workspaces on every settings page load
- **Solution**: Cached aggregation tables + background job updates

---

## 📊 Success Metrics

### Technical
- [ ] All queries properly filtered by workspace_id
- [ ] RLS policies prevent cross-workspace data access
- [ ] Performance within 10% of single-workspace baseline

### User Experience
- [ ] <3 clicks to switch workspaces
- [ ] Clear upgrade path for free/visibility users
- [ ] Zero data loss during workspace operations

### Business
- [ ] Increased Plus/Pro plan conversions
- [ ] Higher domain add-on revenue
- [ ] Reduced churn from multi-domain users

---

## 🚀 Implementation Priority

### Week 1-2: Foundation
- [ ] Database schema design
- [ ] Migration scripts
- [ ] Workspace context setup

### Week 3-4: Core Features  
- [ ] Enhanced domain selector
- [ ] Top bar integration
- [ ] Basic workspace switching

### Week 5-6: Billing & Security
- [ ] Domain add-on integration
- [ ] RLS implementation  
- [ ] Upgrade flows

### Week 7-8: Polish & Testing
- [ ] Performance optimization
- [ ] User testing
- [ ] Migration rollout 

---

## ⚙️ **Settings Page in Hybrid Model**

### Key Behavior
- **Single Settings Page**: Accessed from any workspace, shows account-level view
- **Aggregated Usage**: Shows total usage across all workspaces for billing
- **Domain Management**: Lists all workspaces, allows adding/removing domains
- **Workspace Context**: Current workspace shown in breadcrumb/header

### Settings Page Sections

#### Billing Tab (Account-Level)
```typescript
// Usage Display - Aggregated across workspaces
const totalUsage = {
  aiLogs: {
    used: 450, // Sum from all workspaces
    limit: 500,
    breakdown: [
      { workspace: 'acme.com', used: 150 },
      { workspace: 'shop.acme.com', used: 200 },
      { workspace: 'blog.acme.com', used: 100 }
    ]
  },
  domains: {
    used: 3, // Number of workspaces
    limit: 1 + purchasedSlots,
    workspaces: ['acme.com', 'shop.acme.com', 'blog.acme.com']
  }
}
```

#### Domain Management (Account-Level)
```typescript
// Show all workspaces with individual controls
<div className="workspace-list">
  {workspaces.map(workspace => (
    <div key={workspace.id} className="workspace-item">
      <WorkspaceFavicon domain={workspace.domain} />
      <span>{workspace.domain}</span>
      {workspace.is_primary && <Badge>Primary</Badge>}
      <Button onClick={() => switchToWorkspace(workspace.id)}>
        Switch to workspace
      </Button>
      {!workspace.is_primary && (
        <Button variant="destructive" onClick={() => deleteWorkspace(workspace.id)}>
          Remove domain
        </Button>
      )}
    </div>
  ))}
  
  {canAddMoreDomains && (
    <Button onClick={handleAddDomain}>
      Add domain (+$100/month)
    </Button>
  )}
</div>
```

#### Billing Preferences (Account-Level)
- **Spending Limits**: Apply to total usage across all workspaces
- **AI Log Tracking**: Enable/disable affects all workspaces
- **Notifications**: Account-level preference

#### API Keys (Account-Level)
- **Single Set of Keys**: Work across all workspaces
- **Workspace Scoping**: API calls include workspace context

--- 