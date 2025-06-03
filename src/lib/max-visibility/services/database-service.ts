import { createServiceRoleClient } from '@/lib/supabase/server'
import { MaxQuestionAnalysis, MaxVisibilityScore, MaxAssessmentRequest } from '@/types/max-visibility'
import { PipelineProgress } from '../types/pipeline-types'

export class DatabaseService {
  private supabase: ReturnType<typeof createServiceRoleClient>

  constructor() {
    this.supabase = createServiceRoleClient()
  }

  /**
   * Create assessment record in database
   */
  async createAssessmentRecord(request: MaxAssessmentRequest): Promise<string> {
    const { data, error } = await this.supabase
      .from('max_visibility_runs')
      .insert({
        company_id: request.company.id,
        company_name: request.company.name,
        company_domain: request.company.domain,
        status: 'running',
        progress_percentage: 0,
        progress_stage: 'setup',
        progress_message: 'Initializing assessment...',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('❌ Failed to create assessment record:', error)
      throw new Error(`Failed to create assessment record: ${error.message}`)
    }

    console.log(`📝 Created assessment record: ${data.id}`)
    return data.id
  }

  /**
   * Save question analysis to database
   */
  async saveQuestionAnalysis(assessmentId: string, analysis: MaxQuestionAnalysis): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('max_visibility_question_analyses')
        .insert({
          assessment_id: assessmentId,
          question_id: analysis.question_id,
          question_text: analysis.question_text,
          question_type: analysis.question_type,
          ai_response: analysis.ai_response,
          citations: analysis.citations,
          mention_analysis: analysis.mention_analysis,
          competitive_analysis: analysis.competitive_analysis,
          question_metadata: analysis.question_metadata,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('❌ Failed to save question analysis:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('❌ Error saving question analysis:', error)
      return null
    }
  }

  /**
   * Save final results to database
   */
  async saveResults(
    assessmentId: string,
    analyses: MaxQuestionAnalysis[],
    scores: MaxVisibilityScore
  ): Promise<void> {
    try {
      // Update the main assessment record with final results
      const { error: updateError } = await this.supabase
        .from('max_visibility_runs')
        .update({
          status: 'completed',
          progress_percentage: 100,
          progress_stage: 'complete',
          progress_message: 'Assessment completed successfully',
          overall_score: scores.overall,
          mention_quality: scores.mention_quality,
          competitive_intelligence: scores.competitive_intelligence,
          consistency: scores.consistency,
          citation_quality: scores.citation_quality,
          difficulty_bonus: scores.difficulty_bonus,
          score_breakdown: scores.breakdown,
          total_questions: analyses.length,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId)

      if (updateError) {
        console.error('❌ Failed to update assessment with final results:', updateError)
        throw updateError
      }

      console.log(`✅ Saved final results for assessment ${assessmentId}`)
      console.log(`📊 Overall Score: ${scores.overall}`)
      console.log(`📈 Mention Quality: ${scores.mention_quality.toFixed(1)}`)
      console.log(`🏆 Competitive Intelligence: ${scores.competitive_intelligence.toFixed(1)}`)

    } catch (error) {
      console.error('❌ Failed to save results:', error)
      throw error
    }
  }

  /**
   * Save progress update to database for real-time UI updates
   */
  async saveProgressUpdate(
    assessmentId: string, 
    progress: PipelineProgress
  ): Promise<void> {
    try {
      await this.supabase
        .from('max_visibility_runs')
        .update({
          progress_percentage: progress.completed,
          progress_stage: progress.stage,
          progress_message: progress.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
      
      console.log(`📊 Progress saved: ${progress.completed}% - ${progress.stage} - ${progress.message}`)
    } catch (error) {
      console.error('❌ Failed to save progress update:', error)
      // Don't throw - progress updates shouldn't fail the whole pipeline
    }
  }

  /**
   * Mark assessment as failed
   */
  async markAssessmentFailed(assessmentId: string, error: string): Promise<void> {
    try {
      await this.supabase
        .from('max_visibility_runs')
        .update({
          status: 'failed',
          progress_stage: 'error',
          progress_message: `Assessment failed: ${error}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
      
      console.log(`❌ Marked assessment ${assessmentId} as failed`)
    } catch (dbError) {
      console.error('❌ Failed to mark assessment as failed:', dbError)
    }
  }

  /**
   * Get assessment status
   */
  async getAssessmentStatus(assessmentId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('max_visibility_runs')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (error) {
      console.error('❌ Failed to get assessment status:', error)
      return null
    }

    return data
  }

  /**
   * Get assessment results
   */
  async getAssessmentResults(assessmentId: string): Promise<any> {
    const { data: assessment, error: assessmentError } = await this.supabase
      .from('max_visibility_runs')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (assessmentError) {
      console.error('❌ Failed to get assessment:', assessmentError)
      return null
    }

    const { data: analyses, error: analysesError } = await this.supabase
      .from('max_visibility_question_analyses')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })

    if (analysesError) {
      console.error('❌ Failed to get question analyses:', analysesError)
      return { assessment, analyses: [] }
    }

    return { assessment, analyses }
  }

  /**
   * Delete assessment and related data
   */
  async deleteAssessment(assessmentId: string): Promise<void> {
    try {
      // Delete question analyses first (foreign key constraint)
      await this.supabase
        .from('max_visibility_question_analyses')
        .delete()
        .eq('assessment_id', assessmentId)

      // Delete main assessment record
      await this.supabase
        .from('max_visibility_runs')
        .delete()
        .eq('id', assessmentId)

      console.log(`🗑️ Deleted assessment ${assessmentId} and related data`)
    } catch (error) {
      console.error('❌ Failed to delete assessment:', error)
      throw error
    }
  }

  /**
   * Get company assessments
   */
  async getCompanyAssessments(companyId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('max_visibility_runs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Failed to get company assessments:', error)
      return []
    }

    return data || []
  }
} 