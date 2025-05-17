import { NextRequest, NextResponse } from 'next/server'
import { checkVisibility } from '@/services/visibility'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await checkVisibility(body)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 400 })
  }
}
