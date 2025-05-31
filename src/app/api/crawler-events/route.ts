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
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix
    const keyHash = hashApiKey(apiKey)

    // Validate API key and get user info
    const { data: keyData, error: keyError } = await supabaseAdmin
      .rpc('validate_api_key', { key_hash: keyHash })
      .single<ApiKeyData>()

    if (keyError || !keyData || !keyData.is_valid) {
      console.error('[Crawler API] Invalid API key:', keyError)
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const userId = keyData.user_id
    const allowedDomains = keyData.domains || []

    // Parse request body
    const body = await request.json()
    const { events } = body

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { events: [...] }' },
        { status: 400 }
      )
    }

    console.log(`[Crawler API] Received ${events.length} events for user ${userId}`)

    // Process events
    const processedEvents = []
    const dailyStats = new Map() // Key: domain-date-crawler

    for (const event of events) {
      // Validate domain if restrictions are set
      if (allowedDomains.length > 0 && !allowedDomains.includes(event.domain)) {
        console.warn(`[Crawler API] Domain ${event.domain} not allowed for this API key`)
        continue
      }

      // Prepare event for insertion
      const crawlerVisit = {
        user_id: userId,
        domain: event.domain,
        path: event.path,
        crawler_name: event.crawlerName,
        crawler_company: event.crawlerCompany,
        crawler_category: event.crawlerCategory,
        user_agent: event.userAgent,
        timestamp: event.timestamp,
        status_code: event.statusCode,
        response_time_ms: event.responseTimeMs,
        country: event.country,
        metadata: event.metadata
      }

      processedEvents.push(crawlerVisit)

      // Aggregate for daily stats
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      const statsKey = `${event.domain}-${date}-${event.crawlerName}`
      
      if (!dailyStats.has(statsKey)) {
        dailyStats.set(statsKey, {
          user_id: userId,
          domain: event.domain,
          date,
          crawler_name: event.crawlerName,
          crawler_company: event.crawlerCompany,
          visit_count: 0,
          paths: new Set(),
          response_times: [],
          countries: {}
        })
      }

      const stats = dailyStats.get(statsKey)!
      stats.visit_count++
      stats.paths.add(event.path)
      if (event.responseTimeMs) {
        stats.response_times.push(event.responseTimeMs)
      }
      if (event.country) {
        stats.countries[event.country] = (stats.countries[event.country] || 0) + 1
      }
    }

    // Insert crawler visits
    if (processedEvents.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('crawler_visits')
        .insert(processedEvents)

      if (insertError) {
        console.error('[Crawler API] Error inserting visits:', insertError)
        throw insertError
      }
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

    // Upsert daily stats (merge with existing data)
    for (const update of statsUpdates) {
      const { error: upsertError } = await supabaseAdmin
        .from('crawler_stats_daily')
        .upsert(update, {
          onConflict: 'user_id,domain,date,crawler_name',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('[Crawler API] Error updating daily stats:', upsertError)
        // Don't fail the request if stats update fails
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      message: `Successfully processed ${processedEvents.length} crawler events`
    })

  } catch (error) {
    console.error('[Crawler API] Error:', error)
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