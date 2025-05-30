# SBAC Quick Reference

## Plan Limits at a Glance

| Feature | FREE | VISIBILITY | PLUS | PRO |
|---------|------|------------|------|-----|
| **Monthly Price** | $0 | $40 | $200 | $1,000 |
| **Annual Price** | $0 | $32/mo | $160/mo | $800/mo |
| **Visibility Scans** | 4/month | Daily (base) | Daily (MAX) | Unlimited (MAX) |
| **AI Articles** | 0 | 0 | 10/month | 30/month |
| **Domains** | 1 | 1 | 1 | 3 |
| **Data Retention** | 90 days | 180 days | 360 days | Unlimited |

## Protected Routes

```typescript
const routeAccess = {
  '/content': ['plus', 'pro'],           // Content generation
  '/domains/manage': ['pro'],            // Multi-domain management
  '/blog': ['plus+'],                    // Blog management
}
```

## Feature Flags

```typescript
const features = {
  // Scanning
  'basic-scan': ['free+'],
  'max-scan': ['plus+'],
  'bulk-scan': ['pro'],
  
  // Content
  'view-content': ['free+'],
  'generate-content': ['plus+'],
  'premium-content': ['pro'],
  
  // Analytics
  'basic-analytics': ['free+'],
  'citation-analysis': ['visibility+'],
  'competitor-analysis': ['plus+'],
  'custom-reports': ['pro'],
  
  // Platform
  'webhooks': ['pro'],
  'priority-support': ['plus+'],
  'multi-domain': ['pro'],
}
```

## Usage Limits

```typescript
const limits = {
  free: {
    scans: { max: 4, period: 'month' },
    articles: { max: 0 },
    domains: { max: 1 },
    dataRetention: 90, // days
  },
  visibility: {
    scans: { max: 30, period: 'month' },
    scanType: 'basic', // 100 queries
    articles: { max: 0 },
    domains: { max: 1 },
    dataRetention: 180,
  },
  plus: {
    scans: { max: -1 }, // unlimited
    scanType: 'max', // 200+ queries  
    articles: { max: 10, period: 'month' },
    domains: { max: 1 },
    dataRetention: 360,
  },
  pro: {
    scans: { max: -1 }, // unlimited
    scanType: 'max',
    articles: { max: 30, period: 'month' },
    domains: { max: 3 },
    dataRetention: -1, // unlimited
  },
}
```

## Key Differences Between Plans

### Scan Types
- **Basic Scan** (Free/Visibility): ~100 queries, essential metrics
- **MAX Scan** (Plus/Pro): 200+ queries, deep competitive analysis

### Data Retention
- **Free**: 90 days
- **Visibility**: 180 days  
- **Plus**: 360 days
- **Pro**: Unlimited

### Access Model
- Show upgrade prompts instead of hard blocks
- Allow limited trial of premium features
- Graceful degradation on downgrades 