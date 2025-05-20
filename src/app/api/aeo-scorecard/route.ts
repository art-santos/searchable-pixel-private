import { NextRequest, NextResponse } from 'next/server'
import { createScorecardJob } from '@/services/scorecard/job'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, userId, options } = body
    if (!url || !userId) {
      return NextResponse.json({ message: 'url and userId required' }, { status: 400 })
    }
    const job = await createScorecardJob(url, userId, options)
    return NextResponse.json(job)
  } catch (err: any) {
    console.error('createScorecardJob error', err)
    return NextResponse.json({ message: err.message || 'error' }, { status: 500 })
  }
}

export async function GET() {
  // Placeholder: no persistence yet
  return NextResponse.json([])
}
