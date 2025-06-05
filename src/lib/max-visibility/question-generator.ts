// Enhanced Question Generator for MAX Visibility System
// Deterministic, consistent question generation using Step 1 enhanced context

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
}

interface EnhancedContextVariables {
  // Deterministic selections from Step 1 data
  industryCategory: string
  businessModel: string
  companySize: string
  
  // Top selections (first items, alphabetically sorted)
  primaryPainPoint: string
  secondaryPainPoint: string
  primaryCompetitor: string
  secondaryCompetitor: string
  tertiaryCompetitor: string
  primaryUseCase: string
  secondaryUseCase: string
  primaryPersona: string
  primaryValueProp: string
  
  // Derived categories
  category: string
  solutionType: string
}

export class ConversationalQuestionGenerator {
  private coreTemplates: QuestionTemplate[]
  private contextTemplates: QuestionTemplate[]

  constructor() {
    this.coreTemplates = this.initializeCoreTemplates()
    this.contextTemplates = this.initializeContextTemplates()
  }

  /**
   * Generate deterministic questions using enhanced context
   * MAX Mode: 50 questions (35 core + 15 context)
   * Lite Mode: 20 questions (14 core + 6 context) 
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    const questionCount = request.question_count || 50
    
    // Validate supported question counts
    if (questionCount !== 50 && questionCount !== 20) {
      throw new Error(`Question count must be exactly 50 (MAX mode) or 20 (Lite mode), got ${questionCount}`)
    }

    const companyContext = this.buildCompanyContext(request.company)
    const enhancedVars = this.buildEnhancedContextVariables(request.enhancedContext, companyContext)
    
    // Determine distribution based on question count
    const isMaxMode = questionCount === 50
    const coreCount = isMaxMode ? 35 : 14
    const contextCount = isMaxMode ? 15 : 6
    
    const coreQuestions = this.generateCoreQuestions(companyContext, enhancedVars, coreCount)
    const contextQuestions = this.generateContextQuestions(companyContext, enhancedVars, contextCount)
    
    // Combine and validate count
    const allQuestions = [...coreQuestions, ...contextQuestions]
    
    if (allQuestions.length !== questionCount) {
      throw new Error(`Generated ${allQuestions.length} questions, expected exactly ${questionCount}`)
    }
    
    // Return in deterministic order (no shuffling for consistency)
    return allQuestions
  }

  /**
   * Generate core questions (industry-agnostic, always consistent)
   * MAX mode: 35 questions, Lite mode: 14 questions
   */
  private generateCoreQuestions(
    context: CompanyContext, 
    enhanced: EnhancedContextVariables,
    targetCount: number = 35
  ): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = []
    
    // Scale distribution based on target count
    const isLiteMode = targetCount === 14
    const distribution = isLiteMode ? {
      // Lite mode: 14 total (proportionally scaled)
      direct_conversational: 5,     // ~36%
      indirect_conversational: 4,   // ~29%  
      comparison_query: 3,          // ~21%
      recommendation_request: 2,    // ~14%
      explanatory_query: 0          // Skip in lite mode
    } : {
      // MAX mode: 35 total
      direct_conversational: 11,    // 31% of 35
      indirect_conversational: 9,   // 26% of 35  
      comparison_query: 9,          // 26% of 35
      recommendation_request: 4,    // 11% of 35
      explanatory_query: 2          // 6% of 35
    }
    
    // Generate each type deterministically
    for (const [type, count] of Object.entries(distribution)) {
      if (count === 0) continue // Skip types with 0 count in lite mode
      
      const typeTemplates = this.coreTemplates.filter(t => t.type === type as MaxQuestionType)
      const selectedTemplates = this.selectDeterministicTemplates(typeTemplates, count)
      
      for (const template of selectedTemplates) {
        questions.push(this.customizeQuestion(template, context, enhanced, 'core'))
      }
    }
    
    return questions
  }

  /**
   * Generate context-enhanced questions using Step 1 data
   * MAX mode: 15 questions, Lite mode: 6 questions
   */
  private generateContextQuestions(
    context: CompanyContext,
    enhanced: EnhancedContextVariables,
    targetCount: number = 15
  ): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = []
    
    // Scale distribution based on target count
    const isLiteMode = targetCount === 6
    const distribution = isLiteMode ? {
      // Lite mode: 6 total (focused on most important)
      comparison_query: 3,          // 50% - competitor comparisons (most important)
      indirect_conversational: 2,   // 33% - pain point questions
      direct_conversational: 1,     // 17% - value prop tests
      recommendation_request: 0     // Skip in lite mode
    } : {
      // MAX mode: 15 total - heavily weighted toward comparison and pain points
      comparison_query: 6,          // 40% - competitor comparisons
      indirect_conversational: 5,   // 33% - pain point questions
      direct_conversational: 3,     // 20% - value prop tests
      recommendation_request: 1     // 7% - persona targeting
    }
    
    for (const [type, count] of Object.entries(distribution)) {
      if (count === 0) continue // Skip types with 0 count in lite mode
      
      const typeTemplates = this.contextTemplates.filter(t => t.type === type as MaxQuestionType)
      const selectedTemplates = this.selectDeterministicTemplates(typeTemplates, count)
      
      for (const template of selectedTemplates) {
        questions.push(this.customizeQuestion(template, context, enhanced, 'context'))
      }
    }
    
    return questions
  }

  /**
   * Deterministic template selection (no randomness)
   */
  private selectDeterministicTemplates(
    templates: QuestionTemplate[], 
    count: number
  ): QuestionTemplate[] {
    // Sort alphabetically for consistency
    const sortedTemplates = [...templates].sort((a, b) => a.id.localeCompare(b.id))
    
    // Take first N templates
    return sortedTemplates.slice(0, Math.min(count, sortedTemplates.length))
  }

  /**
   * Build enhanced context variables deterministically from Step 1 data
   */
  private buildEnhancedContextVariables(
    enhancedContext: QuestionGenerationRequest['enhancedContext'],
    companyContext: CompanyContext
  ): EnhancedContextVariables {
    if (!enhancedContext) {
      // Fallback to inferred data
      return this.buildFallbackVariables(companyContext)
    }

    // Sort arrays for deterministic selection
    const sortedCompetitors = enhancedContext.competitors.slice().sort()
    const sortedPainPoints = enhancedContext.painPoints.slice()
    const sortedUseCases = enhancedContext.useCases.slice()
    const sortedPersonas = enhancedContext.targetPersonas.slice()
    const sortedValueProps = enhancedContext.uniqueValueProps.slice()

    return {
      // Direct from Step 1
      industryCategory: enhancedContext.industryCategory,
      businessModel: enhancedContext.businessModel,
      companySize: enhancedContext.companySize,
      
      // Deterministic selections (first items)
      primaryPainPoint: sortedPainPoints[0] || 'operational efficiency',
      secondaryPainPoint: sortedPainPoints[1] || 'cost optimization',
      primaryCompetitor: sortedCompetitors[0] || 'leading competitor',
      secondaryCompetitor: sortedCompetitors[1] || 'alternative solution',
      tertiaryCompetitor: sortedCompetitors[2] || 'established player',
      primaryUseCase: sortedUseCases[0] || 'business optimization',
      secondaryUseCase: sortedUseCases[1] || 'workflow automation',
      primaryPersona: sortedPersonas[0] || 'business professionals',
      primaryValueProp: sortedValueProps[0] || 'improved efficiency',
      
      // Derived categories
      category: this.inferCategory(enhancedContext.industryCategory),
      solutionType: this.inferSolutionType(enhancedContext.businessModel)
    }
  }

  /**
   * Fallback variables when enhanced context is not available
   */
  private buildFallbackVariables(context: CompanyContext): EnhancedContextVariables {
    const inferredCategory = this.inferCategoryFromContext(context)
    
    return {
      industryCategory: inferredCategory,
      businessModel: 'B2B SaaS',
      companySize: 'startup',
      primaryPainPoint: 'operational efficiency',
      secondaryPainPoint: 'cost optimization', 
      primaryCompetitor: 'leading competitor',
      secondaryCompetitor: 'alternative solution',
      tertiaryCompetitor: 'established player',
      primaryUseCase: 'business optimization',
      secondaryUseCase: 'workflow automation',
      primaryPersona: 'business professionals',
      primaryValueProp: 'improved efficiency',
      category: inferredCategory.toLowerCase(),
      solutionType: 'software solution'
    }
  }

  /**
   * Customize question template with context variables
   */
  private customizeQuestion(
    template: QuestionTemplate,
    context: CompanyContext,
    enhanced: EnhancedContextVariables,
    questionSet: 'core' | 'context'
  ): GeneratedQuestion {
    let customizedText = template.template

    // Replace all variables deterministically
    const replacements = {
      '{company}': context.name,
      '{domain}': context.domain,
      '{industry}': enhanced.industryCategory,
      '{category}': enhanced.category,
      '{business_model}': enhanced.businessModel,
      '{company_size}': enhanced.companySize,
      '{solution_type}': enhanced.solutionType,
      
      // Pain points
      '{pain_point}': enhanced.primaryPainPoint,
      '{pain_point_1}': enhanced.primaryPainPoint,
      '{pain_point_2}': enhanced.secondaryPainPoint,
      
      // Competitors
      '{competitor}': enhanced.primaryCompetitor,
      '{competitor_1}': enhanced.primaryCompetitor,
      '{competitor_2}': enhanced.secondaryCompetitor,
      '{competitor_3}': enhanced.tertiaryCompetitor,
      
      // Use cases
      '{use_case}': enhanced.primaryUseCase,
      '{use_case_1}': enhanced.primaryUseCase,
      '{use_case_2}': enhanced.secondaryUseCase,
      
      // Other context
      '{target_persona}': enhanced.primaryPersona,
      '{value_prop}': enhanced.primaryValueProp,
      '{specific_need}': enhanced.primaryUseCase
    }

    // Apply all replacements
    for (const [variable, value] of Object.entries(replacements)) {
      customizedText = customizedText.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
    }

    return {
      question: customizedText,
      type: template.type,
      template_used: template.id,
      customization_context: {
        questionSet,
        company: context.name,
        hasEnhancedContext: enhanced.industryCategory !== 'inferred',
        variablesUsed: template.variables
      },
      confidence_score: questionSet === 'context' ? 0.95 : 0.85
    }
  }

  /**
   * Initialize 35+ core templates (industry-agnostic, always consistent)
   */
  private initializeCoreTemplates(): QuestionTemplate[] {
    return [
      // Direct Conversational (11 templates needed)
      {
        id: 'core-direct-01',
        template: "Help me understand what {company} does and if it's worth considering",
        type: 'direct_conversational',
        variables: ['company'],
        weight: 1.0,
        category: 'evaluation'
      },
      {
        id: 'core-direct-02', 
        template: "How does {company} compare to other {category} solutions?",
        type: 'direct_conversational',
        variables: ['company', 'category'],
        weight: 1.0,
        category: 'comparison'
      },
      {
        id: 'core-direct-03',
        template: "What are the pros and cons of choosing {company}?", 
        type: 'direct_conversational',
        variables: ['company'],
        weight: 1.0,
        category: 'decision'
      },
      {
        id: 'core-direct-04',
        template: "Is {company} a good fit for {business_model} companies?",
        type: 'direct_conversational',
        variables: ['company', 'business_model'],
        weight: 1.0,
        category: 'fit'
      },
      {
        id: 'core-direct-05',
        template: "What should I know about {company} before making a decision?",
        type: 'direct_conversational',
        variables: ['company'],
        weight: 1.0,
        category: 'research'
      },
      {
        id: 'core-direct-06',
        template: "How reliable is {company} as a {category} provider?",
        type: 'direct_conversational',
        variables: ['company', 'category'],
        weight: 1.0,
        category: 'reliability'
      },
      {
        id: 'core-direct-07',
        template: "Tell me about {company}'s pricing and value proposition",
        type: 'direct_conversational',
        variables: ['company'],
        weight: 1.0,
        category: 'pricing'
      },
      {
        id: 'core-direct-08',
        template: "What makes {company} different from other {category} tools?",
        type: 'direct_conversational',
        variables: ['company', 'category'],
        weight: 1.0,
        category: 'differentiation'
      },
      {
        id: 'core-direct-09',
        template: "Should I consider {company} for my {industry} business?",
        type: 'direct_conversational',
        variables: ['company', 'industry'],
        weight: 1.0,
        category: 'industry-fit'
      },
      {
        id: 'core-direct-10',
        template: "What are users saying about {company} in 2024?",
        type: 'direct_conversational',
        variables: ['company'],
        weight: 1.0,
        category: 'reviews'
      },
      {
        id: 'core-direct-11',
        template: "How does {company}'s customer support compare to competitors?",
        type: 'direct_conversational',
        variables: ['company'],
        weight: 1.0,
        category: 'support'
      },

      // Indirect Conversational (9 templates needed)
      {
        id: 'core-indirect-01',
        template: "What are the best {category} platforms available in 2024?",
        type: 'indirect_conversational',
        variables: ['category'],
        weight: 1.0,
        category: 'options'
      },
      {
        id: 'core-indirect-02',
        template: "I need to choose a {category} solution - what do you recommend?",
        type: 'indirect_conversational',
        variables: ['category'],
        weight: 1.0,
        category: 'recommendations'
      },
      {
        id: 'core-indirect-03',
        template: "Help me understand the {industry} solution landscape",
        type: 'indirect_conversational',
        variables: ['industry'],
        weight: 1.0,
        category: 'landscape'
      },
      {
        id: 'core-indirect-04',
        template: "What {category} tools do most {company_size} companies use?",
        type: 'indirect_conversational',
        variables: ['category', 'company_size'],
        weight: 1.0,
        category: 'popular'
      },
      {
        id: 'core-indirect-05',
        template: "Which {category} platforms offer the best ROI?",
        type: 'indirect_conversational',
        variables: ['category'],
        weight: 1.0,
        category: 'roi'
      },
      {
        id: 'core-indirect-06',
        template: "What should I look for in a {category} solution?",
        type: 'indirect_conversational',
        variables: ['category'],
        weight: 1.0,
        category: 'criteria'
      },
      {
        id: 'core-indirect-07',
        template: "Compare the leading {category} providers in the market",
        type: 'indirect_conversational',
        variables: ['category'],
        weight: 1.0,
        category: 'market-leaders'
      },
      {
        id: 'core-indirect-08',
        template: "What are the most trusted {category} solutions for {business_model} companies?",
        type: 'indirect_conversational',
        variables: ['category', 'business_model'],
        weight: 1.0,
        category: 'trusted'
      },
      {
        id: 'core-indirect-09',
        template: "I'm evaluating {category} options - what are the top choices?",
        type: 'indirect_conversational',
        variables: ['category'],
        weight: 1.0,
        category: 'top-choices'
      },

      // Comparison Query (9 templates needed)
      {
        id: 'core-comp-01',
        template: "Compare the top {category} solutions available today",
        type: 'comparison_query',
        variables: ['category'],
        weight: 1.0,
        category: 'comprehensive'
      },
      {
        id: 'core-comp-02',
        template: "Which {category} platform should I choose for my business?",
        type: 'comparison_query',
        variables: ['category'],
        weight: 1.0,
        category: 'selection'
      },
      {
        id: 'core-comp-03',
        template: "What's the difference between the major {category} providers?",
        type: 'comparison_query',
        variables: ['category'],
        weight: 1.0,
        category: 'differences'
      },
      {
        id: 'core-comp-04',
        template: "Compare {category} solutions for {company_size} businesses",
        type: 'comparison_query',
        variables: ['category', 'company_size'],
        weight: 1.0,
        category: 'size-specific'
      },
      {
        id: 'core-comp-05',
        template: "Evaluate the best {category} tools for {business_model} companies",
        type: 'comparison_query',
        variables: ['category', 'business_model'],
        weight: 1.0,
        category: 'model-specific'
      },
      {
        id: 'core-comp-06',
        template: "Which {category} solution offers the best features and pricing?",
        type: 'comparison_query',
        variables: ['category'],
        weight: 1.0,
        category: 'value'
      },
      {
        id: 'core-comp-07',
        template: "Compare {category} platforms based on user reviews and ratings",
        type: 'comparison_query',
        variables: ['category'],
        weight: 1.0,
        category: 'reviews'
      },
      {
        id: 'core-comp-08',
        template: "What are the pros and cons of different {category} solutions?",
        type: 'comparison_query',
        variables: ['category'],
        weight: 1.0,
        category: 'pros-cons'
      },
      {
        id: 'core-comp-09',
        template: "Help me compare {category} options for my {industry} company",
        type: 'comparison_query',
        variables: ['category', 'industry'],
        weight: 1.0,
        category: 'industry-comparison'
      },

      // Recommendation Request (4 templates needed)
      {
        id: 'core-rec-01',
        template: "What's the best {category} solution for modern businesses?",
        type: 'recommendation_request',
        variables: ['category'],
        weight: 1.0,
        category: 'best-overall'
      },
      {
        id: 'core-rec-02',
        template: "Recommend {category} tools for a growing {company_size} company",
        type: 'recommendation_request',
        variables: ['category', 'company_size'],
        weight: 1.0,
        category: 'growth-stage'
      },
      {
        id: 'core-rec-03',
        template: "What {category} platform do experts recommend in 2024?",
        type: 'recommendation_request',
        variables: ['category'],
        weight: 1.0,
        category: 'expert-choice'
      },
      {
        id: 'core-rec-04',
        template: "Suggest the most reliable {category} solutions available",
        type: 'recommendation_request',
        variables: ['category'],
        weight: 1.0,
        category: 'reliability'
      },

      // Explanatory Query (2 templates needed)
      {
        id: 'core-exp-01',
        template: "Explain the key differences between {category} platforms",
        type: 'explanatory_query',
        variables: ['category'],
        weight: 1.0,
        category: 'differences'
      },
      {
        id: 'core-exp-02',
        template: "How do I choose the right {category} solution for my needs?",
        type: 'explanatory_query',
        variables: ['category'],
        weight: 1.0,
        category: 'selection-guide'
      }
    ]
  }

  /**
   * Initialize 15+ context-enhanced templates using Step 1 data
   */
  private initializeContextTemplates(): QuestionTemplate[] {
    return [
      // Comparison Query (6 templates) - competitor focused
      {
        id: 'context-comp-01',
        template: "Compare {company} vs {competitor_1} vs {competitor_2} for {use_case_1}",
        type: 'comparison_query',
        variables: ['company', 'competitor_1', 'competitor_2', 'use_case_1'],
        weight: 1.0,
        category: 'three-way'
      },
      {
        id: 'context-comp-02',
        template: "What's the difference between {company} and {competitor_1}?",
        type: 'comparison_query',
        variables: ['company', 'competitor_1'],
        weight: 1.0,
        category: 'head-to-head'
      },
      {
        id: 'context-comp-03',
        template: "{company} or {competitor_1} - which is better for {use_case_1}?",
        type: 'comparison_query',
        variables: ['company', 'competitor_1', 'use_case_1'],
        weight: 1.0,
        category: 'use-case-specific'
      },
      {
        id: 'context-comp-04',
        template: "How does {company} stack up against {competitor_1} and {competitor_2}?",
        type: 'comparison_query',
        variables: ['company', 'competitor_1', 'competitor_2'],
        weight: 1.0,
        category: 'competitive-analysis'
      },
      {
        id: 'context-comp-05',
        template: "Compare {company} vs {competitor_1} for {company_size} companies",
        type: 'comparison_query',
        variables: ['company', 'competitor_1', 'company_size'],
        weight: 1.0,
        category: 'size-comparison'
      },
      {
        id: 'context-comp-06',
        template: "Should I choose {company} over {competitor_1} for {pain_point_1}?",
        type: 'comparison_query',
        variables: ['company', 'competitor_1', 'pain_point_1'],
        weight: 1.0,
        category: 'pain-point-comparison'
      },

      // Indirect Conversational (5 templates) - pain point focused
      {
        id: 'context-indirect-01',
        template: "I'm struggling with {pain_point_1} - what are the best solutions?",
        type: 'indirect_conversational',
        variables: ['pain_point_1'],
        weight: 1.0,
        category: 'pain-point-solution'
      },
      {
        id: 'context-indirect-02',
        template: "What tools help solve {pain_point_1} for {company_size} companies?",
        type: 'indirect_conversational',
        variables: ['pain_point_1', 'company_size'],
        weight: 1.0,
        category: 'pain-point-tools'
      },
      {
        id: 'context-indirect-03',
        template: "How can I address {pain_point_1} and {pain_point_2} with {category} solutions?",
        type: 'indirect_conversational',
        variables: ['pain_point_1', 'pain_point_2', 'category'],
        weight: 1.0,
        category: 'multi-pain-point'
      },
      {
        id: 'context-indirect-04',
        template: "What's the best approach to solving {pain_point_1} in {industry}?",
        type: 'indirect_conversational',
        variables: ['pain_point_1', 'industry'],
        weight: 1.0,
        category: 'industry-pain-point'
      },
      {
        id: 'context-indirect-05',
        template: "Looking for solutions to {pain_point_1} - what do you recommend?",
        type: 'indirect_conversational',
        variables: ['pain_point_1'],
        weight: 1.0,
        category: 'pain-point-recommendation'
      },

      // Direct Conversational (3 templates) - value prop testing
      {
        id: 'context-direct-01',
        template: "How does {company} deliver on {value_prop} compared to alternatives?",
        type: 'direct_conversational',
        variables: ['company', 'value_prop'],
        weight: 1.0,
        category: 'value-prop-test'
      },
      {
        id: 'context-direct-02',
        template: "Is {company} really better at {use_case_1} than {competitor_1}?",
        type: 'direct_conversational',
        variables: ['company', 'use_case_1', 'competitor_1'],
        weight: 1.0,
        category: 'capability-test'
      },
      {
        id: 'context-direct-03',
        template: "Why should I choose {company} over {competitor_1} for {pain_point_1}?",
        type: 'direct_conversational',
        variables: ['company', 'competitor_1', 'pain_point_1'],
        weight: 1.0,
        category: 'competitive-advantage'
      },

      // Recommendation Request (1 template) - persona targeting  
      {
        id: 'context-rec-01',
        template: "What {category} tools do {target_persona} recommend for {use_case_1}?",
        type: 'recommendation_request',
        variables: ['category', 'target_persona', 'use_case_1'],
        weight: 1.0,
        category: 'persona-recommendation'
      }
    ]
  }

  // Helper methods

  private buildCompanyContext(company: QuestionGenerationRequest['company']): CompanyContext {
    return {
      name: company.name,
      domain: company.domain,
      description: company.description,
      industry: company.industry 
    }
  }

  private inferCategory(industryCategory: string): string {
    // Use the GPT-4o determined category directly - it's already been analyzed from knowledge base
    return industryCategory.toLowerCase()
  }

  private inferSolutionType(businessModel: string): string {
    const model = businessModel.toLowerCase()
    
    if (model.includes('saas')) return 'SaaS platform'
    if (model.includes('marketplace')) return 'marketplace solution'
    if (model.includes('service')) return 'service platform'
    
    return 'software solution'
  }

  private inferCategoryFromContext(context: CompanyContext): string {
    // Simple fallback when no enhanced context is available
    const description = (context.description || '').toLowerCase()
    const industry = (context.industry || '').toLowerCase()
    
    if (description.includes('sales') || description.includes('lead')) return 'sales tools'
    if (description.includes('marketing')) return 'marketing tools'
    if (description.includes('analytics') || description.includes('data')) return 'analytics tools'
    if (description.includes('content')) return 'content tools'
    if (description.includes('customer') || description.includes('support')) return 'customer support tools'
    if (industry.includes('technology') || industry.includes('software')) return 'business software'
    
    return 'business software'
  }

  // Public utility methods

  getTemplates(): QuestionTemplate[] {
    return [...this.coreTemplates, ...this.contextTemplates]
  }

  getCoreTemplates(): QuestionTemplate[] {
    return this.coreTemplates
  }

  getContextTemplates(): QuestionTemplate[] {
    return this.contextTemplates
  }

  validateRequest(request: QuestionGenerationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!request.company?.name) errors.push('Company name is required')
    if (!request.company?.domain) errors.push('Company domain is required')
    if (request.question_count && request.question_count !== 50) {
      errors.push('Question count must be exactly 50 for MAX Visibility assessment')
    }
    
    return { valid: errors.length === 0, errors }
  }
} 