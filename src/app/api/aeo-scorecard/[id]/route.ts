import { NextResponse, NextRequest } from 'next/server'
import { getScorecardResult } from '@/services/scorecard/job'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 })
    const result = await getScorecardResult(id)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('getScorecardResult error', err)
    return NextResponse.json({ message: err.message || 'error' }, { status: 500 })
  }
}
