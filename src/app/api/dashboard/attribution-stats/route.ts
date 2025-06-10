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
      case 'last90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case 'last365d':
        startDate.setDate(startDate.getDate() - 365)
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
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('timestamp', startDate.toISOString())
        .range(offset, offset + limit - 1)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching attribution stats:', error)
        return NextResponse.json({ error: 'Failed to fetch attribution data' }, { status: 500 })
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
        totalCrawls: 0,
        uniqueCrawlers: 0,
        uniqueDomains: 0,
        avgResponseTime: 0,
        uniquePaths: 0,
        totalSessions: 0,
        avgPagesPerSession: 0
      })
    }

    // Calculate stats
    const totalCrawls = visits.length
    const uniqueCrawlers = new Set(visits.map(v => v.crawler_name)).size
    const uniqueDomains = new Set(visits.map(v => v.domain)).size
    const uniquePaths = new Set(visits.map(v => v.path)).size
    
    // Calculate average response time (only for visits with response_time_ms)
    const visitsWithResponseTime = visits.filter(v => v.response_time_ms !== null)
    const avgResponseTime = visitsWithResponseTime.length > 0 
      ? Math.round(visitsWithResponseTime.reduce((sum, v) => sum + v.response_time_ms, 0) / visitsWithResponseTime.length)
      : 0

    // Simple session calculation (group by crawler + domain with 5-minute gaps)
    const sessions = new Map<string, any[]>()
    
    visits.forEach(visit => {
      const sessionKey = `${visit.crawler_name}-${visit.domain}`
      if (!sessions.has(sessionKey)) {
        sessions.set(sessionKey, [])
      }
      sessions.get(sessionKey)!.push(visit)
    })

    let totalSessions = 0
    let totalPagesInSessions = 0

    sessions.forEach(sessionVisits => {
      // Sort by timestamp
      sessionVisits.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      
      let currentSession: any[] = []
      let sessionCount = 0
      
      sessionVisits.forEach((visit, index) => {
        if (index === 0) {
          currentSession = [visit]
        } else {
          const prevTime = new Date(sessionVisits[index - 1].timestamp).getTime()
          const currentTime = new Date(visit.timestamp).getTime()
          const timeDiff = currentTime - prevTime
          
          // If more than 5 minutes apart, start new session
          if (timeDiff > 5 * 60 * 1000) {
            sessionCount++
            totalPagesInSessions += currentSession.length
            currentSession = [visit]
          } else {
            currentSession.push(visit)
          }
        }
      })
      
      // Don't forget the last session
      if (currentSession.length > 0) {
        sessionCount++
        totalPagesInSessions += currentSession.length
      }
      
      totalSessions += sessionCount
    })

    const avgPagesPerSession = totalSessions > 0 
      ? Math.round((totalPagesInSessions / totalSessions) * 10) / 10
      : 0

    return NextResponse.json({
      totalCrawls,
      uniqueCrawlers,
      uniqueDomains,
      avgResponseTime,
      uniquePaths,
      totalSessions,
      avgPagesPerSession
    })

  } catch (error) {
    console.error('Error in attribution-stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 