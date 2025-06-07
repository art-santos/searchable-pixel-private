# Attribution Page Specification

## Overview
The Attribution page provides granular visibility into which pages are being crawled by AI/LLM bots, tracking crawl frequency, behavior patterns, and performance metrics to enable deep insights across paths, timeframes, and models.

## Data Source
Primary table: `crawler_visits`
- **Total records**: ~2K visits
- **Date range**: June 1-7, 2025 (expandable)
- **Domains tracked**: 3 unique domains
- **Crawler types**: 20 different crawlers from 18 companies

## Page Structure & Navigation Flow

### Level 1: Attribution Overview (Landing)
**Purpose**: Clean, minimal overview with key metrics and navigation entry points

**Header Section**:
```
Attribution Analytics                    [7 days ▼] [Export ▼]

1,966 Total Crawls  •  20 Unique Crawlers  •  3 Domains  •  245ms Avg Response
```

**Main Navigation Grid** (3 large, clickable sections):
```
┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│        BY SOURCE                │ │         BY PAGE                 │
│                                 │ │                                 │
│    🤖 18 Companies              │ │    📄 45 Unique Paths          │
│    🔍 20 Crawler Types          │ │    🎯 /robots.txt (most hit)   │
│                                 │ │                                 │
│    → View Source Breakdown      │ │    → View Page Analytics        │
└─────────────────────────────────┘ └─────────────────────────────────┘

┌─────────────────────────────────┐
│           BY SESSION            │
│                                 │
│    ⏱️  234 Sessions Detected    │
│    📊 2.3 Avg Pages/Session     │
│                                 │
│    → View Session Analysis      │
└─────────────────────────────────┘
```

**Implementation Notes**:
- Clean, card-based navigation
- Each card shows 2-3 key stats as preview
- Hover effects and clear call-to-action
- Breadcrumb navigation for deep drilling

### Level 2A: BY SOURCE View
**Navigation**: Home → BY SOURCE
**Breadcrumb**: `Attribution > By Source`

**Source Overview**:
```
BY SOURCE                                           ← Back to Overview

Top Crawler Companies (7 days)
```

**Company List** (clickable rows):
```
Google          687 crawls  •  23 paths  •  4.2h avg interval     →
Anthropic       432 crawls  •  18 paths  •  6.1h avg interval     →
OpenAI          354 crawls  •  15 paths  •  8.3h avg interval     →
Meta            234 crawls  •  12 paths  •  12.1h avg interval    →
Microsoft       156 crawls  •  8 paths   •  15.2h avg interval    →
```

### Level 3A: Specific Crawler Deep Dive
**Navigation**: Home → BY SOURCE → GPTBot
**Breadcrumb**: `Attribution > By Source > OpenAI > GPTBot`

**GPTBot Analysis**:
```
GPTBot (OpenAI)                                     ← Back to Sources

354 total crawls  •  15 unique paths  •  8.3h avg interval  •  Last seen: 2h ago
```

**Pages Visited by GPTBot** (clean table):
```
Path                Crawls    Last Visit    Avg Response    Status
/llms.txt          67        2h ago        95ms           ✓ 200
/sitemap.xml       45        4h ago        180ms          ✓ 200  
/robots.txt        32        6h ago        120ms          ✓ 200
/api/docs          28        1d ago        110ms          ✓ 200
/                  24        3h ago        340ms          ✓ 200
...                                                       [View All]
```

**Quick Actions**:
- `View GPTBot Sessions` → Level 4A
- `Compare with Other Crawlers`
- `Export GPTBot Data`

### Level 2B: BY PAGE View  
**Navigation**: Home → BY PAGE
**Breadcrumb**: `Attribution > By Page`

**Page Overview**:
```
BY PAGE                                             ← Back to Overview

Most Crawled Pages (7 days)
```

**Page List** (clickable rows):
```
/robots.txt     156 crawls  •  8 crawlers  •  120ms avg     →
/sitemap.xml    89 crawls   •  6 crawlers  •  180ms avg     →
/llms.txt       67 crawls   •  5 crawlers  •  95ms avg      →
/               45 crawls   •  12 crawlers •  340ms avg     →
/api/docs       34 crawls   •  4 crawlers  •  110ms avg     →
```

### Level 3B: Specific Page Deep Dive
**Navigation**: Home → BY PAGE → /robots.txt
**Breadcrumb**: `Attribution > By Page > /robots.txt`

**Page Analysis**:
```
/robots.txt                                         ← Back to Pages

156 total crawls  •  8 unique crawlers  •  120ms avg response  •  Last crawled: 15m ago
```

**Crawlers Visiting This Page**:
```
Crawler         Company     Crawls    Last Visit    Avg Response
Googlebot       Google      45        15m ago       115ms
ClaudeBot       Anthropic   32        1h ago        125ms
GPTBot          OpenAI      28        2h ago        95ms
Bingbot         Microsoft   21        4h ago        140ms
facebookbot     Meta        18        6h ago        130ms
...                                                 [View All]
```

### Level 2C: BY SESSION View
**Navigation**: Home → BY SESSION  
**Breadcrumb**: `Attribution > By Session`

**Session Overview**:
```
BY SESSION                                          ← Back to Overview

Recent Crawler Sessions (7 days)
```

**Session Types Summary**:
```
Single Hits     189 sessions  •  1 page avg   •  <30s duration     →
Quick Scans     32 sessions   •  3 pages avg  •  2m duration       →  
Deep Crawls     11 sessions   •  8 pages avg  •  6m duration       →
Full Scans      2 sessions    •  15 pages avg •  12m duration      →
```

**Recent Sessions** (clickable):
```
Session ID    Crawler     Start Time    Pages    Duration    Type
sess_234      GPTBot      2h ago        12       7m 23s      Deep Crawl    →
sess_233      Googlebot   3h ago        1        0s          Single Hit    →
sess_232      ClaudeBot   4h ago        5        4m 12s      Quick Scan    →
```

### Level 4A: Individual Session Deep Dive
**Navigation**: Home → BY SESSION → sess_234 (or from GPTBot → Sessions)
**Breadcrumb**: `Attribution > By Session > sess_234`

**Session Details**:
```
Session sess_234 (GPTBot)                           ← Back to Sessions

Started: 2h ago  •  Duration: 7m 23s  •  12 pages crawled  •  Deep Crawl type
```

**Page Sequence** (chronological):
```
Time      Path                Response    Notes
14:23:15  /robots.txt        120ms       Entry point
14:23:18  /sitemap.xml       180ms       Following sitemap
14:24:02  /llms.txt          95ms        AI-specific content
14:24:45  /api/docs          110ms       Documentation
14:25:12  /blog/ai-ethics    145ms       Blog content
14:26:30  /about             200ms       Company info
...                                      [View All 12 Pages]
```

**Session Insights**:
- **Crawl Pattern**: Systematic (robots → sitemap → content)
- **Focus Areas**: AI content, documentation, blog
- **Performance**: Consistent response times
- **Behavior**: Standard GPTBot pattern

## Navigation Principles

### Breadcrumb System
Always show clear path back:
```
Attribution > By Source > OpenAI > GPTBot > Sessions > sess_234
```

### Quick Actions
At each level, provide relevant actions:
- **Level 1**: Export all data, change timeframe
- **Level 2**: Compare categories, filter results  
- **Level 3**: View sessions, export specific data
- **Level 4**: Raw logs, session replay

### Consistent Back Navigation
- `← Back to [Previous Level]` always visible
- Keyboard shortcuts (ESC to go back)
- URL-based navigation for bookmarking

### Progressive Disclosure
- Start minimal, add detail as you drill down
- Each level shows 3-5 key metrics
- "View All" links when lists are truncated
- Expandable sections for optional details

## UI Design Principles

### Elegant Spacing
- Generous white space between sections
- Clean typography hierarchy
- Minimal visual clutter
- Focus on data, not decoration

### Responsive Layout
- Single column on mobile
- Adaptive card sizing
- Touch-friendly click targets
- Swipe gestures for navigation

### Performance
- Fast transitions between levels
- Cached data for common paths
- Progressive loading for large datasets
- Skeleton states during loading

## Technical Implementation

### Database Queries Needed

**1. Overview Metrics**:
```sql
-- Total crawls in timeframe
SELECT COUNT(*) FROM crawler_visits 
WHERE timestamp >= $start_date AND timestamp <= $end_date;

-- Unique paths
SELECT COUNT(DISTINCT path) FROM crawler_visits 
WHERE timestamp >= $start_date AND timestamp <= $end_date;

-- Most active crawler
SELECT crawler_name, COUNT(*) as crawl_count 
FROM crawler_visits 
WHERE timestamp >= $start_date AND timestamp <= $end_date
GROUP BY crawler_name 
ORDER BY crawl_count DESC LIMIT 1;
```

**2. Session Detection**:
```sql
-- Sessionize crawls (5-minute gaps)
WITH session_groups AS (
  SELECT *,
    SUM(CASE WHEN 
      timestamp - LAG(timestamp) OVER (
        PARTITION BY crawler_name, domain 
        ORDER BY timestamp
      ) > INTERVAL '5 minutes' 
      THEN 1 ELSE 0 END
    ) OVER (
      PARTITION BY crawler_name, domain 
      ORDER BY timestamp
    ) as session_group
  FROM crawler_visits
)
SELECT 
  CONCAT(crawler_name, '_', domain, '_', session_group) as session_id,
  crawler_name,
  MIN(timestamp) as session_start,
  MAX(timestamp) as session_end,
  COUNT(*) as pages_crawled,
  AVG(response_time_ms) as avg_response_time,
  EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as duration_seconds
FROM session_groups
GROUP BY crawler_name, domain, session_group;
```

**3. Path Analysis**:
```sql
-- Path breakdown with crawler stats
SELECT 
  path,
  COUNT(*) as total_crawls,
  COUNT(DISTINCT crawler_name) as unique_crawlers,
  MODE() WITHIN GROUP (ORDER BY crawler_name) as top_crawler,
  AVG(response_time_ms) as avg_response_time,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen
FROM crawler_visits 
WHERE timestamp >= $start_date AND timestamp <= $end_date
GROUP BY path
ORDER BY total_crawls DESC;
```

### Performance Considerations

**1. Caching Strategy**:
- Cache overview metrics for 5-minute intervals
- Pre-calculate daily/weekly aggregates
- Use Redis for frequently accessed path stats

**2. Indexing**:
```sql
-- Recommended indexes
CREATE INDEX idx_crawler_visits_timestamp ON crawler_visits(timestamp);
CREATE INDEX idx_crawler_visits_path ON crawler_visits(path);
CREATE INDEX idx_crawler_visits_crawler ON crawler_visits(crawler_name);
CREATE INDEX idx_crawler_visits_domain_crawler_time ON crawler_visits(domain, crawler_name, timestamp);
```

**3. Data Retention**:
- Keep detailed data for 90 days
- Aggregate older data into daily summaries
- Archive raw data after 1 year

### UI/UX Considerations

**1. Loading States**:
- Skeleton loaders for tables
- Progressive loading for large datasets
- Real-time updates for live data

**2. Responsive Design**:
- Mobile-friendly table with horizontal scroll
- Collapsible filters on smaller screens
- Touch-friendly modal interactions

**3. Export Options**:
- CSV export for all tables
- PDF reports for executive summaries
- API endpoints for programmatic access

**4. Real-time Features**:
- Live crawl notifications
- Auto-refresh every 30 seconds
- WebSocket updates for active sessions

## Future Enhancements

1. **Anomaly Detection**: Alert on unusual crawl patterns
2. **Crawler Reputation**: Score crawlers based on behavior
3. **Content Impact**: Correlate crawls with content changes
4. **Competitive Analysis**: Compare crawl patterns across domains
5. **Citation Tracking**: Track when crawled content appears in AI responses
6. **ROI Metrics**: Measure business impact of AI crawler visibility

## Success Metrics

- **User Engagement**: Time spent on page, drill-down usage
- **Actionability**: Number of insights leading to content optimizations
- **Performance**: Page load times <2s, query response <500ms
- **Accuracy**: Data freshness within 5 minutes of actual crawls 