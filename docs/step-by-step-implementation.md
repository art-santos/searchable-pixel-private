# Step-by-Step Implementation: Snapshot MVP

## Overview
We'll build the Snapshot feature incrementally, testing each component before moving to the next. Each step includes verification checkpoints to ensure data flows correctly.

## Phase 1: Database Setup & Basic Infrastructure

### Step 1.1: Supabase Database Schema
**Goal**: Set up all database tables and verify they work

**Implementation**:
```sql
-- Run in Supabase SQL Editor

-- Main snapshot requests
CREATE TABLE snapshot_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  urls TEXT[] NOT NULL,
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by TEXT,
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
  reasoning_summary TEXT,
  raw_citations JSONB,
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Final snapshot summary
CREATE TABLE snapshot_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES snapshot_requests(id),
  url TEXT NOT NULL,
  visibility_score INTEGER NOT NULL,
  mentions_count INTEGER NOT NULL,
  top_competitors TEXT[],
  key_insights TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atomic queue processing function
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

**Testing Checkpoint 1.1**:
```sql
-- Test data insertion
INSERT INTO snapshot_requests (user_id, urls, topic) 
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  ARRAY['https://example.com'], 
  'test topic'
);

-- Verify data
SELECT * FROM snapshot_requests;

-- Test atomic claim function
SELECT * FROM claim_next_snapshot('test-worker-1');

-- Verify status changed
SELECT id, status, locked_by FROM snapshot_requests;
```

**Expected Result**: ✅ Tables created, data inserted, claim function works

### Step 1.2: Environment Setup
**Goal**: Configure API keys and basic Next.js setup

**Create `.env.local`**:
```env
OPENAI_API_KEY=your_openai_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Install Dependencies**:
```bash
npm install ai @supabase/supabase-js
```

**Testing Checkpoint 1.2**:
Create `test-env.js` in root:
```javascript
require('dotenv').config({ path: '.env.local' });

console.log('Environment Test:');
console.log('✅ OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set' : '❌ Missing');
console.log('✅ Perplexity Key:', process.env.PERPLEXITY_API_KEY ? 'Set' : '❌ Missing');
console.log('✅ Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : '❌ Missing');

// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabase() {
  const { data, error } = await supabase
    .from('snapshot_requests')
    .select('count')
    .limit(1);
    
  if (error) {
    console.log('❌ Supabase Error:', error.message);
  } else {
    console.log('✅ Supabase Connected');
  }
}

testSupabase();
```

Run: `node test-env.js`

**Expected Result**: ✅ All keys set, Supabase connected

## Phase 2: Question Generation (GPT-4o Integration)

### Step 2.1: Basic OpenAI Integration
**Goal**: Generate questions using GPT-4o and store in database

**Create `src/lib/question-generator.ts`**:
```typescript
import { openai } from 'ai';

interface QuestionGenerationResult {
  questions: string[];
  success: boolean;
  error?: string;
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

export async function generateQuestions(topic: string): Promise<QuestionGenerationResult> {
  console.log(`🤖 Generating questions for topic: "${topic}"`);
  
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
    console.log(`📝 Raw GPT-4o response:`, content);
    
    const questions = parseNumberedList(content);
    console.log(`✅ Parsed ${questions.length} questions:`, questions);
    
    if (questions.length !== 5) {
      console.log(`⚠️ Expected 5 questions, got ${questions.length}`);
    }
    
    return {
      questions,
      success: true
    };
  } catch (error) {
    console.error('❌ Question generation failed:', error);
    return {
      questions: generateFallbackQuestions(topic),
      success: false,
      error: error.message
    };
  }
}

function parseNumberedList(content: string): string[] {
  const lines = content.split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(q => q.length > 10);
    
  return lines.slice(0, 5);
}

function generateFallbackQuestions(topic: string): string[] {
  return [
    `What's the best ${topic}?`,
    `Compare top ${topic} options`,
    `${topic} recommendations for beginners`,
    `Most popular ${topic} tools`,
    `${topic} pricing and features comparison`
  ];
}
```

**Testing Checkpoint 2.1**:
Create `test-questions.js`:
```javascript
require('dotenv').config({ path: '.env.local' });

async function testQuestionGeneration() {
  const { generateQuestions } = require('./src/lib/question-generator.ts');
  
  const testTopics = [
    'startup banking',
    'project management software',
    'email marketing tools'
  ];
  
  for (const topic of testTopics) {
    console.log(`\n🧪 Testing topic: "${topic}"`);
    const result = await generateQuestions(topic);
    
    console.log('Success:', result.success);
    console.log('Questions:', result.questions);
    if (result.error) console.log('Error:', result.error);
  }
}

testQuestionGeneration();
```

Run: `node test-questions.js`

**Expected Result**: ✅ 5 relevant questions generated for each topic

### Step 2.2: Store Questions in Database
**Goal**: Save generated questions to Supabase and verify data flow

**Create `src/lib/supabase-client.ts`**:
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const { data, error } = await supabase
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

**Testing Checkpoint 2.2**:
Create `test-store-questions.js`:
```javascript
require('dotenv').config({ path: '.env.local' });

async function testStoreQuestions() {
  const { supabase, storeQuestions } = require('./src/lib/supabase-client.ts');
  const { generateQuestions } = require('./src/lib/question-generator.ts');
  
  // 1. Create a test snapshot request
  const { data: request, error: requestError } = await supabase
    .from('snapshot_requests')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      urls: ['https://example.com'],
      topic: 'test topic for questions'
    })
    .select()
    .single();
    
  if (requestError) {
    console.error('❌ Failed to create test request:', requestError);
    return;
  }
  
  console.log('✅ Created test request:', request.id);
  
  // 2. Generate questions
  const questionResult = await generateQuestions(request.topic);
  
  // 3. Store questions
  const storeResult = await storeQuestions(request.id, questionResult.questions);
  
  // 4. Verify in database
  const { data: storedQuestions } = await supabase
    .from('snapshot_questions')
    .select('*')
    .eq('request_id', request.id)
    .order('question_number');
    
  console.log('\n📊 Verification:');
  console.log('Questions stored:', storeResult.success);
  console.log('Count in DB:', storedQuestions?.length);
  console.log('Questions:', storedQuestions?.map(q => `${q.question_number}. ${q.question}`));
}

testStoreQuestions();
```

Run: `node test-store-questions.js`

**Expected Result**: ✅ Questions stored in database, verified by SELECT query

## Phase 3: Perplexity Integration & Visibility Testing

### Step 3.1: Basic Perplexity API Integration
**Goal**: Test Perplexity API and verify response structure

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
  rawCitations: any[];
}

export async function searchWithPerplexity(question: string): Promise<PerplexitySearchResult | null> {
  console.log(`🔍 Searching Perplexity for: "${question}"`);
  
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
      console.error(`❌ Perplexity API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }

    const data = await response.json();
    console.log(`📊 Perplexity raw response:`, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Perplexity search failed:', error);
    return null;
  }
}

export async function testVisibilityWithPerplexity(
  question: string, 
  targetDomain: string
): Promise<VisibilityTest> {
  console.log(`🎯 Testing visibility for "${targetDomain}" on question: "${question}"`);
  
  const searchResult = await searchWithPerplexity(question);
  
  if (!searchResult) {
    return {
      targetFound: false,
      position: null,
      citedDomains: [],
      competitors: [],
      reasoning: 'Search failed due to API error',
      rawCitations: []
    };
  }

  const citations = searchResult.citations || [];
  const lowerTarget = targetDomain.toLowerCase();

  // Find target domain in citations
  const targetIndex = citations.findIndex((citation: any) => {
    try {
      const hostname = new URL(citation.url).hostname.toLowerCase();
      return hostname.includes(lowerTarget);
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
    .filter((domain: string | null) => domain && !domain.toLowerCase().includes(lowerTarget))
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

  const result: VisibilityTest = {
    targetFound: targetIndex !== -1,
    position: targetIndex !== -1 ? targetIndex + 1 : null,
    citedDomains,
    competitors,
    reasoning: targetIndex === -1
      ? `Domain not found in search results. Top competitors: ${competitors.slice(0, 3).join(', ')}`
      : `Domain found at position ${targetIndex + 1} in search results`,
    rawCitations: citations
  };

  console.log(`📋 Visibility test result:`, result);
  return result;
}
```

**Testing Checkpoint 3.1**:
Create `test-perplexity.js`:
```javascript
require('dotenv').config({ path: '.env.local' });

async function testPerplexity() {
  const { searchWithPerplexity, testVisibilityWithPerplexity } = require('./src/lib/perplexity-client.ts');
  
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
    
    // Test raw search
    const searchResult = await searchWithPerplexity(testCase.question);
    if (searchResult) {
      console.log(`✅ Search successful, ${searchResult.citations?.length || 0} citations`);
    }
    
    // Test visibility
    const visibilityResult = await testVisibilityWithPerplexity(
      testCase.question, 
      testCase.targetDomain
    );
    
    console.log('📊 Results:');
    console.log('- Target found:', visibilityResult.targetFound);
    console.log('- Position:', visibilityResult.position);
    console.log('- Competitors:', visibilityResult.competitors.slice(0, 3));
  }
}

testPerplexity();
```

Run: `node test-perplexity.js`

**Expected Result**: ✅ Perplexity API responds, citations parsed, visibility detected

### Step 3.2: Store Visibility Results
**Goal**: Save Perplexity results to database and verify data structure

**Add to `src/lib/supabase-client.ts`**:
```typescript
export async function storeVisibilityResult(
  requestId: string,
  url: string,
  questionId: string,
  result: VisibilityTest
): Promise<boolean> {
  console.log(`💾 Storing visibility result for ${url} on question ${questionId}`);
  
  try {
    const { error } = await supabase
      .from('visibility_results')
      .insert({
        request_id: requestId,
        url,
        question_id: questionId,
        target_found: result.targetFound,
        position: result.position,
        cited_domains: result.citedDomains,
        reasoning_summary: result.reasoning,
        raw_citations: result.rawCitations
      });

    if (error) {
      console.error('❌ Failed to store visibility result:', error);
      return false;
    }

    console.log(`✅ Stored visibility result`);
    return true;
  } catch (error) {
    console.error('❌ Store visibility result error:', error);
    return false;
  }
}
```

**Testing Checkpoint 3.2**:
Create `test-store-visibility.js`:
```javascript
require('dotenv').config({ path: '.env.local' });

async function testStoreVisibility() {
  const { supabase, storeQuestions, storeVisibilityResult } = require('./src/lib/supabase-client.ts');
  const { generateQuestions } = require('./src/lib/question-generator.ts');
  const { testVisibilityWithPerplexity } = require('./src/lib/perplexity-client.ts');
  
  // 1. Create test request
  const { data: request } = await supabase
    .from('snapshot_requests')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      urls: ['https://mercury.com'],
      topic: 'startup banking'
    })
    .select()
    .single();
    
  console.log('✅ Created test request:', request.id);
  
  // 2. Generate and store questions
  const questionResult = await generateQuestions(request.topic);
  const storeResult = await storeQuestions(request.id, questionResult.questions);
  
  // 3. Get first question
  const { data: questions } = await supabase
    .from('snapshot_questions')
    .select('*')
    .eq('request_id', request.id)
    .limit(1);
    
  const firstQuestion = questions[0];
  console.log(`🧪 Testing with question: "${firstQuestion.question}"`);
  
  // 4. Test visibility and store result
  const visibilityResult = await testVisibilityWithPerplexity(
    firstQuestion.question,
    'mercury.com'
  );
  
  const stored = await storeVisibilityResult(
    request.id,
    'https://mercury.com',
    firstQuestion.id,
    visibilityResult
  );
  
  // 5. Verify stored data
  const { data: storedResults } = await supabase
    .from('visibility_results')
    .select('*')
    .eq('request_id', request.id);
    
  console.log('\n📊 Verification:');
  console.log('Visibility result stored:', stored);
  console.log('Results in DB:', storedResults?.length);
  console.log('Sample result:', storedResults?.[0]);
}

testStoreVisibility();
```

Run: `node test-store-visibility.js`

**Expected Result**: ✅ Visibility results stored in database with proper JSONB structure

## Phase 4: Complete Pipeline Integration

### Step 4.1: End-to-End Processing Function
**Goal**: Combine all components into a single processing pipeline

**Create `src/lib/snapshot-processor.ts`**:
```typescript
import { generateQuestions } from './question-generator';
import { testVisibilityWithPerplexity } from './perplexity-client';
import { supabase, storeQuestions, storeVisibilityResult } from './supabase-client';

interface SnapshotRequest {
  id: string;
  urls: string[];
  topic: string;
  user_id: string;
}

export async function processSnapshot(request: SnapshotRequest): Promise<boolean> {
  console.log(`🚀 Processing snapshot ${request.id} for topic: "${request.topic}"`);
  console.log(`📱 URLs to test: ${request.urls.join(', ')}`);
  
  try {
    // Step 1: Generate questions
    console.log('\n📝 Step 1: Generating questions...');
    const questionResult = await generateQuestions(request.topic);
    
    if (!questionResult.success) {
      console.error('❌ Question generation failed');
      return false;
    }
    
    // Step 2: Store questions
    console.log('\n💾 Step 2: Storing questions...');
    const storeResult = await storeQuestions(request.id, questionResult.questions);
    
    if (!storeResult.success) {
      console.error('❌ Failed to store questions');
      return false;
    }
    
    // Step 3: Get stored questions for processing
    const { data: questions } = await supabase
      .from('snapshot_questions')
      .select('*')
      .eq('request_id', request.id)
      .order('question_number');
    
    console.log(`\n🔍 Step 3: Testing visibility for ${questions.length} questions x ${request.urls.length} URLs...`);
    
    // Step 4: Test each question against each URL
    for (const question of questions) {
      for (const url of request.urls) {
        const domain = new URL(url).hostname;
        console.log(`\n🎯 Testing "${domain}" for: "${question.question}"`);
        
        const visibilityResult = await testVisibilityWithPerplexity(
          question.question, 
          domain
        );
        
        const stored = await storeVisibilityResult(
          request.id,
          url,
          question.id,
          visibilityResult
        );
        
        if (!stored) {
          console.error(`❌ Failed to store result for ${url}`);
        }
        
        // Rate limiting: wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Step 5: Mark request as completed
    console.log('\n✅ Step 5: Marking request as completed...');
    await supabase
      .from('snapshot_requests')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', request.id);
    
    console.log(`🎉 Successfully processed snapshot ${request.id}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Processing failed for snapshot ${request.id}:`, error);
    
    // Mark as failed
    await supabase
      .from('snapshot_requests')
      .update({ status: 'failed' })
      .eq('id', request.id);
    
    return false;
  }
}
```

**Testing Checkpoint 4.1**:
Create `test-full-pipeline.js`:
```javascript
require('dotenv').config({ path: '.env.local' });

async function testFullPipeline() {
  const { supabase } = require('./src/lib/supabase-client.ts');
  const { processSnapshot } = require('./src/lib/snapshot-processor.ts');
  
  // Create test request
  const { data: request } = await supabase
    .from('snapshot_requests')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      urls: ['https://mercury.com', 'https://stripe.com'],
      topic: 'startup banking solutions'
    })
    .select()
    .single();
    
  console.log('🧪 Created test request:', request.id);
  console.log('🎯 Topic:', request.topic);
  console.log('📱 URLs:', request.urls);
  
  // Process the snapshot
  const success = await processSnapshot(request);
  
  // Verify results
  if (success) {
    console.log('\n📊 Verification - checking stored data...');
    
    // Check questions
    const { data: questions } = await supabase
      .from('snapshot_questions')
      .select('*')
      .eq('request_id', request.id);
    
    console.log(`✅ Questions stored: ${questions?.length || 0}`);
    
    // Check visibility results
    const { data: results } = await supabase
      .from('visibility_results')
      .select('*')
      .eq('request_id', request.id);
    
    console.log(`✅ Visibility results stored: ${results?.length || 0}`);
    
    // Check request status
    const { data: updatedRequest } = await supabase
      .from('snapshot_requests')
      .select('status, completed_at')
      .eq('id', request.id)
      .single();
    
    console.log(`✅ Request status: ${updatedRequest?.status}`);
    console.log(`✅ Completed at: ${updatedRequest?.completed_at}`);
    
    // Show sample results
    if (results?.length > 0) {
      console.log('\n📋 Sample Results:');
      results.slice(0, 2).forEach(result => {
        console.log(`- ${result.url}: ${result.target_found ? 'FOUND' : 'NOT FOUND'} ${result.position ? `(#${result.position})` : ''}`);
        console.log(`  Competitors: ${result.cited_domains?.slice(0, 3).join(', ')}`);
      });
    }
  }
}

testFullPipeline();
```

Run: `node test-full-pipeline.js`

**Expected Result**: ✅ Complete pipeline processes successfully, all data stored in Supabase

## Phase 5: Queue Processing & API Endpoints

### Step 5.1: API Endpoint for Snapshot Requests
**Goal**: Create API endpoint to accept user requests and enqueue them

**Create `src/app/api/snapshot/create/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  console.log('📥 Received snapshot creation request');
  
  try {
    const body = await request.json();
    const { urls, topic } = body;
    
    console.log('Request data:', { urls, topic });
    
    // Validation
    if (!topic || !urls?.length) {
      console.log('❌ Validation failed: missing topic or URLs');
      return NextResponse.json(
        { error: 'Topic and URLs are required' }, 
        { status: 400 }
      );
    }
    
    if (urls.length > 10) {
      console.log('❌ Validation failed: too many URLs');
      return NextResponse.json(
        { error: 'Maximum 10 URLs allowed' }, 
        { status: 400 }
      );
    }
    
    // For testing, use a dummy user ID
    const userId = '00000000-0000-0000-0000-000000000000';
    
    // Create snapshot request
    const { data: snapshotRequest, error } = await supabase
      .from('snapshot_requests')
      .insert({
        user_id: userId,
        urls: urls.slice(0, 10),
        topic: topic.trim(),
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create snapshot request' }, 
        { status: 500 }
      );
    }
    
    console.log('✅ Created snapshot request:', snapshotRequest.id);
    
    // TODO: Trigger processing (we'll add this in next step)
    
    return NextResponse.json({
      requestId: snapshotRequest.id,
      status: 'queued',
      estimatedTime: '2-3 minutes'
    });
    
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

**Testing Checkpoint 5.1**:
Create `test-api.js`:
```javascript
require('dotenv').config({ path: '.env.local' });

async function testAPI() {
  // Start your Next.js dev server first: npm run dev
  const baseUrl = 'http://localhost:3000';
  
  const testRequests = [
    {
      urls: ['https://mercury.com'],
      topic: 'startup banking'
    },
    {
      urls: ['https://notion.so', 'https://airtable.com'],
      topic: 'project management tools'
    }
  ];
  
  for (const testData of testRequests) {
    console.log(`\n🧪 Testing API with:`, testData);
    
    const response = await fetch(`${baseUrl}/api/snapshot/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log(`✅ Request created with ID: ${result.requestId}`);
    } else {
      console.log(`❌ Request failed: ${result.error}`);
    }
  }
}

testAPI();
```

**To Test**: 
1. Run `npm run dev` in one terminal
2. Run `node test-api.js` in another terminal

**Expected Result**: ✅ API accepts requests, creates records in Supabase

---

This gives us a solid foundation to build on! Each phase has clear testing checkpoints so we can verify data flows correctly before moving to the next step.

Should we start with Phase 1 (Database Setup) and work through each step systematically? 