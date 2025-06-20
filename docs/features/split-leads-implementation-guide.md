# Split Leads Implementation Guide

## Quick Start

This guide covers the technical implementation of Split Leads, our AI-attributed lead generation feature.

## Attribution Flow & Data Sources

### Key Distinction: Crawlers vs Human Visitors

**AI Crawlers** (`crawler_visits` table):
- ChatGPT, Perplexity, Claude bots crawling content
- Cannot be enriched into leads (no human decision-maker)
- Used for content intelligence and attribution tracking

**Human Visitors** (`user_visits` table - NEW):
- Real people visiting after discovering content through AI
- Can be enriched into leads with company + contact info
- Tagged as AI-attributed via UTM parameters

### Attribution Logic

```typescript
// AI Attribution Detection
function detectAIAttribution(visit: UserVisit): boolean {
  const aiSources = ['chatgpt', 'perplexity', 'claude', 'copilot'];
  const aiMediums = ['ai', 'llm', 'chatbot'];
  
  return (
    aiSources.includes(visit.utm_source?.toLowerCase()) ||
    aiMediums.includes(visit.utm_medium?.toLowerCase()) ||
    visit.referrer?.includes('chat.openai.com') ||
    visit.referrer?.includes('perplexity.ai')
  );
}
```

### Data Flow

1. **AI Crawler** visits → Stored in `crawler_visits` (existing)
2. **Human** visits with `?utm_source=chatgpt` → Stored in `user_visits` (new)
3. **Enrichment** triggered on `user_visits` → Creates `leads` with `is_ai_attributed=true`

## Prerequisites

- [ ] IPInfo API key ($0.0025/lookup)
- [ ] Exa API key ($0.0055/search) 
- [ ] Email verification service (or build SMTP checker)
- [ ] Queue system (Bull/BullMQ recommended)
- [ ] Supabase database access

## Environment Variables

```env
# Add to .env.server
IPINFO_TOKEN=your_key_here
EXA_API_KEY=your_key_here
EMAIL_VERIFY_API_KEY=your_key_here
REDIS_URL=redis://localhost:6379
```

## Database Setup

Run the migrations in order:

```bash
# 1. Core tables
pnpm supabase migration new split_leads_core

# 2. Indexes and functions
pnpm supabase migration new split_leads_indexes

# 3. RLS policies
pnpm supabase migration new split_leads_rls
```

## Implementation Steps

### 1. Extend Tracking Pixel (Day 1)

```typescript
// src/app/api/track/[workspaceId]/pixel.gif/route.ts
// Add to existing pixel handler:

if (shouldEnrichLead(workspace, ipAddress)) {
  await queueEnrichmentJob({
    workspaceId,
    visitorEventId,
    ipAddress,
    pageUrl,
    referrer,
    userAgent
  });
}
```

### 2. IPInfo Integration (Day 2)

```typescript
// src/lib/enrichment/ipinfo.ts
export class IPInfoClient {
  async lookup(ip: string): Promise<CompanyInfo | null> {
    const response = await fetch(
      `https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`
    );
    
    const data = await response.json();
    
    if (data.company?.type === 'business') {
      return {
        name: data.company.name,
        domain: data.company.domain,
        city: data.city,
        country: data.country,
        employeeRange: this.parseEmployeeRange(data.asn)
      };
    }
    
    return null;
  }
}
```

### 3. Exa Search Client (Day 3-4)

```typescript
// src/lib/enrichment/exa.ts
export class ExaClient {
  async searchContacts(
    company: string, 
    titles: string[], 
    location?: string
  ): Promise<Contact[]> {
    const query = this.buildQuery(company, titles, location);
    
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        numResults: 20,
        includeDomains: ['linkedin.com']
      })
    });
    
    return this.parseLinkedInProfiles(response);
  }
}
```

### 4. Email Verification (Day 5)

```typescript
// src/lib/enrichment/email-verify.ts
export class EmailVerifier {
  async verify(email: string): Promise<EmailStatus> {
    // Option 1: Use service like Reacher.email
    // Option 2: Build SMTP checker
    
    try {
      const mx = await this.checkMX(domain);
      const smtp = await this.checkSMTP(email);
      
      return {
        email,
        status: smtp.valid ? 'verified' : 'invalid',
        pattern: this.detectPattern(email)
      };
    } catch (error) {
      return { email, status: 'risky' };
    }
  }
}
```

### 5. Queue Worker (Day 6-7)

```typescript
// src/workers/lead-enrichment.ts
import { Queue, Worker } from 'bullmq';

const enrichmentQueue = new Queue('lead-enrichment', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
});

const worker = new Worker('lead-enrichment', async (job) => {
  const { workspaceId, ipAddress, visitorEventId } = job.data;
  
  // Check budget
  const usage = await getWorkspaceUsageToday(workspaceId);
  if (usage.cost > usage.limit) {
    return { skipped: true, reason: 'budget_exceeded' };
  }
  
  // Run enrichment pipeline
  const company = await ipinfo.lookup(ipAddress);
  if (!company) return { skipped: true, reason: 'not_business' };
  
  const contacts = await exa.searchContacts(
    company.name,
    workspace.targetTitles,
    company.city
  );
  
  // Store results
  const lead = await createLead({ company, contacts, visitor });
  
  // Trigger webhook
  if (workspace.webhookUrl) {
    await triggerWebhook(workspace.webhookUrl, lead);
  }
  
  return { leadId: lead.id };
}, {
  connection: redis,
  concurrency: 10
});
```

### 6. Dashboard Components (Day 8-10)

```tsx
// src/app/dashboard/leads/page.tsx
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filters, setFilters] = useState({
    aiOnly: false,
    verifiedOnly: false,
    dateRange: 'last7days'
  });
  
  return (
    <div>
      <LeadsFilters onChange={setFilters} />
      <LeadsTable 
        leads={leads} 
        onExport={handleExport}
        onEmailCopy={handleEmailCopy}
      />
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
- Query builder logic
- Email pattern generation
- Title normalization
- Cost calculations

### Integration Tests
- IPInfo API responses
- Exa search results
- Email verification flow
- Webhook delivery

### Load Tests
- Queue processing at 1000 leads/minute
- Dashboard performance with 100k leads
- API rate limit handling

## Monitoring & Alerts

```typescript
// Key metrics to track
const metrics = {
  enrichmentRate: enriched / totalBusinessVisitors,
  emailDeliverability: verified / totalEmails,
  costPerLead: totalCost / enrichedLeads,
  p50ProcessingTime: percentile(processingTimes, 50),
  dailyBudgetUsage: todaySpend / dailyLimit
};

// Alert conditions
if (metrics.dailyBudgetUsage > 0.8) {
  sendSlackAlert('80% of daily budget used');
}
```

## Security Considerations

1. **API Key Storage**: Use environment variables, never commit
2. **Rate Limiting**: Implement per-workspace limits
3. **Data Retention**: Auto-delete after 90 days
4. **GDPR Compliance**: Allow instant deletion
5. **Webhook Security**: HMAC signature verification

## Performance Optimizations

1. **Caching**:
   - Cache IPInfo lookups for 24 hours
   - Cache email patterns per domain
   - Cache Exa results for duplicate queries

2. **Batching**:
   - Batch similar Exa queries
   - Bulk email verification
   - Batch database inserts

3. **Async Processing**:
   - Non-blocking enrichment
   - Webhook delivery in background
   - Lazy load public signals

## Rollout Plan

### Week 1: Shadow Mode
- Run enrichment without showing in UI
- Compare results with manual research
- Tune query parameters

### Week 2: Beta Users
- Enable for 5 selected customers
- Daily check-ins for feedback
- Monitor cost per lead closely

### Week 3: Soft Launch
- Enable for all Pro/Team plans
- Feature flag controlled
- Monitor system load

### Week 4: GA
- Update pricing page
- Launch email campaign
- Enable for all plans

## Support Documentation

Create help articles for:
- "Getting Started with Split Leads"
- "Understanding AI Attribution"
- "Setting Up Lead Webhooks"
- "Optimizing Target Titles"
- "Lead Enrichment Best Practices"

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Low enrichment rate | Broaden job title search terms |
| High costs | Implement stricter business IP filtering |
| Slow processing | Increase worker concurrency |
| Low email deliverability | Try additional email patterns |
| Webhook failures | Add retry logic with backoff |

---

*For questions, reach out in #split-leads-dev channel* 