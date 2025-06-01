// Enhanced Scoring Engine for MAX Visibility System
// Builds on basic scoring in pipeline.ts with advanced features

import { 
  MaxAssessmentResult,
  MaxVisibilityScore,
  MaxQuestionAnalysis,
  MentionAnalysisResult,
  CitationClassificationResult
} from '@/types/max-visibility'
import { createClient } from '@/lib/supabase/client'

export interface ScoringWeights {
  mention_rate: number      // Default: 0.40
  mention_quality: number   // Default: 0.25
  source_influence: number  // Default: 0.20
  competitive_positioning: number // Default: 0.10
  response_consistency: number    // Default: 0.05
}

export interface ScoringBreakdown {
  overall_score: number
  component_scores: {
    mention_rate: { score: number; weight: number; explanation: string }
    mention_quality: { score: number; weight: number; explanation: string }
    source_influence: { score: number; weight: number; explanation: string }
    competitive_positioning: { score: number; weight: number; explanation: string }
    response_consistency: { score: number; weight: number; explanation: string }
  }
  historical_comparison?: {
    previous_score: number
    change: number
    change_percentage: number
    trend: 'improving' | 'declining' | 'stable'
  }
  industry_benchmark?: {
    industry_average: number
    percentile: number
    ranking: number
    total_companies: number
  }
  recommendations: string[]
  calculation_details: string[]
}

export interface IndustryBenchmark {
  industry: string
  average_score: number
  percentile_breakdowns: {
    '90th': number
    '75th': number
    '50th': number
    '25th': number
    '10th': number
  }
  sample_size: number
}

export class EnhancedScoringEngine {
  private supabase: ReturnType<typeof createClient>
  private defaultWeights: ScoringWeights = {
    mention_rate: 0.40,
    mention_quality: 0.25,
    source_influence: 0.20,
    competitive_positioning: 0.10,
    response_consistency: 0.05
  }

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Calculate enhanced score with detailed breakdown and comparisons
   */
  async calculateEnhancedScore(
    analyses: MaxQuestionAnalysis[],
    companyId: string,
    weights: ScoringWeights = this.defaultWeights,
    industry?: string
  ): Promise<ScoringBreakdown> {
    // Calculate base component scores
    const componentScores = await this.calculateComponentScores(analyses, weights)
    
    // Calculate overall weighted score
    const overallScore = this.calculateWeightedScore(componentScores, weights)
    
    // Get historical comparison
    const historicalComparison = await this.getHistoricalComparison(companyId, overallScore)
    
    // Get industry benchmark
    const industryBenchmark = industry 
      ? await this.getIndustryBenchmark(overallScore, industry)
      : undefined
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(componentScores, historicalComparison, industryBenchmark)
    
    // Build calculation details
    const calculationDetails = this.buildCalculationDetails(componentScores, weights)
    
    return {
      overall_score: overallScore,
      component_scores: {
        mention_rate: {
          score: componentScores.mention_rate,
          weight: weights.mention_rate,
          explanation: this.explainMentionRate(componentScores.mention_rate, analyses)
        },
        mention_quality: {
          score: componentScores.mention_quality,
          weight: weights.mention_quality,
          explanation: this.explainMentionQuality(componentScores.mention_quality, analyses)
        },
        source_influence: {
          score: componentScores.source_influence,
          weight: weights.source_influence,
          explanation: this.explainSourceInfluence(componentScores.source_influence, analyses)
        },
        competitive_positioning: {
          score: componentScores.competitive_positioning,
          weight: weights.competitive_positioning,
          explanation: this.explainCompetitivePositioning(componentScores.competitive_positioning, analyses)
        },
        response_consistency: {
          score: componentScores.response_consistency,
          weight: weights.response_consistency,
          explanation: this.explainResponseConsistency(componentScores.response_consistency, analyses)
        }
      },
      historical_comparison: historicalComparison,
      industry_benchmark: industryBenchmark,
      recommendations,
      calculation_details: calculationDetails
    }
  }

  /**
   * Calculate detailed component scores
   */
  private async calculateComponentScores(
    analyses: MaxQuestionAnalysis[],
    weights: ScoringWeights
  ): Promise<Record<string, number>> {
    const totalQuestions = analyses.length
    const mentionedQuestions = analyses.filter(a => 
      this.getMentionDetected(a.mention_analysis)
    ).length

    // 1. Mention Rate Score (0-1)
    const mentionRate = totalQuestions > 0 ? mentionedQuestions / totalQuestions : 0

    // 2. Mention Quality Score (0-1)
    const qualityScores = analyses
      .filter(a => this.getMentionDetected(a.mention_analysis))
      .map(a => this.calculateMentionQualityScore(a.mention_analysis))
    const avgQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0

    // 3. Source Influence Score (0-1)
    const allCitations = analyses.flatMap(a => a.citation_analysis || [])
    const avgInfluence = allCitations.length > 0
      ? allCitations.reduce((sum, c) => sum + (c.influence_score || 0), 0) / allCitations.length
      : 0

    // 4. Competitive Positioning Score (0-1)
    const competitiveScore = this.calculateCompetitiveScore(analyses)

    // 5. Response Consistency Score (0-1)
    const consistencyScore = this.calculateConsistencyScore(analyses)

    return {
      mention_rate: mentionRate,
      mention_quality: avgQuality,
      source_influence: avgInfluence,
      competitive_positioning: competitiveScore,
      response_consistency: consistencyScore
    }
  }

  /**
   * Calculate mention quality score with advanced sentiment weighting
   */
  private calculateMentionQualityScore(mentionAnalysis: MentionAnalysisResult): number {
    const positionScores = {
      'primary': 1.0,
      'secondary': 0.7,
      'passing': 0.3,
      'none': 0
    }
    
    const sentimentMultipliers = {
      'very_positive': 1.3,
      'positive': 1.1,
      'neutral': 1.0,
      'negative': 0.7,
      'very_negative': 0.4
    }
    
    const baseScore = positionScores[mentionAnalysis.mention_position] || 0
    const sentimentMultiplier = sentimentMultipliers[mentionAnalysis.mention_sentiment] || 1.0
    const confidenceWeight = mentionAnalysis.confidence_score || 0.8
    
    return Math.max(0, Math.min(1, baseScore * sentimentMultiplier * confidenceWeight))
  }

  /**
   * Calculate competitive positioning score
   */
  private calculateCompetitiveScore(analyses: MaxQuestionAnalysis[]): number {
    const competitiveQuestions = analyses.filter(a => 
      a.question_type === 'comparison_query' || 
      a.question_text.toLowerCase().includes('vs') ||
      a.question_text.toLowerCase().includes('compare') ||
      a.question_text.toLowerCase().includes('alternative')
    )
    
    if (competitiveQuestions.length === 0) return 0.5 // Neutral if no competitive questions
    
    // Calculate score based on mention quality in competitive contexts
    const competitiveScores = competitiveQuestions.map(analysis => {
      if (!this.getMentionDetected(analysis.mention_analysis)) return 0
      return this.calculateMentionQualityScore(analysis.mention_analysis)
    })
    
    return competitiveScores.reduce((sum, score) => sum + score, 0) / competitiveScores.length
  }

  /**
   * Calculate response consistency score
   */
  private calculateConsistencyScore(analyses: MaxQuestionAnalysis[]): number {
    const mentionedAnalyses = analyses.filter(a => this.getMentionDetected(a.mention_analysis))
    
    if (mentionedAnalyses.length < 2) return 1.0 // Perfect consistency if too few mentions
    
    // Check sentiment consistency
    const sentiments = mentionedAnalyses.map(a => a.mention_analysis.mention_sentiment)
    const uniqueSentiments = new Set(sentiments)
    
    // Check position consistency  
    const positions = mentionedAnalyses.map(a => a.mention_analysis.mention_position)
    const uniquePositions = new Set(positions)
    
    // Combined consistency score
    const sentimentConsistency = 1 - (uniqueSentiments.size - 1) / 4 // 4 possible sentiment variations
    const positionConsistency = 1 - (uniquePositions.size - 1) / 3 // 3 possible position variations
    
    return Math.max(0.2, (sentimentConsistency + positionConsistency) / 2)
  }

  /**
   * Calculate final weighted score
   */
  private calculateWeightedScore(
    componentScores: Record<string, number>,
    weights: ScoringWeights
  ): number {
    return Number((
      componentScores.mention_rate * weights.mention_rate +
      componentScores.mention_quality * weights.mention_quality +
      componentScores.source_influence * weights.source_influence +
      componentScores.competitive_positioning * weights.competitive_positioning +
      componentScores.response_consistency * weights.response_consistency
    ).toFixed(4))
  }

  /**
   * Get historical comparison with previous assessments
   */
  private async getHistoricalComparison(
    companyId: string,
    currentScore: number
  ): Promise<ScoringBreakdown['historical_comparison']> {
    try {
      const { data: previousAssessments, error } = await this.supabase
        .from('max_assessments')
        .select('visibility_scores')
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(2) // Current + previous

      if (error || !previousAssessments || previousAssessments.length < 2) {
        return undefined
      }

      const previousScore = previousAssessments[1]?.visibility_scores?.overall_score
      if (!previousScore) return undefined

      const change = currentScore - previousScore
      const changePercentage = previousScore > 0 ? (change / previousScore) * 100 : 0
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable'
      if (Math.abs(change) > 0.01) { // 1% threshold
        trend = change > 0 ? 'improving' : 'declining'
      }

      return {
        previous_score: previousScore,
        change: Number(change.toFixed(4)),
        change_percentage: Number(changePercentage.toFixed(2)),
        trend
      }
    } catch (error) {
      console.error('Error getting historical comparison:', error)
      return undefined
    }
  }

  /**
   * Get industry benchmark data
   */
  private async getIndustryBenchmark(
    currentScore: number,
    industry: string
  ): Promise<ScoringBreakdown['industry_benchmark']> {
    try {
      // This would ideally query a benchmarks table or external service
      // For now, return simulated industry data
      const industryBenchmarks: Record<string, IndustryBenchmark> = {
        'technology': {
          industry: 'technology',
          average_score: 0.72,
          percentile_breakdowns: {
            '90th': 0.88,
            '75th': 0.80,
            '50th': 0.72,
            '25th': 0.64,
            '10th': 0.55
          },
          sample_size: 1247
        },
        'finance': {
          industry: 'finance',
          average_score: 0.68,
          percentile_breakdowns: {
            '90th': 0.85,
            '75th': 0.76,
            '50th': 0.68,
            '25th': 0.60,
            '10th': 0.52
          },
          sample_size: 892
        },
        'healthcare': {
          industry: 'healthcare',
          average_score: 0.65,
          percentile_breakdowns: {
            '90th': 0.82,
            '75th': 0.73,
            '50th': 0.65,
            '25th': 0.57,
            '10th': 0.48
          },
          sample_size: 634
        }
      }

      const benchmark = industryBenchmarks[industry.toLowerCase()]
      if (!benchmark) return undefined

      // Calculate percentile
      let percentile = 50 // Default to median
      const breakdowns = benchmark.percentile_breakdowns
      
      if (currentScore >= breakdowns['90th']) percentile = 95
      else if (currentScore >= breakdowns['75th']) percentile = 80
      else if (currentScore >= breakdowns['50th']) percentile = 60
      else if (currentScore >= breakdowns['25th']) percentile = 30
      else percentile = 15

      // Simulate ranking (in a real system, this would be calculated from actual data)
      const ranking = Math.max(1, Math.ceil(benchmark.sample_size * (100 - percentile) / 100))

      return {
        industry_average: benchmark.average_score,
        percentile,
        ranking,
        total_companies: benchmark.sample_size
      }
    } catch (error) {
      console.error('Error getting industry benchmark:', error)
      return undefined
    }
  }

  /**
   * Generate actionable recommendations based on scores
   */
  private generateRecommendations(
    componentScores: Record<string, number>,
    historical?: ScoringBreakdown['historical_comparison'],
    benchmark?: ScoringBreakdown['industry_benchmark']
  ): string[] {
    const recommendations: string[] = []

    // Mention rate recommendations
    if (componentScores.mention_rate < 0.3) {
      recommendations.push("🎯 Focus on increasing brand mentions - create more discussion-worthy content and thought leadership pieces")
    }

    // Mention quality recommendations  
    if (componentScores.mention_quality < 0.5) {
      recommendations.push("✨ Improve mention quality by enhancing brand sentiment through better customer experiences and PR")
    }

    // Source influence recommendations
    if (componentScores.source_influence < 0.4) {
      recommendations.push("🔗 Build relationships with high-authority sources and influencers in your industry")
    }

    // Competitive positioning recommendations
    if (componentScores.competitive_positioning < 0.5) {
      recommendations.push("⚔️ Strengthen competitive differentiation and improve performance in comparison scenarios")
    }

    // Consistency recommendations
    if (componentScores.response_consistency < 0.7) {
      recommendations.push("🎭 Work on brand consistency across all touchpoints and messaging")
    }

    // Historical trend recommendations
    if (historical?.trend === 'declining') {
      recommendations.push("📉 Address declining trend - review recent changes and competitor activities")
    }

    // Industry benchmark recommendations
    if (benchmark && benchmark.percentile < 50) {
      recommendations.push(`📊 Performance below industry median - focus on best practices from top ${benchmark.industry} performers`)
    }

    return recommendations
  }

  // Explanation methods for each component
  private explainMentionRate(score: number, analyses: MaxQuestionAnalysis[]): string {
    const totalQuestions = analyses.length
    const mentionedQuestions = analyses.filter(a => this.getMentionDetected(a.mention_analysis)).length
    const percentage = Math.round((score * 100))
    
    return `Your brand was mentioned in ${mentionedQuestions} out of ${totalQuestions} AI responses (${percentage}%). This measures how often AI systems include your brand when discussing relevant topics.`
  }

  private explainMentionQuality(score: number, analyses: MaxQuestionAnalysis[]): string {
    const percentage = Math.round((score * 100))
    return `Average quality of mentions scored ${percentage}%. This combines mention position (primary vs. passing), sentiment (positive vs. negative), and confidence level of the AI analysis.`
  }

  private explainSourceInfluence(score: number, analyses: MaxQuestionAnalysis[]): string {
    const percentage = Math.round((score * 100))
    const totalCitations = analyses.flatMap(a => a.citation_analysis || []).length
    return `Source influence scored ${percentage}% across ${totalCitations} citations. Higher scores indicate citations from more authoritative and influential sources.`
  }

  private explainCompetitivePositioning(score: number, analyses: MaxQuestionAnalysis[]): string {
    const percentage = Math.round((score * 100))
    const competitiveQuestions = analyses.filter(a => 
      a.question_type === 'comparison_query' || 
      a.question_text.toLowerCase().includes('vs') ||
      a.question_text.toLowerCase().includes('compare')
    ).length
    
    return `Competitive positioning scored ${percentage}% across ${competitiveQuestions} competitive scenarios. This measures how well your brand performs when directly compared to alternatives.`
  }

  private explainResponseConsistency(score: number, analyses: MaxQuestionAnalysis[]): string {
    const percentage = Math.round((score * 100))
    return `Response consistency scored ${percentage}%. This measures how consistently AI systems portray your brand across different contexts and question types.`
  }

  private buildCalculationDetails(
    componentScores: Record<string, number>,
    weights: ScoringWeights
  ): string[] {
    return [
      `Mention Rate: ${(componentScores.mention_rate * 100).toFixed(1)}% × ${(weights.mention_rate * 100)}% weight = ${(componentScores.mention_rate * weights.mention_rate * 100).toFixed(1)} points`,
      `Mention Quality: ${(componentScores.mention_quality * 100).toFixed(1)}% × ${(weights.mention_quality * 100)}% weight = ${(componentScores.mention_quality * weights.mention_quality * 100).toFixed(1)} points`,
      `Source Influence: ${(componentScores.source_influence * 100).toFixed(1)}% × ${(weights.source_influence * 100)}% weight = ${(componentScores.source_influence * weights.source_influence * 100).toFixed(1)} points`,
      `Competitive Positioning: ${(componentScores.competitive_positioning * 100).toFixed(1)}% × ${(weights.competitive_positioning * 100)}% weight = ${(componentScores.competitive_positioning * weights.competitive_positioning * 100).toFixed(1)} points`,
      `Response Consistency: ${(componentScores.response_consistency * 100).toFixed(1)}% × ${(weights.response_consistency * 100)}% weight = ${(componentScores.response_consistency * weights.response_consistency * 100).toFixed(1)} points`
    ]
  }

  // Helper method to safely extract mention detected status
  private getMentionDetected(mentionAnalysis: any): boolean {
    if (typeof mentionAnalysis === 'boolean') return mentionAnalysis
    if (typeof mentionAnalysis === 'object' && mentionAnalysis !== null) {
      return Boolean(mentionAnalysis.mention_detected)
    }
    return false
  }
} 