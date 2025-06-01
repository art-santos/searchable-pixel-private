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
    const timezone = url.searchParams.get('timezone') || 'UTC'
    
    console.log(`[Dashboard API] Fetching crawler visits for timeframe: ${timeframe}, crawler: ${crawler}, timezone: ${timezone}`)
    
    // Helper function to get current time in user's timezone
    const getCurrentTimeInTimezone = () => {
      return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }))
    }
    
    // Helper function to convert UTC timestamp to user's timezone
    const convertToUserTimezone = (utcTimestamp: string) => {
      return new Date(new Date(utcTimestamp).toLocaleString("en-US", { timeZone: timezone }))
    }
    
    // Calculate date range based on timeframe, in user's timezone
    const nowInUserTz = getCurrentTimeInTimezone()
    let startDate = new Date(nowInUserTz)
    let groupBy: 'hour' | 'day' = 'hour'
    
    switch (timeframe.toLowerCase()) {
      case 'last 24 hours':
        // Go back 24 hours from current time
        startDate.setHours(startDate.getHours() - 24)
        groupBy = 'hour'
        break
      case 'last 7 days':
        // Go back 7 days from current time
        startDate.setDate(startDate.getDate() - 7)
        groupBy = 'day'
        break
      case 'last 30 days':
        // Go back 30 days from current time
        startDate.setDate(startDate.getDate() - 30)
        groupBy = 'day'
        break
      default:
        // Default to last 24 hours
        startDate.setHours(startDate.getHours() - 24)
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
      // Convert database timestamp to user's timezone
      const date = convertToUserTimezone(visit.timestamp)
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
      // Generate all 24 hours for "Last 24 hours" timeframe
      for (let hoursAgo = 23; hoursAgo >= 0; hoursAgo--) {
        const hourTime = new Date(nowInUserTz)
        hourTime.setHours(hourTime.getHours() - hoursAgo)
        const hour = hourTime.getHours()
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
          isCurrentPeriod: hoursAgo === 0 // Mark current hour for animation
        })
      }
    } else {
      // Generate days for "Last 7 days" or "Last 30 days" timeframes
      const daysToShow = timeframe === 'Last 7 days' ? 7 : 30
      
      for (let daysAgo = daysToShow - 1; daysAgo >= 0; daysAgo--) {
        const dayTime = new Date(nowInUserTz)
        dayTime.setDate(dayTime.getDate() - daysAgo)
        
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
        const dayKey = `${monthNames[dayTime.getMonth()]} ${dayTime.getDate()}`
        const crawls = timeAggregates.get(dayKey) || 0
        
        chartData.push({
          date: dayKey,
          crawls,
          isCurrentPeriod: daysAgo === 0 // Mark current day for animation
        })
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

    // Helper to get crawler icon with favicon fallback
    const getCrawlerIcon = (company: string): string => {
      const iconMap: Record<string, string> = {
        'OpenAI': '/images/chatgpt.svg',
        'Anthropic': '/images/claude.svg',
        'Google': '/images/gemini.svg',
        'Perplexity': '/images/perplexity.svg',
        'Microsoft': '/images/bing.svg'
      }
      
      // If we have a local icon, use it
      if (iconMap[company]) {
        return iconMap[company]
      }
      
      // Otherwise, try to get favicon from company domain
      const companyDomainMap: Record<string, string> = {
        'OpenAI': 'openai.com',
        'Anthropic': 'anthropic.com',
        'Google': 'google.com',
        'Perplexity': 'perplexity.ai',
        'Microsoft': 'microsoft.com',
        'Meta': 'meta.com',
        'Facebook': 'facebook.com',
        'X': 'x.com',
        'Twitter': 'twitter.com',
        'LinkedIn': 'linkedin.com',
        'Apple': 'apple.com',
        'Amazon': 'amazon.com',
        'TikTok': 'tiktok.com',
        'ByteDance': 'bytedance.com',
        'Slack': 'slack.com',
        'Discord': 'discord.com',
        'Reddit': 'reddit.com',
        'Pinterest': 'pinterest.com',
        'Snapchat': 'snapchat.com',
        'WhatsApp': 'whatsapp.com',
        'Telegram': 'telegram.org',
        'Shopify': 'shopify.com',
        'Salesforce': 'salesforce.com',
        'Adobe': 'adobe.com',
        'Atlassian': 'atlassian.com',
        'Zoom': 'zoom.us',
        'Dropbox': 'dropbox.com',
        'Spotify': 'spotify.com',
        'Netflix': 'netflix.com',
        'Uber': 'uber.com',
        'Airbnb': 'airbnb.com',
        'Stripe': 'stripe.com',
        'Square': 'squareup.com',
        'PayPal': 'paypal.com',
      }

      const domain = companyDomainMap[company]
      if (domain) {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      }
      
      // Fallback: try to construct domain from company name
      const constructedDomain = `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      return `https://www.google.com/s2/favicons?domain=${constructedDomain}&sz=128`
    }

    // Add icon to available crawlers
    const availableCrawlersWithIcons = availableCrawlers.map(crawler => ({
      ...crawler,
      icon: getCrawlerIcon(crawler.company)
    }))

    const totalCrawls = visits?.length || 0

    console.log(`[Dashboard API] Returning ${totalCrawls} total crawls, ${availableCrawlersWithIcons.length} unique crawlers`)

    return NextResponse.json({
      chartData,
      availableCrawlers: availableCrawlersWithIcons,
      totalCrawls,
      timeframe
    })

  } catch (error) {
    console.error('Error in crawler visits API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 