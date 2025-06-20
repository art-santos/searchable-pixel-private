# PRD · **Split Leads v0.1**  
### "AI-attributed lead generation that costs 95% less than Clearbit"

---

## 1 · Executive Summary

Split Leads transforms anonymous website visitors into identified, enriched leads with a unique focus on **AI-attributed traffic**. By combining our existing AI crawler detection with real-time enrichment, we deliver verified decision-maker contacts for **< $0.04 per lead** – a 95% cost reduction compared to traditional providers.

**Key Innovation**: We're the only platform that tells you which leads discovered you through ChatGPT, Perplexity, or other AI systems.

---

## 2 · Problem Statement

### Current Market Pain Points

| Traditional Tools (Clearbit, RB2B, Warmly) | Split's Opportunity |
|-------------------------------------------|---------------------|
| **Stale Data**: 6-12 month old records | Real-time enrichment via web search |
| **High Cost**: $0.20-0.40 per contact | < $0.04 using IPInfo + Exa |
| **No AI Attribution**: Can't identify LLM traffic | Native AI detection already built |
| **Poor Deliverability**: < 30% email accuracy | Real-time SMTP verification |
| **Complex Setup**: Requires engineering resources | One-line script installation |

### Unique Value Proposition
"Know which companies AND which AI systems are discovering your content, then reach the right decision-makers instantly."

---

## 3 · Goals & Success Metrics

### 3.1 MVP Goals (Q1 2025)

| Goal | Target | Measurement |
|------|--------|-------------|
| **Coverage** | ≥ 60% of business IPs → enriched lead | `enriched_leads / business_visitors` |
| **Speed** | < 1 second P50 enrichment | Time from pixel fire to dashboard |
| **Cost** | ≤ $0.04 per enriched lead | Total API costs / leads generated |
| **Quality** | ≥ 40% email deliverability | SMTP verified / total emails |
| **Attribution** | 100% AI traffic flagged | AI-attributed leads / known AI visits |

### 3.2 Business Goals

- **New Revenue Stream**: $49-299/mo add-on to existing plans
- **Market Differentiation**: Only tool with AI attribution + lead gen
- **Customer Retention**: Increase LTV by 40% via add-on adoption

### 3.3 Out of Scope (MVP)

- Multi-contact enrichment per company
- Direct CRM integrations (use webhooks/Zapier)
- Lead scoring or predictive intent
- Custom enrichment sources beyond Exa
- Phone number enrichment

---

## 4 · User Personas & Jobs to be Done

### Primary Personas

| Persona | JTBD | Success Criteria |
|---------|------|------------------|
| **B2B Marketer** | "Show ROI from AI-driven content" | Can prove ChatGPT mentions → pipeline |
| **SDR/BDR** | "Find warm leads with context" | 2-click access to verified email + context |
| **Founder/Growth** | "Maximize limited budget" | 10x more leads for same spend as Clearbit |
| **RevOps** | "Automate lead routing" | API/webhook to push enriched leads |

### User Journey

```
1. Visitor reads blog → 2. ChatGPT cites content → 3. Reader visits site
→ 4. Split identifies company + AI source → 5. Enriches decision-maker
→ 6. SDR gets notification → 7. Personalized outreach mentioning AI discovery
```

---

## 5 · Feature Requirements

### 5.1 Data Collection Layer

| Component | Requirement | Technical Detail |
|-----------|-------------|------------------|
| **Pixel Enhancement** | Capture page, referrer, UTM params | Extend existing `/api/track/[workspaceId]/pixel.gif` |
| **AI Detection** | Flag LLM traffic in real-time | Use existing `ai-detection.ts` patterns |
| **IP Resolution** | Extract visitor IP reliably | Handle proxies, CloudFlare, X-Forwarded-For |
| **Privacy Compliance** | GDPR/CCPA compliant | Anonymous by default, enrichment opt-in |

### 5.2 Enrichment Pipeline

```
Step 1: IP → Company (150ms)
├─ Call IPInfo API ($0.0003)
├─ Validate: type == "business"
├─ Extract: name, domain, city, employees
└─ Fail fast if not business IP

Step 2: Company → Contact (400ms)
├─ Build Exa query with target titles
├─ Search LinkedIn profiles ($0.0055 per result)
├─ Fuzzy match job titles
└─ Return best match

Step 3: Contact → Email (300ms)
├─ Generate email patterns (5 common formats)
├─ SMTP verification ($0.002 per attempt)
├─ Stop at first verified email
└─ Cache domain patterns

Step 4: Contact → Context (optional, 250ms)
├─ Search for "public signals" (only if email verified)
├─ Recent posts, podcasts, news
├─ Max 5 results
└─ Store snippets
```

### 5.3 Query Intelligence

```javascript
// Exa Query Builder
const buildQuery = (company, titles, location) => {
  const normalizedTitles = titles.map(t => `"${normalizeTitle(t)}"`);
  const query = `site:linkedin.com/in/ (${normalizedTitles.join(' OR ')}) "${company}"`;
  
  if (location?.city) {
    query += ` "${location.city}"`;
  }
  
  // Exclude job postings
  query += ' -jobs -careers -hiring';
  
  return query;
};

// Title normalization map
const titleMap = {
  'cfo': 'Chief Financial Officer',
  'ceo': 'Chief Executive Officer',
  'vp sales': 'Vice President of Sales',
  'head of marketing': 'Head of Marketing'
};
```

### 5.4 Dashboard Requirements

| View | Features | User Actions |
|------|----------|--------------|
| **Leads Table** | • Company, contact, title, email<br>• AI source badge (ChatGPT/Perplexity)<br>• Verification status<br>• Visit timestamp<br>• Page visited | • Copy email<br>• View full profile<br>• Export CSV<br>• Add to list |
| **Lead Detail** | • Full enrichment data<br>• Public signals/context<br>• Visit history<br>• Similar companies | • Email templates<br>• Add notes<br>• Track outreach |
| **Settings** | • Target job titles<br>• Daily spend limit<br>• Email patterns<br>• Webhook config | • Add/remove titles<br>• Set budget alerts<br>• Test webhooks |

### 5.5 Filtering & Search

- **AI Attribution**: Show only ChatGPT/Perplexity/Claude referred
- **Verification**: Verified emails only
- **Recency**: Today, last 7 days, last 30 days
- **Company Size**: 1-50, 51-200, 201-1000, 1000+
- **Job Function**: Sales, Marketing, Engineering, Executive
- **Location**: Country, state, city filters

---

## 6 · Technical Architecture

### 6.1 Database Schema

```sql
-- Extend existing tables
ALTER TABLE visitor_events ADD COLUMN 
  enrichment_status text DEFAULT 'pending',
  enrichment_attempted_at timestamptz,
  enrichment_cost_cents integer DEFAULT 0;

-- New tables for leads
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  visitor_event_id uuid REFERENCES visitor_events(id),
  
  -- Company data from IPInfo
  company_name text NOT NULL,
  company_domain text,
  company_type text,
  company_city text,
  company_country text,
  employee_range text,
  
  -- Attribution
  is_ai_attributed boolean DEFAULT false,
  ai_source text, -- 'chatgpt', 'perplexity', 'claude', etc
  
  -- Enrichment meta
  exa_query text,
  enrichment_cost_cents integer,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  INDEX idx_leads_workspace_created (workspace_id, created_at DESC),
  INDEX idx_leads_ai_attributed (workspace_id, is_ai_attributed)
);

CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Contact info
  full_name text NOT NULL,
  job_title text,
  normalized_title text, -- For easier filtering
  linkedin_url text,
  
  -- Email data
  email text,
  email_pattern text, -- first.last, flast, etc
  email_status text, -- verified, risky, invalid, guessed
  email_verified_at timestamptz,
  
  -- Scoring
  title_match_score float, -- How well title matched search
  is_primary boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  
  signal_type text, -- article, podcast, social, news
  title text,
  url text,
  snippet text,
  published_at date,
  source text,
  
  created_at timestamptz DEFAULT now()
);

-- Workspace settings for leads
CREATE TABLE lead_enrichment_settings (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id),
  
  is_enabled boolean DEFAULT false,
  target_titles text[], -- Array of job titles to search
  daily_spend_limit_cents integer DEFAULT 100, -- $1 default
  
  -- Email patterns to try for this workspace's domain
  email_patterns text[] DEFAULT ARRAY['first.last', 'flast', 'first'],
  
  -- Webhooks
  webhook_url text,
  webhook_secret text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Track daily spend
CREATE TABLE lead_enrichment_usage (
  workspace_id uuid NOT NULL,
  date date NOT NULL,
  
  enrichment_attempts integer DEFAULT 0,
  enrichment_successes integer DEFAULT 0,
  total_cost_cents integer DEFAULT 0,
  
  PRIMARY KEY (workspace_id, date)
);
```

### 6.2 API Endpoints

```typescript
// New API routes
POST   /api/leads/settings          // Configure enrichment settings
GET    /api/leads                   // List enriched leads with filters
GET    /api/leads/:id               // Get lead details + signals
POST   /api/leads/:id/enrich        // Manual re-enrichment
DELETE /api/leads/:id               // GDPR deletion
GET    /api/leads/export            // CSV export
POST   /api/leads/webhook-test      // Test webhook configuration

// Extend existing
PATCH  /api/track/[workspaceId]/pixel.gif  // Add enrichment trigger
```

### 6.3 Exa API Integration

#### Endpoints & Queries

**Primary Contact Search**:
```http
POST https://api.exa.ai/search
Authorization: Bearer <EXA_API_KEY>

{
  "query": "site:linkedin.com/in OR site:linkedin.com/pub (CFO OR \"Chief Financial Officer\") \"Google LLC\" \"Mountain View\" -jobs -careers",
  "numResults": 6,
  "includeDomains": ["linkedin.com"],
  "useAutoprompt": false
}
```

**Public Signals Search**:
```http
POST https://api.exa.ai/search
Authorization: Bearer <EXA_API_KEY>

{
  "query": "\"Ruth Porat\" \"Google\" podcast OR interview OR keynote OR blog",
  "numResults": 5,
  "excludeDomains": ["linkedin.com"],
  "newsBoost": true
}
```

#### Cost Optimization

| Step | Credits | Original Cost | Optimized Cost |
|------|---------|---------------|----------------|
| LinkedIn search | 6 (was 10) | $0.055 | $0.033 |
| Public signals | 5 | $0.028 | $0.028* |
| Email verify | 0 | $0.002 | $0.002 |
| **Total** | **6-11** | **$0.085** | **$0.035** |

*Only runs if email verifies

#### Query Construction

```typescript
function buildLinkedInQuery(company: string, titles: string[], city?: string): string {
  const expandedTitles = titles.flatMap(title => [
    `"${normalizeTitle(title)}"`,
    title.replace(/Chief|Officer/g, '').trim() // CFO from Chief Financial Officer
  ]);
  
  let query = `site:linkedin.com/in (${expandedTitles.join(' OR ')}) "${company}"`;
  if (city) query += ` "${city}"`;
  query += ' -jobs -careers -hiring';
  
  return query;
}

const titleNormalizations = {
  'cfo': 'Chief Financial Officer',
  'ceo': 'Chief Executive Officer', 
  'vp sales': 'Vice President of Sales'
};
```

### 6.4 Enrichment Worker

```typescript
// Queued job processor
class LeadEnrichmentWorker {
  private exaClient: ExaClient;
  private ipinfoClient: IPInfoClient;
  private emailVerifier: EmailVerifier;
  
  async process(job: EnrichmentJob) {
    // Check daily budget (estimated 6-11 credits = $0.033-0.061)
    const estimatedCost = 0.04; // Conservative estimate
    if (!(await this.checkDailyBudget(job.workspaceId, estimatedCost))) {
      return this.skipWithReason('daily_limit_exceeded');
    }
    
    // Step 1: IP → Company (IPInfo: $0.0025)
    const company = await this.ipinfoClient.lookup(job.ipAddress);
    if (!company || company.type !== 'business') {
      return this.skipWithReason('not_business_ip');
    }
    
    // Step 2: Check cache first
    const cached = await this.getCachedContact(company.name, job.workspaceId);
    if (cached) {
      return this.returnCachedLead(cached, job);
    }
    
    // Step 3: Search LinkedIn (Exa: 6 credits = $0.033)
    const settings = await this.getWorkspaceSettings(job.workspaceId);
    const linkedinResults = await this.exaClient.searchContacts({
      company: company.name,
      titles: settings.targetTitles,
      city: company.city
    });
    
    if (!linkedinResults.length) {
      return this.skipWithReason('no_contacts_found');
    }
    
    // Step 4: Parse and score contacts
    const contacts = this.parseLinkedInResults(linkedinResults, settings.targetTitles);
    const bestContact = contacts[0]; // Highest title match score
    
    if (!bestContact || bestContact.titleMatchScore < 0.3) {
      return this.skipWithReason('low_match_quality');
    }
    
    // Step 5: Generate and verify email ($0.002)
    const emailCandidates = this.generateEmailPatterns(bestContact.name, company.domain);
    const verifiedEmail = await this.emailVerifier.verifyBest(emailCandidates);
    
    // Step 6: Get public signals only if email verified (Exa: 5 credits = $0.028)
    let signals = [];
    if (verifiedEmail?.status === 'verified') {
      signals = await this.exaClient.searchPublicSignals(
        bestContact.name, 
        company.name
      );
    }
    
    // Step 7: Store lead
    const lead = await this.storeLead({
      workspaceId: job.workspaceId,
      visitorEventId: job.visitorEventId,
      company,
      contact: { ...bestContact, email: verifiedEmail },
      signals,
      isAiAttributed: this.detectAISource(job.referrer, job.userAgent),
      totalCostCents: this.calculateActualCost()
    });
    
    // Step 8: Cache successful result
    await this.setCachedContact(company.name, job.workspaceId, lead);
    
    // Step 9: Trigger webhook
    if (settings.webhookUrl) {
      await this.triggerWebhook(settings.webhookUrl, lead);
    }
    
    return lead;
  }
  
  private async checkDailyBudget(workspaceId: string, estimatedCost: number): Promise<boolean> {
    const usage = await this.getDailyUsage(workspaceId);
    const settings = await this.getWorkspaceSettings(workspaceId);
    const estimatedCostCents = Math.round(estimatedCost * 100);
    
    return (usage.totalCostCents + estimatedCostCents) <= settings.dailySpendLimitCents;
  }
}
```

#### Rate Limiting & Error Handling

```typescript
class ExaRateLimiter {
  private requestsPerSecond = 5; // Exa limit
  private lastRequestTime = 0;
  
  async processRequest<T>(request: () => Promise<T>): Promise<T> {
    // Ensure 200ms between requests (5/sec = 200ms)
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 200) {
      await this.delay(200 - timeSinceLastRequest);
    }
    
    try {
      const result = await request();
      this.lastRequestTime = Date.now();
      return result;
    } catch (error) {
      if (error.status === 429) {
        // Exponential backoff: 500ms, 1s, 2s
        const delay = Math.pow(2, attempt) * 500;
        await this.delay(delay);
        return this.processRequest(request); // Retry
      }
      throw error;
    }
  }
}
```

### 6.5 Response Parsing & Email Generation

#### LinkedIn Profile Parser

```typescript
interface LinkedInContact {
  name: string;
  title: string;
  linkedinUrl: string;
  titleMatchScore: number;
}

function parseLinkedInResults(
  results: ExaSearchResult[], 
  targetTitles: string[]
): LinkedInContact[] {
  return results
    .map(result => {
      const contact = parseLinkedInProfile(result);
      contact.titleMatchScore = calculateTitleMatch(contact.title, targetTitles);
      return contact;
    })
    .filter(contact => contact.titleMatchScore > 0.3) // Minimum relevance
    .sort((a, b) => b.titleMatchScore - a.titleMatchScore);
}

function parseLinkedInProfile(result: ExaSearchResult): LinkedInContact {
  // Extract name and title from LinkedIn URL and title
  const nameMatch = result.url.match(/linkedin\.com\/in\/([^\/]+)/);
  const titleMatch = result.title.match(/^([^–-]+)[–-]\s*(.+)$/);
  
  return {
    name: titleMatch?.[1]?.trim() || nameMatch?.[1]?.replace(/-/g, ' ') || '',
    title: titleMatch?.[2]?.trim() || '',
    linkedinUrl: result.url,
    titleMatchScore: 0 // Will be calculated separately
  };
}
```

#### Email Pattern Generation

```typescript
function generateEmailPatterns(fullName: string, domain: string): string[] {
  const names = parseFullName(fullName);
  if (!names.first || !names.last) return [];
  
  const patterns = [
    `${names.first}.${names.last}@${domain}`,           // first.last@domain.com (35% success)
    `${names.first}@${domain}`,                         // first@domain.com (24% success)
    `${names.first[0]}${names.last}@${domain}`,         // flast@domain.com (15% success)
    `${names.last}@${domain}`,                          // last@domain.com (10% success)
    `${names.first}${names.last}@${domain}`             // firstlast@domain.com (10% success)
  ];
  
  return patterns.map(email => email.toLowerCase());
}

function parseFullName(fullName: string): { first: string; last: string } {
  const cleaned = fullName.replace(/[^\w\s]/g, '').trim();
  const parts = cleaned.split(/\s+/);
  
  return {
    first: parts[0] || '',
    last: parts[parts.length - 1] || ''
  };
}
```

### 6.6 Caching & Budget Enforcement

#### 12-Hour Contact Caching

```typescript
const CACHE_TTL = 12 * 60 * 60; // 12 hours

async function getCachedContact(
  companyName: string, 
  workspaceId: string
): Promise<CachedLead | null> {
  const cacheKey = `lead:${companyName}:${workspaceId}`;
  const cached = await redis.get(cacheKey);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedContact(
  companyName: string,
  workspaceId: string,
  lead: Lead
): Promise<void> {
  const cacheKey = `lead:${companyName}:${workspaceId}`;
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify({
    leadId: lead.id,
    contact: lead.contact,
    createdAt: lead.createdAt
  }));
}
```

#### Budget Monitoring

```typescript
async function checkDailyBudget(workspaceId: string, estimatedCost: number): Promise<boolean> {
  const { data: usage } = await supabase
    .from('lead_enrichment_usage')
    .select('total_cost_cents')
    .eq('workspace_id', workspaceId)
    .eq('date', new Date().toISOString().split('T')[0])
    .single();
  
  const { data: settings } = await supabase
    .from('lead_enrichment_settings')
    .select('daily_spend_limit_cents')
    .eq('workspace_id', workspaceId)
    .single();
  
  const currentSpend = usage?.total_cost_cents || 0;
  const dailyLimit = settings?.daily_spend_limit_cents || 100; // $1 default
  const estimatedCostCents = Math.round(estimatedCost * 100);
  
  // Alert at 80% of budget
  if ((currentSpend + estimatedCostCents) > dailyLimit * 0.8) {
    await sendBudgetAlert(workspaceId, currentSpend, dailyLimit);
  }
  
  return (currentSpend + estimatedCostCents) <= dailyLimit;
}

const COSTS = {
  ipinfo: 0.0003,    // $0.0003 per lookup (IPinfo Core plan)
  exa: 0.0055,       // $0.0055 per result
  emailVerify: 0.002 // $0.002 per verification
};

function calculateActualCost(steps: EnrichmentSteps): number {
  let cost = COSTS.ipinfo; // Always charge for IP lookup
  
  if (steps.exaLinkedInResults) {
    cost += COSTS.exa * steps.exaLinkedInResults; // 6 results = $0.033
  }
  
  if (steps.exaSignalsResults) {
    cost += COSTS.exa * steps.exaSignalsResults; // 5 results = $0.028
  }
  
  if (steps.emailVerifications) {
    cost += COSTS.emailVerify * steps.emailVerifications; // Usually 1-3 attempts
  }
  
  return Math.round(cost * 10000) / 100; // Return cents
}
```

---

## 7 · Pricing & Packaging

### 7.1 Pricing Tiers

| Plan | Monthly Price | Included Leads | Overage Rate | Features |
|------|---------------|----------------|--------------|----------|
| **Starter** | $49 | 500 leads | $0.08/lead | Basic enrichment, CSV export |
| **Growth** | $149 | 2,500 leads | $0.06/lead | + Webhooks, API access |
| **Scale** | $299 | 10,000 leads | $0.04/lead | + Priority processing, custom fields |

### 7.2 Cost Analysis

```
Our cost per lead: ~$0.01 (average)
- IPInfo: $0.0025
- Exa: $0.0055
- Email: $0.002

Competitor pricing:
- Clearbit: $0.20-0.40/contact
- Apollo: $0.15-0.30/contact  
- RB2B: $250-1000/mo flat rate

Our margin at $0.04-0.08: 75-87%
```

---

## 8 · Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Database migrations
- [ ] IPInfo integration
- [ ] Exa client with retry logic
- [ ] Basic enrichment pipeline
- [ ] Cost tracking system

### Phase 2: Enrichment (Week 3-4)
- [ ] Email pattern generation
- [ ] SMTP verification service
- [ ] Query optimization
- [ ] Public signals collection
- [ ] Webhook system

### Phase 3: Dashboard (Week 5-6)
- [ ] Leads table view
- [ ] Lead detail pages
- [ ] Settings interface
- [ ] Export functionality
- [ ] Real-time notifications

### Phase 4: Polish (Week 7-8)
- [ ] Performance optimization
- [ ] Error handling
- [ ] Usage analytics
- [ ] Documentation
- [ ] Onboarding flow

### Phase 5: Launch (Week 9-10)
- [ ] Beta with 5 customers
- [ ] Pricing page update
- [ ] Marketing site updates
- [ ] Launch campaign
- [ ] Customer success docs

---

## 9 · Success Metrics & KPIs

### Technical Metrics
- **Enrichment Rate**: 60%+ of business IPs enriched
- **Processing Time**: < 1s P50, < 3s P95
- **Email Accuracy**: 40%+ verified deliverable
- **System Uptime**: 99.9%
- **API Success Rate**: > 95%

### Business Metrics
- **Adoption**: 30% of active workspaces enable within 3 months
- **Revenue**: $50K MRR within 6 months
- **Retention**: < 5% monthly churn on Leads product
- **COGS**: < 25% of revenue

---

## 10 · Critical Path to First Demo

### Shortest Path to "First Lead in UI" (1 Week)

Focus on these 5 deliverables for the fastest working demo:

| # | Deliverable | Owner | Notes |
|---|-------------|--------|-------|
| 1 | `ipinfoClient.lookup()` returns `{name, domain, city}` in <150ms | Backend | Fail fast if `type !== "business"` |
| 2 | Exa LinkedIn search wrapper (`searchContacts()`) | Backend | Hard-code `numResults = 6`, `titles = ['CFO','CEO']` |
| 3 | `generateEmailPatterns()` + single MX ping | Backend | Use smtp-verify/neverbounce free tier |
| 4 | `POST /api/leads/enrichNow` endpoint | API | Takes `visitorEventId`, returns JSON lead |
| 5 | Simple React table that calls endpoint | Frontend | Dumps JSON for now - no UI polish |

### Implementation Code Stubs

**Exa Client** (`/lib/exa.ts`):
```typescript
// 40 lines total
export async function searchLinkedIn(company: string, titles: string[], city?: string) {
  const query = [
    'site:linkedin.com/in OR site:linkedin.com/pub',
    '(' + titles.map(t => `"${t}"`).join(' OR ') + ')',
    `"${company}"`,
    city ? `"${city}"` : '',
    '-jobs -careers -hiring'
  ].join(' ');
  
  const { data } = await axios.post(
    'https://api.exa.ai/search',
    { query, numResults: 6, includeDomains: ['linkedin.com'] },
    { headers: { 'Authorization': `Bearer ${process.env.EXA_API_KEY}` } }
  );
  return data.results;            // [{url,title,text,...}]
}
```

**Enrichment Worker** (`/jobs/enrich.ts`):
```typescript
// Skeleton worker
export async function enrich(visitor: VisitorEvent) {
  const ip = visitor.ip_address;
  const ipInfo = await ipinfo(ip);
  if (ipInfo.type !== 'business') return { status: 'skip_isp' };
  
  const results = await searchLinkedIn(ipInfo.org, TARGET_TITLES, ipInfo.city);
  if (!results.length) return { status: 'no_contact' };

  const contact = parseLinkedIn(results[0]);
  const emails  = patterns(contact, ipInfo.domain);
  const verified = await verifyFirst(emails);
  if (!verified) return { status: 'email_fail' };
  
  return saveLead({ visitor, ipInfo, contact: { ...contact, email: verified } });
}
```

**These two files + a POST route will give you your first lead.**

### What to Build After Demo

1. Budget watchdog & alerts
2. Public-signals secondary query  
3. UI polish & filters
4. Spend caps / per-workspace settings
5. Webhook / Zapier integration

**Bottom Line**: Ship the 5-item critical chain first to get the "A-ha!" moment working. Everything else is either guard-rails or growth features that can be layered on once the core value is proven.
- **NPS**: > 50 from Leads users

### Usage Patterns to Track
- Most searched job titles
- AI vs non-AI lead conversion rates
- Time from enrichment to outreach
- Export frequency
- Webhook adoption

---

## 10 · Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Exa API limits** | High | Implement caching, batch similar queries |
| **Email deliverability** | Medium | Multiple verification services, domain reputation monitoring |
| **GDPR compliance** | High | Opt-in enrichment, 30-day auto-deletion, clear privacy policy |
| **Budget overruns** | Medium | Hard caps, alerts at 80%, graceful degradation |
| **Competitor response** | Low | Focus on AI attribution moat, rapid iteration |

---

## 11 · Open Questions

1. Should we offer historical enrichment of past visitors?
2. Multi-contact enrichment as immediate upsell?
3. Build vs buy email verification service?
4. How to handle international title variations?
5. Integration priority: Salesforce, HubSpot, or API-first?

---

## 12 · Appendix

### A. Example Exa Queries

```
// Executive search
site:linkedin.com/in/ ("Chief Executive Officer" OR "CEO" OR "Founder") "Acme Corp" "San Francisco" -jobs

// Marketing leaders  
site:linkedin.com/in/ ("CMO" OR "VP Marketing" OR "Head of Marketing") "TechCo" -careers

// Engineering contacts
site:linkedin.com/in/ ("CTO" OR "VP Engineering" OR "Director of Engineering") "StartupXYZ"
```

### B. Email Pattern Priority

1. `first.last@domain.com` (35% success)
2. `flast@domain.com` (20% success)
3. `first@domain.com` (15% success)
4. `last@domain.com` (10% success)
5. `firstlast@domain.com` (10% success)

### C. AI Source Detection

```javascript
const AI_SOURCES = {
  'chatgpt': ['chat.openai.com', 'chatgpt.com'],
  'perplexity': ['perplexity.ai'],
  'claude': ['claude.ai'],
  'bard': ['bard.google.com'],
  'you': ['you.com'],
  'phind': ['phind.com']
};
```

---

*Last Updated: December 2024*  
*Owner: Product Team*  
*Status: In Development* 