import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  getTimeframeConfig,
  fetchDataInBatches,
  aggregateVisitsByPeriod,
  generateChartData,
  calculateAverageInterval,
  ChartDataPoint
} from '@/lib/chart-utils'

interface CrawlerVisit {
  timestamp: string
  crawler_name: string
  crawler_company: string
  path: string
  response_time_ms?: number
  workspace_id: string
}

interface CrawlerStats {
  totalCrawls: number
  uniquePaths: number
  avgInterval: string
  lastSeen: string
  company: string
  recentActivity: Array<{
    path: string
    visits: number
    lastVisit: string
    responseTime?: number
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
    const botName = url.searchParams.get('botName')
    const timeframe = url.searchParams.get('timeframe') || 'last7d'
    const workspaceId = url.searchParams.get('workspaceId')
    
    if (!botName || !workspaceId) {
      return NextResponse.json({ error: 'Bot name and workspace ID required' }, { status: 400 })
    }
    
    // Get timeframe configuration
    const config = getTimeframeConfig(timeframe)

    // Fetch visits using optimized batch fetching
    const visits = await fetchDataInBatches<CrawlerVisit>(
      supabase,
      'crawler_visits',
      {
        workspace_id: workspaceId,
        crawler_name: botName,
        gte_timestamp: config.startDate.toISOString()
      },
      'timestamp, crawler_company, path, response_time_ms',
      { column: 'timestamp', ascending: false }
    )

    if (!visits || visits.length === 0) {
      return NextResponse.json({ 
        stats: null,
        chartData: []
      })
    }

    // Calculate stats efficiently
    const pathSet = new Set<string>()
    const pathData = new Map<string, {
      visits: number
      lastVisit: Date
      responseTimes: number[]
    }>()

    // Single pass through visits for all aggregations
    visits.forEach(visit => {
      const path = visit.path
      const visitTime = new Date(visit.timestamp)
      
      pathSet.add(path)
      
      if (!pathData.has(path)) {
        pathData.set(path, {
          visits: 0,
          lastVisit: visitTime,
          responseTimes: []
        })
      }
      
      const data = pathData.get(path)!
      data.visits++
      if (visitTime > data.lastVisit) {
        data.lastVisit = visitTime
      }
      if (visit.response_time_ms) {
        data.responseTimes.push(visit.response_time_ms)
      }
    })

    // Calculate average interval
    const avgInterval = calculateAverageInterval(visits.map(v => v.timestamp))

    // Convert to recent activity array
    const recentActivity = Array.from(pathData.entries())
      .map(([path, data]) => ({
        path,
        visits: data.visits,
        lastVisit: data.lastVisit.toISOString(),
        responseTime: data.responseTimes.length > 0 
          ? Math.round(data.responseTimes.reduce((sum, time) => sum + time, 0) / data.responseTimes.length)
          : undefined
      }))
      .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
      .slice(0, 20) // Limit to 20 most recent

    // Generate chart data using utilities
    const aggregates = aggregateVisitsByPeriod(visits, config.groupBy)
    const chartDataRaw = generateChartData(aggregates, config)
    
    // Transform to match expected format
    const chartData: Array<{ date: string; crawls: number; showLabel?: boolean }> = chartDataRaw.map(point => ({
      date: point.date,
      crawls: point.value,
      showLabel: point.showLabel
    }))

    const stats: CrawlerStats = {
      totalCrawls: visits.length,
      uniquePaths: pathSet.size,
      avgInterval,
      lastSeen: visits[0].timestamp, // Already sorted by timestamp desc
      company: visits[0].crawler_company || 'Unknown',
      recentActivity
    }

    return NextResponse.json({ stats, chartData })

  } catch (error) {
    console.error('Error in crawler-detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 