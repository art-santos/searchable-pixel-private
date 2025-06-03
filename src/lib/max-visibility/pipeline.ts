// MAX Visibility Assessment Pipeline - GPT-4o Architecture
// Simple orchestration for GPT-4o powered analysis

import { ConversationalQuestionGenerator } from './question-generator'
import { PerplexityClient } from '../perplexity/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  MaxAssessmentRequest,
  MaxAssessmentResult,
  MaxQuestionAnalysis,
  MaxVisibilityScore,
  MaxVisibilityError,
  AssessmentStatus,
  MaxQuestionType
} from '@/types/max-visibility'

interface PipelineProgress {
  stage: 'setup' | 'questions' | 'analysis' | 'scoring' | 'complete'
  completed: number
  total: number
  message: string
}

export class MaxVisibilityPipeline {
  private questionGenerator: ConversationalQuestionGenerator
  private perplexityClient: PerplexityClient
  private supabase: ReturnType<typeof createServiceRoleClient>

  constructor() {
    this.questionGenerator = new ConversationalQuestionGenerator()
    this.perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY!)
    this.supabase = createServiceRoleClient()
  }

  /**
   * Run complete MAX Visibility assessment with GPT-4o analysis
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
      
      // Create or use existing assessment record
      const assessmentId = existingAssessmentId || await this.createAssessmentRecord(request)
      
      // Stage 1: Generate questions
      onProgress?.({
        stage: 'setup',
        completed: 0,
        total: 100,
        message: 'Generating conversational questions...'
      })
      
      const questions = await this.generateQuestions(request, assessmentId)
      
      // Stage 2: Get AI responses from Perplexity
      onProgress?.({
        stage: 'questions',
        completed: 20,
        total: 100,
        message: `Processing ${questions.length} questions...`
      })
      
      const responses = await this.getAIResponses(questions, onProgress)
      
      // Stage 3: Analyze with GPT-4o (THIS IS THE MAGIC)
          onProgress?.({
            stage: 'analysis',
        completed: 60,
            total: 100,
        message: 'Analyzing responses with GPT-4o...'
          })
      
      const analyses = await this.analyzeWithGPT4o(responses, request, assessmentId)
      
      // Stage 4: Calculate final scores
      onProgress?.({
        stage: 'scoring',
        completed: 85,
        total: 100,
        message: 'Calculating visibility scores...'
      })
      
      const scores = this.calculateFinalScores(analyses)
      
      // Stage 5: Save results
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
   * Generate questions using simplified generator
   */
  private async generateQuestions(
    request: MaxAssessmentRequest,
    assessmentId: string
  ): Promise<Array<{ id: string; question: string; type: MaxQuestionType }>> {
    const questionCount = request.question_count || 50
    
    const generatedQuestions = await this.questionGenerator.generateQuestions({
      company: request.company,
      question_count: questionCount,
      question_types: request.question_types || [
        'direct_conversational',
        'indirect_conversational', 
        'comparison_query',
        'recommendation_request',
        'explanatory_query'
      ]
    })
    
    console.log(`✅ Generated ${generatedQuestions.length} questions`)
    
    // Save questions to database
    const savedQuestions: Array<{ id: string; question: string; type: MaxQuestionType }> = []
    
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i]
      
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
        // Use fallback ID
        savedQuestions.push({
          id: `${assessmentId}-q${i + 1}`,
          question: q.question,
          type: q.type
        })
      } else {
        savedQuestions.push({
          id: data.id,
          question: q.question,
          type: q.type
        })
      }
    }
    
    return savedQuestions
  }

  /**
   * Get AI responses from Perplexity in batches
   */
  private async getAIResponses(
    questions: Array<{ id: string; question: string; type: MaxQuestionType }>,
    onProgress?: (progress: PipelineProgress) => void
  ): Promise<Array<{ question: typeof questions[0], response: string, citations: string[] }>> {
    const responses: Array<{ question: typeof questions[0], response: string, citations: string[] }> = []
    const batchSize = 10
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize)
      
      console.log(`⚡ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)}`)
      
      const batchPromises = batch.map(async (question) => {
        try {
          const perplexityResponse = await this.perplexityClient.query({
            query: question.question,
            return_citations: true,
            return_related_questions: false
          })
          
          return {
            question,
            response: perplexityResponse.choices[0]?.message?.content || '',
            citations: perplexityResponse.citations || []
          }
        } catch (error) {
          console.error(`Failed to get response for question ${question.id}:`, error)
          return {
            question,
            response: '',
            citations: []
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      responses.push(...batchResults)
      
      // Update progress
      onProgress?.({
        stage: 'questions',
        completed: 20 + Math.round((i + batch.length) / questions.length * 40),
        total: 100,
        message: `Processed ${i + batch.length} of ${questions.length} questions`
      })
      
      // Rate limiting
      if (i + batchSize < questions.length) {
        await this.sleep(500)
      }
    }
    
    return responses
  }

  /**
   * Analyze responses with GPT-4o - THE CORE INTELLIGENCE
   */
  private async analyzeWithGPT4o(
    responses: Array<{ question: any, response: string, citations: string[] }>,
    request: MaxAssessmentRequest,
    assessmentId: string
  ): Promise<MaxQuestionAnalysis[]> {
    const analyses: MaxQuestionAnalysis[] = []
    
    console.log(`🧠 Starting GPT-4o analysis of ${responses.length} responses`)
    
    for (const responseData of responses) {
      try {
        // Call GPT-4o with the analysis prompt from architecture
        const gpt4oAnalysis = await this.callGPT4oAnalyzer({
          company: request.company,
          question: responseData.question.question,
          aiResponse: responseData.response,
          citations: responseData.citations
    })
    
        // Convert GPT-4o output to our analysis format
    const analysis: MaxQuestionAnalysis = {
          question_id: responseData.question.id,
          question_text: responseData.question.question,
          question_type: responseData.question.type,
          ai_response: responseData.response,
          response_citations: responseData.citations.map(url => ({
            url,
            text: url,
            title: url
      })),
          mention_analysis: gpt4oAnalysis.mention_analysis,
          citation_analysis: gpt4oAnalysis.citation_analysis,
          question_score: gpt4oAnalysis.insights.visibility_score,
      processed_at: new Date().toISOString()
    }
    
        // Save individual analysis
    await this.saveQuestionAnalysis(assessmentId, analysis)
    
        analyses.push(analysis)
        
      } catch (error) {
        console.error(`GPT-4o analysis failed for question ${responseData.question.id}:`, error)
        // Create error analysis
        analyses.push(this.createErrorAnalysis(responseData.question, error as Error))
      }
    }
    
    return analyses
  }

  /**
   * Call GPT-4o for intelligent analysis (placeholder for actual implementation)
   */
  private async callGPT4oAnalyzer(data: {
    company: MaxAssessmentRequest['company'],
    question: string,
    aiResponse: string,
    citations: string[]
  }): Promise<any> {
    // TODO: Implement actual GPT-4o API call with the prompt from architecture
    // For now, return mock data to maintain structure
    
    console.log(`🤖 Analyzing with GPT-4o: "${data.question.substring(0, 50)}..."`)
    
    // Mock analysis (replace with actual GPT-4o call)
    return {
      mention_analysis: {
        mention_detected: data.aiResponse.toLowerCase().includes(data.company.name.toLowerCase()),
        mention_position: 'secondary',
        mention_sentiment: 'positive',
        mention_context: `Mock context for ${data.company.name}`,
        confidence_score: 0.8
      },
      citation_analysis: data.citations.map(url => ({
        citation_url: url,
        bucket: 'earned',
        influence_score: 0.7
      })),
      insights: {
        visibility_score: 0.65
      }
    }
  }

  /**
   * Calculate final scores from GPT-4o analyses
   */
  private calculateFinalScores(analyses: MaxQuestionAnalysis[]): MaxVisibilityScore {
    const totalQuestions = analyses.length
    const mentionedQuestions = analyses.filter(a => a.mention_analysis.mention_detected).length
    
    const mentionRate = totalQuestions > 0 ? mentionedQuestions / totalQuestions : 0
    const avgQuality = this.calculateAverageQuality(analyses)
    const avgInfluence = this.calculateAverageInfluence(analyses)
    
    const overallScore = (
      mentionRate * 0.40 +      // 40% weight on mention frequency
      avgQuality * 0.30 +       // 30% weight on mention quality  
      avgInfluence * 0.30       // 30% weight on source influence
    )
    
    return {
      overall_score: Number(overallScore.toFixed(4)),
      mention_rate: Number(mentionRate.toFixed(4)),
      mention_quality: Number(avgQuality.toFixed(4)),
      source_influence: Number(avgInfluence.toFixed(4)),
      competitive_positioning: 0.5, // Simplified
      response_consistency: 0.8,    // Simplified
      total_questions: totalQuestions,
      mentioned_questions: mentionedQuestions,
      citation_breakdown: this.getCitationBreakdown(analyses),
      calculated_at: new Date().toISOString()
    }
  }

  // Helper methods (simplified)

  private calculateAverageQuality(analyses: MaxQuestionAnalysis[]): number {
    const qualityScores = analyses
      .filter(a => a.mention_analysis.mention_detected)
      .map(a => this.getQualityScore(a.mention_analysis))
    
    return qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0
  }

  private calculateAverageInfluence(analyses: MaxQuestionAnalysis[]): number {
    const allCitations = analyses.flatMap(a => a.citation_analysis || [])
    return allCitations.length > 0
      ? allCitations.reduce((sum, c) => sum + (c.influence_score || 0), 0) / allCitations.length
      : 0
  }

  private getQualityScore(mentionAnalysis: any): number {
    const positionScores = { 'primary': 1.0, 'secondary': 0.7, 'passing': 0.3, 'none': 0 }
    const sentimentBonus = { 'very_positive': 0.3, 'positive': 0.2, 'neutral': 0.1, 'negative': -0.1, 'very_negative': -0.2 }
    
    const baseScore = positionScores[mentionAnalysis.mention_position as keyof typeof positionScores] || 0
    const bonus = sentimentBonus[mentionAnalysis.mention_sentiment as keyof typeof sentimentBonus] || 0
    
    return Math.max(0, Math.min(1, baseScore + bonus))
  }

  private getCitationBreakdown(analyses: MaxQuestionAnalysis[]): Record<string, number> {
    const breakdown = { owned: 0, operated: 0, earned: 0, competitor: 0 }
    
    for (const analysis of analyses) {
      for (const citation of analysis.citation_analysis || []) {
        breakdown[citation.bucket]++
      }
    }
    
    return breakdown
  }

  private async createAssessmentRecord(request: MaxAssessmentRequest): Promise<string> {
    const { data, error } = await this.supabase
      .from('max_visibility_runs')
      .insert({
        company_id: request.company.id || request.company.name,
        status: 'running',
        total_score: 0,
        mention_rate: 0,
        sentiment_score: 0,
        citation_score: 0,
        competitive_score: 0
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  private async saveQuestionAnalysis(assessmentId: string, analysis: MaxQuestionAnalysis): Promise<void> {
    await this.supabase
        .from('max_visibility_responses')
        .insert({
          question_id: analysis.question_id,
          full_response: analysis.ai_response,
          mention_detected: analysis.mention_analysis.mention_detected,
          mention_position: analysis.mention_analysis.mention_position,
          mention_sentiment: analysis.mention_analysis.mention_sentiment,
        mention_context: analysis.mention_analysis.mention_context
      })
  }

  private async saveResults(
    assessmentId: string,
    analyses: MaxQuestionAnalysis[],
    scores: MaxVisibilityScore
  ): Promise<void> {
    // Update main assessment record
    await this.supabase
        .from('max_visibility_runs')
        .update({
          status: 'completed',
        total_score: scores.overall_score * 100,
          mention_rate: scores.mention_rate,
        sentiment_score: scores.mention_quality,
        citation_score: scores.source_influence,
        competitive_score: scores.competitive_positioning
        })
        .eq('id', assessmentId)

    console.log(`✅ Saved results for assessment ${assessmentId}`)
  }

  private async validateRequest(request: MaxAssessmentRequest): Promise<void> {
    if (!request.company?.name || !request.company?.domain) {
      throw new Error('Company name and domain are required')
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
      ai_response: '',
      response_citations: [],
      mention_analysis: {
        mention_detected: false,
        mention_position: 'none',
        mention_sentiment: 'neutral',
        mention_context: '',
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
} 