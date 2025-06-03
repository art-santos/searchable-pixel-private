export interface PipelineProgress {
  stage: 'setup' | 'questions' | 'analysis' | 'scoring' | 'complete'
  completed: number
  total: number
  message: string
}

export interface KnowledgeBaseTags {
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

export interface EnhancedCompanyContext {
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

export interface CompetitiveMetrics {
  competitorCount: number
  shareOfVoice: number
  nicheSize: 'micro' | 'niche' | 'broad'
  competitiveBonus: number
}

export interface BasicCompanyInfo {
  id: string
  name: string
  domain: string
}

export interface GPT4oAnalysisData {
  company: {
    id: string
    name: string
    domain: string
    description?: string
    industry?: string
  }
  question: string
  aiResponse: string
  citations: string[]
} 