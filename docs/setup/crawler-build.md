# AI Crawler Tracking Implementation Strategy

## Overview
We need to track AI engine crawler visits to websites and display analytics about their behavior. This document outlines different approaches, their pros/cons, and implementation considerations.

## Simplified Platform Strategy

### Platforms We Support (Can Use Our API)
1. **Vercel/Next.js** - Via middleware
2. **Custom Servers** - Direct API integration

### Platforms We Don't Support (Coming Soon)
- **WordPress** - Would require plugin
- **Netlify** - Would require Edge Functions setup
- **Cloudflare** - Would require Workers setup
- **Framer/Webflow/Wix** - No server access
- **Squarespace** - No server access
- **Shopify** - Would require app
- **Ghost** - Would require integration

### Future Platform Support
We're working on expanding platform support based on user demand. More integrations coming soon!

### Why This Approach
- Focus on platforms with server-side capabilities
- Avoid maintaining dozens of plugins/apps
- Be honest about limitations
- Simpler to build and maintain
- Let users guide our roadmap

## Why Custom HTML/JavaScript Won't Work

### The Fundamental Problem
**AI crawlers don't execute JavaScript.** They work like this:
1. Crawler fetches the HTML page
2. Parses the content for training/indexing
3. Moves on to the next page

They specifically:
- Don't run JavaScript code
- Don't load external scripts
- Don't trigger analytics events
- Don't execute pixel tracking

### What We Need Instead
To detect AI crawlers, we need:
- **Server-side access** to read User-Agent headers
- **Request interception** before the page is served
- **Log analysis** capabilities

### Best Alternatives for No-Code Platforms

1. **Cloudflare Workers** (Recommended)
   - Works with ANY website behind Cloudflare
   - No code changes to your site needed
   - Can detect crawlers at the edge
   - Free tier available

2. **Platform Migration**
   - Export from Webflow/Framer → Next.js
   - Use a platform with server access
   - Maintain design while gaining control

3. **Proxy Services**
   - Route traffic through a service that can log
   - Similar to Cloudflare but custom
   - More complex setup

## Connect Analytics Dialog Approach

### User Flow
1. User clicks "Connect Analytics" in empty state
2. Dialog asks: "How do you host your website?"
3. Three main options + help:
   - **Vercel / Next.js** - For modern frameworks
   - **WordPress** - For CMS users (35% of web)
   - **Custom Server** - For everyone else
   - **I need help** - Direct support

### Why This Works
- No technical jargon upfront
- Users self-select based on what they know
- Each path is optimized for that audience
- Covers 95%+ of use cases

## Known AI Crawler User-Agents
- **OpenAI**: `GPTBot`, `ChatGPT-User`, `CCBot` (when used by OpenAI)
- **Google**: `Google-Extended`, `Googlebot` (for Bard/Gemini)
- **Anthropic**: `Claude-Web`, `ClaudeBot`
- **Perplexity**: `PerplexityBot`
- **Microsoft**: `Bingbot` (for Copilot)
- **Others**: `YouBot`, `Bytespider`, `Diffbot`, `FacebookBot` (for AI training)

## Approach 1: Custom JavaScript Tracking Script

### How it works
- Embed a lightweight JS snippet on customer websites
- Script detects crawler user-agents and sends data to our API
- Similar to how Google Analytics or Plausible work

### Pros
- ✅ Full control over data collection
- ✅ Real-time tracking capability
- ✅ Works on any platform/hosting
- ✅ Can track additional metadata (page content, meta tags, etc.)
- ✅ Privacy-friendly (we control the data)

### Cons
- ❌ JavaScript won't execute for most crawlers (they don't run JS)
- ❌ Would need server-side implementation instead
- ❌ Requires customers to add our script

### Verdict
**Not viable for client-side JS** - Crawlers don't execute JavaScript

## Approach 2: Server-Side Log Analysis

### How it works
- Analyze server access logs for AI crawler user-agents
- Process logs via API endpoints or log streaming

### Implementation Options

#### 2A: Vercel Analytics Integration
```
- Use Vercel's Web Analytics API
- Access logs through Vercel's data pipeline
- Filter for AI crawler user-agents
```

**Pros:**
- ✅ No additional code needed on customer sites
- ✅ Works for all Vercel-hosted sites
- ✅ Accurate server-side data
- ✅ Can access historical data

**Cons:**
- ❌ Limited to Vercel customers only
- ❌ May require Enterprise plan for log access
- ❌ Limited control over data granularity

#### 2B: Cloudflare Workers/Analytics
```
- Deploy Cloudflare Worker to intercept requests
- Log AI crawler visits to Cloudflare Analytics or our API
- Works for any site using Cloudflare
```

**Pros:**
- ✅ Works at edge level (very fast)
- ✅ Can modify responses for crawlers
- ✅ Good analytics API
- ✅ Free tier available

**Cons:**
- ❌ Requires Cloudflare proxy
- ❌ Another dependency

#### 2C: Custom Middleware/Plugin System

**Next.js Middleware:**
```typescript
// Detect and log crawler in Next.js middleware
export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')
  if (isAICrawler(userAgent)) {
    // Log to our API
  }
}
```

**Express/Node.js Middleware:**
```javascript
app.use((req, res, next) => {
  if (isAICrawler(req.headers['user-agent'])) {
    // Log to our API
  }
  next()
})
```

**Pros:**
- ✅ Framework-specific solutions
- ✅ Easy integration for developers
- ✅ Works with server-side rendering
- ✅ Can be npm packages

**Cons:**
- ❌ Need different solutions per framework
- ❌ Requires code changes

## Can We Use Google Analytics?

### The Short Answer
**No, GA cannot directly track AI crawlers** because:
1. **Crawlers don't execute JavaScript** - GA tracking code never runs
2. **GA filters out bots by default** - It's designed to exclude crawler traffic
3. **No server-side tracking** - GA relies on client-side JavaScript

### The Workaround: Hybrid Approach
We could potentially send crawler data TO Google Analytics:

```
1. Our middleware/worker detects crawler (server-side)
2. Send event to GA via Measurement Protocol API
3. User sees crawler data in their GA dashboard
```

#### Example Flow:
```javascript
// In our middleware
if (isAICrawler(userAgent)) {
  // Track locally
  await trackCrawler(request)
  
  // Also send to user's GA4
  await sendToGA4({
    client_id: 'crawler_' + hash(userAgent),
    events: [{
      name: 'ai_crawler_visit',
      params: {
        crawler_type: 'GPTBot',
        page_path: request.path
      }
    }]
  })
}
```

### Pros of GA Integration:
- ✅ Users keep data in familiar interface
- ✅ No new dashboard to learn
- ✅ Leverages existing GA features
- ✅ Free for most use cases

### Cons of GA Integration:
- ❌ Still needs our server-side detection first
- ❌ GA might filter/sample the data
- ❌ Not designed for crawler analytics
- ❌ Limited to GA's event structure
- ❌ Requires GA4 (not Universal Analytics)
- ❌ API quotas and limits

### Recommended Approach
1. **Primary**: Our dedicated crawler analytics (designed for this)
2. **Optional**: Send duplicate events to GA for users who want it
3. **Best of both**: Specialized crawler insights + familiar GA interface

## Approach 3: Google Analytics Integration

### How it works
- Use Google Analytics Measurement Protocol
- Send server-side events when crawlers visit
- Leverage GA's infrastructure for storage/querying

### Implementation
```
1. Customer adds GA4 tracking code
2. We provide server-side middleware
3. Middleware sends events to GA via Measurement Protocol
4. We access data via GA Data API
```

### Pros
- ✅ Leverages existing GA infrastructure
- ✅ Many sites already have GA
- ✅ Powerful analytics capabilities
- ✅ Historical data access

### Cons
- ❌ Requires GA4 setup
- ❌ Data sampling on free tier
- ❌ Privacy concerns with Google
- ❌ API quotas and limits

## Approach 4: Hybrid Solution (Recommended)

### Architecture
```
1. Multiple data sources:
   - Vercel Integration (for Vercel sites)
   - Cloudflare Integration (for CF sites)
   - Custom middleware packages (npm)
   - Webhook endpoints for custom solutions

2. Unified API:
   - Single endpoint to receive crawler data
   - Normalize data from all sources
   - Store in our database (Supabase)

3. Customer Integration Options:
   Priority order:
   a. Automatic (Vercel/Cloudflare integrations)
   b. Framework middleware (Next.js, Express, etc.)
   c. Generic webhook for custom solutions
   d. Manual log upload (last resort)
```

### Implementation Phases

**Phase 1: MVP (Week 1-2)**
- Next.js middleware package
- Basic API endpoint
- Simple user-agent detection
- Store in Supabase

**Phase 2: Integrations (Week 3-4)**
- Vercel integration
- Cloudflare Worker template
- Express middleware

**Phase 3: Analytics (Week 5-6)**
- Time-series data processing
- Attribution by source
- Detailed analytics dashboard

### Data Schema
```sql
-- crawler_visits table
id: uuid
domain: text
path: text
crawler_name: text (GPTBot, Claude-Web, etc.)
crawler_category: text (OpenAI, Anthropic, etc.)
timestamp: timestamptz
response_time_ms: integer
status_code: integer
content_length: integer
country: text (from IP)
-- metadata jsonb for flexibility

-- aggregated_stats table (for performance)
domain: text
crawler_name: text
date: date
visit_count: integer
unique_paths: integer
avg_response_time: float
```

## Technical Considerations

### User-Agent Detection
```javascript
const AI_CRAWLERS = {
  'GPTBot': 'OpenAI',
  'ChatGPT-User': 'OpenAI',
  'CCBot': 'Common Crawl/OpenAI',
  'Claude-Web': 'Anthropic',
  'ClaudeBot': 'Anthropic',
  'PerplexityBot': 'Perplexity',
  'Google-Extended': 'Google',
  'Bingbot': 'Microsoft',
  // ... more
}

function detectAICrawler(userAgent) {
  for (const [bot, company] of Object.entries(AI_CRAWLERS)) {
    if (userAgent.includes(bot)) {
      return { bot, company }
    }
  }
  return null
}
```

### Rate Limiting & Performance
- Batch API calls (don't send every visit individually)
- Use edge functions where possible
- Implement client-side queuing
- Add exponential backoff for retries

### Privacy & Compliance
- Don't log IP addresses (hash if needed)
- Comply with GDPR/CCPA
- Allow customers to opt-out specific crawlers
- Provide data export capabilities

## Recommended MVP Approach

1. **Start with Next.js middleware** package (largest target market)
2. **Simple npm package**: `@split/crawler-analytics`
3. **Basic features**:
   - Detect AI crawlers
   - Batch and send to our API
   - Local caching for reliability
4. **Customer onboarding**:
   ```bash
   npm install @split/crawler-analytics
   ```
   ```javascript
   // middleware.ts
   import { crawlerAnalytics } from '@split/crawler-analytics'
   
   export const middleware = crawlerAnalytics({
     apiKey: process.env.SPLIT_API_KEY
   })
   ```

5. **Quick wins**:
   - Pre-built dashboard
   - Email alerts for crawler spikes
   - Weekly summary reports

## Future Enhancements

1. **AI Response Optimization**
   - Serve different content to different crawlers
   - A/B test crawler responses
   - Optimize meta tags per AI engine

2. **Advanced Analytics**
   - Crawler behavior patterns
   - Content preference analysis
   - Predictive crawler analytics

3. **Integrations**
   - WordPress plugin
   - Shopify app
   - JAMstack integrations

4. **Enterprise Features**
   - Custom crawler rules
   - API access
   - White-label dashboards 