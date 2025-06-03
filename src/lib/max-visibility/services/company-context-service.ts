import { createServiceRoleClient } from '@/lib/supabase/server'
import { 
  EnhancedCompanyContext, 
  KnowledgeBaseTags, 
  BasicCompanyInfo 
} from '../types/pipeline-types'

export class CompanyContextService {
  private supabase: ReturnType<typeof createServiceRoleClient>

  constructor() {
    this.supabase = createServiceRoleClient()
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
  async getCompanyBasicInfo(companyId: string): Promise<BasicCompanyInfo> {
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
   * Analyze knowledge base entries with GPT-4o to extract structured insights
   */
  private async analyzeKnowledgeWithGPT4o(
    groupedKnowledge: KnowledgeBaseTags, 
    basicInfo: { name: string; domain: string }
  ) {
    // This would be the GPT-4o analysis implementation
    // For now, providing a fallback structure
    return {
      industryCategory: this.inferCategoryFromDomain(basicInfo.domain),
      companySize: 'unknown',
      businessModel: 'B2B SaaS',
      aliases: [basicInfo.name],
      uniqueValueProps: [],
      targetPersonas: []
    }
  }

  /**
   * Extract competitors from competitor notes
   */
  private extractCompetitors(competitorNotes: string[]): string[] {
    if (!competitorNotes || competitorNotes.length === 0) return []
    
    const competitors: string[] = []
    competitorNotes.forEach(note => {
      // Simple extraction - in real implementation, this would be more sophisticated
      const words = note.split(/\s+/)
      words.forEach(word => {
        if (word.length > 3 && /^[A-Z]/.test(word)) {
          competitors.push(word.replace(/[.,!?]$/, ''))
        }
      })
    })
    
    return [...new Set(competitors)] // Remove duplicates
  }

  /**
   * Create minimal context when knowledge base is empty
   */
  private createMinimalContext(basicInfo: BasicCompanyInfo): EnhancedCompanyContext {
    return {
      // Basic info
      id: basicInfo.id,
      name: basicInfo.name,
      domain: basicInfo.domain,
      
      // Empty arrays for knowledge base data
      overview: [],
      targetAudience: [],
      painPoints: [],
      positioning: [],
      productFeatures: [],
      useCases: [],
      competitors: [],
      brandVoice: [],
      keywords: [],
      
      // Inferred insights
      industryCategory: this.inferCategoryFromDomain(basicInfo.domain),
      companySize: 'unknown',
      businessModel: 'B2B SaaS',
      aliases: [basicInfo.name],
      uniqueValueProps: [],
      targetPersonas: [],
      
      // Domains
      owned_domains: [basicInfo.domain],
      operated_domains: this.inferOperatedDomains(basicInfo.domain)
    }
  }

  /**
   * Infer industry category from domain
   */
  private inferCategoryFromDomain(domain: string): string {
    const lowerDomain = domain.toLowerCase()
    
    if (lowerDomain.includes('health') || lowerDomain.includes('medical')) return 'Healthcare'
    if (lowerDomain.includes('finance') || lowerDomain.includes('bank')) return 'Finance'
    if (lowerDomain.includes('edu') || lowerDomain.includes('learn')) return 'Education'
    if (lowerDomain.includes('retail') || lowerDomain.includes('shop')) return 'Retail'
    if (lowerDomain.includes('tech') || lowerDomain.includes('software')) return 'Technology'
    
    return 'Technology' // Default fallback
  }

  /**
   * Infer operated domains from main domain
   */
  private inferOperatedDomains(mainDomain: string): string[] {
    const baseDomain = mainDomain.replace(/^www\./, '')
    return [
      baseDomain,
      `www.${baseDomain}`,
      `app.${baseDomain}`,
      `api.${baseDomain}`
    ]
  }
} 