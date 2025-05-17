import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createScorecardJob } from '@/services/scorecard/job'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get: async (name: string) => cookieStore.get(name)?.value,
        set: async () => {},
        remove: async () => {}
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    if (!body.url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }
    const job = await createScorecardJob({ url: body.url, userId: session.user.id, maxPages: body.options?.maxPages })
    return NextResponse.json(job)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
