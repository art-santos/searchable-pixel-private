import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  getTimeframeConfig,
  fetchDataInBatches,
  aggregateVisitsByPeriod,
  generateChartData,
  formatRelativeTime,
  ChartDataPoint
} from '@/lib/chart-utils'
import { getCache, generateCacheKey, CACHE_TTL } from '@/lib/cache-utils'

interface CrawlerVisit {
  timestamp: string
  crawler_name: string
  crawler_company: string
  path: string
  response_time_ms?: number
  workspace_id: string
}

interface PageStats {
  totalVisits: number
  uniqueCrawlers: number
  uniqueCompanies: number
  lastCrawled: string
  path: string
  recentVisits: Array<{
    botName: string
    company: string
    visits: number
    lastVisit: string
    avgResponseTime?: number
  }>
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const url = new URL(request.url)
    const pagePath = url.searchParams.get('pagePath')
    const timeframe = url.searchParams.get('timeframe') || 'last7d'
    const workspaceId = url.searchParams.get('workspaceId')
    
    if (!pagePath || !workspaceId) {
      return NextResponse.json({ error: 'Page path and workspace ID required' }, { status: 400 })
    }

    // Check cache first
    const cache = getCache()
    const cacheKey = generateCacheKey('page-detail', {
      pagePath,
      timeframe,
      workspaceId,
      userId: user.id
    })
    
    const cachedData = cache.get<{ stats: PageStats; chartData: any[] }>(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }
    
    // Get timeframe configuration
    const config = getTimeframeConfig(timeframe)

    // Fetch visits using optimized batch fetching
    const visits = await fetchDataInBatches<CrawlerVisit>(
      supabase,
      'crawler_visits',
      {
        workspace_id: workspaceId,
        path: pagePath,
        gte_timestamp: config.startDate.toISOString()
      },
      'timestamp, crawler_name, crawler_company, response_time_ms',
      { column: 'timestamp', ascending: false }
    )

    if (!visits || visits.length === 0) {
      return NextResponse.json({ 
        stats: null,
        chartData: []
      })
    }

    // Calculate stats efficiently
    const crawlerSet = new Set<string>()
    const companySet = new Set<string>()
    const crawlerData = new Map<string, {
      visits: number
      lastVisit: Date
      company: string
      responseTimes: number[]
    }>()

    // Single pass through visits for all aggregations
    visits.forEach(visit => {
      const botName = visit.crawler_name
      const company = visit.crawler_company || 'Unknown'
      const visitTime = new Date(visit.timestamp)
      
      crawlerSet.add(botName)
      companySet.add(company)
      
      if (!crawlerData.has(botName)) {
        crawlerData.set(botName, {
          visits: 0,
          lastVisit: visitTime,
          company,
          responseTimes: []
        })
      }
      
      const data = crawlerData.get(botName)!
      data.visits++
      if (visitTime > data.lastVisit) {
        data.lastVisit = visitTime
      }
      if (visit.response_time_ms) {
        data.responseTimes.push(visit.response_time_ms)
      }
    })

    // Convert to recent visits array
    const recentVisits = Array.from(crawlerData.entries())
      .map(([botName, data]) => ({
        botName,
        company: data.company,
        visits: data.visits,
        lastVisit: data.lastVisit.toISOString(),
        avgResponseTime: data.responseTimes.length > 0 
          ? Math.round(data.responseTimes.reduce((sum, time) => sum + time, 0) / data.responseTimes.length)
          : undefined
      }))
      .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
      .slice(0, 20) // Limit to 20 most recent

    // Generate chart data using utilities
    const aggregates = aggregateVisitsByPeriod(visits, config.groupBy)
    const chartDataRaw = generateChartData(aggregates, config)
    
    // Transform to match expected format
    const chartData: Array<{ date: string; visits: number; showLabel?: boolean }> = chartDataRaw.map(point => ({
      date: point.date,
      visits: point.value,
      showLabel: point.showLabel
    }))

    const stats: PageStats = {
      totalVisits: visits.length,
      uniqueCrawlers: crawlerSet.size,
      uniqueCompanies: companySet.size,
      lastCrawled: visits[0].timestamp, // Already sorted by timestamp desc
      path: pagePath,
      recentVisits
    }

    const response = { stats, chartData }
    
    // Cache the response
    cache.set(cacheKey, response, CACHE_TTL.CHART_DATA)
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in page-detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 