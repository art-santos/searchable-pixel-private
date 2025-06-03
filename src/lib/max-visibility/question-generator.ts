// Simplified Question Generator for MAX Visibility System
// Will be enhanced with GPT-4o in next iteration

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

export class ConversationalQuestionGenerator {
  private templates: QuestionTemplate[]

  constructor() {
    this.templates = this.initializeBasicTemplates()
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
    
    // Select templates with simple randomization
    const selectedTemplates = this.selectTemplates(typeTemplates, count)
    
    for (const template of selectedTemplates) {
      try {
        const customizedQuestion = this.customizeQuestion(template, context)
        questions.push(customizedQuestion)
      } catch (error) {
        console.warn(`Failed to customize template ${template.id}:`, error)
      }
    }
    
    return questions
  }

  /**
   * Customize a question template with company-specific context
   */
  private customizeQuestion(
    template: QuestionTemplate,
    context: CompanyContext
  ): GeneratedQuestion {
    let customizedText = template.template
    
    // Simple variable replacement
    customizedText = customizedText.replace('{company}', context.name)
    customizedText = customizedText.replace('{industry}', context.industry || 'technology')
    customizedText = customizedText.replace('{category}', this.inferCategory(context))
    
    return {
      question: customizedText,
      type: template.type,
      template_used: template.id,
      customization_context: { company: context.name, industry: context.industry },
      confidence_score: 0.8
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
   * Initialize basic question templates (simplified set)
   */
  private initializeBasicTemplates(): QuestionTemplate[] {
    return [
      // Direct Conversational (Brand-specific)
      {
        id: 'direct-eval-01',
        template: "Help me understand what {company} does and if it's worth considering",
        type: 'direct_conversational',
        variables: ['company'],
        weight: 1.0,
        category: 'evaluation'
      },
      {
        id: 'direct-comp-01',
        template: "How does {company} compare to other solutions in the {category} space?",
        type: 'direct_conversational',
        variables: ['company', 'category'],
        weight: 1.0,
        category: 'comparison'
      },
      {
        id: 'direct-decision-01',
        template: "What are the pros and cons of choosing {company}?",
        type: 'direct_conversational',
        variables: ['company'],
        weight: 1.0,
        category: 'decision'
      },

      // Indirect Conversational (Competitive landscape)
      {
        id: 'indirect-options-01',
        template: "What are the best {category} platforms available in 2024?",
        type: 'indirect_conversational',
        variables: ['category'],
        weight: 1.0,
        category: 'options'
      },
      {
        id: 'indirect-recommend-01',
        template: "I need to choose a {category} solution - what do you recommend?",
        type: 'indirect_conversational',
        variables: ['category'],
        weight: 1.0,
        category: 'recommendations'
      },
      {
        id: 'indirect-landscape-01',
        template: "Help me understand the {industry} solution landscape",
        type: 'indirect_conversational',
        variables: ['industry'],
        weight: 1.0,
        category: 'landscape'
      },

      // Comparison Queries
      {
        id: 'comp-detailed-01',
        template: "Compare the top {category} solutions available today",
        type: 'comparison_query',
        variables: ['category'],
        weight: 1.0,
        category: 'detailed'
      },
      {
        id: 'comp-specific-01',
        template: "Which {category} platform should I choose for my business?",
        type: 'comparison_query',
        variables: ['category'],
        weight: 1.0,
        category: 'selection'
      },

      // Recommendation Requests
      {
        id: 'rec-best-01',
        template: "What's the best {category} solution for modern businesses?",
        type: 'recommendation_request',
        variables: ['category'],
        weight: 1.0,
        category: 'best-in-class'
      },
      {
        id: 'rec-startup-01',
        template: "Recommend {category} tools for a growing startup",
        type: 'recommendation_request',
        variables: ['category'],
        weight: 1.0,
        category: 'startup'
      },

      // Explanatory Queries
      {
        id: 'exp-differences-01',
        template: "Explain the key differences between {category} platforms",
        type: 'explanatory_query',
        variables: ['category'],
        weight: 1.0,
        category: 'differences'
      },
      {
        id: 'exp-choosing-01',
        template: "How do I choose the right {category} solution?",
        type: 'explanatory_query',
        variables: ['category'],
        weight: 1.0,
        category: 'selection-criteria'
      }
    ]
  }

  // Helper methods (simplified)

  private buildCompanyContext(company: QuestionGenerationRequest['company']): CompanyContext {
    return {
      name: company.name,
      domain: company.domain,
        description: company.description,
        industry: company.industry 
    }
  }

  private inferCategory(context: CompanyContext): string {
    const description = (context.description || '').toLowerCase()
    const industry = (context.industry || '').toLowerCase()
    
    if (description.includes('ai') || description.includes('artificial intelligence')) return 'AI'
    if (description.includes('sales') || description.includes('crm')) return 'sales automation'
    if (description.includes('marketing')) return 'marketing automation'
    if (description.includes('analytics') || description.includes('data')) return 'analytics'
    if (industry.includes('technology') || industry.includes('software')) return 'software'
    
    return 'business software'
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

  private selectTemplates(templates: QuestionTemplate[], count: number): QuestionTemplate[] {
    if (templates.length <= count) return templates
    
    // Simple random selection
    const shuffled = [...templates].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  private shuffleQuestions(questions: GeneratedQuestion[]): GeneratedQuestion[] {
    return [...questions].sort(() => 0.5 - Math.random())
  }

  // Public utility methods

  getTemplates(): QuestionTemplate[] {
    return this.templates
  }

  addTemplates(templates: QuestionTemplate[]): void {
    this.templates.push(...templates)
  }

  getTemplatesByType(type: MaxQuestionType): QuestionTemplate[] {
    return this.templates.filter(t => t.type === type)
  }

  validateRequest(request: QuestionGenerationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!request.company?.name) errors.push('Company name is required')
    if (!request.company?.domain) errors.push('Company domain is required')
    if (request.question_count && (request.question_count < 1 || request.question_count > 100)) {
      errors.push('Question count must be between 1 and 100')
    }
    
    return { valid: errors.length === 0, errors }
  }
} 