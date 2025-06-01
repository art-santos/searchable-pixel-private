# MAX Visibility System: Strategic Planning Document

## 🎯 **Strategic Positioning**

### **Two-Tier Visibility Architecture**

```
🟦 LITE MODE (Current AEO Pipeline)     🟥 MAX MODE (New Perplexity System)
────────────────────────────────────     ──────────────────────────────────
• Traditional SERP-based analysis       • Real LLM conversation testing
• Good onboarding baseline              • Perplexity Sonar integration  
• Fast & cost-effective                 • Advanced conversational queries
• Shows current search ranking          • Measures actual AI responses
• 10 questions, basic scoring           • 50+ questions, deep analysis
```

### **Customer Journey Integration**
- **Onboarding**: Lite mode gives immediate baseline visibility score
- **Upgrade Path**: "See how you perform in AI conversations" → MAX mode
- **Retention**: Regular MAX scans show AI visibility improvements over time
- **Value Ladder**: Lite → MAX → Custom enterprise analysis

---

## 📊 **Data Compatibility: Complete Coverage**

### **Core VisibilityData Interface** 
The MAX system must provide 100% compatibility with existing components:

```typescript
// Complete interface that ALL components expect
interface VisibilityData {
  // PRIMARY METRICS (Required by all score displays)
  overallScore: number                    // 0-100 main visibility score
  scoreHistory: { date: string; score: number }[]  // Time series chart data
  
  // TOPIC ANALYSIS (TopicVisibilityCard, visibility page topics)
  topics: { 
    topic: string; 
    score: number;
    mentions?: number;        // NEW: Required for MAX analysis
    percentage?: number;      // NEW: % of total mentions
    rank?: number;           // NEW: Topic ranking
    change?: number;         // Growth/decline indicator
    positive?: boolean;      // Trend direction
  }[]
  
  // CITATIONS BREAKDOWN (DirectCitationCard, progress bars)
  citations: { 
    owned: number; 
    operated: number; 
    earned: number;
    competitor?: number;     // NEW: Competitor citations
  }
  
  // COMPETITIVE ANALYSIS (CompetitorBenchmarkingCard)  
  competitors: {
    name: string;
    url: string;
    score: number;
    actualRank: number;
    isUser?: boolean;
    icon?: string;
    favicon?: string;        // NEW: Dynamic favicon loading
  }[]
  
  // ACTIONABLE INSIGHTS (SuggestionsCard)
  suggestions: { 
    topic: string; 
    suggestion: string;
    priority?: 'high' | 'medium' | 'low';  // NEW: Priority levels
    actionType?: 'content' | 'optimization' | 'technical'; // NEW: Category
  }[]
  
  // DETAILED ANALYTICS (AEOScoreCard, detailed breakdowns)
  aeoData?: {
    aeo_score: number
    coverage_owned: number
    coverage_operated: number
    coverage_total: number
    share_of_voice: number
    metrics: {
      questions_analyzed: number
      total_results: number
      owned_appearances: number
      operated_appearances: number
      earned_appearances: number
      avg_owned_position: number
      avg_operated_position: number
      top_3_presence: number
    }
  }
  
  // NEW: MAX-SPECIFIC DATA
  maxData?: {
    mention_rate: number              // % of questions where mentioned
    sentiment_score: number           // Average sentiment (-1 to 1)
    citation_influence: number        // How much owned content influences AI
    response_consistency: number      // Factual accuracy score
    competitive_positioning: number   // Relative to competitors
    conversation_types: {
      direct: { mentions: number; sentiment: number }
      indirect: { mentions: number; sentiment: number }
      comparison: { mentions: number; sentiment: number }
    }
  }
}
```

### **Visibility Page Data Requirements**

#### **Chart/Time Series Data**
```typescript
// Current implementation expects
const chartData = [
  { date: 'APR 1', score: 45.2 },
  { date: 'APR 2', score: 44.8 },
  // ... 30 days of data
]

// MAX system must provide
interface MaxChartData {
  lite_scores: { date: string; score: number }[]     // Traditional SERP scores
  max_scores: { date: string; score: number }[]      // AI conversation scores
  combined_scores: { date: string; score: number }[] // Blended score
}
```

#### **Competitive Benchmarking Data**
```typescript
// Current implementation structure
const currentCompetitors = [
  { name: 'Salesforce', url: 'salesforce.com', score: 89.9, actualRank: 1, isUser: false },
  { name: 'HubSpot', url: 'hubspot.com', score: 87.2, actualRank: 2, isUser: false },
  // ... up to 10 competitors
  { name: getUserDisplayName(), url: getUserDomain(), score: 72.2, actualRank: 10, isUser: true }
]

// MAX system must enhance with
interface MaxCompetitorData {
  // All existing fields plus:
  lite_score: number          // Traditional search score
  max_score: number           // AI conversation score  
  mention_rate: number        // % mentioned in AI responses
  sentiment_avg: number       // Average sentiment
  cite_frequency: number      // How often AI cites them
}
```

#### **Topic Visibility Enhancement**
```typescript
// Current topic structure
const topicNodes = [
  { id: 'center', label: getUserDisplayName(), x: 0, y: 0, size: 40, type: 'center', citations: 86 },
  { id: 'ai-sales', label: 'AI Sales Tools', x: -120, y: -80, size: 28, type: 'topic', citations: 34 },
  // ... more topics
]

// MAX system adds conversational context
interface MaxTopicData {
  // All existing fields plus:
  conversation_mentions: number    // Mentions in AI conversations
  sentiment_by_topic: number      // Topic-specific sentiment
  question_types: string[]        // Which question types mention this topic
  competitive_strength: number    // Relative topic positioning
}
```

#### **Gaps & Opportunities Data**
```typescript
// Current gaps structure  
const gapsData = [
  { 
    id: 1, 
    prompt: 'Best AI agents for GTM teams', 
    status: 'missing', 
    searchVolume: 'High', 
    difficulty: 'Medium', 
    suggestion: 'Create comprehensive guide' 
  }
]

// MAX system enhances with AI-specific gaps
interface MaxGapsData {
  // All existing fields plus:
  ai_mention_opportunity: number   // Potential for AI mentions
  current_ai_coverage: number     // Current AI response coverage
  competitor_ai_strength: number  // How well competitors cover this
  conversation_volume: number     // How often AI discusses this topic
}
```

### **Dashboard Component Data Requirements**

#### **TopicVisibilityCard Data**
```typescript
// Current structure
const topics = [
  {
    rank: 1,
    label: "AI research agents", 
    sources: [{ src: "/ycombinator.svg", alt: "YCombinator" }],
    change: 12,
    positive: true,
    link: "#",
  }
]

// MAX system provides enhanced data
interface MaxTopicVisibility {
  // All existing fields plus:
  ai_mentions: number           // Mentions in AI responses
  ai_sentiment: number         // AI-specific sentiment
  ai_sources: string[]         // Sources that influence AI responses
  conversation_contexts: string[] // Where this topic appears in AI
}
```

#### **WelcomeCard Score Integration**
```typescript
// Current welcome message logic
const getWelcomeMessage = (score: number) => {
  if (score < 30) return "foundation needs work message"
  // ... score-based messaging
}

// MAX system provides dual-score messaging
interface MaxWelcomeData {
  lite_score: number
  max_score: number
  score_delta: number
  primary_strength: 'search' | 'ai' | 'balanced'
  improvement_focus: string[]
}
```

### **Data Transformation Functions**

#### **Lite-to-Dashboard Transformer (Existing)**
```typescript
const transformLiteToVisibilityData = (aeoData: any): VisibilityData => {
  return {
    overallScore: aeoData.aeo_score,
    scoreHistory: [{ date: new Date().toISOString().split('T')[0], score: aeoData.aeo_score }],
    topics: [
      { topic: 'Owned Content', score: Math.round(aeoData.coverage_owned * 100) },
      { topic: 'Operated Channels', score: Math.round(aeoData.coverage_operated * 100) },
      { topic: 'Share of Voice', score: Math.round(aeoData.share_of_voice * 100) }
    ],
    citations: {
      owned: aeoData.metrics?.owned_appearances || 0,
      operated: aeoData.metrics?.operated_appearances || 0,
      earned: aeoData.metrics?.earned_appearances || 0
    },
    competitors: [], // Basic implementation
    suggestions: generateAEOSuggestions(aeoData),
    aeoData: aeoData
  }
}
```

#### **MAX-to-Dashboard Transformer (New)**
```typescript
const transformMaxToVisibilityData = (maxData: any): VisibilityData => {
  return {
    // Core compatibility
    overallScore: maxData.ai_visibility_score,
    scoreHistory: maxData.score_history || [],
    
    // Enhanced topics with AI context
    topics: maxData.conversation_topics.map(topic => ({
      topic: topic.name,
      score: topic.ai_score,
      mentions: topic.mention_count,
      percentage: topic.mention_percentage,
      rank: topic.rank,
      change: topic.change_vs_previous,
      positive: topic.change_vs_previous > 0
    })),
    
    // Enhanced citations with AI sources
    citations: {
      owned: maxData.citations.owned_sources_cited,
      operated: maxData.citations.operated_sources_cited, 
      earned: maxData.citations.earned_sources_cited,
      competitor: maxData.citations.competitor_sources_cited
    },
    
    // Enhanced competitors with AI metrics
    competitors: maxData.competitive_analysis.map(comp => ({
      name: comp.name,
      url: comp.domain,
      score: comp.ai_visibility_score,
      actualRank: comp.rank,
      isUser: comp.is_target_company,
      favicon: `https://www.google.com/s2/favicons?domain=${comp.domain}&sz=128`,
      lite_score: comp.search_score,
      max_score: comp.ai_score,
      mention_rate: comp.mention_rate,
      sentiment_avg: comp.sentiment_average
    })),
    
    // Enhanced suggestions with AI insights
    suggestions: maxData.ai_recommendations.map(rec => ({
      topic: rec.category,
      suggestion: rec.recommendation,
      priority: rec.priority_level,
      actionType: rec.action_type
    })),
    
    // Preserve existing AEO data structure for compatibility
    aeoData: {
      aeo_score: maxData.ai_visibility_score,
      coverage_owned: maxData.mention_rate,
      coverage_operated: maxData.operated_mention_rate,
      coverage_total: maxData.total_coverage,
      share_of_voice: maxData.ai_share_of_voice,
      metrics: {
        questions_analyzed: maxData.questions_analyzed,
        total_results: maxData.total_responses,
        owned_appearances: maxData.owned_mentions,
        operated_appearances: maxData.operated_mentions,
        earned_appearances: maxData.earned_mentions,
        avg_owned_position: maxData.avg_mention_position,
        avg_operated_position: maxData.avg_operated_position,
        top_3_presence: maxData.primary_mentions
      }
    },
    
    // New MAX-specific data
    maxData: {
      mention_rate: maxData.mention_rate,
      sentiment_score: maxData.sentiment_average,
      citation_influence: maxData.citation_influence_score,
      response_consistency: maxData.factual_consistency_score,
      competitive_positioning: maxData.competitive_positioning_score,
      conversation_types: {
        direct: { 
          mentions: maxData.direct_mentions, 
          sentiment: maxData.direct_sentiment 
        },
        indirect: { 
          mentions: maxData.indirect_mentions, 
          sentiment: maxData.indirect_sentiment 
        },
        comparison: { 
          mentions: maxData.comparison_mentions, 
          sentiment: maxData.comparison_sentiment 
        }
      }
    }
  }
}
```

#### **Unified Data Provider (Both Systems)**
```typescript
const getUnifiedVisibilityData = async (companyId: string): Promise<VisibilityData> => {
  // Get latest data from both systems
  const liteData = await getLatestLiteAnalysis(companyId)
  const maxData = await getLatestMaxAnalysis(companyId)
  
  if (maxData) {
    // If MAX data available, use it as primary with Lite as supplementary
    const baseData = transformMaxToVisibilityData(maxData)
    
    // Enhance with Lite data for comparison
    if (liteData) {
      baseData.scoreHistory = mergeScoreHistories(liteData.scores, maxData.scores)
      baseData.topics = enhanceTopicsWithLiteData(baseData.topics, liteData.topics)
    }
    
    return baseData
  } else if (liteData) {
    // Fallback to Lite data if MAX not available
    return transformLiteToVisibilityData(liteData)
  } else {
    // Return empty state structure
    return getEmptyVisibilityData()
  }
}
```

---

## 🚀 **MAX System Core Architecture**

### **Why Perplexity Sonar?**
✅ **Real LLM Search Engine** - Actually uses AI to answer questions
✅ **Sources & Citations** - Shows what content influences AI responses  
✅ **Real-time Web Access** - Not limited by training data cutoffs
✅ **Conversational Interface** - Matches how users actually query AI
✅ **API Available** - Can be automated and scaled

### **5-Step MAX Pipeline**
```
1. 🧠  CONVERSATIONAL QUESTION GENERATION  → AI-style queries (not search)
2. 🤖  PERPLEXITY SONAR QUERIES           → Real LLM responses + sources
3. 🔍  RESPONSE ANALYSIS                  → Mention extraction & sentiment
4. 📊  SOURCE ATTRIBUTION SCORING         → Citation patterns & influence
5. 🎯  AI VISIBILITY SCORE CALCULATION    → True LLM presence metrics
```

---

## 🛠️ **Technical Implementation Plan**

### **Backend Infrastructure**

#### **New API Endpoints**
```typescript
// MAX visibility pipeline
POST /api/max-visibility/start
GET  /api/max-visibility/status/{runId}
GET  /api/max-visibility/results/{runId}

// Perplexity integration
POST /api/perplexity/query
GET  /api/perplexity/analyze-response

// Unified data endpoints
GET  /api/visibility/data/{companyId}           // Combined Lite + MAX data
GET  /api/visibility/comparison/{companyId}     // Lite vs MAX comparison
GET  /api/visibility/trends/{companyId}         // Historical trends
```

#### **Perplexity Sonar Integration**
```typescript
// src/lib/perplexity/client.ts
interface PerplexityQuery {
  query: string
  sources?: string[]
  search_domain_filter?: string[]
  return_citations: boolean
  return_related_questions: boolean
}

interface PerplexityResponse {
  id: string
  choices: [{
    message: {
      content: string
      role: 'assistant'
    }
    finish_reason: string
  }]
  citations: string[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
  }
}
```

### **Database Schema Extensions**

#### **New Tables for MAX System**
```sql
-- MAX visibility runs (separate from lite AEO runs)
CREATE TABLE max_visibility_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  triggered_by UUID REFERENCES profiles(id),
  question_count INTEGER NOT NULL,
  total_score DECIMAL(5,2),
  mention_rate DECIMAL(5,4),
  sentiment_score DECIMAL(5,2), 
  citation_score DECIMAL(5,2),
  computed_at TIMESTAMP DEFAULT NOW(),
  raw_json_path TEXT
);

-- Conversational questions (different from search queries)
CREATE TABLE max_visibility_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES max_visibility_runs(id),
  question TEXT NOT NULL,
  question_type max_question_type NOT NULL,
  position INTEGER NOT NULL
);

-- Perplexity responses and analysis
CREATE TABLE max_visibility_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES max_visibility_questions(id),
  perplexity_response_id TEXT,
  full_response TEXT NOT NULL,
  mention_detected BOOLEAN DEFAULT FALSE,
  mention_position mention_position_enum,
  mention_sentiment sentiment_enum,
  mention_context TEXT,
  response_length INTEGER,
  citation_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Source citations from Perplexity
CREATE TABLE max_visibility_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES max_visibility_responses(id),
  citation_url TEXT NOT NULL,
  citation_title TEXT,
  citation_domain TEXT,
  bucket citation_bucket_enum, -- owned/operated/earned
  influence_score DECIMAL(5,4), -- How much this source influenced the response
  position_in_citations INTEGER
);

-- Response quality metrics
CREATE TABLE max_visibility_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES max_visibility_runs(id),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,4),
  metric_metadata JSONB
);

-- Competitive analysis results
CREATE TABLE max_visibility_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES max_visibility_runs(id),
  competitor_name TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  mention_count INTEGER DEFAULT 0,
  mention_rate DECIMAL(5,4),
  sentiment_average DECIMAL(5,2),
  ai_visibility_score DECIMAL(5,2),
  rank_position INTEGER
);

-- Topic analysis results  
CREATE TABLE max_visibility_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES max_visibility_runs(id),
  topic_name TEXT NOT NULL,
  mention_count INTEGER DEFAULT 0,
  mention_percentage DECIMAL(5,2),
  sentiment_score DECIMAL(5,2),
  rank_position INTEGER,
  change_vs_previous DECIMAL(5,2)
);
```

#### **New Enums**
```sql
CREATE TYPE max_question_type AS ENUM (
  'direct_conversational',    -- "Help me choose between X and competitors"
  'indirect_conversational',  -- "What should I know about AI platforms?"
  'comparison_query',         -- "Compare X vs Y for my use case"
  'recommendation_request',   -- "Recommend the best tool for Z"
  'explanatory_query'        -- "Explain the differences between..."
);

CREATE TYPE mention_position_enum AS ENUM (
  'primary',      -- First/main mention in response
  'secondary',    -- Supporting mention
  'passing',      -- Brief/casual mention
  'none'          -- Not mentioned
);

CREATE TYPE sentiment_enum AS ENUM (
  'very_positive',
  'positive', 
  'neutral',
  'negative',
  'very_negative'
);

CREATE TYPE citation_bucket_enum AS ENUM (
  'owned',       -- Company's own content
  'operated',    -- Company's social/profiles  
  'earned',      -- Third-party mentions
  'competitor'   -- Competitor content
);
```

### **Data Overlap Strategy**

#### **Shared Tables (Both Systems Use)**
- ✅ **`companies`** - Same company/domain tracking
- ✅ **`profiles`** - Same user accounts and permissions  
- ✅ **Usage tracking** - Both count toward plan limits
- ✅ **Subscription logic** - MAX requires higher tier

#### **Separate Tables (System-Specific)**
- 🟦 **`aeo_*`** tables - Keep for Lite mode (SERP-based)
- 🟥 **`max_visibility_*`** tables - New for MAX mode (LLM-based)

#### **Cross-System Analytics**
```typescript
// Compare Lite vs MAX results for same company
interface VisibilityComparison {
  company_id: string
  lite_score: number      // Traditional SERP visibility
  max_score: number       // AI conversation visibility  
  score_delta: number     // Difference between systems
  improvement_areas: string[]
}
```

---

## 🧠 **Question Generation Strategy**

### **Conversational Question Types**

#### **Direct Conversational (Brand-Specific)**
```typescript
const directConversational = [
  "Help me understand what {company} does and if it's right for my business",
  "I'm evaluating {company} - what should I know about their pricing and features?", 
  "Compare {company} to their main competitors for enterprise use",
  "What are the pros and cons of choosing {company} over alternatives?",
  "Walk me through {company}'s approach to {industry} and why it matters",
  "Is {company} a good choice for {use_case}? What are the alternatives?"
]
```

#### **Indirect Conversational (Competitive)**
```typescript
const indirectConversational = [
  "I need to choose the best {industry} platform for my startup - what are my options?",
  "What should I look for when evaluating {category} tools for enterprise?",
  "Help me understand the landscape of {market} solutions and key players",
  "I'm building a {use_case} - what tools and platforms should I consider?",
  "What are the trade-offs between different approaches to {problem_space}?",
  "Recommend the top {category} solutions for {company_size} companies"
]
```

#### **Advanced Question Types**
```typescript
const advancedQueries = [
  // Recommendation requests
  "I have ${budget} budget for {category} - what do you recommend?",
  
  // Use case specific
  "I'm a {role} at a {company_size} company looking for {solution_type}",
  
  // Comparison matrices  
  "Create a comparison of {company} vs {competitor1} vs {competitor2}",
  
  // Investment/purchasing
  "Is {company} worth the investment? What's the ROI like?",
  
  // Implementation guidance
  "If I choose {company}, what should I know about implementation?"
]
```

---

## 📊 **MAX Scoring Algorithm**

### **Core Metrics**

#### **1. Mention Rate (40% weight)**
```typescript
const mentionRate = {
  calculation: mentionsDetected / totalQuestions,
  benchmarks: {
    excellent: "> 80%",  // Mentioned in 4/5 relevant conversations
    good: "60-80%",      // Mentioned in 3/5 conversations  
    fair: "40-60%",      // Mentioned in 2/5 conversations
    poor: "< 40%"        // Rarely mentioned
  }
}
```

#### **2. Mention Quality (25% weight)**
```typescript
const mentionQuality = {
  position_weight: {
    primary: 1.0,     // First/main mention
    secondary: 0.7,   // Supporting mention  
    passing: 0.3      // Brief mention
  },
  sentiment_weight: {
    very_positive: 1.0,
    positive: 0.8,
    neutral: 0.5,
    negative: 0.2,
    very_negative: 0.0
  }
}
```

#### **3. Source Influence (20% weight)**
```typescript
const sourceInfluence = {
  owned_content_cited: ownedCitations / totalCitations,
  operated_content_cited: operatedCitations / totalCitations,
  citation_position_score: avgCitationPosition, // Earlier = better
  source_authority_score: avgSourceAuthorityScore
}
```

#### **4. Competitive Positioning (10% weight)**
```typescript
const competitivePositioning = {
  mention_rate_vs_competitors: companyMentions / competitorMentions,
  sentiment_vs_competitors: companySentiment - avgCompetitorSentiment,
  positioning_accuracy: factualAccuracyScore
}
```

#### **5. Response Consistency (5% weight)**
```typescript
const responseConsistency = {
  factual_accuracy: accurateFactsCount / totalFactsClaimed,
  messaging_consistency: brandMessageAlignmentScore,
  hallucination_risk: 1 - (fabricatedFacts / totalFactsClaimed)
}
```

### **Composite Score Calculation**
```typescript
const maxVisibilityScore = (
  (mentionRate * 0.40) +
  (mentionQuality * 0.25) + 
  (sourceInfluence * 0.20) +
  (competitivePositioning * 0.10) +
  (responseConsistency * 0.05)
) * 100

// Apply brand excellence bonuses
if (mentionRate > 0.90) maxVisibilityScore += 10 // Exceptional presence
if (sentimentScore > 0.85) maxVisibilityScore += 5  // Very positive sentiment
```

---

## 🎨 **User Experience Design**

### **MAX Mode Activation**

#### **Upgrade Flow from Lite**
```typescript
// After Lite analysis completes
const upgradePrompt = {
  headline: "Want to see how you perform in AI conversations?",
  subtext: "Traditional search is just the beginning. See how AI actually talks about your brand.",
  cta: "Run MAX Analysis",
  preview: "50+ conversational questions, real AI responses, citation analysis"
}
```

#### **MAX Analysis UI**
```typescript
const maxAnalysisUI = {
  realTimeProgress: {
    step1: "Generating conversational questions...",
    step2: "Querying Perplexity AI for responses...", 
    step3: "Analyzing mentions and sentiment...",
    step4: "Scoring source citations...",
    step5: "Calculating AI visibility score..."
  },
  
  resultsDisplay: {
    primaryMetric: "AI Visibility Score (0-100)",
    secondaryMetrics: [
      "Mention Rate in AI Responses",
      "Average Sentiment Score", 
      "Source Citation Influence",
      "Competitive Positioning"
    ],
    insights: [
      "Sample AI responses mentioning your brand",
      "Sources that influence AI about your company",
      "Comparison vs competitors",
      "Improvement recommendations"
    ]
  }
}
```

### **Results Dashboard Integration**

#### **Comparative Analysis View**
```typescript
const dashboardIntegration = {
  dualScoreDisplay: {
    lite: "Traditional Search Visibility: 67/100",
    max: "AI Conversation Visibility: 73/100", 
    insight: "You perform 6 points better in AI than traditional search"
  },
  
  trendTracking: {
    historical: "Track both scores over time",
    alerts: "Get notified when AI visibility changes",
    recommendations: "AI-specific optimization suggestions"
  }
}
```

---

## 💰 **Pricing & Positioning Strategy**

### **Plan Tier Integration**

#### **Current Plans Enhanced**
```typescript
const planEnhancements = {
  free: {
    current: "Basic dashboard access",
    enhanced: "Basic dashboard + 1 Lite analysis/month"
  },
  
  visibility: {
    current: "Daily visibility scans", 
    enhanced: "Daily Lite scans + 2 MAX analyses/month"
  },
  
  plus: {
    current: "Daily MAX scans + 10 monthly articles",
    enhanced: "Daily Lite + Weekly MAX + 10 AI articles"  
  },
  
  pro: {
    current: "Unlimited MAX scans",
    enhanced: "Unlimited Lite + Daily MAX + 30 AI articles"
  }
}
```

#### **Value Proposition Messaging**
- **Lite Mode**: "See how you rank in traditional search"
- **MAX Mode**: "Discover how AI actually talks about your brand"
- **Combined**: "Complete visibility across both search eras"

---

## 🔄 **Implementation Phases**

### **Phase 1: Foundation (Week 1-2)**
- [ ] Set up Perplexity Sonar API integration
- [ ] Create new database tables and enums
- [ ] Build basic question generation for conversational queries
- [ ] Implement simple Perplexity query and response parsing

### **Phase 2: Core Pipeline (Week 3-4)**  
- [ ] Build complete MAX visibility pipeline
- [ ] Implement mention detection and sentiment analysis
- [ ] Create citation tracking and source attribution
- [ ] Add real-time progress tracking via SSE

### **Phase 3: Scoring & Analytics (Week 5-6)**
- [ ] Implement MAX scoring algorithm 
- [ ] Build comparative analysis (Lite vs MAX)
- [ ] Create trend tracking and historical analysis
- [ ] Add competitive positioning metrics

### **Phase 4: UI Integration (Week 7-8)**
- [ ] Design MAX analysis interface
- [ ] Integrate results into existing dashboard
- [ ] Build upgrade flows from Lite to MAX
- [ ] Add plan tier restrictions and usage tracking

### **Phase 5: Optimization (Week 9-10)**
- [ ] Performance optimization and caching
- [ ] Advanced question generation strategies  
- [ ] Enhanced competitive analysis features
- [ ] Enterprise features and custom reporting

---

## 🎯 **Success Metrics**

### **Product Metrics**
- **Adoption Rate**: % of Lite users who upgrade to MAX
- **Retention**: % of MAX users who run regular analyses  
- **Score Correlation**: How Lite vs MAX scores relate
- **Customer Satisfaction**: NPS for MAX vs Lite experiences

### **Business Metrics**
- **Revenue Impact**: MAX tier upgrades and plan changes
- **Engagement**: Average analyses per user per month
- **Competitive Advantage**: Unique insights vs competitors
- **Market Education**: How well MAX explains AI search era

---

## 🚨 **Risk Mitigation**

### **Technical Risks**
- **Perplexity API Limits**: Implement queue management and caching
- **Cost Management**: Track API usage and implement safeguards
- **Response Quality**: Build validation for mention detection accuracy
- **Scale Challenges**: Design for high-volume concurrent analyses

### **Product Risks**  
- **User Confusion**: Clear differentiation between Lite vs MAX
- **Value Perception**: Strong onboarding explaining AI search importance
- **Competitive Response**: Patent novel approaches where possible
- **Market Timing**: Monitor adoption of AI search tools

---

## 🏆 **Competitive Differentiation**

### **Unique Value Propositions**
1. **First Real AI Visibility Tool**: Actual LLM conversation testing vs simulated
2. **Dual-Era Coverage**: Both traditional search AND AI search visibility  
3. **Source Attribution**: See exactly what content influences AI responses
4. **Conversational Intelligence**: Understand how AI naturally discusses brands
5. **Competitive AI Positioning**: How you compare in AI conversations

### **Moat Building**
- **Data Network Effects**: More companies = better benchmarking
- **AI Training Pipeline**: Improve question generation with usage data
- **Integration Ecosystem**: Connect with marketing tools and workflows
- **Expertise Brand**: Become the authority on AI search optimization

---

This MAX visibility system positions the company at the forefront of the AI search era while preserving the value of existing traditional search analysis. The two-tier approach provides clear upgrade paths and comprehensive coverage of the evolving search landscape. 