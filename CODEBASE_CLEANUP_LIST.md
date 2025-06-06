# Codebase Cleanup List - Content & Visibility Systems

After running the targeted database migration, these files need to be removed:

## 🗑️ **Directories to DELETE**

### **Visibility System**
```bash
rm -rf src/app/api/max-visibility/          # All visibility API endpoints
rm -rf src/app/visibility/                  # Visibility dashboard pages
rm -rf src/lib/max-visibility/              # Visibility business logic
```

### **Content Generation System**
```bash
rm -rf src/app/api/knowledge-base/          # Knowledge base API endpoints
rm -rf src/lib/knowledge-base/              # Knowledge base services
```

## 🗑️ **Individual Files to DELETE**

### **Hooks**
```bash
rm src/hooks/useMaxVisibility.ts            # Visibility data hook
rm src/hooks/useKnowledgeBase.ts             # Knowledge base hook
```

### **Components**
```bash
rm src/app/content/components/knowledge-base-tab.tsx  # Knowledge base tab
```

### **Test Files**
```bash
rm test-workspace-isolation.js              # Contains visibility references
rm run-workspace-migration.js               # Contains visibility references  
rm scripts/check-competitors.js             # Visibility-specific script
```

## ✏️ **Files to MODIFY**

### **1. Content Page - Remove Knowledge Base Tab**
**File**: `src/app/content/page.tsx`
```typescript
// REMOVE these lines:
import { KnowledgeBaseTab } from './components/knowledge-base-tab'

// REMOVE from tabs array:
{ id: 'knowledge', label: 'Knowledge Base' }

// REMOVE from JSX:
{activeTab === 'knowledge' && (
  <KnowledgeBaseTab />
)}
```

### **2. Workspace Settings - Remove Visibility Config**
**File**: `src/app/api/workspaces/[workspaceId]/settings/route.ts`
```typescript
// REMOVE:
max_visibility_days: number

// REMOVE validation:
if (newSettings.data_retention.max_visibility_days < 30 || newSettings.data_retention.max_visibility_days > 730) {
```

### **3. Usage API - Remove Visibility Scans**
**File**: `src/app/api/usage/current/route.ts`
```typescript
// REMOVE:
// Get actual visibility scans from max_visibility_runs within current billing period
.from('max_visibility_runs')
```

### **4. Workspace Data Hook - Remove Visibility References**
**File**: `src/hooks/useWorkspaceData.ts`
```typescript
// REMOVE references to:
.from('max_visibility_runs')
'max_visibility_runs'
```

### **5. Onboarding Flow - Remove Knowledge Base Field**
**File**: `src/components/onboarding/onboarding-flow.tsx`
```typescript
// REMOVE from interface:
knowledgeBase: string

// REMOVE from state:
knowledgeBase: ''

// REMOVE JSX field and validation logic for knowledgeBase
```

### **6. Onboarding Database - Remove Knowledge Base**
**File**: `src/lib/onboarding/database.ts`
```typescript
// REMOVE from interface:
knowledgeBase?: string
```

### **7. Supabase Types - Remove Generated Content**
**File**: `supabase/supabase.ts`
```typescript
// REMOVE:
generated_content: {
  // ... entire section
}
```

## 🔍 **Navigation Updates Needed**

### **Update Main Navigation**
Look for navigation menus that reference:
- "Visibility" or "visibility" routes
- "Content" generation features
- "Knowledge Base" sections

### **Update Sidebar/Menu Components**
Remove menu items pointing to `/visibility` or knowledge base features.

## 🧪 **Testing Files to Update**

### **Remove Test References**
**File**: `src/test/onboarding-database-test.ts`
```typescript
// REMOVE:
knowledgeBase: 'Additional context about...'
```

## 📋 **Commands to Run**

### **1. Database Migration**
```bash
supabase db push --migration 20250106000001_targeted_cleanup_content_visibility.sql
```

### **2. Remove Directories**
```bash
rm -rf src/app/api/max-visibility/
rm -rf src/app/visibility/ 
rm -rf src/lib/max-visibility/
rm -rf src/app/api/knowledge-base/
rm -rf src/lib/knowledge-base/
```

### **3. Remove Individual Files**
```bash
rm src/hooks/useMaxVisibility.ts
rm src/hooks/useKnowledgeBase.ts
rm src/app/content/components/knowledge-base-tab.tsx
rm test-workspace-isolation.js
rm run-workspace-migration.js
rm scripts/check-competitors.js
```

### **4. Verify No Broken Imports**
```bash
# Check for broken imports after cleanup
npm run build
# or
pnpm build
```

## ✅ **What to KEEP**

- ✅ `crawler_visits` and all crawler infrastructure
- ✅ User authentication and profiles
- ✅ Workspace management
- ✅ Billing and subscription systems
- ✅ Dashboard APIs for crawler data
- ✅ API keys and authentication
- ✅ All core UI components

## 🎯 **After Cleanup**

Your codebase will be clean and focused on:
1. **AI Crawler Tracking** (existing, enhanced)
2. **User/Workspace Management** (existing)
3. **Billing/Usage Tracking** (existing)
4. **Ready for Attribution Features** (new)

The existing crawler tracking infrastructure is perfect for building the new attribution system on top of! 