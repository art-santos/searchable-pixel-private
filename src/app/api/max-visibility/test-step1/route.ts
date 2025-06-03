import { NextRequest, NextResponse } from 'next/server'
import { MaxVisibilityPipeline } from '@/lib/max-visibility/pipeline'

/**
 * Test endpoint for Step 1: Knowledge Base-Driven Company Context
 * This tests the enhanced company context building from knowledge base data
 */
export async function POST(request: NextRequest) {
  try {
    const { company_id } = await request.json()
    
    if (!company_id) {
      return NextResponse.json({
        success: false,
        error: 'company_id is required'
      }, { status: 400 })
    }
    
    console.log(`🧪 Testing Step 1: Enhanced Company Context for ${company_id}`)
    
    // Initialize pipeline
    const pipeline = new MaxVisibilityPipeline()
    
    // Test Step 1: Build enhanced company context
    const startTime = Date.now()
    const enhancedContext = await pipeline.buildEnhancedCompanyContext(company_id)
    const buildTime = Date.now() - startTime
    
    // Calculate context richness metrics
    const contextMetrics = {
      total_overview_items: enhancedContext.overview.length,
      total_target_audience_items: enhancedContext.targetAudience.length,
      total_pain_points: enhancedContext.painPoints.length,
      total_positioning_items: enhancedContext.positioning.length,
      total_product_features: enhancedContext.productFeatures.length,
      total_use_cases: enhancedContext.useCases.length,
      total_competitors: enhancedContext.competitors.length,
      total_brand_voice_items: enhancedContext.brandVoice.length,
      total_keywords: enhancedContext.keywords.length,
      total_aliases: enhancedContext.aliases.length,
      total_value_props: enhancedContext.uniqueValueProps.length,
      total_personas: enhancedContext.targetPersonas.length,
      
      // Context quality score
      richness_score: Math.min(100, (
        enhancedContext.overview.length * 10 +
        enhancedContext.competitors.length * 8 +
        enhancedContext.positioning.length * 7 +
        enhancedContext.targetAudience.length * 6 +
        enhancedContext.productFeatures.length * 5 +
        enhancedContext.useCases.length * 4 +
        enhancedContext.painPoints.length * 3 +
        enhancedContext.keywords.length * 2 +
        enhancedContext.brandVoice.length * 1
      ))
    }
    
    return NextResponse.json({
      success: true,
      data: {
        enhanced_context: enhancedContext,
        metrics: contextMetrics,
        performance: {
          build_time_ms: buildTime,
          has_knowledge_base_data: contextMetrics.total_overview_items > 0 || contextMetrics.total_competitors > 0,
          context_quality: contextMetrics.richness_score >= 50 ? 'rich' : contextMetrics.richness_score >= 20 ? 'moderate' : 'minimal'
        },
        validation: {
          has_basic_info: !!(enhancedContext.name && enhancedContext.domain),
          has_industry_classification: !!enhancedContext.industryCategory,
          has_business_model: !!enhancedContext.businessModel,
          has_aliases: enhancedContext.aliases.length > 0,
          has_competitive_intel: enhancedContext.competitors.length > 0,
          context_completeness: Math.round((contextMetrics.richness_score / 100) * 100)
        },
        step1_status: 'COMPLETED',
        ready_for_step2: true
      }
    })
    
  } catch (error) {
    console.error('❌ Step 1 test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      step1_status: 'FAILED',
      ready_for_step2: false
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'MAX Visibility Step 1 Test',
    description: 'Tests Knowledge Base-Driven Company Context building',
    usage: 'POST with { "company_id": "your-company-id" }',
    step: 'Step 1: Enhanced Company Context',
    status: 'ready'
  })
} 