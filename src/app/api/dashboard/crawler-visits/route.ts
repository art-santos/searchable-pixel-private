import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Get the auth token from Authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Initialize Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') || 'today'
    const crawler = url.searchParams.get('crawler') || 'all'
    
    // Calculate date range based on timeframe
    let startDate = new Date()
    let groupBy: 'hour' | 'day' = 'hour'
    
    switch (timeframe.toLowerCase()) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        groupBy = 'hour'
        break
      case 'this week':
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        groupBy = 'day'
        break
      case 'this month':
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        groupBy = 'day'
        break
      case 'custom range':
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        groupBy = 'day'
        break
      default:
        startDate.setHours(0, 0, 0, 0)
        groupBy = 'hour'
    }

    // Build the query
    let query = supabase
      .from('crawler_visits')
      .select('timestamp, crawler_name, crawler_company')
      .eq('user_id', user.id)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true })

    // Filter by specific crawler if not 'all'
    if (crawler !== 'all') {
      query = query.eq('crawler_name', crawler)
    }

    const { data: visits, error: visitsError } = await query

    if (visitsError) {
      console.error('Error fetching crawler visits:', visitsError)
      // If table doesn't exist yet, return empty data
      if (visitsError.code === '42P01') {
        return NextResponse.json({
          chartData: [],
          availableCrawlers: [],
          totalCrawls: 0,
          timeframe
        })
      }
      return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 })
    }

    // Aggregate visits by time period
    const timeAggregates = new Map<string, number>()
    const crawlerSet = new Map<string, { company: string, count: number }>()

    visits?.forEach(visit => {
      const date = new Date(visit.timestamp)
      let key: string
      
      if (groupBy === 'hour') {
        key = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
      } else {
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
        key = `${monthNames[date.getMonth()]} ${date.getDate()}`
      }
      
      timeAggregates.set(key, (timeAggregates.get(key) || 0) + 1)
      
      // Track unique crawlers
      if (crawlerSet.has(visit.crawler_name)) {
        const crawler = crawlerSet.get(visit.crawler_name)!
        crawler.count++
      } else {
        crawlerSet.set(visit.crawler_name, { 
          company: visit.crawler_company, 
          count: 1 
        })
      }
    })

    // Convert to chart data format
    const chartData = Array.from(timeAggregates.entries()).map(([date, crawls]) => ({
      date,
      crawls
    }))

    // Get available crawlers sorted by frequency
    const availableCrawlers = Array.from(crawlerSet.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, info]) => ({
        id: name,
        name,
        company: info.company,
        count: info.count
      }))

    const totalCrawls = visits?.length || 0

    return NextResponse.json({
      chartData,
      availableCrawlers,
      totalCrawls,
      timeframe
    })

  } catch (error) {
    console.error('Error in crawler visits API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 