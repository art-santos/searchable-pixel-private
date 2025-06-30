# Project-Based AI Visibility Platform - PRD & Implementation Plan

## Executive Summary

Transform the current single-snapshot system into an enterprise-grade, project-based AI visibility platform that tracks performance over time, provides competitive intelligence, and delivers actionable recommendations worth a 6-figure contract.

## Product Vision

**From**: Single point-in-time snapshots that miss obvious H1s and give generic advice  
**To**: Continuous AI visibility monitoring platform that tracks brand performance across AI systems, identifies opportunities, and provides specific strategic recommendations

## Core Concepts

### Projects (Not Snapshots)
- **Root Domain**: Each project is anchored to a root domain (e.g., ramp.com)
- **Multi-URL**: Add unlimited URLs under the project
- **Brand-Level Tracking**: Overall visibility scores for the entire brand
- **Page-Level Analysis**: Deep technical audits for individual pages

### Time-Series Intelligence
- **Daily Tracking**: Automated daily visibility checks
- **Historical Graphs**: Visualize progress over time
- **Trend Analysis**: Identify what's working and what's not
- **Competitive Movement**: Track competitor changes

### Three-Tier Analysis

#### 1. Brand Visibility Score
- Overall AI visibility across all tracked queries/topics
- Competitive positioning
- Citation share analysis
- Knowledge graph presence

#### 2. Technical Site Audit
- All pages in a sortable, filterable table
- Individual page scores
- Bulk issue identification
- Priority-based fix recommendations

#### 3. Page Deep Dives
- Detailed technical analysis
- Content optimization opportunities
- AI-specific recommendations
- "Ask AI" for implementation help

## User Journey

### 1. Project Setup
```
User creates new project → Enters root domain (ramp.com) → 
Adds target keywords/topics → System crawls sitemap → 
User selects key pages to track → Initial audit runs
```

### 2. Dashboard View
```
Project Dashboard shows:
- Overall AI Visibility Score (with 30-day trend)
- Top performing queries
- Critical issues across all pages
- Competitive position changes
- Quick wins across the site
```

### 3. Visibility Tracking
```
Topics Tab → Shows all tracked topics/queries →
Each has visibility graph → Click for detailed SERP analysis →
See which competitors appear → Identify content gaps
```

### 4. Technical Audit Table
```
Pages Tab → Table of all tracked URLs →
Columns: URL | Score | Issues | Last Updated | Trend →
Click row → Full page analysis → 
"Ask AI to fix" → Get specific code/content suggestions
```

## Technical Architecture

### Database Schema Changes

```sql
-- Projects table (replaces snapshots)
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  root_domain TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP,
  settings JSONB -- keywords, topics, competitors
);

-- Project URLs
CREATE TABLE project_urls (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  added_at TIMESTAMP,
  last_analyzed TIMESTAMP
);

-- Visibility tracking (time-series)
CREATE TABLE visibility_tracking (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects,
  query TEXT NOT NULL,
  visibility_score INTEGER,
  position INTEGER,
  competitors JSONB,
  checked_at TIMESTAMP
);

-- Technical audits (time-series)
CREATE TABLE technical_audits (
  id UUID PRIMARY KEY,
  project_url_id UUID REFERENCES project_urls,
  overall_score INTEGER,
  technical_score INTEGER,
  content_score INTEGER,
  issues JSONB,
  recommendations JSONB,
  analyzed_at TIMESTAMP
);
```

### API Structure

```typescript
// Project Management
POST   /api/projects              // Create new project
GET    /api/projects              // List user's projects
GET    /api/projects/:id          // Get project details
PUT    /api/projects/:id          // Update project settings
DELETE /api/projects/:id          // Delete project

// URL Management
POST   /api/projects/:id/urls     // Add URL to project
GET    /api/projects/:id/urls     // List project URLs
DELETE /api/projects/:id/urls/:urlId

// Visibility Tracking
POST   /api/projects/:id/visibility/check   // Run visibility check
GET    /api/projects/:id/visibility         // Get visibility data
GET    /api/projects/:id/visibility/history // Time-series data

// Technical Audits
POST   /api/projects/:id/audit              // Run technical audit
GET    /api/projects/:id/audit/latest       // Latest audit results
GET    /api/projects/:id/audit/history      // Historical audits

// AI Assistant
POST   /api/projects/:id/ai/fix             // Get AI fix suggestions
POST   /api/projects/:id/ai/analyze         // Deep AI analysis
```

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

#### 1.1 Fix Core Detection Issues
- [ ] Implement proper H1 detection using multiple sources
- [ ] Fix SSR/CSR/Hybrid detection with real DOM analysis
- [ ] Add Puppeteer fallback for JavaScript-heavy sites
- [ ] Create visual rendering verification

#### 1.2 Database Migration
- [ ] Design new schema for projects
- [ ] Create migration scripts
- [ ] Build data models
- [ ] Set up time-series storage

#### 1.3 Project Management API
- [ ] CRUD operations for projects
- [ ] URL management within projects
- [ ] Settings and configuration

### Phase 2: Visibility Tracking (Week 3-4)

#### 2.1 Query Tracking System
- [ ] Integrate Perplexity API properly
- [ ] Add ChatGPT API monitoring
- [ ] Implement Claude tracking
- [ ] Build Google AI overview detection

#### 2.2 Competitive Intelligence
- [ ] SERP API integration
- [ ] Competitor identification
- [ ] Citation share calculation
- [ ] Content gap analysis

#### 2.3 Time-Series Visualization
- [ ] Daily automated checks
- [ ] Historical data storage
- [ ] Graph components (Recharts)
- [ ] Trend analysis

### Phase 3: Enhanced Technical Audit (Week 5-6)

#### 3.1 Comprehensive Page Analysis
- [ ] Entity extraction
- [ ] Semantic coverage scoring
- [ ] Knowledge graph alignment
- [ ] Factual density measurement

#### 3.2 Bulk Analysis Table
- [ ] Sortable/filterable data table
- [ ] Inline issue indicators
- [ ] Bulk action capabilities
- [ ] Export functionality

#### 3.3 Smart Recommendations
- [ ] Context-aware suggestions
- [ ] Competitor-based recommendations
- [ ] Priority scoring
- [ ] Implementation difficulty

### Phase 4: AI Integration (Week 7-8)

#### 4.1 "Ask AI" Feature
- [ ] Context-aware AI assistant
- [ ] Code generation for fixes
- [ ] Content suggestions
- [ ] Implementation guides

#### 4.2 Automated Insights
- [ ] Weekly summary emails
- [ ] Alert system for changes
- [ ] Opportunity identification
- [ ] Competitive alerts

### Phase 5: UI/UX Overhaul (Week 9-10)

#### 5.1 Project Dashboard
```
┌─────────────────────────────────────────┐
│ Ramp.com AI Visibility                  │
├─────────────────────────────────────────┤
│ Overall Score: 76/100 ↑3               │
│ ┌─────────────────────────────────────┐│
│ │ [Visibility graph over 30 days]     ││
│ └─────────────────────────────────────┘│
│                                         │
│ Top Issues:                             │
│ • 12 pages missing H1s                  │
│ • No FAQ schema on support pages        │
│ • Competitor Brex cited 3x more         │
├─────────────────────────────────────────┤
│ [Visibility] [Technical] [Competitors]  │
└─────────────────────────────────────────┘
```

#### 5.2 Technical Audit Table
```
┌─────────────────────────────────────────────────────┐
│ Page URL              Score  Issues  Trend  Action  │
├─────────────────────────────────────────────────────┤
│ /expense-management    82    3 🔴    ↑2    [Fix]    │
│ /corporate-cards       91    1 🟡    →     [Fix]    │
│ /pricing              68    5 🔴    ↓3    [Fix]    │
│ /about                95    0 🟢    ↑1    [View]   │
└─────────────────────────────────────────────────────┘
```

#### 5.3 Page Deep Dive
```
┌─────────────────────────────────────────┐
│ ramp.com/expense-management             │
├─────────────────────────────────────────┤
│ Technical Score: 82/100                 │
│ Content Score: 74/100                   │
│                                         │
│ Critical Issues:                        │
│ • No H1 detected (false - needs fix)    │
│ • Missing FAQ schema for 8 Q&As         │
│ • Zero EEAT citations                   │
│                                         │
│ [Ask AI to Fix] [Export Report]         │
└─────────────────────────────────────────┘
```

## Success Metrics

### Technical Accuracy
- H1 detection accuracy: 99%+
- SSR detection accuracy: 95%+
- Zero false positives on critical issues

### Business Value
- Average visibility score improvement: 15%+ in 90 days
- Actionable recommendations: 100% specific, not generic
- Time to identify issues: <5 minutes per site
- Implementation success rate: 80%+ of recommendations

### User Satisfaction
- Daily active usage
- Recommendation implementation rate
- Support ticket reduction
- Contract renewal rate

## Migration Strategy

### For Existing Users
1. Keep snapshots as read-only historical data
2. Auto-create projects from existing snapshot domains
3. Offer one-click migration to project view
4. Grandfather existing data into time-series

### Data Preservation
- All existing snapshots remain accessible
- Historical data becomes first points in time-series
- No data loss during migration

## Competitive Differentiation

### vs. Traditional SEO Tools
- AI-first, not search-first
- Time-series tracking for AI visibility
- Specific recommendations, not generic advice
- Multi-AI system coverage

### vs. Enterprise SEO Platforms
- Built for AI visibility, not traditional search
- Competitive intelligence for AI citations
- Automated fix suggestions with AI
- Modern tech stack and UI

## Technical Requirements

### Performance
- Page analysis: <30 seconds
- Visibility check: <10 seconds per query
- Dashboard load: <2 seconds
- Real-time updates via WebSocket

### Scalability
- Support 10,000+ URLs per project
- Handle 1,000+ daily visibility checks
- Store 2 years of historical data
- Concurrent analysis for multiple projects

### Reliability
- 99.9% uptime SLA
- Automated retries for failed checks
- Data backup every 6 hours
- Disaster recovery plan

## Development Priorities

### Must Have (MVP)
1. Project creation and management
2. Multi-URL support
3. Daily visibility tracking with graphs
4. Technical audit table
5. Basic AI fix suggestions

### Should Have (v1.1)
1. Competitive tracking
2. Bulk operations
3. Export functionality
4. Email alerts

### Nice to Have (v2.0)
1. API access for enterprises
2. White-label options
3. Team collaboration
4. Custom scoring algorithms

## Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement queuing and caching
- **Data Accuracy**: Multiple verification methods
- **Performance**: Progressive loading and pagination

### Business Risks
- **Complexity**: Guided onboarding flow
- **Migration**: Careful data preservation
- **Pricing**: Clear value demonstration

## Timeline

- **Weeks 1-2**: Foundation and core fixes
- **Weeks 3-4**: Visibility tracking system
- **Weeks 5-6**: Enhanced technical audit
- **Weeks 7-8**: AI integration
- **Weeks 9-10**: UI/UX and polish
- **Week 11**: Beta testing
- **Week 12**: Production launch

## Conclusion

This transformation positions us to deliver true enterprise value:
- **Continuous Monitoring** vs one-time snapshots
- **Competitive Intelligence** vs isolated analysis  
- **AI-Specific Metrics** vs recycled SEO data
- **Actionable Insights** vs generic recommendations

The new system justifies a 6-figure contract by providing ongoing strategic value, not just point-in-time audits. 