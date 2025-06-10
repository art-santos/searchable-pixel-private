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

    // Query crawler visits for the workspace and timeframe
    const { data: visits, error } = await supabase
      .from('crawler_visits')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching crawler visits:', error)
      return NextResponse.json({ error: 'Failed to fetch attribution data' }, { status: 500 })
    }

    if (!visits || visits.length === 0) {
      return NextResponse.json({ pages: [] })
    }

    // Group visits by path
    const pageData = new Map<string, {
      path: string
      totalVisits: number
      lastVisit: Date
      bots: Map<string, { botName: string, company: string, visits: number, lastVisit: Date }>
    }>()

    visits.forEach(visit => {
      const path = visit.path
      
      if (!pageData.has(path)) {
        pageData.set(path, {
          path: path,
          totalVisits: 0,
          lastVisit: new Date(visit.timestamp),
          bots: new Map()
        })
      }

      const page = pageData.get(path)!
      page.totalVisits++
      
      const visitTime = new Date(visit.timestamp)
      if (visitTime > page.lastVisit) {
        page.lastVisit = visitTime
      }

      // Track bot visits for this page
      const botName = visit.crawler_name
      if (!page.bots.has(botName)) {
        page.bots.set(botName, {
          botName: botName,
          company: visit.crawler_company || 'Unknown',
          visits: 0,
          lastVisit: visitTime
        })
      }
      
      const botData = page.bots.get(botName)!
      botData.visits++
      if (visitTime > botData.lastVisit) {
        botData.lastVisit = visitTime
      }
    })

    // Convert to array format
    const pagesArray = Array.from(pageData.values()).map(page => {
      // Convert bots map to sorted array
      const botsArray = Array.from(page.bots.values())
        .sort((a, b) => b.visits - a.visits) // Sort by visit count descending
        .map(bot => ({
          botName: bot.botName,
          company: bot.company,
          visits: bot.visits,
          lastVisit: bot.lastVisit.toISOString()
        }))

      return {
        path: page.path,
        totalVisits: page.totalVisits,
        lastVisit: page.lastVisit.toISOString(),
        bots: botsArray
      }
    })

    // Sort by total visits descending
    const sortedPages = pagesArray.sort((a, b) => b.totalVisits - a.totalVisits)

    return NextResponse.json({ pages: sortedPages })

  } catch (error) {
    console.error('Error in attribution-pages-detailed API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 