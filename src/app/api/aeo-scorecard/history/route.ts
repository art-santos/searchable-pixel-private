import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getScorecardHistory } from '@/services/scorecard/job'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }
  try {
    const data = await getScorecardHistory(userId)
    return NextResponse.json(data)
  } catch (err) {
    console.error('Failed to fetch history', err)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
