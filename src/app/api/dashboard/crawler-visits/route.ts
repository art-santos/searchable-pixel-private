import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user (same pattern as other working endpoints)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Get query params
    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') || 'today'
    const crawler = url.searchParams.get('crawler') || 'all'
    
    console.log(`[Dashboard API] Fetching crawler visits for timeframe: ${timeframe}, crawler: ${crawler}`)
    
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

    console.log(`[Dashboard API] Using date range from: ${startDate.toISOString()}`)

    // Build the query with date filtering
    let query = supabase
      .from('crawler_visits')
      .select('timestamp, crawler_name, crawler_company')
      .eq('user_id', userId)
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

    console.log(`[Dashboard API] Found ${visits?.length || 0} visits`)

    // Aggregate visits by time period
    const timeAggregates = new Map<string, number>()
    const crawlerSet = new Map<string, { company: string, count: number }>()

    visits?.forEach(visit => {
      const date = new Date(visit.timestamp)
      let key: string
      
      if (groupBy === 'hour') {
        // Use 24-hour format for internal key, we'll format for display later
        key = `${date.getHours()}`
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

    // Generate chart data
    let chartData: { date: string; crawls: number; isCurrentPeriod?: boolean }[] = []

    if (groupBy === 'hour') {
      // Generate hours only up to current hour for today
      const now = new Date()
      const currentHour = now.getHours()
      
      for (let hour = 0; hour <= currentHour; hour++) {
        const hourKey = `${hour}`
        const crawls = timeAggregates.get(hourKey) || 0
        
        // Format hour for display (12-hour format with AM/PM)
        let displayHour: string
        if (hour === 0) {
          displayHour = '12 AM'
        } else if (hour < 12) {
          displayHour = `${hour} AM`
        } else if (hour === 12) {
          displayHour = '12 PM'
        } else {
          displayHour = `${hour - 12} PM`
        }
        
        chartData.push({
          date: displayHour,
          crawls,
          isCurrentPeriod: hour === currentHour // Mark current hour for animation
        })
      }
    } else {
      // For other timeframes, filter to only show up to current day
      const now = new Date()
      const timeEntries = Array.from(timeAggregates.entries())
      
      if (timeframe.toLowerCase().includes('week') || timeframe === '7d') {
        // For week view, only show up to today
        const currentDayKey = (() => {
          const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
          return `${monthNames[now.getMonth()]} ${now.getDate()}`
        })()
        
        // Generate all days in the week up to today
        for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
          const date = new Date(now)
          date.setDate(date.getDate() - dayOffset)
          const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
          const dayKey = `${monthNames[date.getMonth()]} ${date.getDate()}`
          const crawls = timeAggregates.get(dayKey) || 0
          
          chartData.push({
            date: dayKey,
            crawls,
            isCurrentPeriod: dayKey === currentDayKey
          })
        }
      } else {
        // For month/longer periods, generate all days up to today with 0s for missing days
        const now = new Date()
        const currentDayKey = (() => {
          const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
          return `${monthNames[now.getMonth()]} ${now.getDate()}`
        })()
        
        if (timeframe.toLowerCase().includes('month') || timeframe === '30d') {
          // For month view, generate all days in the last 30 days up to today
          for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
            const date = new Date(now)
            date.setDate(date.getDate() - dayOffset)
            const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
            const dayKey = `${monthNames[date.getMonth()]} ${date.getDate()}`
            const crawls = timeAggregates.get(dayKey) || 0
            
            chartData.push({
              date: dayKey,
              crawls,
              isCurrentPeriod: dayKey === currentDayKey
            })
          }
        } else {
          // For longer periods (90d+), use existing aggregated data but sort chronologically
          chartData = Array.from(timeAggregates.entries())
            .map(([date, crawls]) => ({
              date,
              crawls,
              isCurrentPeriod: date === currentDayKey
            }))
            .sort((a, b) => {
              // Sort chronologically
              const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
              const [aMonth, aDay] = a.date.split(' ')
              const [bMonth, bDay] = b.date.split(' ')
              const aMonthIndex = monthNames.indexOf(aMonth)
              const bMonthIndex = monthNames.indexOf(bMonth)
              
              if (aMonthIndex !== bMonthIndex) {
                return aMonthIndex - bMonthIndex
              }
              return parseInt(aDay) - parseInt(bDay)
            })
        }
      }
    }

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

    console.log(`[Dashboard API] Returning ${totalCrawls} total crawls, ${availableCrawlers.length} unique crawlers`)

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