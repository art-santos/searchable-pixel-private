# Comprehensive Audit System Plan

**Goal**: Replace the existing technical snapshots score with a comprehensive audit tool that captures key data points for web page analysis using Firecrawl and custom analyzers, focusing on content, schema, and AI visibility.

## Current State Analysis

### Existing System
- **Current Tool**: Technical audit with 55-item checklist stored in `supabase/functions/process-snapshot/technical-analyzer.ts`
- **Firecrawl Integration**: Working V1 API integration in `src/services/firecrawl-client.ts`
- **Database Tables**: `page_audit_overview`, `technical_checklist_results`, `page_content`
- **Scoring**: Weighted category scoring (Content 25%, Technical 20%, AI Optimization 20%, Media 15%, Schema 20%)

### Limitations
- Basic schema.org detection without detailed analysis
- No promotional sentiment analysis
- No LLM mention detection
- Limited image analysis
- No page size metrics (HTML/DOM kB)

## Limitations Analysis & Solutions

### 🚀 **Leverage Existing Working Systems**

#### 1. **AI Mentions Detection - USE EXISTING VISIBILITY SYSTEM**
**Current Limitation**: Plan suggested building new LLM mention detection
**✅ SOLUTION**: Your visibility scoring system already has sophisticated AI mention detection!

**Existing Assets to Leverage**:
- ✅ `src/lib/aeo/classify.ts` - GPT-4o powered classification system
- ✅ `src/lib/perplexity-client.ts` - AI mention analysis with confidence scoring
- ✅ `src/lib/ai-detection.ts` - AI crawler detection patterns
- ✅ Visibility pipeline with question generation and AI response analysis

**Implementation Strategy**:
```typescript
// NEW: lib/analyzers/ai-mentions-analyzer.ts
export async function analyzeAIMentions(url: string): Promise<{
  llmMentions: string[];
  mentionSources: string[];
  confidenceScore: number;
}> {
  // 1. Check if URL exists in visibility_results table
  const existingMentions = await getExistingVisibilityMentions(url);
  
  if (existingMentions.length > 0) {
    // Use existing data - much faster!
    return {
      llmMentions: existingMentions.map(m => m.source),
      mentionSources: existingMentions.map(m => m.platform),
      confidenceScore: existingMentions.reduce((avg, m) => avg + m.confidence, 0) / existingMentions.length
    };
  }
  
  // 2. If no existing data, run mini visibility test (3 questions)
  return await runMiniVisibilityTest(url);
}
```

#### 2. **Schema.org Analysis - ENHANCE EXISTING DETECTION**
**Current Limitation**: Basic JSON-LD detection in technical analyzer
**✅ SOLUTION**: Enhance existing system with validation and specific type detection

**Enhanced Schema Analyzer**:
```typescript
// lib/analyzers/enhanced-schema-analyzer.ts
export async function analyzeSchemaMarkup(html: string): Promise<SchemaAnalysisResult> {
  // 1. Extract JSON-LD (existing logic enhanced)
  const jsonLdScripts = extractJsonLdScripts(html);
  
  // 2. Parse and validate each schema (offline validation first)
  const schemas = await Promise.all(
    jsonLdScripts.map(script => parseAndValidateSchema(script))
  );
  
  // 3. Check for specific schema types your audit needs
  const specificSchemas = {
    faq: schemas.some(s => s['@type'] === 'FAQPage'),
    article: schemas.some(s => s['@type']?.includes('Article')),
    breadcrumb: schemas.some(s => s['@type'] === 'BreadcrumbList'),
    itemList: schemas.some(s => s['@type'] === 'ItemList'),
    speakable: schemas.some(s => s.speakable),
  };
  
  // 4. Validate against Schema.org (optional - can be cached)
  const validationErrors = await validateSchemas(schemas);
  
  return {
    hasJsonLd: schemas.length > 0,
    schemaTypes: schemas.map(s => s['@type']).flat(),
    validationErrors,
    specificSchemas
  };
}
```

#### 3. **Image Analysis - SMART SAMPLING APPROACH**
**Current Limitation**: Analyzing all images would be expensive
**✅ SOLUTION**: Smart sampling with size estimation

**Optimized Image Analysis**:
```typescript
// lib/analyzers/image-analyzer.ts
export async function analyzeImages(html: string, baseUrl: string): Promise<ImageAnalysisResult> {
  const images = extractImageTags(html);
  
  // 1. Alt text analysis (free)
  const altTextStats = analyzeAltText(images);
  
  // 2. Smart sampling for size analysis
  const sampleSize = Math.min(10, Math.ceil(images.length * 0.3)); // Sample 30% or max 10
  const sampleImages = selectRepresentativeImages(images, sampleSize);
  
  // 3. Fetch sizes for sample only
  const sampleSizes = await Promise.all(
    sampleImages.map(img => getImageSize(img.src, baseUrl))
  );
  
  // 4. Estimate total based on sample
  const avgSize = sampleSizes.reduce((sum, size) => sum + size, 0) / sampleSizes.length;
  
  return {
    totalImages: images.length,
    imagesWithAlt: altTextStats.withAlt,
    averageSize: Math.round(avgSize / 1024), // Convert to kB
    largestImage: Math.max(...sampleSizes) / 1024,
    optimizationSuggestions: generateImageOptimizationSuggestions(altTextStats, avgSize)
  };
}
```

### 🔧 **Technical Implementation Optimizations**

#### 1. **Cost-Effective API Usage & Gating**
- **LLM-powered features** (summary, sentiment, quick-wins) will be gated behind a "detailed insights" toggle or a credit system to control costs at scale.
- This prevents unexpected high costs from enterprise accounts running large-scale audits.

#### 2. **Smart Caching Strategy**
- A central caching layer (e.g., Redis) will be used to store results of expensive or slow operations.
- Schema analysis will be cached for 7 days.
- Other fetched data will have a 24-hour cache.

#### 3. **Asynchronous Architecture**
- The main audit endpoint will be fully async to handle potentially long-running jobs without timeouts.
- **Process**:
  1. Client sends request to `/api/audit/start`.
  2. API returns `202 Accepted` with a `job_id`.
  3. Client subscribes to a realtime channel (e.g., Supabase Realtime) to receive progress updates.
  4. Worker processes the job from a queue (e.g., Supabase Queue, Cloudflare Queues).

#### 4. **Pre-flight Checks & Security**
- **Edge Case Handling**: Before a full crawl, a `HEAD` request will check for auth walls (401/403) or server errors to avoid wasted processing.
- **Security**: The system will include PII-stripping for raw HTML, cache encryption, and data retention policies for GDPR/CCPA compliance.

#### 5. **Future-Proof Database Schema**
- The `comprehensive_audits` table will include a `schema_version` column and an `additional_metrics` `jsonb` column to allow for adding new metrics in the future without disruptive schema migrations.

## New Comprehensive Audit System

### Data Points to Capture

| Category | Data Point | Implementation Method | Priority |
|----------|------------|----------------------|----------|
| **Basic Info** | URL | Direct from input | Critical |
| **Content Analysis** | Page Summary | LLM-generated summary (gated) | High |
| **Technical Performance** | HTML Size (kB) | Firecrawl response size | Critical |
| **Technical Performance** | DOM Size (kB) | Parse HTML structure | Critical |
| **Crawlability** | Crawlable Status | Firecrawl success + robots.txt | Critical |
| **Rendering** | SSR Rendered | Enhanced SSR detection | High |
| **Schema Analysis** | FAQ Schema Present | JSON-LD parser | Medium |
| **Schema Analysis** | ItemList Schema Present | JSON-LD parser | Medium |
| **Schema Analysis** | Article Schema Present | JSON-LD parser | Medium |
| **Schema Analysis** | Breadcrumb Schema Present | JSON-LD parser | Medium |
| **Schema Analysis** | Speakable Schema Present | JSON-LD parser | Low |
| **Schema Validation** | JSON-LD Valid | Offline validation | High |
| **SEO Analysis** | Canonical Tag Valid | HTML parser + validation | High |
| **Content Structure** | Title H1 Match | Text similarity analysis | Medium |
| **Content Structure** | Meta Description Present | HTML meta parser | High |
| **Content Structure** | H1 Present | HTML heading parser | High |
| **Content Structure** | H1 Count | HTML heading counter | Medium |
| **Content Structure** | Heading Depth | HTML heading hierarchy | Medium |
| **Content Analysis** | Word Count | Text extraction + counting | Medium |
| **Link Analysis** | External EEAT Links | Link parser + domain analysis | Medium |
| **Link Analysis** | Internal Link Count | Link parser + domain match | Medium |
| **Image Analysis** | Image Alt Present | HTML img parser | High |
| **Image Analysis** | Avg Image Size (kB) | Image analysis API | Medium |
| **AI Analysis** | Promotional Sentiment (%) | LLM sentiment analysis (gated) | Medium |
| **AI Analysis** | LLM Mention (@ChatGPT) | From existing Visibility System | High |
| **Recommendations** | Technical Quick Win | Rule-based suggestions | High |
| **Recommendations** | Content Quick Win | LLM-generated suggestions (gated)| High |
| **Scoring** | Page Score | Weighted composite score | Critical |

## Database Schema Updates

### New Main Audit Table

```sql
-- Replace existing technical audit with comprehensive audit
CREATE TABLE comprehensive_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  job_id UUID, -- For async processing
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Basic Page Info
  page_title TEXT,
  page_summary TEXT, -- LLM-generated (gated)
  
  -- Performance Metrics
  html_size_kb DECIMAL,
  dom_size_kb DECIMAL,
  
  -- Crawlability & Rendering
  crawlable BOOLEAN,
  ssr_rendered BOOLEAN,
  
  -- Schema Analysis
  faq_schema_present BOOLEAN,
  itemlist_schema_present BOOLEAN,
  article_schema_present BOOLEAN,
  breadcrumb_schema_present BOOLEAN,
  speakable_schema_present BOOLEAN,
  jsonld_valid BOOLEAN,
  
  -- SEO & Structure
  canonical_tag_valid BOOLEAN,
  title_h1_match BOOLEAN,
  meta_description_present BOOLEAN,
  h1_present BOOLEAN,
  h1_count INTEGER,
  heading_depth INTEGER,
  word_count INTEGER,
  
  -- Link Analysis
  external_eeat_links INTEGER,
  internal_link_count INTEGER,
  
  -- Image Analysis
  image_alt_present_percent DECIMAL,
  avg_image_kb DECIMAL,
  
  -- AI Analysis
  promotional_sentiment_percent DECIMAL, -- (gated)
  llm_mentions TEXT[], -- Array of detected mentions
  
  -- Recommendations
  technical_quick_win TEXT,
  content_quick_win TEXT, -- (gated)
  
  -- Scoring
  page_score INTEGER CHECK (page_score >= 0 AND page_score <= 100),
  
  -- Metadata
  schema_version INTEGER DEFAULT 1,
  additional_metrics JSONB,
  confidence_scores JSONB, -- e.g., {"performance": "high", "schema": "medium"}
  analyzed_at TIMESTAMP WITH TIME ZONE,
  analysis_duration_ms INTEGER,
  
  UNIQUE(url, user_id)
);
```

### Supporting Tables

```sql
-- For dynamic scoring weights
CREATE TABLE audit_scoring_weights (
  id SERIAL PRIMARY KEY,
  metric_name TEXT UNIQUE NOT NULL,
  weight DECIMAL NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT
);

-- Detailed recommendations table
CREATE TABLE audit_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES comprehensive_audits(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'technical', 'content', 'seo'
  priority INTEGER CHECK (priority >= 1 AND priority <= 10),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  implementation TEXT,
  effort_level TEXT CHECK (effort_level IN ('low', 'medium', 'high'))
);
```

## API Implementation

### Main Audit Endpoint (Async)

```typescript
// app/api/audit/start/route.ts
export async function POST(request: Request) {
  const { url } = await request.json();
  
  // 1. Pre-flight check on the URL
  const preflight = await runPreflightCheck(url);
  if (!preflight.ok) {
    return NextResponse.json({ error: preflight.error }, { status: 400 });
  }

  // 2. Create a job in the comprehensive_audits table with 'pending' status
  // 3. Enqueue the job using Supabase Queues or similar
  // 4. Return 202 Accepted with the job_id
  return NextResponse.json({ jobId }, { status: 202 });
}
```

## 🎯 **Revised Implementation Plan**

#### **Phase 1: Core Infrastructure (Week 1)**
1. ✅ Set up async job queue and main audit endpoint.
2. ✅ Create the revised database schema.
3. ✅ Enhance Firecrawl client to capture HTML/DOM size.
4. ✅ Build the AI mentions analyzer using existing visibility data.

#### **Phase 2: Analysis Engines (Week 2)**  
1. ✅ Implement the enhanced schema analyzer with offline validation.
2. ✅ Implement image analysis with smart sampling.
3. ✅ Build rule-based content and link analyzers.
4. ✅ Develop the initial scoring algorithm using DB-based weights.

#### **Phase 3: Integration & UI (Week 3)**
1. ✅ Build the audit dashboard to display results.
2. ✅ Implement the exact CSV export functionality you requested.
3. ✅ Gate the LLM-powered features (summary, sentiment) behind a feature flag.

#### **Phase 4: Migration & Optimization (Week 4)**
1. ✅ Begin migrating users to the new system.
2. ✅ Implement the caching layer for key components.
3. ✅ Full rollout and deprecation of the old technical score.

This comprehensive audit system will position Split as the industry leader in AI-optimized content analysis, providing unprecedented insights into how AI systems perceive and evaluate web content. 