// Data Transformation Layer for MAX Visibility System
// Bridges MAX data with existing UI components for seamless integration

import {
  MaxAssessmentResult,
  MaxVisibilityScore,
  MaxQuestionAnalysis,
  CompetitiveLandscape,
  ScoringBreakdown
} from '@/types/max-visibility'

// Legacy AEO data structures for backward compatibility
export interface LegacyAEOData {
  overallScore: number
  scoreHistory: Array<{ date: string; score: number }>
  scoreBreakdown: {
    mention_rate: number
    sentiment_score: number
    citation_influence: number
  }
  topicVisibility: Array<{
    topic: string
    visibility_score: number
    trend: 'up' | 'down' | 'stable'
    mentions: number
    sentiment: number
  }>
  competitorBenchmarking: Array<{
    name: string
    score: number
    change: number
    rank: number
  }>
  citations: Array<{
    url: string
    domain: string
    title: string
    bucket: 'owned' | 'operated' | 'earned'
    influence_score: number
  }>
  suggestions: Array<{
    category: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
  }>
}

// Enhanced visibility data that combines Lite + MAX
export interface UnifiedVisibilityData {
  // Core scoring
  lite_score?: number
  max_score: number
  combined_score: number
  score_confidence: number
  
  // Historical data
  score_history: Array<{ 
    date: string
    lite_score?: number
    max_score?: number
    combined_score: number
    data_source: 'lite' | 'max' | 'combined'
  }>
  
  // Enhanced topic visibility
  topic_visibility: Array<{
    topic: string
    lite_visibility?: number
    max_visibility: number
    combined_visibility: number
    conversation_contexts: string[]
    question_types: string[]
    sentiment_breakdown: {
      very_positive: number
      positive: number
      neutral: number
      negative: number
      very_negative: number
    }
    trend: {
      direction: 'up' | 'down' | 'stable'
      change_percentage: number
      confidence: number
    }
    sample_questions: string[]
    sample_responses: Array<{
      question: string
      response_excerpt: string
      mention_position: string
      sentiment: string
    }>
  }>
  
  // Enhanced competitive analysis
  competitive_benchmarking: Array<{
    name: string
    domain: string
    lite_score?: number
    max_score: number
    combined_score: number
    mention_rate: number
    sentiment_average: number
    market_share: number
    rank: number
    change_vs_previous?: number
    competitive_advantages: string[]
    competitive_weaknesses: string[]
    detected_from: 'lite' | 'max' | 'industry_db'
  }>
  
  // Enhanced citations
  citation_analysis: {
    total_citations: number
    breakdown: {
      owned: { count: number; influence: number; examples: string[] }
      operated: { count: number; influence: number; examples: string[] }
      earned: { count: number; influence: number; examples: string[] }
      competitor: { count: number; influence: number; examples: string[] }
    }
    high_influence_sources: Array<{
      url: string
      domain: string
      title: string
      influence_score: number
      bucket: string
      context: string
    }>
    authority_distribution: Array<{
      authority_level: 'high' | 'medium' | 'low'
      count: number
      percentage: number
    }>
  }
  
  // Enhanced suggestions
  ai_recommendations: Array<{
    category: 'content' | 'positioning' | 'competitive' | 'technical' | 'pr'
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    effort_level: 'low' | 'medium' | 'high'
    impact_potential: 'low' | 'medium' | 'high'
    actionable_steps: string[]
    success_metrics: string[]
    timeline: string
    data_source: 'lite' | 'max' | 'combined'
    supporting_data: Record<string, any>
  }>
  
  // META data
  assessment_info: {
    lite_analysis?: {
      completed_at: string
      questions_analyzed: number
      data_freshness: 'fresh' | 'recent' | 'stale'
    }
    max_analysis: {
      completed_at: string
      questions_analyzed: number
      processing_time_ms: number
      confidence_score: number
      data_freshness: 'fresh' | 'recent' | 'stale'
    }
    combined_confidence: number
    data_quality_score: number
    next_recommended_analysis: string
  }
}

export class DataTransformer {
  /**
   * Transform MAX assessment results to unified visibility data
   */
  static transformMaxToUnified(
    maxData: MaxAssessmentResult,
    liteData?: LegacyAEOData,
    competitiveLandscape?: CompetitiveLandscape,
    enhancedScoring?: ScoringBreakdown
  ): UnifiedVisibilityData {
    const maxScore = maxData.visibility_scores.overall_score
    const liteScore = liteData?.overallScore
    const combinedScore = this.calculateCombinedScore(maxScore, liteScore)
    
    return {
      // Core scoring
      lite_score: liteScore,
      max_score: maxScore,
      combined_score: combinedScore,
      score_confidence: this.calculateScoreConfidence(maxData, liteData),
      
      // Historical data
      score_history: this.buildScoreHistory(maxData, liteData),
      
      // Topic visibility
      topic_visibility: this.transformTopicVisibility(maxData, competitiveLandscape),
      
      // Competitive benchmarking
      competitive_benchmarking: this.transformCompetitiveBenchmarking(competitiveLandscape, liteData),
      
      // Citation analysis
      citation_analysis: this.transformCitationAnalysis(maxData),
      
      // AI recommendations
      ai_recommendations: this.transformRecommendations(maxData, enhancedScoring, liteData),
      
      // Assessment info
      assessment_info: this.buildAssessmentInfo(maxData, liteData)
    }
  }

  /**
   * Transform MAX data to legacy AEO format for backward compatibility
   */
  static transformMaxToLegacyAEO(maxData: MaxAssessmentResult): LegacyAEOData {
    return {
      overallScore: maxData.visibility_scores.overall_score,
      scoreHistory: this.buildLegacyScoreHistory(maxData),
      scoreBreakdown: {
        mention_rate: maxData.visibility_scores.mention_rate,
        sentiment_score: maxData.visibility_scores.mention_quality,
        citation_influence: maxData.visibility_scores.source_influence
      },
      topicVisibility: this.extractLegacyTopics(maxData),
      competitorBenchmarking: this.extractLegacyCompetitors(maxData),
      citations: this.extractLegacyCitations(maxData),
      suggestions: this.extractLegacySuggestions(maxData)
    }
  }

  /**
   * Enhance existing AEO data with MAX insights
   */
  static enhanceAEOWithMax(
    aeoData: LegacyAEOData,
    maxData: MaxAssessmentResult
  ): LegacyAEOData {
    return {
      ...aeoData,
      overallScore: this.calculateCombinedScore(maxData.visibility_scores.overall_score, aeoData.overallScore),
      scoreBreakdown: {
        ...aeoData.scoreBreakdown,
        mention_rate: maxData.visibility_scores.mention_rate,
        sentiment_score: maxData.visibility_scores.mention_quality
      },
      citations: [...aeoData.citations, ...this.extractLegacyCitations(maxData)],
      suggestions: [...aeoData.suggestions, ...this.extractLegacySuggestions(maxData)]
    }
  }

  // Private helper methods

  private static calculateCombinedScore(maxScore: number, liteScore?: number): number {
    if (!liteScore) return maxScore
    
    // Weighted combination: MAX 70%, Lite 30% (MAX is more comprehensive)
    return Number((maxScore * 0.7 + liteScore * 0.3).toFixed(4))
  }

  private static calculateScoreConfidence(maxData: MaxAssessmentResult, liteData?: LegacyAEOData): number {
    let confidence = 0.8 // Base confidence for MAX data
    
    // Increase confidence based on question count
    if (maxData.visibility_scores.total_questions >= 50) confidence += 0.1
    if (maxData.visibility_scores.total_questions >= 100) confidence += 0.05
    
    // Increase confidence if we have both data sources
    if (liteData) confidence += 0.05
    
    // Decrease confidence if low mention rate
    if (maxData.visibility_scores.mention_rate < 0.2) confidence -= 0.1
    
    return Math.min(confidence, 1.0)
  }

  private static buildScoreHistory(
    maxData: MaxAssessmentResult,
    liteData?: LegacyAEOData
  ): UnifiedVisibilityData['score_history'] {
    const history: UnifiedVisibilityData['score_history'] = []
    
    // Add current MAX data
    history.push({
      date: maxData.completed_at,
      max_score: maxData.visibility_scores.overall_score,
      lite_score: liteData?.overallScore,
      combined_score: this.calculateCombinedScore(maxData.visibility_scores.overall_score, liteData?.overallScore),
      data_source: liteData ? 'combined' : 'max'
    })
    
    // Add historical lite data if available
    if (liteData?.scoreHistory) {
      for (const entry of liteData.scoreHistory) {
        history.push({
          date: entry.date,
          lite_score: entry.score,
          combined_score: entry.score,
          data_source: 'lite'
        })
      }
    }
    
    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  private static transformTopicVisibility(
    maxData: MaxAssessmentResult,
    competitiveLandscape?: CompetitiveLandscape
  ): UnifiedVisibilityData['topic_visibility'] {
    const topics = new Map<string, {
      mentions: MaxQuestionAnalysis[]
      contexts: Set<string>
      questionTypes: Set<string>
    }>()
    
    // Extract topics from question analyses
    for (const analysis of maxData.question_analyses) {
      const topic = this.extractTopicFromQuestion(analysis.question_text)
      if (!topics.has(topic)) {
        topics.set(topic, {
          mentions: [],
          contexts: new Set(),
          questionTypes: new Set()
        })
      }
      
      const topicData = topics.get(topic)!
      if (this.getMentionDetected(analysis.mention_analysis)) {
        topicData.mentions.push(analysis)
      }
      topicData.contexts.add(this.extractContext(analysis.question_text))
      topicData.questionTypes.add(analysis.question_type)
    }
    
    return Array.from(topics.entries()).map(([topic, data]) => {
      const visibility = data.mentions.length / maxData.visibility_scores.total_questions
      const sentimentBreakdown = this.calculateSentimentBreakdown(data.mentions)
      
      return {
        topic,
        max_visibility: visibility,
        combined_visibility: visibility, // Enhanced when Lite data available
        conversation_contexts: Array.from(data.contexts),
        question_types: Array.from(data.questionTypes),
        sentiment_breakdown: sentimentBreakdown,
        trend: {
          direction: 'stable' as const, // Would be calculated from historical data
          change_percentage: 0,
          confidence: 0.8
        },
        sample_questions: data.mentions.slice(0, 3).map(m => m.question_text),
        sample_responses: data.mentions.slice(0, 2).map(m => ({
          question: m.question_text,
          response_excerpt: m.ai_response.substring(0, 200) + '...',
          mention_position: m.mention_analysis.mention_position || 'none',
          sentiment: m.mention_analysis.mention_sentiment || 'neutral'
        }))
      }
    }).sort((a, b) => b.max_visibility - a.max_visibility)
  }

  private static transformCompetitiveBenchmarking(
    competitiveLandscape?: CompetitiveLandscape,
    liteData?: LegacyAEOData
  ): UnifiedVisibilityData['competitive_benchmarking'] {
    if (!competitiveLandscape) return []
    
    const allCompetitors = [
      competitiveLandscape.target_company,
      ...competitiveLandscape.competitors
    ]
    
    return allCompetitors
      .sort((a, b) => b.metrics.ai_visibility_score - a.metrics.ai_visibility_score)
      .map((analysis, index) => ({
        name: analysis.competitor.name,
        domain: analysis.competitor.domain,
        max_score: analysis.metrics.ai_visibility_score,
        combined_score: analysis.metrics.ai_visibility_score, // Enhanced when Lite data available
        mention_rate: analysis.metrics.mention_rate,
        sentiment_average: analysis.metrics.sentiment_average,
        market_share: analysis.positioning.share_of_voice,
        rank: index + 1,
        competitive_advantages: analysis.positioning.competitive_advantage,
        competitive_weaknesses: analysis.positioning.competitive_weakness,
        detected_from: analysis.competitor.detected_from as 'lite' | 'max' | 'industry_db'
      }))
  }

  private static transformCitationAnalysis(maxData: MaxAssessmentResult): UnifiedVisibilityData['citation_analysis'] {
    const allCitations = maxData.question_analyses.flatMap(a => a.citation_analysis || [])
    
    const breakdown = {
      owned: { count: 0, influence: 0, examples: [] as string[] },
      operated: { count: 0, influence: 0, examples: [] as string[] },
      earned: { count: 0, influence: 0, examples: [] as string[] },
      competitor: { count: 0, influence: 0, examples: [] as string[] }
    }
    
    for (const citation of allCitations) {
      const bucket = breakdown[citation.bucket]
      bucket.count++
      bucket.influence += citation.influence_score || 0
      if (bucket.examples.length < 3) {
        bucket.examples.push(citation.citation_url)
      }
    }
    
    // Calculate average influence scores
    Object.values(breakdown).forEach(bucket => {
      bucket.influence = bucket.count > 0 ? bucket.influence / bucket.count : 0
    })
    
    return {
      total_citations: allCitations.length,
      breakdown,
      high_influence_sources: allCitations
        .filter(c => (c.influence_score || 0) > 0.8)
        .sort((a, b) => (b.influence_score || 0) - (a.influence_score || 0))
        .slice(0, 5)
        .map(c => ({
          url: c.citation_url,
          domain: new URL(c.citation_url).hostname,
          title: c.citation_url,
          influence_score: c.influence_score || 0,
          bucket: c.bucket,
          context: c.reasoning || ''
        })),
      authority_distribution: [
        { authority_level: 'high', count: allCitations.filter(c => (c.influence_score || 0) > 0.8).length, percentage: 0 },
        { authority_level: 'medium', count: allCitations.filter(c => (c.influence_score || 0) > 0.5 && (c.influence_score || 0) <= 0.8).length, percentage: 0 },
        { authority_level: 'low', count: allCitations.filter(c => (c.influence_score || 0) <= 0.5).length, percentage: 0 }
      ].map(item => ({
        ...item,
        percentage: allCitations.length > 0 ? Math.round((item.count / allCitations.length) * 100) : 0
      }))
    }
  }

  private static transformRecommendations(
    maxData: MaxAssessmentResult,
    enhancedScoring?: ScoringBreakdown,
    liteData?: LegacyAEOData
  ): UnifiedVisibilityData['ai_recommendations'] {
    const recommendations: UnifiedVisibilityData['ai_recommendations'] = []
    
    // Add recommendations from enhanced scoring
    if (enhancedScoring?.recommendations) {
      for (const rec of enhancedScoring.recommendations) {
        recommendations.push({
          category: this.categorizeRecommendation(rec),
          title: rec.split(' - ')[0] || rec,
          description: rec,
          priority: 'medium',
          effort_level: 'medium',
          impact_potential: 'high',
          actionable_steps: [rec],
          success_metrics: ['Increase in mention rate', 'Improved sentiment score'],
          timeline: '2-4 weeks',
          data_source: 'max',
          supporting_data: {}
        })
      }
    }
    
    // Add data-driven recommendations
    if (maxData.visibility_scores.mention_rate < 0.3) {
      recommendations.push({
        category: 'content',
        title: 'Increase Content Visibility',
        description: 'Your brand mention rate is below 30%. Create more discussion-worthy content.',
        priority: 'high',
        effort_level: 'high',
        impact_potential: 'high',
        actionable_steps: [
          'Publish thought leadership articles',
          'Participate in industry discussions',
          'Create shareable research reports'
        ],
        success_metrics: ['Mention rate increase', 'Topic visibility improvement'],
        timeline: '4-8 weeks',
        data_source: 'max',
        supporting_data: {
          current_mention_rate: maxData.visibility_scores.mention_rate,
          target_mention_rate: 0.5
        }
      })
    }
    
    return recommendations
  }

  private static buildAssessmentInfo(
    maxData: MaxAssessmentResult,
    liteData?: LegacyAEOData
  ): UnifiedVisibilityData['assessment_info'] {
    const maxFreshness = this.calculateDataFreshness(maxData.completed_at)
    
    return {
      lite_analysis: liteData ? {
        completed_at: new Date().toISOString(), // Would be from actual lite data
        questions_analyzed: 10, // Would be from actual lite data
        data_freshness: 'recent'
      } : undefined,
      max_analysis: {
        completed_at: maxData.completed_at,
        questions_analyzed: maxData.visibility_scores.total_questions,
        processing_time_ms: maxData.processing_time_ms,
        confidence_score: 0.85, // Would be calculated
        data_freshness: maxFreshness
      },
      combined_confidence: this.calculateScoreConfidence(maxData, liteData),
      data_quality_score: this.calculateDataQuality(maxData),
      next_recommended_analysis: this.getNextRecommendedAnalysis(maxData, liteData)
    }
  }

  // Utility helper methods

  private static buildLegacyScoreHistory(maxData: MaxAssessmentResult): Array<{ date: string; score: number }> {
    return [
      {
        date: maxData.completed_at,
        score: maxData.visibility_scores.overall_score
      }
    ]
  }

  private static extractLegacyTopics(maxData: MaxAssessmentResult): LegacyAEOData['topicVisibility'] {
    // Extract topics from question types
    const topicMap = new Map<string, { mentions: number; sentiment: number }>()
    
    for (const analysis of maxData.question_analyses) {
      const topic = analysis.question_type.replace('_', ' ')
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { mentions: 0, sentiment: 0 })
      }
      
      const topicData = topicMap.get(topic)!
      if (this.getMentionDetected(analysis.mention_analysis)) {
        topicData.mentions++
        topicData.sentiment += this.sentimentToNumber(analysis.mention_analysis.mention_sentiment || 'neutral')
      }
    }
    
    return Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      visibility_score: data.mentions / maxData.visibility_scores.total_questions,
      trend: 'stable' as const,
      mentions: data.mentions,
      sentiment: data.mentions > 0 ? data.sentiment / data.mentions : 0
    }))
  }

  private static extractLegacyCompetitors(maxData: MaxAssessmentResult): LegacyAEOData['competitorBenchmarking'] {
    // This would be enhanced with actual competitive data
    return [
      {
        name: maxData.company.name,
        score: maxData.visibility_scores.overall_score,
        change: 0,
        rank: 1
      }
    ]
  }

  private static extractLegacyCitations(maxData: MaxAssessmentResult): LegacyAEOData['citations'] {
    return maxData.question_analyses
      .flatMap(a => a.citation_analysis || [])
      .filter(c => c.bucket !== 'competitor')
      .map(citation => ({
        url: citation.citation_url,
        domain: new URL(citation.citation_url).hostname,
        title: citation.citation_url,
        bucket: citation.bucket as 'owned' | 'operated' | 'earned',
        influence_score: citation.influence_score || 0
      }))
  }

  private static extractLegacySuggestions(maxData: MaxAssessmentResult): LegacyAEOData['suggestions'] {
    const suggestions: LegacyAEOData['suggestions'] = []
    
    if (maxData.visibility_scores.mention_rate < 0.5) {
      suggestions.push({
        category: 'content',
        title: 'Improve Brand Visibility',
        description: 'Increase content creation and thought leadership to improve mention rate',
        priority: 'high'
      })
    }
    
    return suggestions
  }

  private static extractTopicFromQuestion(question: string): string {
    // Simple topic extraction - in production would use NLP
    if (question.toLowerCase().includes('compare') || question.toLowerCase().includes('vs')) {
      return 'Competitive Comparison'
    }
    if (question.toLowerCase().includes('recommend') || question.toLowerCase().includes('best')) {
      return 'Recommendations'
    }
    if (question.toLowerCase().includes('price') || question.toLowerCase().includes('cost')) {
      return 'Pricing'
    }
    if (question.toLowerCase().includes('feature') || question.toLowerCase().includes('capability')) {
      return 'Product Features'
    }
    return 'General Discussion'
  }

  private static extractContext(question: string): string {
    if (question.toLowerCase().includes('enterprise')) return 'Enterprise'
    if (question.toLowerCase().includes('startup')) return 'Startup'
    if (question.toLowerCase().includes('small business')) return 'Small Business'
    return 'General'
  }

  private static calculateSentimentBreakdown(mentions: MaxQuestionAnalysis[]): UnifiedVisibilityData['topic_visibility'][0]['sentiment_breakdown'] {
    const breakdown = {
      very_positive: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      very_negative: 0
    }
    
    for (const mention of mentions) {
      const sentiment = mention.mention_analysis.mention_sentiment || 'neutral'
      breakdown[sentiment as keyof typeof breakdown]++
    }
    
    return breakdown
  }

  private static categorizeRecommendation(recommendation: string): UnifiedVisibilityData['ai_recommendations'][0]['category'] {
    const rec = recommendation.toLowerCase()
    if (rec.includes('content') || rec.includes('article')) return 'content'
    if (rec.includes('competitor') || rec.includes('positioning')) return 'competitive'
    if (rec.includes('technical') || rec.includes('seo')) return 'technical'
    if (rec.includes('pr') || rec.includes('media')) return 'pr'
    return 'positioning'
  }

  private static calculateDataFreshness(completedAt: string): 'fresh' | 'recent' | 'stale' {
    const now = new Date()
    const completed = new Date(completedAt)
    const hoursDiff = (now.getTime() - completed.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff < 24) return 'fresh'
    if (hoursDiff < 168) return 'recent' // 1 week
    return 'stale'
  }

  private static calculateDataQuality(maxData: MaxAssessmentResult): number {
    let quality = 0.7 // Base quality
    
    // Increase quality based on question count
    if (maxData.visibility_scores.total_questions >= 50) quality += 0.1
    if (maxData.visibility_scores.total_questions >= 100) quality += 0.1
    
    // Increase quality based on mention rate
    if (maxData.visibility_scores.mention_rate > 0.3) quality += 0.1
    
    return Math.min(quality, 1.0)
  }

  private static getNextRecommendedAnalysis(maxData: MaxAssessmentResult, liteData?: LegacyAEOData): string {
    const daysSinceAnalysis = Math.floor(
      (new Date().getTime() - new Date(maxData.completed_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceAnalysis > 30) return 'Run fresh MAX analysis'
    if (!liteData) return 'Consider running Lite analysis for comparison'
    return 'Review and implement current recommendations'
  }

  private static sentimentToNumber(sentiment: string): number {
    const sentimentMap = {
      'very_positive': 1,
      'positive': 0.5,
      'neutral': 0,
      'negative': -0.5,
      'very_negative': -1
    }
    return sentimentMap[sentiment as keyof typeof sentimentMap] || 0
  }

  private static getMentionDetected(mentionAnalysis: any): boolean {
    if (typeof mentionAnalysis === 'boolean') return mentionAnalysis
    if (typeof mentionAnalysis === 'object' && mentionAnalysis !== null) {
      return Boolean(mentionAnalysis.mention_detected)
    }
    return false
  }
} 