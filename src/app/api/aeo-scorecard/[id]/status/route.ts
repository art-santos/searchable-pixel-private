import { NextRequest, NextResponse } from 'next/server'
import { getScorecardStatus } from '@/services/scorecard/job'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const status = await getScorecardStatus(params.id)
    return NextResponse.json(status)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
