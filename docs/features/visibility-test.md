# AEO Pipeline Documentation: Real AI Visibility Scoring System

## Overview

The AEO (Answer Engine Optimization) Pipeline is a comprehensive **real-time AI visibility analysis system** that evaluates how well a website performs in AI-powered search results. Unlike simulated scoring systems, this pipeline conducts actual searches, classifies results, and calculates genuine visibility metrics.

## 🔄 Pipeline Architecture

### **5-Step Analysis Process**

```
1. 🕷️  WEBSITE CRAWLING    → Extract content & structure
2. 🧠  QUESTION GENERATION → Create search questions (AI)  
3. 🔍  SERP SEARCH         → Query search engines
4. 🏷️  URL CLASSIFICATION  → Categorize results
5. 📊  SCORE CALCULATION   → Compute visibility metrics
```

### **Real-Time Progress Tracking**
- **Server-Sent Events (SSE)** for live progress updates
- **WebSocket-style** connection with progress percentages
- **Step-by-step logging** with detailed status messages

---

## 🛠️ Core Components

### **Frontend Component**
```typescript
// src/app/visibility-test/components/aeo-pipeline.tsx
<AEOPipeline 
  isOpen={isPipelineOpen}
  crawlUrl={targetUrl}
  onClose={handleClose}
  onAnalysisComplete={handleResults}
/>
```

**Features:**
- Real-time progress visualization
- Clean, minimal UI with step indicators
- Error handling and retry mechanisms
- Results preview with key metrics

### **Backend API Endpoint**
```typescript
// src/app/api/aeo/start/route.ts

// SSE endpoint for real-time progress
GET /api/aeo/start?token={auth}&url={targetUrl}

// Alternative POST endpoint
POST /api/aeo/start
{ "url": "https://example.com" }
```

**Features:**
- Authentication via JWT tokens
- Server-sent events for progress streaming
- Comprehensive error handling
- Data persistence and caching

---

## 📋 Detailed Step Analysis

### **Step 1: Website Crawling** 🕷️
```typescript
// Uses Firecrawl API for intelligent content extraction
const crawlSnapshot = await executeCrawlStep(targetUrl, sendProgress)
```

**What it does:**
- Crawls up to 10 pages with max depth of 2
- Extracts structured content (markdown, metadata)
- Identifies page titles, descriptions, and main content
- Creates comprehensive site snapshot for analysis

**Technology:** Firecrawl API with async job polling

### **Step 2: Question Generation** 🧠
```typescript
// src/lib/aeo/qgen.ts
const questions = await generateQuestions(crawlSnapshot)
```

**Algorithm:**
- **50% Direct Questions:** Brand-specific queries mentioning company name
- **50% Indirect Questions:** Competitive industry searches
- **AI-Powered:** Uses GPT-4o for intelligent question creation
- **Quality Control:** Validates length (10-75 chars) and relevance

**Example Questions:**
```typescript
Direct:   ["What is OpenAI?", "OpenAI pricing", "ChatGPT vs competitors"]
Indirect: ["best AI platforms", "enterprise automation tools", "AI chatbots"]
```

### **Step 3: SERP Search** 🔍
```typescript
// src/lib/aeo/serper.ts
const serpResults = await searchQuestions(questions, progressCallback)
```

**Features:**
- **Rate Limited:** 20 requests/second via p-queue
- **Comprehensive:** Top 10 results per question
- **Reliable:** Retry logic with exponential backoff
- **Real-time:** Progress updates for each search

**Technology:** Serper.dev API for Google search results

### **Step 4: URL Classification** 🏷️
```typescript
// src/lib/aeo/classify.ts
const classifiedResults = await classifyResults(serpResults, targetDomain)
```

**Classification Buckets:**
- **🏠 Owned:** Company's own website and subdomains
- **🏢 Operated:** Official social media, business profiles
- **🎯 Earned:** Third-party mentions, reviews, articles

**Hybrid Approach:**
1. **Rule-based classification** for obvious cases (95% confidence)
2. **AI classification** via GPT-4o-mini for unclear cases
3. **Performance optimized** - only sends uncertain URLs to AI

### **Step 5: Score Calculation** 📊
```typescript
// src/lib/aeo/score.ts
const visibilityScore = calculateVisibilityScore(serpResults, classifiedResults, targetDomain)
```

**Scoring Algorithm:**
```typescript
// Weighted formula for composite score (0-100):
brandScore = (directCoverage * 0.7 + directVoice * 0.3) * 100
competitiveScore = (indirectCoverage * 0.7 + indirectVoice * 0.3) * 100
voiceScore = shareOfVoice * 100

// Final calculation:
finalScore = (brandScore * 70%) + (competitiveScore * 10%) + 
             (voiceScore * 15%) + consistencyBonus + brandExcellenceBonus
```

**Key Metrics:**
- **Coverage Owned/Operated:** Presence in top 5 results
- **Share of Voice:** Position-weighted influence score
- **Brand Excellence:** Bonus for 90%+ brand question coverage
- **Consistency:** Reward for broad question coverage

---

## 🔌 Integration Points

### **Onboarding Integration**
```typescript
// src/components/onboarding/onboarding-overlay.tsx
const handlePipelineComplete = async (data: any) => {
  // Save complete analysis to database
  const analysisResult = await saveCompleteAeoAnalysis(companyId, data, userId)
  
  // Transform for dashboard display
  const dashboardData = transformToVisibilityData(data)
  
  // Continue to results display
  setVisibilityData(dashboardData)
  setCurrentStep('results')
}
```

### **Visibility Test Page**
```typescript
// src/app/visibility-test/page.tsx
const handleAnalysisComplete = (analysisData: VisibilityData) => {
  setData(analysisData)
  // Results automatically displayed in dashboard format
}
```

### **Database Storage**
```typescript
// src/lib/onboarding/database.ts
await saveCompleteAeoAnalysis(companyId, pipelineData, userId)
```

**Stored Data:**
- Complete question set and SERP results
- Classification details and reasoning
- Score breakdown and metrics
- Raw pipeline data for future analysis

---

## 🎯 Connecting to Visibility Scoring

### **Transform Pipeline Data**
```typescript
const transformToVisibilityData = (aeoData: any) => {
  return {
    overallScore: aeoData.aeo_score,
    scoreHistory: [{ date: new Date().toISOString(), score: aeoData.aeo_score }],
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
    suggestions: generateAEOSuggestions(aeoData),
    aeoData: aeoData // Raw data for detailed breakdowns
  }
}
```

### **Dashboard Integration**
The pipeline results integrate seamlessly with existing dashboard components:

- **`AEOScoreCard`** - Main score display with detailed metrics
- **`OverallAEOCard`** - Score history and trending
- **`DirectCitationCard`** - Coverage analysis breakdown
- **`SuggestionsCard`** - AI-generated improvement recommendations
- **`TopicVisibilityCard`** - Topic-based performance metrics

---

## 🔑 Required Environment Variables

```bash
# OpenAI for question generation and classification
OPENAI_API_KEY=sk-...

# Serper.dev for search engine results
SERPER_API_KEY=...

# Firecrawl for website crawling
FIRECRAWL_API_KEY=fc-...

# Supabase for data storage
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🚀 Usage Examples

### **Basic Implementation**
```typescript
const [isPipelineOpen, setIsPipelineOpen] = useState(false)
const [analysisData, setAnalysisData] = useState(null)

const startAnalysis = () => {
  setIsPipelineOpen(true)
}

const handleComplete = (data) => {
  setAnalysisData(data)
  setIsPipelineOpen(false)
  // Data now contains complete visibility metrics
}

return (
  <AEOPipeline 
    isOpen={isPipelineOpen}
    crawlUrl="https://example.com"
    onClose={() => setIsPipelineOpen(false)}
    onAnalysisComplete={handleComplete}
  />
)
```

### **Advanced Integration with Dashboard**
```typescript
// Auto-start analysis in onboarding
useEffect(() => {
  if (onboardingData && !isPipelineOpen && !analysisComplete) {
    setIsPipelineOpen(true)
  }
}, [onboardingData, isPipelineOpen, analysisComplete])

// Save results to database with user context
const handlePipelineComplete = async (data: any) => {
  if (companyId && user) {
    await saveCompleteAeoAnalysis(companyId, data.rawPipelineData, user.id)
  }
  
  // Transform for dashboard
  const dashboardData = transformToVisibilityData(data)
  setVisibilityData(dashboardData)
  
  // Continue to results display
  setCurrentStep('results')
}
```

---

## 🔧 Technical Architecture

### **Data Flow**
```
Frontend Component → SSE Connection → API Route → Pipeline Steps → Database Storage
       ↓                  ↓              ↓             ↓              ↓
   User Input         Auth Check      Step 1-5      Results       Persistence
   Progress UI        JWT Token       Real APIs     Transform     Supabase
```

### **Error Handling**
- **Network failures:** Retry with exponential backoff
- **API rate limits:** Automatic queue management
- **Authentication errors:** Graceful user feedback
- **Partial failures:** Continue with available data

### **Performance Optimizations**
- **Batch processing:** URLs classified in batches of 50
- **Smart AI usage:** Only unclear cases sent to GPT
- **Rate limiting:** Respects API limits automatically
- **Caching:** Results stored for future analysis

---

## 🎪 Real vs Simulated Systems

### **Real AEO Pipeline** ⚡ (This System)
- **Live API calls** to OpenAI, Serper, Firecrawl
- **Actual search results** from Google
- **Real classification** of competitor URLs
- **Genuine metrics** based on current search landscape
- **Database persistence** for historical analysis

### **Simulated Systems** 🎭 (Other components)
- **`onboarding-flow.tsx`** - Just progress animations
- **Fake progress bars** with predefined stages
- **No real API integration** or live data
- **UI demonstration** purposes only

**Key Difference:** The AEO Pipeline conducts actual analysis while simulated systems only show progress UI.

---

## 📈 Metrics & Scoring Details

### **Core Metrics**
- **AEO Score (0-100):** Composite visibility rating
- **Coverage Owned:** % questions with company results in top 5
- **Coverage Operated:** % questions with company social/profiles in top 5
- **Share of Voice:** Position-weighted influence across all results
- **Average Position:** Mean ranking for owned/operated content

### **Brand Excellence Scoring**
- **95%+ brand coverage:** +15 bonus points
- **90%+ brand coverage:** +12 bonus points  
- **85%+ brand coverage:** +8 bonus points
- **80%+ brand coverage:** +4 bonus points

### **Question Weighting**
- **Direct questions:** 1.2x weight (brand-specific searches)
- **Indirect questions:** 1.0x weight (competitive searches)
- **Position weights:** 1/position (position 1 = 1.0, position 2 = 0.5, etc.)

---

## 🔮 Future Enhancements

### **Planned Features**
- **Competitor analysis:** Direct comparison with rival companies
- **Historical tracking:** Score trends over time
- **Alert system:** Notifications for significant changes
- **Content recommendations:** AI-generated optimization suggestions
- **Integration APIs:** Connect with existing marketing tools

### **Scalability Improvements**
- **Parallel processing:** Multiple questions simultaneously
- **Result caching:** Avoid duplicate searches
- **Advanced classification:** More sophisticated AI models
- **Custom question sets:** Industry-specific search queries

---

This AEO Pipeline represents a **production-grade AI visibility analysis system** that provides genuine, actionable insights into how companies perform in the evolving landscape of AI-powered search. 