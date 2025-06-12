import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
    
    // Calculate date range based on timeframe
    let startDate = new Date()
    let chartPeriods = 7
    let isHourly = false
    
    switch (timeframe.toLowerCase()) {
      case 'last24h':
        startDate.setHours(startDate.getHours() - 24)
        chartPeriods = 24 // 24 hours
        isHourly = true
        break
      case 'last7d':
        startDate.setDate(startDate.getDate() - 7)
        chartPeriods = 7
        break
      case 'last30d':
        startDate.setDate(startDate.getDate() - 30)
        chartPeriods = 30
        break
      case 'last90d':
        startDate.setDate(startDate.getDate() - 90)
        chartPeriods = 90
        break
      case 'last365d':
        startDate.setDate(startDate.getDate() - 365)
        chartPeriods = 365
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
        chartPeriods = 7
    }

    // Query crawler visits for the specific page with pagination
    let allVisits: any[] = []
    let hasMore = true
    let offset = 0
    const limit = 1000

    while (hasMore) {
      const { data: visits, error } = await supabase
        .from('crawler_visits')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('path', pagePath)
        .gte('timestamp', startDate.toISOString())
        .range(offset, offset + limit - 1)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching page visits:', error)
        return NextResponse.json({ error: 'Failed to fetch page data' }, { status: 500 })
      }

      if (!visits || visits.length === 0) {
        hasMore = false
      } else {
        allVisits = allVisits.concat(visits)
        hasMore = visits.length === limit
        offset += limit
      }
    }

    const visits = allVisits

    if (!visits || visits.length === 0) {
      return NextResponse.json({ 
        stats: null,
        chartData: []
      })
    }

    // Calculate stats
    const totalVisits = visits.length
    const uniqueCrawlers = new Set(visits.map(v => v.crawler_name)).size
    const lastCrawled = visits[0].timestamp // Already sorted by timestamp desc
    
    // Calculate crawler diversity (number of unique crawler companies)
    const uniqueCompanies = new Set(visits.map(v => v.crawler_company)).size

    // Group visits by crawler for recent activity
    const crawlerData = new Map<string, {
      visits: number
      lastVisit: Date
      company: string
      responseTimes: number[]
    }>()

    visits.forEach(visit => {
      const botName = visit.crawler_name
      const visitTime = new Date(visit.timestamp)
      
      if (!crawlerData.has(botName)) {
        crawlerData.set(botName, {
          visits: 0,
          lastVisit: visitTime,
          company: visit.crawler_company || 'Unknown',
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

    // Generate chart data
    const chartData = []
    const now = new Date()
    
    for (let i = chartPeriods - 1; i >= 0; i--) {
      const date = new Date(now)
      
      if (isHourly) {
        // For hourly data, go back by hours
        date.setHours(date.getHours() - i)
      } else {
        // For daily data, go back by days
        date.setDate(date.getDate() - i)
      }
      
      const periodStart = new Date(date)
      const periodEnd = new Date(date)
      
      if (isHourly) {
        // Set to the start and end of the hour
        periodStart.setMinutes(0, 0, 0)
        periodEnd.setMinutes(59, 59, 999)
      } else {
        // Set to the start and end of the day
        periodStart.setHours(0, 0, 0, 0)
        periodEnd.setHours(23, 59, 59, 999)
      }
      
      const periodVisits = visits.filter(visit => {
        const visitTime = new Date(visit.timestamp)
        return visitTime >= periodStart && visitTime <= periodEnd
      }).length
      
      chartData.push({
        date: periodStart.toISOString(),
        visits: periodVisits,
        showLabel: isHourly ? (i % 2 === 0) : true // For hourly, show every other label to avoid crowding
      })
    }

    const stats = {
      totalVisits,
      uniqueCrawlers,
      uniqueCompanies,
      lastCrawled,
      path: pagePath,
      recentVisits
    }

    // Debug logging for 24h timeframe
    if (timeframe === 'last24h') {
      console.log(`[Page Detail API] 24h Debug:`, {
        totalVisits,
        chartDataLength: chartData.length,
        chartDataSample: chartData.slice(0, 3),
        visitsCount: visits.length,
        timeframe,
        isHourly,
        chartPeriods
      })
    }

    return NextResponse.json({ stats, chartData })

  } catch (error) {
    console.error('Error in page-detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 