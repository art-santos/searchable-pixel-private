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
        console.error('Error fetching crawler visits:', error)
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
      return NextResponse.json({ bots: [] })
    }

    // Group visits by crawler_name (bot name)
    const botData = new Map<string, {
      botName: string
      company: string
      totalCrawls: number
      pathsVisited: Set<string>
      crawlerCount: number
      lastSeen: Date
      pages: Map<string, { visits: number, lastVisit: Date }>
    }>()

    visits.forEach(visit => {
      const botName = visit.crawler_name
      
      if (!botData.has(botName)) {
        botData.set(botName, {
          botName: botName,
          company: visit.crawler_company || 'Unknown',
          totalCrawls: 0,
          pathsVisited: new Set(),
          crawlerCount: 1,
          lastSeen: new Date(visit.timestamp),
          pages: new Map()
        })
      }

      const bot = botData.get(botName)!
      bot.totalCrawls++
      bot.pathsVisited.add(visit.path)
      
      const visitTime = new Date(visit.timestamp)
      if (visitTime > bot.lastSeen) {
        bot.lastSeen = visitTime
      }

      // Track page visits
      if (!bot.pages.has(visit.path)) {
        bot.pages.set(visit.path, { visits: 0, lastVisit: visitTime })
      }
      
      const pageData = bot.pages.get(visit.path)!
      pageData.visits++
      if (visitTime > pageData.lastVisit) {
        pageData.lastVisit = visitTime
      }
    })

    // Calculate average intervals for each bot
    const botsWithIntervals = Array.from(botData.values()).map(bot => {
      const botVisits = visits
        .filter(v => v.crawler_name === bot.botName)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      let avgInterval = 'N/A'
      if (botVisits.length > 1) {
        const intervals = []
        for (let i = 1; i < botVisits.length; i++) {
          const prev = new Date(botVisits[i - 1].timestamp).getTime()
          const curr = new Date(botVisits[i].timestamp).getTime()
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

      // Convert pages map to sorted array
      const pagesArray = Array.from(bot.pages.entries())
        .map(([path, data]) => ({
          path,
          visits: data.visits,
          lastVisit: data.lastVisit.toISOString()
        }))
        .sort((a, b) => b.visits - a.visits) // Sort by visit count descending

      return {
        botName: bot.botName,
        company: bot.company,
        totalCrawls: bot.totalCrawls,
        pathsVisited: bot.pathsVisited.size,
        avgInterval,
        crawlerCount: 1, // Individual bots have count of 1
        lastSeen: bot.lastSeen.toISOString(),
        pages: pagesArray
      }
    })

    // Sort by total crawls descending
    const sortedBots = botsWithIntervals.sort((a, b) => b.totalCrawls - a.totalCrawls)

    return NextResponse.json({ bots: sortedBots })

  } catch (error) {
    console.error('Error in attribution-bots API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 