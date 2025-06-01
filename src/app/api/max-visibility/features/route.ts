// API Route: MAX Visibility Feature Access
// GET /api/max-visibility/features

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Unauthorized'
        }, 
        { status: 401 }
      )
    }

    // Get user's subscription information
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Determine access based on subscription plan
    const plan = subscription?.plan || 'free'
    const hasMaxAccess = plan === 'plus' || plan === 'pro'

    // Get usage information (simplified for now)
    const { data: assessments, error: assessmentError } = await supabase
      .from('max_visibility_runs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    const scansUsed = assessments?.length || 0
    const lastScan = assessments?.[0]?.created_at || null

    const featureAccess = {
      plan: plan,
      has_max_access: hasMaxAccess,
      features: {
        citations: true,
        competitive: hasMaxAccess,
        gaps: hasMaxAccess,
        insights: hasMaxAccess,
        trends: hasMaxAccess,
        recommendations: hasMaxAccess,
        export: hasMaxAccess
      },
      usage: {
        scans_used: scansUsed,
        scans_limit: plan === 'free' ? 1 : plan === 'visibility' ? 10 : plan === 'plus' ? 50 : 100,
        last_scan: lastScan
      }
    }

    return NextResponse.json({
      success: true,
      data: featureAccess,
      error: null
    })

  } catch (error) {
    console.error('Feature access error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: 'Failed to get feature access: ' + (error as Error).message
      },
      { status: 500 }
    )
  }
} 