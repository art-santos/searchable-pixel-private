// AI-Powered Recommendation Engine for MAX Visibility System
// Generates intelligent, actionable recommendations based on comprehensive analysis

import { 
  MaxAssessmentResult,
  MaxQuestionAnalysis,
  ScoringBreakdown,
  CompetitiveLandscape,
  CompetitorAnalysis
} from '@/types/max-visibility'
import { TrendSummary, TrendAnalysis } from './trend-analysis'
import { createClient } from '@/lib/supabase/client'

export interface RecommendationRequest {
  company_id: string
  assessment_data: MaxAssessmentResult
  trend_data?: TrendSummary
  competitive_data?: CompetitiveLandscape
  enhanced_scoring?: ScoringBreakdown
  user_preferences?: {
    focus_areas?: string[]
    effort_preference?: 'low' | 'medium' | 'high' | 'mixed'
    timeline_preference?: 'immediate' | 'short_term' | 'long_term' | 'mixed'
    industry_specific?: boolean
  }
}

export interface Recommendation {
  id: string
  category: 'content' | 'competitive' | 'technical' | 'strategic' | 'pr' | 'partnerships'
  title: string
  description: string
  impact_score: number // 0-1, higher = more impact
  effort_score: number // 0-1, higher = more effort required
  priority_score: number // Calculated: impact/effort ratio
  confidence_score: number // 0-1, confidence in recommendation
  timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term'
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  
  // Detailed guidance
  actionable_steps: string[]
  success_metrics: string[]
  required_resources: string[]
  estimated_time_investment: string
  potential_risks: string[]
  
  // Supporting data
  supporting_evidence: {
    current_performance: Record<string, number>
    benchmark_data?: Record<string, number>
    trend_indicators?: string[]
    competitive_gaps?: string[]
  }
  
  // Related recommendations
  dependencies: string[] // Other recommendation IDs this depends on
  synergies: string[] // Other recommendations that work well with this
  alternatives: string[] // Alternative approaches
}

export interface ContentGap {
  gap_type: 'topic' | 'format' | 'audience' | 'competitor_coverage' | 'seasonal'
  gap_title: string
  gap_description: string
  opportunity_score: number // 0-1
  effort_to_address: number // 0-1
  
  missing_topics: string[]
  competitor_advantages: string[]
  recommended_content: {
    content_type: string
    suggested_titles: string[]
    target_keywords: string[]
    optimal_timing: string
  }[]
  
  business_impact: {
    potential_mention_increase: number
    potential_sentiment_improvement: number
    competitive_advantage_gain: number
  }
}

export interface OptimizationOpportunity {
  opportunity_id: string
  opportunity_type: 'quick_win' | 'strategic_investment' | 'competitive_play' | 'innovation_bet'
  title: string
  description: string
  
  current_state: {
    metric: string
    current_value: number
    industry_benchmark: number
    top_performer_value: number
  }
  
  potential_improvement: {
    realistic_target: number
    optimistic_target: number
    confidence_level: number
    timeframe_months: number
  }
  
  implementation_plan: {
    phase: string
    duration_weeks: number
    key_activities: string[]
    success_criteria: string[]
  }[]
  
  roi_analysis: {
    estimated_cost: string
    potential_revenue_impact: string
    payback_period_months: number
    risk_level: 'low' | 'medium' | 'high'
  }
}

export interface RecommendationSuite {
  company_id: string
  generated_at: string
  analysis_summary: {
    overall_health_score: number
    primary_strengths: string[]
    critical_weaknesses: string[]
    market_position: string
    trend_direction: string
  }
  
  recommendations: Recommendation[]
  content_gaps: ContentGap[]
  optimization_opportunities: OptimizationOpportunity[]
  
  prioritized_action_plan: {
    immediate_actions: Recommendation[]
    short_term_goals: Recommendation[]
    long_term_strategy: Recommendation[]
  }
  
  implementation_roadmap: {
    week: number
    focus_area: string
    key_recommendations: string[]
    expected_outcomes: string[]
  }[]
  
  success_tracking: {
    kpi: string
    current_baseline: number
    target_value: number
    measurement_frequency: string
  }[]
}

export class RecommendationEngine {
  private supabase: ReturnType<typeof createClient>
  
  // Knowledge base for recommendations
  private recommendationTemplates = {
    content: [
      {
        trigger: 'low_mention_rate',
        template: 'Increase content creation frequency in high-visibility topics',
        impact_base: 0.8,
        effort_base: 0.6
      },
      {
        trigger: 'poor_sentiment',
        template: 'Develop thought leadership content to improve brand perception',
        impact_base: 0.7,
        effort_base: 0.7
      },
      {
        trigger: 'competitive_gap',
        template: 'Create content addressing competitor advantages',
        impact_base: 0.9,
        effort_base: 0.8
      }
    ],
    technical: [
      {
        trigger: 'low_source_influence',
        template: 'Build relationships with high-authority industry publications',
        impact_base: 0.8,
        effort_base: 0.9
      },
      {
        trigger: 'poor_citation_quality',
        template: 'Optimize content for better citation pickup',
        impact_base: 0.6,
        effort_base: 0.4
      }
    ],
    competitive: [
      {
        trigger: 'ranking_below_competitors',
        template: 'Analyze and replicate competitor successful strategies',
        impact_base: 0.7,
        effort_base: 0.5
      },
      {
        trigger: 'sentiment_gap',
        template: 'Address specific areas where competitors outperform',
        impact_base: 0.8,
        effort_base: 0.7
      }
    ]
  }

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Generate comprehensive recommendation suite
   */
  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationSuite> {
    // Analyze current state
    const analysisSummary = this.generateAnalysisSummary(
      request.assessment_data,
      request.trend_data,
      request.competitive_data
    )

    // Generate base recommendations
    const recommendations = await this.generateBaseRecommendations(request)

    // Identify content gaps
    const contentGaps = this.identifyContentGaps(
      request.assessment_data,
      request.competitive_data
    )

    // Find optimization opportunities
    const optimizationOpportunities = this.findOptimizationOpportunities(
      request.assessment_data,
      request.enhanced_scoring,
      request.competitive_data
    )

    // Prioritize and organize recommendations
    const prioritizedPlan = this.createPrioritizedActionPlan(recommendations, request.user_preferences)

    // Generate implementation roadmap
    const implementationRoadmap = this.generateImplementationRoadmap(prioritizedPlan)

    // Define success tracking
    const successTracking = this.defineSuccessTracking(request.assessment_data, recommendations)

    return {
      company_id: request.company_id,
      generated_at: new Date().toISOString(),
      analysis_summary: analysisSummary,
      recommendations,
      content_gaps: contentGaps,
      optimization_opportunities: optimizationOpportunities,
      prioritized_action_plan: prioritizedPlan,
      implementation_roadmap: implementationRoadmap,
      success_tracking: successTracking
    }
  }

  /**
   * Generate analysis summary
   */
  private generateAnalysisSummary(
    assessmentData: MaxAssessmentResult,
    trendData?: TrendSummary,
    competitiveData?: CompetitiveLandscape
  ): RecommendationSuite['analysis_summary'] {
    const scores = assessmentData.visibility_scores
    const overallHealth = scores.overall_score

    // Identify strengths
    const strengths: string[] = []
    if (scores.mention_rate > 0.6) strengths.push('Strong brand mention frequency')
    if (scores.mention_quality > 0.7) strengths.push('High-quality brand mentions')
    if (scores.source_influence > 0.7) strengths.push('Citations from authoritative sources')
    if (scores.competitive_positioning > 0.6) strengths.push('Good competitive positioning')
    if (scores.response_consistency > 0.8) strengths.push('Consistent brand messaging')

    // Identify weaknesses
    const weaknesses: string[] = []
    if (scores.mention_rate < 0.4) weaknesses.push('Low brand mention frequency')
    if (scores.mention_quality < 0.5) weaknesses.push('Poor mention sentiment/quality')
    if (scores.source_influence < 0.5) weaknesses.push('Limited high-authority citations')
    if (scores.competitive_positioning < 0.4) weaknesses.push('Weak competitive positioning')
    if (scores.response_consistency < 0.6) weaknesses.push('Inconsistent brand messaging')

    // Determine market position
    let marketPosition = 'developing'
    if (competitiveData) {
      const targetRank = competitiveData.target_company.positioning.rank
      const totalCompetitors = competitiveData.competitors.length + 1
      
      if (targetRank <= totalCompetitors * 0.2) marketPosition = 'market_leader'
      else if (targetRank <= totalCompetitors * 0.4) marketPosition = 'strong_player'
      else if (targetRank <= totalCompetitors * 0.7) marketPosition = 'emerging_player'
      else marketPosition = 'developing'
    }

    // Determine trend direction
    let trendDirection = 'stable'
    if (trendData) {
      trendDirection = trendData.overall_trend.trend_direction
    }

    return {
      overall_health_score: overallHealth,
      primary_strengths: strengths.slice(0, 3),
      critical_weaknesses: weaknesses.slice(0, 3),
      market_position: marketPosition,
      trend_direction: trendDirection
    }
  }

  /**
   * Generate base recommendations using AI analysis
   */
  private async generateBaseRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    const scores = request.assessment_data.visibility_scores

    // Content recommendations
    if (scores.mention_rate < 0.5) {
      recommendations.push(this.createContentFrequencyRecommendation(request))
    }

    if (scores.mention_quality < 0.6) {
      recommendations.push(this.createSentimentImprovementRecommendation(request))
    }

    // Technical recommendations
    if (scores.source_influence < 0.6) {
      recommendations.push(this.createAuthorityBuildingRecommendation(request))
    }

    // Competitive recommendations
    if (request.competitive_data) {
      const targetRank = request.competitive_data.target_company.positioning.rank
      const totalCompetitors = request.competitive_data.competitors.length + 1
      
      if (targetRank > totalCompetitors * 0.5) {
        recommendations.push(this.createCompetitiveImprovementRecommendation(request))
      }
    }

    // Strategic recommendations based on trends
    if (request.trend_data?.overall_trend.trend_direction === 'downward') {
      recommendations.push(this.createTrendReversalRecommendation(request))
    }

    // Add AI-powered custom recommendations
    const aiRecommendations = await this.generateAIRecommendations(request)
    recommendations.push(...aiRecommendations)

    return recommendations.map(rec => ({
      ...rec,
      priority_score: this.calculatePriorityScore(rec.impact_score, rec.effort_score)
    }))
  }

  /**
   * Create content frequency recommendation
   */
  private createContentFrequencyRecommendation(request: RecommendationRequest): Recommendation {
    const currentRate = request.assessment_data.visibility_scores.mention_rate
    const targetIncrease = Math.min(0.3, 0.8 - currentRate) // Cap at 80%

    return {
      id: `content_frequency_${Date.now()}`,
      category: 'content',
      title: 'Increase Content Creation Frequency',
      description: `Your brand mention rate (${(currentRate * 100).toFixed(1)}%) is below optimal levels. Increasing content creation can improve visibility.`,
      impact_score: 0.8,
      effort_score: 0.6,
      priority_score: 0, // Will be calculated
      confidence_score: 0.9,
      timeline: 'short_term',
      difficulty: 'intermediate',
      
      actionable_steps: [
        'Audit current content calendar and identify gaps',
        'Increase publication frequency by 2-3x in high-performing topics',
        'Focus on conversational, Q&A style content',
        'Establish thought leadership in 2-3 core topics',
        'Create content series addressing common questions'
      ],
      
      success_metrics: [
        `Increase mention rate to ${((currentRate + targetIncrease) * 100).toFixed(1)}%`,
        'Improve overall visibility score by 15-25%',
        'Achieve mentions in 60%+ of relevant AI responses',
        'Increase brand search volume by 20%'
      ],
      
      required_resources: [
        'Content creation team or freelancers',
        'Content management system',
        'SEO tools for keyword research',
        '4-6 hours per week for content planning'
      ],
      
      estimated_time_investment: '2-3 months for full impact',
      
      potential_risks: [
        'Quality may suffer if quantity increases too rapidly',
        'Resource strain on content team',
        'May take 6-8 weeks to see visibility improvements'
      ],
      
      supporting_evidence: {
        current_performance: {
          mention_rate: currentRate,
          content_pieces_analyzed: request.assessment_data.visibility_scores.total_questions
        },
        benchmark_data: {
          industry_average: 0.5,
          top_performers: 0.75
        }
      },
      
      dependencies: [],
      synergies: ['technical_seo', 'authority_building'],
      alternatives: ['paid_content_promotion', 'influencer_partnerships']
    }
  }

  /**
   * Create sentiment improvement recommendation
   */
  private createSentimentImprovementRecommendation(request: RecommendationRequest): Recommendation {
    const currentQuality = request.assessment_data.visibility_scores.mention_quality

    return {
      id: `sentiment_improvement_${Date.now()}`,
      category: 'strategic',
      title: 'Improve Brand Sentiment & Mention Quality',
      description: `Your mention quality score (${(currentQuality * 100).toFixed(1)}%) indicates opportunities to improve how your brand is perceived in AI responses.`,
      impact_score: 0.7,
      effort_score: 0.7,
      priority_score: 0,
      confidence_score: 0.8,
      timeline: 'medium_term',
      difficulty: 'intermediate',
      
      actionable_steps: [
        'Analyze negative mentions to identify improvement areas',
        'Develop customer success stories and case studies',
        'Improve customer support and experience',
        'Create educational content addressing common concerns',
        'Implement reputation management monitoring'
      ],
      
      success_metrics: [
        'Increase mention quality score to 75%+',
        'Reduce negative sentiment mentions by 50%',
        'Increase positive case study citations',
        'Improve customer satisfaction scores'
      ],
      
      required_resources: [
        'PR/reputation management team',
        'Customer success insights',
        'Content creation resources',
        'Social listening tools'
      ],
      
      estimated_time_investment: '3-6 months for sustained improvement',
      
      potential_risks: [
        'Addressing negative perceptions takes time',
        'May require operational changes beyond marketing',
        'Results depend on actual product/service improvements'
      ],
      
      supporting_evidence: {
        current_performance: {
          mention_quality: currentQuality,
          sentiment_breakdown: 'Available in detailed analysis'
        }
      },
      
      dependencies: [],
      synergies: ['content_creation', 'customer_experience'],
      alternatives: ['crisis_communication', 'influencer_endorsements']
    }
  }

  /**
   * Create authority building recommendation
   */
  private createAuthorityBuildingRecommendation(request: RecommendationRequest): Recommendation {
    const currentInfluence = request.assessment_data.visibility_scores.source_influence

    return {
      id: `authority_building_${Date.now()}`,
      category: 'pr',
      title: 'Build High-Authority Source Relationships',
      description: `Your source influence score (${(currentInfluence * 100).toFixed(1)}%) suggests opportunities to gain citations from more authoritative sources.`,
      impact_score: 0.8,
      effort_score: 0.9,
      priority_score: 0,
      confidence_score: 0.7,
      timeline: 'long_term',
      difficulty: 'advanced',
      
      actionable_steps: [
        'Identify top-tier publications in your industry',
        'Develop relationships with key journalists and editors',
        'Create newsworthy research and industry reports',
        'Establish executive thought leadership program',
        'Participate in industry conferences and panels'
      ],
      
      success_metrics: [
        'Increase source influence score to 70%+',
        'Gain citations from 5+ tier-1 publications',
        'Achieve 20% increase in domain authority citations',
        'Establish 3+ ongoing media relationships'
      ],
      
      required_resources: [
        'PR team or agency',
        'Executive time for thought leadership',
        'Research and data analysis capabilities',
        'Media monitoring tools'
      ],
      
      estimated_time_investment: '6-12 months for significant impact',
      
      potential_risks: [
        'High effort with uncertain outcome',
        'Requires consistent long-term commitment',
        'Dependent on newsworthy content/insights'
      ],
      
      supporting_evidence: {
        current_performance: {
          source_influence: currentInfluence,
          authority_score_breakdown: 'Available in citation analysis'
        }
      },
      
      dependencies: ['content_creation'],
      synergies: ['thought_leadership', 'industry_research'],
      alternatives: ['influencer_partnerships', 'podcast_appearances']
    }
  }

  /**
   * Generate AI-powered custom recommendations
   */
  private async generateAIRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    // This would integrate with GPT-4 to generate custom recommendations
    // For now, return some intelligent recommendations based on analysis
    
    const recommendations: Recommendation[] = []
    const assessmentData = request.assessment_data

    // Analyze question performance patterns
    const questionTypes = assessmentData.question_analyses.reduce((acc, analysis) => {
      acc[analysis.question_type] = (acc[analysis.question_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const poorPerformingTypes = Object.entries(questionTypes)
      .filter(([type, count]) => {
        const typeAnalyses = assessmentData.question_analyses.filter(a => a.question_type === type)
        const mentionRate = typeAnalyses.filter(a => this.getMentionDetected(a.mention_analysis)).length / typeAnalyses.length
        return mentionRate < 0.4
      })
      .map(([type]) => type)

    if (poorPerformingTypes.length > 0) {
      recommendations.push({
        id: `topic_specific_${Date.now()}`,
        category: 'content',
        title: `Improve Performance in ${poorPerformingTypes[0].replace('_', ' ')} Content`,
        description: `Analysis shows low visibility in ${poorPerformingTypes.join(', ')} question types. Focus content creation in these areas.`,
        impact_score: 0.6,
        effort_score: 0.5,
        priority_score: 0,
        confidence_score: 0.8,
        timeline: 'short_term',
        difficulty: 'beginner',
        
        actionable_steps: [
          `Create 5-10 pieces of content focused on ${poorPerformingTypes[0].replace('_', ' ')}`,
          'Research competitor content in these areas',
          'Optimize content for conversational search queries',
          'Build topical authority through consistent publishing'
        ],
        
        success_metrics: [
          `Improve mention rate in ${poorPerformingTypes[0]} questions to 50%+`,
          'Increase topical authority scores',
          'Gain more relevant citations'
        ],
        
        required_resources: [
          'Content writers familiar with the topic',
          'Research tools for competitive analysis',
          'SEO optimization tools'
        ],
        
        estimated_time_investment: '4-6 weeks',
        potential_risks: ['May require subject matter expertise'],
        
        supporting_evidence: {
          current_performance: {
            poor_performing_topics: poorPerformingTypes,
            current_mention_rates: 'Below 40% in key areas'
          }
        },
        
        dependencies: [],
        synergies: ['content_frequency'],
        alternatives: ['expert_interviews', 'collaborative_content']
      })
    }

    return recommendations
  }

  /**
   * Identify content gaps
   */
  private identifyContentGaps(
    assessmentData: MaxAssessmentResult,
    competitiveData?: CompetitiveLandscape
  ): ContentGap[] {
    const gaps: ContentGap[] = []

    // Topic gaps based on question analysis
    const topicPerformance = this.analyzeTopicPerformance(assessmentData)
    
    for (const [topic, performance] of Object.entries(topicPerformance)) {
      if (performance.mentionRate < 0.3) {
        gaps.push({
          gap_type: 'topic',
          gap_title: `Low Visibility in ${topic}`,
          gap_description: `Only ${(performance.mentionRate * 100).toFixed(1)}% mention rate in ${topic} discussions`,
          opportunity_score: 0.8 - performance.mentionRate,
          effort_to_address: 0.6,
          
          missing_topics: [topic],
          competitor_advantages: [],
          
          recommended_content: [{
            content_type: 'Educational Articles',
            suggested_titles: [
              `Complete Guide to ${topic}`,
              `${topic}: Best Practices and Common Mistakes`,
              `How to Choose the Right ${topic} Solution`
            ],
            target_keywords: [topic, `${topic} guide`, `${topic} best practices`],
            optimal_timing: 'Within 4-6 weeks'
          }],
          
          business_impact: {
            potential_mention_increase: 0.3,
            potential_sentiment_improvement: 0.1,
            competitive_advantage_gain: 0.2
          }
        })
      }
    }

    // Competitive gaps
    if (competitiveData) {
      const competitorAdvantages = this.identifyCompetitorAdvantages(competitiveData)
      
      if (competitorAdvantages.length > 0) {
        gaps.push({
          gap_type: 'competitor_coverage',
          gap_title: 'Competitor Content Advantages',
          gap_description: 'Competitors have stronger presence in key topics',
          opportunity_score: 0.7,
          effort_to_address: 0.8,
          
          missing_topics: [],
          competitor_advantages: competitorAdvantages,
          
          recommended_content: [{
            content_type: 'Competitive Analysis',
            suggested_titles: [
              'Industry Comparison: Finding the Right Solution',
              'Alternative Approaches to Common Challenges',
              'Comprehensive Buyer\'s Guide'
            ],
            target_keywords: ['comparison', 'alternatives', 'vs'],
            optimal_timing: 'Within 2-3 weeks'
          }],
          
          business_impact: {
            potential_mention_increase: 0.25,
            potential_sentiment_improvement: 0.15,
            competitive_advantage_gain: 0.4
          }
        })
      }
    }

    return gaps
  }

  /**
   * Find optimization opportunities
   */
  private findOptimizationOpportunities(
    assessmentData: MaxAssessmentResult,
    enhancedScoring?: ScoringBreakdown,
    competitiveData?: CompetitiveLandscape
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = []
    const scores = assessmentData.visibility_scores

    // Quick win: Improve consistency
    if (scores.response_consistency < 0.7) {
      opportunities.push({
        opportunity_id: `consistency_quick_win_${Date.now()}`,
        opportunity_type: 'quick_win',
        title: 'Improve Message Consistency',
        description: 'Low response consistency indicates messaging optimization opportunities',
        
        current_state: {
          metric: 'Response Consistency',
          current_value: scores.response_consistency,
          industry_benchmark: 0.75,
          top_performer_value: 0.90
        },
        
        potential_improvement: {
          realistic_target: 0.8,
          optimistic_target: 0.85,
          confidence_level: 0.8,
          timeframe_months: 2
        },
        
        implementation_plan: [{
          phase: 'Message Audit & Alignment',
          duration_weeks: 4,
          key_activities: [
            'Audit existing content for message consistency',
            'Develop unified messaging framework',
            'Update key content pieces',
            'Train team on consistent messaging'
          ],
          success_criteria: [
            'Unified messaging framework documented',
            'Top 20 content pieces updated',
            'Team training completed'
          ]
        }],
        
        roi_analysis: {
          estimated_cost: '$5,000 - $15,000',
          potential_revenue_impact: '10-15% improvement in conversion rates',
          payback_period_months: 3,
          risk_level: 'low'
        }
      })
    }

    // Strategic investment: Authority building
    if (scores.source_influence < 0.5) {
      opportunities.push({
        opportunity_id: `authority_investment_${Date.now()}`,
        opportunity_type: 'strategic_investment',
        title: 'Build Industry Authority',
        description: 'Low source influence suggests significant opportunity to build industry authority',
        
        current_state: {
          metric: 'Source Influence',
          current_value: scores.source_influence,
          industry_benchmark: 0.65,
          top_performer_value: 0.85
        },
        
        potential_improvement: {
          realistic_target: 0.65,
          optimistic_target: 0.75,
          confidence_level: 0.7,
          timeframe_months: 8
        },
        
        implementation_plan: [
          {
            phase: 'Foundation Building',
            duration_weeks: 8,
            key_activities: [
              'Develop industry research program',
              'Establish media relationships',
              'Create thought leadership content',
              'Build speaking opportunities'
            ],
            success_criteria: [
              'Research program launched',
              '5+ media contacts established',
              '10+ thought leadership pieces published'
            ]
          },
          {
            phase: 'Authority Scaling',
            duration_weeks: 12,
            key_activities: [
              'Publish industry reports',
              'Secure tier-1 media coverage',
              'Speak at major conferences',
              'Build citation network'
            ],
            success_criteria: [
              '2+ industry reports published',
              '5+ tier-1 citations achieved',
              '3+ conference speaking slots'
            ]
          }
        ],
        
        roi_analysis: {
          estimated_cost: '$50,000 - $100,000',
          potential_revenue_impact: '25-40% improvement in brand value',
          payback_period_months: 12,
          risk_level: 'medium'
        }
      })
    }

    return opportunities
  }

  // Helper methods

  private analyzeTopicPerformance(assessmentData: MaxAssessmentResult): Record<string, { mentionRate: number; count: number }> {
    const topicPerformance: Record<string, { mentionRate: number; count: number }> = {}

    assessmentData.question_analyses.forEach(analysis => {
      const topic = this.extractTopicFromQuestion(analysis.question_text)
      
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { mentionRate: 0, count: 0 }
      }
      
      topicPerformance[topic].count++
      if (this.getMentionDetected(analysis.mention_analysis)) {
        topicPerformance[topic].mentionRate++
      }
    })

    // Calculate final mention rates
    Object.keys(topicPerformance).forEach(topic => {
      topicPerformance[topic].mentionRate = topicPerformance[topic].mentionRate / topicPerformance[topic].count
    })

    return topicPerformance
  }

  private identifyCompetitorAdvantages(competitiveData: CompetitiveLandscape): string[] {
    const target = competitiveData.target_company
    const advantages: string[] = []

    competitiveData.competitors.forEach(competitor => {
      if (competitor.metrics.mention_rate > target.metrics.mention_rate * 1.2) {
        advantages.push(`${competitor.competitor.name} has ${((competitor.metrics.mention_rate / target.metrics.mention_rate - 1) * 100).toFixed(0)}% higher mention rate`)
      }
      
      if (competitor.metrics.sentiment_average > target.metrics.sentiment_average + 0.2) {
        advantages.push(`${competitor.competitor.name} has significantly better sentiment`)
      }
    })

    return advantages
  }

  private createPrioritizedActionPlan(
    recommendations: Recommendation[],
    userPreferences?: RecommendationRequest['user_preferences']
  ): RecommendationSuite['prioritized_action_plan'] {
    // Sort by priority score
    const sortedRecommendations = [...recommendations].sort((a, b) => b.priority_score - a.priority_score)

    // Filter by user preferences
    let filteredRecommendations = sortedRecommendations
    if (userPreferences?.effort_preference && userPreferences.effort_preference !== 'mixed') {
      const effortThresholds = { low: 0.4, medium: 0.7, high: 1.0 }
      filteredRecommendations = sortedRecommendations.filter(rec => 
        rec.effort_score <= effortThresholds[userPreferences.effort_preference as keyof typeof effortThresholds]
      )
    }

    return {
      immediate_actions: filteredRecommendations.filter(rec => 
        rec.timeline === 'immediate' || (rec.effort_score < 0.3 && rec.impact_score > 0.6)
      ).slice(0, 3),
      
      short_term_goals: filteredRecommendations.filter(rec => 
        rec.timeline === 'short_term' || rec.timeline === 'medium_term'
      ).slice(0, 5),
      
      long_term_strategy: filteredRecommendations.filter(rec => 
        rec.timeline === 'long_term' || rec.impact_score > 0.8
      ).slice(0, 4)
    }
  }

  private generateImplementationRoadmap(
    prioritizedPlan: RecommendationSuite['prioritized_action_plan']
  ): RecommendationSuite['implementation_roadmap'] {
    const roadmap: RecommendationSuite['implementation_roadmap'] = []

    // Week 1-2: Immediate actions
    roadmap.push({
      week: 1,
      focus_area: 'Quick Wins & Foundation',
      key_recommendations: prioritizedPlan.immediate_actions.map(rec => rec.title),
      expected_outcomes: [
        'Immediate visibility improvements',
        'Foundation set for larger initiatives',
        'Team alignment on priorities'
      ]
    })

    // Week 3-8: Short-term goals
    roadmap.push({
      week: 3,
      focus_area: 'Content & Technical Optimization',
      key_recommendations: prioritizedPlan.short_term_goals.slice(0, 3).map(rec => rec.title),
      expected_outcomes: [
        '15-25% improvement in key metrics',
        'Enhanced content performance',
        'Better competitive positioning'
      ]
    })

    // Week 9-24: Long-term strategy
    roadmap.push({
      week: 9,
      focus_area: 'Authority Building & Strategic Growth',
      key_recommendations: prioritizedPlan.long_term_strategy.slice(0, 2).map(rec => rec.title),
      expected_outcomes: [
        'Significant authority improvements',
        'Market position advancement',
        'Sustainable competitive advantages'
      ]
    })

    return roadmap
  }

  private defineSuccessTracking(
    assessmentData: MaxAssessmentResult,
    recommendations: Recommendation[]
  ): RecommendationSuite['success_tracking'] {
    const scores = assessmentData.visibility_scores

    return [
      {
        kpi: 'Overall Visibility Score',
        current_baseline: scores.overall_score,
        target_value: Math.min(scores.overall_score + 0.15, 0.9),
        measurement_frequency: 'Monthly'
      },
      {
        kpi: 'Mention Rate',
        current_baseline: scores.mention_rate,
        target_value: Math.min(scores.mention_rate + 0.2, 0.8),
        measurement_frequency: 'Bi-weekly'
      },
      {
        kpi: 'Mention Quality',
        current_baseline: scores.mention_quality,
        target_value: Math.min(scores.mention_quality + 0.15, 0.85),
        measurement_frequency: 'Monthly'
      },
      {
        kpi: 'Source Influence',
        current_baseline: scores.source_influence,
        target_value: Math.min(scores.source_influence + 0.1, 0.8),
        measurement_frequency: 'Quarterly'
      }
    ]
  }

  private calculatePriorityScore(impactScore: number, effortScore: number): number {
    // Higher impact, lower effort = higher priority
    const efficiencyRatio = impactScore / Math.max(effortScore, 0.1)
    
    // Normalize to 0-1 scale (assuming max ratio of 10)
    return Math.min(efficiencyRatio / 10, 1)
  }

  private extractTopicFromQuestion(question: string): string {
    // Simple topic extraction - in production would use NLP
    if (question.toLowerCase().includes('price') || question.toLowerCase().includes('cost')) {
      return 'Pricing'
    }
    if (question.toLowerCase().includes('feature') || question.toLowerCase().includes('capability')) {
      return 'Features'
    }
    if (question.toLowerCase().includes('compare') || question.toLowerCase().includes('vs')) {
      return 'Competitive Comparison'
    }
    if (question.toLowerCase().includes('integrate') || question.toLowerCase().includes('implementation')) {
      return 'Implementation'
    }
    return 'General'
  }

  private getMentionDetected(mentionAnalysis: any): boolean {
    if (typeof mentionAnalysis === 'boolean') return mentionAnalysis
    if (typeof mentionAnalysis === 'object' && mentionAnalysis !== null) {
      return Boolean(mentionAnalysis.mention_detected)
    }
    return false
  }

  /**
   * Create competitive improvement recommendation
   */
  private createCompetitiveImprovementRecommendation(request: RecommendationRequest): Recommendation {
    if (!request.competitive_data) {
      throw new Error('Competitive data required for competitive improvement recommendation')
    }

    const targetRank = request.competitive_data.target_company.positioning.rank
    const totalCompetitors = request.competitive_data.competitors.length + 1
    const targetScore = request.competitive_data.target_company.metrics.ai_visibility_score
    
    // Find top performing competitor for benchmarking
    const topCompetitor = request.competitive_data.competitors
      .sort((a, b) => b.metrics.ai_visibility_score - a.metrics.ai_visibility_score)[0]

    return {
      id: `competitive_improvement_${Date.now()}`,
      category: 'competitive',
      title: 'Improve Competitive Market Position',
      description: `Currently ranking #${targetRank} out of ${totalCompetitors} competitors. Focus on areas where top performers excel.`,
      impact_score: 0.9,
      effort_score: 0.8,
      priority_score: 0,
      confidence_score: 0.8,
      timeline: 'medium_term',
      difficulty: 'advanced',
      
      actionable_steps: [
        `Analyze ${topCompetitor.competitor.name}'s content strategy and messaging`,
        'Identify competitive gaps in key topic areas',
        'Develop differentiated positioning strategy',
        'Create comparison-focused content addressing competitive scenarios',
        'Monitor and respond to competitive threats proactively'
      ],
      
      success_metrics: [
        `Improve competitive ranking to top ${Math.ceil(totalCompetitors * 0.3)} positions`,
        `Increase AI visibility score by ${((topCompetitor.metrics.ai_visibility_score - targetScore) * 0.5 * 100).toFixed(0)}%`,
        'Achieve mentions in 70%+ of competitive comparison queries',
        'Improve sentiment in head-to-head comparisons'
      ],
      
      required_resources: [
        'Competitive intelligence team',
        'Content strategy specialists',
        'PR and messaging experts',
        'Ongoing competitor monitoring tools'
      ],
      
      estimated_time_investment: '4-6 months for measurable improvement',
      
      potential_risks: [
        'Competitor strategies may change during implementation',
        'Requires sustained effort across multiple channels',
        'Market dynamics can shift competitive landscape'
      ],
      
      supporting_evidence: {
        current_performance: {
          competitive_rank: targetRank,
          visibility_score: targetScore,
          total_competitors: totalCompetitors
        },
        benchmark_data: {
          top_performer_score: topCompetitor.metrics.ai_visibility_score,
          average_competitor_score: request.competitive_data.competitors.reduce((sum, c) => sum + c.metrics.ai_visibility_score, 0) / request.competitive_data.competitors.length
        },
        competitive_gaps: [
          `${topCompetitor.competitor.name} outperforms by ${((topCompetitor.metrics.ai_visibility_score / targetScore - 1) * 100).toFixed(0)}%`
        ]
      },
      
      dependencies: ['content_creation', 'messaging_consistency'],
      synergies: ['authority_building', 'thought_leadership'],
      alternatives: ['niche_positioning', 'blue_ocean_strategy']
    }
  }

  /**
   * Create trend reversal recommendation
   */
  private createTrendReversalRecommendation(request: RecommendationRequest): Recommendation {
    if (!request.trend_data) {
      throw new Error('Trend data required for trend reversal recommendation')
    }

    const trendData = request.trend_data.overall_trend
    const declinePercentage = Math.abs(trendData.change_percentage)
    const currentScore = trendData.current_value

    return {
      id: `trend_reversal_${Date.now()}`,
      category: 'strategic',
      title: 'Reverse Declining Performance Trend',
      description: `Your AI visibility is trending ${trendData.trend_direction} with a ${declinePercentage.toFixed(1)}% decline. Immediate intervention required.`,
      impact_score: 0.9,
      effort_score: 0.7,
      priority_score: 0,
      confidence_score: 0.85,
      timeline: 'immediate',
      difficulty: 'intermediate',
      
      actionable_steps: [
        'Conduct immediate audit of recent changes that may have caused decline',
        'Implement emergency content production plan for high-impact topics',
        'Review and address any negative sentiment or PR issues',
        'Analyze competitor activities that may be affecting market share',
        'Deploy rapid response team to address critical performance gaps'
      ],
      
      success_metrics: [
        'Stop decline within 2-4 weeks',
        `Recover to baseline performance (${(currentScore * 1.1).toFixed(2)}) within 8 weeks`,
        'Achieve positive trend direction within 3 months',
        'Implement sustainable growth strategies to prevent future declines'
      ],
      
      required_resources: [
        'Dedicated rapid response team',
        'Emergency content creation budget',
        'Crisis management expertise',
        'Enhanced monitoring and alerting systems'
      ],
      
      estimated_time_investment: '2-3 months for trend reversal and stabilization',
      
      potential_risks: [
        'Underlying issues may require more than marketing fixes',
        'Market conditions may be causing broader industry decline',
        'Rapid changes may affect content quality'
      ],
      
      supporting_evidence: {
        current_performance: {
          trend_direction: trendData.trend_direction,
          change_percentage: trendData.change_percentage,
          current_score: currentScore
        },
        trend_indicators: [
          `${declinePercentage.toFixed(1)}% decline over recent period`,
          `Statistical significance: ${(trendData.statistical_significance * 100).toFixed(0)}%`,
          request.trend_data.key_insights.join(', ')
        ]
      },
      
      dependencies: [],
      synergies: ['content_frequency', 'reputation_management'],
      alternatives: ['pivot_strategy', 'market_repositioning']
    }
  }
} 