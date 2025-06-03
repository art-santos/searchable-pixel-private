import { NextRequest, NextResponse } from 'next/server'
import { MaxVisibilityPipeline } from '@/lib/max-visibility/pipeline'

/**
 * Test endpoint for Step 5: Tough-but-Fair Scoring Algorithm
 * This tests the complete pipeline: Step 1 → Step 2 → Step 3 → Step 4 → Step 5
 * Focuses on the new scoring system with right-skewed distribution
 */
export async function POST(request: NextRequest) {
  try {
    const { company_id, test_mode = true } = await request.json()
    
    if (!company_id) {
      return NextResponse.json({
        success: false,
        error: 'company_id is required'
      }, { status: 400 })
    }
    
    console.log(`🎯 Testing Step 5: Tough-but-Fair Scoring Algorithm for ${company_id}`)
    
    // Initialize pipeline
    const pipeline = new MaxVisibilityPipeline()
    
    // Track pipeline progress
    const progress = {
      step1: { status: 'pending', data: null, time: 0 },
      step2: { status: 'pending', data: null, time: 0 },
      step3: { status: 'pending', data: null, time: 0 },
      step4: { status: 'pending', data: null, time: 0 },
      step5: { status: 'pending', data: null, time: 0 }
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
    console.log('🚀 STEP 2: Generating questions with difficulty weighting...')
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
        data: { 
          total_questions: questions.length,
          question_type_distribution: getQuestionTypeDistribution(questions)
        },
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
      const questionsToProcess = test_mode ? questions.slice(0, 5) : questions.slice(0, 15)
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
    
    // STEP 4: GPT-4o Analysis
    console.log('🚀 STEP 4: GPT-4o intelligent analysis...')
    const step4Start = Date.now()
    
    let analyses
    try {
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
    
    // STEP 5: TOUGH-BUT-FAIR SCORING - THE MAIN TEST
    console.log('🚀 STEP 5: Tough-but-Fair Scoring Algorithm...')
    const step5Start = Date.now()
    
    let scoringResults
    try {
      // Convert analysis format for scoring algorithm
      const scoringAnalyses = analyses.map(a => ({
        question_id: a.question_id,
        question_text: a.question_text,
        question_type: a.question.type || 'indirect_conversational', // Default fallback
        ai_response: '',
        response_citations: [],
        mention_analysis: a.analysis?.mention_analysis || {
          mention_detected: false,
          mention_position: 'passing', // Use valid position instead of 'none'
          mention_sentiment: 'neutral',
          mention_context: '',
          confidence_score: 0
        },
        citation_analysis: a.analysis?.citation_analysis || [],
        question_score: a.analysis?.insights?.visibility_score || 0,
        processed_at: a.processed_at
      }))
      
      // Calculate final scores using new algorithm
      const finalScores = pipeline.testStep5_calculateFinalScores(scoringAnalyses)
      
      // Extract competitive metrics for analysis
      const competitiveMetrics = extractCompetitiveMetrics(analyses)
      
      scoringResults = {
        final_scores: finalScores,
        competitive_metrics: competitiveMetrics,
        scoring_breakdown: {
          difficulty_weighted_mentions: calculateDifficultyWeightedScore(analyses),
          niche_analysis: analyzeNicheSize(competitiveMetrics),
          score_distribution_analysis: analyzeScoreDistribution(finalScores.overall_score)
        }
      }
      
      progress.step5 = {
        status: 'completed',
        data: {
          final_overall_score: Math.round(finalScores.overall_score * 100),
          mention_rate: Math.round(finalScores.mention_rate * 100),
          competitive_positioning: Math.round(finalScores.competitive_positioning * 100)
        },
        time: Date.now() - step5Start
      }
      console.log(`✅ STEP 5 completed in ${progress.step5.time}ms - Final Score: ${progress.step5.data.final_overall_score}`)
    } catch (error) {
      progress.step5.status = 'failed'
      throw new Error(`Step 5 failed: ${error}`)
    }
    
    const totalTime = Date.now() - startTime
    
    // Validation checks for Step 5 scoring algorithm
    const validation = {
      step5_scoring_algorithm: {
        score_reasonableness: scoringResults.final_scores.overall_score > 0 && scoringResults.final_scores.overall_score <= 1,
        right_skewed_distribution: progress.step5.data.final_overall_score <= 50, // Most companies should score under 50
        difficulty_weighting_working: scoringResults.scoring_breakdown.difficulty_weighted_mentions !== undefined,
        competitive_bonus_applied: scoringResults.competitive_metrics.total_competitors > 0,
        niche_size_detected: ['micro', 'niche', 'broad'].includes(scoringResults.scoring_breakdown.niche_analysis.niche_size),
        scoring_components_present: ['mention_rate', 'mention_quality', 'source_influence', 'competitive_positioning'].every(
          component => scoringResults.final_scores[component] !== undefined
        )
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        pipeline_status: 'completed',
        test_mode,
        total_processing_time_ms: totalTime,
        progress,
        step5_scoring_results: scoringResults,
        tough_scoring_analysis: {
          final_score_out_of_100: progress.step5.data.final_overall_score,
          score_grade: getScoreGrade(progress.step5.data.final_overall_score),
          distribution_analysis: scoringResults.scoring_breakdown.score_distribution_analysis,
          competitive_context: scoringResults.scoring_breakdown.niche_analysis,
          difficulty_impact: {
            direct_questions: analyses.filter(a => a.question?.type === 'direct_conversational').length,
            indirect_questions: analyses.filter(a => a.question?.type === 'indirect_conversational').length,
            weighted_vs_simple: 'Difficulty weighting prioritizes indirect organic mentions over direct name-drops'
          }
        },
        validation,
        performance: {
          step5_time_ms: progress.step5.time,
          total_pipeline_time_ms: totalTime,
          scoring_efficiency: `Processed ${analyses.length} analyses in ${progress.step5.time}ms`
        },
        ready_for_production: validation.step5_scoring_algorithm.score_reasonableness && 
                            validation.step5_scoring_algorithm.scoring_components_present,
        step5_status: 'COMPLETED - TOUGH SCORING ACTIVE'
      }
    })
    
  } catch (error) {
    console.error('❌ Step 5 scoring test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      step5_status: 'FAILED',
      ready_for_production: false,
      note: 'Check pipeline implementation and scoring algorithm'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'MAX Visibility Step 5 Test',
    description: 'Tests complete pipeline with new tough-but-fair scoring: Steps 1→2→3→4→5',
    step: 'Step 5: Tough-but-Fair Scoring Algorithm',
    features: [
      'Question difficulty weighting (indirect > direct)',
      'Competitor-count based niche sizing',
      'Share of voice calculation',
      'Right-skewed score distribution (like Domain Authority)',
      'Sentiment and position quality scoring',
      'Citation influence scoring',
      'Tough scoring curve (most companies score 10-30)'
    ],
    scoring_philosophy: [
      'Direct mentions (company in question) = Low weight (0.2x)',
      'Indirect mentions (organic AI suggestions) = High weight (1.0x+)',
      'Micro niche (1-3 competitors) = Less credit (0.8x)',
      'Broad market (10+ competitors) = Bonus credit (1.3x)',
      'Right-skewed like Domain Authority - tough but fair'
    ],
    test_mode: 'Set test_mode: true to process 5 questions (recommended for testing)',
    requirements: [
      'OpenAI API key with GPT-4o access',
      'Perplexity API key',
      'Company with knowledge base entries for competitive context'
    ],
    status: 'ready'
  })
}

// Helper functions for analysis
function getQuestionTypeDistribution(questions: any[]) {
  const distribution: Record<string, number> = {}
  questions.forEach(q => {
    distribution[q.type] = (distribution[q.type] || 0) + 1
  })
  return distribution
}

function extractCompetitiveMetrics(analyses: any[]) {
  const competitors = new Set()
  let totalMentions = 0
  let yourMentions = 0
  
  analyses.forEach(analysis => {
    if (analysis.analysis?.mention_analysis?.mention_detected) {
      yourMentions++
      totalMentions++
    }
    
    if (analysis.analysis?.competitor_analysis) {
      analysis.analysis.competitor_analysis.forEach((comp: any) => {
        competitors.add(comp.company_name.toLowerCase())
        totalMentions++
      })
    }
  })
  
  return {
    total_competitors: competitors.size,
    your_mentions: yourMentions,
    total_mentions: totalMentions,
    share_of_voice: totalMentions > 0 ? yourMentions / totalMentions : 0,
    unique_competitors: Array.from(competitors)
  }
}

function calculateDifficultyWeightedScore(analyses: any[]) {
  const difficultyWeights = {
    'direct_conversational': 0.2,
    'comparison_query': 0.5,
    'indirect_conversational': 1.0,
    'recommendation_request': 1.5,
    'explanatory_query': 2.0
  }
  
  let totalWeight = 0
  let achievedWeight = 0
  
  analyses.forEach(analysis => {
    const questionType = analysis.question?.type || 'indirect_conversational'
    const weight = difficultyWeights[questionType] || 1.0
    totalWeight += weight
    
    if (analysis.analysis?.mention_analysis?.mention_detected) {
      achievedWeight += weight
    }
  })
  
  return {
    total_weight: totalWeight,
    achieved_weight: achievedWeight,
    weighted_score: totalWeight > 0 ? achievedWeight / totalWeight : 0
  }
}

function analyzeNicheSize(competitiveMetrics: any) {
  const competitorCount = competitiveMetrics.total_competitors
  
  let nicheSize: string
  let analysis: string
  
  if (competitorCount <= 3) {
    nicheSize = 'micro'
    analysis = 'Very small niche - easy to dominate but limited market validation'
  } else if (competitorCount <= 10) {
    nicheSize = 'niche'
    analysis = 'Healthy niche size - good balance of opportunity and validation'
  } else {
    nicheSize = 'broad'
    analysis = 'Broad competitive market - any mention is impressive'
  }
  
  return {
    niche_size: nicheSize,
    competitor_count: competitorCount,
    analysis: analysis,
    share_of_voice: Math.round(competitiveMetrics.share_of_voice * 100) + '%'
  }
}

function analyzeScoreDistribution(score: number) {
  const scorePercent = Math.round(score * 100)
  
  if (scorePercent >= 80) {
    return {
      category: 'exceptional',
      percentile: '99th',
      analysis: 'Category leader level - exceptional AI visibility'
    }
  } else if (scorePercent >= 60) {
    return {
      category: 'excellent',
      percentile: '95th',
      analysis: 'Strong brand visibility - well-known player'
    }
  } else if (scorePercent >= 40) {
    return {
      category: 'good',
      percentile: '85th',
      analysis: 'Solid visibility - emerging brand recognition'
    }
  } else if (scorePercent >= 20) {
    return {
      category: 'fair',
      percentile: '60th',
      analysis: 'Some visibility - building brand awareness'
    }
  } else if (scorePercent >= 5) {
    return {
      category: 'poor',
      percentile: '40th',
      analysis: 'Limited visibility - significant growth opportunity'
    }
  } else {
    return {
      category: 'invisible',
      percentile: '10th',
      analysis: 'Minimal AI presence - need fundamental visibility strategy'
    }
  }
}

function getScoreGrade(score: number): string {
  if (score >= 80) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  if (score >= 20) return 'D'
  return 'F'
} 