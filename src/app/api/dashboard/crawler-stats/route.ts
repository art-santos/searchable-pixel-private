import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user (same pattern as other working endpoints)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 [Crawler Stats API] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    })
    
    if (authError || !user) {
      console.error('🔍 [Crawler Stats API] Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Get query params
    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') || 'today'
    const workspaceId = url.searchParams.get('workspaceId') // Add workspace filtering
    
    if (!workspaceId) {
      console.error('🔍 [Crawler Stats API] Missing workspace ID')
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }
    
    console.log(`🔍 [Crawler Stats API] Fetching crawler stats for workspace: ${workspaceId}, timeframe: ${timeframe}`)
    
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
        startDate.setHours(startDate.getHours() - 24)
    }

    console.log(`🔍 [Crawler Stats API] Using date range from: ${startDate.toISOString()}`)

    // Check if user is admin and has payment method
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_admin, stripe_customer_id, subscription_plan, subscription_status')
      .eq('id', userId)
      .single()

    console.log('🔍 [Crawler Stats API] User profile:', {
      profileFound: !!userProfile,
      isAdmin: userProfile?.is_admin,
      hasStripeId: !!userProfile?.stripe_customer_id,
      subscriptionPlan: userProfile?.subscription_plan,
      subscriptionStatus: userProfile?.subscription_status
    })

    const isAdmin = userProfile?.is_admin || false
    // User has payment method if they have a Stripe customer ID AND active subscription
    const hasPaymentMethod = !!(userProfile?.stripe_customer_id && userProfile?.subscription_status === 'active')
    const subscriptionPlan = userProfile?.subscription_plan || 'free'

    console.log(`🔍 [Crawler Stats API] User status - Admin: ${isAdmin}, Has Card: ${hasPaymentMethod}, Plan: ${subscriptionPlan}, Status: ${userProfile?.subscription_status}`)

    // Build query with appropriate limits
    let query = supabase
      .from('crawler_visits')
      .select('crawler_name, crawler_company, timestamp', { count: 'exact' })
      .gte('timestamp', startDate.toISOString())

    // Apply strict workspace filtering - no fallback to prevent data bleeding
    query = query.eq('workspace_id', workspaceId)

    console.log('🔍 [Crawler Stats API] Built query for crawler_visits table with workspace filter:', workspaceId)

    // Determine if we should apply limits
    let shouldLimitData = false
    let rowLimit = 999999 // Default to essentially unlimited

    if (isAdmin) {
      // Admin users: ALWAYS unlimited, no card required
      console.log('[Crawler Stats API] 👑 Admin user: No limits applied')
      shouldLimitData = false
    } else if (hasPaymentMethod) {
      // Any user with payment method: Unlimited viewing
      console.log('[Crawler Stats API] 💳 User has payment method: No limits applied')
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
      console.log(`[Crawler Stats API] 🚫 No payment method: Limiting to ${rowLimit} rows based on ${subscriptionPlan} plan`)
    }

    // Apply the appropriate data fetching strategy
    let allVisits: any[] = []
    
    if (shouldLimitData && rowLimit > 0) {
      // Limited users: single query with their plan limit
      const { data: visits, error } = await query.limit(rowLimit)
      
      if (error) {
        console.error('🔍 [Crawler Stats API] Error fetching crawler visits:', error)
        return NextResponse.json({ error: 'Failed to fetch crawler data' }, { status: 500 })
      }
      
      allVisits = visits || []
      console.log(`🔍 [Crawler Stats API] Limited user: Retrieved ${allVisits.length} visits (capped at ${rowLimit})`)
      console.log(`🔍 [Crawler Stats API] Sample visits:`, allVisits.slice(0, 3).map(v => ({ 
        crawler_name: v.crawler_name, 
        crawler_company: v.crawler_company, 
        timestamp: v.timestamp 
      })))
      
    } else {
      // Unlimited users (admin or has payment method): Fetch ALL data using pagination
      console.log('🔍 [Crawler Stats API] Starting paginated fetch for unlimited user...')
      
      // First, get the total count
      const { count, error: countError } = await query.select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('🔍 [Crawler Stats API] Error getting count:', countError)
        return NextResponse.json({ error: 'Failed to count visits' }, { status: 500 })
      }
      
      console.log(`🔍 [Crawler Stats API] Total records to fetch: ${count}`)
      
      // Fetch data in chunks of 1000 (Supabase's limit)
      const chunkSize = 1000
      const totalChunks = Math.ceil((count || 0) / chunkSize)
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize
        const end = start + chunkSize - 1
        
        const { data: chunk, error: chunkError } = await query.range(start, end)
        
        if (chunkError) {
          console.error(`🔍 [Crawler Stats API] Error fetching chunk ${i + 1}/${totalChunks}:`, chunkError)
          return NextResponse.json({ error: 'Failed to fetch all visits' }, { status: 500 })
        }
        
        allVisits = allVisits.concat(chunk || [])
        console.log(`🔍 [Crawler Stats API] Fetched chunk ${i + 1}/${totalChunks}: ${chunk?.length} records (total so far: ${allVisits.length})`)
      }
      
      console.log(`🔍 [Crawler Stats API] ✅ Successfully fetched all ${allVisits.length} visits`)
      console.log(`🔍 [Crawler Stats API] Sample visits:`, allVisits.slice(0, 3).map(v => ({ 
        crawler_name: v.crawler_name, 
        crawler_company: v.crawler_company, 
        timestamp: v.timestamp 
      })))
    }

    const visits = allVisits
    console.log(`🔍 [Crawler Stats API] Processing ${visits.length} visits for workspace ${workspaceId}`)

    if (!visits || visits.length === 0) {
      console.log(`🔍 [Crawler Stats API] No visits found for workspace ${workspaceId} in timeframe ${timeframe}`)
      return NextResponse.json({
        crawlers: [],
        totalCrawls: 0
      })
    }

    // Group by company first, then handle individual crawlers
    const companyStats = new Map<string, { visits: number, crawlers: Set<string> }>()
    const crawlerDetails = new Map<string, { visits: number, company: string }>()
    
    visits.forEach(visit => {
      const company = visit.crawler_company
      const crawler = visit.crawler_name
      
      // Track company stats
      if (companyStats.has(company)) {
        const stats = companyStats.get(company)!
        stats.visits++
        stats.crawlers.add(crawler)
      } else {
        companyStats.set(company, {
          visits: 1,
          crawlers: new Set([crawler])
        })
      }
      
      // Track individual crawler stats
      if (crawlerDetails.has(crawler)) {
        crawlerDetails.get(crawler)!.visits++
      } else {
        crawlerDetails.set(crawler, {
          visits: 1,
          company: company
        })
      }
    })

    const totalVisits = visits.length
    const crawlerData: Array<{
      name: string
      company: string
      percentage: number
      crawls: number
      icon: string
      color: string
    }> = []

    // Helper functions for icons and colors
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

    const getCrawlerColor = (company: string): string => {
      const colorMap: Record<string, string> = {
        'OpenAI': '#10a37f',
        'Anthropic': '#cc785c',
        'Google': '#4285f4',
        'Perplexity': '#1fb6ff',
        'Microsoft': '#00bcf2'
      }
      return colorMap[company] || '#888'
    }

    const getMainCrawlerName = (company: string, crawlerNames: string[]): string => {
      // Return the most common or representative crawler name for the company
      const mainCrawlers: Record<string, string> = {
        'OpenAI': 'GPTBot',
        'Anthropic': 'ClaudeBot',
        'Google': 'Google-Extended',
        'Perplexity': 'PerplexityBot',
        'Microsoft': 'BingBot'
      }
      return mainCrawlers[company] || crawlerNames[0] || company
    }
    
    // Check each company
    for (const [company, stats] of companyStats.entries()) {
      const crawlerNames = Array.from(stats.crawlers)
      
      // If company has multiple crawlers with significant traffic, show them separately
      if (crawlerNames.length > 1) {
        // Check if individual crawlers have significant traffic (>5% of company total)
        const significantCrawlers = crawlerNames.filter(crawler => {
          const crawlerVisits = crawlerDetails.get(crawler)?.visits || 0
          return (crawlerVisits / stats.visits) > 0.05 // More than 5% of company traffic
        })
        
        if (significantCrawlers.length > 1) {
          // Show crawlers separately
          significantCrawlers.forEach(crawler => {
            const crawlerInfo = crawlerDetails.get(crawler)!
            crawlerData.push({
              name: crawler,
              company: company,
              percentage: totalVisits > 0 ? (crawlerInfo.visits / totalVisits) * 100 : 0,
              crawls: crawlerInfo.visits,
              icon: getCrawlerIcon(company),
              color: getCrawlerColor(company)
            })
          })
        } else {
          // Aggregate under company name
          crawlerData.push({
            name: getMainCrawlerName(company, crawlerNames),
            company: company,
            percentage: totalVisits > 0 ? (stats.visits / totalVisits) * 100 : 0,
            crawls: stats.visits,
            icon: getCrawlerIcon(company),
            color: getCrawlerColor(company)
          })
        }
      } else {
        // Single crawler company
        crawlerData.push({
          name: crawlerNames[0] || company,
          company: company,
          percentage: totalVisits > 0 ? (stats.visits / totalVisits) * 100 : 0,
          crawls: stats.visits,
          icon: getCrawlerIcon(company),
          color: getCrawlerColor(company)
        })
      }
    }

    // Sort by crawls descending
    crawlerData.sort((a, b) => b.crawls - a.crawls)

    console.log(`🔍 [Crawler Stats API] Returning ${totalVisits} total crawls across ${crawlerData.length} crawlers`)

    return NextResponse.json({
      crawlers: crawlerData,
      totalCrawls: totalVisits
    })

  } catch (error) {
    console.error('🔍 [Crawler Stats API] Error in crawler stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 