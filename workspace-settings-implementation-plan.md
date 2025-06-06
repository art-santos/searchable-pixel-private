# Workspace-Level Settings & API Keys Implementation Plan

## Current Status
- ✅ Workspaces table created and functional
- ✅ All data properly isolated by workspace
- ✅ User can switch between workspaces with proper data isolation
- ✅ Existing API keys system is user-level (not workspace-level)
- 🔄 Need to implement workspace-level settings and API keys

## Current API Keys System Analysis

### Existing Implementation
1. **Table Structure** (`api_keys` table):
   ```sql
   - id: UUID
   - name: TEXT 
   - key: TEXT (format: split_live_xxx or split_test_xxx)
   - key_hash: TEXT (SHA256 hash for validation)
   - user_id: UUID (references auth.users)
   - domains: TEXT[] (allowed domains)
   - is_active: BOOLEAN
   - last_used_at: TIMESTAMP
   - created_at/updated_at: TIMESTAMP
   ```

2. **Current Usage**:
   - API keys are generated in `/api/api-keys/route.ts`
   - Keys are validated in `/api/crawler-events/route.ts` using hashed comparison
   - The `@split.dev/analytics` npm package uses these keys
   - `/api/ping/route.ts` validates keys and returns workspace info from profiles table

3. **Split Analytics Package**:
   - Located in `/packages/split-analytics/`
   - Uses API key for authentication (Bearer token)
   - Tracks crawler visits via `/api/crawler-events` endpoint
   - Middleware helper for Next.js applications
   - Currently expects user-level API keys

## Requirements

### 1. Workspace-Level Settings
- **Settings Storage**: JSON column in workspaces table
- **Types of Settings**:
  - Crawler tracking preferences (enabled/disabled by crawler type)
  - Data retention policies
  - Notification preferences
  - Custom domain settings
  - API rate limits
  - Theme/branding preferences

### 2. Workspace-Level API Keys
- **Key Generation**: Same format (split_live_xxx, split_test_xxx) 
- **Isolation**: Keys should only access data from their workspace
- **Migration**: Keep existing user-level keys working (backwards compatibility)
- **Dashboard**: UI to manage keys per workspace
- **Tracking**: Update crawler events to use workspace from API key

## Implementation Plan

### Phase 1: Workspace Settings (No Breaking Changes)

1. **Add workspace_settings column** (already exists as JSONB)
2. **Create settings UI component**
3. **Add API endpoint for updating settings**

### Phase 2: Workspace API Keys Table

1. **Create New Table** (separate from existing api_keys):
```sql
CREATE TABLE workspace_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    key_hash VARCHAR(64) NOT NULL, -- SHA256 hash
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Workspace-specific permissions
    permissions JSONB DEFAULT '{"crawler_tracking": true, "read_data": true}'::jsonb
);

CREATE INDEX idx_workspace_api_keys_workspace_id ON workspace_api_keys(workspace_id);
CREATE INDEX idx_workspace_api_keys_api_key ON workspace_api_keys(api_key);
CREATE INDEX idx_workspace_api_keys_key_hash ON workspace_api_keys(key_hash);
```

### Phase 3: Update API Endpoints (Backwards Compatible)

1. **Update `/api/crawler-events/route.ts`**:
   - First check workspace_api_keys table
   - Fall back to user api_keys table for backwards compatibility
   - Use workspace_id from the key's workspace, not user's primary

2. **Update `/api/ping/route.ts`**:
   - Support both user and workspace keys
   - Return workspace info based on key type

3. **Create new `/api/workspaces/[workspaceId]/api-keys` endpoint**:
   - CRUD operations for workspace API keys
   - Ensure user has access to the workspace

### Phase 4: Update Split Analytics Package

1. **No Breaking Changes Required**:
   - Package continues to work with existing format
   - Server-side handles workspace vs user keys transparently
   - No changes needed to npm package

### Phase 5: Migration Strategy

1. **Existing Keys Continue Working**:
   - User-level keys access primary workspace by default
   - No interruption to existing integrations

2. **Optional Migration Path**:
   - Provide UI to "Convert to Workspace Key"
   - Copy key to workspace_api_keys table
   - Mark old key as migrated (soft delete)

## API Design

### Workspace Settings API
```typescript
// GET /api/workspaces/[workspaceId]/settings
// PUT /api/workspaces/[workspaceId]/settings

interface WorkspaceSettings {
  crawler_tracking: {
    enabled: boolean
    allowed_crawlers: string[]
    blocked_crawlers: string[]
  }
  data_retention: {
    crawler_logs_days: number
    max_visibility_days: number
  }
  notifications: {
    email_alerts: boolean
    webhook_url?: string
  }
  api_limits: {
    requests_per_minute: number
    requests_per_day: number
  }
}
```

### Workspace API Keys API
```typescript
// GET /api/workspaces/[workspaceId]/api-keys
// POST /api/workspaces/[workspaceId]/api-keys
// DELETE /api/workspaces/[workspaceId]/api-keys/[keyId]

interface WorkspaceApiKey {
  id: string
  workspace_id: string
  name: string
  api_key: string // Only returned on creation
  permissions: {
    crawler_tracking: boolean
    read_data: boolean
  }
  is_active: boolean
  last_used_at: string | null
  created_at: string
}
```

## UI Components Needed

1. **Workspace Settings Page** (`/dashboard/[workspaceId]/settings`)
   - General settings form
   - Save/cancel functionality
   - Setting categories (tabs or sections)

2. **API Keys Management** (`/dashboard/[workspaceId]/settings/api-keys`)
   - List of workspace API keys
   - Create new key dialog
   - Copy key functionality
   - Revoke key confirmation
   - Last used timestamp
   - Key permissions editor

3. **Migration Helper**
   - Banner on old API keys page
   - "Migrate to Workspace Keys" button
   - Migration status indicator

## Security Considerations

1. **Key Validation**:
   - Always validate workspace access before key operations
   - Rate limit key generation (max 10 per workspace)
   - Log all key operations for audit trail

2. **Data Access**:
   - Workspace keys can only access their workspace's data
   - No cross-workspace data access
   - Validate workspace_id on every request

3. **Backwards Compatibility**:
   - User keys continue to work with primary workspace
   - Clear deprecation timeline (6+ months)
   - Migration guides and documentation

## Testing Requirements

1. **Unit Tests**:
   - Key generation and validation
   - Workspace settings CRUD
   - Permission checks

2. **Integration Tests**:
   - Split analytics package with workspace keys
   - Backwards compatibility with user keys
   - Data isolation between workspaces

3. **E2E Tests**:
   - Full flow from key creation to crawler tracking
   - Workspace switching with different keys
   - Migration from user to workspace keys

## Implementation Order

1. ✅ Create workspace_api_keys table migration
2. ✅ Update crawler-events API to support both key types
3. ✅ Create workspace settings API endpoints
4. ✅ Build settings UI components
5. ✅ Add workspace API keys management UI
6. ✅ Update documentation
7. ✅ Create migration guides
8. ✅ Test thoroughly with existing integrations

## Implementation Status

### Completed Features

1. **Database Layer**
   - ✅ `workspace_api_keys` table with proper indexes and RLS
   - ✅ `validate_workspace_api_key` function
   - ✅ `validate_any_api_key` function for backwards compatibility

2. **API Endpoints**
   - ✅ Updated `/api/crawler-events` to support both key types
   - ✅ Updated `/api/ping` to handle workspace keys
   - ✅ Created `/api/workspaces/[workspaceId]/settings` for settings management
   - ✅ Created `/api/workspaces/[workspaceId]/api-keys` for key CRUD operations
   - ✅ Created `/api/workspaces/[workspaceId]` for workspace details

3. **UI Components**
   - ✅ Workspace settings page at `/dashboard/[workspaceId]/settings`
   - ✅ General settings tab with all configuration options
   - ✅ API keys management tab with full CRUD functionality
   - ✅ Added workspace settings link to dashboard

4. **Documentation & Testing**
   - ✅ Comprehensive documentation in `docs/workspace-api-keys.md`
   - ✅ Test script `test-workspace-api-keys.js`
   - ✅ Migration guide included in documentation

### Next Steps

1. **Deploy the migration** to production database
2. **Test with real users** in staging environment
3. **Monitor adoption** and gather feedback
4. **Plan team features** for shared workspace access 