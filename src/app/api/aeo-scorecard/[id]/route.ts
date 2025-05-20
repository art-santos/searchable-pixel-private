import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getScorecard } from '@/services/scorecard/job'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getScorecard(params.id)
    return NextResponse.json(data)
  } catch (err) {
    console.error('Failed to fetch scorecard', err)
    return NextResponse.json({ error: 'Failed to fetch scorecard' }, { status: 500 })
  }
}
