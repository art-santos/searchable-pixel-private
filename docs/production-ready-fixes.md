# Production-Ready Fixes for Link Audit MVP

## 🚨 Critical Issues & Solutions

### 1. Queue Race Conditions
**Problem**: Multiple edge functions could process the same task.

**Solution**: Atomic locking with SQL function
```sql
CREATE OR REPLACE FUNCTION claim_next_snapshot(worker_id TEXT)
RETURNS TABLE(id UUID, urls TEXT[], topic TEXT) AS $$
BEGIN
  RETURN QUERY
  UPDATE snapshot_requests 
  SET locked_at = NOW(), locked_by = worker_id, status = 'processing'
  WHERE id = (
    SELECT r.id FROM snapshot_requests r
    WHERE r.status = 'pending' 
    ORDER BY r.created_at ASC
    LIMIT 1 FOR UPDATE SKIP LOCKED
  )
  RETURNING snapshot_requests.id, snapshot_requests.urls, snapshot_requests.topic;
END;
$$ LANGUAGE plpgsql;
```

### 2. Improved LLM Prompting
**Problem**: Token overflow and regex issues in string replacement.

**Solution**: System/user message structure + safer templating
```typescript
const VISIBILITY_SYSTEM = `Test domain visibility in AI recommendations objectively.`;

const VISIBILITY_USER = `Question: "${question}"
Target: ${targetDomain}

Answer naturally, then analyze:
TARGET_FOUND: Yes/No
POSITION: [1st/2nd/etc]  
OTHER_DOMAINS: [list]
REASONING: [brief explanation]`;

// Safe string replacement
function createPrompt(question: string, domain: string): string {
  return VISIBILITY_USER
    .replace('${question}', question.replace(/"/g, '\\"'))
    .replace('${targetDomain}', domain);
}
```

### 3. Immediate Processing + Cron Fallback
**Problem**: 10-second cron delay feels slow.

**Solution**: Trigger immediately, cron as backup
```typescript
export async function POST(request: Request) {
  // ... enqueue logic ...
  
  // Immediate trigger
  try {
    await supabase.functions.invoke('process-snapshots');
  } catch (e) {
    console.log('Immediate failed, cron will handle');
  }
  
  return Response.json({ requestId, estimatedTime: '1-2 minutes' });
}
```

### 4. Smart Scoring Adjustments
**Problem**: Internal links scoring doesn't account for page size/spam.

**Solution**: Context-aware scoring
```typescript
function calculateInternalLinksScore(linkCount: number, pageWordCount?: number): number {
  if (!pageWordCount) return Math.min(linkCount / 2, 10); // Fallback
  
  const linkDensity = linkCount / (pageWordCount / 100); // Links per 100 words
  if (linkDensity > 5) return 0; // Likely spam
  if (linkDensity < 0.5) return 2; // Too few
  return Math.min(linkDensity * 2, 10); // Sweet spot: 1-2 links per 100 words
}
```

### 5. User Expectation Management
**Problem**: Users blame technical SEO for low AI visibility.

**Solution**: Clear messaging about AI bias
```typescript
function generateInsights(mentions: number, total: number): string[] {
  const insights = [];
  
  if (mentions === 0) {
    insights.push("Your brand wasn't mentioned in AI responses");
    insights.push("⚠️ This is normal for newer sites - AI favors established brands");
    insights.push("💡 Focus on building domain authority and unique content");
  }
  
  return insights;
}
```

## 🎯 MVP Prioritization

### Phase 1 (Launch in 4 weeks)
**Scope**: Snapshot visibility testing only
- URLs + topic input
- Question generation
- Visibility testing  
- Competitive analysis
- Skip Firecrawl technical audits

### Phase 2 (Post-launch)
- Add technical SEO audits
- Historical tracking
- Bulk processing
- API access

## 🛡️ Risk Mitigation

### Rate Limiting
```typescript
const RATE_LIMITS = {
  FREE: { requests: 5, period: 'hour' },
  PRO: { requests: 50, period: 'hour' }
};

async function checkRateLimit(userId: string, tier: string): Promise<boolean> {
  const limit = RATE_LIMITS[tier];
  const recent = await supabase
    .from('snapshot_requests')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000))
    .limit(limit.requests + 1);
    
  return recent.data?.length <= limit.requests;
}
```

### Cost Protection
```typescript
const DAILY_BUDGET = 50; // $50/day limit

async function checkBudget(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const usage = await redis.get(`budget:${today}`);
  return (usage || 0) < DAILY_BUDGET;
}
```

### Storage Optimization
```typescript
// Store only essential data, not full LLM responses
interface VisibilityResult {
  target_found: boolean;
  position: number | null;
  cited_domains: string[];
  reasoning_summary: string; // Max 200 chars
  // Skip raw_response to save space
}
```

This addresses all the production concerns while keeping scope manageable for MVP launch. 