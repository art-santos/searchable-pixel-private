import type { SerpResults } from './serper'
import type { ClassifiedResults, ClassificationResult } from './classify'

export interface VisibilityScore {
  aeo_score: number
  coverage_owned: number
  coverage_operated: number
  coverage_total: number
  share_of_voice: number
  metrics: {
    questions_analyzed: number
    total_results: number
    owned_appearances: number
    operated_appearances: number
    earned_appearances: number
    avg_owned_position: number
    avg_operated_position: number
    top_3_presence: number
  }
  breakdown: {
    by_question: QuestionScore[]
    by_position: PositionAnalysis
    top_performing_content: ClassificationResult[]
  }
  metadata: {
    target_domain: string
    calculated_at: string
    score_version: string
  }
}

interface QuestionScore {
  question: string
  owned_results: number
  operated_results: number
  earned_results: number
  owned_positions: number[]
  operated_positions: number[]
  coverage_score: number
  voice_score: number
  is_direct: boolean
  weight: number
}

interface PositionAnalysis {
  position_1: { owned: number, operated: number, earned: number }
  position_2_3: { owned: number, operated: number, earned: number }
  position_4_10: { owned: number, operated: number, earned: number }
}

/**
 * Calculates comprehensive AEO visibility score
 */
export function calculateVisibilityScore(
  serpResults: SerpResults,
  classifiedResults: ClassifiedResults,
  targetDomain: string
): VisibilityScore {
  console.log('📊 Starting AEO score calculation for:', targetDomain)
  
  // Build URL classification lookup
  const urlClassifications = new Map<string, ClassificationResult>()
  classifiedResults.classifications.forEach(item => {
    urlClassifications.set(item.url, item)
  })
  
  // Analyze each question
  const questionScores = analyzeQuestionPerformance(serpResults, urlClassifications)
  console.log(`📈 Analyzed ${questionScores.length} questions`)
  
  // Calculate coverage metrics
  const coverage = calculateCoverageMetrics(questionScores)
  console.log(`🎯 Coverage - Owned: ${(coverage.owned * 100).toFixed(1)}%, Operated: ${(coverage.operated * 100).toFixed(1)}%`)
  
  // Calculate share of voice
  const shareOfVoice = calculateShareOfVoice(questionScores)
  console.log(`📢 Share of Voice: ${(shareOfVoice * 100).toFixed(1)}%`)
  
  // Calculate position analysis
  const positionAnalysis = analyzePositions(questionScores)
  
  // Calculate composite AEO score
  const aeoScore = calculateCompositeScore(coverage, shareOfVoice, questionScores)
  console.log(`🏆 Final AEO Score: ${aeoScore}/100`)
  
  // Generate detailed metrics
  const metrics = generateDetailedMetrics(questionScores, urlClassifications)
  
  // Find top performing content
  const topPerforming = findTopPerformingContent(classifiedResults.classifications, 5)
  
  return {
    aeo_score: aeoScore,
    coverage_owned: coverage.owned,
    coverage_operated: coverage.operated,
    coverage_total: coverage.total,
    share_of_voice: shareOfVoice,
    metrics,
    breakdown: {
      by_question: questionScores,
      by_position: positionAnalysis,
      top_performing_content: topPerforming
    },
    metadata: {
      target_domain: targetDomain,
      calculated_at: new Date().toISOString(),
      score_version: '1.0.0'
    }
  }
}

/**
 * Analyzes performance for each question with weighted scoring
 */
function analyzeQuestionPerformance(
  serpResults: SerpResults,
  urlClassifications: Map<string, ClassificationResult>
): QuestionScore[] {
  return Object.entries(serpResults).map(([question, data]) => {
    const ownedPositions: number[] = []
    const operatedPositions: number[] = []
    let ownedResults = 0
    let operatedResults = 0
    let earnedResults = 0
    
    data.results.forEach(result => {
      const classification = urlClassifications.get(result.url)
      
      if (classification) {
        switch (classification.bucket) {
          case 'Owned':
            ownedResults++
            ownedPositions.push(result.position)
            break
          case 'Operated':
            operatedResults++
            operatedPositions.push(result.position)
            break
          case 'Earned':
            earnedResults++
            break
        }
      } else {
        // Default to earned if not classified
        earnedResults++
      }
    })
    
    // Determine question type (direct vs indirect) based on content
    const isDirect = isDirectQuestion(question)
    
    // Calculate coverage score for this question (presence in top 5, with weights)
    // Weight direct questions higher since company should perform better
    const hasOwnedInTop3 = ownedPositions.some(pos => pos <= 3)
    const hasOwnedInTop5 = ownedPositions.some(pos => pos <= 5)
    const hasOwnedInTop10 = ownedPositions.some(pos => pos <= 10)
    
    const hasOperatedInTop3 = operatedPositions.some(pos => pos <= 3)
    const hasOperatedInTop5 = operatedPositions.some(pos => pos <= 5)
    const hasOperatedInTop10 = operatedPositions.some(pos => pos <= 10)
    
    // Weighted coverage: Top 3 = 1.0, Top 5 = 0.8, Top 10 = 0.5
    let baseCoverageScore = 0
    if (hasOwnedInTop3) baseCoverageScore += 1.0
    else if (hasOwnedInTop5) baseCoverageScore += 0.8  
    else if (hasOwnedInTop10) baseCoverageScore += 0.5
    
    if (hasOperatedInTop3) baseCoverageScore += 0.5
    else if (hasOperatedInTop5) baseCoverageScore += 0.4
    else if (hasOperatedInTop10) baseCoverageScore += 0.25
    
    // Apply weight: direct questions worth 1.2x, indirect questions worth 1.0x
    const coverageWeight = isDirect ? 1.2 : 1.0
    const coverageScore = baseCoverageScore * coverageWeight
    
    // Calculate voice score (weighted by position)
    const ownedVoice = ownedPositions.reduce((sum, pos) => sum + (1 / pos), 0)
    const operatedVoice = operatedPositions.reduce((sum, pos) => sum + (1 / pos), 0)
    const totalVoice = data.results.reduce((sum, result) => sum + (1 / result.position), 0)
    const baseVoiceScore = totalVoice > 0 ? (ownedVoice + operatedVoice) / totalVoice : 0
    
    // Apply same weight to voice score
    const voiceScore = baseVoiceScore * coverageWeight
    
    return {
      question,
      owned_results: ownedResults,
      operated_results: operatedResults,
      earned_results: earnedResults,
      owned_positions: ownedPositions,
      operated_positions: operatedPositions,
      coverage_score: coverageScore,
      voice_score: voiceScore,
      is_direct: isDirect,
      weight: coverageWeight
    }
  })
}

/**
 * Determines if a question is direct (brand-specific) or indirect (competitive)
 */
function isDirectQuestion(question: string): boolean {
  const lowerQuestion = question.toLowerCase()
  
  // First check for indirect patterns (generic terms that should NOT be direct)
  const indirectPatterns = [
    /^(ai|artificial intelligence)\s+(api|tools?|platforms?|solutions?|software)\s+for/,
    /^best\s+(ai|artificial intelligence)/,
    /^top\s+(ai|artificial intelligence)/,
    /^(enterprise|business)\s+(ai|artificial intelligence)/,
    /^(coding|programming)\s+(ai|artificial intelligence)/,
    /^(ai|artificial intelligence)\s+(for|in|applications?|use cases?|solutions?)/
  ]
  
  // If it matches indirect patterns, it's competitive
  const hasIndirectPattern = indirectPatterns.some(pattern => pattern.test(lowerQuestion))
  if (hasIndirectPattern) {
    console.log(`⚔️ INDIRECT: "${question}"`)
    return false
  }
  
  // Direct question indicators - more specific for OpenAI
  const directIndicators = [
    // OpenAI-specific terms
    /\b(openai|chatgpt|gpt-4|gpt-3|dall-e|whisper)\b/,
    // Common brand-specific patterns
    /\b(google|microsoft|amazon|apple|meta|facebook|anthropic|claude)\b/,
    // Company domain patterns
    /\b[a-z]+\.com\b/,
    // Brand-specific action words
    /\b(pricing|login|api|dashboard|account|support|contact|documentation)\b/,
    // Direct comparison patterns
    /\bvs\b|\bversus\b|\bcompare.*to\b/,
    // Specific brand questions
    /what is [a-z]+(ai|gpt|bot)\b/,
    /how does [a-z]+(ai|gpt|bot)\b/,
    // Brand possessive forms
    /[a-z]+'s\s+(mission|work|features|capabilities)/
  ]
  
  // Check for direct indicators
  const hasDirectIndicator = directIndicators.some(pattern => pattern.test(lowerQuestion))
  if (hasDirectIndicator) {
    console.log(`🎯 DIRECT: "${question}"`)
    return true
  }
  
  // If no clear indicators, it's likely competitive/indirect
  console.log(`⚔️ INDIRECT: "${question}"`)
  return false
}

/**
 * Calculates coverage metrics (presence in top 5 with weighted scoring)
 */
function calculateCoverageMetrics(questionScores: QuestionScore[]) {
  const totalQuestions = questionScores.length
  if (totalQuestions === 0) return { owned: 0, operated: 0, total: 0 }
  
  // More generous coverage: count top 5 positions
  const ownedCoverage = questionScores.filter(q => 
    q.owned_positions.some(pos => pos <= 5)
  ).length / totalQuestions
  
  const operatedCoverage = questionScores.filter(q => 
    q.operated_positions.some(pos => pos <= 5)
  ).length / totalQuestions
  
  const totalCoverage = questionScores.filter(q => 
    q.owned_positions.some(pos => pos <= 5) || q.operated_positions.some(pos => pos <= 5)
  ).length / totalQuestions
  
  return {
    owned: ownedCoverage,
    operated: operatedCoverage,
    total: totalCoverage
  }
}

/**
 * Calculates share of voice (weighted by position) - improved version
 */
function calculateShareOfVoice(questionScores: QuestionScore[]): number {
  let totalControlledVoice = 0
  let totalAllVoice = 0
  
  questionScores.forEach(question => {
    // Controlled voice (owned + operated) - weighted by position
    const ownedVoice = question.owned_positions.reduce((sum, pos) => sum + (1 / pos), 0)
    const operatedVoice = question.operated_positions.reduce((sum, pos) => sum + (1 / pos), 0)
    const controlledVoice = ownedVoice + operatedVoice
    totalControlledVoice += controlledVoice
    
    // Total voice calculation - use actual number of results but cap at 10 for realism
    const totalResults = question.owned_results + question.operated_results + question.earned_results
    const effectiveResults = Math.min(10, totalResults) // Most people only look at top 10
    
    // Calculate voice for top 10 positions
    let questionTotalVoice = 0
    for (let i = 1; i <= effectiveResults; i++) {
      questionTotalVoice += 1 / i
    }
    
    // If we have fewer results than 10, this is the total voice available
    totalAllVoice += questionTotalVoice
  })
  
  return totalAllVoice > 0 ? totalControlledVoice / totalAllVoice : 0
}

/**
 * Analyzes performance by SERP position
 */
function analyzePositions(questionScores: QuestionScore[]): PositionAnalysis {
  const analysis: PositionAnalysis = {
    position_1: { owned: 0, operated: 0, earned: 0 },
    position_2_3: { owned: 0, operated: 0, earned: 0 },
    position_4_10: { owned: 0, operated: 0, earned: 0 }
  }
  
  questionScores.forEach(question => {
    // Position 1
    analysis.position_1.owned += question.owned_positions.filter(p => p === 1).length
    analysis.position_1.operated += question.operated_positions.filter(p => p === 1).length
    
    // Positions 2-3
    analysis.position_2_3.owned += question.owned_positions.filter(p => p >= 2 && p <= 3).length
    analysis.position_2_3.operated += question.operated_positions.filter(p => p >= 2 && p <= 3).length
    
    // Positions 4-10
    analysis.position_4_10.owned += question.owned_positions.filter(p => p >= 4 && p <= 10).length
    analysis.position_4_10.operated += question.operated_positions.filter(p => p >= 4 && p <= 10).length
    
    // Earned is everything else (approximated)
    const totalOwned = question.owned_results
    const totalOperated = question.operated_results
    const totalEarned = question.earned_results
    
    // Distribute earned across positions (simplified)
    if (totalEarned > 0) {
      analysis.position_1.earned += Math.min(1, totalEarned) * 0.1
      analysis.position_2_3.earned += Math.min(2, Math.max(0, totalEarned - 1)) * 0.3
      analysis.position_4_10.earned += Math.max(0, totalEarned - 3) * 0.6
    }
  })
  
  return analysis
}

/**
 * Calculates composite AEO score (0-100)
 */
function calculateCompositeScore(
  coverage: { owned: number, operated: number, total: number },
  shareOfVoice: number,
  questionScores: QuestionScore[]
): number {
  // Separate direct vs indirect performance
  const directQuestions = questionScores.filter(q => q.is_direct)
  const indirectQuestions = questionScores.filter(q => !q.is_direct)
  
  // Calculate separate coverage rates (using same logic as question scoring)
  const directCoverage = directQuestions.length > 0 
    ? directQuestions.filter(q => q.owned_positions.some(pos => pos <= 5) || q.operated_positions.some(pos => pos <= 5)).length / directQuestions.length
    : 0
  const indirectCoverage = indirectQuestions.length > 0
    ? indirectQuestions.filter(q => q.owned_positions.some(pos => pos <= 5) || q.operated_positions.some(pos => pos <= 5)).length / indirectQuestions.length  
    : 0
  
  // Calculate separate voice scores
  const directVoice = directQuestions.reduce((sum, q) => sum + q.voice_score, 0) / Math.max(directQuestions.length, 1)
  const indirectVoice = indirectQuestions.reduce((sum, q) => sum + q.voice_score, 0) / Math.max(indirectQuestions.length, 1)
  
  // Weighted formula (more realistic for strong brands):
  // 70% brand dominance (direct questions - companies should excel here)
  // 10% competitive performance (indirect questions - nice to have, not critical) 
  // 15% overall share of voice
  // 5% consistency bonus
  
  const brandScore = (directCoverage * 0.7 + directVoice * 0.3) * 100
  const competitiveScore = (indirectCoverage * 0.7 + indirectVoice * 0.3) * 100
  const voiceScore = shareOfVoice * 100
  
  // Consistency bonus: reward broad coverage across many questions
  const questionsWithPresence = questionScores.filter(q => 
    q.owned_results > 0 || q.operated_results > 0
  ).length
  const consistencyRate = questionsWithPresence / questionScores.length
  const consistencyBonus = consistencyRate * 5
  
  // Brand excellence bonus: heavily reward companies that dominate their brand searches
  let brandExcellenceBonus = 0
  if (directCoverage > 0.95) brandExcellenceBonus = 15 // Exceptional: 95%+ brand coverage
  else if (directCoverage > 0.90) brandExcellenceBonus = 12 // Excellent: 90%+ brand coverage  
  else if (directCoverage > 0.85) brandExcellenceBonus = 8 // Very good: 85%+ brand coverage
  else if (directCoverage > 0.80) brandExcellenceBonus = 4 // Good: 80%+ brand coverage
  
  const compositeScore = (brandScore * 0.7) + (competitiveScore * 0.1) + (voiceScore * 0.15) + consistencyBonus + brandExcellenceBonus
  
  // Debug logging
  console.log(`📊 Question Breakdown:`)
  console.log(`  🎯 Direct Questions: ${directQuestions.length}/${questionScores.length}`)
  console.log(`  ⚔️ Indirect Questions: ${indirectQuestions.length}/${questionScores.length}`)
  console.log(`📊 Score Breakdown (New Weights):`)
  console.log(`  🎯 Brand (Direct): ${(directCoverage * 100).toFixed(1)}% coverage, ${directVoice.toFixed(3)} voice → ${brandScore.toFixed(1)}pts × 70% = ${(brandScore * 0.7).toFixed(1)}pts`)
  console.log(`  ⚔️  Competitive (Indirect): ${(indirectCoverage * 100).toFixed(1)}% coverage, ${indirectVoice.toFixed(3)} voice → ${competitiveScore.toFixed(1)}pts × 10% = ${(competitiveScore * 0.1).toFixed(1)}pts`)
  console.log(`  📢 Overall Voice: ${shareOfVoice.toFixed(3)} → ${voiceScore.toFixed(1)}pts × 15% = ${(voiceScore * 0.15).toFixed(1)}pts`)
  console.log(`  🔄 Consistency: ${(consistencyRate * 100).toFixed(1)}% → ${consistencyBonus.toFixed(1)}pts`)
  console.log(`  🌟 Brand Excellence: ${(directCoverage * 100).toFixed(1)}% brand coverage → ${brandExcellenceBonus.toFixed(1)}pts bonus`)
  console.log(`  🏆 Final Score: ${(brandScore * 0.7).toFixed(1)} + ${(competitiveScore * 0.1).toFixed(1)} + ${(voiceScore * 0.15).toFixed(1)} + ${consistencyBonus.toFixed(1)} + ${brandExcellenceBonus.toFixed(1)} = ${compositeScore.toFixed(1)}pts`)
  
  // Apply realistic bounds (more generous for strong brand performers)
  // Companies with exceptional brand coverage can score very high
  const maxScore = directCoverage > 0.95 ? 95 : directCoverage > 0.90 ? 90 : directCoverage > 0.85 ? 85 : 80
  return Math.min(maxScore, Math.max(20, Math.round(compositeScore))) // Minimum 20, maximum based on brand performance
}

/**
 * Generates detailed metrics
 */
function generateDetailedMetrics(
  questionScores: QuestionScore[],
  urlClassifications: Map<string, ClassificationResult>
) {
  const totalResults = Array.from(urlClassifications.values()).length
  const ownedAppearances = Array.from(urlClassifications.values()).filter(c => c.bucket === 'Owned').length
  const operatedAppearances = Array.from(urlClassifications.values()).filter(c => c.bucket === 'Operated').length
  const earnedAppearances = Array.from(urlClassifications.values()).filter(c => c.bucket === 'Earned').length
  
  // Calculate average positions
  const allOwnedPositions = questionScores.flatMap(q => q.owned_positions)
  const allOperatedPositions = questionScores.flatMap(q => q.operated_positions)
  
  const avgOwnedPosition = allOwnedPositions.length > 0 
    ? allOwnedPositions.reduce((a, b) => a + b, 0) / allOwnedPositions.length 
    : 0
    
  const avgOperatedPosition = allOperatedPositions.length > 0
    ? allOperatedPositions.reduce((a, b) => a + b, 0) / allOperatedPositions.length
    : 0
  
  // Top 3 presence
  const top3Questions = questionScores.filter(q => 
    q.owned_positions.some(p => p <= 3) || q.operated_positions.some(p => p <= 3)
  ).length
  
  return {
    questions_analyzed: questionScores.length,
    total_results: totalResults,
    owned_appearances: ownedAppearances,
    operated_appearances: operatedAppearances,
    earned_appearances: earnedAppearances,
    avg_owned_position: Math.round(avgOwnedPosition * 10) / 10,
    avg_operated_position: Math.round(avgOperatedPosition * 10) / 10,
    top_3_presence: top3Questions
  }
}

/**
 * Finds top performing content
 */
function findTopPerformingContent(
  classifications: ClassificationResult[],
  limit: number = 5
): ClassificationResult[] {
  return classifications
    .filter(c => c.bucket === 'Owned' || c.bucket === 'Operated')
    .sort((a, b) => {
      // Prioritize Owned over Operated, then by URL quality indicators
      if (a.bucket !== b.bucket) {
        return a.bucket === 'Owned' ? -1 : 1
      }
      return b.title.length - a.title.length // Prefer longer, more descriptive titles
    })
    .slice(0, limit)
} 