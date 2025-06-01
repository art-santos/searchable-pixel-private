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