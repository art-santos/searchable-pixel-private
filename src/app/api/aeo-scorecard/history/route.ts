import { NextResponse } from 'next/server'

export async function GET() {
  // No persistence implemented, return empty list
  return NextResponse.json([])
}
