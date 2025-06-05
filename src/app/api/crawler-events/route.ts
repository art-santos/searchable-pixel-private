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

interface ApiKeyData {
  user_id: string
  domains: string[] | null
  is_valid: boolean
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
    console.log('[Crawler API] 🔑 FULL API Key received:', JSON.stringify(apiKey))
    console.log('[Crawler API] 🔑 API Key length:', apiKey.length)
    console.log('[Crawler API] 🔒 Key hash:', keyHash.substring(0, 16) + '...')
    console.log('[Crawler API] 🔒 FULL Key hash:', keyHash)

    // Validate API key and get user info
    const { data: keyData, error: keyError } = await supabaseAdmin
      .rpc('validate_api_key', { key_hash: keyHash })
      .single<ApiKeyData>()

    console.log('[Crawler API] 🔍 Key validation result:', { keyData, keyError })

    if (keyError || !keyData || !keyData.is_valid) {
      console.error('[Crawler API] ❌ Invalid API key:', keyError)
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const userId = keyData.user_id
    const allowedDomains = keyData.domains || []
    
    console.log('[Crawler API] ✅ Valid API key for user:', userId)
    console.log('[Crawler API] 🌐 Allowed domains:', allowedDomains)

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

    console.log(`[Crawler API] 📊 Received ${events.length} events for user ${userId}`)

    // Get user's primary workspace for assigning tracked visits (optional for backward compatibility)
    let workspaceId = null
    try {
      const { data: primaryWorkspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single()

      if (primaryWorkspace && !workspaceError) {
        workspaceId = primaryWorkspace.id
        console.log('[Crawler API] 🏢 Using primary workspace:', workspaceId)
      } else {
        console.warn('[Crawler API] ⚠️ No primary workspace found, tracking without workspace assignment')
      }
    } catch (error) {
      console.warn('[Crawler API] ⚠️ Workspace lookup failed, continuing without workspace:', error)
    }

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
      
      // Validate domain if restrictions are set
      if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
        console.warn(`[Crawler API] ⚠️ Domain ${domain} not allowed for this API key. Allowed: ${allowedDomains.join(', ')}`)
        continue
      }

      // Prepare event for insertion
      const crawlerVisit = {
        user_id: userId,
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

      // Add workspace_id only if we have one (for backward compatibility)
      if (workspaceId) {
        crawlerVisit.workspace_id = workspaceId
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
      message: `Successfully processed ${processedEvents.length} crawler events`
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
    version: '0.1.0'
  })
} 