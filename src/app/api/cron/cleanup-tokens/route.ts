import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    
    console.log('[Token Cleanup] Starting token cleanup job...')

    // Call the cleanup function
    const { data, error } = await supabase.rpc('cleanup_expired_tokens')

    if (error) {
      console.error('[Token Cleanup] Error cleaning up tokens:', error)
      return NextResponse.json(
        { error: 'Failed to cleanup tokens', details: error.message },
        { status: 500 }
      )
    }

    console.log('[Token Cleanup] Cleanup completed:', data)

    return NextResponse.json({
      success: true,
      message: 'Token cleanup completed successfully',
      data: data
    })

  } catch (error) {
    console.error('[Token Cleanup] Job error:', error)
    return NextResponse.json(
      { 
        error: 'Token cleanup job failed',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 