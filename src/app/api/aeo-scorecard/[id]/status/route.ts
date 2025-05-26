import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getScorecardStatus } from '@/services/scorecard/job'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await getScorecardStatus(id)
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ id: data.id, status: data.status })
  } catch (err) {
    console.error('Failed to fetch scorecard status', err)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
