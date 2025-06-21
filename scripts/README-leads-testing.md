# Split Leads Testing Scripts

This directory contains various test scripts for the Split Leads enrichment pipeline. All scripts have been updated to:
- Use only 3 enrichments instead of 10
- Use the correct `lead_source` values: `'legacy'`, `'exa_search'`, or `'exa_webset'`
- Handle the Origami Agents workspace

## Available Scripts

### 1. `test-leads-flow.js`
Tests the basic leads flow with simulated data (no API calls required).
```bash
node scripts/test-leads-flow.js
```

### 2. `test-leads-quick.js`
Quick test without API requirements - creates simulated leads and contacts.
```bash
node scripts/test-leads-quick.js
```

### 3. `test-full-enrichment.js`
Full enrichment with real API calls (requires API keys).
- Uses IPInfo for IP → Company lookup
- Uses Exa Search API for finding contacts
- Includes email verification
```bash
node scripts/test-full-enrichment.js
```

### 4. `test-websets-enrichment.js` ⭐
Uses Exa Websets API (requires Pro plan) for high-quality enrichment.
- Processes multiple contacts (limited to 3)
- Stores full webset data in `exa_raw` field
- Includes enrichment details and evaluations
```bash
node scripts/test-websets-enrichment.js
```

### 5. `test-multi-contact-enrichment.js`
Uses regular Exa Search API to find and enrich multiple contacts.
- Processes top 3 candidates
- Shows detailed scoring and confidence metrics
- Stores raw content data
```bash
node scripts/test-multi-contact-enrichment.js
```

### 6. `test-real-websets-enrichment.js` 🔥
Uses the ACTUAL Exa Websets API with comprehensive enrichments (requires Pro plan).
- Real API calls, no hard-coded data
- Comprehensive enrichments including:
  - Recent LinkedIn posts
  - Thought leadership content
  - Press mentions and quotes
  - Patents
  - Speaking engagements
  - Awards and recognitions
- Saves all media content to database
- Test different companies: 1=Anthropic, 2=OpenAI, 3=Stripe
```bash
# Test Anthropic (default)
node scripts/test-real-websets-enrichment.js

# Test OpenAI
node scripts/test-real-websets-enrichment.js 2

# Test Stripe
node scripts/test-real-websets-enrichment.js 3
```

## Complete Enrichment Flow

The actual production flow works as follows:

### 1. Tracking Script
```html
<script src="http://split.dev/api/tracking/script?workspace=ID"></script>
```
- Captures visitor IP, page URL, referrer, UTM parameters
- Sends data to `/api/tracking/collect`

### 2. Collect Endpoint (`/api/tracking/collect`)
- Saves visit to `user_visits` table
- Checks if IP is business (not residential)  
- Triggers enrichment via `/api/leads/enrich-websets`

### 3. Websets Enrichment (`/api/leads/enrich-websets`)
**IP → Company → Contacts → Email**

- **IP → Company** (IPInfo API)
- **Company → Contacts** (Exa Websets API - limited to 3 results)
  
**Enrichments requested:**
- LinkedIn profile URL
- Current job title and company
- Professional headline and summary
- Recent LinkedIn posts (3 most recent)
- Media mentions & articles (2023-2025)
- Press quotes with actual quotes
- Speaking events, podcasts, conferences
- Patents, research papers, key projects
- Current focus areas and initiatives
- Work experience history
- Education background

- **Contact → Email** (pattern generation + verification)

**Saves to database:**
- `leads` table (company info, webset ID, AI attribution)
- `contacts` table (person info, picture, headline)
- `contact_media` table (posts, articles, podcasts, patents)
- `contact_experiences` table (work history)
- `contact_education` table (degrees)

### 4. Dashboard Display (`/dashboard/leads`)
- Shows enriched leads with "Enhanced" badge
- Profile pictures and headlines
- Right-side panel displays:
  - Recent LinkedIn posts with links
  - Articles & thought leadership content
  - Press mentions & actual quotes
  - Speaking engagements & podcasts
  - Patents & notable projects
  - Full work experience timeline
  - Education background
  - Engagement metrics

## API Limits & Credits

- **Websets API**: Requires Exa Pro plan
- **Results limited to 3** (reduced from 15 to save credits)
- **11 enrichment types** per person
- **Cost**: ~$0.35 per enrichment (25-35 credits)
- **Timeout**: 30 seconds for Websets processing

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Enrichment APIs
IPINFO_TOKEN=your_ipinfo_token
EXA_API_KEY=your_exa_api_key  # Pro plan required for Websets
```

## Database Constraints

The `leads` table has a constraint on `lead_source` that only allows:
- `'legacy'` - Old data
- `'exa_search'` - Regular Exa search results
- `'exa_webset'` - Exa Websets API results

## Key Updates

1. **Limited to 3 enrichments**: All scripts now process maximum 3 contacts per company
2. **Fixed lead_source values**: Scripts use the correct constraint values
3. **Workspace handling**: All scripts use the Origami Agents workspace
4. **Raw data storage**: Full API responses stored in `exa_raw` field

## Viewing Results

After running any script, view the results at:
- http://localhost:3000/dashboard/leads

## Troubleshooting

### "leads_lead_source_check" error
This means you're using an invalid lead_source value. Only use: `'legacy'`, `'exa_search'`, or `'exa_webset'`.

### Websets timeout
The Websets API can take 10-30 seconds. The scripts have a 30-second timeout configured.

### No contacts showing
Ensure both leads and contacts are created. The dashboard uses inner joins, so both tables need data.

### API errors
- Check your API keys are valid
- Ensure you have credits/quota
- For Websets, ensure you have Exa Pro plan 