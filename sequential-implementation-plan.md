# Sequential Implementation Plan: Project-Based AI Visibility Platform

## Overview
This document provides a detailed, sequential implementation plan for transforming our snapshot system into a project-based AI visibility platform. Each step builds on the previous one, ensuring a stable migration path.

## Phase 1: Foundation & Core Fixes (Week 1-2)

### Week 1: Fix Critical Detection Issues

#### Day 1-2: Fix H1 Detection
```typescript
// File: src/lib/aeo/enhanced-html-analyzer.ts
- Implement multi-source H1 detection
- Check rendered DOM, not just raw HTML
- Add visual detection fallback
- Test against known failures (Ramp.com)
```

**Technical Tasks:**
1. Create new `enhanced-html-analyzer.ts`
2. Implement Puppeteer integration for JS rendering
3. Add fallback detection methods:
   - Raw HTML parsing
   - Enhanced data heading structure
   - Metadata headings
   - Visual detection via screenshot analysis
4. Create test suite with problematic sites

#### Day 3-4: Fix SSR/CSR Detection
```typescript
// File: src/lib/aeo/rendering-detector.ts
- Analyze actual network waterfall
- Check for hydration markers
- Compare initial HTML vs final DOM
- Detect framework-specific patterns
```

**Technical Tasks:**
1. Build network analysis module
2. Implement hydration detection
3. Add framework detection (Next.js, React, Vue, etc.)
4. Create accurate SSR/CSR/Hybrid classifier

#### Day 5: Enhanced Firecrawl Integration
```typescript
// File: src/lib/services/enhanced-firecrawl-client-v2.ts
- Add retry logic with different strategies
- Implement Puppeteer fallback
- Add content verification
- Improve error handling
```

### Week 2: Database & API Foundation

#### Day 6-7: Database Schema Migration
```sql
-- Migration: 001_create_projects_schema.sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  root_domain TEXT NOT NULL,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed TIMESTAMPTZ,
  UNIQUE(project_id, url)
);

-- Add indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_project_urls_project_id ON project_urls(project_id);
CREATE INDEX idx_project_urls_status ON project_urls(status);
```

#### Day 8-9: Core Project API
```typescript
// File: src/app/api/projects/route.ts
export async function POST(req: Request) {
  // Create new project
}

export async function GET(req: Request) {
  // List user's projects
}

// File: src/app/api/projects/[id]/route.ts
export async function GET(req: Request, { params }) {
  // Get project details
}

export async function PUT(req: Request, { params }) {
  // Update project settings
}

export async function DELETE(req: Request, { params }) {
  // Delete project
}
```

#### Day 10: URL Management API
```typescript
// File: src/app/api/projects/[id]/urls/route.ts
export async function POST(req: Request, { params }) {
  // Add URL to project
  // Auto-discover from sitemap option
}

export async function GET(req: Request, { params }) {
  // List project URLs with status
}
```

## Phase 2: Time-Series Data Infrastructure (Week 3)

### Week 3: Time-Series Storage & Basic Tracking

#### Day 11-12: Time-Series Schema
```sql
-- Migration: 002_create_timeseries_tables.sql
CREATE TABLE visibility_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  query TEXT NOT NULL,
  visibility_score INTEGER,
  position INTEGER,
  ai_system TEXT, -- perplexity, chatgpt, claude, google
  competitors JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE technical_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_url_id UUID REFERENCES project_urls ON DELETE CASCADE,
  overall_score INTEGER,
  technical_score INTEGER,
  content_score INTEGER,
  issues JSONB,
  metrics JSONB,
  recommendations JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioning for performance
CREATE INDEX idx_visibility_tracking_composite 
  ON visibility_tracking(project_id, query, checked_at DESC);
CREATE INDEX idx_technical_audits_composite 
  ON technical_audits(project_url_id, analyzed_at DESC);
```

#### Day 13-14: Background Job System
```typescript
// File: src/lib/jobs/audit-scheduler.ts
- Set up Vercel Cron or Supabase Edge Functions
- Daily audit jobs per project
- Queue management
- Retry logic

// File: src/app/api/cron/daily-audits/route.ts
export async function GET(req: Request) {
  // Run daily audits for all active projects
}
```

#### Day 15: Data Aggregation Layer
```typescript
// File: src/lib/analytics/project-analytics.ts
export class ProjectAnalytics {
  async getVisibilityTrend(projectId: string, days: number = 30) {
    // Aggregate visibility scores over time
  }
  
  async getTopIssues(projectId: string) {
    // Identify most common issues across URLs
  }
  
  async getCompetitiveLandscape(projectId: string) {
    // Analyze competitor presence
  }
}
```

## Phase 3: AI Visibility Tracking (Week 4)

### Week 4: Multi-AI System Integration

#### Day 16-17: AI System Connectors
```typescript
// File: src/lib/ai-visibility/perplexity-tracker.ts
export class PerplexityTracker {
  async checkVisibility(query: string): Promise<VisibilityResult> {
    // Check if domain appears in Perplexity results
  }
}

// File: src/lib/ai-visibility/chatgpt-tracker.ts
export class ChatGPTTracker {
  async checkVisibility(query: string): Promise<VisibilityResult> {
    // Use GPT-4 to check citations
  }
}

// File: src/lib/ai-visibility/claude-tracker.ts
export class ClaudeTracker {
  async checkVisibility(query: string): Promise<VisibilityResult> {
    // Check Claude's responses
  }
}
```

#### Day 18-19: Unified Visibility Scorer
```typescript
// File: src/lib/ai-visibility/visibility-scorer.ts
export class VisibilityScorer {
  async calculateScore(projectId: string, queries: string[]) {
    // Aggregate scores across all AI systems
    // Weight by importance
    // Track competitive positioning
  }
}
```

#### Day 20: Competitive Intelligence
```typescript
// File: src/lib/competitive/competitor-analyzer.ts
export class CompetitorAnalyzer {
  async identifyCompetitors(domain: string) {
    // Auto-detect competitors from SERP
  }
  
  async trackCompetitorVisibility(competitors: string[], queries: string[]) {
    // Monitor competitor AI visibility
  }
  
  async findContentGaps(domain: string, competitors: string[]) {
    // Identify missing topics/content
  }
}
```

## Phase 4: Enhanced Technical Analysis (Week 5)

### Week 5: Deep Page Analysis

#### Day 21-22: Entity & Semantic Analysis
```typescript
// File: src/lib/analysis/entity-extractor.ts
export class EntityExtractor {
  async extractEntities(content: string) {
    // Use NLP to extract entities
    // Map to knowledge graph
    // Calculate entity coverage
  }
}

// File: src/lib/analysis/semantic-analyzer.ts
export class SemanticAnalyzer {
  async analyzeSemanticCoverage(content: string, topic: string) {
    // Topic modeling
    // Semantic density scoring
    // Related concept coverage
  }
}
```

#### Day 23-24: Enhanced Technical Analyzer
```typescript
// File: src/lib/aeo/technical-analyzer-v2.ts
export class TechnicalAnalyzerV2 {
  async analyze(url: string): Promise<EnhancedTechnicalAnalysis> {
    // All existing checks PLUS:
    // - Actual rendering mode detection
    // - JavaScript dependency analysis
    // - Core Web Vitals for AI crawlers
    // - Structured data validation
    // - Factual claim density
  }
}
```

#### Day 25: Smart Recommendations Engine
```typescript
// File: src/lib/recommendations/recommendation-engine-v2.ts
export class RecommendationEngineV2 {
  async generateRecommendations(
    analysis: EnhancedTechnicalAnalysis,
    competitors: CompetitorData[]
  ): Promise<PrioritizedRecommendations> {
    // Context-aware recommendations
    // Competitor-based suggestions
    // Implementation difficulty scoring
    // Expected impact calculation
  }
}
```

## Phase 5: Frontend Dashboard (Week 6-7)

### Week 6: Project Dashboard UI

#### Day 26-27: Project List & Creation
```typescript
// File: src/app/dashboard/projects/page.tsx
// Project list with cards showing:
// - Overall visibility score
// - Trend sparkline
// - Last updated
// - Quick actions

// File: src/app/dashboard/projects/new/page.tsx
// Project creation wizard:
// 1. Enter domain
// 2. Auto-discover URLs
// 3. Set target queries/topics
// 4. Configure competitors
```

#### Day 28-29: Project Dashboard
```typescript
// File: src/app/dashboard/projects/[id]/page.tsx
// Main dashboard with:
// - Visibility score chart (Recharts)
// - Top issues summary
// - Recent changes
// - Quick wins

// File: src/components/charts/VisibilityChart.tsx
// Time-series visibility graph
// Competitor comparison
// Breakdown by AI system
```

#### Day 30: URL Management Interface
```typescript
// File: src/app/dashboard/projects/[id]/urls/page.tsx
// Data table with:
// - URL
// - Overall score
// - Issues count
// - Last checked
// - Trend
// - Actions (analyze, view, remove)
```

### Week 7: Technical Audit Interface

#### Day 31-32: Audit Table
```typescript
// File: src/components/audit/AuditTable.tsx
// Sortable/filterable table
// Inline issue indicators
// Bulk selection
// Export to CSV

// File: src/components/audit/IssueIndicator.tsx
// Visual indicators for issues:
// 🔴 Critical (blocks AI indexing)
// 🟡 Warning (reduces visibility)
// 🟢 Good (optimized)
```

#### Day 33-34: Page Deep Dive
```typescript
// File: src/app/dashboard/projects/[id]/urls/[urlId]/page.tsx
// Detailed page analysis:
// - Technical score breakdown
// - Content analysis
// - Entity coverage
// - Recommendations
// - Historical trend
// - "Ask AI to Fix" button
```

#### Day 35: AI Assistant Integration
```typescript
// File: src/components/ai/AskAIDialog.tsx
// Context-aware AI assistant
// Shows specific code/content fixes
// Copy-to-clipboard functionality
// Implementation checklist
```

## Phase 6: Advanced Features (Week 8)

### Week 8: Automation & Intelligence

#### Day 36-37: Automated Alerts
```typescript
// File: src/lib/alerts/alert-system.ts
export class AlertSystem {
  async checkForAlerts(projectId: string) {
    // Visibility drops
    // New competitor citations
    // Technical issues introduced
    // Opportunity identification
  }
  
  async sendAlert(alert: Alert) {
    // Email notification
    // In-app notification
    // Webhook support
  }
}
```

#### Day 38-39: Report Generation
```typescript
// File: src/lib/reports/report-generator.ts
export class ReportGenerator {
  async generateWeeklyReport(projectId: string) {
    // PDF/HTML report with:
    // - Executive summary
    // - Visibility trends
    // - Competitive analysis
    // - Prioritized actions
    // - Progress tracking
  }
}
```

#### Day 40: API Documentation
```typescript
// File: src/app/api/v1/[...path]/route.ts
// Public API for enterprise clients
// Rate limiting
// API key management
// Comprehensive documentation
```

## Phase 7: Testing & Migration (Week 9)

### Week 9: Testing & Data Migration

#### Day 41-42: Comprehensive Testing
```typescript
// Test suites for:
// - H1 detection accuracy
// - SSR detection accuracy
// - Time-series data integrity
// - API performance
// - UI responsiveness
```

#### Day 43-44: Migration Scripts
```typescript
// File: scripts/migrate-snapshots.ts
// Convert existing snapshots to projects
// Preserve historical data
// Map to new schema
// Verify data integrity
```

#### Day 45: Beta Launch Preparation
- Deploy to staging
- Internal testing
- Performance optimization
- Documentation updates

## Phase 8: Launch (Week 10)

### Week 10: Production Launch

#### Day 46-47: Gradual Rollout
- Enable for beta users
- Monitor performance
- Gather feedback
- Fix critical issues

#### Day 48-49: Full Launch
- Enable for all users
- Marketing announcement
- Support documentation
- Training materials

#### Day 50: Post-Launch
- Monitor system health
- Address user feedback
- Plan next iterations
- Celebrate! 🎉

## Key Milestones

1. **Week 2**: Core detection fixed, project API working
2. **Week 4**: Time-series tracking operational
3. **Week 6**: Basic dashboard functional
4. **Week 8**: Full feature set complete
5. **Week 10**: Production launch

## Success Criteria

- [ ] H1 detection: 99%+ accuracy
- [ ] SSR detection: 95%+ accuracy
- [ ] Page analysis: <30 seconds
- [ ] Dashboard load: <2 seconds
- [ ] Zero data loss during migration
- [ ] 100% uptime during launch

## Risk Mitigation

1. **Gradual Migration**: Keep old system running in parallel
2. **Feature Flags**: Roll out features incrementally
3. **Monitoring**: Comprehensive logging and alerting
4. **Rollback Plan**: One-click revert if needed
5. **Data Backup**: Hourly backups during migration

This plan transforms our broken snapshot system into an enterprise-grade AI visibility platform that actually delivers value worth a 6-figure contract. 