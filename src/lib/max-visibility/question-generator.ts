// Conversational Question Generator for MAX Visibility System
// Generates AI-style conversational questions tailored to specific companies

import {
  QuestionTemplate,
  QuestionGenerationRequest,
  GeneratedQuestion,
  MaxQuestionType
} from '@/types/max-visibility'

interface CompanyContext {
  name: string
  domain: string
  description?: string
  industry?: string
  brandName?: string
  competitors?: string[]
  useCase?: string
  size?: 'startup' | 'small' | 'medium' | 'enterprise'
}

export class ConversationalQuestionGenerator {
  private templates: QuestionTemplate[]
  private industryKeywords: Record<string, string[]>
  private useCaseKeywords: Record<string, string[]>

  constructor() {
    this.templates = this.initializeTemplates()
    this.industryKeywords = this.initializeIndustryKeywords()
    this.useCaseKeywords = this.initializeUseCaseKeywords()
  }

  /**
   * Generate a balanced set of conversational questions for a company
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    const context = this.buildCompanyContext(request.company)
    const targetTypes = request.question_types || this.getDefaultQuestionTypes()
    
    // Calculate question distribution
    const distribution = this.calculateQuestionDistribution(request.question_count, targetTypes)
    
    const questions: GeneratedQuestion[] = []
    
    for (const [type, count] of Object.entries(distribution)) {
      const typeQuestions = await this.generateQuestionsOfType(
        type as MaxQuestionType,
        count,
        context
      )
      questions.push(...typeQuestions)
    }
    
    // Shuffle questions to avoid predictable patterns
    return this.shuffleQuestions(questions)
  }

  /**
   * Generate questions of a specific type
   */
  private async generateQuestionsOfType(
    type: MaxQuestionType,
    count: number,
    context: CompanyContext
  ): Promise<GeneratedQuestion[]> {
    const typeTemplates = this.templates.filter(t => t.type === type)
    const questions: GeneratedQuestion[] = []
    
    // Select templates with weighted randomization
    const selectedTemplates = this.selectTemplatesWeighted(typeTemplates, count)
    
    for (const template of selectedTemplates) {
      try {
        const customizedQuestion = await this.customizeQuestion(template, context)
        questions.push(customizedQuestion)
      } catch (error) {
        console.warn(`Failed to customize template ${template.id}:`, error)
        // Continue with other templates
      }
    }
    
    return questions
  }

  /**
   * Customize a question template with company-specific context
   */
  private async customizeQuestion(
    template: QuestionTemplate,
    context: CompanyContext
  ): Promise<GeneratedQuestion> {
    let customizedText = template.template
    const customizationContext: Record<string, any> = {}
    
    // Replace variable placeholders
    for (const variable of template.variables) {
      const value = this.getVariableValue(variable, context)
      customizedText = customizedText.replace(`{${variable}}`, value)
      customizationContext[variable] = value
    }
    
    // Add dynamic context based on company
    customizationContext.industry = context.industry
    customizationContext.company_size = context.size
    customizationContext.domain = context.domain
    
    // Calculate confidence score based on context completeness
    const confidenceScore = this.calculateConfidenceScore(template, context)
    
    return {
      question: customizedText,
      type: template.type,
      template_used: template.id,
      customization_context: customizationContext,
      confidence_score: confidenceScore
    }
  }

  /**
   * Get value for a template variable
   */
  private getVariableValue(variable: string, context: CompanyContext): string {
    switch (variable) {
      case 'company':
        return context.name
      
      case 'domain':
        return context.domain
      
      case 'brand':
        return context.brandName || context.name
      
      case 'industry':
        return context.industry || 'technology'
      
      case 'category':
        return this.inferCategory(context)
      
      case 'use_case':
        return this.inferUseCase(context)
      
      case 'company_size':
        return this.getCompanySizeText(context.size)
      
      case 'competitor1':
        return context.competitors?.[0] || 'leading competitors'
      
      case 'competitor2':
        return context.competitors?.[1] || 'other market players'
      
      case 'competitor3':
        return context.competitors?.[2] || 'alternative solutions'
      
      case 'problem_space':
        return this.inferProblemSpace(context)
      
      case 'solution_type':
        return this.inferSolutionType(context)
      
      case 'market':
        return this.inferMarket(context)
      
      case 'budget':
        return this.getBudgetRange(context.size)
      
      case 'role':
        return this.getTypicalRole(context)
      
      default:
        return variable // Return variable name if no mapping found
    }
  }

  /**
   * Calculate question distribution across types
   */
  private calculateQuestionDistribution(
    totalQuestions: number,
    types: MaxQuestionType[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {}
    
    // Default distribution percentages
    const defaultDistribution = {
      direct_conversational: 0.30,      // 30% - Brand-specific questions
      indirect_conversational: 0.25,    // 25% - Competitive landscape
      comparison_query: 0.20,           // 20% - Direct comparisons
      recommendation_request: 0.15,     // 15% - Recommendation queries
      explanatory_query: 0.10          // 10% - Educational queries
    }
    
    const totalWeight = types.reduce((sum, type) => sum + defaultDistribution[type], 0)
    
    for (const type of types) {
      const percentage = defaultDistribution[type] / totalWeight
      distribution[type] = Math.max(1, Math.round(totalQuestions * percentage))
    }
    
    // Adjust for rounding errors
    const assignedTotal = Object.values(distribution).reduce((sum, count) => sum + count, 0)
    if (assignedTotal !== totalQuestions) {
      const diff = totalQuestions - assignedTotal
      const primaryType = types[0]
      distribution[primaryType] += diff
    }
    
    return distribution
  }

  /**
   * Initialize question templates
   */
  private initializeTemplates(): QuestionTemplate[] {
    return [
      // Direct Conversational (Brand-specific)
      {
        id: 'direct-eval-01',
        template: "Help me understand what {company} does and if it's right for my {use_case} needs",
        type: 'direct_conversational',
        variables: ['company', 'use_case'],
        weight: 1.0,
        category: 'evaluation'
      },
      {
        id: 'direct-eval-02',
        template: "I'm evaluating {company} for our {company_size} company - what should I know about their pricing and features?",
        type: 'direct_conversational',
        variables: ['company', 'company_size'],
        weight: 1.0,
        category: 'evaluation'
      },
      {
        id: 'direct-comp-01',
        template: "Compare {company} to {competitor1} and {competitor2} for enterprise use",
        type: 'direct_conversational',
        variables: ['company', 'competitor1', 'competitor2'],
        weight: 0.9,
        category: 'comparison'
      },
      {
        id: 'direct-decision-01',
        template: "What are the pros and cons of choosing {company} over alternatives in the {category} space?",
        type: 'direct_conversational',
        variables: ['company', 'category'],
        weight: 1.0,
        category: 'decision'
      },
      {
        id: 'direct-approach-01',
        template: "Walk me through {company}'s approach to {problem_space} and why it matters",
        type: 'direct_conversational',
        variables: ['company', 'problem_space'],
        weight: 0.8,
        category: 'explanation'
      },
      {
        id: 'direct-choice-01',
        template: "Is {company} a good choice for {use_case}? What are the alternatives I should consider?",
        type: 'direct_conversational',
        variables: ['company', 'use_case'],
        weight: 1.0,
        category: 'choice'
      },
      {
        id: 'direct-investment-01',
        template: "Is {company} worth the investment for a {company_size} company? What's the typical ROI?",
        type: 'direct_conversational',
        variables: ['company', 'company_size'],
        weight: 0.9,
        category: 'investment'
      },
      {
        id: 'direct-implement-01',
        template: "If I choose {company}, what should I know about implementation and getting started?",
        type: 'direct_conversational',
        variables: ['company'],
        weight: 0.8,
        category: 'implementation'
      },

      // Indirect Conversational (Competitive landscape)
      {
        id: 'indirect-options-01',
        template: "I need to choose the best {category} platform for my startup - what are my options?",
        type: 'indirect_conversational',
        variables: ['category'],
        weight: 1.0,
        category: 'options'
      },
      {
        id: 'indirect-criteria-01',
        template: "What should I look for when evaluating {category} tools for enterprise use?",
        type: 'indirect_conversational',
        variables: ['category'],
        weight: 1.0,
        category: 'criteria'
      },
      {
        id: 'indirect-landscape-01',
        template: "Help me understand the landscape of {market} solutions and key players",
        type: 'indirect_conversational',
        variables: ['market'],
        weight: 0.9,
        category: 'landscape'
      },
      {
        id: 'indirect-building-01',
        template: "I'm building a {use_case} solution - what tools and platforms should I consider?",
        type: 'indirect_conversational',
        variables: ['use_case'],
        weight: 1.0,
        category: 'building'
      },
      {
        id: 'indirect-tradeoffs-01',
        template: "What are the trade-offs between different approaches to {problem_space}?",
        type: 'indirect_conversational',
        variables: ['problem_space'],
        weight: 0.8,
        category: 'tradeoffs'
      },
      {
        id: 'indirect-recommend-01',
        template: "Recommend the top {category} solutions for {company_size} companies in 2024",
        type: 'indirect_conversational',
        variables: ['category', 'company_size'],
        weight: 1.0,
        category: 'recommendations'
      },
      {
        id: 'indirect-budget-01',
        template: "I have a {budget} budget for {category} tools - what do you recommend?",
        type: 'indirect_conversational',
        variables: ['budget', 'category'],
        weight: 0.9,
        category: 'budget'
      },
      {
        id: 'indirect-role-01',
        template: "I'm a {role} at a {company_size} company looking for {solution_type} - what should I consider?",
        type: 'indirect_conversational',
        variables: ['role', 'company_size', 'solution_type'],
        weight: 0.8,
        category: 'role-specific'
      },

      // Comparison Queries
      {
        id: 'comp-detailed-01',
        template: "Create a detailed comparison of {company} vs {competitor1} vs {competitor2}",
        type: 'comparison_query',
        variables: ['company', 'competitor1', 'competitor2'],
        weight: 1.0,
        category: 'detailed'
      },
      {
        id: 'comp-usecase-01',
        template: "Compare {company} and {competitor1} for {use_case} - which is better?",
        type: 'comparison_query',
        variables: ['company', 'competitor1', 'use_case'],
        weight: 1.0,
        category: 'use-case'
      },
      {
        id: 'comp-pricing-01',
        template: "How does {company}'s pricing compare to {competitor1} and other {category} tools?",
        type: 'comparison_query',
        variables: ['company', 'competitor1', 'category'],
        weight: 0.9,
        category: 'pricing'
      },
      {
        id: 'comp-features-01',
        template: "Compare the features and capabilities of {company} versus {competitor1}",
        type: 'comparison_query',
        variables: ['company', 'competitor1'],
        weight: 1.0,
        category: 'features'
      },
      {
        id: 'comp-enterprise-01',
        template: "{company} vs {competitor1} for enterprise customers - comprehensive comparison",
        type: 'comparison_query',
        variables: ['company', 'competitor1'],
        weight: 0.9,
        category: 'enterprise'
      },

      // Recommendation Requests
      {
        id: 'rec-budget-01',
        template: "I have {budget} to spend on {category} - what do you recommend and why?",
        type: 'recommendation_request',
        variables: ['budget', 'category'],
        weight: 1.0,
        category: 'budget-based'
      },
      {
        id: 'rec-best-01',
        template: "What's the best {category} solution for {use_case} in 2024?",
        type: 'recommendation_request',
        variables: ['category', 'use_case'],
        weight: 1.0,
        category: 'best-in-class'
      },
      {
        id: 'rec-startup-01',
        template: "Recommend {category} tools for a growing startup focused on {use_case}",
        type: 'recommendation_request',
        variables: ['category', 'use_case'],
        weight: 0.9,
        category: 'startup'
      },
      {
        id: 'rec-specific-01',
        template: "I need a {solution_type} that integrates well with our existing tech stack - recommendations?",
        type: 'recommendation_request',
        variables: ['solution_type'],
        weight: 0.8,
        category: 'integration'
      },

      // Explanatory Queries
      {
        id: 'exp-differences-01',
        template: "Explain the key differences between {category} platforms like {company} and {competitor1}",
        type: 'explanatory_query',
        variables: ['category', 'company', 'competitor1'],
        weight: 0.9,
        category: 'differences'
      },
      {
        id: 'exp-market-01',
        template: "How has the {market} market evolved and what are the leading solutions?",
        type: 'explanatory_query',
        variables: ['market'],
        weight: 0.8,
        category: 'market-evolution'
      },
      {
        id: 'exp-approach-01',
        template: "What are the different approaches to {problem_space} and their trade-offs?",
        type: 'explanatory_query',
        variables: ['problem_space'],
        weight: 0.8,
        category: 'approaches'
      },
      {
        id: 'exp-choosing-01',
        template: "How do I choose between {category} solutions? What criteria matter most?",
        type: 'explanatory_query',
        variables: ['category'],
        weight: 0.9,
        category: 'selection-criteria'
      }
    ]
  }

  // Helper methods for context inference

  private buildCompanyContext(company: QuestionGenerationRequest['company']): CompanyContext {
    const domain = company.domain.replace(/^https?:\/\//, '').replace(/^www\./, '')
    const brandName = domain.split('.')[0]
    
    return {
      name: company.name,
      domain: company.domain,
      description: company.description,
      industry: company.industry,
      brandName,
      size: this.inferCompanySize(company),
      competitors: [],
      useCase: this.inferUseCase({ 
        name: company.name, 
        description: company.description,
        industry: company.industry 
      })
    }
  }

  private inferCategory(context: CompanyContext): string {
    const description = (context.description || '').toLowerCase()
    const industry = (context.industry || '').toLowerCase()
    
    const categoryMap = {
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml'],
      'saas': ['saas', 'software as a service', 'cloud', 'platform'],
      'analytics': ['analytics', 'data', 'business intelligence', 'bi'],
      'marketing': ['marketing', 'advertising', 'campaign', 'email'],
      'sales': ['sales', 'crm', 'lead generation', 'prospecting'],
      'productivity': ['productivity', 'collaboration', 'workflow', 'automation'],
      'security': ['security', 'cybersecurity', 'privacy', 'compliance'],
      'fintech': ['fintech', 'finance', 'payment', 'banking'],
      'ecommerce': ['ecommerce', 'e-commerce', 'retail', 'shopping']
    }
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => 
        description.includes(keyword) || industry.includes(keyword)
      )) {
        return category
      }
    }
    
    return 'technology'
  }

  private inferUseCase(context: Partial<CompanyContext>): string {
    const description = (context.description || '').toLowerCase()
    
    const useCaseMap = {
      'customer support': ['support', 'help desk', 'ticket', 'customer service'],
      'data analysis': ['analytics', 'data analysis', 'reporting', 'insights'],
      'project management': ['project', 'task', 'workflow', 'collaboration'],
      'marketing automation': ['marketing', 'email', 'campaign', 'automation'],
      'sales enablement': ['sales', 'lead', 'prospecting', 'crm'],
      'content creation': ['content', 'writing', 'creation', 'publishing'],
      'team communication': ['communication', 'chat', 'messaging', 'collaboration']
    }
    
    for (const [useCase, keywords] of Object.entries(useCaseMap)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return useCase
      }
    }
    
    return 'business operations'
  }

  private inferProblemSpace(context: CompanyContext): string {
    const category = this.inferCategory(context)
    
    const problemSpaceMap = {
      'ai': 'artificial intelligence and automation',
      'saas': 'software delivery and scalability',
      'analytics': 'data analysis and insights',
      'marketing': 'customer acquisition and engagement',
      'sales': 'revenue generation and customer relationships',
      'productivity': 'operational efficiency and collaboration',
      'security': 'data protection and compliance',
      'fintech': 'financial services and payments',
      'ecommerce': 'online commerce and customer experience'
    }
    
    return problemSpaceMap[category as keyof typeof problemSpaceMap] || 'business optimization'
  }

  private inferSolutionType(context: CompanyContext): string {
    const category = this.inferCategory(context)
    
    const solutionTypeMap = {
      'ai': 'AI-powered platform',
      'saas': 'cloud-based solution',
      'analytics': 'data analytics platform',
      'marketing': 'marketing automation tool',
      'sales': 'sales enablement platform',
      'productivity': 'productivity suite',
      'security': 'security solution',
      'fintech': 'financial technology platform',
      'ecommerce': 'e-commerce platform'
    }
    
    return solutionTypeMap[category as keyof typeof solutionTypeMap] || 'software platform'
  }

  private inferMarket(context: CompanyContext): string {
    const category = this.inferCategory(context)
    
    const marketMap = {
      'ai': 'AI and machine learning',
      'saas': 'SaaS and cloud computing',
      'analytics': 'business intelligence and analytics',
      'marketing': 'marketing technology',
      'sales': 'sales technology',
      'productivity': 'productivity and collaboration',
      'security': 'cybersecurity',
      'fintech': 'financial technology',
      'ecommerce': 'e-commerce and retail technology'
    }
    
    return marketMap[category as keyof typeof marketMap] || 'business technology'
  }

  private inferCompanySize(company: QuestionGenerationRequest['company']): CompanyContext['size'] {
    // Simple heuristic based on description and industry
    const description = (company.description || '').toLowerCase()
    
    if (description.includes('startup') || description.includes('early stage')) {
      return 'startup'
    }
    
    if (description.includes('enterprise') || description.includes('large')) {
      return 'enterprise'
    }
    
    if (description.includes('small') || description.includes('local')) {
      return 'small'
    }
    
    return 'medium' // Default assumption
  }

  private getCompanySizeText(size?: CompanyContext['size']): string {
    const sizeMap = {
      'startup': 'startup',
      'small': 'small business',
      'medium': 'mid-size company',
      'enterprise': 'enterprise organization'
    }
    
    return sizeMap[size || 'medium']
  }

  private getBudgetRange(size?: CompanyContext['size']): string {
    const budgetMap = {
      'startup': '$1,000-$5,000 monthly',
      'small': '$5,000-$15,000 monthly',
      'medium': '$15,000-$50,000 monthly',
      'enterprise': '$50,000+ monthly'
    }
    
    return budgetMap[size || 'medium']
  }

  private getTypicalRole(context: CompanyContext): string {
    const category = this.inferCategory(context)
    
    const roleMap = {
      'ai': 'AI Engineer',
      'saas': 'Product Manager',
      'analytics': 'Data Analyst',
      'marketing': 'Marketing Manager',
      'sales': 'Sales Director',
      'productivity': 'Operations Manager',
      'security': 'Security Officer',
      'fintech': 'Finance Director',
      'ecommerce': 'E-commerce Manager'
    }
    
    return roleMap[category as keyof typeof roleMap] || 'Decision Maker'
  }

  private getDefaultQuestionTypes(): MaxQuestionType[] {
    return [
      'direct_conversational',
      'indirect_conversational',
      'comparison_query',
      'recommendation_request',
      'explanatory_query'
    ]
  }

  private selectTemplatesWeighted(templates: QuestionTemplate[], count: number): QuestionTemplate[] {
    if (templates.length <= count) {
      return [...templates]
    }
    
    const selected: QuestionTemplate[] = []
    const remaining = [...templates]
    
    for (let i = 0; i < count; i++) {
      const totalWeight = remaining.reduce((sum, t) => sum + t.weight, 0)
      let random = Math.random() * totalWeight
      
      for (let j = 0; j < remaining.length; j++) {
        random -= remaining[j].weight
        if (random <= 0) {
          selected.push(remaining[j])
          remaining.splice(j, 1)
          break
        }
      }
    }
    
    return selected
  }

  private calculateConfidenceScore(template: QuestionTemplate, context: CompanyContext): number {
    let score = 0.7 // Base confidence
    
    // Increase confidence if we have good context for variables
    for (const variable of template.variables) {
      const value = this.getVariableValue(variable, context)
      if (value && value !== variable && value !== 'technology' && value !== 'business operations') {
        score += 0.05
      }
    }
    
    // Increase confidence for well-defined context
    if (context.industry) score += 0.1
    if (context.description) score += 0.1
    if (context.competitors && context.competitors.length > 0) score += 0.05
    
    return Math.min(score, 1.0)
  }

  private shuffleQuestions(questions: GeneratedQuestion[]): GeneratedQuestion[] {
    const shuffled = [...questions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private initializeIndustryKeywords(): Record<string, string[]> {
    return {
      'technology': ['tech', 'software', 'digital', 'platform', 'app'],
      'healthcare': ['health', 'medical', 'patient', 'clinical', 'pharmacy'],
      'finance': ['financial', 'banking', 'investment', 'trading', 'fintech'],
      'education': ['education', 'learning', 'school', 'university', 'training'],
      'retail': ['retail', 'ecommerce', 'shopping', 'commerce', 'store'],
      'manufacturing': ['manufacturing', 'industrial', 'production', 'supply chain']
    }
  }

  private initializeUseCaseKeywords(): Record<string, string[]> {
    return {
      'automation': ['automate', 'automatic', 'workflow', 'process'],
      'analytics': ['analyze', 'data', 'insights', 'reporting', 'metrics'],
      'communication': ['communicate', 'chat', 'message', 'collaborate'],
      'management': ['manage', 'organize', 'track', 'monitor', 'control']
    }
  }

  // Public utility methods

  /**
   * Get available question templates
   */
  getTemplates(): QuestionTemplate[] {
    return [...this.templates]
  }

  /**
   * Add custom templates
   */
  addTemplates(templates: QuestionTemplate[]): void {
    this.templates.push(...templates)
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(type: MaxQuestionType): QuestionTemplate[] {
    return this.templates.filter(t => t.type === type)
  }

  /**
   * Validate question generation request
   */
  validateRequest(request: QuestionGenerationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!request.company?.name) {
      errors.push('Company name is required')
    }
    
    if (!request.company?.domain) {
      errors.push('Company domain is required')
    }
    
    if (request.question_count < 1 || request.question_count > 100) {
      errors.push('Question count must be between 1 and 100')
    }
    
    return { valid: errors.length === 0, errors }
  }
} 