import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface TopicVisibility {
  topic: string
  score: number
}

interface VisibilitySuggestion {
  topic: string
  suggestion: string
}

export async function GET(request: NextRequest) {
  try {
    // Create a direct Supabase admin client for server operations
    const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the latest site audit summary for this user
    const { data, error: dbError } = await supabase
      .from('site_audit_summary')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (dbError || !data) {
      return NextResponse.json({ error: 'No visibility data' }, { status: 404 })
    }

    // Fetch topic visibility data if available (optional)
    let topics: TopicVisibility[] = []
    try {
      const { data: topicData } = await supabase
        .from('topic_visibility')
        .select('topic, score')
        .eq('audit_id', data.id)
        .limit(5)
      
      if (topicData && topicData.length > 0) {
        topics = topicData as TopicVisibility[]
      }
    } catch (err) {
      console.warn('Failed to fetch topic visibility data', err)
      // Continue with empty topics - not critical
    }

    // Fetch suggestions if available (optional)
    let suggestions: VisibilitySuggestion[] = []
    try {
      const { data: suggestionData } = await supabase
        .from('visibility_suggestions')
        .select('topic, suggestion')
        .eq('audit_id', data.id)
        .limit(5)
      
      if (suggestionData && suggestionData.length > 0) {
        suggestions = suggestionData as VisibilitySuggestion[]
      }
    } catch (err) {
      console.warn('Failed to fetch suggestion data', err)
      // Continue with empty suggestions - not critical
    }

    // Map the data shape for the frontend
    const response = {
      overallScore: data.aeo_score ?? 0,
      scoreHistory: [
        { date: data.started_at, score: data.aeo_score ?? 0 },
      ],
      topics: topics.length > 0 ? topics : [
        { topic: 'AI research', score: 78 },
        { topic: 'Productivity tools', score: 65 },
        { topic: 'Knowledge management', score: 52 }
      ],
      citations: {
        owned: data.owned_citations ?? 0,
        operated: data.operated_citations ?? 0,
        earned: data.earned_citations ?? 0,
      },
      competitors: [],
      suggestions: suggestions.length > 0 ? suggestions : [
        { topic: 'Content Creation', suggestion: 'Add more content about AI capabilities' }
      ]
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('visibility-test API error', err)
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}
