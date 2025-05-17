import { NextRequest, NextResponse } from 'next/server'
import { getScorecardResult } from '@/services/scorecard/job'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getScorecardResult(params.id)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
