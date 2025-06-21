# Split Leads Enrichment Setup

This document explains how the automatic lead enrichment flow works in Split.

## Overview

The enrichment flow automatically identifies and enriches business visitors:

1. **Tracking**: Website visitor hits tracking pixel
2. **IP Lookup**: IPInfo identifies company from IP address  
3. **Enrichment**: Websets API finds executive contacts at the company
4. **Email Discovery**: Generates and verifies professional email
5. **Dashboard**: Lead appears with full enrichment data

## Production Flow

```mermaid
graph TD
    A[Visitor Loads Page] --> B[Tracking Pixel]
    B --> C[/api/tracking/collect]
    C --> D{Business IP?}
    D -->|No| E[Save Visit Only]
    D -->|Yes| F[Trigger Enrichment]
    F --> G[/api/leads/enrich-websets]
    G --> H[IPInfo: IP → Company]
    H --> I[Websets: Company → Contact]
    I --> J[Email Generator]
    J --> K[Save Lead + Contact]
    K --> L[Dashboard Display]
```

## Configuration

### Environment Variables

```bash
# Required for enrichment
IPINFO_API_KEY=your_ipinfo_token
EXA_API_KEY=your_exa_api_key  # Must be Pro plan for Websets
INTERNAL_API_KEY=random_string_for_internal_auth

# Email verification (optional but recommended)
ZEROBOUNCE_API_KEY=your_zerobounce_key
```

### Database Setup

Run migrations to add required columns:
```bash
pnpm supabase migration up
```

## How It Works

### 1. Tracking Collection (`/api/tracking/collect`)

When a visitor hits your site, the tracking pixel sends data to the collect endpoint:

```javascript
// Tracking data includes:
{
  v: "visitor_id",
  w: "workspace_id", 
  u: "page_url",
  r: "referrer",
  ua: "user_agent",
  // ... viewport, screen, etc
}
```

The endpoint:
- Extracts visitor IP address
- Uses IPInfo to identify company
- Saves visit to `user_visits` table
- Triggers enrichment for business IPs

### 2. Business IP Detection

A visit triggers enrichment if:
- IPInfo returns company data
- Confidence is high or medium
- Not a residential/ISP connection

### 3. Websets Enrichment (`/api/leads/enrich-websets`)

For business visitors, the enrichment process:

1. **Creates Webset Search**:
   - Searches for executives at the company
   - Requests 11 enrichment types
   - Limited to 3 results to save credits

2. **Enrichment Types**:
   - LinkedIn profile URL
   - Current focus areas
   - Work experience history
   - Education background
   - Recent LinkedIn posts
   - Media mentions & articles
   - Press quotes
   - Speaking engagements
   - Patents & key works

3. **Contact Selection**:
   - Scores by title match (VP, CTO, etc)
   - Weights by Exa relevance score
   - Picks best matching executive

4. **Email Discovery**:
   - Generates patterns (john.doe@, jdoe@, etc)
   - Verifies with ZeroBounce if available
   - Falls back to most likely pattern

### 4. Data Storage

Enriched data is stored across multiple tables:

- `leads`: Company info, attribution, webset ID
- `contacts`: Person details, email, LinkedIn
- `contact_media`: Posts, articles, quotes
- `contact_experiences`: Work history
- `contact_education`: Degrees

### 5. Dashboard Display

The dashboard shows:
- Company and contact details
- AI attribution source
- Professional summary
- Recent activity (posts, articles)
- Work experience
- Education background

## Testing

### Test Individual Components

```bash
# Test tracking endpoint
node scripts/test-production-flow.js

# Test enrichment directly
node scripts/test-enrichment-endpoint.js

# Test with real Websets data
node scripts/test-websets-to-database.js
```

### Monitor Logs

The system logs detailed information:
- `🔍 New visitor tracked`
- `🏢 Business IP detected` 
- `✅ Enrichment triggered`
- `💾 SAVING LEAD WITH FULL DATA`

## Costs

- **IPInfo**: ~$0.0004 per lookup
- **Websets**: ~$0.35 per enrichment (25-35 credits)
- **Email Verification**: ~$0.01 per email

Total: ~$0.36 per enriched lead

## Troubleshooting

### Enrichment Not Triggering
- Check IPInfo API key is valid
- Verify IP is detected as business (not ISP)
- Check logs for "Business IP detected"

### Websets Timeout
- Normal for complex searches (30-45s)
- System handles timeouts gracefully
- Partial results are saved if available

### Missing Enrichment Data
- Check Exa API key has Pro plan access
- Verify enrichment parsing in logs
- Some executives may have limited public data

### Authentication Errors
- Set `INTERNAL_API_KEY` in environment
- Match key in both tracking and enrichment endpoints
- For manual testing, use admin credentials 