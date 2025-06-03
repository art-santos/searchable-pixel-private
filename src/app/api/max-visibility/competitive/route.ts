import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/max-visibility/competitive
 * Returns competitive analysis from completed MAX Visibility assessments
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Return placeholder competitive data for now
    return NextResponse.json({
      success: true,
      data: {
        user_rank: 1,
        total_competitors: 1,
        competitors: [],
        market_insights: {
          message: "Run a MAX Visibility scan to see competitive analysis"
        }
      }
    })

  } catch (error) {
    console.error('Competitive API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve competitive analysis',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
} 