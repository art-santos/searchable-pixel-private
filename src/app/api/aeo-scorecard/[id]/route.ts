// @ts-nocheck
import { NextResponse } from 'next/server'
import { getScorecard } from '@/services/scorecard/job'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await getScorecard(id)
    return NextResponse.json(data)
  } catch (err) {
    console.error('Failed to fetch scorecard', err)
    return NextResponse.json({ error: 'Failed to fetch scorecard' }, { status: 500 })
  }
}
