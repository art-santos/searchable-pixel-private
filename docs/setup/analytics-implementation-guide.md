# Split Analytics Implementation Guide

## Overview

We've built a complete AI crawler analytics solution consisting of:

1. **NPM Package** (`@split/analytics`) - Detects and tracks AI crawlers
2. **API Endpoint** - Receives and stores crawler events
3. **Database Schema** - Stores visits and aggregated statistics
4. **API Key Management** - Secure authentication for tracking

## Architecture

```
Customer Website → NPM Package → Split API → Database → Analytics Dashboard
     (Next.js/Node)   (Middleware)   (Events)   (Supabase)    (React)
```

## NPM Package Structure

### Location: `/packages/split-analytics/`

**Key Files:**
- `src/constants.ts` - AI crawler definitions (GPTBot, Claude-Web, etc.)
- `src/detector.ts` - User agent detection logic
- `src/tracker.ts` - Event batching and API communication
- `src/middleware.ts` - Next.js middleware integration
- `src/index.ts` - Main exports and Node.js integration

**Features:**
- Detects 15+ AI crawlers
- Automatic event batching (10 events or 5 seconds)
- Retry logic with exponential backoff
- Works with Next.js and Express/Node.js

## API Endpoints

### 1. Crawler Events API
**Endpoint:** `/api/crawler-events`
**Method:** POST
**Authentication:** Bearer token (API key)

**Request Body:**
```json
{
  "events": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "domain": "example.com",
      "path": "/blog/post-1",
      "crawlerName": "GPTBot",
      "crawlerCompany": "OpenAI",
      "crawlerCategory": "ai-training",
      "userAgent": "Mozilla/5.0 (compatible; GPTBot/1.0)",
      "statusCode": 200,
      "responseTimeMs": 123
    }
  ]
}
```

### 2. API Keys Management
**Endpoint:** `/api/api-keys`
**Methods:** GET, POST, DELETE
**Authentication:** User session

## Database Schema

### Tables Created:

1. **crawler_visits** - Raw visit data
   - Links to user via API key
   - Stores all metadata
   - Indexed for fast queries

2. **crawler_stats_daily** - Aggregated daily statistics
   - Pre-computed for dashboard performance
   - Tracks unique paths, countries, response times

3. **api_keys** - User API keys
   - Stores hashed keys (SHA-256)
   - Domain restrictions support
   - Soft delete with is_active flag

4. **crawler_analytics** (View) - Dashboard data
   - Aggregates stats by company
   - Ready for chart display

## Implementation Steps

### 1. Run Database Migration

```bash
# Apply the new migration
npx supabase db push
```

### 2. Build NPM Package

```bash
cd packages/split-analytics
npm install
npm run build
```

### 3. Test Locally

Create a test Next.js app:

```typescript
// middleware.ts
import { createCrawlerMiddleware } from './packages/split-analytics/middleware'

export const middleware = createCrawlerMiddleware({
  apiKey: 'split_live_test123',
  apiEndpoint: 'http://localhost:3000/api/crawler-events',
  debug: true
})
```

### 4. Generate API Key

Use the dashboard or API:

```bash
curl -X POST http://localhost:3000/api/api-keys \
  -H "Authorization: Bearer <user-session>" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Website", "domains": ["mysite.com"]}'
```

### 5. Update Dashboard

The existing dashboard components need to:
- Fetch data from `crawler_analytics` view
- Show API key management UI
- Display setup instructions

## Usage Examples

### Next.js Middleware

```typescript
// middleware.ts
export { middleware } from '@split/analytics/middleware'
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)'
}
```

### Express Server

```javascript
const express = require('express')
const { createNodeMiddleware } = require('@split/analytics')

const app = express()
app.use(createNodeMiddleware({
  apiKey: process.env.SPLIT_API_KEY
}))
```

### Custom Implementation

```javascript
import { detectAICrawler, trackCrawler } from '@split/analytics'

// Manual detection
if (detectAICrawler(userAgent).isAICrawler) {
  // Custom handling
}

// Manual tracking
await trackCrawler(config, {
  url: 'https://example.com/page',
  userAgent: req.headers['user-agent']
})
```

## Security Considerations

1. **API Keys** are hashed before storage
2. **RLS Policies** ensure data isolation
3. **Domain Restrictions** prevent key misuse
4. **Rate Limiting** should be added to API
5. **CORS** should be configured for API endpoint

## Next Steps

1. **Publish NPM Package**
   - Set up npm account
   - Configure package registry
   - Publish as @split/analytics

2. **Dashboard Integration**
   - Update PageViewCard to show crawler data
   - Add API key management section
   - Create setup wizard

3. **Production Deployment**
   - Set SUPABASE_SERVICE_KEY env var
   - Configure production API endpoint in package
   - Set up monitoring

4. **Testing**
   - Unit tests for detector logic
   - Integration tests for API
   - E2E tests for full flow

## Environment Variables Needed

```env
# For API endpoint
SUPABASE_SERVICE_KEY=your_service_key

# For NPM package users
SPLIT_API_KEY=split_live_xxxxx
```

## Monitoring

Track these metrics:
- API endpoint response times
- Event processing success rate
- Daily active domains
- Crawler detection accuracy

## Support Features to Add

1. **Webhook notifications** for crawler spikes
2. **CSV export** of crawler data
3. **robots.txt generator** based on analytics
4. **Slack/Discord integration** for alerts
5. **A/B testing** different responses to crawlers 