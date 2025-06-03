# MAX Visibility Pipeline Architecture - CLEANED

## 🎯 **System Overview**

The MAX Visibility system analyzes how AI engines (like Perplexity, ChatGPT, Claude) actually talk about your brand in real conversations. Unlike traditional SEO which focuses on search rankings, MAX measures **AI conversation visibility** - how often and how positively AI mentions your company when users ask relevant questions.

---

## 📊 **Complete Data Flow Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Data Source   │───▶│  Question Gen    │───▶│  AI Responses   │───▶│  GPT-4o Analysis │
│                 │    │                  │    │                 │    │                  │
│ • Company Info  │    │ • 50 Questions   │    │ • Perplexity    │    │ • Mention Detect │
│ • Domain        │    │ • 5 Types        │    │ • Real Answers  │    │ • Sentiment      │
│ • Industry      │    │ • Conversational │    │ • Citations     │    │ • Competitors    │
│ • Description   │    │ • Context-aware  │    │ • Sources       │    │ • Topics         │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └──────────────────┘
                                                                                    │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐                │
│  Final Output   │◀───│   Database       │◀───│  Scoring &      │◀───────────────┘
│                 │    │                  │    │  Ranking        │
│ • Visibility    │    │ • Competitors    │    │                 │
│ • Competitive   │    │ • Topics         │    │ • Mention Rate  │
│ • Citations     │    │ • Mentions       │    │ • Sentiment     │
│ • Recommendations│   │ • Scores         │    │ • Citations     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🔄 **Step-by-Step Process**

### **Step 1: Knowledge Base-Driven Company Context**

**Process:** Pull and structure company intelligence from the knowledge base

**Input:** User's knowledge base entries from the content page
```typescript
interface KnowledgeBaseEntry {
  id: number
  content: string
  tag: string                // 'company-overview', 'target-audience', etc.
  createdAt: string
  wordCount: number
}

interface KnowledgeBaseTags {
  'company-overview': string[]     // "Split is an AI-powered content generation platform..."
  'target-audience': string[]      // "B2B SaaS companies with 50-500 employees..."
  'pain-points': string[]          // "Manual content creation is time-consuming..."
  'positioning': string[]          // "Unlike generic AI writing tools, Split focuses..."
  'sales-objections': string[]     // "AI content lacks authenticity - Response: Our AI..."
  'product-features': string[]     // Core capabilities and differentiators
  'use-cases': string[]            // Primary use cases and applications
  'keywords': string[]             // Target keywords and phrases
  'competitor-notes': string[]     // Competitive intelligence and positioning
  'brand-voice': string[]          // Tone, style, and messaging guidelines
  'other': string[]                // Miscellaneous company intelligence
}
```

**Knowledge Base Processing Logic:**
```typescript
async function buildCompanyContext(companyId: string): Promise<EnhancedCompanyContext> {
  // 1. Get basic company info
  const basicInfo = await getCompanyBasicInfo(companyId)
  
  // 2. Fetch all knowledge base entries for this company
  const knowledgeEntries = await supabase
    .from('knowledge_base_items')
    .select('*')
    .eq('company_id', companyId)
  
  // 3. Group by tags
  const groupedKnowledge = groupKnowledgeByTags(knowledgeEntries)
  
  // 4. Use GPT-4o to extract structured insights
  const structuredInsights = await analyzeKnowledgeWithGPT4o({
    knowledgeBase: groupedKnowledge,
    basicInfo
  })
  
  return {
    // Basic info (existing)
    name: basicInfo.name,
    domain: basicInfo.domain,
    
    // Rich context from knowledge base
    overview: groupedKnowledge['company-overview'] || [],
    targetAudience: groupedKnowledge['target-audience'] || [],
    painPoints: groupedKnowledge['pain-points'] || [],
    positioning: groupedKnowledge['positioning'] || [],
    productFeatures: groupedKnowledge['product-features'] || [],
    useCases: groupedKnowledge['use-cases'] || [],
    competitors: extractCompetitors(groupedKnowledge['competitor-notes']),
    brandVoice: groupedKnowledge['brand-voice'] || [],
    keywords: groupedKnowledge['keywords'] || [],
    
    // GPT-4o enhanced insights
    industryCategory: structuredInsights.inferredIndustry,
    companySize: structuredInsights.inferredSize,
    businessModel: structuredInsights.inferredModel,
    aliases: structuredInsights.brandAliases
  }
}
```

**GPT-4o Knowledge Analysis:**
```typescript
const knowledgeAnalysisPrompt = `
Analyze this company's knowledge base and extract structured insights:

COMPANY: ${basicInfo.name}
DOMAIN: ${basicInfo.domain}

KNOWLEDGE BASE:
${Object.entries(groupedKnowledge).map(([tag, items]) => 
  `${tag.toUpperCase()}:\n${items.join('\n\n')}`
).join('\n\n---\n\n')}

Extract and infer:
1. INDUSTRY_CATEGORY: What industry/category does this company operate in?
2. COMPANY_SIZE: Startup, small, medium, or enterprise based on context clues?
3. BUSINESS_MODEL: B2B SaaS, marketplace, services, etc.?
4. BRAND_ALIASES: What other names/terms might people use to refer to this company?
5. COMPETITIVE_LANDSCAPE: Who are the main competitors mentioned or implied?
6. UNIQUE_VALUE_PROPS: What are the key differentiators?
7. TARGET_PERSONAS: Who are the primary buyer personas?

Respond in JSON format with high confidence insights only.
`
```

**Fallback Handling:**
```typescript
// If knowledge base is empty or minimal, use basic inference
function createMinimalContext(basicInfo: CompanyBasicInfo): CompanyContext {
  const domain = basicInfo.domain.replace(/^https?:\/\//, '').replace(/^www\./, '')
  const inferredCategory = inferCategoryFromDomain(domain)
  
  return {
    name: basicInfo.name,
    domain: basicInfo.domain,
    industry: inferredCategory,
    description: `${basicInfo.name} is a ${inferredCategory} company`,
    aliases: [basicInfo.name, domain.split('.')[0]],
    owned_domains: [basicInfo.domain],
    operated_domains: []
  }
}
```

**Output:** Rich company context ready for intelligent question generation
```json
{
  "name": "Split",
  "domain": "split.dev",
  "overview": ["Split is an AI-powered content generation platform that helps B2B companies..."],
  "targetAudience": ["B2B SaaS companies with 50-500 employees", "Marketing teams struggling with..."],
  "painPoints": ["Manual content creation is time-consuming", "Maintaining consistent brand voice..."],
  "positioning": ["Unlike generic AI writing tools, Split focuses specifically on B2B content strategy"],
  "competitors": ["Jasper", "Copy.ai", "Writesonic"],
  "industryCategory": "AI/Content Marketing",
  "companySize": "startup",
  "businessModel": "B2B SaaS"
}
```

**Source:** 
- User's knowledge base entries from content page
- GPT-4o analysis of knowledge base content
- Basic company profile information
- Intelligent inference when data is missing

---

### **Step 2: Conversational Question Generation**

**Process:** Generate 50 AI-style questions across 5 categories

**Question Types & Distribution:**
1. **Direct Conversational (30%)** - Brand-specific questions
2. **Indirect Conversational (25%)** - Competitive landscape 
3. **Comparison Queries (20%)** - Direct comparisons
4. **Recommendation Requests (15%)** - Recommendation seeking
5. **Explanatory Queries (10%)** - Educational questions

**Question Generation Logic:**
```typescript
// Template-based generation with dynamic variables
const questionTemplates = {
  direct_conversational: [
    "Help me understand what {company} does and if it's right for my {use_case}",
    "I'm evaluating {company} - what should I know about their pricing and features?",
    "Compare {company} to their main competitors for {industry} use"
  ],
  
  indirect_conversational: [
    "What are the best {category} platforms for {company_size} companies?",
    "I need to choose a {solution_type} for my startup - what are my options?",
    "Help me understand the {industry} landscape and key players"
  ],
  
  comparison_query: [
    "Compare {company} vs {competitor1} vs {competitor2} for {use_case}",
    "What's the difference between {company} and {competitor1}?",
    "{company} or {competitor1} - which is better for {specific_need}?"
  ]
}

// Context-aware variable replacement
const generateQuestion = (template: string, context: CompanyContext) => {
  return template
    .replace('{company}', context.name)
    .replace('{category}', inferCategory(context.industry))
    .replace('{use_case}', generateUseCase(context.description))
    .replace('{competitor1}', inferCompetitor(context.industry))
}
```

**Output:** 50 conversational questions ready for AI engines
```json
[
  {
    "id": "q1",
    "question": "What are the best AI sales automation platforms for B2B startups?",
    "type": "indirect_conversational",
    "expected_competitors": ["salesforce", "hubspot", "clay", "apollo"]
  },
  {
    "id": "q2", 
    "question": "Help me understand what Origami Agents does and if it's right for sales prospecting",
    "type": "direct_conversational",
    "targets_user_brand": true
  }
]
```

---

### **Step 3: AI Response Collection**

**Process:** Query Perplexity AI with each question to get real conversational responses

**Perplexity Integration:**
```typescript
interface PerplexityQuery {
  query: string                    // The generated question
  return_citations: true           // Get source URLs
  return_related_questions: false  // Focus on primary response
  search_domain_filter: []         // No domain restrictions
}

interface PerplexityResponse {
  choices: [{
    message: {
      content: string             // The AI's conversational response
      role: 'assistant'
    }
  }]
  citations: string[]             // Source URLs that influenced the response
  usage: {
    prompt_tokens: number
    completion_tokens: number
  }
}
```

**Example Response Collection:**
```json
{
  "question": "What are the best AI sales automation platforms?",
  "ai_response": "For AI sales automation, several platforms stand out. Salesforce Einstein offers robust CRM integration with AI-powered insights. HubSpot provides excellent marketing automation with AI scoring. Clay.com excels at data enrichment and automated prospecting. Apollo.io offers comprehensive outbound sales automation. For specialized AI research agents, Origami Agents provides unique capabilities in prospect research and lead qualification.",
  "citations": [
    "https://salesforce.com/products/einstein/",
    "https://hubspot.com/ai",
    "https://clay.com/features", 
    "https://apollo.io/automation",
    "https://origamiagents.com/features"
  ]
}
```

**Rate Limiting & Batch Processing:**
- Process 10 questions per batch
- 500ms delay between batches  
- Retry logic with exponential backoff
- Progress tracking for real-time updates

---

### **Step 4: GPT-4o Intelligent Analysis**

**This is where the magic happens** - Instead of heuristic parsing, we use GPT-4o to intelligently analyze all responses.

**GPT-4o Analysis Prompt:**
```
You are an expert AI visibility analyst. Analyze this conversational AI response for brand mentions, competitive positioning, and citation influence.

COMPANY CONTEXT:
- Target Company: {company_name}
- Domain: {company_domain}  
- Industry: {industry}
- Description: {description}

QUESTION ASKED:
"{question}"

AI RESPONSE TO ANALYZE:
"{ai_response}"

CITATIONS PROVIDED:
{citations_list}

ANALYZE AND PROVIDE:

1. MENTION ANALYSIS:
   - mention_detected: boolean
   - mention_position: "primary" | "secondary" | "passing" | "none"
   - mention_sentiment: "very_positive" | "positive" | "neutral" | "negative" | "very_negative"
   - mention_context: string (exact quote mentioning the company)
   - confidence_score: number (0-1)

2. COMPETITOR ANALYSIS:
   - Extract ALL company/product mentions in the response
   - For each competitor found:
     * company_name: string
     * domain: string (infer from context)
     * mention_position: "primary" | "secondary" | "passing"
     * sentiment: "very_positive" | "positive" | "neutral" | "negative" | "very_negative"
     * context: string (quote mentioning this competitor)

3. CITATION ANALYSIS:
   - For each citation URL, classify into:
     * "owned": Target company's own content
     * "operated": Target company's social/platform profiles
     * "earned": Third-party content mentioning target company
     * "competitor": Competitor's content
   - influence_score: number (0-1) - how much this source influenced the response

4. TOPIC EXTRACTION:
   - Primary topics discussed in the response
   - Relevance to target company (0-1)
   - Sentiment for each topic

5. INSIGHTS:
   - Overall competitive positioning in this response
   - Content gaps or opportunities identified
   - Recommendations for improving visibility

RESPOND IN VALID JSON FORMAT ONLY.
```

**Expected GPT-4o Output:**
```json
{
  "mention_analysis": {
    "mention_detected": true,
    "mention_position": "secondary", 
    "mention_sentiment": "positive",
    "mention_context": "For specialized AI research agents, Origami Agents provides unique capabilities in prospect research and lead qualification.",
    "confidence_score": 0.95
  },
  
  "competitor_analysis": [
    {
      "company_name": "Salesforce",
      "domain": "salesforce.com",
      "mention_position": "primary",
      "sentiment": "positive", 
      "context": "Salesforce Einstein offers robust CRM integration with AI-powered insights"
    },
    {
      "company_name": "HubSpot",
      "domain": "hubspot.com", 
      "mention_position": "primary",
      "sentiment": "positive",
      "context": "HubSpot provides excellent marketing automation with AI scoring"
    }
  ],
  
  "citation_analysis": [
    {
      "url": "https://origamiagents.com/features",
      "bucket": "owned",
      "influence_score": 0.8,
      "relevance_score": 0.9
    },
    {
      "url": "https://salesforce.com/products/einstein/",
      "bucket": "competitor", 
      "influence_score": 0.9,
      "relevance_score": 0.8
    }
  ],
  
  "topic_analysis": [
    {
      "topic": "AI Sales Automation",
      "relevance": 0.9,
      "sentiment": "positive",
      "company_strength": 0.7
    },
    {
      "topic": "Prospect Research", 
      "relevance": 0.8,
      "sentiment": "very_positive",
      "company_strength": 0.9
    }
  ],
  
  "insights": {
    "competitive_position": "Strong in specialized AI research, but lower visibility than Salesforce/HubSpot",
    "content_opportunities": ["Create more content about CRM integration", "Highlight AI automation capabilities"],
    "visibility_score": 0.75
  }
}
```

---

### **Step 5: Scoring & Ranking Algorithm**

**Process:** Aggregate all GPT-4o analyses to calculate final scores

**Mention Rate Calculation:**
```typescript
const calculateMentionRate = (analyses: GPTAnalysis[]) => {
  const totalQuestions = analyses.length
  const mentionedQuestions = analyses.filter(a => a.mention_analysis.mention_detected).length
  return mentionedQuestions / totalQuestions // 0-1 score
}
```

**Competitive Ranking:**
```typescript
const calculateCompetitiveRanking = (analyses: GPTAnalysis[]) => {
  // Aggregate all competitor mentions across responses
  const competitorMentions = new Map<string, {
    mentions: number,
    sentiments: number[],
    total_score: number
  }>()
  
  analyses.forEach(analysis => {
    analysis.competitor_analysis.forEach(competitor => {
      const existing = competitorMentions.get(competitor.company_name) || {
        mentions: 0, sentiments: [], total_score: 0
      }
      
      existing.mentions++
      existing.sentiments.push(sentimentToNumber(competitor.sentiment))
      existing.total_score = existing.mentions * avgSentiment(existing.sentiments)
      
      competitorMentions.set(competitor.company_name, existing)
    })
  })
  
  // Convert to ranked list
  return Array.from(competitorMentions.entries())
    .map(([name, data]) => ({
      name,
      mentions: data.mentions,
      mention_rate: data.mentions / totalIndirectQueries,
      sentiment_avg: avgSentiment(data.sentiments),
      visibility_score: data.total_score
    }))
    .sort((a, b) => b.visibility_score - a.visibility_score)
    .map((competitor, index) => ({ ...competitor, rank: index + 1 }))
}
```

**Final Visibility Score:**
```typescript
const calculateVisibilityScore = (data: AggregatedData) => {
  const mentionRate = data.mention_rate * 0.40        // 40% weight
  const mentionQuality = data.avg_mention_quality * 0.25  // 25% weight  
  const sourceInfluence = data.citation_influence * 0.20  // 20% weight
  const competitivePosition = data.competitive_score * 0.10 // 10% weight
  const consistency = data.response_consistency * 0.05     // 5% weight
  
  return (mentionRate + mentionQuality + sourceInfluence + competitivePosition + consistency) * 100
}
```

---

### **Step 6: Database Storage**

**Process:** Store all analyzed data in structured database tables

**Core Tables & Data Flow:**
```sql
-- Main assessment record
INSERT INTO max_visibility_runs (
  company_id, total_score, mention_rate, sentiment_score, 
  citation_score, competitive_score, status
) VALUES (?, ?, ?, ?, ?, ?, 'completed');

-- Each question asked
INSERT INTO max_visibility_questions (
  run_id, question, question_type, position
) VALUES (?, ?, ?, ?);

-- AI responses with GPT-4o analysis
INSERT INTO max_visibility_responses (
  question_id, full_response, mention_detected, 
  mention_position, mention_sentiment, mention_context
) VALUES (?, ?, ?, ?, ?, ?);

-- Extracted citations
INSERT INTO max_visibility_citations (
  response_id, citation_url, bucket, influence_score
) VALUES (?, ?, ?, ?);

-- Competitive ranking
INSERT INTO max_visibility_competitors (
  run_id, competitor_name, competitor_domain, mention_count,
  mention_rate, sentiment_average, ai_visibility_score, rank_position
) VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- Topic analysis
INSERT INTO max_visibility_topics (
  run_id, topic_name, mention_count, mention_percentage,
  sentiment_score, rank_position
) VALUES (?, ?, ?, ?, ?, ?);
```

---

### **Step 7: Final Output & API Response**

**Process:** Transform database data into API response format

**Final API Output:**
```json
{
  "success": true,
  "data": {
    "score": {
      "overall_score": 68.5,
      "mention_rate": 0.24,
      "sentiment_score": 0.3,
      "citation_score": 75.2,
      "competitive_score": 65.8,
      "consistency_score": 82.1
    },
    
    "competitive": {
      "current_rank": 3,
      "total_competitors": 5,
      "competitors": [
        {
          "name": "Salesforce",
          "domain": "salesforce.com", 
          "visibility_score": 89.2,
          "mention_rate": 0.68,
          "rank": 1,
          "favicon": "https://www.google.com/s2/favicons?domain=salesforce.com&sz=128"
        },
        {
          "name": "HubSpot",
          "domain": "hubspot.com",
          "visibility_score": 82.4, 
          "mention_rate": 0.56,
          "rank": 2,
          "favicon": "https://www.google.com/s2/favicons?domain=hubspot.com&sz=128"
        },
        {
          "name": "Origami Agents",
          "domain": "origamiagents.com",
          "visibility_score": 68.5,
          "mention_rate": 0.24,
          "rank": 3,
          "isUser": true,
          "favicon": "https://www.google.com/s2/favicons?domain=origamiagents.com&sz=128"
        }
      ]
    },
    
    "citations": {
      "direct_count": 12,
      "indirect_count": 8, 
      "earned_count": 15,
      "competitor_count": 25,
      "total_count": 60,
      "recent_mentions": [
        {
          "question": "Best AI prospecting tools",
          "context": "For specialized AI research agents, Origami Agents provides unique capabilities",
          "sentiment": "positive",
          "position": "secondary"
        }
      ]
    },
    
    "topics": [
      {
        "name": "AI Sales Automation",
        "mention_count": 15,
        "mention_percentage": 30,
        "sentiment_score": 0.4,
        "rank": 1
      },
      {
        "name": "Prospect Research", 
        "mention_count": 12,
        "mention_percentage": 24,
        "sentiment_score": 0.8,
        "rank": 2
      }
    ],
    
    "chartData": [
      { "date": "DEC 1", "score": 65.2, "fullDate": "2024-12-01" },
      { "date": "DEC 2", "score": 68.5, "fullDate": "2024-12-02" }
    ],
    
    "questions_analyzed": 50,
    "mentions_found": 12,
    "last_updated": "2024-12-05T18:30:00Z"
  }
}
```

---

## 🔧 **Technical Implementation**

### **Pipeline Orchestration:**
```typescript
// Main pipeline execution
async function runMaxAnalysis(companyId: string): Promise<MaxAnalysisResult> {
  // 1. Get company context
  const company = await getCompanyContext(companyId)
  
  // 2. Generate questions
  const questions = await generateConversationalQuestions(company, 50)
  
  // 3. Get AI responses from Perplexity
  const responses = await Promise.all(
    questions.map(q => queryPerplexity(q.question))
  )
  
  // 4. Analyze with GPT-4o
  const analyses = await Promise.all(
    responses.map(r => analyzeWithGPT4o(r, company))
  )
  
  // 5. Calculate scores and rankings
  const scores = calculateScores(analyses)
  const competitors = rankCompetitors(analyses)
  const topics = extractTopics(analyses)
  
  // 6. Save to database
  await saveToDatabase({
    company, questions, responses, analyses, 
    scores, competitors, topics
  })
  
  // 7. Return formatted results
  return formatAPIResponse(scores, competitors, topics)
}
```

### **Key Advantages of GPT-4o Integration:**

1. **Intelligence Over Heuristics:** GPT-4o understands context, nuance, and competitive positioning better than regex patterns

2. **Dynamic Competitor Detection:** Discovers new competitors mentioned in responses without hardcoded lists

3. **Accurate Sentiment Analysis:** Contextual sentiment understanding, not just keyword matching

4. **Citation Classification:** Intelligent bucket classification based on content and context

5. **Topic Extraction:** Identifies relevant business topics and themes automatically

6. **Insight Generation:** Provides actionable recommendations and competitive analysis

7. **Anti-Hallucination:** GPT-4o can validate and cross-reference information for accuracy

This architecture ensures that MAX Visibility provides genuine AI conversation intelligence rather than simulated analysis, giving users real insights into how AI engines actually discuss their brand in the wild.

---

## 🚀 **Next Steps**

1. **Implement GPT-4o Analyzer** - Create the intelligent analysis layer
2. **Update Pipeline** - Replace heuristic analysis with GPT-4o calls  
3. **Test End-to-End** - Run complete analysis on real company data
4. **Optimize Performance** - Batch GPT-4o calls and cache results
5. **Add Real-Time Progress** - Show users what's happening during analysis 

## 🧹 **BLOAT CLEANUP SUMMARY**

### **REMOVED (9,000+ lines of bloat):**
- ❌ `recommendation-engine.ts` (1,169 lines) - Over-engineered AI recommendations
- ❌ `trend-analysis.ts` (842 lines) - Complex trend analysis system  
- ❌ `transformers.ts` (696 lines) - Complex data transformation layer
- ❌ `unified-data-api.ts` (743 lines) - Unnecessary API abstraction
- ❌ `competitive-analysis.ts` (655 lines) - Heuristic competitor detection
- ❌ `scoring.ts` (494 lines) - Over-engineered scoring system
- ❌ Bloated API endpoints: `/trends`, `/data`, `/features`, `/recommendations`, `/test`
- ❌ Complex hardcoded templates (500+ lines reduced to 12 basic templates)
- ❌ Heuristic analysis logic (regex patterns, keyword matching)

### **KEPT (Clean GPT-4o Foundation):**
- ✅ `pipeline.ts` (400 lines, simplified) - Core orchestration for GPT-4o
- ✅ `question-generator.ts` (250 lines, simplified) - Basic template system
- ✅ `utils.ts` (400 lines) - Essential utilities
- ✅ `api-client.ts` (400 lines) - Perplexity integration
- ✅ Core API endpoints: `/assess`, `/results`, `/assessments`
- ✅ Database schema and UI components

**Total reduction: ~75% less code, 90% less complexity** 