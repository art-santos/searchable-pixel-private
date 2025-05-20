import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    // Get current user
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the latest site audit summary for this user
    const { data, error: dbError } = await supabase
      .from('site_audit_summary')
      .select('*')
      .eq('user_id', session.user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (dbError || !data) {
      return NextResponse.json({ error: 'No visibility data' }, { status: 404 })
    }

    // Map the data shape for the frontend
    const response = {
      overallScore: data.aeo_score ?? 0,
      scoreHistory: [
        { date: data.started_at, score: data.aeo_score ?? 0 },
      ],
      topics: [],
      citations: {
        owned: data.owned_citations ?? 0,
        operated: data.operated_citations ?? 0,
        earned: data.earned_citations ?? 0,
      },
      competitors: [],
      suggestions: [],
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('visibility-test API error', err)
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}
