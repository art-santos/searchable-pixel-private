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
    const botName = url.searchParams.get('botName')
    const timeframe = url.searchParams.get('timeframe') || 'last7d'
    const workspaceId = url.searchParams.get('workspaceId')
    
    if (!botName || !workspaceId) {
      return NextResponse.json({ error: 'Bot name and workspace ID required' }, { status: 400 })
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

    // Query crawler visits for the specific bot with pagination
    let allVisits: any[] = []
    let hasMore = true
    let offset = 0
    const limit = 1000

    while (hasMore) {
      const { data: visits, error } = await supabase
        .from('crawler_visits')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('crawler_name', botName)
        .gte('timestamp', startDate.toISOString())
        .range(offset, offset + limit - 1)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching crawler visits:', error)
        return NextResponse.json({ error: 'Failed to fetch crawler data' }, { status: 500 })
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
    const totalCrawls = visits.length
    const uniquePaths = new Set(visits.map(v => v.path)).size
    const lastSeen = visits[0].timestamp // Already sorted by timestamp desc
    const company = visits[0].crawler_company || 'Unknown'

    // Calculate average interval
    const sortedVisits = visits.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    let avgInterval = 'N/A'
    
    if (sortedVisits.length > 1) {
      const intervals = []
      for (let i = 1; i < sortedVisits.length; i++) {
        const prev = new Date(sortedVisits[i - 1].timestamp).getTime()
        const curr = new Date(sortedVisits[i].timestamp).getTime()
        intervals.push(curr - prev)
      }
      
      const avgMs = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      const avgHours = avgMs / (1000 * 60 * 60)
      
      if (avgHours < 1) {
        avgInterval = `${Math.round(avgMs / (1000 * 60))}m`
      } else if (avgHours < 24) {
        avgInterval = `${Math.round(avgHours * 10) / 10}h`
      } else {
        avgInterval = `${Math.round((avgHours / 24) * 10) / 10}d`
      }
    }

    // Group visits by path for recent activity
    const pathData = new Map<string, {
      visits: number
      lastVisit: Date
      responseTimes: number[]
    }>()

    visits.forEach(visit => {
      const path = visit.path
      const visitTime = new Date(visit.timestamp)
      
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
        crawls: periodVisits,
        showLabel: isHourly ? (i % 2 === 0) : true // For hourly, show every other label to avoid crowding
      })
    }

    const stats = {
      totalCrawls,
      uniquePaths,
      avgInterval,
      lastSeen,
      company,
      recentActivity
    }

    return NextResponse.json({ stats, chartData })

  } catch (error) {
    console.error('Error in crawler-detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 