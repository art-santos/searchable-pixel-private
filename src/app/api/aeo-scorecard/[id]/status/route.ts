import { NextRequest, NextResponse } from 'next/server'
import { getScorecardStatus } from '@/services/scorecard/job'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 })
    const status = await getScorecardStatus(id)
    return NextResponse.json(status)
  } catch (err: any) {
    console.error('getScorecardStatus error', err)
    return NextResponse.json({ message: err.message || 'error' }, { status: 500 })
  }
}
