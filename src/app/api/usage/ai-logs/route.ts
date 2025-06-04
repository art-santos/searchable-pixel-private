import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get user authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      domain,
      aiPlatform,
      queryText,
      mentionContext,
      confidenceScore = 1.0,
      sourceUrl,
      metadata = {}
    } = body

    // Validate required fields
    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    console.log('🤖 Tracking AI log detection:', {
      userId: user.id,
      domain,
      aiPlatform,
      confidenceScore
    })

    // Use service role for database operations
    const serviceSupabase = createServiceRoleClient()

    // Get current billing period
    const { data: billingPeriod, error: billingError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: user.id })
      .single()

    if (billingError || !billingPeriod) {
      console.error('❌ No billing period found for AI log tracking:', billingError)
      return NextResponse.json({ error: 'No active billing period found' }, { status: 404 })
    }

    // Determine if this log will be billed (overage)
    const willBeBilled = billingPeriod.ai_logs_used >= billingPeriod.ai_logs_included
    const costCents = willBeBilled ? 1 : 0 // $0.008 rounded to 1 cent

    // Insert AI crawler log
    const { data: logEntry, error: logError } = await serviceSupabase
      .from('ai_crawler_logs')
      .insert({
        user_id: user.id,
        subscription_usage_id: billingPeriod.usage_id,
        domain,
        ai_platform: aiPlatform,
        query_text: queryText,
        mention_context: mentionContext,
        confidence_score: confidenceScore,
        source_url: sourceUrl,
        billed: willBeBilled,
        cost_cents: costCents,
        metadata
      })
      .select()
      .single()

    if (logError) {
      console.error('❌ Error inserting AI log:', logError)
      return NextResponse.json({ error: 'Failed to track AI log' }, { status: 500 })
    }

    // Track usage event (this will update the subscription_usage counters)
    const { data: eventId, error: eventError } = await serviceSupabase
      .rpc('track_usage_event', {
        p_user_id: user.id,
        p_event_type: 'ai_log_detected',
        p_amount: 1,
        p_metadata: {
          ai_log_id: logEntry.id,
          domain,
          ai_platform: aiPlatform,
          confidence_score: confidenceScore,
          billed: willBeBilled
        }
      })

    if (eventError) {
      console.error('❌ Error tracking usage event:', eventError)
      // Don't fail the request since the log was already saved
    }

    console.log('✅ AI log tracked successfully:', {
      logId: logEntry.id,
      billed: willBeBilled,
      costCents
    })

    return NextResponse.json({
      success: true,
      logId: logEntry.id,
      billed: willBeBilled,
      costCents,
      usage: {
        used: billingPeriod.ai_logs_used + 1,
        included: billingPeriod.ai_logs_included,
        remaining: Math.max(0, billingPeriod.ai_logs_included - (billingPeriod.ai_logs_used + 1))
      }
    })

  } catch (error) {
    console.error('💥 Error in AI logs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const domain = searchParams.get('domain')
    const platform = searchParams.get('platform')

    // Use service role for database operations
    const serviceSupabase = createServiceRoleClient()

    // Build query
    let query = serviceSupabase
      .from('ai_crawler_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add filters
    if (domain) {
      query = query.eq('domain', domain)
    }
    if (platform) {
      query = query.eq('ai_platform', platform)
    }

    const { data: logs, error: logsError } = await query

    if (logsError) {
      console.error('❌ Error fetching AI logs:', logsError)
      return NextResponse.json({ error: 'Failed to fetch AI logs' }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        limit,
        offset,
        total: logs?.length || 0
      }
    })

  } catch (error) {
    console.error('💥 Error in AI logs GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 