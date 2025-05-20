import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createScorecardJob } from '@/services/scorecard/job'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { url, userId, options } = body
  if (!url || !userId) {
    return NextResponse.json({ error: 'Missing url or userId' }, { status: 400 })
  }
  try {
    const job = await createScorecardJob(url, userId, options)
    return NextResponse.json({ id: job.id, status: job.status })
  } catch (err) {
    console.error('Failed to create scorecard job', err)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
