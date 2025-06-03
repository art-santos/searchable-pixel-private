import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/max-visibility/features
 * Returns user's subscription features and access levels for MAX Visibility
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

    // Get user's subscription from subscriptions table
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Default to free plan if no subscription found
    const plan = subscription?.plan || 'free'
    const hasMaxAccess = plan === 'plus' || plan === 'pro'

    // Get usage data (simplified for now)
    const { data: assessments, error: assessmentsError } = await supabase
      .from('max_visibility_runs')
      .select('id, created_at')
      .eq('triggered_by', user.id)
      .order('created_at', { ascending: false })

    const scansUsed = assessments?.length || 0
    const lastScan = assessments?.[0]?.created_at || null

    // Define feature access based on plan
    const features = {
      citations: true,                    // Available to all users
      competitive: hasMaxAccess,          // MAX feature
      gaps: hasMaxAccess,                 // MAX feature  
      insights: hasMaxAccess,             // MAX feature
      trends: hasMaxAccess,               // MAX feature
      recommendations: hasMaxAccess,      // MAX feature
      export: hasMaxAccess                // MAX feature
    }

    // Define usage limits based on plan
    const scansLimit = plan === 'free' ? 3 : plan === 'plus' ? 50 : 1000

    return NextResponse.json({
      success: true,
      data: {
        plan: plan,
        has_max_access: hasMaxAccess,
        features: features,
        usage: {
          scans_used: scansUsed,
          scans_limit: scansLimit,
          last_scan: lastScan
        }
      }
    })

  } catch (error) {
    console.error('Features API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve feature access',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
} 