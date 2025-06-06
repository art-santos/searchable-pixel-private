# Split AI Crawler Attribution - Complete Implementation Plan

## 🎯 **Transformation Overview**

Transform Split from a visibility tracker + content generator into an AI crawler attribution engine that tracks what AI crawlers are hitting your website and provides attribution insights.

---

## 📋 **Current vs. New Feature Mapping**

### **Page Transformations**

#### **1. Visibility Page → Attribution Dashboard**
**Location**: `src/app/visibility/page.tsx`
**New Purpose**: Real-time crawler activity monitoring

**Current Tabs:**
- Overview → **Attribution Overview** (score, activity chart, top crawlers)
- Citations → **Crawler Analytics** (detailed crawler breakdown)
- Gaps → **Attribution Insights** (inferred queries, company attribution)

**New Components Needed:**
```typescript
// src/app/attribution/components/
- attribution-overview-tab.tsx
- crawler-analytics-tab.tsx  
- attribution-insights-tab.tsx
- real-time-feed.tsx
- attribution-chart.tsx
```

#### **2. Content Page → Reports & Setup**
**Location**: `src/app/content/page.tsx`
**New Purpose**: Attribution reports and tracking setup

**Current Tabs:**
- Completed Articles → **Generated Reports** (attribution reports, exports)
- Content Queue → **Setup & Configuration** (tracking code, detection rules)
- Knowledge Base → **Content Mapping** (map your content to crawler interests)

**New Components Needed:**
```typescript
// src/app/reports/components/
- generated-reports-tab.tsx
- setup-configuration-tab.tsx
- content-mapping-tab.tsx
- tracking-snippet.tsx
- detection-rules-manager.tsx
```

---

## 🏗️ **Implementation Phases**

### **Phase 1: Core Infrastructure (Week 1)**

#### ✅ **Completed:**
- Core TypeScript types (`src/lib/crawler-attribution/types.ts`)
- API client (`src/lib/crawler-attribution/api-client.ts`)
- React hook (`src/hooks/useCrawlerAttribution.ts`)

#### **🔄 Next Steps:**

**1. Database Schema Setup**
```sql
-- New tables needed
CREATE TABLE crawler_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  crawler_type TEXT NOT NULL,
  crawler_confidence DECIMAL(3,2),
  user_agent TEXT,
  ip_address INET,
  url_hit TEXT,
  path TEXT,
  referrer TEXT,
  session_id TEXT,
  request_headers JSONB,
  estimated_query TEXT,
  query_confidence DECIMAL(3,2),
  content_type TEXT,
  company_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crawler_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_agent_pattern TEXT,
  ip_ranges TEXT[],
  additional_headers JSONB,
  crawler_type TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attribution_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  timeframe_start TIMESTAMPTZ,
  timeframe_end TIMESTAMPTZ,
  report_data JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. API Endpoints**
```typescript
// src/app/api/attribution/
- dashboard/route.ts       // GET dashboard data
- crawler-stats/route.ts   // GET crawler statistics  
- companies/route.ts       // GET company attributions
- content/route.ts         // GET content performance
- visits/route.ts          // GET recent visits
- reports/route.ts         // POST generate report
- tracker.js              // Client-side tracking script
```

**3. Crawler Detection Engine**
```typescript
// src/lib/crawler-attribution/detection-engine.ts
class CrawlerDetectionEngine {
  detectCrawler(userAgent: string, headers: Record<string, string>, ip: string): {
    type: string
    confidence: number
  }
  
  // Built-in patterns for major AI crawlers
  patterns = {
    chatgpt: [/ChatGPT-User/, /OpenAI-API/],
    perplexity: [/PerplexityBot/, /perplexity.ai/],
    claude: [/ClaudeBot/, /anthropic/],
    gemini: [/Googlebot/, /Bard/],
    // ... more patterns
  }
}
```

---

### **Phase 2: Dashboard Transformation (Week 2)**

#### **Transform Visibility Page**

**1. Update Page Structure**
```typescript
// src/app/attribution/page.tsx (renamed from visibility)
export default function AttributionPage() {
  const attribution = useCrawlerAttribution()
  
  const tabs = [
    { id: 'overview', label: 'Attribution Overview' },
    { id: 'crawlers', label: 'Crawler Analytics' },
    { id: 'insights', label: 'Attribution Insights' }
  ]
  
  // Real-time updates, attribution scoring, crawler breakdown
}
```

**2. Create New Components**

**Attribution Overview Tab:**
```typescript
// Real-time activity feed
// Attribution score (0-100 based on crawler diversity + attribution quality)
// Top crawlers chart
// Recent visits feed
// Company attribution summary
```

**Crawler Analytics Tab:**
```typescript
// Detailed breakdown by crawler type
// Visit patterns and trends
// Geographic distribution
// User agent analysis
// IP range detection
```

**Attribution Insights Tab:**
```typescript
// Inferred query patterns
// Company identification (rb2b style)
// Content performance correlation
// Trending search topics
// Attribution confidence scoring
```

---

### **Phase 3: Reports & Setup Page (Week 3)**

#### **Transform Content Page**

**1. Reports Tab (Replace "Completed Articles")**
```typescript
// Generated attribution reports
// Scheduled report management
// Export functionality (CSV, JSON, PDF)
// Historical report archive
// Custom report builder
```

**2. Setup Tab (Replace "Content Queue")**
```typescript
// Tracking code installation
// Domain verification
// Crawler detection rules management
// Custom attribution rules
// Integration setup (webhooks, APIs)
```

**3. Content Mapping Tab (Replace "Knowledge Base")**
```typescript
// Map your content to crawler interests
// URL pattern analysis
// Content type categorization
// Attribution scoring by content
// SEO correlation insights
```

---

### **Phase 4: Advanced Features (Week 4)**

#### **Real-time Features**
```typescript
// WebSocket connections for live updates
// Push notifications for significant crawler activity
// Real-time attribution scoring
// Live company identification
// Instant report generation
```

#### **Integration Features**
```typescript
// Google Analytics integration
// Reverse IP lookup (clearbit, rb2b style)
// Webhook notifications
// Slack/Teams alerts
// API for external integrations
```

---

## 🗂️ **File Migration Plan**

### **Files to Rename/Transform**

#### **Visibility → Attribution**
```bash
# Page transformations
src/app/visibility/ → src/app/attribution/
src/hooks/useMaxVisibility.ts → src/hooks/useCrawlerAttribution.ts ✅

# Component transformations  
src/app/visibility/components/enhanced-overview-tab.tsx → 
  src/app/attribution/components/attribution-overview-tab.tsx

src/app/visibility/components/enhanced-citations-tab.tsx →
  src/app/attribution/components/crawler-analytics-tab.tsx

src/app/visibility/components/enhanced-gaps-tab.tsx →
  src/app/attribution/components/attribution-insights-tab.tsx
```

#### **Content → Reports**
```bash
# Content page transformation
src/app/content/ → src/app/reports/

src/app/content/components/completed-articles-tab.tsx →
  src/app/reports/components/generated-reports-tab.tsx

src/app/content/components/content-queue-tab.tsx →
  src/app/reports/components/setup-configuration-tab.tsx

src/app/content/components/knowledge-base-tab.tsx →
  src/app/reports/components/content-mapping-tab.tsx
```

### **Files to Delete**
```bash
# Old visibility tracking
src/lib/max-visibility/
src/lib/aeo/
src/lib/perplexity/

# Old content generation
src/hooks/useArticles.ts
src/hooks/useKnowledgeBase.ts (can be repurposed)

# Old components
src/components/visibility/
src/app/visibility/components/scan-progress-modal.tsx
src/app/visibility/components/scan-results-modal.tsx
```

### **Files to Keep/Repurpose**
```bash
# Keep and adapt
src/contexts/WorkspaceContext.tsx ✅
src/hooks/useSubscription.ts ✅ 
src/hooks/useCompany.ts ✅
src/lib/supabase/ ✅
src/components/ui/ ✅

# Repurpose
src/hooks/useKnowledgeBase.ts → content mapping functionality
src/app/settings.tsx → add attribution settings
```

---

## 🎨 **UI/UX Design System**

### **New Color Scheme (Crawler-focused)**
```css
/* Attribution Score Colors */
--attribution-excellent: #22c55e  /* 80-100 score */
--attribution-good: #3b82f6      /* 60-79 score */
--attribution-fair: #f59e0b      /* 40-59 score */
--attribution-poor: #ef4444      /* 0-39 score */

/* Crawler Type Colors */
--crawler-chatgpt: #10b981
--crawler-perplexity: #3b82f6  
--crawler-claude: #8b5cf6
--crawler-gemini: #f59e0b
--crawler-unknown: #6b7280
```

### **Icon System**
```typescript
// Crawler-specific icons
import { 
  Bot,           // Generic crawler
  Search,        // Search queries
  Building2,     // Company attribution
  Globe,         // Website tracking
  Activity,      // Real-time feed
  BarChart3,     // Analytics
  FileText,      // Reports
  Settings,      // Configuration
  Eye,           // Visibility/tracking
  Zap            // Real-time updates
} from 'lucide-react'
```

---

## 🚀 **Migration Strategy**

### **Gradual Rollout**
1. **Week 1**: Build core infrastructure alongside existing features
2. **Week 2**: Deploy attribution dashboard as new tab
3. **Week 3**: Replace visibility page with attribution dashboard
4. **Week 4**: Transform content page to reports & setup
5. **Week 5**: Remove old visibility features and clean up

### **Data Migration**
```typescript
// Migrate existing user data
// Preserve workspace settings
// Transfer subscription plans
// Maintain user onboarding flow
// Keep authentication system unchanged
```

### **Feature Flags**
```typescript
// Environment-based feature switching
const FEATURES = {
  ATTRIBUTION_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_ATTRIBUTION === 'true',
  OLD_VISIBILITY: process.env.NEXT_PUBLIC_ENABLE_OLD_VISIBILITY === 'true',
  REPORTS_PAGE: process.env.NEXT_PUBLIC_ENABLE_REPORTS === 'true'
}
```

---

## 🧪 **Testing Strategy**

### **Component Tests**
```typescript
// Attribution dashboard components
// Real-time data updates
// Crawler detection accuracy
// Report generation
// Export functionality
```

### **Integration Tests**
```typescript
// API endpoint testing
// Database operations
// Cache management
// Real-time WebSocket connections
// Third-party integrations
```

### **Performance Tests**
```typescript
// Large dataset handling
// Real-time update performance
// Chart rendering optimization
// Export speed for large datasets
// Mobile responsiveness
```

---

## 📊 **Success Metrics**

### **Product Metrics**
- Attribution accuracy rate (>90%)
- Real-time update latency (<2 seconds)
- Report generation speed (<30 seconds)
- Crawler detection confidence (>85%)
- User engagement with attribution insights

### **Business Metrics**
- User retention post-pivot
- Feature adoption rates
- Customer feedback scores
- Revenue impact
- Market differentiation achieved

---

This plan provides a complete roadmap for transforming Split into an AI crawler attribution engine while leveraging your existing infrastructure and gradually migrating users to the new system. 