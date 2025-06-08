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

---

Perfect! This gives us a systematic approach to build and test each component. Should we start with **Phase 1** and set up the database schema first? 

Each phase has clear:
- **Goals** for what we're building
- **Implementation** code with comprehensive logging
- **Testing checkpoints** to verify data flows correctly
- **Expected results** so we know if it's working

Let me know when you're ready to begin with Phase 1, and I'll guide you through each step! 