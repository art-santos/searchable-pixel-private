import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Initialize Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

interface CrawlerEvent {
  timestamp: string
  domain: string
  path: string
  crawlerName: string
  crawlerCompany: string
  crawlerCategory: string
  userAgent: string
  statusCode?: number
  responseTimeMs?: number
  country?: string
  metadata?: Record<string, any>
}

// Hash API key for secure storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

interface ApiKeyValidation {
  user_id: string
  workspace_id: string | null
  is_valid: boolean
  key_type: 'workspace' | 'user'
  permissions: {
    crawler_tracking?: boolean
    read_data?: boolean
  }
}

export async function POST(request: Request) {
  try {
    console.log('[Crawler API] 🚀 Request received')
    
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Crawler API] ❌ Missing authorization header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix
    const keyHash = hashApiKey(apiKey)
    
    console.log('[Crawler API] 🔑 API Key received:', apiKey.substring(0, 20) + '...')
    console.log('[Crawler API] 🔒 Key hash:', keyHash.substring(0, 16) + '...')

    // Validate API key using the new function that checks both workspace and user keys
    const { data: keyData, error: keyError } = await supabaseAdmin
      .rpc('validate_any_api_key', { p_key_hash: keyHash })
      .single<ApiKeyValidation>()

    console.log('[Crawler API] 🔍 Key validation result:', { keyData, keyError })

    if (keyError || !keyData || !keyData.is_valid) {
      console.error('[Crawler API] ❌ Invalid API key:', keyError)
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Check if the key has crawler tracking permission
    if (!keyData.permissions?.crawler_tracking) {
      console.error('[Crawler API] ❌ API key does not have crawler tracking permission')
      return NextResponse.json(
        { error: 'API key does not have permission to track crawler events' },
        { status: 403 }
      )
    }

    const userId = keyData.user_id
    const workspaceId = keyData.workspace_id
    const keyType = keyData.key_type
    
    console.log('[Crawler API] ✅ Valid API key for user:', userId)
    console.log('[Crawler API] 🏢 Workspace:', workspaceId)
    console.log('[Crawler API] 🔑 Key type:', keyType)

    // Parse request body
    const body = await request.json()
    const { events } = body
    
    console.log('[Crawler API] 📦 Request body:', JSON.stringify(body, null, 2))

    if (!events || !Array.isArray(events)) {
      console.log('[Crawler API] ❌ Invalid request body format')
      return NextResponse.json(
        { error: 'Invalid request body. Expected { events: [...] }' },
        { status: 400 }
      )
    }

    console.log(`[Crawler API] 📊 Received ${events.length} events for ${keyType} key`)

    // Process events
    const processedEvents = []
    const dailyStats = new Map() // Key: domain-date-crawler

    for (const event of events) {
      console.log('[Crawler API] 🔄 Processing event:', {
        domain: event.domain,
        path: event.path,
        crawler: event.crawlerName
      })
      
      // Handle both data formats:
      // 1. CrawlerTracker format: { domain, path, crawlerName, crawlerCompany, crawlerCategory }
      // 2. SplitAnalytics format: { url, crawler: {name, company, category} }
      let domain, path, crawlerName, crawlerCompany, crawlerCategory;
      
      if (event.url && event.crawler) {
        // SplitAnalytics format
        const urlObj = new URL(event.url);
        domain = urlObj.hostname;
        path = urlObj.pathname;
        crawlerName = event.crawler.name;
        crawlerCompany = event.crawler.company;
        crawlerCategory = event.crawler.category;
        console.log('[Crawler API] 📝 Using SplitAnalytics format');
      } else {
        // CrawlerTracker format
        domain = event.domain;
        path = event.path;
        crawlerName = event.crawlerName;
        crawlerCompany = event.crawlerCompany;
        crawlerCategory = event.crawlerCategory;
        console.log('[Crawler API] 📝 Using CrawlerTracker format');
      }
      
      console.log('[Crawler API] 🔄 Parsed event:', {
        domain,
        path,
        crawler: crawlerName
      })

      // Prepare event for insertion
      const crawlerVisit = {
        user_id: userId,
        workspace_id: workspaceId, // Always use the workspace from the key
        domain: domain,
        path: path,
        crawler_name: crawlerName,
        crawler_company: crawlerCompany,
        crawler_category: crawlerCategory,
        user_agent: event.userAgent,
        timestamp: event.timestamp,
        status_code: event.statusCode,
        response_time_ms: event.responseTimeMs,
        country: event.country,
        metadata: event.metadata
      }

      processedEvents.push(crawlerVisit)
      console.log('[Crawler API] ✅ Event processed and queued for insertion')

      // Aggregate for daily stats
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      const statsKey = `${domain}-${date}-${crawlerName}`
      
      if (!dailyStats.has(statsKey)) {
        dailyStats.set(statsKey, {
          user_id: userId,
          domain: domain,
          date,
          crawler_name: crawlerName,
          crawler_company: crawlerCompany,
          visit_count: 0,
          paths: new Set(),
          response_times: [],
          countries: {}
        })
      }

      const stats = dailyStats.get(statsKey)!
      stats.visit_count++
      stats.paths.add(path)
      if (event.responseTimeMs) {
        stats.response_times.push(event.responseTimeMs)
      }
      if (event.country) {
        stats.countries[event.country] = (stats.countries[event.country] || 0) + 1
      }
    }

    // Check if user is admin, has payment method, and current usage
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, billing_preferences, stripe_customer_id, subscription_plan, subscription_status')
      .eq('id', userId)
      .single()

    const isAdmin = userProfile?.is_admin || false
    const hasPaymentMethod = !!(userProfile?.stripe_customer_id && userProfile?.subscription_status === 'active')
    const billingPrefs = userProfile?.billing_preferences || {}
    const subscriptionPlan = userProfile?.subscription_plan || 'free'
    
    console.log(`[Crawler API] User status - Admin: ${isAdmin}, Has Card: ${hasPaymentMethod}, Plan: ${subscriptionPlan}`)

    // Admin users bypass everything
    if (isAdmin) {
      console.log('[Crawler API] 👑 Admin user detected, bypassing all billing restrictions')
    }

    // Check if tracking is disabled (but not for admins)
    if (!isAdmin && billingPrefs.ai_logs_enabled === false) {
      console.warn('[Crawler API] ⚠️ AI logs tracking disabled for user, skipping events')
      return NextResponse.json({
        success: false,
        processed: 0,
        message: 'AI crawler tracking is disabled for your account',
        reason: 'tracking_disabled'
      })
    }

    // Check current usage against plan limits (but not for admins or users with payment method)
    if (!isAdmin && !hasPaymentMethod) {
      // Get current billing period to check usage
      const { data: billingPeriod } = await supabaseAdmin
        .rpc('get_current_billing_period', { p_user_id: userId })
        .single()

      if (billingPeriod) {
        const currentUsage = billingPeriod.ai_logs_used || 0
        const planLimit = billingPeriod.ai_logs_included || 0

        console.log(`[Crawler API] Current usage: ${currentUsage}/${planLimit}`)

        if (currentUsage >= planLimit) {
          console.warn('[Crawler API] 🚫 User has reached plan limit without payment method')
          return NextResponse.json({
            success: false,
            processed: 0,
            message: `You've reached your ${subscriptionPlan} plan limit of ${planLimit} crawler logs. Add a payment method to continue tracking.`,
            reason: 'plan_limit_reached',
            action_needed: 'add_payment_method',
            current_usage: currentUsage,
            plan_limit: planLimit
          })
        }
      }
    }

    console.log(`[Crawler API] 💾 About to insert ${processedEvents.length} events into database`)

    // Insert crawler visits
    if (processedEvents.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('crawler_visits')
        .insert(processedEvents)

      if (insertError) {
        console.error('[Crawler API] ❌ Error inserting visits:', insertError)
        throw insertError
      }
      
      console.log('[Crawler API] ✅ Successfully inserted crawler visits')

      // Track usage for billing
      if (!isAdmin) {
        try {
          // Users with payment method: Always track usage (they can go into overage)
          // Users without payment method: Already blocked above if at limit
          if (hasPaymentMethod) {
            console.log('[Crawler API] 💳 User has payment method: Tracking usage for billing')
          }

          // Track the usage in the billing system
          const { error: trackError } = await supabaseAdmin
            .rpc('track_usage_event', {
              p_user_id: userId,
              p_event_type: 'ai_log_tracked',
              p_amount: processedEvents.length,
              p_metadata: {
                source: 'crawler_events_api',
                key_type: keyType,
                workspace_id: workspaceId,
                crawlers: [...new Set(processedEvents.map(e => e.crawler_name))],
                domains: [...new Set(processedEvents.map(e => e.domain))],
                has_payment_method: hasPaymentMethod
              }
            })

          if (trackError) {
            console.error('[Crawler API] ⚠️ Usage tracking failed:', trackError)
          } else {
            console.log('[Crawler API] ✅ Usage tracking successful for', processedEvents.length, 'events')
            
            // If user has payment method, they'll be billed for overages
            // If user doesn't have payment method, they won't reach here if over limit
          }
        } catch (error) {
          console.error('[Crawler API] ⚠️ Usage tracking error:', error)
        }
      } else {
        console.log('[Crawler API] 👑 Admin user: Skipping usage tracking/billing')
      }
    } else {
      console.log('[Crawler API] ⚠️ No events to insert (all filtered out)')
    }

    // Update daily stats
    const statsUpdates = Array.from(dailyStats.values()).map(stats => ({
      user_id: stats.user_id,
      domain: stats.domain,
      date: stats.date,
      crawler_name: stats.crawler_name,
      crawler_company: stats.crawler_company,
      visit_count: stats.visit_count,
      unique_paths: stats.paths.size,
      avg_response_time_ms: stats.response_times.length > 0 
        ? stats.response_times.reduce((a: number, b: number) => a + b, 0) / stats.response_times.length
        : null,
      countries: stats.countries,
      paths: Object.fromEntries(
        Array.from(stats.paths).map(path => [path, 1]) // Simple path counting for now
      )
    }))

    console.log(`[Crawler API] 📈 About to upsert ${statsUpdates.length} daily stats`)

    // Upsert daily stats (merge with existing data)
    for (const update of statsUpdates) {
      const { error: upsertError } = await supabaseAdmin
        .from('crawler_stats_daily')
        .upsert(update, {
          onConflict: 'user_id,domain,date,crawler_name',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('[Crawler API] ❌ Error updating daily stats:', upsertError)
        // Don't fail the request if stats update fails
      }
    }

    console.log('[Crawler API] 🎉 Request completed successfully')

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      message: `Successfully processed ${processedEvents.length} crawler events`,
      workspace_id: workspaceId,
      key_type: keyType
    })

  } catch (error) {
    console.error('[Crawler API] 💥 Fatal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Split Analytics Crawler Events API',
    version: '0.2.0',
    features: ['workspace_keys', 'user_keys', 'permissions']
  })
} 