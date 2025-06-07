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
    const timeframe = url.searchParams.get('timeframe') || 'last7d'
    const workspaceId = url.searchParams.get('workspaceId')
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }
    
    // Calculate date range based on timeframe
    let startDate = new Date()
    
    switch (timeframe.toLowerCase()) {
      case 'last24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case 'last7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'last30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Query crawler visits for the workspace and timeframe with pagination
    let allVisits: any[] = []
    let hasMore = true
    let offset = 0
    const limit = 1000

    while (hasMore) {
      const { data: visits, error } = await supabase
        .from('crawler_visits')
        .select('crawler_company, crawler_name, path, timestamp, response_time_ms')
        .eq('workspace_id', workspaceId)
        .gte('timestamp', startDate.toISOString())
        .range(offset, offset + limit - 1)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching companies:', error)
        return NextResponse.json({ error: 'Failed to fetch company data' }, { status: 500 })
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
      return NextResponse.json({ companies: [] })
    }

    // Group by company
    const companyStats = new Map<string, {
      totalCrawls: number
      uniquePaths: Set<string>
      crawlers: Set<string>
      lastSeen: Date
      responseTimes: number[]
    }>()

    visits.forEach(visit => {
      const company = visit.crawler_company
      const visitTime = new Date(visit.timestamp)
      
      if (companyStats.has(company)) {
        const stats = companyStats.get(company)!
        stats.totalCrawls++
        stats.uniquePaths.add(visit.path)
        stats.crawlers.add(visit.crawler_name)
        if (visitTime > stats.lastSeen) {
          stats.lastSeen = visitTime
        }
        if (visit.response_time_ms) {
          stats.responseTimes.push(visit.response_time_ms)
        }
      } else {
        companyStats.set(company, {
          totalCrawls: 1,
          uniquePaths: new Set([visit.path]),
          crawlers: new Set([visit.crawler_name]),
          lastSeen: visitTime,
          responseTimes: visit.response_time_ms ? [visit.response_time_ms] : []
        })
      }
    })

    // Calculate average intervals (simplified)
    const formatRelativeTime = (date: Date) => {
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      
      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    }

    const calculateAvgInterval = (totalCrawls: number, timeframeDays: number) => {
      if (totalCrawls <= 1) return 'N/A'
      const avgHours = (timeframeDays * 24) / totalCrawls
      if (avgHours < 1) return `${Math.round(avgHours * 60)}m`
      if (avgHours < 24) return `${Math.round(avgHours * 10) / 10}h`
      return `${Math.round(avgHours / 24 * 10) / 10}d`
    }

    const timeframeDays = timeframe === 'last24h' ? 1 : timeframe === 'last7d' ? 7 : 30

    // Convert to array and sort by total crawls
    const companies = Array.from(companyStats.entries())
      .map(([company, stats]) => ({
        company,
        totalCrawls: stats.totalCrawls,
        uniquePaths: stats.uniquePaths.size,
        avgInterval: calculateAvgInterval(stats.totalCrawls, timeframeDays),
        crawlers: Array.from(stats.crawlers),
        lastSeen: formatRelativeTime(stats.lastSeen)
      }))
      .sort((a, b) => b.totalCrawls - a.totalCrawls)

    return NextResponse.json({ companies })

  } catch (error) {
    console.error('Error in attribution-companies API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 