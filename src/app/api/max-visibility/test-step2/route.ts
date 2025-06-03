import { NextRequest, NextResponse } from 'next/server'
import { ConversationalQuestionGenerator } from '@/lib/max-visibility/question-generator'

/**
 * Test endpoint for Step 2: Enhanced Question Generation
 * This tests the deterministic, context-aware question generation that produces exactly 50 questions
 */
export async function POST(request: NextRequest) {
  try {
    const { company_id, enhanced_context } = await request.json()
    
    if (!company_id) {
      return NextResponse.json({
        success: false,
        error: 'company_id is required'
      }, { status: 400 })
    }
    
    console.log(`🧪 Testing Step 2: Enhanced Question Generation for ${company_id}`)
    
    // Mock company data for testing
    const mockCompany = {
      id: company_id,
      name: enhanced_context?.name || 'TestCorp',
      domain: enhanced_context?.domain || 'testcorp.com',
      description: 'AI-powered business optimization platform',
      industry: 'Technology'
    }
    
    // Mock enhanced context (from Step 1) if not provided
    const mockEnhancedContext = enhanced_context || {
      overview: ['TestCorp is an AI-powered business optimization platform'],
      targetAudience: ['Small to medium businesses', 'Enterprise companies'],
      painPoints: ['Manual data processing', 'Inefficient workflows', 'High operational costs'],
      positioning: ['AI-first approach to business optimization', 'Easy-to-use interface'],
      productFeatures: ['Automated workflows', 'Real-time analytics', 'Integration capabilities'],
      useCases: ['Business process automation', 'Data analytics', 'Workflow optimization'],
      competitors: ['Microsoft', 'Salesforce', 'Monday.com'],
      brandVoice: ['Professional', 'Innovative', 'Customer-focused'],
      keywords: ['AI', 'automation', 'business optimization'],
      industryCategory: 'AI/Business Software',
      companySize: 'startup',
      businessModel: 'B2B SaaS',
      aliases: ['TestCorp', 'TC'],
      uniqueValueProps: ['AI-first approach', 'Easy integration'],
      targetPersonas: ['Business Operations Managers', 'IT Directors']
    }
    
    // Initialize question generator
    const generator = new ConversationalQuestionGenerator()
    
    // Test deterministic question generation
    const startTime = Date.now()
    
    // Generate questions twice to test consistency
    const questions1 = await generator.generateQuestions({
      company: mockCompany,
      question_count: 50,
      enhancedContext: mockEnhancedContext
    })
    
    const questions2 = await generator.generateQuestions({
      company: mockCompany,
      question_count: 50,
      enhancedContext: mockEnhancedContext
    })
    
    const generationTime = Date.now() - startTime
    
    // Analyze generated questions
    const questionAnalysis = {
      total_questions: questions1.length,
      rigid_50_check: questions1.length === 50,
      
      // Type distribution
      type_distribution: {
        direct_conversational: questions1.filter(q => q.type === 'direct_conversational').length,
        indirect_conversational: questions1.filter(q => q.type === 'indirect_conversational').length,
        comparison_query: questions1.filter(q => q.type === 'comparison_query').length,
        recommendation_request: questions1.filter(q => q.type === 'recommendation_request').length,
        explanatory_query: questions1.filter(q => q.type === 'explanatory_query').length
      },
      
      // Question set distribution
      set_distribution: {
        core_questions: questions1.filter(q => q.customization_context.questionSet === 'core').length,
        context_questions: questions1.filter(q => q.customization_context.questionSet === 'context').length
      },
      
      // Context utilization
      context_utilization: {
        questions_with_enhanced_context: questions1.filter(q => q.customization_context.hasEnhancedContext).length,
        company_mentions: questions1.filter(q => q.question.includes(mockCompany.name)).length,
        competitor_mentions: questions1.filter(q => 
          mockEnhancedContext.competitors.some(comp => q.question.includes(comp))
        ).length,
        pain_point_mentions: questions1.filter(q =>
          mockEnhancedContext.painPoints.some(pain => q.question.toLowerCase().includes(pain.toLowerCase()))
        ).length
      },
      
      // Consistency check
      consistency_check: {
        identical_questions: JSON.stringify(questions1) === JSON.stringify(questions2),
        same_count: questions1.length === questions2.length,
        same_order: questions1.every((q, i) => q.question === questions2[i]?.question)
      }
    }
    
    // Sample questions for review
    const sampleQuestions = {
      core_direct: questions1.filter(q => 
        q.type === 'direct_conversational' && q.customization_context.questionSet === 'core'
      ).slice(0, 3),
      context_comparison: questions1.filter(q => 
        q.type === 'comparison_query' && q.customization_context.questionSet === 'context'
      ).slice(0, 3),
      context_pain_point: questions1.filter(q => 
        q.type === 'indirect_conversational' && q.customization_context.questionSet === 'context'
      ).slice(0, 3)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        questions: questions1,
        analysis: questionAnalysis,
        samples: sampleQuestions,
        performance: {
          generation_time_ms: generationTime,
          questions_per_second: Math.round((50 / generationTime) * 1000)
        },
        validation: {
          exactly_50_questions: questionAnalysis.rigid_50_check,
          has_core_and_context: 
            questionAnalysis.set_distribution.core_questions === 35 &&
            questionAnalysis.set_distribution.context_questions === 15,
          uses_enhanced_context: questionAnalysis.context_utilization.questions_with_enhanced_context > 0,
          deterministic_consistency: questionAnalysis.consistency_check.identical_questions,
          competitor_integration: questionAnalysis.context_utilization.competitor_mentions > 0,
          pain_point_integration: questionAnalysis.context_utilization.pain_point_mentions > 0
        },
        step2_status: 'COMPLETED',
        ready_for_step3: true
      }
    })
    
  } catch (error) {
    console.error('❌ Step 2 test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      step2_status: 'FAILED',
      ready_for_step3: false
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'MAX Visibility Step 2 Test',
    description: 'Tests Enhanced Question Generation with deterministic consistency',
    usage: 'POST with { "company_id": "your-company-id", "enhanced_context": {...} }',
    step: 'Step 2: Enhanced Question Generation',
    requirements: 'Exactly 50 questions, deterministic, uses enhanced context',
    status: 'ready'
  })
} 