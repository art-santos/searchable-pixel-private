// MAX Visibility Assessment Pipeline - Refactored Architecture
// Clean orchestration using extracted services

import { ConversationalQuestionGenerator } from './question-generator'
import { PerplexityClient } from '../perplexity/client'
import { CompanyContextService } from './services/company-context-service'
import { DatabaseService } from './services/database-service'
import { VisibilityScorer } from './scorers/visibility-scorer'
import { GPT4oAnalyzer } from './analyzers/gpt4o-analyzer'
import { CompetitorUtils } from './utils/competitor-utils'
import {
  MaxAssessmentRequest,
  MaxAssessmentResult,
  MaxQuestionAnalysis,
  MaxVisibilityScore,
  MaxVisibilityError,
  MaxQuestionType
} from '@/types/max-visibility'
import { PipelineProgress, EnhancedCompanyContext } from './types/pipeline-types'

export class MaxVisibilityPipeline {
  private questionGenerator: ConversationalQuestionGenerator
  private perplexityClient: PerplexityClient
  private companyContextService: CompanyContextService
  private databaseService: DatabaseService
  private visibilityScorer: VisibilityScorer
  private gpt4oAnalyzer: GPT4oAnalyzer

  constructor() {
    this.questionGenerator = new ConversationalQuestionGenerator()
    this.perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY!)
    this.companyContextService = new CompanyContextService()
    this.databaseService = new DatabaseService()
    this.visibilityScorer = new VisibilityScorer()
    this.gpt4oAnalyzer = new GPT4oAnalyzer()
  }

  /**
   * Main pipeline orchestration - now much cleaner!
   */
  async runAssessment(
    request: MaxAssessmentRequest,
    onProgress?: (progress: PipelineProgress) => void,
    existingAssessmentId?: string
  ): Promise<MaxAssessmentResult> {
    let assessmentId = existingAssessmentId

    try {
      // Validate request
      await this.validateRequest(request)

      // Create assessment record if not provided
      if (!assessmentId) {
        assessmentId = await this.databaseService.createAssessmentRecord(request)
      }

      // Create progress callback
      const progressCallback = this.createProgressCallback(assessmentId, onProgress)

      // Step 1: Build enhanced company context
      progressCallback({
        stage: 'setup',
        completed: 10,
        total: 100,
        message: 'Building company context from knowledge base...'
      })

      const enhancedContext = await this.companyContextService.buildEnhancedCompanyContext(request.company.id)

      // Step 2: Generate intelligent questions
      progressCallback({
        stage: 'questions',
        completed: 25,
        total: 100,
        message: 'Generating contextual questions...'
      })

      const questions = await this.generateQuestions(request, assessmentId, enhancedContext)

      // Step 3: Get AI responses
      progressCallback({
        stage: 'analysis',
        completed: 40,
        total: 100,
        message: 'Gathering AI responses...'
      })

      const responses = await this.getAIResponses(questions, progressCallback)

      // Step 4: Analyze with GPT-4o
      progressCallback({
        stage: 'analysis',
        completed: 70,
        total: 100,
        message: 'Analyzing responses with GPT-4o...'
      })

      const analyses = await this.gpt4oAnalyzer.analyzeWithGPT4o(responses, request, assessmentId)

      // Step 5: Calculate final scores
      progressCallback({
        stage: 'scoring',
        completed: 90,
        total: 100,
        message: 'Calculating visibility scores...'
      })

      const scores = this.visibilityScorer.calculateFinalScores(analyses)

      // Step 6: Save results
      await this.databaseService.saveResults(assessmentId, analyses, scores)

      progressCallback({
        stage: 'complete',
        completed: 100,
        total: 100,
        message: 'Assessment completed successfully!'
      })

      return {
        assessment_id: assessmentId,
        company: request.company,
        scores,
        analyses,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Pipeline failed:', error)
      
      if (assessmentId) {
        await this.databaseService.markAssessmentFailed(assessmentId, error.message)
      }

      throw this.createMaxVisibilityError(
        'PIPELINE_FAILED',
        `Assessment pipeline failed: ${error.message}`,
        { originalError: error }
      )
    }
  }

  /**
   * Generate questions using enhanced context
   */
  private async generateQuestions(
    request: MaxAssessmentRequest,
    assessmentId: string,
    enhancedContext?: EnhancedCompanyContext
  ): Promise<Array<{ id: string; question: string; type: MaxQuestionType }>> {
    try {
      console.log('🤔 Generating contextual questions...')
      
      const questions = await this.questionGenerator.generateQuestions({
        company: request.company,
        enhancedContext,
        questionCount: 5
      })

      console.log(`✅ Generated ${questions.length} questions`)
      return questions

    } catch (error) {
      console.error('❌ Failed to generate questions:', error)
      throw new Error(`Question generation failed: ${error.message}`)
    }
  }

  /**
   * Get AI responses from Perplexity
   */
  private async getAIResponses(
    questions: Array<{ id: string; question: string; type: MaxQuestionType }>,
    onProgress?: (progress: PipelineProgress) => void
  ): Promise<Array<{ question: typeof questions[0], response: string, citations: string[] }>> {
    const responses: Array<{ question: typeof questions[0], response: string, citations: string[] }> = []
    
    for (const [index, question] of questions.entries()) {
      try {
        console.log(`🔍 Getting AI response for question ${index + 1}/${questions.length}`)
        
        if (onProgress) {
          onProgress({
            stage: 'analysis',
            completed: 40 + (index / questions.length) * 25,
            total: 100,
            message: `Getting AI response ${index + 1}/${questions.length}...`
          })
        }

        const result = await this.perplexityClient.search(question.question)
        
        responses.push({
          question,
          response: result.answer,
          citations: result.citations
        })

        // Rate limiting
        if (index < questions.length - 1) {
          await this.sleep(1000)
        }

      } catch (error) {
        console.error(`❌ Failed to get AI response for question ${question.id}:`, error)
        
        // Add fallback response
        responses.push({
          question,
          response: `Error getting response: ${error.message}`,
          citations: []
        })
      }
    }

    return responses
  }

  /**
   * Create enhanced progress callback that saves to database
   */
  private createProgressCallback(
    assessmentId: string,
    userCallback?: (progress: PipelineProgress) => void
  ): (progress: PipelineProgress) => void {
    return async (progress: PipelineProgress) => {
      // Save to database for status API
      await this.databaseService.saveProgressUpdate(assessmentId, progress)
      
      // Call user callback if provided
      if (userCallback) {
        userCallback(progress)
      }
    }
  }

  /**
   * Validate assessment request
   */
  private async validateRequest(request: MaxAssessmentRequest): Promise<void> {
    if (!request.company?.id || !request.company?.name || !request.company?.domain) {
      throw new Error('Invalid company data in request')
    }
  }

  /**
   * Create standardized error
   */
  private createMaxVisibilityError(
    code: string,
    message: string,
    details?: Record<string, any>
  ): MaxVisibilityError {
    return { code, message, details }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Test methods for individual steps
  async testStep1_buildContext(companyId: string): Promise<EnhancedCompanyContext> {
    return this.companyContextService.buildEnhancedCompanyContext(companyId)
  }

  async testStep2_generateQuestions(
    companyData: {
      id: string
      name: string
      domain: string
      description?: string
      industry?: string
    },
    enhancedContext?: EnhancedCompanyContext
  ): Promise<Array<{ id: string; question: string; type: MaxQuestionType }>> {
    return this.generateQuestions({ company: companyData } as MaxAssessmentRequest, 'test', enhancedContext)
  }

  async testStep3_getAIResponses(
    questions: Array<{ id: string; question: string; type: MaxQuestionType }>
  ): Promise<Array<{ question: typeof questions[0], response: string, citations: string[] }>> {
    return this.getAIResponses(questions)
  }

  async testStep4_analyzeWithGPT4o(
    company: {
      id: string
      name: string
      domain: string
      description?: string
      industry?: string
    },
    responses: Array<{ question: any, response: string, citations: string[] }>
  ): Promise<MaxQuestionAnalysis[]> {
    return this.gpt4oAnalyzer.analyzeWithGPT4o(responses, { company } as MaxAssessmentRequest, 'test')
  }

  testStep5_calculateScores(analyses: MaxQuestionAnalysis[]): MaxVisibilityScore {
    return this.visibilityScorer.calculateFinalScores(analyses)
  }
} 