import { MaxQuestionAnalysis, MaxVisibilityScore } from '@/types/max-visibility'
import { CompetitiveMetrics } from '../types/pipeline-types'

export class VisibilityScorer {
  /**
   * Calculate final visibility scores from question analyses
   */
  calculateFinalScores(analyses: MaxQuestionAnalysis[]): MaxVisibilityScore {
    if (!analyses || analyses.length === 0) {
      return this.createEmptyScore()
    }

    console.log(`🔢 Calculating final scores from ${analyses.length} analyses`)

    // Core scoring components
    const difficultyWeightedScore = this.calculateDifficultyWeightedScore(analyses)
    const competitiveMetrics = this.calculateCompetitiveMetrics(analyses)
    const citationQualityScore = this.calculateCitationQualityScore(analyses)
    
    // Apply advanced scoring curve
    const toughScore = this.applyToughScoringCurve(
      difficultyWeightedScore,
      competitiveMetrics,
      citationQualityScore
    )

    // Additional quality metrics
    const advancedQualityScore = this.calculateAdvancedQualityScore(analyses)
    const consistencyScore = this.calculateConsistencyScore(analyses)
    
    // Citation breakdown
    const citationBreakdown = this.getCitationBreakdown(analyses)

    console.log(`📊 Score components:`)
    console.log(`  - Difficulty Weighted: ${difficultyWeightedScore.toFixed(1)}`)
    console.log(`  - Competitive Bonus: ${competitiveMetrics.competitiveBonus.toFixed(1)}`)
    console.log(`  - Citation Quality: ${citationQualityScore.toFixed(1)}`)
    console.log(`  - Final Tough Score: ${toughScore.toFixed(1)}`)

    return {
      overall: Math.round(toughScore),
      mention_quality: advancedQualityScore,
      competitive_intelligence: competitiveMetrics.shareOfVoice,
      consistency: consistencyScore,
      citation_quality: citationQualityScore,
      difficulty_bonus: competitiveMetrics.competitiveBonus,
      breakdown: {
        question_scores: analyses.map(a => ({
          question_id: a.question_id,
          score: this.getQualityScore(a.mention_analysis),
          influence: a.mention_analysis?.influence_score || 0
        })),
        competitor_analysis: {
          count: competitiveMetrics.competitorCount,
          share_of_voice: competitiveMetrics.shareOfVoice,
          niche_size: competitiveMetrics.nicheSize
        },
        citation_sources: citationBreakdown
      }
    }
  }

  /**
   * Calculate difficulty-weighted score
   */
  private calculateDifficultyWeightedScore(analyses: MaxQuestionAnalysis[]): number {
    let totalWeightedScore = 0
    let totalWeight = 0

    analyses.forEach(analysis => {
      const quality = this.getQualityScore(analysis.mention_analysis)
      const difficulty = analysis.question_metadata?.difficulty || 'medium'
      
      // Difficulty weights
      const difficultyWeight = {
        'easy': 1.0,
        'medium': 1.5,
        'hard': 2.0,
        'expert': 2.5
      }[difficulty] || 1.5

      const weightedScore = quality * difficultyWeight
      totalWeightedScore += weightedScore
      totalWeight += difficultyWeight

      console.log(`  ${analysis.question_id}: ${quality} × ${difficultyWeight} = ${weightedScore.toFixed(1)}`)
    })

    return totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0
  }

  /**
   * Calculate competitive metrics and bonuses
   */
  private calculateCompetitiveMetrics(analyses: MaxQuestionAnalysis[]): CompetitiveMetrics {
    const allCompetitors = new Set<string>()
    let totalMentions = 0
    let companyMentions = 0

    analyses.forEach(analysis => {
      // Count unique competitors from this analysis
      if (analysis.competitive_analysis?.competitors) {
        analysis.competitive_analysis.competitors.forEach((comp: any) => {
          allCompetitors.add(comp.name)
        })
      }

      // Count mentions for share of voice
      const mentions = analysis.mention_analysis?.mentions || 0
      totalMentions += mentions
      
      // Assume the first/primary mention is for the company being analyzed
      if (mentions > 0) {
        companyMentions += 1 // Simplified - in real implementation, this would be more nuanced
      }
    })

    const competitorCount = allCompetitors.size
    const shareOfVoice = totalMentions > 0 ? (companyMentions / totalMentions) * 100 : 0

    // Determine niche size based on competitor count
    let nicheSize: 'micro' | 'niche' | 'broad'
    if (competitorCount <= 3) nicheSize = 'micro'
    else if (competitorCount <= 8) nicheSize = 'niche'
    else nicheSize = 'broad'

    // Calculate competitive bonus
    const nicheBonus = {
      'micro': 15,    // Very specialized niche
      'niche': 10,    // Moderate niche
      'broad': 5      // Broad market
    }[nicheSize]

    const shareOfVoiceBonus = Math.min(shareOfVoice * 0.2, 10) // Max 10 bonus points
    const competitiveBonus = nicheBonus + shareOfVoiceBonus

    console.log(`🏆 Competitive Analysis:`)
    console.log(`  - Competitors found: ${competitorCount}`)
    console.log(`  - Niche size: ${nicheSize}`)
    console.log(`  - Share of voice: ${shareOfVoice.toFixed(1)}%`)
    console.log(`  - Competitive bonus: ${competitiveBonus.toFixed(1)}`)

    return {
      competitorCount,
      shareOfVoice,
      nicheSize,
      competitiveBonus
    }
  }

  /**
   * Calculate citation quality score
   */
  private calculateCitationQualityScore(analyses: MaxQuestionAnalysis[]): number {
    let totalCitations = 0
    let qualityCitations = 0

    analyses.forEach(analysis => {
      const citations = analysis.citations || []
      totalCitations += citations.length

      citations.forEach(citation => {
        // Quality indicators
        if (this.isHighQualityCitation(citation)) {
          qualityCitations++
        }
      })
    })

    return totalCitations > 0 ? (qualityCitations / totalCitations) * 100 : 0
  }

  /**
   * Apply tough scoring curve with competitive adjustments
   */
  private applyToughScoringCurve(
    weightedScore: number,
    competitiveMetrics: CompetitiveMetrics,
    citationScore: number
  ): number {
    // Base curve - makes it harder to get high scores
    let curved = Math.pow(weightedScore / 100, 1.2) * 100

    // Citation quality adjustment
    const citationMultiplier = 0.7 + (citationScore / 100) * 0.3
    curved *= citationMultiplier

    // Competitive bonus
    curved += competitiveMetrics.competitiveBonus

    // Cap at 100
    return Math.min(curved, 100)
  }

  /**
   * Calculate advanced quality score
   */
  private calculateAdvancedQualityScore(analyses: MaxQuestionAnalysis[]): number {
    if (analyses.length === 0) return 0

    const avgQuality = this.calculateAverageQuality(analyses)
    const avgInfluence = this.calculateAverageInfluence(analyses)
    
    // Weighted combination
    return (avgQuality * 0.7) + (avgInfluence * 0.3)
  }

  /**
   * Calculate consistency score across analyses
   */
  private calculateConsistencyScore(analyses: MaxQuestionAnalysis[]): number {
    if (analyses.length <= 1) return 100

    const scores = analyses.map(a => this.getQualityScore(a.mention_analysis))
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    const stdDev = Math.sqrt(variance)
    
    // Convert to consistency score (lower std dev = higher consistency)
    const consistencyScore = Math.max(0, 100 - (stdDev * 2))
    return consistencyScore
  }

  /**
   * Calculate average quality across analyses
   */
  private calculateAverageQuality(analyses: MaxQuestionAnalysis[]): number {
    if (analyses.length === 0) return 0
    
    const totalQuality = analyses.reduce((sum, analysis) => {
      return sum + this.getQualityScore(analysis.mention_analysis)
    }, 0)
    
    return totalQuality / analyses.length
  }

  /**
   * Calculate average influence across analyses
   */
  private calculateAverageInfluence(analyses: MaxQuestionAnalysis[]): number {
    if (analyses.length === 0) return 0
    
    const totalInfluence = analyses.reduce((sum, analysis) => {
      return sum + (analysis.mention_analysis?.influence_score || 0)
    }, 0)
    
    return totalInfluence / analyses.length
  }

  /**
   * Get quality score from mention analysis
   */
  private getQualityScore(mentionAnalysis: any): number {
    if (!mentionAnalysis) return 0
    return mentionAnalysis.quality_score || 0
  }

  /**
   * Get citation breakdown by domain
   */
  private getCitationBreakdown(analyses: MaxQuestionAnalysis[]): Record<string, number> {
    const breakdown: Record<string, number> = {}
    
    analyses.forEach(analysis => {
      (analysis.citations || []).forEach(citation => {
        const domain = this.extractDomainFromUrl(citation)
        breakdown[domain] = (breakdown[domain] || 0) + 1
      })
    })
    
    return breakdown
  }

  /**
   * Check if citation is high quality
   */
  private isHighQualityCitation(citation: string): boolean {
    const highQualityDomains = [
      'techcrunch.com',
      'forbes.com',
      'wsj.com',
      'bloomberg.com',
      'reuters.com',
      'harvard.edu',
      'mit.edu',
      'stanford.edu'
    ]
    
    const domain = this.extractDomainFromUrl(citation).toLowerCase()
    return highQualityDomains.some(hqDomain => domain.includes(hqDomain))
  }

  /**
   * Extract domain from URL
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace(/^www\./, '')
    } catch (error) {
      return 'unknown.com'
    }
  }

  /**
   * Create empty score structure
   */
  private createEmptyScore(): MaxVisibilityScore {
    return {
      overall: 0,
      mention_quality: 0,
      competitive_intelligence: 0,
      consistency: 0,
      citation_quality: 0,
      difficulty_bonus: 0,
      breakdown: {
        question_scores: [],
        competitor_analysis: {
          count: 0,
          share_of_voice: 0,
          niche_size: 'broad'
        },
        citation_sources: {}
      }
    }
  }
} 