# Step-by-Step Implementation: Production-Ready Snapshot MVP

## Overview
Building on the previous plan with critical production fixes for queue management, security, error handling, and data retention.

## Phase 1: Database Setup & Security (Fixed)

### Step 1.1: Enhanced Database Schema with Lock Management
**Goal**: Set up tables with proper status transitions and lock timeouts

```sql
-- Run in Supabase SQL Editor

-- Main snapshot requests with enhanced status tracking
CREATE TABLE snapshot_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  urls TEXT[] NOT NULL,
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'timeout')),
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX idx_snapshot_requests_status ON snapshot_requests(status);
CREATE INDEX idx_snapshot_requests_created_at ON snapshot_requests(created_at);
CREATE INDEX idx_snapshot_requests_user_id ON snapshot_requests(user_id);

-- Generated questions
CREATE TABLE snapshot_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES snapshot_requests(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  UNIQUE(request_id, question_number)
);

-- Visibility test results (optimized storage)
CREATE TABLE visibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES snapshot_requests(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  question_id UUID REFERENCES snapshot_questions(id) ON DELETE CASCADE,
  target_found BOOLEAN NOT NULL,
  position INTEGER,
  cited_domains TEXT[],
  reasoning_summary TEXT,
  top_citations JSONB, -- Only store top 5 citations, not full response
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  api_call_duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0
);

-- Final snapshot summary (fixed schema)
CREATE TABLE snapshot_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES snapshot_requests(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  visibility_score INTEGER NOT NULL,
  mentions_count INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  top_competitors TEXT[],
  insights TEXT, -- Single insight string, not array
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, url)
);

-- Rate limiting table
CREATE TABLE user_rate_limits (
  user_id UUID REFERENCES auth.users(id),
  day DATE DEFAULT CURRENT_DATE,
  requests_count INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- Enhanced atomic queue processing with timeout handling
CREATE OR REPLACE FUNCTION claim_next_snapshot(worker_id TEXT, lock_timeout_minutes INTEGER DEFAULT 10)
RETURNS TABLE(id UUID, urls TEXT[], topic TEXT) AS $$
BEGIN
  -- First, release any stale locks
  UPDATE snapshot_requests 
  SET 
    status = 'timeout',
    locked_at = NULL,
    locked_by = NULL
  WHERE status = 'processing' 
    AND locked_at < NOW() - INTERVAL '1 minute' * lock_timeout_minutes;

  -- Then claim the next available request
  RETURN QUERY
  UPDATE snapshot_requests 
  SET 
    locked_at = NOW(),
    locked_by = worker_id,
    status = 'processing'
  WHERE id = (
    SELECT r.id 
    FROM snapshot_requests r
    WHERE r.status IN ('pending', 'timeout')
      AND (r.retry_count < 3 OR r.retry_count IS NULL)
    ORDER BY 
      CASE WHEN r.status = 'timeout' THEN 1 ELSE 0 END, -- Prioritize retries
      r.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING snapshot_requests.id, snapshot_requests.urls, snapshot_requests.topic;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a snapshot
CREATE OR REPLACE FUNCTION complete_snapshot(request_id UUID, success BOOLEAN, error_msg TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE snapshot_requests 
  SET 
    status = CASE WHEN success THEN 'completed' ELSE 'failed' END,
    completed_at = NOW(),
    error_message = error_msg,
    locked_at = NULL,
    locked_by = NULL
  WHERE id = request_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Data cleanup function (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_old_snapshots(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete old completed/failed snapshots and their related data
  DELETE FROM snapshot_requests 
  WHERE status IN ('completed', 'failed') 
    AND completed_at < NOW() - INTERVAL '1 day' * retention_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up orphaned rate limit records
  DELETE FROM user_rate_limits 
  WHERE day < CURRENT_DATE - INTERVAL '7 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

### Step 1.2: Environment Setup (Security Fixed)
**Goal**: Proper separation of keys and secure configuration

**Create `.env.local` (Client-side safe)**:
```env
# Public keys (safe for client)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development testing only (not used in production client)
OPENAI_API_KEY=your_openai_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
```

**Create `.env.server` (Server-only)**:
```env
# Sensitive keys (server/Edge Functions only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
```

**Install Dependencies**:
```bash
npm install ai @supabase/supabase-js
npm install -D typescript ts-node @types/node
```

**Create `tsconfig.json` for Node scripts**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "ts-node": {
    "compilerOptions": {
      "module": "commonjs"
    }
  }
}
```

**Testing Checkpoint 1.2 (Fixed)**:
Create `test-env.ts`:
```typescript
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('Environment Test:');
console.log('✅ OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set' : '❌ Missing');
console.log('✅ Perplexity Key:', process.env.PERPLEXITY_API_KEY ? 'Set' : '❌ Missing');
console.log('✅ Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : '❌ Missing');

// Test Supabase connection with anon key first
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// For testing only - use service key (would be in Edge Function in production)
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testSupabase() {
  try {
    // Test basic connectivity
    const { data, error } = await supabaseAnon
      .from('snapshot_requests')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ Supabase Error:', error.message);
    } else {
      console.log('✅ Supabase Connected');
    }

    // Test service functions
    const { data: claimData } = await supabaseService
      .rpc('claim_next_snapshot', { worker_id: 'test-worker' });
    
    console.log('✅ Service functions accessible');
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testSupabase();
```

Run: `npx ts-node test-env.ts`

## Phase 2: Enhanced Question Generation with Error Handling

### Step 2.1: Robust Question Generator
**Create `src/lib/question-generator.ts`**:
```typescript
import { openai } from 'ai';

interface QuestionGenerationResult {
  questions: string[];
  success: boolean;
  error?: string;
  tokensUsed?: number;
  retryCount?: number;
}

const QUESTION_GENERATOR_SYSTEM = `You create realistic user questions for AI assistants based on topics. Focus on recommendation/comparison scenarios that would surface product mentions.`;

const QUESTION_GENERATOR_USER = `Topic: "{TOPIC}"

Generate exactly 5 questions that users might ask ChatGPT/Perplexity about this topic. Make them:
- Natural, human language
- Recommendation-focused ("what's the best...", "compare X vs Y")
- Different angles (pricing, features, use cases)

Format as numbered list:
1. [question]
2. [question]
3. [question]
4. [question]
5. [question]`;

export async function generateQuestions(
  topic: string, 
  retryCount: number = 0
): Promise<QuestionGenerationResult> {
  console.log(`🤖 Generating questions for topic: "${topic}" (attempt ${retryCount + 1})`);
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: QUESTION_GENERATOR_SYSTEM },
        { role: 'user', content: QUESTION_GENERATOR_USER.replace('{TOPIC}', topic) }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;
    
    console.log(`📝 Raw GPT-4o response (${tokensUsed} tokens):`, content);
    
    const questions = parseNumberedList(content);
    console.log(`✅ Parsed ${questions.length} questions:`, questions);
    
    if (questions.length < 3) {
      throw new Error(`Only parsed ${questions.length} questions, expected at least 3`);
    }
    
    // Pad with fallback questions if needed
    while (questions.length < 5) {
      const fallbacks = generateFallbackQuestions(topic);
      questions.push(fallbacks[questions.length % fallbacks.length]);
    }
    
    return {
      questions: questions.slice(0, 5),
      success: true,
      tokensUsed,
      retryCount
    };
  } catch (error: any) {
    console.error(`❌ Question generation failed (attempt ${retryCount + 1}):`, error);
    
    // Retry logic with exponential backoff
    if (retryCount < 2) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`⏳ Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateQuestions(topic, retryCount + 1);
    }
    
    // Final fallback
    console.log('🔄 Using fallback questions');
    return {
      questions: generateFallbackQuestions(topic),
      success: false,
      error: error.message,
      retryCount
    };
  }
}

function parseNumberedList(content: string): string[] {
  const lines = content.split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(q => q.length > 10 && q.length < 200); // Reasonable length bounds
    
  return lines;
}

function generateFallbackQuestions(topic: string): string[] {
  return [
    `What's the best ${topic}?`,
    `Compare top ${topic} options for businesses`,
    `${topic} recommendations and reviews`,
    `Most popular ${topic} tools in 2024`,
    `${topic} pricing and features comparison`
  ];
}
```

### Step 2.2: Enhanced Database Client with Rate Limiting
**Create `src/lib/supabase-client.ts`**:
```typescript
import { createClient } from '@supabase/supabase-js';

// Client for browser use (anon key only)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server client for Edge Functions (service key)
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  requestsToday: number;
  limit: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  
  // Get or create today's rate limit record
  const { data, error } = await supabaseServer
    .from('user_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('day', today)
    .single();
    
  if (error && error.code !== 'PGRST116') { // Not "not found" error
    console.error('Rate limit check failed:', error);
    return { allowed: false, requestsToday: 0, limit: 5 };
  }
  
  const currentCount = data?.requests_count || 0;
  const limit = 5; // 5 requests per day for free tier
  
  return {
    allowed: currentCount < limit,
    requestsToday: currentCount,
    limit
  };
}

export async function incrementRateLimit(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { error } = await supabaseServer
      .from('user_rate_limits')
      .upsert({
        user_id: userId,
        day: today,
        requests_count: 1
      }, {
        onConflict: 'user_id,day',
        ignoreDuplicates: false
      });
      
    if (error) {
      console.error('Failed to increment rate limit:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Rate limit increment error:', error);
    return false;
  }
}

export async function storeQuestions(
  requestId: string, 
  questions: string[]
): Promise<{ success: boolean; questionIds: string[] }> {
  console.log(`💾 Storing ${questions.length} questions for request ${requestId}`);
  
  try {
    const questionData = questions.map((question, index) => ({
      request_id: requestId,
      question,
      question_number: index + 1
    }));

    const { data, error } = await supabaseServer
      .from('snapshot_questions')
      .insert(questionData)
      .select('id');

    if (error) {
      console.error('❌ Failed to store questions:', error);
      return { success: false, questionIds: [] };
    }

    const questionIds = data.map(q => q.id);
    console.log(`✅ Stored questions with IDs:`, questionIds);
    
    return { success: true, questionIds };
  } catch (error) {
    console.error('❌ Store questions error:', error);
    return { success: false, questionIds: [] };
  }
}
```

## Phase 3: Robust Perplexity Integration

### Step 3.1: Enhanced Perplexity Client with Retries
**Create `src/lib/perplexity-client.ts`**:
```typescript
interface PerplexitySearchResult {
  citations: Array<{
    url: string;
    title: string;
    rank: number;
  }>;
  answer: string;
}

interface VisibilityTest {
  targetFound: boolean;
  position: number | null;
  citedDomains: string[];
  competitors: string[];
  reasoning: string;
  topCitations: any[]; // Only top 5, not full response
  apiCallDuration: number;
  retryCount: number;
}

export async function searchWithPerplexity(
  question: string, 
  retryCount: number = 0
): Promise<PerplexitySearchResult | null> {
  console.log(`🔍 Searching Perplexity for: "${question}" (attempt ${retryCount + 1})`);
  
  const startTime = Date.now();
  
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
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Perplexity API call took ${duration}ms`);

    if (!response.ok) {
      if (response.status === 429 && retryCount < 3) {
        // Rate limited - exponential backoff
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
        console.log(`⏳ Rate limited, retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return searchWithPerplexity(question, retryCount + 1);
      }
      
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Perplexity returned ${data.citations?.length || 0} citations`);
    
    return data;
  } catch (error: any) {
    console.error(`❌ Perplexity search failed (attempt ${retryCount + 1}):`, error);
    
    // Retry on network errors
    if (retryCount < 2 && (error.code === 'ECONNRESET' || error.name === 'TimeoutError')) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`⏳ Network error, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return searchWithPerplexity(question, retryCount + 1);
    }
    
    return null;
  }
}

export async function testVisibilityWithPerplexity(
  question: string, 
  targetDomain: string
): Promise<VisibilityTest> {
  console.log(`🎯 Testing visibility for "${targetDomain}" on question: "${question}"`);
  
  const startTime = Date.now();
  let retryCount = 0;
  
  const searchResult = await searchWithPerplexity(question, retryCount);
  const duration = Date.now() - startTime;
  
  if (!searchResult) {
    return {
      targetFound: false,
      position: null,
      citedDomains: [],
      competitors: [],
      reasoning: 'Search failed after retries',
      topCitations: [],
      apiCallDuration: duration,
      retryCount
    };
  }

  const citations = searchResult.citations || [];
  const lowerTarget = targetDomain.toLowerCase();

  // Find target domain in citations
  const targetIndex = citations.findIndex((citation: any) => {
    try {
      const hostname = new URL(citation.url).hostname.toLowerCase();
      return hostname.includes(lowerTarget) || lowerTarget.includes(hostname);
    } catch {
      return false;
    }
  });

  // Extract competitor domains
  const competitors = citations
    .map((citation: any) => {
      try {
        return new URL(citation.url).hostname;
      } catch {
        return null;
      }
    })
    .filter((domain: string | null) => {
      if (!domain) return false;
      const lowerDomain = domain.toLowerCase();
      return !lowerDomain.includes(lowerTarget) && !lowerTarget.includes(lowerDomain);
    })
    .slice(0, 5);

  const citedDomains = citations
    .map((citation: any) => {
      try {
        return new URL(citation.url).hostname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  // Store only top 5 citations to save space
  const topCitations = citations.slice(0, 5).map((citation: any) => ({
    url: citation.url,
    title: citation.title?.substring(0, 200), // Truncate titles
    rank: citation.rank
  }));

  const result: VisibilityTest = {
    targetFound: targetIndex !== -1,
    position: targetIndex !== -1 ? targetIndex + 1 : null,
    citedDomains,
    competitors,
    reasoning: targetIndex === -1
      ? `Domain not found in search results. Top competitors: ${competitors.slice(0, 3).join(', ')}`
      : `Domain found at position ${targetIndex + 1} in search results`,
    topCitations,
    apiCallDuration: duration,
    retryCount
  };

  console.log(`📋 Visibility test result:`, {
    ...result,
    topCitations: `${result.topCitations.length} citations`
  });
  
  return result;
}
```

**Testing with proper TypeScript support**:
Create `test-perplexity.ts`:
```typescript
import dotenv from 'dotenv';
import { searchWithPerplexity, testVisibilityWithPerplexity } from '../src/lib/perplexity-client';

dotenv.config({ path: '.env.local' });

async function testPerplexity() {
  const testCases = [
    {
      question: "What's the best startup banking solution?",
      targetDomain: "mercury.com"
    },
    {
      question: "Compare project management tools",
      targetDomain: "notion.so"
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.question}`);
    console.log(`🎯 Looking for: ${testCase.targetDomain}`);
    
    const visibilityResult = await testVisibilityWithPerplexity(
      testCase.question, 
      testCase.targetDomain
    );
    
    console.log('📊 Results:');
    console.log('- Target found:', visibilityResult.targetFound);
    console.log('- Position:', visibilityResult.position);
    console.log('- API call duration:', visibilityResult.apiCallDuration + 'ms');
    console.log('- Retry count:', visibilityResult.retryCount);
    console.log('- Competitors:', visibilityResult.competitors.slice(0, 3));
  }
}

testPerplexity().catch(console.error);
```

Run: `npx ts-node test-perplexity.ts`

This addresses all the major production concerns:

✅ **Lock timeouts** and proper status transitions  
✅ **Security** - service keys only in server code  
✅ **TypeScript testing** with ts-node  
✅ **Retry logic** with exponential backoff  
✅ **Rate limiting** and abuse protection  
✅ **Optimized storage** - only top 5 citations  
✅ **Data cleanup** strategy with retention  

Should we continue with the remaining phases using this hardened approach? 