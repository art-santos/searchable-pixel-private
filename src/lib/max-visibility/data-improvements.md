# MAX Visibility Data Improvements Plan

## Current State Analysis

### ✅ Working Components:
1. **Data Pipeline** - Successfully saves assessment data to all tables
2. **Frontend Integration** - All tabs now display real data instead of hardcoded values
3. **Service Role Access** - Bypasses RLS for pipeline operations
4. **JSON Parsing** - Improved to handle markdown-wrapped responses with fallback

### 🔴 Critical Data Gaps:

#### 1. **Citation URLs and Content**
- **Current**: Citations only store URL strings without metadata
- **Impact**: Can't show source titles, excerpts, or proper attribution
- **Solution**: Extract citation metadata from Perplexity response structure
```typescript
// Update pipeline to capture full citation data
response_citations: perplexityResponse.citations?.map(citation => ({
  url: citation.url,
  title: citation.title || extractTitleFromUrl(citation.url),
  excerpt: citation.snippet || '',
  domain: new URL(citation.url).hostname
}))
```

#### 2. **AI Response Content Display**
- **Current**: Using questions as snippets in citations tab
- **Impact**: Users can't see actual AI responses about their company
- **Solution**: Store and display response excerpts with mention highlights
```typescript
// Add to citation transformation
snippet: extractMentionContext(mention.ai_response, mention.mention_context) || mention.question
```

#### 3. **Competitor Co-mentions**
- **Current**: No tracking of which competitors appear alongside company
- **Impact**: Missing valuable competitive intelligence
- **Solution**: Implement competitor detection in responses
```typescript
// Add competitor extraction to mention analysis
competitors_mentioned: extractCompetitorMentions(response, knownCompetitors)
```

#### 4. **Historical Trend Data**
- **Current**: trend_change always shows 0
- **Impact**: Can't show improvement over time
- **Solution**: Query historical assessments and calculate trends
```typescript
// Add to data API
const historicalScores = await getHistoricalScores(company.id, 30) // last 30 days
const trendChange = calculateTrendChange(currentScore, historicalScores)
```

#### 5. **Source Platform Attribution**
- **Current**: All responses show "Perplexity" 
- **Impact**: Can't differentiate between AI platforms
- **Solution**: Track source in pipeline
```typescript
// Add platform field to responses
platform: 'perplexity', // or 'openai', 'claude', etc.
platform_model: 'pplx-70b-online'
```

#### 6. **Smart Content Recommendations**
- **Current**: Generic "Create/Enhance content" suggestions
- **Impact**: Not actionable enough for users
- **Solution**: AI-powered specific recommendations
```typescript
// Generate specific recommendations
const recommendation = await generateContentRecommendation({
  topic: gap.topic,
  currentMentionRate: gap.mentionRate,
  competitorStrategies: gap.competitorApproaches,
  userIndustry: company.industry
})
```

## Implementation Priority:

### Phase 1 (Immediate - 1-2 days):
1. ✅ Fix JSON parsing errors (DONE)
2. Store full AI response excerpts with mentions
3. Display actual response content in Citations tab

### Phase 2 (Short-term - 3-5 days):
1. Extract and store citation metadata
2. Implement competitor co-mention detection
3. Add historical trend calculation

### Phase 3 (Medium-term - 1-2 weeks):
1. Multi-platform support (ChatGPT, Claude, etc.)
2. AI-powered content recommendations
3. Advanced competitive intelligence features

## Database Schema Additions Needed:

```sql
-- Add to max_visibility_responses
ALTER TABLE max_visibility_responses ADD COLUMN response_excerpt TEXT;
ALTER TABLE max_visibility_responses ADD COLUMN platform VARCHAR(50) DEFAULT 'perplexity';
ALTER TABLE max_visibility_responses ADD COLUMN platform_model VARCHAR(100);

-- Add to max_visibility_citations  
ALTER TABLE max_visibility_citations ADD COLUMN citation_title TEXT;
ALTER TABLE max_visibility_citations ADD COLUMN citation_excerpt TEXT;
ALTER TABLE max_visibility_citations ADD COLUMN domain_authority INTEGER;

-- New table for competitor co-mentions
CREATE TABLE max_visibility_competitor_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID REFERENCES max_visibility_responses(id),
  competitor_name VARCHAR(255),
  mention_context TEXT,
  sentiment VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- New table for content recommendations
CREATE TABLE max_visibility_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES max_visibility_runs(id),
  topic VARCHAR(255),
  recommendation_type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  priority VARCHAR(20),
  estimated_impact INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Enhancements:

### 1. Enhanced Data Endpoint
```typescript
// GET /api/max-visibility/data?include=history,recommendations,competitors
{
  current: { /* existing data */ },
  history: {
    scores: [{ date, score }],
    trend: { change: 12.5, period: '30d' }
  },
  recommendations: [
    {
      type: 'content',
      title: 'Create "Origami vs Clay.com" comparison',
      impact: 85,
      effort: 'medium'
    }
  ],
  competitors: {
    coMentions: [
      { name: 'Clay.com', frequency: 8, sentiment: 'neutral' }
    ]
  }
}
```

### 2. Real-time Progress Websocket
```typescript
// WS /api/max-visibility/assessments/[id]/stream
{
  type: 'progress',
  stage: 'analysis',
  current: 15,
  total: 50,
  currentQuestion: 'What are the best AI sales tools?',
  recentMention: true
}
```

## Testing Checklist:
- [ ] Run assessment and verify all data saves correctly
- [ ] Check Citations tab shows real AI responses
- [ ] Verify Gaps tab calculates opportunities from real data  
- [ ] Ensure Insights tab shows dynamic recommendations
- [ ] Test error handling when AI returns malformed JSON
- [ ] Verify progress tracking updates in real-time
- [ ] Check historical trend calculation
- [ ] Test competitor mention extraction

## Monitoring & Analytics:
1. Track JSON parse error rates
2. Monitor average assessment completion time
3. Track mention detection accuracy
4. Measure user engagement with recommendations
5. Monitor API response times for data endpoints 