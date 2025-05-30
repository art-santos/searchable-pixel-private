import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { resetMonthlyUsage, cleanupOldData } from '@/lib/subscription/usage'

// This endpoint should be secured - only allow calls from your cron service
export async function POST(req: NextRequest) {
  try {
    const headersList = headers()
    const authHeader = headersList.get('authorization')
    
    // Check if running on Vercel
    if (process.env.VERCEL) {
      // Vercel cron jobs include a special header
      const vercelSignature = headersList.get('x-vercel-signature')
      const vercelCron = headersList.get('x-vercel-cron')
      
      // Verify it's a legitimate Vercel cron request
      if (!vercelCron || vercelCron !== '1') {
        // Not a Vercel cron job, check for manual token
        const expectedToken = process.env.CRON_SECRET_TOKEN
        if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
      // If it's a Vercel cron job, it's authenticated by Vercel
    } else {
      // For external cron services or self-hosted
      const expectedToken = process.env.CRON_SECRET_TOKEN
      
      if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    // Log cron execution
    console.log('[CRON] Starting usage reset and cleanup', {
      timestamp: new Date().toISOString(),
      source: process.env.VERCEL ? 'vercel-cron' : 'external'
    })
    
    // Reset monthly usage for users whose billing period has ended
    await resetMonthlyUsage()
    
    // Clean up old data based on retention policies
    await cleanupOldData()
    
    console.log('[CRON] Completed successfully')
    
    return NextResponse.json({ 
      success: true,
      message: 'Usage reset and cleanup completed',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[CRON] Error:', error)
    return NextResponse.json(
      { error: 'Failed to reset usage' },
      { status: 500 }
    )
  }
}

// Also support GET for easier testing (remove in production)
export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }
  
  console.log('[CRON] Test execution via GET')
  return POST(req)
} 