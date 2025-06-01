// MAX Visibility Assessment Pipeline
// Orchestrates the complete visibility assessment process

import { ConversationalQuestionGenerator } from './question-generator'
import { PerplexityClient } from '../perplexity/client'
import { CitationAnalyzer } from '../perplexity/citation-analyzer'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  MaxAssessmentRequest,
  MaxAssessmentResult,
  MaxQuestionAnalysis,
  MaxVisibilityScore,
  MaxVisibilityError,
  AssessmentStatus,
  QuestionType,
  MaxQuestionType
} from '@/types/max-visibility'

interface PipelineConfig {
  questionCount: number
  questionTypes: MaxQuestionType[]
  includeCompetitorAnalysis: boolean
  batchSize: number
  rateLimitDelay: number
}

interface PipelineProgress {
  stage: 'setup' | 'questions' | 'analysis' | 'scoring' | 'complete'
  completed: number
  total: number
  message: string
}

export class MaxVisibilityPipeline {
  private questionGenerator: ConversationalQuestionGenerator
  private perplexityClient: PerplexityClient
  private citationAnalyzer: CitationAnalyzer
  private supabase: ReturnType<typeof createServiceRoleClient>

  constructor() {
    this.questionGenerator = new ConversationalQuestionGenerator()
    this.perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY!)
    this.citationAnalyzer = new CitationAnalyzer()
    this.supabase = createServiceRoleClient()
  }

  /**
   * Run complete MAX Visibility assessment
   */
  async runAssessment(
    request: MaxAssessmentRequest,
    onProgress?: (progress: PipelineProgress) => void,
    existingAssessmentId?: string
  ): Promise<MaxAssessmentResult> {
    const startTime = Date.now()
    
    try {
      // Validate request
      await this.validateRequest(request)
      
      // Use existing assessment ID or create new one
      const assessmentId = existingAssessmentId || await this.createAssessmentRecord(request)
      
      // Stage 1: Generate questions
      onProgress?.({
        stage: 'setup',
        completed: 0,
        total: 100,
        message: 'Generating conversational questions...'
      })
      
      const questions = await this.generateQuestions(request, assessmentId)
      
      // Stage 2: Query and analyze responses
      onProgress?.({
        stage: 'questions',
        completed: 20,
        total: 100,
        message: `Processing ${questions.length} questions...`
      })
      
      const analyses = await this.processQuestions(
        questions,
        request,
        assessmentId,
        (completed, total) => {
          onProgress?.({
            stage: 'analysis',
            completed: Math.round(20 + (completed / total) * 60),
            total: 100,
            message: `Analyzing question ${completed} of ${total}...`
          })
        }
      )
      
      // Stage 3: Calculate scores
      onProgress?.({
        stage: 'scoring',
        completed: 85,
        total: 100,
        message: 'Calculating visibility scores...'
      })
      
      const scores = await this.calculateScores(analyses, request, assessmentId)
      
      // Stage 4: Save results - ALWAYS save if we have any assessment ID
      console.log(`💾 Saving results for assessment: ${assessmentId}`)
      await this.saveResults(assessmentId, analyses, scores)
      
      onProgress?.({
        stage: 'complete',
        completed: 100,
        total: 100,
        message: 'Assessment complete!'
      })
      
      const processingTime = Date.now() - startTime
      
      return {
        assessment_id: assessmentId,
        company: request.company,
        question_analyses: analyses,
        visibility_scores: scores,
        processing_time_ms: processingTime,
        completed_at: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('MAX Visibility assessment failed:', error)
      throw this.createMaxVisibilityError(
        'ASSESSMENT_FAILED',
        `Assessment failed: ${(error as Error).message}`,
        { request: request.company.name }
      )
    }
  }

  /**
   * Generate questions for assessment
   */
  private async generateQuestions(
    request: MaxAssessmentRequest,
    assessmentId: string
  ): Promise<Array<{ id: string; question: string; type: MaxQuestionType }>> {
    const config = this.getConfig(request)
    
    const generatedQuestions = await this.questionGenerator.generateQuestions({
      company: request.company,
      question_count: config.questionCount,
      question_types: config.questionTypes
    })
    
    console.log(`✅ Generated ${generatedQuestions.length} questions for assessment`)
    
    // Save questions to database
    const savedQuestions: Array<{ id: string; question: string; type: MaxQuestionType }> = []
    
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i]
      
      try {
        const { data, error } = await this.supabase
          .from('max_visibility_questions')
          .insert({
            run_id: assessmentId,
            question: q.question,
            question_type: q.type,
            position: i + 1
          })
          .select('id')
          .single()
        
        if (error) {
          console.error(`❌ Failed to save question ${i + 1}:`, error)
          throw error
        }
        
        savedQuestions.push({
          id: data.id,
          question: q.question,
          type: q.type
        })
      } catch (error) {
        console.error(`Failed to save question to database:`, error)
        // Fallback to generated ID if database save fails
        savedQuestions.push({
          id: `${assessmentId}-q${i + 1}`,
          question: q.question,
          type: q.type
        })
      }
    }
    
    console.log(`💾 Saved ${savedQuestions.length} questions to database`)
    return savedQuestions
  }

  /**
   * Process questions through Perplexity and analyze responses
   */
  private async processQuestions(
    questions: Array<{ id: string; question: string; type: MaxQuestionType }>,
    request: MaxAssessmentRequest,
    assessmentId: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<MaxQuestionAnalysis[]> {
    const analyses: MaxQuestionAnalysis[] = []
    const config = this.getConfig(request)
    
    console.log(`🚀 Processing ${questions.length} questions in batches of ${config.batchSize}`)
    
    // Process in batches to respect rate limits
    for (let i = 0; i < questions.length; i += config.batchSize) {
      const batch = questions.slice(i, i + config.batchSize)
      const batchNumber = Math.floor(i / config.batchSize) + 1
      const totalBatches = Math.ceil(questions.length / config.batchSize)
      
      console.log(`⚡ Starting batch ${batchNumber}/${totalBatches} with ${batch.length} questions in parallel`)
      
      const batchPromises = batch.map(async (question) => {
        try {
          return await this.processQuestion(question, request, assessmentId)
        } catch (error) {
          console.error(`Failed to process question ${question.id}:`, error)
          return this.createErrorAnalysis(question, error as Error)
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      analyses.push(...batchResults)
      
      console.log(`✅ Batch ${batchNumber}/${totalBatches} completed`)
      
      onProgress?.(i + batch.length, questions.length)
      
      // Add delay between batches (much shorter now)
      if (i + config.batchSize < questions.length) {
        console.log(`⏱️ Waiting ${config.rateLimitDelay}ms before next batch...`)
        await this.sleep(config.rateLimitDelay)
      }
    }
    
    console.log(`🎯 All ${questions.length} questions processed!`)
    return analyses
  }

  /**
   * Process a single question
   */
  private async processQuestion(
    question: { id: string; question: string; type: MaxQuestionType },
    request: MaxAssessmentRequest,
    assessmentId: string
  ): Promise<MaxQuestionAnalysis> {
    // Query Perplexity
    const perplexityResponse = await this.perplexityClient.query({
      query: question.question,
      return_citations: true,
      return_related_questions: false
    })
    
    const responseText = perplexityResponse.choices[0]?.message?.content || ''
    const citations = perplexityResponse.citations || []
    
    // Analyze mentions
    const mentionAnalysis = await this.perplexityClient.analyzeResponse(
      responseText,
      {
        name: request.company.name,
        domain: request.company.domain,
        aliases: request.company.aliases || []
      }
    )
    
    // Analyze citations - pass just the URLs
    const citationAnalysis = await this.citationAnalyzer.analyzeCitations({
      citations: citations,
      target_company: {
        name: request.company.name,
        domain: request.company.domain,
        owned_domains: request.company.owned_domains || [],
        operated_domains: request.company.operated_domains || []
      }
    })
    
    // Calculate question-level scores
    const questionScore = this.calculateQuestionScore(
      mentionAnalysis,
      citationAnalysis,
      question.type
    )
    
    const analysis: MaxQuestionAnalysis = {
      question_id: question.id,
      question_text: question.question,
      question_type: question.type,
      ai_response: responseText,
      response_citations: citations.map(citation => ({
        url: citation,
        text: citation,
        title: citation
      })),
      mention_analysis: mentionAnalysis,
      citation_analysis: citationAnalysis,
      question_score: questionScore,
      processed_at: new Date().toISOString()
    }
    
    // Save to database
    await this.saveQuestionAnalysis(assessmentId, analysis)
    
    return analysis
  }

  /**
   * Calculate question-level score
   */
  private calculateQuestionScore(
    mentionAnalysis: any,
    citationAnalysis: any[],
    questionType: MaxQuestionType
  ): number {
    let score = 0
    
    // Base score from mention detection
    if (mentionAnalysis.mention_detected) {
      const positionScores = {
        'primary': 1.0,
        'secondary': 0.7,
        'passing': 0.4,
        'none': 0
      }
      score += positionScores[mentionAnalysis.mention_position as keyof typeof positionScores] || 0
    }
    
    // Boost for positive sentiment
    if (mentionAnalysis.mention_sentiment === 'positive' || 
        mentionAnalysis.mention_sentiment === 'very_positive') {
      score *= 1.2
    }
    
    // Citation influence
    const avgCitationInfluence = citationAnalysis.length > 0 
      ? citationAnalysis.reduce((sum, c) => sum + c.influence_score, 0) / citationAnalysis.length
      : 0
    score += avgCitationInfluence * 0.3
    
    // Question type weighting
    const typeWeights = {
      'direct_conversational': 1.0,
      'indirect_conversational': 0.8,
      'comparison_query': 1.2,
      'recommendation_request': 1.1,
      'explanatory_query': 0.7
    }
    score *= typeWeights[questionType] || 1.0
    
    return Math.min(score, 1.0)
  }

  /**
   * Calculate overall visibility scores
   */
  private async calculateScores(
    analyses: MaxQuestionAnalysis[],
    request: MaxAssessmentRequest,
    assessmentId: string
  ): Promise<MaxVisibilityScore> {
    const totalQuestions = analyses.length
    const mentionedQuestions = analyses.filter(a => a.mention_analysis.mention_detected).length
    
    // Mention Rate (40% weight)
    const mentionRate = totalQuestions > 0 ? mentionedQuestions / totalQuestions : 0
    
    // Mention Quality (25% weight)
    const qualityScores = analyses
      .filter(a => a.mention_analysis.mention_detected)
      .map(a => this.getQualityScore(a.mention_analysis))
    const avgQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0
    
    // Source Influence (20% weight)
    const allCitations = analyses.flatMap(a => a.citation_analysis)
    const avgInfluence = allCitations.length > 0
      ? allCitations.reduce((sum, c) => sum + c.influence_score, 0) / allCitations.length
      : 0
    
    // Competitive Positioning (10% weight)
    const competitiveScore = this.calculateCompetitiveScore(analyses)
    
    // Response Consistency (5% weight)
    const consistencyScore = this.calculateConsistencyScore(analyses)
    
    // Weighted overall score
    const overallScore = (
      mentionRate * 0.40 +
      avgQuality * 0.25 +
      avgInfluence * 0.20 +
      competitiveScore * 0.10 +
      consistencyScore * 0.05
    )
    
    const scores: MaxVisibilityScore = {
      overall_score: Number(overallScore.toFixed(4)),
      mention_rate: Number(mentionRate.toFixed(4)),
      mention_quality: Number(avgQuality.toFixed(4)),
      source_influence: Number(avgInfluence.toFixed(4)),
      competitive_positioning: Number(competitiveScore.toFixed(4)),
      response_consistency: Number(consistencyScore.toFixed(4)),
      total_questions: totalQuestions,
      mentioned_questions: mentionedQuestions,
      citation_breakdown: this.getCitationBreakdown(allCitations),
      calculated_at: new Date().toISOString()
    }
    
    return scores
  }

  // Helper methods

  private getConfig(request: MaxAssessmentRequest): PipelineConfig {
    return {
      questionCount: request.question_count || 50,
      questionTypes: request.question_types || [
        'direct_conversational',
        'indirect_conversational', 
        'comparison_query',
        'recommendation_request',
        'explanatory_query'
      ],
      includeCompetitorAnalysis: request.include_competitor_analysis || true,
      batchSize: 10, // Increased from 3 to 10 for much faster processing
      rateLimitDelay: 500 // Reduced from 2000ms to 500ms
    }
  }

  private getQualityScore(mentionAnalysis: any): number {
    const positionScores = {
      'primary': 1.0,
      'secondary': 0.7,
      'passing': 0.3,
      'none': 0
    }
    
    const sentimentBonus = {
      'very_positive': 0.3,
      'positive': 0.2,
      'neutral': 0.1,
      'negative': -0.1,
      'very_negative': -0.2
    }
    
    const baseScore = positionScores[mentionAnalysis.mention_position as keyof typeof positionScores] || 0
    const bonus = sentimentBonus[mentionAnalysis.mention_sentiment as keyof typeof sentimentBonus] || 0
    
    return Math.max(0, Math.min(1, baseScore + bonus))
  }

  private calculateCompetitiveScore(analyses: MaxQuestionAnalysis[]): number {
    // Analyze how well the company performs in competitive contexts
    const competitiveQuestions = analyses.filter(a => 
      a.question_type === 'comparison_query' || 
      a.question_text.toLowerCase().includes('vs') ||
      a.question_text.toLowerCase().includes('compare')
    )
    
    if (competitiveQuestions.length === 0) return 0.5 // Neutral if no competitive questions
    
    const competitiveScore = competitiveQuestions.reduce((sum, analysis) => {
      return sum + analysis.question_score
    }, 0) / competitiveQuestions.length
    
    return competitiveScore
  }

  private calculateConsistencyScore(analyses: MaxQuestionAnalysis[]): number {
    const mentionedAnalyses = analyses.filter(a => a.mention_analysis.mention_detected)
    
    if (mentionedAnalyses.length < 2) return 1.0 // Perfect consistency if too few mentions
    
    // Check sentiment consistency
    const sentiments = mentionedAnalyses.map(a => a.mention_analysis.mention_sentiment)
    const uniqueSentiments = new Set(sentiments)
    
    // More consistent = higher score
    const sentimentConsistency = 1 - (uniqueSentiments.size - 1) / 4 // 4 possible sentiment variations
    
    return Math.max(0.2, sentimentConsistency) // Minimum 20% consistency
  }

  private getCitationBreakdown(citations: any[]): Record<string, number> {
    const breakdown = {
      owned: 0,
      operated: 0,
      earned: 0,
      competitor: 0
    }
    
    for (const citation of citations) {
      breakdown[citation.bucket as keyof typeof breakdown]++
    }
    
    return breakdown
  }

  private async createAssessmentRecord(request: MaxAssessmentRequest): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized')
    }

    // For now, we'll skip the detailed pipeline record and just use the existing simple approach
    // This avoids RLS issues since the main route already creates the tracking record
    console.log('📝 Skipping pipeline-level record creation (using existing tracking record)')
    return `pipeline-${Date.now()}` // Return a placeholder ID
  }

  private async saveQuestionAnalysis(assessmentId: string, analysis: MaxQuestionAnalysis): Promise<void> {
    console.log(`💾 Saving detailed analysis for question: ${analysis.question_id}`)
    
    try {
      // 1. Save the response and mention analysis
      const { data: responseData, error: responseError } = await this.supabase
        .from('max_visibility_responses')
        .insert({
          question_id: analysis.question_id,
          perplexity_response_id: `perplexity-${Date.now()}`, // Mock ID for now
          full_response: analysis.ai_response,
          response_length: analysis.ai_response.length,
          mention_detected: analysis.mention_analysis.mention_detected,
          mention_position: analysis.mention_analysis.mention_position,
          mention_sentiment: analysis.mention_analysis.mention_sentiment,
          mention_context: analysis.mention_analysis.mention_context,
          mention_confidence: analysis.mention_analysis.confidence_score,
          citation_count: analysis.response_citations.length,
          response_quality_score: analysis.question_score * 100, // Convert to 0-100 scale
          processing_time_ms: 0, // Would need to track this
          analyzed_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (responseError) {
        console.error(`❌ Failed to save response:`, responseError)
        throw responseError
      }
      
      const responseId = responseData.id
      console.log(`✅ Saved response: ${responseId}`)
      
      // 2. Save citations if any
      if (analysis.citation_analysis && analysis.citation_analysis.length > 0) {
        const citationInserts = analysis.citation_analysis.map((citation, index) => ({
          response_id: responseId,
          citation_url: citation.citation_url,
          citation_title: null, // Not available in CitationClassificationResult
          citation_domain: new URL(citation.citation_url).hostname,
          citation_excerpt: null, // Not available in CitationClassificationResult
          bucket: citation.bucket,
          influence_score: citation.influence_score,
          position_in_citations: index + 1,
          domain_authority: null, // Not available in CitationClassificationResult
          relevance_score: citation.relevance_score
        }))
        
        const { error: citationsError } = await this.supabase
          .from('max_visibility_citations')
          .insert(citationInserts)
        
        if (citationsError) {
          console.error(`❌ Failed to save citations:`, citationsError)
          // Don't throw, citations are not critical
        } else {
          console.log(`✅ Saved ${citationInserts.length} citations`)
        }
      }
      
      console.log(`📝 Question analysis saved: ${analysis.question_id} - Score: ${analysis.question_score}`)
      
    } catch (error) {
      console.error(`💥 Failed to save question analysis:`, error)
      // Don't throw - we want to continue processing other questions
    }
  }

  private async saveResults(
    assessmentId: string,
    analyses: MaxQuestionAnalysis[],
    scores: MaxVisibilityScore
  ): Promise<void> {
    console.log(`🔄 Updating assessment record ${assessmentId} with results...`)
    
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized')
    }

    try {
      // Calculate the final score as a percentage (0-100)
      const finalScore = Math.round(scores.overall_score * 100)
      
      console.log(`📊 Calculated scores:`, {
        overall_score: scores.overall_score,
        final_score_percentage: finalScore,
        mention_rate: scores.mention_rate,
        total_questions: scores.total_questions,
        mentioned_questions: scores.mentioned_questions
      })

      // Update the assessment record with detailed scores
      const { data, error: updateError } = await this.supabase
        .from('max_visibility_runs')
        .update({
          status: 'completed',
          total_score: finalScore,
          mention_rate: scores.mention_rate,
          sentiment_score: this.calculateAverageSentiment(analyses),
          citation_score: Math.round(scores.source_influence * 100),
          competitive_score: Math.round(scores.competitive_positioning * 100),
          consistency_score: Math.round(scores.response_consistency * 100),
          completed_at: new Date().toISOString(),
          computed_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
        .select()

      if (updateError) {
        console.error(`❌ Failed to update assessment ${assessmentId}:`, updateError)
        throw new Error(`Failed to update assessment: ${updateError.message}`)
      }

      if (!data || data.length === 0) {
        console.error(`❌ No assessment record found with ID: ${assessmentId}`)
        throw new Error(`Assessment record not found: ${assessmentId}`)
      }

      console.log(`✅ Assessment ${assessmentId} updated successfully:`, {
        status: data[0].status,
        score: data[0].total_score,
        computed_at: data[0].computed_at
      })
      
      // Save competitive analysis (if we detected competitors)
      await this.saveCompetitiveAnalysis(assessmentId, analyses)
      
      // Save topic analysis
      await this.saveTopicAnalysis(assessmentId, analyses)
      
      // Save key metrics
      await this.saveMetrics(assessmentId, analyses, scores)
      
    } catch (error) {
      console.error(`💥 Error saving results for assessment ${assessmentId}:`, error)
      throw error
    }
  }

  private async validateRequest(request: MaxAssessmentRequest): Promise<void> {
    if (!request.company?.name || !request.company?.domain) {
      throw new Error('Company name and domain are required')
    }
    
    if (request.question_count && (request.question_count < 1 || request.question_count > 100)) {
      throw new Error('Question count must be between 1 and 100')
    }
  }

  private createErrorAnalysis(
    question: { id: string; question: string; type: MaxQuestionType },
    error: Error
  ): MaxQuestionAnalysis {
    return {
      question_id: question.id,
      question_text: question.question,
      question_type: question.type,
      ai_response: `Error: ${error.message}`,
      response_citations: [],
      mention_analysis: {
        mention_detected: false,
        mention_position: 'none',
        mention_sentiment: 'neutral',
        mention_context: null,
        confidence_score: 0,
        reasoning: `Processing failed: ${error.message}`
      },
      citation_analysis: [],
      question_score: 0,
      processed_at: new Date().toISOString()
    }
  }

  private createMaxVisibilityError(
    code: string,
    message: string,
    details?: Record<string, any>
  ): MaxVisibilityError {
    return { code, message, details }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Additional helper methods for comprehensive data saving

  private calculateAverageSentiment(analyses: MaxQuestionAnalysis[]): number {
    const mentionedAnalyses = analyses.filter(a => a.mention_analysis.mention_detected)
    if (mentionedAnalyses.length === 0) return 0
    
    const sentimentMap: Record<string, number> = {
      'very_positive': 1,
      'positive': 0.5,
      'neutral': 0,
      'negative': -0.5,
      'very_negative': -1
    }
    
    const totalSentiment = mentionedAnalyses.reduce((sum, analysis) => {
      return sum + (sentimentMap[analysis.mention_analysis.mention_sentiment] || 0)
    }, 0)
    
    return totalSentiment / mentionedAnalyses.length
  }

  private async saveCompetitiveAnalysis(assessmentId: string, analyses: MaxQuestionAnalysis[]): Promise<void> {
    try {
      // Extract competitor mentions from comparison queries
      const competitorMentions = new Map<string, { count: number; sentiment: number }>()
      
      const comparisonAnalyses = analyses.filter(a => 
        a.question_type === 'comparison_query' || 
        a.question_text.toLowerCase().includes('compare') ||
        a.question_text.toLowerCase().includes('vs')
      )
      
      // This is a simplified implementation
      // In production, you'd use NLP to extract actual competitor names
      console.log(`📊 Found ${comparisonAnalyses.length} comparison questions`)
      
      // For now, we'll skip detailed competitor extraction
      // This would require more sophisticated NLP
    } catch (error) {
      console.error('Failed to save competitive analysis:', error)
    }
  }

  private async saveTopicAnalysis(assessmentId: string, analyses: MaxQuestionAnalysis[]): Promise<void> {
    try {
      // Extract topics from questions and responses
      const topicCounts = new Map<string, number>()
      
      // Common topic keywords (simplified)
      const topicKeywords = {
        'pricing': ['price', 'cost', 'pricing', 'expensive', 'affordable'],
        'features': ['feature', 'capability', 'function', 'tool'],
        'integration': ['integrate', 'integration', 'connect', 'api'],
        'support': ['support', 'help', 'customer service', 'documentation'],
        'performance': ['performance', 'speed', 'fast', 'efficient', 'scale']
      }
      
      // Count topic mentions
      for (const analysis of analyses) {
        const text = (analysis.question_text + ' ' + analysis.ai_response).toLowerCase()
        
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
          if (keywords.some(keyword => text.includes(keyword))) {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
          }
        }
      }
      
      // Save top topics
      const sortedTopics = Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      
      for (let i = 0; i < sortedTopics.length; i++) {
        const [topic, count] = sortedTopics[i]
        
        await this.supabase
          .from('max_visibility_topics')
          .insert({
            run_id: assessmentId,
            topic_name: topic,
            topic_category: 'general',
            mention_count: count,
            mention_percentage: (count / analyses.length) * 100,
            rank_position: i + 1
          })
      }
      
      console.log(`✅ Saved ${sortedTopics.length} topic analyses`)
    } catch (error) {
      console.error('Failed to save topic analysis:', error)
    }
  }

  private async saveMetrics(assessmentId: string, analyses: MaxQuestionAnalysis[], scores: MaxVisibilityScore): Promise<void> {
    try {
      const metrics = [
        {
          metric_name: 'avg_response_length',
          metric_value: analyses.reduce((sum, a) => sum + a.ai_response.length, 0) / analyses.length,
          metric_unit: 'characters',
          metric_category: 'quality'
        },
        {
          metric_name: 'mention_position_distribution',
          metric_value: analyses.filter(a => a.mention_analysis.mention_position === 'primary').length,
          metric_unit: 'count',
          metric_category: 'visibility'
        },
        {
          metric_name: 'citation_diversity',
          metric_value: new Set(analyses.flatMap(a => a.citation_analysis.map(c => new URL(c.citation_url).hostname))).size,
          metric_unit: 'unique_domains',
          metric_category: 'influence'
        },
        {
          metric_name: 'positive_sentiment_rate',
          metric_value: analyses.filter(a => 
            a.mention_analysis.mention_detected && 
            ['positive', 'very_positive'].includes(a.mention_analysis.mention_sentiment)
          ).length / Math.max(1, analyses.filter(a => a.mention_analysis.mention_detected).length),
          metric_unit: 'percentage',
          metric_category: 'sentiment'
        }
      ]
      
      await this.supabase
        .from('max_visibility_metrics')
        .insert(metrics.map(m => ({ ...m, run_id: assessmentId })))
      
      console.log(`✅ Saved ${metrics.length} analysis metrics`)
    } catch (error) {
      console.error('Failed to save metrics:', error)
    }
  }

  // Public utility methods

  /**
   * Test pipeline connectivity
   */
  async testConnectivity(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []
    
    try {
      // Test Perplexity connection
      const perplexityTest = await this.perplexityClient.testConnection()
      if (!perplexityTest.success) {
        errors.push(`Perplexity: ${perplexityTest.error}`)
      }
      
      // Test database connection using our actual table name
      if (!this.supabase) {
        throw new Error('Supabase client is not initialized')
      }

      const { error: dbError } = await this.supabase
        .from('max_visibility_runs')
        .select('id')
        .limit(1)
      
      if (dbError) {
        errors.push(`Database: ${dbError.message}`)
      }
      
    } catch (error) {
      errors.push(`General: ${(error as Error).message}`)
    }
    
    return { success: errors.length === 0, errors }
  }

  /**
   * Get assessment status
   */
  async getAssessmentStatus(assessmentId: string): Promise<string | null> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized')
    }

    const { data, error } = await this.supabase
      .from('max_visibility_runs')
      .select('status')
      .eq('id', assessmentId)
      .single()
    
    if (error) return null
    return data.status
  }
} 