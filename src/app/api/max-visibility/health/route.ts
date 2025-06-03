import { NextRequest, NextResponse } from 'next/server'

/**
 * Health check endpoint for MAX Visibility API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'MAX Visibility API is healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      '/data': 'Get latest visibility results',
      '/assessments': 'Trigger new assessments',
      '/health': 'Health check (this endpoint)'
    }
  })
} 