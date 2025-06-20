# LLM Lead Attribution Feature - Complete Implementation Guide

## Table of Contents
1. [Product Vision & Scope](#product-vision--scope)
2. [Technical Architecture](#technical-architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Implementation Phases](#implementation-phases)
7. [Security & Privacy](#security--privacy)
8. [Testing Strategy](#testing-strategy)
9. [Deployment & Monitoring](#deployment--monitoring)

## Product Vision & Scope

### Problem Statement
Marketing teams can see traffic arriving at their websites but lack visibility into whether visitors were influenced by AI assistants like Perplexity, ChatGPT, Gemini, or Copilot. This creates a blind spot in attribution and lead scoring.

### Solution Overview
Build an LLM Lead Attribution system that:
- Detects when website visitors arrive from AI assistants
- Enriches anonymous visitors with company and contact data
- Attributes leads back to specific LLM sources and queries
- Scores intent based on AI engagement patterns
- Integrates seamlessly into the Split dashboard

### Key Differentiators
- **AI-First Attribution**: Purpose-built for LLM traffic patterns
- **Query Context**: Captures the actual search queries when available
- **Intent Scoring**: Combines LLM engagement with Split's AEO visibility data
- **Privacy-Compliant**: GDPR/CCPA ready with consent management

## Technical Architecture

### High-Level System Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser JS    │    │  Edge Function  │    │   Supabase DB   │
│   Tracking      │───▶│  LLM Detector   │───▶│   Raw Events    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐             │
│  Enrichment     │◀───│  Background     │◀────────────┘
│  APIs           │    │  Workers        │
│ • Fingerprint   │    │ • IP→Company    │
│ • Clearbit      │    │ • Contact Data  │
│ • Apollo        │    │ • Intent Score  │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐
│   CRM/Sales     │◀───│  Split Dashboard│
│ • HubSpot       │    │ • Lead Cards    │
│ • Salesforce    │    │ • Attribution   │
│ • Pipedrive     │    │ • Intent Score  │
└─────────────────┘    └─────────────────┘
```

### Core Components

#### 1. Client-Side Tracking
- **Purpose**: Capture visitor sessions from LLM referrals
- **Technology**: Lightweight JavaScript snippet
- **Deployment**: CDN-hosted, async loading
- **Data Collected**: IP, referrer, user-agent, query params, page path

#### 2. LLM Detection Service

#### Core Detection Logic
```typescript
// src/lib/llm-detection.ts
export interface LLMDetectionInput {
  referrer?: string;
  userAgent: string;
  queryParams?: Record<string, string>;
  workspaceId: string;
  correlationWindow?: number; // minutes, default 90
}

export interface LLMDetectionResult {
  source: string | null;
  confidence: number; // 0.0 to 1.0
  queryText?: string;
  method: 'referrer' | 'utm' | 'correlation' | 'user_agent';
  metadata?: Record<string, any>;
}

// Known LLM domains and patterns
const LLM_DOMAINS = {
  'perplexity.ai': {
    name: 'perplexity',
    confidence: 0.95,
    queryParams: ['q', 's'],
    patterns: [
      /perplexity\.ai\/search\?q=([^&]+)/,
      /perplexity\.ai\/p\/[^?]+\?s=([^&]+)/
    ]
  },
  'gemini.google.com': {
    name: 'gemini',
    confidence: 0.90,
    queryParams: ['q'],
    patterns: []
  },
  'copilot.microsoft.com': {
    name: 'copilot',
    confidence: 0.90,
    queryParams: ['q'],
    patterns: []
  },
  'chat.openai.com': {
    name: 'chatgpt',
    confidence: 0.85,
    queryParams: [],
    patterns: [/chat\.openai\.com\/share\/[a-f0-9-]+/]
  },
  'www.bing.com': {
    name: 'bing_chat',
    confidence: 0.75,
    queryParams: ['q'],
    patterns: [/bing\.com\/aclick.*q=([^&]+)/]
  }
};

const LLM_USER_AGENTS = [
  { pattern: /PerplexityBot/i, source: 'perplexity', type: 'bot' },
  { pattern: /ChatGPT-User/i, source: 'chatgpt', type: 'human' },
  { pattern: /GPTBot/i, source: 'chatgpt', type: 'bot' },
  { pattern: /Google-Extended/i, source: 'gemini', type: 'bot' },
];

export async function detectLLMSource(input: LLMDetectionInput): Promise<LLMDetectionResult> {
  // Method 1: Direct referrer detection
  if (input.referrer) {
    const referrerResult = detectFromReferrer(input.referrer);
    if (referrerResult.source) {
      return referrerResult;
    }
  }

  // Method 2: UTM parameter detection
  if (input.queryParams) {
    const utmResult = detectFromUTM(input.queryParams);
    if (utmResult.source) {
      return utmResult;
    }
  }

  // Method 3: User-agent detection
  const uaResult = detectFromUserAgent(input.userAgent);
  if (uaResult.source && uaResult.metadata?.type === 'human') {
    return uaResult;
  }

  // Method 4: Correlation with recent query activity
  if (!input.referrer || input.referrer === '') {
    const correlationResult = await detectFromCorrelation(input);
    if (correlationResult.source) {
      return correlationResult;
    }
  }

  return {
    source: null,
    confidence: 0,
    method: 'referrer'
  };
}

function detectFromReferrer(referrer: string): LLMDetectionResult {
  try {
    const url = new URL(referrer);
    const domain = url.hostname.toLowerCase();
    
    // Check exact domain matches
    for (const [knownDomain, config] of Object.entries(LLM_DOMAINS)) {
      if (domain === knownDomain || domain.endsWith(`.${knownDomain}`)) {
        // Extract query if available
        let queryText: string | undefined;
        for (const param of config.queryParams) {
          const value = url.searchParams.get(param);
          if (value) {
            queryText = decodeURIComponent(value);
            break;
          }
        }
        
        // Try pattern matching for encoded queries
        if (!queryText) {
          for (const pattern of config.patterns) {
            const match = referrer.match(pattern);
            if (match && match[1]) {
              queryText = decodeURIComponent(match[1]);
              break;
            }
          }
        }
        
        return {
          source: config.name,
          confidence: config.confidence,
          queryText,
          method: 'referrer',
          metadata: { domain, fullUrl: referrer }
        };
      }
    }
    
    return { source: null, confidence: 0, method: 'referrer' };
  } catch (error) {
    return { source: null, confidence: 0, method: 'referrer' };
  }
}

function detectFromUTM(queryParams: Record<string, string>): LLMDetectionResult {
  const utmSource = queryParams.utm_source?.toLowerCase();
  const utmMedium = queryParams.utm_medium?.toLowerCase();
  
  const llmSources = ['chatgpt', 'perplexity', 'gemini', 'copilot', 'claude', 'ai'];
  const aiMediums = ['ai', 'llm', 'chatbot', 'assistant'];
  
  if (utmSource && llmSources.some(source => utmSource.includes(source))) {
    return {
      source: utmSource,
      confidence: 0.8,
      method: 'utm',
      metadata: { utm_source: utmSource, utm_medium: utmMedium }
    };
  }
  
  if (utmMedium && aiMediums.some(medium => utmMedium.includes(medium))) {
    return {
      source: utmSource || 'ai_assistant',
      confidence: 0.6,
      method: 'utm',
      metadata: { utm_source: utmSource, utm_medium: utmMedium }
    };
  }
  
  return { source: null, confidence: 0, method: 'utm' };
}

function detectFromUserAgent(userAgent: string): LLMDetectionResult {
  for (const { pattern, source, type } of LLM_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      return {
        source,
        confidence: type === 'human' ? 0.7 : 0.3, // Lower confidence for bots
        method: 'user_agent',
        metadata: { type, userAgent }
      };
    }
  }
  
  return { source: null, confidence: 0, method: 'user_agent' };
}

async function detectFromCorrelation(input: LLMDetectionInput): Promise<LLMDetectionResult> {
  // This requires correlation data from visibility tests
  // Implementation would query llm_query_correlations table
  
  const correlationWindow = input.correlationWindow || 90; // minutes
  const windowStart = new Date(Date.now() - correlationWindow * 60 * 1000);
  
  // Query for recent correlations
  // This is a simplified version - full implementation would be more complex
  
  return { source: null, confidence: 0, method: 'correlation' };
}

#### 3. Tracking Pixel Implementation

#### Client-Side Tracking Script
```typescript
// src/lib/tracking/llm-pixel.ts
export interface LLMTrackingConfig {
  workspaceId: string;
  apiEndpoint: string;
  fingerprintApiKey?: string;
  enableFingerprinting?: boolean;
  debugMode?: boolean;
}

class LLMTracker {
  private config: LLMTrackingConfig;
  private sessionId: string;
  private fingerprintPromise?: Promise<any>;

  constructor(config: LLMTrackingConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    
    if (config.enableFingerprinting && config.fingerprintApiKey) {
      this.initFingerprinting();
    }
    
    // Track initial page load
    this.trackPageView();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  private generateSessionId(): string {
    return `llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initFingerprinting() {
    try {
      // Dynamic import to avoid blocking
      const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
      const fp = await FingerprintJS.load();
      this.fingerprintPromise = fp.get();
    } catch (error) {
      console.warn('Fingerprinting failed:', error);
    }
  }

  private setupEventListeners() {
    // Track page navigation for SPAs
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.trackPageView();
      }
    }).observe(document, { subtree: true, childList: true });

    // Track engagement events
    this.trackEngagement();
  }

  private async trackPageView() {
    const trackingData = await this.gatherTrackingData();
    
    try {
      const response = await fetch(`${this.config.apiEndpoint}/api/track/llm-attribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData),
      });

      if (this.config.debugMode) {
        const result = await response.json();
        console.log('LLM Tracking Result:', result);
      }
    } catch (error) {
      if (this.config.debugMode) {
        console.error('LLM Tracking Error:', error);
      }
    }
  }

  private async gatherTrackingData() {
    const fingerprint = this.fingerprintPromise ? await this.fingerprintPromise.catch(() => null) : null;
    
    return {
      workspaceId: this.config.workspaceId,
      sessionId: this.sessionId,
      visitorId: fingerprint?.visitorId,
      
      // Request context
      ipAddress: '', // Will be set server-side
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      pagePath: location.pathname + location.search,
      queryParams: this.parseQueryParams(),
      
      // Timing
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Fingerprinting data
      fingerprint: fingerprint ? {
        visitorId: fingerprint.visitorId,
        requestId: fingerprint.requestId,
        confidence: fingerprint.confidence.score,
        browserDetails: fingerprint.components,
      } : undefined,
    };
  }

  private parseQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    const urlParams = new URLSearchParams(location.search);
    
    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }
    
    return params;
  }

  private trackEngagement() {
    // Track scroll depth
    let maxScroll = 0;
    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }
    };

    window.addEventListener('scroll', trackScroll, { passive: true });

    // Track time on page
    const startTime = Date.now();
    
    // Send engagement data before leaving
    window.addEventListener('beforeunload', () => {
      const engagementData = {
        sessionDuration: Date.now() - startTime,
        maxScrollDepth: maxScroll,
        pageViews: 1, // Will be aggregated server-side
      };
      
      // Use sendBeacon for reliability
      navigator.sendBeacon(
        `${this.config.apiEndpoint}/api/track/llm-attribution/engagement`,
        JSON.stringify(engagementData)
      );
    });
  }
}

// Global initialization function
(window as any).initLLMTracking = function(config: LLMTrackingConfig) {
  if (typeof window !== 'undefined') {
    new LLMTracker(config);
  }
};
```

#### Installation Script
```html
<!-- Add to website <head> or before closing </body> -->
<script>
(function() {
  // Async script loading
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://cdn.split.com/llm-tracker.min.js';
  script.onload = function() {
    window.initLLMTracking({
      workspaceId: 'your-workspace-id',
      apiEndpoint: 'https://app.split.com',
      fingerprintApiKey: 'your-fingerprint-key', // optional
      enableFingerprinting: true,
      debugMode: false
    });
  };
  document.head.appendChild(script);
})();
</script>
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Basic tracking and LLM detection

**Deliverables**:
- [ ] Database schema implementation
- [ ] Basic tracking endpoint (`/api/track/llm-attribution`)
- [ ] LLM detection service with referrer parsing
- [ ] Client-side tracking script (minimal version)
- [ ] Basic dashboard page structure

**Technical Tasks**:
```bash
# Database setup
pnpm run supabase migration new create_llm_attribution_tables
pnpm run supabase db push

# API endpoints
touch src/app/api/track/llm-attribution/route.ts
mkdir -p src/lib/llm-detection
touch src/lib/llm-detection/index.ts

# Frontend structure
mkdir -p src/app/dashboard/llm-attribution
touch src/app/dashboard/llm-attribution/page.tsx
mkdir -p src/components/llm-attribution
```

**Success Criteria**:
- LLM sessions appear in database
- Basic source detection works for Perplexity and ChatGPT
- Dashboard shows session count

### Phase 2: Enrichment Pipeline (Week 3-4)
**Goal**: IP-to-company enrichment with Clearbit/Apollo

**Deliverables**:
- [ ] Enrichment service integration
- [ ] Background job processing
- [ ] Lead creation and deduplication
- [ ] Enrichment cost tracking
- [ ] Lead detail pages

**Technical Tasks**:
```bash
# Enrichment services
mkdir -p src/lib/enrichment
touch src/lib/enrichment/clearbit.ts
touch src/lib/enrichment/apollo.ts
touch src/lib/enrichment/queue.ts

# Background workers (Supabase Edge Functions)
mkdir -p supabase/functions/llm-enrichment
touch supabase/functions/llm-enrichment/index.ts

# Lead management
touch src/app/api/llm-attribution/enrich/route.ts
touch src/app/api/llm-attribution/leads/route.ts
```

**Integration Code**:
```typescript
// src/lib/enrichment/clearbit.ts
export async function enrichWithClearbit(ipAddress: string) {
  const response = await fetch('https://company.clearbit.com/v1/domains/find', {
    headers: {
      'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    // Implementation details...
  });
  
  return response.json();
}
```

**Success Criteria**:
- Anonymous IPs resolve to company names
- Enrichment costs tracked and within budget
- Lead table shows enriched data

### Phase 3: Intent Scoring (Week 5-6)
**Goal**: AI-powered lead scoring and qualification

**Deliverables**:
- [ ] Intent scoring algorithm
- [ ] AEO visibility integration
- [ ] Lead quality classification
- [ ] Scoring breakdown UI
- [ ] Alert system for high-intent leads

**Scoring Algorithm**:
```typescript
// src/lib/intent-scoring/algorithm.ts
export function calculateIntentScore(factors: IntentFactors): IntentScore {
  const weights = {
    visibilityRank: 0.25,      // How well does Split rank for the query?
    queryRelevance: 0.20,      // How relevant is the query to business?
    engagementDepth: 0.20,     // How much did they engage?
    firmographicMatch: 0.20,   // Do they match ICP?
    novelty: 0.15,             // First time seeing this company?
  };

  let totalScore = 0;
  const breakdown: Record<string, { score: number; weight: number }> = {};

  for (const [factor, weight] of Object.entries(weights)) {
    const factorScore = factors[factor] || 0;
    totalScore += factorScore * weight;
    breakdown[factor] = { score: factorScore, weight };
  }

  const intentScore = Math.round(Math.max(0, Math.min(100, totalScore)));
  
  return {
    score: intentScore,
    quality: intentScore >= 70 ? 'hot' : intentScore >= 40 ? 'warm' : 'cold',
    breakdown,
  };
}
```

**Success Criteria**:
- Intent scores visible in lead table
- High-intent leads trigger notifications
- Scoring breakdown helps prioritization

### Phase 4: CRM Integration (Week 7-8)
**Goal**: Bi-directional sync with HubSpot/Salesforce

**Deliverables**:
- [ ] HubSpot API integration
- [ ] Salesforce API integration (optional)
- [ ] Custom field mapping
- [ ] Bulk sync operations
- [ ] Sync status tracking

**HubSpot Integration**:
```typescript
// src/lib/crm/hubspot.ts
export async function syncLeadToHubSpot(lead: LLMLead) {
  // Create or update company
  const companyData = {
    properties: {
      name: lead.company.name,
      domain: lead.company.domain,
      industry: lead.company.industry,
      llm_attribution_source: lead.firstLLMSource,
      llm_intent_score: lead.intentScore,
      llm_first_query: lead.firstLLMQuery,
    },
  };

  const company = await hubspotClient.crm.companies.basicApi.create({
    properties: companyData.properties,
  });

  // Create contact if email available
  if (lead.contact?.email) {
    const contactData = {
      properties: {
        email: lead.contact.email,
        firstname: lead.contact.name?.split(' ')[0],
        lastname: lead.contact.name?.split(' ').slice(1).join(' '),
        jobtitle: lead.contact.title,
        llm_attribution_source: lead.firstLLMSource,
        llm_intent_score: lead.intentScore,
      },
      associations: [{
        to: { id: company.id },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }],
      }],
    };

    await hubspotClient.crm.contacts.basicApi.create(contactData);
  }
}
```

**Success Criteria**:
- Leads appear in HubSpot with custom fields
- Attribution data preserved in CRM
- Sales team can act on LLM leads

### Phase 5: Advanced Features (Week 9-12)
**Goal**: Query correlation, alerts, and optimization

**Deliverables**:
- [ ] Query correlation system
- [ ] Real-time alerts (Slack/Teams)
- [ ] A/B testing for tracking methods
- [ ] Performance monitoring
- [ ] Cost optimization

**Query Correlation System**:
```typescript
// src/lib/correlation/query-matcher.ts
export async function correlateTrafficWithQueries(
  workspaceId: string,
  windowMinutes: number = 90
) {
  // Get recent snapshot queries
  const recentQueries = await getRecentSnapshotQueries(workspaceId, windowMinutes);
  
  // Get uncorrelated direct traffic
  const directTraffic = await getDirectTraffic(workspaceId, windowMinutes);
  
  const correlations: Correlation[] = [];
  
  for (const traffic of directTraffic) {
    for (const query of recentQueries) {
      const confidence = calculateCorrelationConfidence(traffic, query);
      
      if (confidence > 0.3) {
        correlations.push({
          trafficId: traffic.id,
          queryId: query.id,
          confidence,
          method: 'temporal_and_geographic'
        });
      }
    }
  }
  
  return correlations;
}
```

**Success Criteria**:
- ChatGPT traffic (no referrer) gets attributed
- Slack alerts for high-value leads
- Cost per lead optimized

## Security & Privacy

### GDPR Compliance
```typescript
// src/lib/privacy/gdpr.ts
export class GDPRManager {
  static async handleConsentUpdate(visitorId: string, consent: ConsentData) {
    if (!consent.analytics) {
      // Stop tracking, anonymize existing data
      await this.anonymizeVisitorData(visitorId);
    }
    
    if (!consent.marketing) {
      // Remove from enrichment queue
      await this.removeFromEnrichment(visitorId);
    }
  }

  static async handleForgetMeRequest(email: string) {
    // Find all records for this user
    const leads = await supabase
      .from('llm_leads')
      .select('*')
      .eq('contact_email', email);

    for (const lead of leads.data || []) {
      // Anonymize personal data, keep aggregated stats
      await supabase
        .from('llm_leads')
        .update({
          contact_email: null,
          contact_name: null,
          contact_phone: null,
          visitor_id: `anonymous_${crypto.randomUUID()}`,
        })
        .eq('id', lead.id);
    }
  }
}
```

### Data Retention
```sql
-- Auto-cleanup policies
CREATE OR REPLACE FUNCTION cleanup_old_tracking_events()
RETURNS void AS $$
BEGIN
  -- Delete events older than 1 year
  DELETE FROM llm_tracking_events 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Delete expired correlations
  DELETE FROM llm_query_correlations 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run daily via cron
SELECT cron.schedule('cleanup-llm-data', '0 2 * * *', 'SELECT cleanup_old_tracking_events();');
```

## Testing Strategy

### Unit Tests
```typescript
// src/lib/llm-detection/__tests__/detection.test.ts
describe('LLM Detection', () => {
  test('detects Perplexity referrer with query', () => {
    const result = detectLLMSource({
      referrer: 'https://www.perplexity.ai/search?q=best%20analytics%20tools',
      userAgent: 'Mozilla/5.0...',
      workspaceId: 'test-workspace'
    });

    expect(result.source).toBe('perplexity');
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.queryText).toBe('best analytics tools');
  });

  test('handles ChatGPT with no referrer', async () => {
    // Mock correlation data
    mockCorrelationData({
      queryText: 'analytics dashboard features',
      citedUrls: ['https://example.com/features'],
      detectedAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    });

    const result = await detectLLMSource({
      referrer: '',
      userAgent: 'Mozilla/5.0...',
      workspaceId: 'test-workspace'
    });

    expect(result.source).toBe('chatgpt');
    expect(result.confidence).toBeGreaterThan(0.3);
  });
});
```

### Integration Tests
```typescript
// src/app/api/track/llm-attribution/__tests__/route.test.ts
describe('/api/track/llm-attribution', () => {
  test('creates tracking event and triggers enrichment', async () => {
    const response = await POST(new Request('http://localhost:3000/api/track/llm-attribution', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: 'test-workspace',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        referrer: 'https://www.perplexity.ai/search?q=test',
        pagePath: '/features',
      }),
    }));

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.llmDetection.source).toBe('perplexity');
    
    // Verify database record
    const events = await supabase
      .from('llm_tracking_events')
      .select('*')
      .eq('id', data.eventId);
    
    expect(events.data).toHaveLength(1);
  });
});
```

### End-to-End Tests
```typescript
// e2e/llm-attribution.spec.ts
import { test, expect } from '@playwright/test';

test('LLM attribution flow', async ({ page }) => {
  // Simulate arriving from Perplexity
  await page.goto('/features?utm_source=perplexity&q=analytics%20tools');
  
  // Wait for tracking to fire
  await page.waitForTimeout(1000);
  
  // Navigate to dashboard
  await page.goto('/dashboard/llm-attribution');
  
  // Check that session appears
  await expect(page.locator('[data-testid=llm-sessions-count]')).toContainText('1');
  
  // Check source breakdown
  await expect(page.locator('[data-testid=perplexity-sessions]')).toContainText('1');
});
```

## Deployment & Monitoring

### Environment Variables
```bash
# .env.server (sensitive)
CLEARBIT_API_KEY=sk_xxxxx
APOLLO_API_KEY=xxxxx
FINGERPRINT_SECRET_KEY=xxxxx
HUBSPOT_API_TOKEN=pat-xxxxx

# .env.local (client-safe)
NEXT_PUBLIC_FINGERPRINT_API_KEY=xxxxx
NEXT_PUBLIC_LLM_TRACKING_ENDPOINT=/api/track/llm-attribution
```

### Monitoring & Alerts
```typescript
// src/lib/monitoring/llm-alerts.ts
export async function checkLLMPerformance() {
  const metrics = await gatherMetrics();
  
  // Alert on high-value leads
  if (metrics.highIntentLeads > 5) {
    await sendSlackAlert({
      channel: '#sales',
      message: `🔥 ${metrics.highIntentLeads} high-intent LLM leads in the last hour!`,
      leads: metrics.leadDetails
    });
  }
  
  // Alert on detection accuracy drops
  if (metrics.detectionAccuracy < 0.8) {
    await sendSlackAlert({
      channel: '#eng',
      message: `⚠️ LLM detection accuracy dropped to ${(metrics.detectionAccuracy * 100).toFixed(1)}%`,
    });
  }
  
  // Alert on enrichment costs
  if (metrics.enrichmentSpend > 1000) { // $10
    await sendSlackAlert({
      channel: '#ops',
      message: `💰 LLM enrichment costs: $${metrics.enrichmentSpend / 100} today`,
    });
  }
}
```

### Performance Optimization
```typescript
// src/lib/optimization/caching.ts
export class LLMCache {
  // Cache enrichment results by IP/24 for 24 hours
  static async cacheEnrichment(ipPrefix: string, data: EnrichmentData) {
    await redis.setex(`enrichment:${ipPrefix}`, 86400, JSON.stringify(data));
  }
  
  // Cache LLM detection results for common referrers
  static async cacheDetection(referrerHash: string, result: LLMDetectionResult) {
    await redis.setex(`detection:${referrerHash}`, 3600, JSON.stringify(result));
  }
}
```

## Success Metrics

### Key Performance Indicators
- **Detection Accuracy**: >85% of LLM traffic correctly identified
- **Enrichment Rate**: >70% of qualified traffic enriched with company data
- **Cost Efficiency**: <$2 cost per qualified lead
- **Time to Lead**: <5 minutes from visit to CRM sync
- **False Positive Rate**: <10% non-LLM traffic incorrectly tagged

### Business Impact
- **Lead Quality**: Average intent score >60
- **Sales Efficiency**: 40% faster lead qualification
- **Revenue Attribution**: $X pipeline attributed to LLM sources
- **Marketing ROI**: Measurable AEO/SEO impact on qualified leads

---

## Next Steps

1. **Review and approve** this implementation plan
2. **Set up development environment** with required API keys
3. **Create project board** with Phase 1 tasks
4. **Begin database schema** implementation
5. **Establish monitoring** and alert channels

This comprehensive implementation guide provides the foundation for building Split's LLM Lead Attribution feature. Each section can be expanded into detailed tickets and specifications as development progresses. 