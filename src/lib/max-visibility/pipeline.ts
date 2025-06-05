// MAX Visibility Assessment Pipeline - GPT-4o Architecture
// Simple orchestration for GPT-4o powered analysis

import { ConversationalQuestionGenerator } from './question-generator'
import { PerplexityClient } from '../perplexity/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  MaxAssessmentRequest,
  MaxAssessmentResult,
  MaxQuestionAnalysis,
  MaxVisibilityScore,
  MaxVisibilityError,
  AssessmentStatus,
  MaxQuestionType
} from '@/types/max-visibility'

interface PipelineProgress {
  stage: 'setup' | 'questions' | 'analysis' | 'scoring' | 'complete'
  completed: number
  total: number
  message: string
}

interface KnowledgeBaseTags {
  'company-overview': string[]
  'target-audience': string[]
  'pain-points': string[]
  'positioning': string[]
  'product-features': string[]
  'use-cases': string[]
  'competitor-notes': string[]
  'sales-objections': string[]
  'brand-voice': string[]
  'keywords': string[]
  'other': string[]
}

interface EnhancedCompanyContext {
  // Basic info (existing)
  id: string
  name: string
  domain: string
  
  // Rich context from knowledge base
  overview: string[]
  targetAudience: string[]
  painPoints: string[]
  positioning: string[]
  productFeatures: string[]
  useCases: string[]
  competitors: string[]
  brandVoice: string[]
  keywords: string[]
  
  // GPT-4o enhanced insights
  industryCategory: string
  companySize: string
  businessModel: string
  aliases: string[]
  uniqueValueProps: string[]
  targetPersonas: string[]
  
  // Domains
  owned_domains: string[]
  operated_domains: string[]
}

export class MaxVisibilityPipeline {
  private questionGenerator: ConversationalQuestionGenerator
  private perplexityClient: PerplexityClient
  private supabase: ReturnType<typeof createServiceRoleClient>
  private gpt4oAnalysisCache: Map<string, any>

  constructor() {
    this.questionGenerator = new ConversationalQuestionGenerator()
    this.perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY!)
    this.supabase = createServiceRoleClient()
    this.gpt4oAnalysisCache = new Map()
  }

  /**
   * STEP 1: Knowledge Base-Driven Company Context Builder
   * This is the foundation for intelligent MAX Visibility analysis
   */
  async buildEnhancedCompanyContext(companyId: string): Promise<EnhancedCompanyContext> {
    try {
      console.log(`🧠 Building enhanced company context for ${companyId}`)
      
      // 1. Get basic company info
      const basicInfo = await this.getCompanyBasicInfo(companyId)
      
      // 2. Fetch all knowledge base entries for this company
      const { data: knowledgeEntries, error } = await this.supabase
        .from('knowledge_base_items')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.warn('❌ Failed to fetch knowledge base entries:', error)
        return this.createMinimalContext(basicInfo)
      }
      
      if (!knowledgeEntries || knowledgeEntries.length === 0) {
        console.log('📝 No knowledge base entries found, using minimal context')
        return this.createMinimalContext(basicInfo)
      }
      
      console.log(`📚 Found ${knowledgeEntries.length} knowledge base entries`)
      
      // 3. Group by tags
      const groupedKnowledge = this.groupKnowledgeByTags(knowledgeEntries)
      
      // 4. Use GPT-4o to extract structured insights
      const structuredInsights = await this.analyzeKnowledgeWithGPT4o(groupedKnowledge, basicInfo)
      
      // 5. Build enhanced context
      const enhancedContext: EnhancedCompanyContext = {
        // Basic info
        id: basicInfo.id,
        name: basicInfo.name,
        domain: basicInfo.domain,
        
        // Rich context from knowledge base
        overview: groupedKnowledge['company-overview'] || [],
        targetAudience: groupedKnowledge['target-audience'] || [],
        painPoints: groupedKnowledge['pain-points'] || [],
        positioning: groupedKnowledge['positioning'] || [],
        productFeatures: groupedKnowledge['product-features'] || [],
        useCases: groupedKnowledge['use-cases'] || [],
        competitors: this.extractCompetitors(groupedKnowledge['competitor-notes']),
        brandVoice: groupedKnowledge['brand-voice'] || [],
        keywords: groupedKnowledge['keywords'] || [],
        
        // GPT-4o enhanced insights
        industryCategory: structuredInsights.industryCategory,
        companySize: structuredInsights.companySize,
        businessModel: structuredInsights.businessModel,
        aliases: structuredInsights.aliases,
        uniqueValueProps: structuredInsights.uniqueValueProps,
        targetPersonas: structuredInsights.targetPersonas,
        
        // Domains
        owned_domains: [basicInfo.domain],
        operated_domains: this.inferOperatedDomains(basicInfo.domain)
      }
      
      console.log(`✅ Enhanced company context built successfully`)
      console.log(`📊 Context includes: ${enhancedContext.overview.length} overview items, ${enhancedContext.competitors.length} competitors, ${enhancedContext.keywords.length} keywords`)
      
      return enhancedContext
      
    } catch (error) {
      console.error('❌ Failed to build enhanced company context:', error)
      const basicInfo = await this.getCompanyBasicInfo(companyId)
      return this.createMinimalContext(basicInfo)
    }
  }

  /**
   * Get basic company info from database
   */
  private async getCompanyBasicInfo(companyId: string) {
    const { data: company, error } = await this.supabase
      .from('companies')
      .select('id, company_name, root_url')
      .eq('id', companyId)
      .single()
    
    if (error || !company) {
      throw new Error(`Company not found: ${companyId}`)
    }
    
    return {
      id: company.id,
      name: company.company_name,
      domain: company.root_url
    }
  }

  /**
   * Group knowledge base entries by their tags
   */
  private groupKnowledgeByTags(entries: any[]): KnowledgeBaseTags {
    const grouped: KnowledgeBaseTags = {
      'company-overview': [],
      'target-audience': [],
      'pain-points': [],
      'positioning': [],
      'product-features': [],
      'use-cases': [],
      'competitor-notes': [],
      'sales-objections': [],
      'brand-voice': [],
      'keywords': [],
      'other': []
    }
    
    entries.forEach(entry => {
      const tag = entry.tag as keyof KnowledgeBaseTags
      if (grouped[tag]) {
        grouped[tag].push(entry.content)
      } else {
        grouped['other'].push(entry.content)
      }
    })
    
    return grouped
  }

  /**
   * Use GPT-4o to analyze knowledge base and extract structured insights
   */
  private async analyzeKnowledgeWithGPT4o(
    groupedKnowledge: KnowledgeBaseTags, 
    basicInfo: { name: string; domain: string }
  ) {
    const prompt = `
Analyze this company's knowledge base and extract structured insights:

COMPANY: ${basicInfo.name}
DOMAIN: ${basicInfo.domain}

KNOWLEDGE BASE:
${Object.entries(groupedKnowledge)
  .filter(([_, items]) => items.length > 0)
  .map(([tag, items]) => 
    `${tag.toUpperCase().replace('-', ' ')}:\n${items.join('\n\n')}`
  ).join('\n\n---\n\n')}

Extract and infer the following insights (respond with JSON only):

{
  "industryCategory": "Specific category based on what this company actually does (e.g. 'sales research', 'lead generation', 'content creation', 'customer support', etc.) - be specific about their function 2-5 words, not generic like 'AI' or 'SaaS'",
  "companySize": "startup | small | medium | enterprise (based on context clues)",
  "businessModel": "B2B SaaS | marketplace | services | etc.",
  "aliases": ["Alternative names/terms people might use to refer to this company"],
  "uniqueValueProps": ["Key differentiators that set this company apart"],
  "targetPersonas": ["Primary buyer personas or customer types"],
  "specificCategory": "The most specific category for question generation - what type of tools/solutions do they compete with? (e.g. 'sales research tools', 'email marketing platforms', 'project management software')"
}

Important: Pay close attention to the specific language and terminology used in the company's knowledge base—use their own verbiage and phrasing, as this often reflects their SEO/AEO targeting and positioning. Avoid broad or generic categories; instead, identify the precise business function and solution as described in their materials (e.g., 'sales prospecting automation', 'cloud-based web services', 'ai sales research agents', etc.), not just high-level terms like 'AI company' or 'SaaS platform'.
`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert business analyst who extracts structured insights from company information. Always respond with valid JSON. Focus on determining the specific business function, not generic categories.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content received from GPT-4o')
      }

      const insights = JSON.parse(content)
      console.log('🤖 GPT-4o insights extracted:', insights)
      
      return {
        industryCategory: insights.industryCategory || insights.specificCategory || this.inferCategoryFromDomain(basicInfo.domain),
        companySize: insights.companySize || 'startup',
        businessModel: insights.businessModel || 'B2B SaaS',
        aliases: insights.aliases || [basicInfo.name, basicInfo.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0]],
        uniqueValueProps: insights.uniqueValueProps || [],
        targetPersonas: insights.targetPersonas || [],
        specificCategory: insights.specificCategory || insights.industryCategory || 'business software'
      }
      
    } catch (error) {
      console.error('❌ GPT-4o knowledge analysis failed:', error)
      return {
        industryCategory: this.inferCategoryFromDomain(basicInfo.domain),
        companySize: 'startup',
        businessModel: 'B2B SaaS',
        aliases: [basicInfo.name],
        uniqueValueProps: [],
        targetPersonas: [],
        specificCategory: 'business software'
      }
    }
  }

  /**
   * Extract competitor names from competitor notes
   */
  private extractCompetitors(competitorNotes: string[]): string[] {
    const competitors = new Set<string>()
    
    competitorNotes.forEach(note => {
      // Simple extraction - look for common patterns
      const matches = note.match(/\b[A-Z][a-zA-Z0-9]*(?:\.[a-zA-Z]{2,4})?\b/g) || []
      matches.forEach(match => {
        if (match.length > 2 && match.length < 20) {
          competitors.add(match)
        }
      })
    })
    
    return Array.from(competitors).slice(0, 10) // Limit to 10 competitors
  }

  /**
   * Create minimal context when knowledge base is empty
   */
  private createMinimalContext(basicInfo: { id: string; name: string; domain: string }): EnhancedCompanyContext {
    const domain = basicInfo.domain.replace(/^https?:\/\//, '').replace(/^www\./, '')
    const inferredCategory = this.inferCategoryFromDomain(domain)
    
    return {
      id: basicInfo.id,
      name: basicInfo.name,
      domain: basicInfo.domain,
      overview: [`${basicInfo.name} is a ${inferredCategory} company`],
      targetAudience: [],
      painPoints: [],
      positioning: [],
      productFeatures: [],
      useCases: [],
      competitors: [],
      brandVoice: [],
      keywords: [],
      industryCategory: inferredCategory,
      companySize: 'startup',
      businessModel: 'B2B SaaS',
      aliases: [basicInfo.name, domain.split('.')[0]],
      uniqueValueProps: [],
      targetPersonas: [],
      owned_domains: [basicInfo.domain],
      operated_domains: this.inferOperatedDomains(basicInfo.domain)
    }
  }

  /**
   * Simple fallback category inference from domain (only used when knowledge base is empty)
   */
  private inferCategoryFromDomain(domain: string): string {
    domain = domain.toLowerCase()
    
    // Simple broad categories as fallback only
    if (domain.includes('sales') || domain.includes('lead')) return 'Sales Technology'
    if (domain.includes('marketing')) return 'Marketing Technology'  
    if (domain.includes('fintech') || domain.includes('finance')) return 'FinTech'
    if (domain.includes('health') || domain.includes('medical')) return 'HealthTech'
    if (domain.includes('edu') || domain.includes('learn')) return 'EdTech'
    if (domain.includes('data') || domain.includes('analytics')) return 'Data & Analytics'
    
    // Generic fallbacks
    if (domain.includes('saas') || domain.includes('software')) return 'SaaS'
    if (domain.includes('ai') || domain.includes('ml')) return 'AI Technology'
    
    return 'Technology'
  }

  /**
   * Infer operated domains (social profiles, etc.)
   */
  private inferOperatedDomains(mainDomain: string): string[] {
    const companyName = mainDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0]
    
    return [
      `twitter.com/${companyName}`,
      `linkedin.com/company/${companyName}`,
      `github.com/${companyName}`,
      `${companyName}.substack.com`
    ]
  }

  /**
   * Run complete MAX Visibility assessment with enhanced company context
   */
  async runAssessment(
    request: MaxAssessmentRequest,
    onProgress?: (progress: PipelineProgress) => void,
    existingAssessmentId?: string
  ): Promise<MaxAssessmentResult> {
    const startTime = Date.now()
    
    // Create or use existing assessment record
    const assessmentId = existingAssessmentId || await this.createAssessmentRecord(request)
    
    // Create enhanced progress callback that saves to database
    const enhancedProgress = this.createProgressCallback(assessmentId, onProgress)
    
    try {
      // Validate request
      await this.validateRequest(request)
      
      // STEP 1: Build enhanced company context from knowledge base
      enhancedProgress({
        stage: 'setup',
        completed: 5,
        total: 100,
        message: 'Building enhanced company context from knowledge base...'
      })
      
      const enhancedContext = await this.buildEnhancedCompanyContext(request.company.id)
      
      // Update request with enhanced context
      const enhancedRequest = {
        ...request,
        company: {
          ...request.company,
          description: enhancedContext.overview.join(' '),
          industry: enhancedContext.industryCategory,
          aliases: enhancedContext.aliases,
          owned_domains: enhancedContext.owned_domains,
          operated_domains: enhancedContext.operated_domains
        }
      }
      
      // Stage 2: Generate questions using enhanced context
      enhancedProgress({
        stage: 'setup',
        completed: 15,
            total: 100,
        message: 'Generating intelligent questions from company context...'
      })
      
      const questions = await this.generateQuestions(enhancedRequest, assessmentId, enhancedContext)
      
      // Continue with rest of pipeline...
      const responses = await this.getAIResponses(questions, enhancedProgress)
      const analyses = await this.analyzeWithGPT4o(responses, enhancedRequest, assessmentId)
      const scores = this.calculateFinalScores(analyses)
      
      await this.saveResults(assessmentId, analyses, scores)
      
      enhancedProgress({
        stage: 'complete',
        completed: 100,
        total: 100,
        message: 'Assessment complete!'
      })
      
      const processingTime = Date.now() - startTime
      
      return {
        assessment_id: assessmentId,
        company: enhancedRequest.company,
        question_analyses: analyses,
        visibility_scores: scores,
        processing_time_ms: processingTime,
        completed_at: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('MAX Visibility assessment failed:', error)
      
      // Save error to database
      try {
        await this.supabase
          .from('max_visibility_runs')
          .update({
            status: 'failed',
            error_message: (error as Error).message,
            progress_percentage: 0,
            progress_stage: 'error',
            progress_message: `Failed: ${(error as Error).message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', assessmentId)
      } catch (updateError) {
        console.error('Failed to save error to database:', updateError)
      }
      
      throw this.createMaxVisibilityError(
        'ASSESSMENT_FAILED',
        `Assessment failed: ${(error as Error).message}`,
        { request: request.company.name }
      )
    }
  }

  /**
   * Generate questions using enhanced context and simplified generator
   */
  private async generateQuestions(
    request: MaxAssessmentRequest,
    assessmentId: string,
    enhancedContext?: EnhancedCompanyContext
  ): Promise<Array<{ id: string; question: string; type: MaxQuestionType }>> {
    const questionCount = request.question_count || 50
    
    const generatedQuestions = await this.questionGenerator.generateQuestions({
      company: request.company,
      enhancedContext, // Pass enhanced context to question generator
      question_count: questionCount,
      question_types: request.question_types || [
        'direct_conversational',
        'indirect_conversational', 
        'comparison_query',
        'recommendation_request',
        'explanatory_query'
      ]
    })
    
    console.log(`✅ Generated ${generatedQuestions.length} questions using enhanced context`)
    
    // Save questions to database
    const savedQuestions: Array<{ id: string; question: string; type: MaxQuestionType }> = []
    
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i]
      
        const { data, error } = await this.supabase
          .from('max_visibility_questions')
          .insert({
            run_id: assessmentId,
            question: q.question,
            question_type: q.type,
            position: i + 1
          })
          .select('id')
          .single()
        
        if (error) {
          console.error(`❌ Failed to save question ${i + 1}:`, error)
        savedQuestions.push({
          id: `${assessmentId}-q${i + 1}`,
          question: q.question,
          type: q.type
        })
      } else {
        savedQuestions.push({
          id: data.id,
          question: q.question,
          type: q.type
        })
      }
    }
    
    return savedQuestions
  }

  /**
   * Get AI responses from Perplexity in batches
   */
  private async getAIResponses(
    questions: Array<{ id: string; question: string; type: MaxQuestionType }>,
    onProgress?: (progress: PipelineProgress) => void
  ): Promise<Array<{ question: typeof questions[0], response: string, citations: string[] }>> {
    const responses: Array<{ question: typeof questions[0], response: string, citations: string[] }> = []
    const batchSize = 10
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize)
      
      console.log(`⚡ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)}`)
      
      const batchPromises = batch.map(async (question) => {
        try {
          const perplexityResponse = await this.perplexityClient.query({
            query: question.question,
            return_citations: true,
            return_related_questions: false
          })
          
          return {
            question,
            response: perplexityResponse.choices[0]?.message?.content || '',
            citations: perplexityResponse.citations || []
          }
        } catch (error) {
          console.error(`Failed to get response for question ${question.id}:`, error)
          return {
            question,
            response: '',
            citations: []
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      responses.push(...batchResults)
      
      // Update progress
      onProgress?.({
        stage: 'questions',
        completed: 20 + Math.round((i + batch.length) / questions.length * 40),
        total: 100,
        message: `Processed ${i + batch.length} of ${questions.length} questions`
      })
      
      // Rate limiting
      if (i + batchSize < questions.length) {
        await this.sleep(500)
      }
    }
    
    return responses
  }

  /**
   * Analyze responses with GPT-4o - THE CORE INTELLIGENCE
   */
  private async analyzeWithGPT4o(
    responses: Array<{ question: any, response: string, citations: string[] }>,
    request: MaxAssessmentRequest,
    assessmentId: string
  ): Promise<MaxQuestionAnalysis[]> {
    console.log(`🧠 Starting GPT-4o analysis of ${responses.length} responses (PARALLEL)`)
    
    // Store GPT-4o raw analysis for scoring algorithm
    this.gpt4oAnalysisCache = new Map()
    
    // Run all GPT-4o analyses in parallel for speed
    const analysisPromises = responses.map(async (responseData) => {
      try {
        // Call GPT-4o with the analysis prompt from architecture
        const gpt4oAnalysis = await this.callGPT4oAnalyzer({
          company: request.company,
          question: responseData.question.question,
          aiResponse: responseData.response,
          citations: responseData.citations
    })
    
        // Convert GPT-4o output to our analysis format
    const analysis: MaxQuestionAnalysis = {
          question_id: responseData.question.id,
          question_text: responseData.question.question,
          question_type: responseData.question.type,
          ai_response: responseData.response,
          response_citations: responseData.citations.map(url => ({
            url,
            text: url,
            title: url
      })),
          mention_analysis: gpt4oAnalysis.mention_analysis,
          citation_analysis: gpt4oAnalysis.citation_analysis,
          question_score: gpt4oAnalysis.insights.visibility_score,
      processed_at: new Date().toISOString()
    }
        
        // Cache GPT-4o analysis for scoring algorithm
        this.gpt4oAnalysisCache.set(responseData.question.id, gpt4oAnalysis)
    
        // Save individual analysis
        const responseId = await this.saveQuestionAnalysis(assessmentId, analysis)
        
        if (!responseId) {
          console.warn(`⚠️ Failed to save response for question ${responseData.question.id}`)
        }
        
        return analysis
        
      } catch (error) {
        console.error(`GPT-4o analysis failed for question ${responseData.question.id}:`, error)
        // Create error analysis
        return this.createErrorAnalysis(responseData.question, error as Error)
      }
    })
    
    // Wait for all analyses to complete in parallel
    const analyses = await Promise.all(analysisPromises)
    
    console.log(`✅ GPT-4o parallel analysis completed: ${analyses.length} responses processed`)
    
    return analyses
  }

  /**
   * Call GPT-4o for intelligent analysis - THE CORE INTELLIGENCE
   * This implements the comprehensive analysis prompt from the architecture
   */
  private async callGPT4oAnalyzer(data: {
    company: MaxAssessmentRequest['company'],
    question: string,
    aiResponse: string,
    citations: string[]
  }): Promise<any> {
    // Extract real competitor domains from citations and AI response
    const competitorDomains = this.extractCompetitorDomainsFromCitations(
      data.aiResponse, 
      data.citations
    )
    
    // Build domain hints for GPT-4o
    const domainHints = Array.from(competitorDomains.entries())
      .map(([company, domain]) => `${company}: ${domain}`)
      .join('\n')
    
    // Log domain extraction results
    if (competitorDomains.size > 0) {
      console.log(`🎯 Found ${competitorDomains.size} real competitor domains from citations:`)
      competitorDomains.forEach((domain, company) => {
        console.log(`   ${company} → ${domain}`)
      })
    } else {
      console.log(`⚠️ No competitor domains found in citations, GPT-4o will need to infer`)
    }
    
    const prompt = `
You are an expert AI visibility analyst. Analyze this conversational AI response for brand mentions, competitive positioning, and citation influence.

COMPANY CONTEXT:
- Target Company: ${data.company.name}
- Domain: ${data.company.domain}
- Industry: ${data.company.industry || 'Technology'}
- Description: ${data.company.description || 'Technology company'}

QUESTION ASKED:
"${data.question}"

AI RESPONSE TO ANALYZE:
"${data.aiResponse}"

CITATIONS PROVIDED:
${data.citations.length > 0 ? data.citations.map((url, i) => `${i + 1}. ${url}`).join('\n') : 'No citations provided'}

COMPETITOR DOMAIN MAPPING (USE THESE EXACT DOMAINS):
${domainHints || 'No competitor domains identified from citations'}

ANALYZE AND PROVIDE:

1. MENTION ANALYSIS:
   - mention_detected: boolean (Is ${data.company.name} explicitly mentioned?)
   - mention_position: "primary" | "secondary" | "passing" | "none" (How prominently featured?)
   - mention_sentiment: "very_positive" | "positive" | "neutral" | "negative" | "very_negative"
   - mention_context: string (exact quote mentioning the company, or empty if none)
   - confidence_score: number (0-1, how confident are you in this analysis?)

2. COMPETITOR ANALYSIS:
   - Extract ALL company/product mentions in the response
   - For each competitor found:
     * company_name: string (exact name mentioned in response)
     * domain: string (USE the domain from COMPETITOR DOMAIN MAPPING above if available, otherwise infer from company name)
     * mention_position: "primary" | "secondary" | "passing"
     * sentiment: "very_positive" | "positive" | "neutral" | "negative" | "very_negative"
     * context: string (quote mentioning this competitor)
   
   CRITICAL: For domain extraction:
   - FIRST check the COMPETITOR DOMAIN MAPPING above for exact matches
   - IF found in mapping, use that exact domain
   - IF not in mapping, infer the likely domain from company name:
     * "Jasper" → "jasper.ai"
     * "OpenAI" → "openai.com"
     * "Salesforce" → "salesforce.com"
     * "HubSpot" → "hubspot.com"
     * "Microsoft" → "microsoft.com"
     * "Google" → "google.com"
     * "Apple" → "apple.com"
     * "Slack" → "slack.com"
     * General pattern: CompanyName → companyname.com (lowercase)
   - NEVER use "unknown.com", "placeholder.com", or generic placeholders
   - If you truly cannot determine a domain, SKIP that competitor entirely

3. CITATION ANALYSIS:
   - For each citation URL, classify into:
     * "owned": Target company's own content (matches ${data.company.domain})
     * "operated": Target company's social/platform profiles (LinkedIn, Twitter, etc.)
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

RESPOND IN VALID JSON FORMAT ONLY:

{
  "mention_analysis": {
    "mention_detected": boolean,
    "mention_position": "primary" | "secondary" | "passing" | "none",
    "mention_sentiment": "very_positive" | "positive" | "neutral" | "negative" | "very_negative",
    "mention_context": "exact quote or empty string",
    "confidence_score": number
  },
  "competitor_analysis": [
    {
      "company_name": "string",
      "domain": "string",
      "mention_position": "primary" | "secondary" | "passing",
      "sentiment": "very_positive" | "positive" | "neutral" | "negative" | "very_negative",
      "context": "string"
    }
  ],
  "citation_analysis": [
    {
      "citation_url": "string",
      "bucket": "owned" | "operated" | "earned" | "competitor",
      "influence_score": number,
      "relevance_score": number
    }
  ],
  "topic_analysis": [
    {
      "topic": "string",
      "relevance": number,
      "sentiment": "very_positive" | "positive" | "neutral" | "negative" | "very_negative",
      "company_strength": number
    }
  ],
  "insights": {
    "competitive_position": "string",
    "content_opportunities": ["string"],
    "visibility_score": number
  }
}
`

    try {
    console.log(`🤖 Analyzing with GPT-4o: "${data.question.substring(0, 50)}..."`)
    
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI visibility analyst specialized in detecting and analyzing company mentions in AI responses. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const content = result.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content received from GPT-4o')
      }

      const analysis = JSON.parse(content)
      
      // Validate the response structure
      this.validateGPT4oAnalysis(analysis)
      
      console.log(`✅ GPT-4o analysis completed - Mention: ${analysis.mention_analysis.mention_detected}, Competitors: ${analysis.competitor_analysis.length}`)
      
      return analysis
      
    } catch (error) {
      console.error('❌ GPT-4o analysis failed:', error)
      
      // Return structured fallback analysis
      return this.createFallbackAnalysis(data)
    }
  }

  /**
   * Validate GPT-4o analysis response structure
   */
  private validateGPT4oAnalysis(analysis: any): void {
    const required = ['mention_analysis', 'competitor_analysis', 'citation_analysis', 'topic_analysis', 'insights']
    
    for (const field of required) {
      if (!analysis[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    if (typeof analysis.mention_analysis.mention_detected !== 'boolean') {
      throw new Error('Invalid mention_analysis structure: mention_detected must be boolean')
    }
  }

  /**
   * Create fallback analysis when GPT-4o fails
   */
  private createFallbackAnalysis(data: {
    company: MaxAssessmentRequest['company'],
    question: string,
    aiResponse: string,
    citations: string[]
  }): any {
    const companyMentioned = data.aiResponse.toLowerCase().includes(data.company.name.toLowerCase())
    
    return {
      mention_analysis: {
        mention_detected: companyMentioned,
        mention_position: companyMentioned ? 'secondary' : 'none',
        mention_sentiment: 'neutral',
        mention_context: companyMentioned ? `Fallback detection for ${data.company.name}` : '',
        confidence_score: companyMentioned ? 0.5 : 0.8
      },
      competitor_analysis: [],
      citation_analysis: data.citations.map(url => ({
        citation_url: url,
        bucket: url.includes(data.company.domain) ? 'owned' : 'earned',
        influence_score: 0.5,
        relevance_score: 0.5
      })),
      topic_analysis: [],
      insights: {
        competitive_position: 'Analysis failed - using fallback detection',
        content_opportunities: ['Improve AI visibility through content optimization'],
        visibility_score: 0.3
      }
    }
  }

  /**
   * Calculate final scores using tough-but-fair "Domain Authority" style algorithm
   * Creates right-skewed distribution where most companies score 10-30
   */
  private calculateFinalScores(analyses: MaxQuestionAnalysis[]): MaxVisibilityScore {
    console.log(`🎯 Calculating tough-but-fair MAX Visibility score for ${analyses.length} analyses`)
    
    const totalQuestions = analyses.length
    const mentionedQuestions = analyses.filter(a => a.mention_analysis.mention_detected).length
    
    // 1. Calculate Difficulty-Weighted Mention Score
    const weightedScore = this.calculateDifficultyWeightedScore(analyses)
    
    // 2. Calculate Competitive Landscape & Share of Voice
    const competitiveMetrics = this.calculateCompetitiveMetrics(analyses)
    
    // 3. Calculate Citation Quality Score
    const citationScore = this.calculateCitationQualityScore(analyses)
    
    // 4. Apply tough scoring curve (right-skewed like Domain Authority)
    const toughScore = this.applyToughScoringCurve(
      weightedScore,
      competitiveMetrics,
      citationScore
    )
    
    console.log(`📊 Score breakdown: Weighted=${(weightedScore*100).toFixed(1)}, Competitive=${(competitiveMetrics.shareOfVoice*100).toFixed(1)}%, Citation=${(citationScore*100).toFixed(1)}, Final=${toughScore.toFixed(1)}`)
    
    return {
      overall_score: Number((toughScore / 100).toFixed(4)),           // Convert back to 0-1 scale for API compatibility
      mention_rate: Number((mentionedQuestions / totalQuestions).toFixed(4)),
      mention_quality: Number(this.calculateAdvancedQualityScore(analyses).toFixed(4)),
      source_influence: Number(citationScore.toFixed(4)),
      competitive_positioning: Number(competitiveMetrics.shareOfVoice.toFixed(4)),
      response_consistency: Number(this.calculateConsistencyScore(analyses).toFixed(4)),
      total_questions: totalQuestions,
      mentioned_questions: mentionedQuestions,
      citation_breakdown: this.getCitationBreakdown(analyses),
      calculated_at: new Date().toISOString()
    }
  }

  /**
   * Calculate difficulty-weighted mention score based on question types
   * Indirect questions worth much more than direct mentions
   */
  private calculateDifficultyWeightedScore(analyses: MaxQuestionAnalysis[]): number {
    // Question difficulty weights (harder questions = more value)
    const difficultyWeights = {
      'direct_conversational': 0.2,      // Easy - company mentioned in question
      'comparison_query': 0.5,           // Medium - competitive landscape  
      'indirect_conversational': 1.0,    // Hard - AI suggests you organically
      'recommendation_request': 1.5,     // Very hard - buying decision influence
      'explanatory_query': 2.0           // Hardest - thought leadership mentions
    }
    
    let totalWeight = 0
    let achievedWeight = 0
    
    analyses.forEach(analysis => {
      const questionWeight = difficultyWeights[analysis.question_type] || 1.0
      totalWeight += questionWeight
      
      if (analysis.mention_analysis.mention_detected) {
        // Position multiplier (where you're mentioned matters)
        const positionMultiplier = {
          'primary': 1.0,    // First/main mention
          'secondary': 0.7,  // Supporting mention
          'passing': 0.3,    // Brief mention
          'none': 0
        }[analysis.mention_analysis.mention_position] || 0
        
        // Light sentiment adjustment (not too harsh)
        const sentimentMultiplier = {
          'very_positive': 1.2,
          'positive': 1.0,
          'neutral': 0.9,
          'negative': 0.8,
          'very_negative': 0.5
        }[analysis.mention_analysis.mention_sentiment] || 0.9
        
        achievedWeight += questionWeight * positionMultiplier * sentimentMultiplier
      }
    })
    
    const rawScore = totalWeight > 0 ? achievedWeight / totalWeight : 0
    console.log(`⚖️ Difficulty-weighted score: ${achievedWeight.toFixed(2)} / ${totalWeight.toFixed(2)} = ${(rawScore*100).toFixed(1)}%`)
    
    return rawScore
  }

  /**
   * Calculate competitive metrics including share of voice
   * Based on competitor count from GPT-4o analysis (niche size indicator)
   */
  private calculateCompetitiveMetrics(analyses: MaxQuestionAnalysis[]): {
    competitorCount: number,
    shareOfVoice: number,
    nicheSize: 'micro' | 'niche' | 'broad',
    competitiveBonus: number
  } {
    // Extract all unique competitors mentioned across analyses
    const allCompetitors = new Set<string>()
    let totalMentions = 0
    let yourMentions = 0
    
    analyses.forEach(analysis => {
      // Count your mentions
      if (analysis.mention_analysis.mention_detected) {
        yourMentions++
        totalMentions++
      }
      
      // Count competitor mentions from cached GPT-4o data
      const cachedAnalysis = this.gpt4oAnalysisCache.get(analysis.question_id)
      if (cachedAnalysis?.competitor_analysis) {
        cachedAnalysis.competitor_analysis.forEach((comp: any) => {
          allCompetitors.add(comp.company_name.toLowerCase())
          totalMentions++
        })
      }
    })
    
    const competitorCount = allCompetitors.size
    const shareOfVoice = totalMentions > 0 ? yourMentions / totalMentions : 0
    
    // Determine niche size based on competitor count
    let nicheSize: 'micro' | 'niche' | 'broad'
    let competitiveBonus = 1.0
    
    if (competitorCount <= 3) {
      nicheSize = 'micro'
      competitiveBonus = 0.8  // Micro niche gets less credit
    } else if (competitorCount <= 10) {
      nicheSize = 'niche'
      competitiveBonus = 1.0  // Normal scoring
    } else {
      nicheSize = 'broad'
      competitiveBonus = 1.3  // Broad market gets bonus for any mention
    }
    
    // Share of voice bonus (dominating your space)
    if (shareOfVoice > 0.6) competitiveBonus *= 1.3      // 60%+ = niche leader
    else if (shareOfVoice > 0.4) competitiveBonus *= 1.15 // 40%+ = strong player
    
    console.log(`🏆 Competitive metrics: ${competitorCount} competitors (${nicheSize}), ${(shareOfVoice*100).toFixed(1)}% voice, ${competitiveBonus.toFixed(2)}x bonus`)
    
    return {
      competitorCount,
      shareOfVoice,
      nicheSize,
      competitiveBonus
    }
  }

  /**
   * Calculate citation quality score
   * Owned content citations are most valuable
   */
  private calculateCitationQualityScore(analyses: MaxQuestionAnalysis[]): number {
    const citationBreakdown = this.getCitationBreakdown(analyses)
    const totalCitations = Object.values(citationBreakdown).reduce((sum, count) => sum + count, 0)
    
    if (totalCitations === 0) return 0
    
    // Weight different citation types
    const citationScore = (
      citationBreakdown.owned * 1.0 +       // Owned content = full value
      citationBreakdown.operated * 0.7 +    // Social/operated = good value  
      citationBreakdown.earned * 0.9 +      // Third-party earned = excellent value
      citationBreakdown.competitor * -0.2   // Competitor citations hurt slightly
    ) / totalCitations
    
    return Math.max(0, citationScore)
  }

  /**
   * Apply tough scoring curve to create right-skewed distribution
   * Most companies score 10-30, only exceptional brands hit 60-80+
   */
  private applyToughScoringCurve(
    weightedScore: number,
    competitiveMetrics: any,
    citationScore: number
  ): number {
    // Base score from difficulty-weighted mentions (0-1)
    let baseScore = weightedScore * 100
    
    // Apply competitive bonus/penalty
    baseScore *= competitiveMetrics.competitiveBonus
    
    // Citation bonus (up to +20 points)
    const citationBonus = citationScore * 20
    baseScore += citationBonus
    
    // Apply tough curve transformation (creates right-skewed distribution)
    // f(x) = 100 * (x^2 * (3 - 2x)) for smoother curve
    // This makes it much harder to get high scores
    const normalizedInput = Math.min(1, baseScore / 100)
    const curvedScore = 100 * (normalizedInput * normalizedInput * (3 - 2 * normalizedInput))
    
    // Apply final caps and floors
    let finalScore = curvedScore
    
    // Minimum score for any mentions (prevents 0 scores for companies getting some mentions)
    if (weightedScore > 0) {
      finalScore = Math.max(5, finalScore)
    }
    
    // Cap at realistic maximum (only true category leaders should hit 80+)
    finalScore = Math.min(95, finalScore)
    
    // Return with one decimal place precision instead of rounding to whole numbers
    return Math.round(finalScore * 10) / 10
  }

  /**
   * Calculate advanced quality score with sentiment and position weighting
   */
  private calculateAdvancedQualityScore(analyses: MaxQuestionAnalysis[]): number {
    const mentionedAnalyses = analyses.filter(a => a.mention_analysis.mention_detected)
    
    if (mentionedAnalyses.length === 0) return 0
    
    const qualityScores = mentionedAnalyses.map(analysis => {
      const positionScore = {
        'primary': 1.0,
        'secondary': 0.7, 
        'passing': 0.3,
        'none': 0
      }[analysis.mention_analysis.mention_position] || 0
      
      const sentimentScore = {
        'very_positive': 1.0,
        'positive': 0.8,
        'neutral': 0.6,
        'negative': 0.3,
        'very_negative': 0.1
      }[analysis.mention_analysis.mention_sentiment] || 0.6
      
      return positionScore * sentimentScore
    })
    
    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
  }

  /**
   * Calculate response consistency score
   */
  private calculateConsistencyScore(analyses: MaxQuestionAnalysis[]): number {
    // Simple consistency based on fact accuracy and confidence
    const confidenceScores = analyses
      .filter(a => a.mention_analysis.confidence_score)
      .map(a => a.mention_analysis.confidence_score)
    
    return confidenceScores.length > 0
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0.8 // Default reasonable consistency
  }

  // Helper methods (simplified)

  private calculateAverageQuality(analyses: MaxQuestionAnalysis[]): number {
    const qualityScores = analyses
      .filter(a => a.mention_analysis.mention_detected)
      .map(a => this.getQualityScore(a.mention_analysis))
    
    return qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0
  }

  private calculateAverageInfluence(analyses: MaxQuestionAnalysis[]): number {
    const allCitations = analyses.flatMap(a => a.citation_analysis || [])
    return allCitations.length > 0
      ? allCitations.reduce((sum, c) => sum + (c.influence_score || 0), 0) / allCitations.length
      : 0
  }

  private getQualityScore(mentionAnalysis: any): number {
    const positionScores = { 'primary': 1.0, 'secondary': 0.7, 'passing': 0.3 }
    const sentimentBonus = { 'very_positive': 0.3, 'positive': 0.2, 'neutral': 0.1, 'negative': -0.1, 'very_negative': -0.2 }
    
    const baseScore = positionScores[mentionAnalysis.mention_position as keyof typeof positionScores] || 0
    const bonus = sentimentBonus[mentionAnalysis.mention_sentiment as keyof typeof sentimentBonus] || 0
    
    return Math.max(0, Math.min(1, baseScore + bonus))
  }

  private getCitationBreakdown(analyses: MaxQuestionAnalysis[]): Record<string, number> {
    const breakdown = { owned: 0, operated: 0, earned: 0, competitor: 0 }
    
    for (const analysis of analyses) {
      for (const citation of analysis.citation_analysis || []) {
        breakdown[citation.bucket]++
      }
    }
    
    return breakdown
  }

  private async createAssessmentRecord(request: MaxAssessmentRequest): Promise<string> {
    const { data, error } = await this.supabase
      .from('max_visibility_runs')
      .insert({
        company_id: request.company.id || request.company.name,
        status: 'running',
        total_score: 0,
        mention_rate: 0,
        sentiment_score: 0,
        citation_score: 0,
        competitive_score: 0
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  private async saveQuestionAnalysis(assessmentId: string, analysis: MaxQuestionAnalysis): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('max_visibility_responses')
        .insert({
          question_id: analysis.question_id,
          full_response: analysis.ai_response,
          mention_detected: analysis.mention_analysis.mention_detected,
          mention_position: analysis.mention_analysis.mention_position,
          mention_sentiment: analysis.mention_analysis.mention_sentiment,
          mention_context: analysis.mention_analysis.mention_context || ''
        })
        .select('id')
        .single()

      if (error) {
        console.error('❌ Failed to save response:', error)
        return null
      }

      return data.id // Return the response ID for citations
    } catch (error) {
      console.error('❌ Error saving question analysis:', error)
      return null
    }
  }

  private async saveResults(
    assessmentId: string,
    analyses: MaxQuestionAnalysis[],
    scores: MaxVisibilityScore
  ): Promise<void> {
    // Update main assessment record
    await this.supabase
        .from('max_visibility_runs')
        .update({
          status: 'completed',
        total_score: scores.overall_score * 100,
          mention_rate: scores.mention_rate,
        sentiment_score: scores.mention_quality,
        citation_score: scores.source_influence,
        competitive_score: scores.competitive_positioning
        })
        .eq('id', assessmentId)

    // First, get the mapping of question IDs to response IDs
    const questionIds = analyses.map(a => a.question_id)
    const { data: responseRecords, error: responseError } = await this.supabase
      .from('max_visibility_responses')
      .select('id, question_id')
      .in('question_id', questionIds)

    if (responseError) {
      console.error('❌ Failed to fetch response IDs:', responseError)
      return
    }

    // Create mapping of question_id -> response_id
    const questionToResponseMap = new Map<string, string>()
    responseRecords?.forEach(record => {
      questionToResponseMap.set(record.question_id, record.id)
    })

    console.log(`📋 Mapped ${questionToResponseMap.size} questions to response IDs`)

    // Extract and save competitors from all analyses
    const allCompetitors = new Map<string, any>()
    const allCitations: any[] = []

    for (const analysis of analyses) {
      // Get cached GPT-4o analysis for competitor data
      const gpt4oAnalysis = this.gpt4oAnalysisCache?.get(analysis.question_id)
      
              // Collect competitors from GPT-4o analysis
        if (gpt4oAnalysis?.competitor_analysis) {
          for (const competitor of gpt4oAnalysis.competitor_analysis) {
            const key = competitor.company_name?.toLowerCase() || 'unknown'
            if (!allCompetitors.has(key) && competitor.company_name) {
              const domain = competitor.domain || ''
              
              // Only skip if domain is completely missing or clearly placeholder
              if (!domain || domain === 'placeholder.com') {
                console.warn(`⚠️ Skipping competitor "${competitor.company_name}" with missing/placeholder domain: "${domain}"`)
                continue
              }
              
              allCompetitors.set(key, {
                run_id: assessmentId,
                competitor_name: competitor.company_name,
                competitor_domain: domain,
                competitor_description: competitor.context || '',
                mention_count: 1,
                sentiment_average: this.convertSentimentToScore(competitor.sentiment),
                created_at: new Date().toISOString()
              })
              
              console.log(`✅ Valid competitor found: "${competitor.company_name}" → ${domain}`)
            }
          }
        }

      // Collect citations from structured analysis - use correct response ID
      const responseId = questionToResponseMap.get(analysis.question_id)
      if (responseId && analysis.citation_analysis && analysis.citation_analysis.length > 0) {
        for (const citation of analysis.citation_analysis) {
          if (citation.citation_url) {
            allCitations.push({
              response_id: responseId, // Use the actual response ID from database
              citation_url: citation.citation_url,
              citation_title: '',
              citation_domain: this.extractDomainFromUrl(citation.citation_url),
              citation_excerpt: '',
              bucket: citation.bucket || 'earned',
              influence_score: citation.influence_score || 0,
              relevance_score: citation.relevance_score || 0,
              position_in_citations: 1,
              created_at: new Date().toISOString()
            })
          }
        }
      } else if (!responseId) {
        console.warn(`⚠️ No response ID found for question ${analysis.question_id}, skipping citations`)
      }
    }

    // Save competitors to database
    if (allCompetitors.size > 0) {
      const competitorRecords = Array.from(allCompetitors.values())
      console.log(`💾 Attempting to save ${competitorRecords.length} competitors to database`)
      console.log(`📋 Sample competitor record:`, JSON.stringify(competitorRecords[0], null, 2))
      
      const { error: competitorError } = await this.supabase
        .from('max_visibility_competitors')
        .insert(competitorRecords)

      if (competitorError) {
        console.error('❌ Failed to save competitors:', competitorError)
        console.error('❌ Competitor error details:', JSON.stringify(competitorError, null, 2))
      } else {
        console.log(`✅ Saved ${competitorRecords.length} competitors`)
        
        // Verify the save by counting records
        const { data: verifyCompetitors, error: verifyError } = await this.supabase
          .from('max_visibility_competitors')
          .select('id')
          .eq('run_id', assessmentId)
        
        if (verifyError) {
          console.error('❌ Failed to verify competitor save:', verifyError)
        } else {
          console.log(`✅ Verification: ${verifyCompetitors?.length || 0} competitors saved for assessment ${assessmentId}`)
        }
      }
    } else {
      console.log('⚠️ No competitors to save')
    }

    // Save citations to database
    if (allCitations.length > 0) {
      console.log(`💾 Attempting to save ${allCitations.length} citations to database`)
      console.log(`📋 Sample citation record:`, JSON.stringify(allCitations[0], null, 2))
      
      const { error: citationError } = await this.supabase
        .from('max_visibility_citations')
        .insert(allCitations)

      if (citationError) {
        console.error('❌ Failed to save citations:', citationError)
        console.error('❌ Citation error details:', JSON.stringify(citationError, null, 2))
      } else {
        console.log(`✅ Saved ${allCitations.length} citations`)
        
        // Verify the save by counting records
        const { data: verifyCitations, error: verifyError } = await this.supabase
          .from('max_visibility_citations')
          .select('id')
          .in('response_id', Array.from(questionToResponseMap.values()))
        
        if (verifyError) {
          console.error('❌ Failed to verify citation save:', verifyError)
        } else {
          console.log(`✅ Verification: ${verifyCitations?.length || 0} citations saved`)
        }
      }
    } else {
      console.log('⚠️ No citations to save')
    }

    console.log(`✅ Saved results for assessment ${assessmentId} - ${allCompetitors.size} competitors, ${allCitations.length} citations`)
  }

  // Helper method to convert sentiment string to numeric score
  private convertSentimentToScore(sentiment: string): number {
    switch (sentiment?.toLowerCase()) {
      case 'very_positive': return 1.0
      case 'positive': return 0.5
      case 'neutral': return 0.0
      case 'negative': return -0.5
      case 'very_negative': return -1.0
      default: return 0.0
    }
  }

  // Helper method to extract domain from URL
  private extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      let domain = urlObj.hostname.toLowerCase()
      
      // Remove www. prefix
      if (domain.startsWith('www.')) {
        domain = domain.substring(4)
      }
      
      return domain
    } catch (error) {
      console.warn(`Invalid URL for domain extraction: ${url}`)
      return 'unknown.com'
    }
  }

  private async validateRequest(request: MaxAssessmentRequest): Promise<void> {
    if (!request.company?.name || !request.company?.domain) {
      throw new Error('Company name and domain are required')
    }
  }

  private createErrorAnalysis(
    question: { id: string; question: string; type: MaxQuestionType },
    error: Error
  ): MaxQuestionAnalysis {
    return {
      question_id: question.id,
      question_text: question.question,
      question_type: question.type,
      ai_response: '',
      response_citations: [],
      mention_analysis: {
        mention_detected: false,
        mention_position: 'none',
        mention_sentiment: 'neutral',
        mention_context: '',
        confidence_score: 0,
        reasoning: `Processing failed: ${error.message}`
      },
      citation_analysis: [],
      question_score: 0,
      processed_at: new Date().toISOString()
    }
  }

  private createMaxVisibilityError(
    code: string,
    message: string,
    details?: Record<string, any>
  ): MaxVisibilityError {
    return { code, message, details }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Public method for testing Step 3: Get AI responses from Perplexity
   * Exposes the private getAIResponses method for testing
   */
  async testStep3_getAIResponses(
    questions: Array<{ id: string; question: string; type: MaxQuestionType }>,
    onProgress?: (progress: PipelineProgress) => void
  ): Promise<Array<{ question: typeof questions[0], response: string, citations: string[] }>> {
    return this.getAIResponses(questions, onProgress)
  }

  /**
   * Public method for testing: Generate questions using enhanced context
   * Exposes question generation with enhanced context
   */
  async testStep2_generateQuestions(
    companyData: {
      id: string
      name: string
      domain: string
      description?: string
      industry?: string
    },
    enhancedContext?: EnhancedCompanyContext
  ): Promise<Array<{ id: string; question: string; type: MaxQuestionType }>> {
    const generatedQuestions = await this.questionGenerator.generateQuestions({
      company: companyData,
      enhancedContext,
      question_count: 50,
      question_types: [
        'direct_conversational',
        'indirect_conversational', 
        'comparison_query',
        'recommendation_request',
        'explanatory_query'
      ]
    })
    
    // Convert to pipeline format
    return generatedQuestions.map((q, index) => ({
      id: `test-q${index + 1}`,
      question: q.question,
      type: q.type
    }))
  }

  /**
   * Public method for testing Step 4: GPT-4o Analysis
   * Exposes the GPT-4o analyzer for testing individual responses
   */
  async testStep4_analyzeWithGPT4o(
    company: {
      id: string
      name: string
      domain: string
      description?: string
      industry?: string
    },
    responses: Array<{ question: any, response: string, citations: string[] }>
  ): Promise<any[]> {
    console.log(`🧠 Testing Step 4: GPT-4o analysis of ${responses.length} responses (PARALLEL)`)
    
    // Run all GPT-4o analyses in parallel for speed
    const analysisPromises = responses.map(async (responseData) => {
      try {
        const gpt4oAnalysis = await this.callGPT4oAnalyzer({
          company,
          question: responseData.question.question,
          aiResponse: responseData.response,
          citations: responseData.citations
        })
        
        return {
          question_id: responseData.question.id,
          question_text: responseData.question.question,
          analysis: gpt4oAnalysis,
          processed_at: new Date().toISOString()
        }
        
      } catch (error) {
        console.error(`GPT-4o analysis failed for question ${responseData.question.id}:`, error)
        return {
          question_id: responseData.question.id,
          question_text: responseData.question.question,
          analysis: this.createFallbackAnalysis({
            company,
            question: responseData.question.question,
            aiResponse: responseData.response,
            citations: responseData.citations
          }),
          error: (error as Error).message,
          processed_at: new Date().toISOString()
        }
      }
    })
    
    // Wait for all analyses to complete in parallel
    const analyses = await Promise.all(analysisPromises)
    
    console.log(`✅ GPT-4o parallel test analysis completed: ${analyses.length} responses processed`)
    
    return analyses
  }

  /**
   * Public method for testing Step 5: Tough-but-Fair Scoring Algorithm
   * Exposes the scoring algorithm for testing final score calculations
   */
  testStep5_calculateFinalScores(analyses: MaxQuestionAnalysis[]): MaxVisibilityScore {
    return this.calculateFinalScores(analyses)
  }

  /**
   * Save progress update to database for real-time UI updates
   */
  private async saveProgressUpdate(
    assessmentId: string, 
    progress: PipelineProgress
  ): Promise<void> {
    try {
      await this.supabase
        .from('max_visibility_runs')
        .update({
          progress_percentage: progress.completed,
          progress_stage: progress.stage,
          progress_message: progress.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
      
      console.log(`📊 Progress saved: ${progress.completed}% - ${progress.stage} - ${progress.message}`)
    } catch (error) {
      console.error('❌ Failed to save progress update:', error)
      // Don't throw - progress updates shouldn't fail the whole pipeline
    }
  }

  /**
   * Create enhanced progress callback that saves to database
   */
  private createProgressCallback(
    assessmentId: string,
    userCallback?: (progress: PipelineProgress) => void
  ): (progress: PipelineProgress) => void {
    return async (progress: PipelineProgress) => {
      // Save to database for status API
      await this.saveProgressUpdate(assessmentId, progress)
      
      // Call user callback if provided
      if (userCallback) {
        userCallback(progress)
      }
    }
  }

  /**
   * Extract domain from URL and build citation-to-company mapping
   */
  private buildCitationDomainMapping(citations: string[]): Map<string, string> {
    const domainMapping = new Map<string, string>()
    
    citations.forEach(url => {
      try {
        const domain = this.extractDomainFromUrl(url)
        if (domain && domain !== 'unknown.com') {
          domainMapping.set(domain, url)
        }
      } catch (error) {
        // Skip invalid URLs
      }
    })
    
    return domainMapping
  }

  /**
   * Smart competitor extraction from citations
   * Maps competitors mentioned in text to their actual domains from citations
   */
  private extractCompetitorDomainsFromCitations(
    aiResponse: string,
    citations: string[]
  ): Map<string, string> {
    const competitorDomains = new Map<string, string>()
    
    // Extract domains from all citations
    const citationDomains = new Set<string>()
    citations.forEach(url => {
      try {
        const domain = this.extractDomainFromUrl(url)
        if (domain && !this.isGenericDomain(domain)) {
          citationDomains.add(domain)
        }
      } catch (error) {
        // Skip invalid URLs
      }
    })
    
    console.log(`🔗 Found ${citationDomains.size} unique domains in citations:`, Array.from(citationDomains))
    
    // For each citation domain, check if it's mentioned in the AI response
    citationDomains.forEach(domain => {
      // Extract company name from domain (basic approach)
      const companyName = this.extractCompanyNameFromDomain(domain)
      
      // Check if this company/domain is mentioned in the response
      // NOTE: We're being more permissive here - if a domain appears in citations,
      // it's likely relevant even if not explicitly mentioned in the response text
      if (this.isDomainRelevantToResponse(domain, companyName, aiResponse)) {
        competitorDomains.set(companyName, domain)
        console.log(`✅ Mapped competitor: "${companyName}" → ${domain}`)
      } else {
        // Still include domains from citations even if not explicitly mentioned
        // The fact that they're cited suggests relevance
        competitorDomains.set(companyName, domain)
        console.log(`✅ Including competitor from citation: "${companyName}" → ${domain}`)
      }
    })
    
    return competitorDomains
  }
  
  /**
   * Check if a domain is generic/not a company domain
   */
  private isGenericDomain(domain: string): boolean {
    const genericDomains = [
      'google.com', 'wikipedia.org', 'youtube.com', 'github.com',
      'stackoverflow.com', 'reddit.com', 'medium.com', 'linkedin.com',
      'twitter.com', 'facebook.com', 'amazon.com', 'microsoft.com',
      'apple.com', 'forbes.com', 'techcrunch.com', 'venturebeat.com'
    ]
    
    return genericDomains.includes(domain) || 
           domain.includes('wikipedia') || 
           domain.includes('blog.') ||
           domain.includes('news.')
  }
  
  /**
   * Extract company name from domain
   */
  private extractCompanyNameFromDomain(domain: string): string {
    // Remove common TLDs and get the main part
    const mainPart = domain.replace(/\.(com|io|ai|net|org|co|dev)$/, '')
    
    // Convert to title case
    return mainPart.charAt(0).toUpperCase() + mainPart.slice(1)
  }
  
  /**
   * Check if a domain/company is mentioned in the AI response
   */
  private isDomainRelevantToResponse(domain: string, companyName: string, aiResponse: string): boolean {
    const lowerResponse = aiResponse.toLowerCase()
    const lowerDomain = domain.toLowerCase()
    const lowerCompanyName = companyName.toLowerCase()
    
    // Check for exact domain mention
    if (lowerResponse.includes(lowerDomain)) {
      return true
    }
    
    // Check for company name mention (but be more careful about partial matches)
    const words = lowerResponse.split(/\s+/)
    const isNameMentioned = words.some(word => {
      // Remove punctuation for comparison
      const cleanWord = word.replace(/[.,!?;:()]/g, '')
      return cleanWord === lowerCompanyName || 
             (lowerCompanyName.length > 4 && cleanWord.includes(lowerCompanyName))
    })
    
    if (!isNameMentioned) {
      return false
    }
    
    // Additional check: make sure it's mentioned in a competitive context
    // Look for surrounding context that suggests competition
    const competitiveKeywords = [
      'competitor', 'alternative', 'versus', 'vs', 'compare', 'similar', 
      'rival', 'competing', 'against', 'instead of', 'rather than',
      'other options', 'other tools', 'other platforms', 'other solutions'
    ]
    
    // Split response into sentences
    const sentences = lowerResponse.split(/[.!?]+/)
    
    // Check if the company is mentioned in a sentence with competitive context
    const isInCompetitiveContext = sentences.some(sentence => {
      const mentionsCompany = sentence.includes(lowerCompanyName) || sentence.includes(lowerDomain)
      const hasCompetitiveContext = competitiveKeywords.some(keyword => sentence.includes(keyword))
      return mentionsCompany && hasCompetitiveContext
    })
    
    // Also check if it's mentioned alongside other known business software/tools
    const businessSoftwareKeywords = [
      'crm', 'sales', 'marketing', 'automation', 'software', 'platform', 
      'tool', 'solution', 'service', 'technology', 'system', 'api',
      'integration', 'workflow', 'analytics', 'dashboard'
    ]
    
    const isInBusinessContext = sentences.some(sentence => {
      const mentionsCompany = sentence.includes(lowerCompanyName) || sentence.includes(lowerDomain)
      const hasBusinessContext = businessSoftwareKeywords.some(keyword => sentence.includes(keyword))
      return mentionsCompany && hasBusinessContext
    })
    
    // Return true only if mentioned in competitive OR business context
    return isInCompetitiveContext || isInBusinessContext
  }
} 