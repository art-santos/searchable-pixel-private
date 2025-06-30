import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, root_domain')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get the most recent snapshot for this project domain
    const { data: latestSnapshot } = await supabase
      .from('snapshot_requests')
      .select(`
        id,
        url,
        topic,
        status,
        created_at,
        completed_at,
        snapshot_summaries (
          visibility_score,
          mentions_count,
          total_questions,
          top_competitors,
          insights,
          insights_summary
        ),
        visibility_results (
          id,
          question_text,
          question_number,
          target_found,
          position,
          citation_snippet,
          competitor_names,
          reasoning_summary,
          search_results_metadata
        )
      `)
      .ilike('url', `%${project.root_domain}%`)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // If no snapshot data, return empty state
    if (!latestSnapshot || !latestSnapshot.snapshot_summaries?.[0]) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No visibility data available. Run a snapshot to see results.'
      })
    }

    const summary = latestSnapshot.snapshot_summaries[0]
    const visibilityResults = latestSnapshot.visibility_results || []

    // Calculate score history (mock for now - in production would fetch historical data)
    const scoreHistory = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      const variance = Math.sin(i / 5) * 10
      return {
        date: date.toLocaleDateString(),
        score: Math.max(0, Math.min(100, summary.visibility_score + variance + (i * 0.5)))
      }
    })

    // Extract all unique competitors from visibility results
    const competitorMap = new Map<string, number>()
    visibilityResults.forEach((result: any) => {
      if (result.competitor_names && Array.isArray(result.competitor_names)) {
        result.competitor_names.forEach((name: string) => {
          competitorMap.set(name, (competitorMap.get(name) || 0) + 1)
        })
      }
    })

    // Sort competitors by mention count and take top 5
    const competitors = Array.from(competitorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, mentions], index) => ({
        name,
        score: Math.max(20, 90 - (index * 15)), // Mock scores based on rank
        trend: index < 2 ? Math.floor(Math.random() * 5) : -Math.floor(Math.random() * 3)
      }))

    // Calculate citations breakdown
    const foundCount = visibilityResults.filter((r: any) => r.target_found).length
    const totalQuestions = visibilityResults.length
    const citations = {
      owned: foundCount,
      operated: Math.floor(foundCount * 0.2), // Mock operated citations
      earned: Math.floor(foundCount * 0.3), // Mock earned citations
      competitor: totalQuestions - foundCount
    }

    // Extract topics from questions and group by theme
    const topicMap = new Map<string, { count: number; found: number }>()
    visibilityResults.forEach((result: any) => {
      // Simple topic extraction from question (in production, use NLP)
      const topic = latestSnapshot.topic || 'General'
      const existing = topicMap.get(topic) || { count: 0, found: 0 }
      topicMap.set(topic, {
        count: existing.count + 1,
        found: existing.found + (result.target_found ? 1 : 0)
      })
    })

    const topics = Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      score: Math.round((data.found / data.count) * 100),
      mentions: data.found
    }))

    // Generate suggestions based on results
    const suggestions = []
    
    if (summary.visibility_score < 50) {
      suggestions.push({
        topic: 'Content Coverage',
        suggestion: 'Create comprehensive guides covering the main topics where competitors are mentioned but you are not.',
        priority: 'high'
      })
    }

    if (competitors.length > 3) {
      suggestions.push({
        topic: 'Competitive Positioning',
        suggestion: `Focus on differentiating from ${competitors[0].name} by highlighting your unique features in AI-focused content.`,
        priority: 'medium'
      })
    }

    if (citations.owned < totalQuestions * 0.3) {
      suggestions.push({
        topic: 'Citation Optimization',
        suggestion: 'Improve content structure with clear headings, bullet points, and quotable snippets for better AI extraction.',
        priority: 'high'
      })
    }

    // Calculate overall metrics
    const trend = scoreHistory.length > 1 
      ? scoreHistory[scoreHistory.length - 1].score - scoreHistory[0].score
      : 0

    const rank = summary.visibility_score >= 80 ? 1 : 
                 summary.visibility_score >= 60 ? 2 : 
                 summary.visibility_score >= 40 ? 3 : 4

    const shareOfVoice = Math.round((foundCount / totalQuestions) * 100)

    // Build comprehensive visibility data matching the interface
    const visibilityData = {
      overallScore: summary.visibility_score,
      scoreHistory,
      trend: Math.round(trend),
      rank,
      shareOfVoice,
      topics,
      citations,
      competitors,
      suggestions,
      lastUpdated: latestSnapshot.completed_at || latestSnapshot.created_at,
      
      // Additional data for enhanced UI
      totalQuestions: totalQuestions,
      questionsAnalyzed: visibilityResults,
      snapshotId: latestSnapshot.id,
      topCompetitors: summary.top_competitors || [],
      insights: summary.insights || [],
      insightsSummary: summary.insights_summary || ''
    }

    return NextResponse.json({
      success: true,
      data: visibilityData
    })

  } catch (error: any) {
    console.error('Error fetching visibility data:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch visibility data' },
      { status: 500 }
    )
  }
} 