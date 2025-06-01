// MAX Visibility Utility Functions
// Helper functions for working with MAX Visibility data

import { 
  MaxVisibilityScore, 
  AssessmentStatus, 
  MaxQuestionType,
  CitationBucket 
} from '@/types/max-visibility'

/**
 * Format visibility score as percentage
 */
export function formatScore(score: number, decimals: number = 1): string {
  return `${(score * 100).toFixed(decimals)}%`
}

/**
 * Get score grade (A, B, C, D, F)
 */
export function getScoreGrade(score: number): string {
  if (score >= 0.9) return 'A'
  if (score >= 0.8) return 'B'
  if (score >= 0.7) return 'C'
  if (score >= 0.6) return 'D'
  return 'F'
}

/**
 * Get score color for UI display
 */
export function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600'
  if (score >= 0.6) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get assessment status display info
 */
export function getStatusInfo(status: AssessmentStatus): {
  label: string
  color: string
  icon: string
} {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        color: 'text-gray-500 bg-gray-100',
        icon: '⏳'
      }
    case 'running':
      return {
        label: 'Running',
        color: 'text-blue-600 bg-blue-100',
        icon: '🔄'
      }
    case 'completed':
      return {
        label: 'Completed',
        color: 'text-green-600 bg-green-100',
        icon: '✅'
      }
    case 'failed':
      return {
        label: 'Failed',
        color: 'text-red-600 bg-red-100',
        icon: '❌'
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'text-orange-600 bg-orange-100',
        icon: '🚫'
      }
    default:
      return {
        label: 'Unknown',
        color: 'text-gray-500 bg-gray-100',
        icon: '❓'
      }
  }
}

/**
 * Get question type display info
 */
export function getQuestionTypeInfo(type: MaxQuestionType): {
  label: string
  description: string
  color: string
} {
  switch (type) {
    case 'direct_conversational':
      return {
        label: 'Direct',
        description: 'Brand-specific conversational questions',
        color: 'bg-blue-100 text-blue-800'
      }
    case 'indirect_conversational':
      return {
        label: 'Indirect',
        description: 'Competitive landscape questions',
        color: 'bg-green-100 text-green-800'
      }
    case 'comparison_query':
      return {
        label: 'Comparison',
        description: 'Direct competitor comparisons',
        color: 'bg-purple-100 text-purple-800'
      }
    case 'recommendation_request':
      return {
        label: 'Recommendation',
        description: 'Solution recommendation queries',
        color: 'bg-orange-100 text-orange-800'
      }
    case 'explanatory_query':
      return {
        label: 'Educational',
        description: 'Explanatory and educational queries',
        color: 'bg-gray-100 text-gray-800'
      }
    default:
      return {
        label: 'Unknown',
        description: 'Unknown question type',
        color: 'bg-gray-100 text-gray-800'
      }
  }
}

/**
 * Get citation bucket display info
 */
export function getCitationBucketInfo(bucket: CitationBucket): {
  label: string
  description: string
  color: string
  influence: string
} {
  switch (bucket) {
    case 'owned':
      return {
        label: 'Owned',
        description: 'Company-owned domains and content',
        color: 'bg-green-100 text-green-800',
        influence: 'High'
      }
    case 'operated':
      return {
        label: 'Operated',
        description: 'Company-operated social media and platforms',
        color: 'bg-blue-100 text-blue-800',
        influence: 'High'
      }
    case 'earned':
      return {
        label: 'Earned',
        description: 'Third-party mentions and coverage',
        color: 'bg-purple-100 text-purple-800',
        influence: 'Medium'
      }
    case 'competitor':
      return {
        label: 'Competitor',
        description: 'Competitor-owned content',
        color: 'bg-red-100 text-red-800',
        influence: 'Low'
      }
    default:
      return {
        label: 'Unknown',
        description: 'Unknown citation source',
        color: 'bg-gray-100 text-gray-800',
        influence: 'Unknown'
      }
  }
}

/**
 * Calculate score improvement from previous assessment
 */
export function calculateScoreImprovement(
  currentScore: number,
  previousScore: number
): {
  change: number
  percentage: number
  direction: 'up' | 'down' | 'same'
  color: string
} {
  const change = currentScore - previousScore
  const percentage = previousScore > 0 ? (change / previousScore) * 100 : 0
  
  let direction: 'up' | 'down' | 'same' = 'same'
  if (change > 0) direction = 'up'
  else if (change < 0) direction = 'down'
  
  const color = direction === 'up' ? 'text-green-600' : 
                direction === 'down' ? 'text-red-600' : 
                'text-gray-600'
  
  return {
    change: Math.abs(change),
    percentage: Math.abs(percentage),
    direction,
    color
  }
}

/**
 * Generate insights from visibility scores
 */
export function generateScoreInsights(scores: MaxVisibilityScore): string[] {
  const insights: string[] = []
  
  // Overall score insights
  if (scores.overall_score >= 0.8) {
    insights.push('🎉 Excellent visibility! Your brand is well-represented in AI responses.')
  } else if (scores.overall_score >= 0.6) {
    insights.push('👍 Good visibility with room for improvement.')
  } else {
    insights.push('📈 Significant opportunity to improve AI visibility.')
  }
  
  // Mention rate insights
  if (scores.mention_rate < 0.3) {
    insights.push('🎯 Focus on increasing mention rate - only mentioned in ' + formatScore(scores.mention_rate) + ' of queries.')
  }
  
  // Quality insights
  if (scores.mention_quality < 0.5) {
    insights.push('✨ Work on improving mention quality and sentiment.')
  }
  
  // Source influence insights
  if (scores.source_influence < 0.4) {
    insights.push('🔗 Build relationships with high-authority sources for better influence.')
  }
  
  // Competitive positioning insights
  if (scores.competitive_positioning < 0.5) {
    insights.push('⚔️ Strengthen competitive positioning in comparison queries.')
  }
  
  // Citation breakdown insights
  if (scores.citation_breakdown) {
    const { owned, operated, earned } = scores.citation_breakdown
    const total = owned + operated + earned
    const ownedPercentage = total > 0 ? owned / total : 0
    
    if (ownedPercentage < 0.2) {
      insights.push('📝 Increase owned content creation to improve visibility.')
    }
    
    if (earned < 2) {
      insights.push('📰 Work on earning more third-party mentions and coverage.')
    }
  }
  
  return insights
}

/**
 * Format assessment duration
 */
export function formatAssessmentDuration(
  startedAt: string,
  completedAt?: string
): string {
  const start = new Date(startedAt)
  const end = completedAt ? new Date(completedAt) : new Date()
  
  const durationMs = end.getTime() - start.getTime()
  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

/**
 * Validate MAX Visibility score structure
 */
export function validateScores(scores: any): scores is MaxVisibilityScore {
  return scores &&
    typeof scores.overall_score === 'number' &&
    typeof scores.mention_rate === 'number' &&
    typeof scores.mention_quality === 'number' &&
    typeof scores.source_influence === 'number' &&
    typeof scores.competitive_positioning === 'number' &&
    typeof scores.response_consistency === 'number' &&
    typeof scores.total_questions === 'number' &&
    typeof scores.mentioned_questions === 'number'
}

/**
 * Get trending direction for score comparison
 */
export function getTrendingDirection(current: number, previous: number): {
  direction: 'up' | 'down' | 'stable'
  icon: string
  color: string
} {
  const threshold = 0.01 // 1% threshold for "stable"
  const diff = current - previous
  
  if (Math.abs(diff) < threshold) {
    return {
      direction: 'stable',
      icon: '→',
      color: 'text-gray-500'
    }
  }
  
  if (diff > 0) {
    return {
      direction: 'up',
      icon: '↗',
      color: 'text-green-600'
    }
  }
  
  return {
    direction: 'down',
    icon: '↘',
    color: 'text-red-600'
  }
}

/**
 * Export assessment data for CSV/Excel
 */
export function exportAssessmentData(assessment: any): {
  summary: Record<string, any>
  questions: Record<string, any>[]
  citations: Record<string, any>[]
} {
  const summary = {
    assessment_id: assessment.id,
    company_name: assessment.company?.name,
    assessment_date: assessment.completed_at,
    overall_score: assessment.visibility_scores?.overall_score,
    mention_rate: assessment.visibility_scores?.mention_rate,
    mention_quality: assessment.visibility_scores?.mention_quality,
    source_influence: assessment.visibility_scores?.source_influence,
    competitive_positioning: assessment.visibility_scores?.competitive_positioning,
    response_consistency: assessment.visibility_scores?.response_consistency,
    total_questions: assessment.visibility_scores?.total_questions,
    mentioned_questions: assessment.visibility_scores?.mentioned_questions
  }
  
  const questions = (assessment.question_analyses || []).map((analysis: any) => ({
    question: analysis.question_text,
    question_type: analysis.question_type,
    mentioned: analysis.mention_analysis?.mention_detected,
    mention_position: analysis.mention_analysis?.mention_position,
    mention_sentiment: analysis.mention_analysis?.mention_sentiment,
    question_score: analysis.question_score,
    ai_response_length: analysis.ai_response?.length || 0,
    citation_count: analysis.citation_analysis?.length || 0
  }))
  
  const citations = (assessment.question_analyses || [])
    .flatMap((analysis: any) => analysis.citation_analysis || [])
    .map((citation: any) => ({
      url: citation.citation_url,
      bucket: citation.bucket,
      influence_score: citation.influence_score,
      relevance_score: citation.relevance_score,
      reasoning: citation.reasoning
    }))
  
  return { summary, questions, citations }
}

/**
 * Calculate competitive benchmark
 */
export function calculateCompetitiveBenchmark(
  assessments: any[]
): {
  industry_average: number
  percentile: number
  ranking: number
  total_companies: number
} {
  if (assessments.length === 0) {
    return {
      industry_average: 0,
      percentile: 0,
      ranking: 0,
      total_companies: 0
    }
  }
  
  const scores = assessments
    .map(a => a.visibility_scores?.overall_score || 0)
    .sort((a, b) => b - a)
  
  const industry_average = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const currentScore = scores[0] // Assuming first is current
  const ranking = scores.indexOf(currentScore) + 1
  const percentile = ((scores.length - ranking + 1) / scores.length) * 100
  
  return {
    industry_average,
    percentile,
    ranking,
    total_companies: scores.length
  }
} 