# Knowledge Base Integration Feature Map

## 🎯 **Feature Overview**

**Intelligent Knowledge Extraction System:** Users dump unstructured company information into a text box, and GPT-4o automatically extracts, categorizes, and structures it into multiple knowledge base entries that power MAX Visibility analysis.

---

## 📊 **Current State vs Target State**

### **Current State (Content Page)**
- ✅ Knowledge base UI with text input
- ✅ Auto-tagging system (11 predefined tags)
- ✅ Searchable/filterable table view
- ✅ CRUD operations (create, edit, delete)
- ✅ Word count tracking
- ❌ **Not connected to MAX Visibility**

### **Target State (Integrated)**
- ✅ All existing content page functionality
- ✅ **Knowledge base powers MAX Visibility questions**
- ✅ **GPT-4o analyzes knowledge for company insights**
- ✅ **Context-aware question generation**
- ✅ **Real competitive intelligence**

---

## 🗄️ **Database Schema Updates**

### **New Table: `knowledge_base_items`**
```sql
CREATE TABLE knowledge_base_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tag VARCHAR(50) NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_knowledge_base_company_id ON knowledge_base_items(company_id);
CREATE INDEX idx_knowledge_base_tag ON knowledge_base_items(tag);
CREATE INDEX idx_knowledge_base_created_at ON knowledge_base_items(created_at);

-- Full text search
CREATE INDEX idx_knowledge_base_content_search ON knowledge_base_items 
USING gin(to_tsvector('english', content));
```

### **Updated `max_visibility_runs` table**
```sql
-- Add knowledge base tracking
ALTER TABLE max_visibility_runs ADD COLUMN knowledge_base_version INTEGER DEFAULT 0;
ALTER TABLE max_visibility_runs ADD COLUMN knowledge_items_count INTEGER DEFAULT 0;
ALTER TABLE max_visibility_runs ADD COLUMN context_completeness_score DECIMAL(3,2) DEFAULT 0;
```

---

## 🔄 **Integration Flow**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content Page  │───▶│ Knowledge Base  │───▶│ MAX Visibility  │
│                 │    │                 │    │                 │
│ • Text Input    │    │ • Store Tags    │    │ • Rich Context  │
│ • Auto-Tag      │    │ • Group by Tag  │    │ • Smart Questions│
│ • Manage Items  │    │ • GPT-4o Analyze│    │ • Better Analysis│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🏗️ **Implementation Components**

### **1. Knowledge Base Service Layer**

**File:** `src/lib/knowledge-base/service.ts`
```typescript
interface KnowledgeBaseService {
  // CRUD Operations
  createItem(companyId: string, content: string, tag: string): Promise<KnowledgeItem>
  updateItem(id: string, content: string, tag: string): Promise<KnowledgeItem>
  deleteItem(id: string): Promise<void>
  getItems(companyId: string, filters?: KnowledgeFilters): Promise<KnowledgeItem[]>
  
  // Analysis Operations
  getGroupedKnowledge(companyId: string): Promise<GroupedKnowledge>
  analyzeKnowledgeCompleteness(companyId: string): Promise<CompletenessScore>
  extractCompetitors(companyId: string): Promise<string[]>
  
  // Integration Operations
  buildCompanyContext(companyId: string): Promise<EnhancedCompanyContext>
  generateContextualQuestions(companyId: string, count: number): Promise<Question[]>
}
```

### **2. GPT-4o Knowledge Analyzer**

**File:** `src/lib/knowledge-base/gpt4o-analyzer.ts`
```typescript
class KnowledgeAnalyzer {
  // Analyze knowledge base for structured insights
  async analyzeCompanyKnowledge(knowledge: GroupedKnowledge): Promise<CompanyInsights>
  
  // Generate questions based on knowledge
  async generateQuestionsFromContext(context: EnhancedCompanyContext): Promise<Question[]>
  
  // Extract competitive intelligence
  async extractCompetitiveIntelligence(knowledge: GroupedKnowledge): Promise<CompetitiveInsights>
  
  // Assess knowledge completeness
  async assessContextCompleteness(knowledge: GroupedKnowledge): Promise<CompletenessAssessment>
}
```

### **3. Enhanced Pipeline Integration**

**File:** `src/lib/max-visibility/pipeline.ts` (Updated)
```typescript
// Replace hardcoded question generation
class MaxVisibilityPipeline {
  private knowledgeService: KnowledgeBaseService
  
  private async generateQuestions(request: MaxAssessmentRequest): Promise<Question[]> {
    // 1. Get rich company context from knowledge base
    const context = await this.knowledgeService.buildCompanyContext(request.company.id)
    
    // 2. Check context completeness
    const completeness = await this.knowledgeService.analyzeKnowledgeCompleteness(request.company.id)
    
    // 3. Generate questions based on available context
    if (completeness.score > 0.7) {
      // Rich context - use GPT-4o for intelligent questions
      return await this.knowledgeService.generateContextualQuestions(
        request.company.id, 
        request.question_count
      )
    } else {
      // Limited context - use enhanced templates + basic inference
      return await this.generateEnhancedTemplateQuestions(context, request.question_count)
    }
  }
}
```

---

## 🎨 **UI/UX Updates**

### **Content Page Enhancements**

**1. Knowledge Completeness Indicator**
```tsx
// Add to content page header
<div className="flex items-center gap-2">
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full bg-green-500" />
    <span className="text-sm text-[#666]">Knowledge Base: 85% Complete</span>
  </div>
  <Badge variant="outline" className="text-xs">
    Ready for MAX Analysis
  </Badge>
</div>
```

**2. MAX Visibility Integration Status**
```tsx
// Add to knowledge base tab
<div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-medium text-white">MAX Visibility Integration</h3>
      <p className="text-sm text-[#666]">
        Your knowledge base will power smarter AI visibility analysis
      </p>
    </div>
    <Button 
      onClick={() => router.push('/dashboard')}
      className="bg-blue-600 hover:bg-blue-700"
    >
      Run Analysis
    </Button>
  </div>
</div>
```

**3. Tag Suggestions & Guidance**
```tsx
// Enhanced tag selector with guidance
<div className="space-y-2">
  <Label>Content Category</Label>
  <Select value={selectedTag} onValueChange={setSelectedTag}>
    <SelectContent>
      {tagCategories.map(category => (
        <SelectItem key={category.value} value={category.value}>
          <div className="flex items-center gap-2">
            <category.icon className="w-4 h-4" />
            <span>{category.label}</span>
            <Badge variant="outline" className="text-xs">
              {getTagCount(category.value)}
            </Badge>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-[#666]">
    {getTagGuidance(selectedTag)}
  </p>
</div>
```

### **Dashboard Integration Indicators**

**1. Knowledge-Powered Badge**
```tsx
// Show on MAX visibility cards when knowledge base is used
{usedKnowledgeBase && (
  <Badge className="bg-purple-100 text-purple-800">
    <Brain className="w-3 h-3 mr-1" />
    Knowledge-Powered
  </Badge>
)}
```

**2. Context Quality Indicator**
```tsx
// Show context completeness in assessment
<div className="flex items-center gap-2">
  <span className="text-sm text-[#666]">Context Quality:</span>
  <div className="flex items-center gap-1">
    {[1,2,3,4,5].map(i => (
      <div 
        key={i}
        className={`w-2 h-2 rounded-full ${
          i <= Math.floor(contextScore * 5) ? 'bg-green-500' : 'bg-[#333]'
        }`}
      />
    ))}
  </div>
  <span className="text-sm text-white">{Math.round(contextScore * 100)}%</span>
</div>
```

---

## 🚀 **Implementation Phases**

### **Phase 1: Foundation (Week 1)**
- [ ] Create `knowledge_base_items` table
- [ ] Build KnowledgeBaseService CRUD operations
- [ ] Connect content page to database (replace mock data)
- [ ] Add basic completeness scoring

### **Phase 2: GPT-4o Integration (Week 2)**  
- [ ] Create GPT-4o knowledge analyzer
- [ ] Build company context extraction
- [ ] Implement intelligent question generation
- [ ] Add competitor extraction logic

### **Phase 3: Pipeline Integration (Week 3)**
- [ ] Update MAX visibility pipeline to use knowledge base
- [ ] Add context quality indicators to UI
- [ ] Implement fallback for minimal knowledge
- [ ] Add knowledge-powered badges

### **Phase 4: Enhancement (Week 4)**
- [ ] Add knowledge completeness guidance
- [ ] Implement smart tag suggestions
- [ ] Add integration status indicators
- [ ] Performance optimization & caching

---

## 📊 **Success Metrics**

### **Usage Metrics**
- Knowledge base adoption rate (% of users adding content)
- Average knowledge items per company
- Tag distribution and completeness
- Knowledge → MAX assessment conversion rate

### **Quality Metrics**
- Context completeness scores
- Question relevance ratings (user feedback)
- Mention detection accuracy improvement
- Competitive intelligence quality

### **Business Metrics**  
- Assessment completion rates (with vs without knowledge base)
- User engagement with knowledge-powered results
- Feature upgrade correlation (knowledge → paid plans)
- Customer feedback on question quality

---

## 🔧 **Technical Considerations**

### **Performance**
- Cache analyzed company contexts (TTL: 24 hours)
- Batch GPT-4o calls for multiple assessments
- Index knowledge base for fast searching
- Paginate large knowledge bases

### **Data Privacy**
- Encrypt sensitive knowledge base content
- Company data isolation (RLS policies)
- Audit trail for knowledge modifications
- GDPR compliance for data deletion

### **Reliability**
- Graceful fallback when knowledge is insufficient
- Error handling for GPT-4o analysis failures
- Backup simple template system
- Progress indicators for long operations

### **Scalability**
- Horizontal scaling for GPT-4o analysis
- Knowledge base size limits by plan tier
- Rate limiting for API calls
- Background processing for large analyses

---

## 🎯 **Next Steps**

1. **Review & Approve** this feature map
2. **Database Migration** - Create knowledge_base_items table
3. **Content Page Integration** - Connect to real database
4. **Basic Pipeline Integration** - Update Step 1 to use knowledge base
5. **GPT-4o Enhancement** - Add intelligent analysis layer

**Ready to start with Phase 1?** 🚀 

## 🔄 **How It Works: Text Dump → Structured Knowledge**

### **User Experience Flow:**
```
1. User pastes text dump: "Our company Split helps B2B SaaS companies create content at scale. We're different from Jasper because we focus on strategic content planning rather than just writing. Our main customers are marketing teams at companies like HubSpot and Salesforce who struggle with maintaining brand consistency..."

2. System processes with GPT-4o

3. Creates multiple knowledge base entries:
   ├── company-overview: "Split helps B2B SaaS companies create content at scale"
   ├── positioning: "Different from Jasper because we focus on strategic content planning rather than just writing"  
   ├── target-audience: "Marketing teams at B2B SaaS companies"
   ├── competitor-notes: "Jasper - focuses on writing, we focus on strategic planning"
   ├── pain-points: "Maintaining brand consistency across content"
   └── use-cases: "Content creation at scale for B2B companies"

4. User can filter table by any tag to see all related entries
```

### **GPT-4o Knowledge Extraction Engine:**

**File:** `src/lib/knowledge-base/extraction-engine.ts`
```typescript
interface TextDumpProcessor {
  // Main extraction function
  extractKnowledgeFromDump(textDump: string, companyId: string): Promise<ExtractedKnowledge[]>
  
  // Individual extraction methods
  analyzeAndCategorize(text: string): Promise<CategorizedInsights>
  validateExtractions(insights: CategorizedInsights): Promise<ValidatedInsights>
  createKnowledgeEntries(insights: ValidatedInsights, companyId: string): Promise<KnowledgeItem[]>
}

interface ExtractedKnowledge {
  content: string          // The specific piece of information
  tag: string             // Auto-assigned category
  confidence: number      // Confidence in the categorization (0-1)
  sourceContext: string   // Context from original dump
  wordCount: number       // Calculated word count
}
```

**GPT-4o Extraction Prompt:**
```typescript
const extractionPrompt = `
Analyze this company information dump and extract discrete, actionable knowledge items. Break down the text into specific insights and categorize each one.

TEXT DUMP:
"${textDump}"

EXTRACTION INSTRUCTIONS:
1. Break the text into distinct pieces of information
2. Assign each piece to the most appropriate category:
   - company-overview: Core business description, what the company does
   - target-audience: Who the customers/users are, demographics, company types
   - pain-points: Problems customers face, challenges addressed
   - positioning: How company differentiates, unique value props
   - product-features: Specific capabilities, features, functionalities
   - use-cases: How customers use the product, scenarios, applications
   - competitor-notes: Mentions of competitors, competitive positioning
   - sales-objections: Common objections and responses
   - brand-voice: Tone, messaging style, communication guidelines
   - keywords: Important terms, phrases, industry jargon
   - other: Information that doesn't fit other categories

3. Each extracted item should be:
   - Self-contained and understandable
   - Specific and actionable
   - 1-3 sentences maximum
   - Focused on a single insight

4. Provide confidence score for each categorization

RESPOND IN JSON FORMAT:
{
  "extracted_items": [
    {
      "content": "Specific piece of information",
      "tag": "appropriate-category",
      "confidence": 0.95,
      "reasoning": "Why this categorization makes sense"
    }
  ]
}
`
```

### **Enhanced Content Page UI:**

**1. Intelligent Text Dump Processor**
```tsx
// Enhanced text input with processing indicator
<div className="space-y-4">
  <div className="relative">
    <textarea
      placeholder="Paste anything about your company - marketing materials, product descriptions, competitor analysis, customer feedback, positioning docs, sales decks, etc. Our AI will automatically organize it into your knowledge base."
      value={textDump}
      onChange={(e) => setTextDump(e.target.value)}
      className="w-full bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#2a2a2a] focus:border-[#3a3a3a] text-white p-4 rounded-md text-sm transition-all duration-200 resize-none leading-relaxed min-h-[120px]"
      rows={8}
    />
    
    {/* Processing indicator */}
    {isProcessing && (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-sm text-white">Extracting knowledge...</span>
        </div>
      </div>
    )}
  </div>
  
  {/* Smart extraction button */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-xs text-[#666]">
      {textDump && (
        <>
          <span>{textDump.trim().split(' ').length} words</span>
          <span>•</span>
          <span>~{Math.ceil(estimateExtractions(textDump))} entries expected</span>
        </>
      )}
    </div>
    
    <Button
      onClick={handleSmartExtraction}
      disabled={!textDump.trim() || isProcessing}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Extract Knowledge
    </Button>
  </div>
</div>
```

**2. Extraction Preview & Approval**
```tsx
// Show extracted items before saving
{extractedItems.length > 0 && (
  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-medium text-white">
        Extracted {extractedItems.length} Knowledge Items
      </h3>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleApproveAll}
          variant="outline"
          size="sm"
          className="text-green-500 border-green-500/20 hover:bg-green-500/10"
        >
          Approve All
        </Button>
        <Button
          onClick={handleReviewItems}
          variant="outline" 
          size="sm"
        >
          Review & Edit
        </Button>
      </div>
    </div>
    
    {/* Preview grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {extractedItems.map((item, idx) => (
        <div key={idx} className="bg-[#111] border border-[#222] rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={`text-xs ${getTagColor(item.tag)}`}
            >
              {item.tag.replace('-', ' ')}
            </Badge>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#666]">
                {Math.round(item.confidence * 100)}% confident
              </span>
              <button
                onClick={() => removeExtractedItem(idx)}
                className="text-red-500 hover:text-red-400 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="text-sm text-white leading-relaxed">
            {item.content}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
```

**3. Enhanced Knowledge Table with Source Tracking**
```tsx
// Updated table to show source context
<div className="grid grid-cols-12 gap-0 border-b border-[#111] hover:bg-[#0c0c0c] transition-all duration-150">
  {/* Content Cell - now shows source context on hover */}
  <div className="col-span-5 px-3 py-2 border-r border-[#111] relative group">
    <p className="text-sm text-white leading-relaxed line-clamp-2">
      {item.content}
    </p>
    
    {/* Source context tooltip */}
    <div className="absolute left-0 top-full mt-1 bg-[#1a1a1a] border border-[#333] rounded p-2 text-xs text-[#999] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 max-w-xs">
      <strong>Source context:</strong><br />
      "{item.sourceContext}"
    </div>
  </div>
  
  {/* Category with confidence indicator */}
  <div className="col-span-2 px-3 py-2 border-r border-[#111] flex items-center gap-2">
    <Badge variant="outline" className="text-xs">
      {item.tag.replace('-', ' ')}
    </Badge>
    {item.confidence && (
      <div className={`w-2 h-2 rounded-full ${
        item.confidence > 0.8 ? 'bg-green-500' : 
        item.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
      }`} title={`${Math.round(item.confidence * 100)}% confidence`} />
    )}
  </div>
  
  {/* Rest of table columns... */}
</div>
```

---

## 🧠 **Smart Processing Logic**

### **Extraction Algorithm:**
```typescript
async function extractKnowledgeFromDump(textDump: string, companyId: string): Promise<ExtractedKnowledge[]> {
  // 1. Pre-process text (clean, chunk if too large)
  const processedText = preprocessText(textDump)
  
  // 2. Extract with GPT-4o
  const gptResponse = await analyzeWithGPT4o(extractionPrompt, processedText)
  
  // 3. Validate and clean extractions
  const validatedItems = validateExtractions(gptResponse.extracted_items)
  
  // 4. Check for duplicates against existing knowledge base
  const deduplicatedItems = await removeDuplicates(validatedItems, companyId)
  
  // 5. Calculate word counts and metadata
  return deduplicatedItems.map(item => ({
    ...item,
    wordCount: item.content.trim().split(' ').length,
    extractedAt: new Date().toISOString(),
    sourceLength: textDump.length
  }))
}
```

### **Duplicate Detection:**
```typescript
async function removeDuplicates(newItems: ExtractedKnowledge[], companyId: string): Promise<ExtractedKnowledge[]> {
  const existingItems = await getKnowledgeItems(companyId)
  
  return newItems.filter(newItem => {
    // Check semantic similarity with existing items
    const isDuplicate = existingItems.some(existing => 
      calculateSimilarity(newItem.content, existing.content) > 0.8
    )
    return !isDuplicate
  })
}
```

### **Smart Tag Suggestions:**
```typescript
// Suggest additional tags if content could fit multiple categories
function suggestAlternateTags(content: string, primaryTag: string): string[] {
  const suggestions = []
  
  // Cross-category analysis
  if (primaryTag === 'company-overview' && content.includes('customer')) {
    suggestions.push('target-audience')
  }
  if (primaryTag === 'positioning' && content.includes('unlike') || content.includes('different')) {
    suggestions.push('competitor-notes')
  }
  
  return suggestions
}
```

---

## 📊 **Example Processing Flow**

**Input Text Dump:**
```
"Split is an AI-powered content platform for B2B SaaS companies. Unlike Jasper and Copy.ai which focus on generic writing, we specialize in strategic content planning. Our customers are primarily marketing teams at 50-500 employee companies like HubSpot, Salesforce, and Pipedrive. The main problem we solve is helping teams maintain brand consistency while scaling content production. Common objections include 'AI content lacks authenticity' - we address this by training on brand voice and requiring human oversight."
```

**GPT-4o Extracted Output:**
```json
{
  "extracted_items": [
    {
      "content": "Split is an AI-powered content platform for B2B SaaS companies",
      "tag": "company-overview",
      "confidence": 0.95,
      "reasoning": "Core business description"
    },
    {
      "content": "Unlike Jasper and Copy.ai which focus on generic writing, we specialize in strategic content planning",
      "tag": "positioning", 
      "confidence": 0.92,
      "reasoning": "Direct competitive differentiation"
    },
    {
      "content": "Marketing teams at 50-500 employee companies like HubSpot, Salesforce, and Pipedrive",
      "tag": "target-audience",
      "confidence": 0.88,
      "reasoning": "Specific customer demographics and examples"
    },
    {
      "content": "Helping teams maintain brand consistency while scaling content production",
      "tag": "pain-points",
      "confidence": 0.85,
      "reasoning": "Problem being solved"
    },
    {
      "content": "Jasper and Copy.ai - focus on generic writing vs our strategic content planning",
      "tag": "competitor-notes",
      "confidence": 0.90,
      "reasoning": "Competitive analysis information"
    },
    {
      "content": "AI content lacks authenticity - we address this by training on brand voice and requiring human oversight",
      "tag": "sales-objections",
      "confidence": 0.87,
      "reasoning": "Common objection with response strategy"
    }
  ]
}
```

**Result:** 6 structured knowledge base entries from one text dump! 🎯

This approach makes the knowledge base **much more user-friendly** while creating **much richer context** for MAX Visibility analysis. 