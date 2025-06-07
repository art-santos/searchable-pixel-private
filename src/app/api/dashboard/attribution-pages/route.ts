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
        .select('path, crawler_name, timestamp, response_time_ms')
        .eq('workspace_id', workspaceId)
        .gte('timestamp', startDate.toISOString())
        .range(offset, offset + limit - 1)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching pages:', error)
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
      return NextResponse.json({ pages: [] })
    }

    // Group by path
    const pageStats = new Map<string, {
      totalCrawls: number
      uniqueCrawlers: Set<string>
      lastCrawled: Date
      responseTimes: number[]
      crawlerCounts: Map<string, number>
    }>()

    visits.forEach(visit => {
      const path = visit.path
      const visitTime = new Date(visit.timestamp)
      
      if (pageStats.has(path)) {
        const stats = pageStats.get(path)!
        stats.totalCrawls++
        stats.uniqueCrawlers.add(visit.crawler_name)
        if (visitTime > stats.lastCrawled) {
          stats.lastCrawled = visitTime
        }
        if (visit.response_time_ms) {
          stats.responseTimes.push(visit.response_time_ms)
        }
        
        // Track crawler counts for this path
        const currentCount = stats.crawlerCounts.get(visit.crawler_name) || 0
        stats.crawlerCounts.set(visit.crawler_name, currentCount + 1)
      } else {
        const crawlerCounts = new Map<string, number>()
        crawlerCounts.set(visit.crawler_name, 1)
        
        pageStats.set(path, {
          totalCrawls: 1,
          uniqueCrawlers: new Set([visit.crawler_name]),
          lastCrawled: visitTime,
          responseTimes: visit.response_time_ms ? [visit.response_time_ms] : [],
          crawlerCounts
        })
      }
    })

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

    const getTopCrawler = (crawlerCounts: Map<string, number>) => {
      let topCrawler = ''
      let maxCount = 0
      
      crawlerCounts.forEach((count, crawler) => {
        if (count > maxCount) {
          maxCount = count
          topCrawler = crawler
        }
      })
      
      return topCrawler
    }

    // Convert to array and sort by total crawls
    const pages = Array.from(pageStats.entries())
      .map(([path, stats]) => ({
        path,
        totalCrawls: stats.totalCrawls,
        uniqueCrawlers: stats.uniqueCrawlers.size,
        avgResponse: stats.responseTimes.length > 0 
          ? Math.round(stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length)
          : 0,
        lastCrawled: stats.lastCrawled.toISOString(),
        topCrawler: getTopCrawler(stats.crawlerCounts)
      }))
      .sort((a, b) => b.totalCrawls - a.totalCrawls)

    return NextResponse.json({ pages })

  } catch (error) {
    console.error('Error in attribution-pages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 