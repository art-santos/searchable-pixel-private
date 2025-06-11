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
    const workspaceId = url.searchParams.get('workspaceId') // Add workspace filtering
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }
    
    console.log(`[Dashboard API] Fetching crawler visits for workspace: ${workspaceId}, timeframe: ${timeframe}, crawler: ${crawler}, timezone: ${timezone}`)
    
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
      case 'last 90 days':
        // Go back 90 days from current time
        startDate.setDate(startDate.getDate() - 90)
        groupBy = 'day'
        break
      case 'last 365 days':
        // Go back 365 days from current time
        startDate.setDate(startDate.getDate() - 365)
        groupBy = 'day'
        break
      default:
        // Default to last 24 hours
        startDate.setHours(startDate.getHours() - 24)
        groupBy = 'hour'
    }

    console.log(`[Dashboard API] Using date range from: ${startDate.toISOString()}`)

    // Check if user is admin and has payment method
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_admin, stripe_customer_id, subscription_plan, subscription_status')
      .eq('id', userId)
      .single()

    const isAdmin = userProfile?.is_admin || false
    // User has payment method if they have a Stripe customer ID AND active subscription
    const hasPaymentMethod = !!(userProfile?.stripe_customer_id && userProfile?.subscription_status === 'active')
    const subscriptionPlan = userProfile?.subscription_plan || 'free'

    console.log(`[Dashboard API] User status - Admin: ${isAdmin}, Has Card: ${hasPaymentMethod}, Plan: ${subscriptionPlan}, Status: ${userProfile?.subscription_status}`)

    // For period comparison, we need to fetch data from 2x the timeframe back
    // This ensures we have data for both current and previous periods
    let dataFetchStartDate = new Date(startDate)
    if (timeframe.toLowerCase() === 'last 24 hours') {
      dataFetchStartDate.setHours(dataFetchStartDate.getHours() - 24) // Go back another 24 hours
    } else if (timeframe.toLowerCase() === 'last 7 days') {
      dataFetchStartDate.setDate(dataFetchStartDate.getDate() - 7) // Go back another 7 days
    } else if (timeframe.toLowerCase() === 'last 30 days') {
      dataFetchStartDate.setDate(dataFetchStartDate.getDate() - 30) // Go back another 30 days
    } else if (timeframe.toLowerCase() === 'last 90 days') {
      dataFetchStartDate.setDate(dataFetchStartDate.getDate() - 90) // Go back another 90 days
    } else if (timeframe.toLowerCase() === 'last 365 days') {
      dataFetchStartDate.setDate(dataFetchStartDate.getDate() - 365) // Go back another 365 days
    }

    console.log(`[Dashboard API] Fetching data from ${dataFetchStartDate.toISOString()} to include previous period for comparison`)

    // Build the query with date filtering, filtered by workspace
    let query = supabase
      .from('crawler_visits')
      .select('timestamp, crawler_name, crawler_company', { count: 'exact' }) // Add count to see total
      .gte('timestamp', dataFetchStartDate.toISOString())
      .order('timestamp', { ascending: true })

    // Filter strictly by workspace - no fallback to prevent data bleeding
    query = query.eq('workspace_id', workspaceId)

    // Filter by specific crawler if not 'all'
    if (crawler !== 'all') {
      query = query.eq('crawler_name', crawler)
    }

    // Determine if we should apply limits
    let shouldLimitData = false
    let rowLimit = 999999 // Default to essentially unlimited

    if (isAdmin) {
      // Admin users: ALWAYS unlimited, no card required
      console.log('[Dashboard API] 👑 Admin user: No limits applied')
      shouldLimitData = false
    } else if (hasPaymentMethod) {
      // Any user with payment method: Unlimited viewing
      console.log('[Dashboard API] 💳 User has payment method: No limits applied')
      shouldLimitData = false
    } else {
      // Users without payment method: Apply plan limits
      shouldLimitData = true
      switch (subscriptionPlan) {
        case 'visibility':
          rowLimit = 250
          break
        case 'plus':
          rowLimit = 500
          break
        case 'pro':
          rowLimit = 1000
          break
        default:
          rowLimit = 0 // Free plan sees no data
      }
      console.log(`[Dashboard API] 🚫 No payment method: Limiting to ${rowLimit} rows based on ${subscriptionPlan} plan`)
    }

    // Apply the appropriate data fetching strategy
    let allVisits: any[] = []
    
    if (shouldLimitData && rowLimit > 0) {
      // Limited users: single query with their plan limit
      const { data: visits, error: visitsError } = await query.limit(rowLimit)
      
      if (visitsError) {
        console.error('Error fetching crawler visits:', visitsError)
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
      
      allVisits = visits || []
      console.log(`[Dashboard API] Limited user: Retrieved ${allVisits.length} visits (capped at ${rowLimit})`)
      
    } else {
      // Unlimited users (admin or has payment method): Fetch ALL data using pagination
      console.log('[Dashboard API] Starting paginated fetch for unlimited user...')
      
      // First, get the total count
      const { count, error: countError } = await query.select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('Error getting count:', countError)
        return NextResponse.json({ error: 'Failed to count visits' }, { status: 500 })
      }
      
      console.log(`[Dashboard API] Total records to fetch: ${count}`)
      
      // Fetch data in chunks of 1000 (Supabase's limit) - CONCURRENTLY
      const chunkSize = 1000
      const totalChunks = Math.ceil((count || 0) / chunkSize)
      
      // Create all chunk promises at once - each with a fresh query
      const chunkPromises = Array.from({ length: totalChunks }, (_, i) => {
        const start = i * chunkSize
        const end = start + chunkSize - 1
        
        // Create a fresh query for each chunk to avoid conflicts
        let chunkQuery = supabase
          .from('crawler_visits')
          .select('timestamp, crawler_name, crawler_company')
          .gte('timestamp', dataFetchStartDate.toISOString())
          .order('timestamp', { ascending: true })
          .eq('workspace_id', workspaceId)
        
        // Apply crawler filter if specified
        if (crawler !== 'all') {
          chunkQuery = chunkQuery.eq('crawler_name', crawler)
        }
        
        return chunkQuery.range(start, end)
      })
      
      // Fetch all chunks concurrently
      const chunkResults = await Promise.all(chunkPromises)
      
      // Process results and handle errors
      for (let i = 0; i < chunkResults.length; i++) {
        const { data: chunk, error: chunkError } = chunkResults[i]
        
        if (chunkError) {
          console.error(`Error fetching chunk ${i + 1}/${totalChunks}:`, chunkError)
          return NextResponse.json({ error: 'Failed to fetch all visits' }, { status: 500 })
        }
        
        allVisits = allVisits.concat(chunk || [])
        console.log(`[Dashboard API] Fetched chunk ${i + 1}/${totalChunks}: ${chunk?.length} records (total so far: ${allVisits.length})`)
      }
      
      console.log(`[Dashboard API] ✅ Successfully fetched all ${allVisits.length} visits`)
    }

    const visits = allVisits
    console.log(`[Dashboard API] Processing ${visits.length} visits for workspace ${workspaceId}`)

    // Calculate period-over-period analytics
    let periodComparison: { hasComparison: boolean; percentChange?: number; trend?: 'up' | 'down' | 'same' } | null = null
    
    // Check if we have enough data for period comparison (need 2x the timeframe)
    // We need to check against ALL workspace data, not just filtered visits
    const { data: oldestVisitData, error: oldestError } = await supabase
      .from('crawler_visits')
      .select('timestamp')
      .eq('workspace_id', workspaceId)
      .order('timestamp', { ascending: true })
      .limit(1)

    let daysSinceOldest = 0
    if (oldestVisitData && oldestVisitData.length > 0) {
      const oldestVisit = new Date(oldestVisitData[0].timestamp)
      daysSinceOldest = Math.floor((nowInUserTz.getTime() - oldestVisit.getTime()) / (1000 * 60 * 60 * 24))
    }
    
    console.log(`[Dashboard API] 📊 Period comparison check:`, {
      timeframe: timeframe.toLowerCase(),
      oldestVisit: oldestVisitData?.[0]?.timestamp,
      daysSinceOldest,
      totalVisits: visits.length
    })
    
    let requiredDaysForComparison: number
    switch (timeframe.toLowerCase()) {
      case 'last 24 hours':
        requiredDaysForComparison = 2
        break
      case 'last 7 days':
        requiredDaysForComparison = 14
        break
      case 'last 30 days':
        requiredDaysForComparison = 60
        break
      case 'last 90 days':
        requiredDaysForComparison = 180
        break
      case 'last 365 days':
        requiredDaysForComparison = 730
        break
      default:
        requiredDaysForComparison = 60
    }
    
    console.log(`[Dashboard API] 📊 Required days: ${requiredDaysForComparison}, Available days: ${daysSinceOldest}`)
    
    if (daysSinceOldest >= requiredDaysForComparison) {
      // Calculate current period and previous period counts
      // For proper period-over-period comparison, we need equal length periods
      const periodLengthMs = nowInUserTz.getTime() - startDate.getTime()
      const previousStartDate = new Date(startDate.getTime() - periodLengthMs)
      const previousEndDate = new Date(startDate.getTime())
      
      const currentPeriodCount = visits.filter(v => new Date(v.timestamp) >= startDate).length
      const previousPeriodCount = visits.filter(v => {
        const visitDate = new Date(v.timestamp)
        return visitDate >= previousStartDate && visitDate < previousEndDate
      }).length
      
      console.log(`[Dashboard API] 📊 Period counts:`, {
        currentPeriodCount,
        previousPeriodCount,
        currentPeriod: `${startDate.toISOString()} to ${nowInUserTz.toISOString()}`,
        previousPeriod: `${previousStartDate.toISOString()} to ${previousEndDate.toISOString()}`
      })
      
      // Always create comparison, even if previous period is 0
      if (previousPeriodCount > 0) {
        const percentChange = ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100
        periodComparison = {
          hasComparison: true,
          percentChange: Math.round(percentChange * 10) / 10, // Round to 1 decimal
          trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'same'
        }
        console.log(`[Dashboard API] 📊 Created period comparison:`, periodComparison)
      } else if (currentPeriodCount > 0) {
        // Previous period had 0 visits, current has some
        // Don't show badge when there's no previous data to compare against
        periodComparison = null
        console.log(`[Dashboard API] 📊 No previous period data - not showing comparison badge`)
      } else {
        // Both periods have 0 visits
        periodComparison = {
          hasComparison: true,
          percentChange: 0,
          trend: 'same'
        }
        console.log(`[Dashboard API] 📊 Created zero activity comparison:`, periodComparison)
      }
    } else {
      console.log(`[Dashboard API] 📊 Not enough historical data for comparison`)
      periodComparison = null
    }

    // Aggregate visits by time period
    const timeAggregates = new Map<string, number>()
    const crawlerSet = new Map<string, { company: string, count: number }>()

    // Only include visits from the current period for aggregation (not previous period data)
    const currentPeriodVisits = visits.filter(v => new Date(v.timestamp) >= startDate)
    
    currentPeriodVisits?.forEach(visit => {
      // Convert database timestamp to user's timezone
      const date = convertToUserTimezone(visit.timestamp)
      let key: string
      
      if (groupBy === 'hour') {
        // Use YYYY-MM-DD-HH format to avoid hour number conflicts across days
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hour = String(date.getHours()).padStart(2, '0')
        key = `${year}-${month}-${day}-${hour}`
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
    let chartData: { date: string; crawls: number; isCurrentPeriod?: boolean; showLabel?: boolean }[] = []

    if (groupBy === 'hour') {
      // Generate all 24 hours for "Last 24 hours" timeframe
      for (let hoursAgo = 23; hoursAgo >= 0; hoursAgo--) {
        const hourTime = new Date(nowInUserTz)
        hourTime.setHours(hourTime.getHours() - hoursAgo)
        
        // Create the same key format as used in data grouping
        const year = hourTime.getFullYear()
        const month = String(hourTime.getMonth() + 1).padStart(2, '0')
        const day = String(hourTime.getDate()).padStart(2, '0')
        const hour = String(hourTime.getHours()).padStart(2, '0')
        const hourKey = `${year}-${month}-${day}-${hour}`
        
        const crawls = timeAggregates.get(hourKey) || 0
        
        // Format hour for display (12-hour format with AM/PM)
        let displayHour: string
        const displayHourNum = hourTime.getHours()
        if (displayHourNum === 0) {
          displayHour = '12 AM'
        } else if (displayHourNum < 12) {
          displayHour = `${displayHourNum} AM`
        } else if (displayHourNum === 12) {
          displayHour = '12 PM'
        } else {
          displayHour = `${displayHourNum - 12} PM`
        }
        
        chartData.push({
          date: displayHour,
          crawls,
          isCurrentPeriod: hoursAgo === 0, // Mark current hour for animation
          showLabel: hoursAgo % 4 === 0 || hoursAgo === 0 // Label every 4 hours + current hour
        })
      }
    } else {
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      
      if (timeframe.toLowerCase() === 'last 7 days') {
        // Show all 7 days with daily granularity
        for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
          const dayTime = new Date(nowInUserTz)
          dayTime.setDate(dayTime.getDate() - daysAgo)
          
          const dayKey = `${monthNames[dayTime.getMonth()]} ${dayTime.getDate()}`
          const crawls = timeAggregates.get(dayKey) || 0
          
          chartData.push({
            date: dayKey,
            crawls,
            isCurrentPeriod: daysAgo === 0,
            showLabel: true // Show all labels for 7 days
          })
        }
        
      } else if (timeframe.toLowerCase() === 'last 30 days') {
        // Show all 30 days but only label every 5th day to avoid clutter
        for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
          const dayTime = new Date(nowInUserTz)
          dayTime.setDate(dayTime.getDate() - daysAgo)
          
          const dayKey = `${monthNames[dayTime.getMonth()]} ${dayTime.getDate()}`
          const crawls = timeAggregates.get(dayKey) || 0
          
          chartData.push({
            date: dayKey,
            crawls,
            isCurrentPeriod: daysAgo === 0,
            showLabel: daysAgo % 5 === 0 || daysAgo === 0 // Label every 5th day + current day
          })
        }
        
      } else if (timeframe.toLowerCase() === 'last 90 days') {
        // Show all 90 days but only label every 14th day (weekly-ish)
        for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
          const dayTime = new Date(nowInUserTz)
          dayTime.setDate(dayTime.getDate() - daysAgo)
          
          const dayKey = `${monthNames[dayTime.getMonth()]} ${dayTime.getDate()}`
          const crawls = timeAggregates.get(dayKey) || 0
          
          chartData.push({
            date: dayKey,
            crawls,
            isCurrentPeriod: daysAgo === 0,
            showLabel: daysAgo % 14 === 0 || daysAgo === 0 // Label every 2 weeks + current day
          })
        }
        
      } else if (timeframe.toLowerCase() === 'last 365 days') {
        // Show all 365 days but only label every 30th day (monthly-ish)
        for (let daysAgo = 364; daysAgo >= 0; daysAgo--) {
          const dayTime = new Date(nowInUserTz)
          dayTime.setDate(dayTime.getDate() - daysAgo)
          
          const dayKey = `${monthNames[dayTime.getMonth()]} ${dayTime.getDate()}`
          const crawls = timeAggregates.get(dayKey) || 0
          
          chartData.push({
            date: dayKey,
            crawls,
            isCurrentPeriod: daysAgo === 0,
            showLabel: daysAgo % 30 === 0 || daysAgo === 0 // Label every month + current day
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

    const totalCrawls = currentPeriodVisits?.length || 0

    console.log(`[Dashboard API] Returning ${totalCrawls} total crawls, ${availableCrawlersWithIcons.length} unique crawlers`)

    return NextResponse.json({
      chartData,
      availableCrawlers: availableCrawlersWithIcons,
      totalCrawls,
      timeframe,
      periodComparison
    })

  } catch (error) {
    console.error('Error in crawler visits API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 