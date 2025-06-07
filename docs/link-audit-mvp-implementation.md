# Link Audit MVP Implementation Plan

## Overview

The Link Audit feature analyzes URLs for **Answer Engine Optimization (AEO)** - optimizing content to appear in AI-generated answers from chatbots and search assistants. Unlike traditional SEO that targets search engine rankings, AEO focuses on making content visible and citable within LLM-based responses.

## 1. Setup and Project Structure

### Tech Stack & Configuration
- **Frontend**: Next.js 13+ (React, Node.js runtime)
- **Backend**: Supabase (database + Edge Functions)
- **Scraping**: Firecrawl API (`@mendable/firecrawl-js`)
- **AI Analysis**: Vercel AI SDK (`ai` package with OpenAI GPT-4o)

### Required Environment Variables
```env
FIRECRAWL_API_KEY=your_firecrawl_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation Dependencies
```bash
npm install @mendable/firecrawl-js ai @supabase/supabase-js
```

### Input Interface
- **URL Input**: Form accepting up to 10 URLs (comma/newline separated)
- **Topic Input**: User-provided topic/phrase for visibility testing (e.g., "startup banking", "phones for kids")
- **Sitemap Support**: Accept sitemap.xml URL and parse first 10 `<loc>` entries
- **Validation**: URL format validation and 10-URL limit enforcement
- **XML Parsing**: Lightweight XML parser or DOMParser for sitemap extraction

## 2. Queueing Architecture for URL Processing

### Task Queue Design
Using **Supabase Queues** (Postgres-native message queue) for durable task management:

```sql
-- Example table structure
CREATE TABLE link_audit_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);
```

### Enqueue Operation
```typescript
// API route for enqueueing URLs
export async function POST(request: Request) {
  const { urls, topic } = await request.json();
  
  if (!topic) {
    return new Response('Topic is required for visibility testing', { status: 400 });
  }
  
  for (const url of urls.slice(0, 10)) {
    await supabase
      .from('link_audit_tasks')
      .insert({
        url,
        topic,
        user_id: user.id,
        status: 'pending'
      });
  }
  
  // Trigger processing function
  await supabase.functions.invoke('process-link-audit-queue');
}
```

### Background Processing (Edge Function)
- **Supabase Edge Function** (TypeScript/Deno) as queue worker
- **Scheduling**: Cron job every 10 seconds or manual trigger after enqueuing
- **Sequential Processing**: One URL at a time to respect rate limits
- **Error Handling**: Mark failed tasks, continue with next URL
- **Timeout**: ~150s limit on Supabase free plan (sufficient for 10 URLs)

### Real-time Updates
```typescript
// Frontend subscription to results
const { data, error } = supabase
  .from('link_audit_results')
  .on('INSERT', payload => {
    // Update UI with new result
    updateResultInUI(payload.new);
  })
  .subscribe();
```

## 3. Scraping Pipeline (Firecrawl Integration)

### Firecrawl API Integration
```typescript
import FirecrawlApp from '@mendable/firecrawl-js';

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

const result = await app.scrapeUrl(url, {
  formats: ['html', 'markdown', 'json']
});
```

### SSR vs CSR Detection
```typescript
async function detectRenderingType(url: string) {
  // 1. Basic HTTP GET (no JS)
  const initialResponse = await fetch(url);
  const initialHtml = await initialResponse.text();
  
  // 2. Full render via Firecrawl
  const renderedResult = await app.scrapeUrl(url);
  
  // 3. Compare content
  const hasInitialContent = initialHtml.includes('<h1') || 
                           initialHtml.includes('main content indicators');
  
  return hasInitialContent ? 'SSR' : 'CSR';
}
```

### HTML Content Parsing
```typescript
interface PageAnalysis {
  title: string;
  metaDescription: string;
  canonical: string | null;
  isSSR: boolean;
  schemaTypes: string[];
  h1: string | null;
  h2s: string[];
  internalLinkCount: number;
}

function parsePageContent(html: string, url: string): PageAnalysis {
  const $ = cheerio.load(html);
  const domain = new URL(url).hostname;
  
  return {
    title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
    metaDescription: $('meta[name="description"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || null,
    isSSR: detectRenderingType(url), // from above
    schemaTypes: extractSchemaTypes($),
    h1: $('h1').first().text() || null,
    h2s: $('h2').map((i, el) => $(el).text()).get(),
    internalLinkCount: countInternalLinks($, domain)
  };
}

function extractSchemaTypes($: CheerioStatic): string[] {
  const schemas = new Set<string>();
  
  // JSON-LD
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const data = JSON.parse($(el).html() || '');
      if (data['@type']) schemas.add(data['@type']);
    } catch (e) {}
  });
  
  // Microdata
  $('[itemtype]').each((i, el) => {
    const itemtype = $(el).attr('itemtype');
    if (itemtype) {
      const type = itemtype.split('/').pop();
      if (type) schemas.add(type);
    }
  });
  
  return Array.from(schemas);
}
```

## 4. LLM Visibility Testing (Snapshot Approach)

**Objective Visibility Testing**: Instead of asking subjective questions, we test real visibility by generating realistic user questions and checking if the target URL appears in GPT-4o search results.

### User Input for Visibility Testing
```typescript
interface VisibilityTestInput {
  url: string;              // The URL being audited
  topic: string;            // User-provided topic (e.g., "startup banking")
  targetDomain: string;     // Extracted from URL
}
```

### Question Generation
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

### Visibility Testing Implementation
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

async function testVisibility(question: string, targetDomain: string): Promise<VisibilityTest> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: SEARCH_TEST_PROMPT
        .replace('{QUESTION}', question)
        .replace('{TARGET_DOMAIN}', targetDomain)
        .replace('{TARGET_DOMAIN}', targetDomain)
    }],
    max_tokens: 1000,
    tools: [{ type: "web_search" }] // Enable web search if available
  });

  return parseVisibilityResult(response.choices[0].message.content, question);
}

async function performLLMAnalysis(pageData: PageAnalysis, topic: string): Promise<{
  llmMention: boolean;
  competitors: string[];
  questions: string[];
  visibilityResults: VisibilityTest[];
}> {
  const targetDomain = new URL(pageData.url).hostname;
  
  try {
    // Generate realistic questions for the topic
    const questions = await generateQuestions(topic);
    
    // Test each question for visibility
    const visibilityResults = await Promise.all(
      questions.map(question => testVisibility(question, targetDomain))
    );
    
    // Extract competitors and calculate mention status
    const allCompetitors = visibilityResults.flatMap(result => result.citedUrls);
    const uniqueCompetitors = [...new Set(allCompetitors)].filter(url => !url.includes(targetDomain));
    const mentionCount = visibilityResults.filter(result => result.targetFound).length;
    
    return {
      llmMention: mentionCount > 0,
      competitors: uniqueCompetitors,
      questions,
      visibilityResults
    };
  } catch (error) {
    console.error('LLM Analysis failed:', error);
    return { 
      llmMention: false, 
      competitors: [], 
      questions: [],
      visibilityResults: []
    };
  }
}
```

## 5. AEO Scoring Model

### Scoring Rubric (100-point scale)
```typescript
interface ScoringWeights {
  contentRendering: 10;    // SSR vs CSR
  titleMeta: 10;          // Title & meta description
  canonical: 5;           // Canonical URL
  headingStructure: 15;   // H1 and H2 organization
  internalLinks: 10;      // Internal link count
  structuredData: 15;     // Schema markup
  llmVisibility: 20;      // AI mention likelihood
  competitorAnalysis: 10; // Competitor dominance
  // Total: 100
}

function calculateAEOScore(analysis: PageAnalysis, llmData: LLMAnalysis): {
  score: number;
  breakdown: Record<string, number>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
} {
  const scores = {
    contentRendering: analysis.isSSR ? 10 : 0,
    titleMeta: (analysis.title ? 5 : 0) + (analysis.metaDescription ? 5 : 0),
    canonical: analysis.canonical ? 5 : 0,
    headingStructure: calculateHeadingScore(analysis.h1, analysis.h2s),
    internalLinks: Math.min(analysis.internalLinkCount / 2, 10), // 2 links = 1 point, cap at 10
    structuredData: Math.min(analysis.schemaTypes.length * 5, 15),
    llmVisibility: llmData.llmMention ? 20 : 0,
    competitorAnalysis: calculateCompetitorScore(llmData.competitors, llmData.llmMention)
  };
  
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  return {
    score: totalScore,
    breakdown: scores,
    grade: getLetterGrade(totalScore)
  };
}
```

### Data Storage Schema
```sql
-- Link audit tasks (main queue)
CREATE TABLE link_audit_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  topic TEXT NOT NULL, -- User-provided topic for visibility testing
  status TEXT DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Generated questions for visibility testing
CREATE TABLE audit_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES link_audit_tasks(id),
  question TEXT NOT NULL,
  question_number INTEGER NOT NULL
);

-- Visibility test results
CREATE TABLE visibility_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES audit_questions(id),
  target_found BOOLEAN NOT NULL,
  position INTEGER,
  cited_urls TEXT[],
  reasoning TEXT,
  raw_response JSONB,
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Final audit results
CREATE TABLE link_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES link_audit_tasks(id),
  url TEXT NOT NULL,
  topic TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  canonical TEXT,
  is_ssr BOOLEAN,
  schema_types TEXT[],
  h1 TEXT,
  h2s TEXT[],
  internal_link_count INTEGER,
  llm_mention BOOLEAN,
  competitors TEXT[],
  visibility_questions TEXT[],
  visibility_percentage DECIMAL,
  score INTEGER,
  score_breakdown JSONB,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 6. UI Display and Reporting

### Results List Component
```typescript
interface URLResult {
  url: string;
  status: 'processing' | 'completed' | 'failed';
  title?: string;
  score?: number;
  grade?: string;
  recommendations?: string[];
}

function ResultsList({ results }: { results: URLResult[] }) {
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <ResultCard key={index} result={result} />
      ))}
    </div>
  );
}

function ResultCard({ result }: { result: URLResult }) {
  return (
    <div className="bg-[#161616] border border-[#222222] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium truncate">{result.url}</h3>
        <StatusBadge status={result.status} />
      </div>
      
      {result.status === 'completed' && (
        <div className="space-y-3">
          <ScoreBadge score={result.score} grade={result.grade} />
          <RecommendationsList recommendations={result.recommendations} />
        </div>
      )}
    </div>
  );
}
```

### Detailed Analysis View
- **Page Metadata**: Title, meta description, canonical URL
- **Technical Factors**: SSR/CSR status, schema types, heading structure
- **Content Analysis**: Internal links, content organization
- **AI Visibility**: LLM mention status, competitor analysis
- **Actionable Recommendations**: AI-generated improvement suggestions

### Recommendation Generation
```typescript
async function generateRecommendations(analysis: PageAnalysis, score: AEOScore): Promise<string[]> {
  const issues = identifyIssues(analysis, score);
  
  const prompt = `Based on these AEO analysis findings, suggest 3-5 specific, actionable improvements:

Issues found: ${issues.join(', ')}
Current score: ${score.score}/100

Provide concrete recommendations to improve AI visibility and answer engine optimization.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // Using GPT-4o for optimal cost/performance
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 400
  });

  return parseRecommendations(response.choices[0].message.content);
}
```

## 7. Development Architecture

### Project Structure
```
src/
├── app/
│   ├── dashboard/
│   │   └── snapshot/
│   │       ├── page.tsx
│   │       └── components/
│   └── api/
│       └── link-audit/
│           ├── enqueue/
│           └── results/
├── lib/
│   ├── firecrawl.ts
│   ├── llm-analysis.ts
│   ├── scoring.ts
│   └── queue.ts
└── supabase/
    └── functions/
        └── process-link-audit/
```

### Edge Function Implementation
```typescript
// supabase/functions/process-link-audit/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { processAuditQueue } from './audit-processor.ts';

serve(async (req) => {
  try {
    await processAuditQueue();
    return new Response('Queue processed successfully', { status: 200 });
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});
```

## 8. Performance Considerations

### Rate Limiting
- **Sequential Processing**: One URL at a time to respect API limits
- **Timeout Handling**: Graceful failure for slow responses
- **Retry Logic**: Exponential backoff for failed requests

### Cost Optimization
- **Token Management**: Concise prompts to minimize OpenAI costs
- **Caching**: Store results to avoid re-processing identical URLs
- **Batch Operations**: Group database operations when possible

### Cost Analysis (GPT-4o Pricing)
**Per URL Analysis:**
- **Question Generation**: ~500 tokens × $0.005 = $0.0025
- **Visibility Testing**: 5 questions × 1000 tokens × $0.015 = $0.075
- **Total GPT-4o cost**: **$0.0775 per URL**

**Per 10-URL Batch:**
- **Firecrawl**: ~$0.10-0.50
- **GPT-4o**: ~$0.775 (for all visibility testing)
- **Total**: **$0.875-1.275 per audit** (still very economical!)

## 9. Testing Strategy

### MVP Validation
1. **Test Cases**: Variety of page types (SSR/CSR, different schema types)
2. **Score Validation**: Manual verification of scoring accuracy
3. **Performance Testing**: 10-URL batch processing within time limits
4. **Error Handling**: Network failures, malformed URLs, API timeouts

### Quality Assurance
- **Cross-reference**: Compare LLM analysis with manual assessment
- **Score Calibration**: Adjust weights based on real-world testing
- **UI Testing**: Real-time updates, responsive design

## 10. Future Enhancements

### Phase 2 Features
- **Bulk Processing**: Support for larger URL sets
- **Historical Tracking**: Score changes over time
- **Competitive Analysis**: Direct competitor comparison
- **Custom Scoring**: User-defined weight preferences
- **API Access**: Public API for programmatic access
- **Multiple Search Tools**: Test against Perplexity, Claude, etc.

### Advanced Analytics
- **Performance Metrics**: Page load speed analysis
- **Mobile Optimization**: Mobile-specific AEO factors
- **Content Gaps**: AI-identified missing content opportunities
- **Trend Analysis**: Industry benchmark comparisons

---

## Quick Start Checklist

- [ ] Set up Supabase project with database tables
- [ ] Configure Firecrawl API access  
- [ ] Set up OpenAI API key with web search capabilities
- [ ] Create Edge Function for queue processing
- [ ] Implement frontend form (URLs + topic input)
- [ ] Build question generation with GPT-4o
- [ ] Create visibility testing system
- [ ] Build results display with real-time updates
- [ ] Test end-to-end with sample URLs and topics
- [ ] Deploy and validate performance

This implementation plan provides comprehensive Link Audit functionality combining technical page analysis with objective visibility testing for Answer Engine Optimization. 