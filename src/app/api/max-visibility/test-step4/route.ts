import { NextRequest, NextResponse } from 'next/server'
import { MaxVisibilityPipeline } from '@/lib/max-visibility/pipeline'

/**
 * Test endpoint for Step 4: GPT-4o Intelligent Analysis
 * This tests the complete pipeline: Step 1 → Step 2 → Step 3 → Step 4
 * Focuses on GPT-4o analysis of AI responses for mentions, competitors, and insights
 */
export async function POST(request: NextRequest) {
  try {
    const { company_id, test_mode = true, analyze_sample = true } = await request.json()
    
    if (!company_id) {
      return NextResponse.json({
        success: false,
        error: 'company_id is required'
      }, { status: 400 })
    }
    
    console.log(`🧪 Testing Step 4: GPT-4o Intelligent Analysis for ${company_id}`)
    
    // Initialize pipeline
    const pipeline = new MaxVisibilityPipeline()
    
    // Track pipeline progress
    const progress = {
      step1: { status: 'pending', data: null, time: 0 },
      step2: { status: 'pending', data: null, time: 0 },
      step3: { status: 'pending', data: null, time: 0 },
      step4: { status: 'pending', data: null, time: 0 }
    }
    
    const startTime = Date.now()
    
    // STEP 1: Build Enhanced Company Context
    console.log('🚀 STEP 1: Building enhanced company context...')
    const step1Start = Date.now()
    
    let enhancedContext
    try {
      enhancedContext = await pipeline.buildEnhancedCompanyContext(company_id)
      progress.step1 = {
        status: 'completed',
        data: enhancedContext,
        time: Date.now() - step1Start
      }
      console.log(`✅ STEP 1 completed in ${progress.step1.time}ms`)
    } catch (error) {
      progress.step1.status = 'failed'
      throw new Error(`Step 1 failed: ${error}`)
    }
    
    // STEP 2: Generate Questions
    console.log('🚀 STEP 2: Generating questions...')
    const step2Start = Date.now()
    
    let questions
    try {
      questions = await pipeline.testStep2_generateQuestions({
        id: company_id,
        name: enhancedContext.name,
        domain: enhancedContext.domain,
        description: enhancedContext.overview.join(' '),
        industry: enhancedContext.industryCategory
      }, enhancedContext)
      
      progress.step2 = {
        status: 'completed',
        data: { total_questions: questions.length },
        time: Date.now() - step2Start
      }
      console.log(`✅ STEP 2 completed in ${progress.step2.time}ms - Generated ${questions.length} questions`)
    } catch (error) {
      progress.step2.status = 'failed'
      throw new Error(`Step 2 failed: ${error}`)
    }
    
    // STEP 3: Get AI Responses
    console.log('🚀 STEP 3: Getting AI responses...')
    const step3Start = Date.now()
    
    let responses
    try {
      const questionsToProcess = test_mode ? questions.slice(0, 3) : questions.slice(0, 10)
      console.log(`${test_mode ? '⚠️ TEST MODE' : '📊 SAMPLE MODE'}: Processing ${questionsToProcess.length} questions`)
      
      responses = await pipeline.testStep3_getAIResponses(questionsToProcess)
      
      progress.step3 = {
        status: 'completed',
        data: {
          total_responses: responses.length,
          successful_responses: responses.filter(r => r.response && r.response.length > 0).length
        },
        time: Date.now() - step3Start
      }
      console.log(`✅ STEP 3 completed in ${progress.step3.time}ms`)
    } catch (error) {
      progress.step3.status = 'failed'
      throw new Error(`Step 3 failed: ${error}`)
    }
    
    // STEP 4: GPT-4o Analysis - THE MAIN TEST
    console.log('🚀 STEP 4: GPT-4o Intelligent Analysis...')
    const step4Start = Date.now()
    
    let analyses
    try {
      // Filter to responses with actual content for analysis
      const responsesToAnalyze = responses.filter(r => r.response && r.response.length > 50)
      
      if (responsesToAnalyze.length === 0) {
        throw new Error('No valid responses to analyze')
      }
      
      console.log(`🧠 Analyzing ${responsesToAnalyze.length} responses with GPT-4o`)
      
      analyses = await pipeline.testStep4_analyzeWithGPT4o({
        id: company_id,
        name: enhancedContext.name,
        domain: enhancedContext.domain,
        description: enhancedContext.overview.join(' '),
        industry: enhancedContext.industryCategory
      }, responsesToAnalyze)
      
      progress.step4 = {
        status: 'completed',
        data: {
          total_analyses: analyses.length,
          successful_analyses: analyses.filter(a => !a.error).length,
          failed_analyses: analyses.filter(a => a.error).length
        },
        time: Date.now() - step4Start
      }
      console.log(`✅ STEP 4 completed in ${progress.step4.time}ms`)
    } catch (error) {
      progress.step4.status = 'failed'
      throw new Error(`Step 4 failed: ${error}`)
    }
    
    const totalTime = Date.now() - startTime
    
    // Aggregate Step 4 Analysis Results
    const step4Analysis = {
      mentions_detected: analyses.filter(a => a.analysis?.mention_analysis?.mention_detected).length,
      total_competitors_found: analyses.reduce((sum, a) => 
        sum + (a.analysis?.competitor_analysis?.length || 0), 0),
      citation_classifications: {
        owned: 0,
        operated: 0,
        earned: 0,
        competitor: 0
      },
      sentiment_distribution: {
        very_positive: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        very_negative: 0
      },
      avg_visibility_score: 0,
      unique_competitors: new Set()
    }
    
    // Aggregate data from all analyses
    analyses.forEach(analysis => {
      if (!analysis.analysis) return
      
      // Citation classifications
      analysis.analysis.citation_analysis?.forEach((citation: any) => {
        if (step4Analysis.citation_classifications[citation.bucket]) {
          step4Analysis.citation_classifications[citation.bucket]++
        }
      })
      
      // Sentiment distribution
      if (analysis.analysis.mention_analysis?.mention_sentiment) {
        const sentiment = analysis.analysis.mention_analysis.mention_sentiment
        if (step4Analysis.sentiment_distribution[sentiment] !== undefined) {
          step4Analysis.sentiment_distribution[sentiment]++
        }
      }
      
      // Unique competitors
      analysis.analysis.competitor_analysis?.forEach((comp: any) => {
        step4Analysis.unique_competitors.add(comp.company_name)
      })
      
      // Visibility scores
      if (analysis.analysis.insights?.visibility_score) {
        step4Analysis.avg_visibility_score += analysis.analysis.insights.visibility_score
      }
    })
    
    step4Analysis.avg_visibility_score = analyses.length > 0 ? 
      step4Analysis.avg_visibility_score / analyses.length : 0
    
    // Sample data for inspection
    const samples = {
      enhanced_context_sample: {
        name: enhancedContext.name,
        industry: enhancedContext.industryCategory,
        competitors: enhancedContext.competitors.slice(0, 3),
        pain_points: enhancedContext.painPoints.slice(0, 2)
      },
      
      question_response_samples: responses.slice(0, 2).map(r => ({
        question: r.question.question,
        response_preview: r.response.substring(0, 150) + '...',
        citations_count: r.citations.length
      })),
      
      gpt4o_analysis_samples: analyses.slice(0, 2).map(a => ({
        question: a.question_text,
        mention_detected: a.analysis?.mention_analysis?.mention_detected,
        mention_sentiment: a.analysis?.mention_analysis?.mention_sentiment,
        competitors_found: a.analysis?.competitor_analysis?.length || 0,
        visibility_score: a.analysis?.insights?.visibility_score,
        has_error: !!a.error
      }))
    }
    
    // Validation checks
    const validation = {
      step4_gpt4o_analysis: {
        api_connectivity: progress.step4.status === 'completed',
        analysis_success_rate: analyses.length > 0 ? 
          analyses.filter(a => !a.error).length / analyses.length : 0,
        mention_detection_working: step4Analysis.mentions_detected > 0,
        competitor_extraction_working: step4Analysis.total_competitors_found > 0,
        citation_classification_working: Object.values(step4Analysis.citation_classifications).some(v => v > 0),
        insights_generation_working: analyses.some(a => a.analysis?.insights?.competitive_position),
        structured_output: analyses.every(a => a.analysis?.mention_analysis && a.analysis?.competitor_analysis)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        pipeline_status: 'completed',
        test_mode,
        total_processing_time_ms: totalTime,
        progress,
        step4_analysis: step4Analysis,
        step4_insights: {
          unique_competitors_found: Array.from(step4Analysis.unique_competitors),
          primary_sentiment: Object.entries(step4Analysis.sentiment_distribution)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral',
          citation_breakdown_pct: {
            owned: Math.round((step4Analysis.citation_classifications.owned / 
              Object.values(step4Analysis.citation_classifications).reduce((a,b) => a+b, 0)) * 100) || 0,
            earned: Math.round((step4Analysis.citation_classifications.earned / 
              Object.values(step4Analysis.citation_classifications).reduce((a,b) => a+b, 0)) * 100) || 0
          }
        },
        validation,
        samples,
        performance: {
          step4_time_ms: progress.step4.time,
          avg_analysis_time_ms: analyses.length > 0 ? 
            Math.round(progress.step4.time / analyses.length) : 0,
          gpt4o_success_rate: validation.step4_gpt4o_analysis.analysis_success_rate
        },
        ready_for_step5: validation.step4_gpt4o_analysis.api_connectivity && 
                        validation.step4_gpt4o_analysis.analysis_success_rate > 0.7,
        step4_status: 'COMPLETED'
      }
    })
    
  } catch (error) {
    console.error('❌ Step 4 pipeline test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      step4_status: 'FAILED',
      ready_for_step5: false,
      note: 'Check OpenAI API key and ensure GPT-4o access'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'MAX Visibility Step 4 Test',
    description: 'Tests complete pipeline with GPT-4o intelligent analysis: Steps 1→2→3→4',
    usage: 'POST with { "company_id": "your-company-id", "test_mode": true }',
    step: 'Step 4: GPT-4o Intelligent Analysis',
    features: [
      'Enhanced company context building',
      'Deterministic question generation',
      'Perplexity API response collection',
      'GPT-4o mention detection and analysis',
      'Competitor extraction and sentiment analysis',
      'Citation classification (owned/earned/competitor)',
      'Topic analysis and insights generation',
      'Comprehensive validation and metrics'
    ],
    gpt4o_capabilities: [
      'Mention detection with position and sentiment',
      'Dynamic competitor discovery',
      'Citation source classification',
      'Topic extraction and relevance scoring',
      'Competitive positioning insights',
      'Content opportunity identification'
    ],
    test_mode: 'Set test_mode: true to process 3 questions (recommended for testing)',
    requirements: [
      'OpenAI API key with GPT-4o access',
      'Perplexity API key',
      'Company with knowledge base entries'
    ],
    status: 'ready'
  })
} 