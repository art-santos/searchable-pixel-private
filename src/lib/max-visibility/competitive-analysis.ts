// Competitive Analysis Engine for MAX Visibility System
// Automated competitor detection and performance analysis

import { 
  MaxQuestionAnalysis,
  MaxAssessmentRequest,
  MentionAnalysisResult,
  CitationClassificationResult
} from '@/types/max-visibility'
import { ConversationalQuestionGenerator } from './question-generator'
import { PerplexityClient } from '../perplexity/client'
import { CitationAnalyzer } from '../perplexity/citation-analyzer'
import { createClient } from '@/lib/supabase/client'

export interface CompetitorProfile {
  name: string
  domain: string
  confidence: number // 0-1 confidence this is actually a competitor
  detected_from: 'mention' | 'citation' | 'manual' | 'industry_db'
  aliases?: string[]
  industry?: string
}

export interface CompetitorAnalysis {
  competitor: CompetitorProfile
  metrics: {
    mention_rate: number           // 0-1
    mention_quality: number        // 0-1  
    source_influence: number       // 0-1
    sentiment_average: number      // -1 to 1
    citation_count: number
    owned_citations: number
    operated_citations: number
    earned_citations: number
    ai_visibility_score: number    // 0-1 overall score
  }
  positioning: {
    rank: number                   // 1-based ranking
    share_of_voice: number         // 0-1 portion of total mentions
    competitive_advantage: string[] // Areas where they outperform
    competitive_weakness: string[]  // Areas where they underperform
  }
  sample_responses: {
    question: string
    ai_response: string
    mention_detected: boolean
    mention_position: string
    mention_sentiment: string
  }[]
}

export interface CompetitiveInsight {
  category: 'positioning' | 'messaging' | 'opportunity' | 'threat'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actionable_steps: string[]
  data_points: Record<string, any>
}

export interface CompetitiveLandscape {
  target_company: CompetitorAnalysis
  competitors: CompetitorAnalysis[]
  market_insights: {
    total_market_mentions: number
    market_leaders: string[]
    emerging_players: string[]
    market_sentiment: number
    key_themes: string[]
  }
  competitive_insights: CompetitiveInsight[]
  benchmarking: {
    industry_average: number
    target_percentile: number
    gaps_and_opportunities: string[]
  }
}

export class CompetitiveAnalyzer {
  private questionGenerator: ConversationalQuestionGenerator
  private perplexityClient: PerplexityClient
  private citationAnalyzer: CitationAnalyzer
  private supabase: ReturnType<typeof createClient>

  // Known competitor databases (in production, this would be a more comprehensive service)
  private industryCompetitors: Record<string, CompetitorProfile[]> = {
    'technology': [
      { name: 'Microsoft', domain: 'microsoft.com', confidence: 0.9, detected_from: 'industry_db', industry: 'technology' },
      { name: 'Google', domain: 'google.com', confidence: 0.9, detected_from: 'industry_db', industry: 'technology' },
      { name: 'Amazon', domain: 'amazon.com', confidence: 0.9, detected_from: 'industry_db', industry: 'technology' },
      { name: 'Apple', domain: 'apple.com', confidence: 0.9, detected_from: 'industry_db', industry: 'technology' },
      { name: 'Meta', domain: 'meta.com', confidence: 0.9, detected_from: 'industry_db', industry: 'technology' },
      { name: 'Salesforce', domain: 'salesforce.com', confidence: 0.9, detected_from: 'industry_db', industry: 'technology' },
      { name: 'HubSpot', domain: 'hubspot.com', confidence: 0.9, detected_from: 'industry_db', industry: 'technology' },
      { name: 'Slack', domain: 'slack.com', confidence: 0.9, detected_from: 'industry_db', industry: 'technology' }
    ],
    'finance': [
      { name: 'JPMorgan Chase', domain: 'jpmorganchase.com', confidence: 0.9, detected_from: 'industry_db', industry: 'finance' },
      { name: 'Goldman Sachs', domain: 'goldmansachs.com', confidence: 0.9, detected_from: 'industry_db', industry: 'finance' },
      { name: 'Bank of America', domain: 'bankofamerica.com', confidence: 0.9, detected_from: 'industry_db', industry: 'finance' },
      { name: 'Wells Fargo', domain: 'wellsfargo.com', confidence: 0.9, detected_from: 'industry_db', industry: 'finance' },
      { name: 'Stripe', domain: 'stripe.com', confidence: 0.9, detected_from: 'industry_db', industry: 'finance' },
      { name: 'Square', domain: 'squareup.com', confidence: 0.9, detected_from: 'industry_db', industry: 'finance' },
      { name: 'PayPal', domain: 'paypal.com', confidence: 0.9, detected_from: 'industry_db', industry: 'finance' }
    ]
  }

  constructor() {
    this.questionGenerator = new ConversationalQuestionGenerator()
    this.perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY!)
    this.citationAnalyzer = new CitationAnalyzer()
    this.supabase = createClient()
  }

  /**
   * Run complete competitive analysis
   */
  async analyzeCompetitiveLandscape(
    targetCompany: MaxAssessmentRequest['company'],
    existingAnalyses?: MaxQuestionAnalysis[],
    options: {
      includeIndustryCompetitors?: boolean
      maxCompetitors?: number
      generateNewQuestions?: boolean
    } = {}
  ): Promise<CompetitiveLandscape> {
    const {
      includeIndustryCompetitors = true,
      maxCompetitors = 5,
      generateNewQuestions = false
    } = options

    // Step 1: Detect competitors from existing data or generate new analysis
    let competitors: CompetitorProfile[] = []
    
    if (existingAnalyses) {
      competitors = await this.detectCompetitorsFromAnalyses(existingAnalyses, targetCompany)
    }
    
    if (includeIndustryCompetitors && targetCompany.industry) {
      const industryCompetitors = this.getIndustryCompetitors(targetCompany.industry)
      competitors = this.mergeCompetitorLists(competitors, industryCompetitors)
    }
    
    // Limit to top competitors
    competitors = competitors
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxCompetitors)

    // Step 2: Generate competitive questions if needed
    let competitiveQuestions: string[] = []
    if (generateNewQuestions) {
      competitiveQuestions = await this.generateCompetitiveQuestions(targetCompany, competitors)
    }

    // Step 3: Analyze each competitor
    const competitorAnalyses: CompetitorAnalysis[] = []
    
    for (const competitor of competitors) {
      try {
        const analysis = await this.analyzeCompetitor(
          competitor,
          targetCompany,
          existingAnalyses,
          competitiveQuestions
        )
        competitorAnalyses.push(analysis)
      } catch (error) {
        console.error(`Failed to analyze competitor ${competitor.name}:`, error)
      }
    }

    // Step 4: Analyze target company with same methodology
    const targetAnalysis = await this.analyzeTargetCompany(targetCompany, existingAnalyses)

    // Step 5: Generate market insights
    const marketInsights = this.generateMarketInsights([targetAnalysis, ...competitorAnalyses])

    // Step 6: Generate competitive insights and recommendations
    const competitiveInsights = this.generateCompetitiveInsights(targetAnalysis, competitorAnalyses)

    // Step 7: Calculate benchmarking
    const benchmarking = this.calculateBenchmarking(targetAnalysis, competitorAnalyses)

    return {
      target_company: targetAnalysis,
      competitors: competitorAnalyses,
      market_insights: marketInsights,
      competitive_insights: competitiveInsights,
      benchmarking
    }
  }

  /**
   * Detect competitors from existing question analyses
   */
  private async detectCompetitorsFromAnalyses(
    analyses: MaxQuestionAnalysis[],
    targetCompany: MaxAssessmentRequest['company']
  ): Promise<CompetitorProfile[]> {
    const competitors: Map<string, CompetitorProfile> = new Map()

    for (const analysis of analyses) {
      // Look for competitor mentions in AI responses
      const competitorMentions = await this.extractCompetitorMentions(
        analysis.ai_response,
        targetCompany
      )

      for (const mention of competitorMentions) {
        if (!competitors.has(mention.name)) {
          competitors.set(mention.name, {
            name: mention.name,
            domain: mention.domain || `${mention.name.toLowerCase().replace(/\s+/g, '')}.com`,
            confidence: mention.confidence,
            detected_from: 'mention',
            aliases: mention.aliases
          })
        }
      }

      // Look for competitors in citations
      for (const citation of analysis.citation_analysis || []) {
        if (citation.bucket === 'competitor') {
          const domain = new URL(citation.citation_url).hostname.replace('www.', '')
          const name = this.domainToCompanyName(domain)
          
          if (!competitors.has(name)) {
            competitors.set(name, {
              name,
              domain,
              confidence: citation.influence_score || 0.6,
              detected_from: 'citation'
            })
          }
        }
      }
    }

    return Array.from(competitors.values())
  }

  /**
   * Extract competitor mentions from AI response text
   */
  private async extractCompetitorMentions(
    response: string,
    targetCompany: MaxAssessmentRequest['company']
  ): Promise<Array<{
    name: string
    domain?: string
    confidence: number
    aliases?: string[]
  }>> {
    // This would use AI to extract competitor mentions
    // For now, simple pattern matching
    const competitors: Array<{
      name: string
      domain?: string
      confidence: number
      aliases?: string[]
    }> = []

    // Common competitor indicators
    const competitorPatterns = [
      /compared?\s+to\s+([A-Z][a-zA-Z\s]+)/gi,
      /alternatives?\s+like\s+([A-Z][a-zA-Z\s]+)/gi,
      /competitors?\s+including\s+([A-Z][a-zA-Z\s]+)/gi,
      /similar\s+to\s+([A-Z][a-zA-Z\s]+)/gi,
      /vs\.?\s+([A-Z][a-zA-Z\s]+)/gi
    ]

    for (const pattern of competitorPatterns) {
      let match
      while ((match = pattern.exec(response)) !== null) {
        const name = match[1].trim()
        if (name.length > 2 && name !== targetCompany.name) {
          competitors.push({
            name,
            confidence: 0.7,
            aliases: [name]
          })
        }
      }
    }

    return competitors
  }

  /**
   * Generate competitive questions for deeper analysis
   */
  private async generateCompetitiveQuestions(
    targetCompany: MaxAssessmentRequest['company'],
    competitors: CompetitorProfile[]
  ): Promise<string[]> {
    const questions: string[] = []

    for (const competitor of competitors.slice(0, 3)) { // Top 3 competitors
      questions.push(
        `Compare ${targetCompany.name} vs ${competitor.name} for enterprise customers`,
        `What are the key differences between ${targetCompany.name} and ${competitor.name}?`,
        `Which is better for startups: ${targetCompany.name} or ${competitor.name}?`,
        `${targetCompany.name} vs ${competitor.name}: pricing and features comparison`,
        `Why would someone choose ${targetCompany.name} over ${competitor.name}?`
      )
    }

    // General competitive questions
    questions.push(
      `Top alternatives to ${targetCompany.name} in 2024`,
      `Best competitors to ${targetCompany.name}`,
      `${targetCompany.name} vs competition: comprehensive analysis`,
      `Market leaders in ${targetCompany.industry || 'the industry'} besides ${targetCompany.name}`,
      `Who are ${targetCompany.name}'s biggest competitors?`
    )

    return questions
  }

  /**
   * Analyze individual competitor performance
   */
  private async analyzeCompetitor(
    competitor: CompetitorProfile,
    targetCompany: MaxAssessmentRequest['company'],
    existingAnalyses?: MaxQuestionAnalysis[],
    competitiveQuestions?: string[]
  ): Promise<CompetitorAnalysis> {
    // For existing analyses, extract competitor mentions
    let competitorMentions: MaxQuestionAnalysis[] = []
    
    if (existingAnalyses) {
      competitorMentions = existingAnalyses.filter(analysis => 
        this.responseContainsCompetitor(analysis.ai_response, competitor)
      )
    }

    // Calculate metrics from existing data
    const metrics = this.calculateCompetitorMetrics(competitor, competitorMentions)
    
    // Get sample responses
    const sampleResponses = competitorMentions.slice(0, 3).map(analysis => ({
      question: analysis.question_text,
      ai_response: analysis.ai_response.substring(0, 500) + '...',
      mention_detected: true,
      mention_position: 'secondary', // Simplified for competitor mentions
      mention_sentiment: this.extractCompetitorSentiment(analysis.ai_response, competitor)
    }))

    // Calculate positioning relative to target
    const positioning = this.calculateCompetitorPositioning(competitor, metrics, targetCompany)

    return {
      competitor,
      metrics,
      positioning,
      sample_responses: sampleResponses
    }
  }

  /**
   * Analyze target company with competitive methodology
   */
  private async analyzeTargetCompany(
    targetCompany: MaxAssessmentRequest['company'],
    existingAnalyses?: MaxQuestionAnalysis[]
  ): Promise<CompetitorAnalysis> {
    if (!existingAnalyses) {
      throw new Error('Cannot analyze target company without existing analyses')
    }

    // Calculate metrics using same methodology as competitors
    const metrics = this.calculateTargetCompanyMetrics(existingAnalyses)
    
    // Sample responses
    const sampleResponses = existingAnalyses
      .filter(a => this.getMentionDetected(a.mention_analysis))
      .slice(0, 3)
      .map(analysis => ({
        question: analysis.question_text,
        ai_response: analysis.ai_response.substring(0, 500) + '...',
        mention_detected: true,
        mention_position: analysis.mention_analysis.mention_position || 'secondary',
        mention_sentiment: analysis.mention_analysis.mention_sentiment || 'neutral'
      }))

    return {
      competitor: {
        name: targetCompany.name,
        domain: targetCompany.domain,
        confidence: 1.0,
        detected_from: 'manual',
        industry: targetCompany.industry
      },
      metrics,
      positioning: {
        rank: 1, // Will be calculated later
        share_of_voice: 0, // Will be calculated later
        competitive_advantage: [],
        competitive_weakness: []
      },
      sample_responses: sampleResponses
    }
  }

  // Helper methods

  private getIndustryCompetitors(industry: string): CompetitorProfile[] {
    return this.industryCompetitors[industry.toLowerCase()] || []
  }

  private mergeCompetitorLists(
    detected: CompetitorProfile[],
    industry: CompetitorProfile[]
  ): CompetitorProfile[] {
    const merged = new Map<string, CompetitorProfile>()
    
    // Add detected competitors (higher priority)
    for (const competitor of detected) {
      merged.set(competitor.name.toLowerCase(), competitor)
    }
    
    // Add industry competitors if not already present
    for (const competitor of industry) {
      const key = competitor.name.toLowerCase()
      if (!merged.has(key)) {
        merged.set(key, { ...competitor, confidence: competitor.confidence * 0.8 })
      }
    }
    
    return Array.from(merged.values())
  }

  private responseContainsCompetitor(response: string, competitor: CompetitorProfile): boolean {
    const lowerResponse = response.toLowerCase()
    const competitorNames = [competitor.name, ...(competitor.aliases || [])]
    
    return competitorNames.some(name => 
      lowerResponse.includes(name.toLowerCase())
    )
  }

  private calculateCompetitorMetrics(
    competitor: CompetitorProfile,
    mentions: MaxQuestionAnalysis[]
  ): CompetitorAnalysis['metrics'] {
    // Simplified metrics calculation
    const mentionRate = mentions.length > 0 ? mentions.length / 50 : 0 // Assume 50 total questions
    const citationCount = mentions.reduce((sum, m) => sum + (m.citation_analysis?.length || 0), 0)
    
    return {
      mention_rate: Math.min(mentionRate, 1),
      mention_quality: 0.6, // Simplified
      source_influence: 0.7, // Simplified
      sentiment_average: 0.1, // Slightly positive
      citation_count: citationCount,
      owned_citations: 0,
      operated_citations: 0,
      earned_citations: citationCount,
      ai_visibility_score: mentionRate * 0.7 // Simplified calculation
    }
  }

  private calculateTargetCompanyMetrics(analyses: MaxQuestionAnalysis[]): CompetitorAnalysis['metrics'] {
    const totalQuestions = analyses.length
    const mentionedQuestions = analyses.filter(a => this.getMentionDetected(a.mention_analysis)).length
    const allCitations = analyses.flatMap(a => a.citation_analysis || [])
    
    const citationBreakdown = allCitations.reduce((acc, citation) => {
      acc[citation.bucket]++
      return acc
    }, { owned: 0, operated: 0, earned: 0, competitor: 0 })

    const avgInfluence = allCitations.length > 0
      ? allCitations.reduce((sum, c) => sum + (c.influence_score || 0), 0) / allCitations.length
      : 0

    const avgSentiment = analyses
      .filter(a => this.getMentionDetected(a.mention_analysis))
      .reduce((sum, a) => {
        const sentiment = a.mention_analysis.mention_sentiment
        const sentimentScore = {
          'very_positive': 1,
          'positive': 0.5,
          'neutral': 0,
          'negative': -0.5,
          'very_negative': -1
        }[sentiment] || 0
        return sum + sentimentScore
      }, 0) / Math.max(mentionedQuestions, 1)

    return {
      mention_rate: totalQuestions > 0 ? mentionedQuestions / totalQuestions : 0,
      mention_quality: 0.8, // From detailed analysis
      source_influence: avgInfluence,
      sentiment_average: avgSentiment,
      citation_count: allCitations.length,
      owned_citations: citationBreakdown.owned,
      operated_citations: citationBreakdown.operated,
      earned_citations: citationBreakdown.earned,
      ai_visibility_score: totalQuestions > 0 ? mentionedQuestions / totalQuestions : 0
    }
  }

  private calculateCompetitorPositioning(
    competitor: CompetitorProfile,
    metrics: CompetitorAnalysis['metrics'],
    targetCompany: MaxAssessmentRequest['company']
  ): CompetitorAnalysis['positioning'] {
    return {
      rank: 1, // Will be set later when comparing all competitors
      share_of_voice: metrics.mention_rate,
      competitive_advantage: [],
      competitive_weakness: []
    }
  }

  private generateMarketInsights(analyses: CompetitorAnalysis[]): CompetitiveLandscape['market_insights'] {
    const totalMentions = analyses.reduce((sum, a) => sum + (a.metrics.mention_rate * 50), 0)
    const avgSentiment = analyses.reduce((sum, a) => sum + a.metrics.sentiment_average, 0) / analyses.length
    
    return {
      total_market_mentions: Math.round(totalMentions),
      market_leaders: analyses
        .sort((a, b) => b.metrics.ai_visibility_score - a.metrics.ai_visibility_score)
        .slice(0, 3)
        .map(a => a.competitor.name),
      emerging_players: analyses
        .filter(a => a.metrics.ai_visibility_score > 0.3 && a.metrics.ai_visibility_score < 0.7)
        .map(a => a.competitor.name),
      market_sentiment: avgSentiment,
      key_themes: ['AI adoption', 'Digital transformation', 'Customer experience']
    }
  }

  private generateCompetitiveInsights(
    target: CompetitorAnalysis,
    competitors: CompetitorAnalysis[]
  ): CompetitiveInsight[] {
    const insights: CompetitiveInsight[] = []

    // Market position insight
    const targetRank = competitors.filter(c => 
      c.metrics.ai_visibility_score > target.metrics.ai_visibility_score
    ).length + 1

    if (targetRank > competitors.length / 2) {
      insights.push({
        category: 'positioning',
        title: 'Visibility Gap Identified',
        description: `Your AI visibility score (${(target.metrics.ai_visibility_score * 100).toFixed(1)}%) ranks ${targetRank} out of ${competitors.length + 1} competitors analyzed.`,
        priority: 'high',
        actionable_steps: [
          'Increase thought leadership content creation',
          'Improve SEO and content distribution',
          'Build relationships with industry influencers'
        ],
        data_points: {
          current_rank: targetRank,
          total_competitors: competitors.length + 1,
          visibility_score: target.metrics.ai_visibility_score
        }
      })
    }

    // Sentiment comparison
    const avgCompetitorSentiment = competitors.reduce((sum, c) => sum + c.metrics.sentiment_average, 0) / competitors.length
    if (target.metrics.sentiment_average < avgCompetitorSentiment) {
      insights.push({
        category: 'messaging',
        title: 'Sentiment Below Market Average',
        description: `Your brand sentiment (${target.metrics.sentiment_average.toFixed(2)}) is below the market average (${avgCompetitorSentiment.toFixed(2)}).`,
        priority: 'medium',
        actionable_steps: [
          'Review recent customer feedback and PR',
          'Improve customer success initiatives',
          'Address any recent negative coverage'
        ],
        data_points: {
          target_sentiment: target.metrics.sentiment_average,
          market_average: avgCompetitorSentiment
        }
      })
    }

    return insights
  }

  private calculateBenchmarking(
    target: CompetitorAnalysis,
    competitors: CompetitorAnalysis[]
  ): CompetitiveLandscape['benchmarking'] {
    const allScores = [target, ...competitors].map(a => a.metrics.ai_visibility_score)
    const industryAverage = allScores.reduce((sum, score) => sum + score, 0) / allScores.length
    
    const rankedScores = allScores.sort((a, b) => b - a)
    const targetRank = rankedScores.indexOf(target.metrics.ai_visibility_score) + 1
    const percentile = ((allScores.length - targetRank + 1) / allScores.length) * 100

    const gaps = []
    if (target.metrics.mention_rate < industryAverage) {
      gaps.push('Increase brand mention frequency in AI responses')
    }
    if (target.metrics.source_influence < 0.7) {
      gaps.push('Build authority through high-influence source relationships')
    }

    return {
      industry_average: industryAverage,
      target_percentile: percentile,
      gaps_and_opportunities: gaps
    }
  }

  private extractCompetitorSentiment(response: string, competitor: CompetitorProfile): string {
    // Simplified sentiment extraction
    const lowerResponse = response.toLowerCase()
    const competitorMention = lowerResponse.indexOf(competitor.name.toLowerCase())
    
    if (competitorMention === -1) return 'neutral'
    
    const contextWindow = response.substring(
      Math.max(0, competitorMention - 100),
      Math.min(response.length, competitorMention + competitor.name.length + 100)
    ).toLowerCase()
    
    const positiveWords = ['better', 'best', 'excellent', 'superior', 'leading', 'innovative']
    const negativeWords = ['worse', 'poor', 'limited', 'expensive', 'difficult', 'lacking']
    
    const positiveCount = positiveWords.filter(word => contextWindow.includes(word)).length
    const negativeCount = negativeWords.filter(word => contextWindow.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private domainToCompanyName(domain: string): string {
    // Simple domain to company name conversion
    return domain
      .replace(/\.(com|org|net|io)$/, '')
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  private getMentionDetected(mentionAnalysis: any): boolean {
    if (typeof mentionAnalysis === 'boolean') return mentionAnalysis
    if (typeof mentionAnalysis === 'object' && mentionAnalysis !== null) {
      return Boolean(mentionAnalysis.mention_detected)
    }
    return false
  }
} 