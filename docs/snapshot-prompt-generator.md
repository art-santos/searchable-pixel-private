# 🔮 Snapshot Prompt Generator Implementation

## Overview

The Snapshot tool tests your visibility for a specific topic by generating realistic user questions and checking if your URL appears in AI-generated recommendations. This gives you objective data on whether AI assistants would actually recommend your product/service.

## User Experience Flow

1. **User Input**: Topic phrase (e.g., "banking for startups", "phones for kids", "zero sugar soda")
2. **Question Generation**: AI creates 5 natural questions people ask about this topic
3. **Visibility Testing**: Each question is tested against AI search tools
4. **Results**: Clear report showing which queries mention your URL and where you rank

## Implementation Architecture

### 1. Input Interface

```typescript
interface SnapshotRequest {
  topic: string;           // "banking for startups"
  targetUrl: string;       // "https://mercury.com"
  targetDomain?: string;   // Auto-extracted from URL
  userEmail?: string;      // For result delivery
}

// Frontend form
function SnapshotForm() {
  return (
    <form onSubmit={handleSubmit}>
      <input 
        placeholder="Enter your topic (e.g., 'startup banking', 'kid-friendly phones')"
        name="topic"
        required
      />
      <input 
        placeholder="Your website URL"
        name="targetUrl"
        type="url"
        required
      />
      <button type="submit">Generate Snapshot</button>
    </form>
  );
}
```

### 2. Question Generation (GPT-4o)

```typescript
const QUESTION_GENERATOR_PROMPT = `You are a helpful assistant that creates realistic user questions based on a given topic.

The questions should be:
- phrased in natural, human language
- framed as searchable prompts someone might ask an AI like ChatGPT or Perplexity
- intended to provoke product, tool, or recommendation-style responses
- written as if from a curious but informed person (founder, parent, researcher, etc.)

Given the topic: **"{TOPIC}"**

Generate 5 different AI-style user questions that reflect real-world phrasing. Avoid generic rephrases — vary the structure and intent.

Examples of good outputs:
- "I just raised a Series A — what's the best bank for startups with international needs?"
- "What are the most secure zero-sugar sodas with no artificial sweeteners?"
- "Compare Step, Greenlight, and Revolut for kids — what's best for a 12-year-old?"

Output exactly 5 questions, numbered 1-5:`;

async function generateQuestions(topic: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: QUESTION_GENERATOR_PROMPT.replace('{TOPIC}', topic)
    }],
    max_tokens: 500,
    temperature: 0.7 // Slight creativity for varied questions
  });

  return parseQuestions(response.choices[0].message.content);
}
```

### 3. Visibility Testing System

```typescript
interface VisibilityTest {
  question: string;
  searchTool: 'gpt4o-search' | 'perplexity' | 'claude-search';
  targetFound: boolean;
  position?: number;
  citedUrls: string[];
  reasoning: string;
}

// Test each question against multiple AI search tools
async function testVisibility(
  question: string, 
  targetDomain: string
): Promise<VisibilityTest[]> {
  const tests = [];
  
  // Test with GPT-4o Web Search
  tests.push(await testGPT4oSearch(question, targetDomain));
  
  // Test with Perplexity (if API available)
  tests.push(await testPerplexity(question, targetDomain));
  
  return tests;
}
```

### 4. GPT-4o Web Search Implementation

```typescript
const SEARCH_TEST_PROMPT = `You are testing visibility for a specific website in AI recommendations.

Question: "{QUESTION}"
Target domain to look for: {TARGET_DOMAIN}

Task:
1. Search for information to answer this question thoroughly
2. Provide your best recommendations/answers
3. List all URLs/domains you would cite or recommend
4. Indicate if {TARGET_DOMAIN} appears in your recommendations

Format your response as:
ANSWER: [Your natural response to the question]

SOURCES CITED: [List all domains/URLs you referenced]

TARGET DOMAIN FOUND: [Yes/No]
POSITION: [If yes, what position in your recommendations? 1st, 2nd, etc.]
REASONING: [Why you did/didn't include the target domain]`;

async function testGPT4oSearch(
  question: string, 
  targetDomain: string
): Promise<VisibilityTest> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: SEARCH_TEST_PROMPT
        .replace('{QUESTION}', question)
        .replace('{TARGET_DOMAIN}', targetDomain)
        .replace('{TARGET_DOMAIN}', targetDomain) // Replace both instances
    }],
    max_tokens: 1000,
    // Enable web search if using OpenAI with web browsing
    tools: [{ type: "web_search" }] // If available
  });

  return parseVisibilityResult(response.choices[0].message.content, question);
}
```

### 5. Results Processing & Storage

```typescript
interface SnapshotResult {
  id: string;
  topic: string;
  targetUrl: string;
  targetDomain: string;
  questions: string[];
  visibilityTests: VisibilityTest[];
  overallScore: number;
  recommendations: string[];
  createdAt: Date;
}

// Calculate visibility score
function calculateVisibilityScore(tests: VisibilityTest[]): number {
  const totalQuestions = tests.length;
  const mentionedCount = tests.filter(t => t.targetFound).length;
  const positionBonus = tests.reduce((acc, test) => {
    if (test.targetFound && test.position) {
      // Higher score for better positions
      return acc + Math.max(0, 6 - test.position); // 1st=5pts, 2nd=4pts, etc.
    }
    return acc;
  }, 0);
  
  const baseScore = (mentionedCount / totalQuestions) * 70; // 70% for mentions
  const positionScore = (positionBonus / (totalQuestions * 5)) * 30; // 30% for position
  
  return Math.round(baseScore + positionScore);
}
```

### 6. Database Schema

```sql
-- Snapshot requests
CREATE TABLE snapshot_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  topic TEXT NOT NULL,
  target_url TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated questions
CREATE TABLE snapshot_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES snapshot_requests(id),
  question TEXT NOT NULL,
  question_number INTEGER NOT NULL
);

-- Visibility test results
CREATE TABLE visibility_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES snapshot_questions(id),
  search_tool TEXT NOT NULL, -- 'gpt4o-search', 'perplexity', etc.
  target_found BOOLEAN NOT NULL,
  position INTEGER,
  cited_urls TEXT[],
  reasoning TEXT,
  raw_response JSONB,
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Final snapshot results
CREATE TABLE snapshot_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES snapshot_requests(id),
  overall_score INTEGER NOT NULL,
  visibility_percentage DECIMAL,
  recommendations TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Queue Processing

```typescript
// Supabase Edge Function for processing snapshots
async function processSnapshotQueue() {
  const { data: pendingSnapshots } = await supabase
    .from('snapshot_requests')
    .select('*')
    .eq('status', 'pending')
    .limit(1);

  for (const snapshot of pendingSnapshots) {
    try {
      // Mark as processing
      await supabase
        .from('snapshot_requests')
        .update({ status: 'processing' })
        .eq('id', snapshot.id);

      // Generate questions
      const questions = await generateQuestions(snapshot.topic);
      
      // Store questions
      const questionRecords = await Promise.all(
        questions.map((q, i) => 
          supabase.from('snapshot_questions').insert({
            snapshot_id: snapshot.id,
            question: q,
            question_number: i + 1
          }).select().single()
        )
      );

      // Test each question
      for (const questionRecord of questionRecords) {
        const tests = await testVisibility(
          questionRecord.data.question, 
          snapshot.target_domain
        );

        // Store test results
        await Promise.all(
          tests.map(test => 
            supabase.from('visibility_tests').insert({
              question_id: questionRecord.data.id,
              search_tool: test.searchTool,
              target_found: test.targetFound,
              position: test.position,
              cited_urls: test.citedUrls,
              reasoning: test.reasoning
            })
          )
        );
      }

      // Calculate final score and generate recommendations
      const allTests = await getTestsForSnapshot(snapshot.id);
      const score = calculateVisibilityScore(allTests);
      const recommendations = await generateRecommendations(snapshot, allTests);

      // Store final results
      await supabase.from('snapshot_results').insert({
        snapshot_id: snapshot.id,
        overall_score: score,
        visibility_percentage: (allTests.filter(t => t.targetFound).length / allTests.length) * 100,
        recommendations
      });

      // Mark as completed
      await supabase
        .from('snapshot_requests')
        .update({ status: 'completed' })
        .eq('id', snapshot.id);

    } catch (error) {
      console.error('Snapshot processing failed:', error);
      await supabase
        .from('snapshot_requests')
        .update({ 
          status: 'failed',
          error_message: error.message 
        })
        .eq('id', snapshot.id);
    }
  }
}
```

### 8. Results UI

```typescript
function SnapshotResults({ snapshotId }: { snapshotId: string }) {
  const { snapshot, questions, tests, results } = useSnapshotData(snapshotId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#161616] border border-[#222222] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          Snapshot: "{snapshot.topic}"
        </h2>
        <div className="flex items-center gap-4">
          <ScoreBadge score={results.overall_score} />
          <span className="text-[#888]">
            Mentioned in {results.visibility_percentage}% of searches
          </span>
        </div>
      </div>

      {/* Question Results */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          const questionTests = tests.filter(t => t.question_id === question.id);
          return (
            <QuestionCard 
              key={question.id}
              question={question.question}
              tests={questionTests}
              targetDomain={snapshot.target_domain}
            />
          );
        })}
      </div>

      {/* Recommendations */}
      <div className="bg-[#161616] border border-[#222222] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Recommendations
        </h3>
        <ul className="space-y-2">
          {results.recommendations.map((rec, index) => (
            <li key={index} className="text-[#ccc] flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## Cost Analysis

**Per Snapshot (5 questions):**
- **Question Generation**: ~500 tokens × $0.005 = $0.0025
- **Visibility Tests**: 5 questions × 1000 tokens × $0.015 = $0.075
- **Total**: ~$0.08 per snapshot

**Very affordable for frequent testing!**

## Key Benefits

1. **User-Controlled**: Test exactly what you want to rank for
2. **Objective Results**: Real search results, not opinions
3. **Actionable Data**: Know exactly which queries you're missing
4. **Competitive Intel**: See who appears instead of you
5. **Cost-Effective**: <$0.10 per comprehensive test

This approach gives much more actionable insights than trying to reverse-engineer what a page should rank for! 