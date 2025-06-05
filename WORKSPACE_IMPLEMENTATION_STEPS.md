# Workspace Implementation Steps

## Current Problem
- +/- buttons only update Stripe billing (add-ons)
- No actual workspace records in database
- No data isolation or domain switching
- SBAC/RLS doesn't know about multiple domains

## Required Implementation

### Step 1: Database Schema
```sql
-- Create workspaces table
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

-- Create primary workspace for existing users
INSERT INTO workspaces (user_id, domain, workspace_name, is_primary)
SELECT 
    id, 
    COALESCE(domain, 'example.com'),
    COALESCE(workspace_name, 'Primary Workspace'),
    true
FROM profiles 
WHERE domain IS NOT NULL;
```

### Step 2: Update +/- Button Logic
Instead of just updating Stripe billing, the buttons should:

1. **Add Domain (+)**:
   - Update Stripe billing (keep existing)
   - Create new workspace record in `workspaces` table
   - Redirect to workspace setup flow

2. **Remove Domain (-)**:
   - Update Stripe billing (keep existing)  
   - Archive/delete workspace record
   - Handle data migration/cleanup

### Step 3: Domain Selector as Workspace Switcher
Transform domain selector to show actual workspaces:

```typescript
// Current: Shows billing count
<span>{extraDomains} domains</span>

// New: Shows actual workspaces  
{workspaces.map(workspace => (
  <DropdownMenuItem onClick={() => switchToWorkspace(workspace.id)}>
    <WorkspaceFavicon domain={workspace.domain} />
    <span>{workspace.domain}</span>
  </DropdownMenuItem>
))}
```

### Step 4: Add workspace_id to Content Tables
```sql
-- Add workspace_id to all content tables
ALTER TABLE ai_crawler_logs ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE visibility_scans ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE content_articles ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Migrate existing data to primary workspace
UPDATE ai_crawler_logs 
SET workspace_id = (
  SELECT id FROM workspaces 
  WHERE workspaces.user_id = ai_crawler_logs.user_id 
  AND is_primary = true
);
```

### Step 5: Row Level Security (RLS)
```sql
-- Enable RLS on content tables
ALTER TABLE ai_crawler_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for workspace access
CREATE POLICY "Users can only access their workspace data" ON ai_crawler_logs
  FOR ALL USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w 
      WHERE w.user_id = auth.uid()
    )
  );
```

### Step 6: API Updates
All content APIs need workspace context:

```typescript
// Before: Filter by user_id
const { data } = await supabase
  .from('ai_crawler_logs')
  .select('*')
  .eq('user_id', user.id)

// After: Filter by workspace_id
const { data } = await supabase
  .from('ai_crawler_logs')
  .select('*')
  .eq('workspace_id', currentWorkspace.id)
```

## Implementation Priority

### Phase 1: Database Foundation
1. Create `workspaces` table
2. Migrate existing users to primary workspaces
3. Add `workspace_id` columns to content tables

### Phase 2: Workspace Management  
1. Update +/- buttons to create/delete workspaces
2. Create workspace context provider
3. Update domain selector to show workspaces

### Phase 3: Data Isolation
1. Update all APIs to filter by workspace
2. Implement RLS policies
3. Add workspace switching functionality

### Phase 4: UI Polish
1. Workspace setup flow for new domains
2. Data migration handling
3. Workspace settings

## Current Status
- ✅ Billing add-ons working (Stripe integration)
- ❌ No workspace records (missing database)
- ❌ No data isolation (all data user-scoped)
- ❌ No domain switching (no workspace context)

**Next Step**: Implement Phase 1 (Database Foundation) 