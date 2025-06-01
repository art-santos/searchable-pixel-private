// API Route: MAX Visibility Assessment Results
// GET /api/max-visibility/results/[assessmentId]

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    assessmentId: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { assessmentId } = params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Get assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('max_assessments')
      .select(`
        id,
        assessment_type,
        status,
        visibility_scores,
        config,
        started_at,
        completed_at,
        companies!inner(id, name, domain, description, industry)
      `)
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from('max_assessment_questions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('sequence_number')

    if (questionsError) {
      throw questionsError
    }

    // Get question analyses
    const { data: analyses, error: analysesError } = await supabase
      .from('max_question_analyses')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('processed_at')

    if (analysesError) {
      throw analysesError
    }

    // Build comprehensive result
    const result = {
      assessment: {
        id: assessment.id,
        company: assessment.companies,
        assessment_type: assessment.assessment_type,
        status: assessment.status,
        visibility_scores: assessment.visibility_scores,
        config: assessment.config,
        started_at: assessment.started_at,
        completed_at: assessment.completed_at
      },
      questions: questions || [],
      question_analyses: analyses || [],
      summary: {
        total_questions: questions?.length || 0,
        completed_analyses: analyses?.length || 0,
        progress_percentage: questions?.length 
          ? Math.round((analyses?.length || 0) / questions.length * 100)
          : 0
      }
    }

    // Add analysis summary if assessment is complete
    if (assessment.status === 'completed' && analyses?.length) {
      const mentionedQuestions = analyses.filter(a => {
        // Handle both direct boolean and nested object structure
        const mentionDetected = typeof a.mention_analysis === 'boolean' 
          ? a.mention_analysis 
          : a.mention_analysis?.mention_detected
        return mentionDetected
      }).length
      
      const avgQuestionScore = analyses.reduce((sum, a) => 
        sum + (a.question_score || 0), 0
      ) / analyses.length

      const citationStats = calculateCitationStats(analyses)

      result.summary = {
        ...result.summary,
        mentioned_questions: mentionedQuestions,
        mention_rate: mentionedQuestions / analyses.length,
        avg_question_score: avgQuestionScore,
        citation_stats: citationStats
      } as typeof result.summary & {
        mentioned_questions: number
        mention_rate: number
        avg_question_score: number
        citation_stats: any
      }
    }

    return NextResponse.json({
      success: true,
      result: result
    })

  } catch (error) {
    console.error('Assessment results error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve assessment results',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate citation statistics
function calculateCitationStats(analyses: any[]) {
  const allCitations = analyses.flatMap(a => a.citation_analysis || [])
  
  const stats = {
    total_citations: allCitations.length,
    owned: 0,
    operated: 0,
    earned: 0,
    competitor: 0,
    avg_influence_score: 0,
    avg_relevance_score: 0
  }

  if (allCitations.length === 0) return stats

  let totalInfluence = 0
  let totalRelevance = 0

  for (const citation of allCitations) {
    stats[citation.bucket as keyof typeof stats]++
    totalInfluence += citation.influence_score || 0
    totalRelevance += citation.relevance_score || 0
  }

  stats.avg_influence_score = totalInfluence / allCitations.length
  stats.avg_relevance_score = totalRelevance / allCitations.length

  return stats
} 