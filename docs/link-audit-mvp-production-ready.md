# Link Audit MVP - Production Ready Implementation

## MVP Scope (Phase 1)
**Focus**: Snapshot-based visibility testing only. Skip Firecrawl technical audits for Phase 2.

### Why This Scope?
- **Faster to build**: No complex scraping logic
- **More magical UX**: Instant visibility insights
- **Lower risk**: Fewer external dependencies
- **Better feedback loop**: Users see immediate value

## 1. Simplified Architecture

### Core Components
- **Input**: URLs + user-defined topic
- **Processing**: Question generation → Visibility testing  
- **Output**: Visibility score + competitive analysis

### Required Environment Variables
```env
OPENAI_API_KEY=your_openai_key
PERPLEXITY_API_KEY=your_perplexity_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Schema (Simplified)
```sql
-- Main snapshot requests
CREATE TABLE snapshot_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  urls TEXT[] NOT NULL, -- Store multiple URLs as array
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  locked_at TIMESTAMP WITH TIME ZONE, -- Prevent race conditions
  locked_by TEXT, -- Function instance ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Generated questions (reusable across URLs)
CREATE TABLE snapshot_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES snapshot_requests(id),
  question TEXT NOT NULL,
  question_number INTEGER NOT NULL
);

-- Visibility test results
CREATE TABLE visibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES snapshot_requests(id),
  url TEXT NOT NULL,
  question_id UUID REFERENCES snapshot_questions(id),
  target_found BOOLEAN NOT NULL,
  position INTEGER,
  cited_domains TEXT[],
  reasoning_summary TEXT, -- Only key insights, not full response
  raw_citations JSONB, -- Store Perplexity citations array
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Final snapshot summary
CREATE TABLE snapshot_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES snapshot_requests(id),
  url TEXT NOT NULL,
  visibility_score INTEGER NOT NULL, -- 0-100
  mentions_count INTEGER NOT NULL, -- X out of 5 questions
  top_competitors TEXT[],
  key_insights TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 2. Queue Processing (Production Safe)

### Atomic Queue Locking
```typescript
// Prevent race conditions with atomic locking
async function claimNextSnapshot(): Promise<SnapshotRequest | null> {
  const functionId = `worker-${Date.now()}-${Math.random()}`;
  
  const { data, error } = await supabase
    .rpc('claim_next_snapshot', { 
      worker_id: functionId,
      lock_timeout_minutes: 10 
    });
    
  return data?.[0] || null;
}

-- SQL function for atomic claiming
CREATE OR REPLACE FUNCTION claim_next_snapshot(worker_id TEXT, lock_timeout_minutes INTEGER)
RETURNS TABLE(id UUID, urls TEXT[], topic TEXT) AS $$
BEGIN
  RETURN QUERY
  UPDATE snapshot_requests 
  SET 
    locked_at = NOW(),
    locked_by = worker_id,
    status = 'processing'
  WHERE id = (
    SELECT r.id 
    FROM snapshot_requests r
    WHERE r.status = 'pending' 
       OR (r.locked_at < NOW() - INTERVAL '1 minute' * lock_timeout_minutes)
    ORDER BY r.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING snapshot_requests.id, snapshot_requests.urls, snapshot_requests.topic;
END;
$$ LANGUAGE plpgsql;
```

### Immediate + Fallback Processing
```typescript
// API route with immediate trigger + cron fallback
export async function POST(request: Request) {
  const { urls, topic } = await request.json();
  
  // Validation
  if (!topic || !urls?.length) {
    return Response.json({ error: 'Topic and URLs required' }, { status: 400 });
  }
  
  if (urls.length > 10) {
    return Response.json({ error: 'Max 10 URLs per request' }, { status: 400 });
  }
  
  // Rate limiting per user
  const recentRequests = await checkUserRateLimit(user.id);
  if (recentRequests > 5) {
    return Response.json({ error: 'Rate limit: 5 requests per hour' }, { status: 429 });
  }
  
  // Enqueue request
  const { data: request } = await supabase
    .from('snapshot_requests')
    .insert({
      user_id: user.id,
      urls: urls.slice(0, 10),
      topic: topic.trim(),
      status: 'pending'
    })
    .select()
    .single();
    
  // Immediate processing attempt
  try {
    await supabase.functions.invoke('process-snapshots', { 
      body: { immediate: true }
    });
  } catch (error) {
    console.log('Immediate processing failed, cron will pick up:', error);
  }
  
  return Response.json({ 
    requestId: request.id,
    status: 'queued',
    estimatedTime: '2-3 minutes' 
  });
}
```

## 3. Robust LLM Implementation

### Enhanced Question Generation
```typescript
const QUESTION_GENERATOR_SYSTEM = `You create realistic user questions for AI assistants based on topics. Focus on recommendation/comparison scenarios that would surface product mentions.`;

const QUESTION_GENERATOR_USER = `Topic: "${topic}"

Generate exactly 5 questions that users might ask ChatGPT/Perplexity about this topic. Make them:
- Natural, human language
- Recommendation-focused ("what's the best...", "compare X vs Y")
- Different angles (pricing, features, use cases)

Format as numbered list:
1. [question]
2. [question]
...`;

async function generateQuestions(topic: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: QUESTION_GENERATOR_SYSTEM },
        { role: 'user', content: QUESTION_GENERATOR_USER.replace('${topic}', topic) }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || '';
    return parseNumberedList(content);
  } catch (error) {
    console.error('Question generation failed:', error);
    // Fallback to template questions
    return generateFallbackQuestions(topic);
  }
}

function parseNumberedList(content: string): string[] {
  const lines = content.split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(q => q.length > 10);
    
  return lines.slice(0, 5); // Ensure exactly 5 questions
}
```

### Real Web Search Visibility Testing (Perplexity API)
```typescript
async function testVisibilityWithPerplexity(
  question: string, 
  targetDomain: string
): Promise<VisibilityTest> {
  try {
    const response = await fetch("https://api.perplexity.ai/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: question,
        source: "web"
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const citations = data?.citations || [];
    const lowerTarget = targetDomain.toLowerCase();

    // Find target domain in citations
    const targetIndex = citations.findIndex((citation: any) =>
      new URL(citation.url).hostname.includes(lowerTarget)
    );

    // Extract competitor domains
    const competitors = citations
      .map((citation: any) => new URL(citation.url).hostname)
      .filter((domain: string) => !domain.includes(lowerTarget))
      .slice(0, 5); // Top 5 competitors

    const citedDomains = citations.map((citation: any) => 
      new URL(citation.url).hostname
    );

    return {
      targetFound: targetIndex !== -1,
      position: targetIndex !== -1 ? targetIndex + 1 : null,
      citedDomains,
      competitors,
      reasoning: targetIndex === -1
        ? `Domain not found in search results. Top competitors: ${competitors.slice(0, 3).join(', ')}`
        : `Domain found at position ${targetIndex + 1} in search results`,
      rawCitations: citations // Store for detailed analysis
    };
  } catch (error) {
    console.error('Perplexity search failed:', error);
    return {
      targetFound: false,
      position: null,
      citedDomains: [],
      competitors: [],
      reasoning: `Search failed: ${error.message}`,
      rawCitations: []
    };
  }
}

// Generate insights using GPT-4o based on real search results
async function generateVisibilityInsights(
  question: string,
  targetDomain: string,
  result: VisibilityTest
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You help explain AI visibility outcomes and provide strategic recommendations.' 
        },
        {
          role: 'user',
          content: `We tested the query: "${question}"

Target domain: ${targetDomain}
Found in results: ${result.targetFound ? `Yes, at position ${result.position}` : 'No'}

Top cited domains in search results:
${result.citedDomains.slice(0, 5).map((d, i) => `${i + 1}. ${d}`).join('\n')}

Can you explain why the target domain ${result.targetFound ? 'was' : 'was not'} mentioned, and provide 2-3 specific recommendations to improve their visibility for this type of query?`
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    return response.choices[0]?.message?.content || 'No insights available';
  } catch (error) {
    console.error('Insight generation failed:', error);
    return 'Unable to generate insights at this time';
  }
}
```

## 4. Smart Scoring & User Communication

### Visibility Score Calculation
```typescript
function calculateVisibilityScore(results: VisibilityTest[]): {
  score: number;
  breakdown: ScoreBreakdown;
  insights: string[];
} {
  const totalQuestions = results.length;
  const mentions = results.filter(r => r.targetFound).length;
  const positions = results
    .filter(r => r.targetFound && r.position)
    .map(r => r.position!);
  
  // Base score: 60% for mentions
  const mentionScore = (mentions / totalQuestions) * 60;
  
  // Position bonus: 40% weighted by position quality
  const avgPosition = positions.length > 0 
    ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length
    : 6; // Assume worst position if not mentioned
    
  const positionScore = Math.max(0, (6 - avgPosition) / 5) * 40;
  
  const finalScore = Math.round(mentionScore + positionScore);
  
  // Generate insights
  const insights = generateInsights(mentions, totalQuestions, positions, results);
  
  return {
    score: finalScore,
    breakdown: { mentionScore, positionScore, mentions, totalQuestions },
    insights
  };
}

function generateInsights(
  mentions: number, 
  total: number, 
  positions: number[],
  results: VisibilityTest[]
): string[] {
  const insights: string[] = [];
  
  if (mentions === 0) {
    insights.push(`Your brand wasn't mentioned in any of ${total} test queries`);
    insights.push("This is common for newer sites - AI assistants favor established brands");
  } else if (mentions === total) {
    insights.push(`Excellent! Mentioned in all ${total} test queries`);
  } else {
    insights.push(`Mentioned in ${mentions} out of ${total} test queries`);
  }
  
  if (positions.length > 0) {
    const avgPos = Math.round(positions.reduce((a, b) => a + b, 0) / positions.length);
    insights.push(`Average position when mentioned: #${avgPos}`);
  }
  
  // Top competitors analysis
  const allCompetitors = results.flatMap(r => r.citedDomains);
  const competitorCounts = allCompetitors.reduce((acc, domain) => {
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCompetitors = Object.entries(competitorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([domain]) => domain);
    
  if (topCompetitors.length > 0) {
    insights.push(`Top competing domains: ${topCompetitors.join(', ')}`);
  }
  
  return insights;
}
```

### User-Friendly Results Display
```typescript
interface SnapshotResult {
  requestId: string;
  topic: string;
  urls: URLResult[];
  overallInsights: string[];
  recommendations: string[];
}

interface URLResult {
  url: string;
  domain: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  mentions: number;
  totalQuestions: number;
  avgPosition: number | null;
  topCompetitors: string[];
  questionResults: QuestionResult[];
}

interface QuestionResult {
  question: string;
  found: boolean;
  position: number | null;
  reasoning: string;
}

// Results UI component
function SnapshotResults({ result }: { result: SnapshotResult }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#161616] border border-[#222222] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          Snapshot: "{result.topic}"
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {result.overallInsights.map((insight, index) => (
            <div key={index} className="bg-[#0a0a0a] rounded p-3">
              <p className="text-sm text-[#ccc]">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {result.urls.map((urlResult, index) => (
        <URLResultCard key={index} result={urlResult} />
      ))}

      <RecommendationsCard recommendations={result.recommendations} />
    </div>
  );
}

function URLResultCard({ result }: { result: URLResult }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-[#161616] border border-[#222222] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-medium">{result.domain}</h3>
          <p className="text-xs text-[#888] truncate">{result.url}</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
            {result.score}
          </div>
          <div className="text-xs text-[#888]">
            {result.mentions}/{result.totalQuestions} mentions
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {result.questionResults.map((qr, index) => (
          <div key={index} className="border-l-2 border-[#333] pl-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${qr.found ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-white">Q{index + 1}</span>
              {qr.position && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                  #{qr.position}
                </span>
              )}
            </div>
            <p className="text-sm text-[#ccc] mb-1">{qr.question}</p>
            <p className="text-xs text-[#888]">{qr.reasoning}</p>
          </div>
        ))}
      </div>

      {result.topCompetitors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#333]">
          <p className="text-xs text-[#888] mb-1">Top competitors mentioned:</p>
          <div className="flex flex-wrap gap-1">
            {result.topCompetitors.map((comp, index) => (
              <span key={index} className="text-xs bg-[#333] text-[#ccc] px-2 py-1 rounded">
                {comp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 5. Updated Processing Workflow

### Hybrid GPT-4o + Perplexity Architecture
```typescript
async function processSnapshot(request: SnapshotRequest): Promise<void> {
  // Step 1: Generate questions using GPT-4o (Vercel AI SDK)
  const questions = await generateQuestions(request.topic);
  
  // Store questions in DB
  const questionRecords = await storeQuestions(request.id, questions);
  
  // Step 2: Test each question with Perplexity real web search
  for (const questionRecord of questionRecords) {
    for (const url of request.urls) {
      const domain = new URL(url).hostname;
      
      // Real web search via Perplexity
      const visibilityResult = await testVisibilityWithPerplexity(
        questionRecord.question, 
        domain
      );
      
      // Store raw results
      await storeVisibilityResult(request.id, url, questionRecord.id, visibilityResult);
    }
  }
  
  // Step 3: Generate insights using GPT-4o based on real search data
  const allResults = await getVisibilityResults(request.id);
  const insights = await generateVisibilityInsights(
    request.topic,
    allResults
  );
  
  // Step 4: Calculate final scores and store summary
  await generateSnapshotSummary(request.id, allResults, insights);
}
```

## 6. MVP Launch Checklist

### Week 1: Core Infrastructure  
- [ ] Database schema setup with atomic locking
- [ ] Basic queue processing with race condition protection
- [ ] OpenAI integration (Vercel AI SDK) with proper error handling
- [ ] Perplexity API integration with rate limiting
- [ ] User quotas and cost protection

### Week 2: Search Pipeline
- [ ] Question generation with GPT-4o (fallbacks included)
- [ ] Real web search via Perplexity API
- [ ] Citation parsing and domain extraction
- [ ] GPT-4o insights generation based on real results
- [ ] Results storage optimization

### Week 3: Frontend & UX
- [ ] Clean input form (URLs + topic)
- [ ] Real-time results display with Perplexity citations
- [ ] Error states and loading indicators
- [ ] Competitive analysis visualization
- [ ] Responsive design and mobile optimization

### Week 4: Production Polish
- [ ] Comprehensive error handling for both APIs
- [ ] User feedback mechanisms
- [ ] Performance monitoring and cost tracking
- [ ] Documentation and onboarding

## 6. Risk Mitigation

### Technical Risks
1. **LLM API Failures**: Fallback questions, retry logic, graceful degradation
2. **Rate Limiting**: User quotas, queue throttling, cost alerts
3. **Race Conditions**: Atomic locking, unique worker IDs
4. **Data Bloat**: Summarized responses, periodic cleanup

### Product Risks  
1. **User Expectations**: Clear messaging about AI bias toward popular brands
2. **Value Proposition**: Focus on competitive intelligence, not just scores
3. **Pricing**: Start free with limits, expand based on usage patterns

### Operational Risks
1. **Cost Spikes**: Daily budget alerts, automatic circuit breakers
2. **Performance**: Queue monitoring, processing time alerts
3. **Data Quality**: Response validation, manual spot checks

## 7. Cost Analysis (Updated)

### Per Snapshot (5 questions, 1 URL)
- **Question Generation (GPT-4o)**: ~500 tokens × $0.005 = $0.0025
- **Web Search (Perplexity)**: 5 searches × $0.01 = $0.05
- **Insights Generation (GPT-4o)**: ~300 tokens × $0.015 = $0.0045
- **Total per URL**: ~$0.057

### Per 10-URL Batch
- **Total cost**: ~$0.57 per snapshot
- **Very reasonable for the value provided!**

### API Limits & Considerations
- **Perplexity**: 100 requests/day on free tier, ~$0.01/search on paid
- **OpenAI**: Standard GPT-4o pricing
- **Rate limiting**: Build in delays between Perplexity calls
- **Budget alerts**: Set daily spending limits

This MVP focuses on the core value proposition while addressing production concerns. The hybrid approach leverages real web search data for objectivity while using GPT-4o for strategic insights. The simplified scope makes it achievable in 4 weeks while providing immediate user value. 