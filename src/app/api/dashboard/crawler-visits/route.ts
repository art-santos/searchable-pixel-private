import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  getTimeframeConfig,
  fetchDataInBatches,
  getAggregationKey,
  generateChartData,
  MONTH_NAMES
} from '@/lib/chart-utils'

interface CrawlerVisit {
  timestamp: string
  crawler_name: string
  crawler_company: string
  workspace_id: string
}

interface PeriodComparison {
  hasComparison: boolean
  percentChange?: number
  trend?: 'up' | 'down' | 'same'
}

interface CrawlerInfo {
  id: string
  name: string
  company: string
  count: number
  icon: string
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Get query params
    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') || 'Last 7 days'
    const crawler = url.searchParams.get('crawler') || 'all'
    const timezone = url.searchParams.get('timezone') || 'UTC'
    const workspaceId = url.searchParams.get('workspaceId')
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    // Get timeframe configuration
    const config = getTimeframeConfig(timeframe)
    
    // For period comparison, we need to fetch data from 2x the timeframe back
    const dataFetchStartDate = new Date(config.startDate)
    const timeframeLower = timeframe.toLowerCase()
    
    if (timeframeLower === 'last 24 hours' || timeframeLower === 'last24h') {
      dataFetchStartDate.setHours(dataFetchStartDate.getHours() - 24)
    } else if (timeframeLower === 'last 7 days' || timeframeLower === 'last7d') {
      dataFetchStartDate.setDate(dataFetchStartDate.getDate() - 7)
    } else if (timeframeLower === 'last 30 days' || timeframeLower === 'last30d') {
      dataFetchStartDate.setDate(dataFetchStartDate.getDate() - 30)
    } else if (timeframeLower === 'last 90 days' || timeframeLower === 'last90d') {
      dataFetchStartDate.setDate(dataFetchStartDate.getDate() - 90)
    } else if (timeframeLower === 'last 365 days' || timeframeLower === 'last365d') {
      dataFetchStartDate.setDate(dataFetchStartDate.getDate() - 365)
    }

    // Check user permissions and limits
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_admin, stripe_customer_id, subscription_plan, subscription_status')
      .eq('id', userId)
      .single()

    const isAdmin = userProfile?.is_admin || false
    const hasPaymentMethod = !!(userProfile?.stripe_customer_id && userProfile?.subscription_status === 'active')
    const subscriptionPlan = userProfile?.subscription_plan || 'free'

    // Determine data limits
    let shouldLimitData = false
    let rowLimit = 999999

    if (!isAdmin && !hasPaymentMethod) {
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
          rowLimit = 0
      }
    }

    // Fetch visits with appropriate strategy
    let visits: CrawlerVisit[] = []
    
    if (shouldLimitData && rowLimit === 0) {
      // Free plan with no data
      visits = []
    } else if (shouldLimitData && rowLimit > 0) {
      // Limited fetch for non-paying users
      const filters: Record<string, any> = {
        workspace_id: workspaceId,
        gte_timestamp: dataFetchStartDate.toISOString()
      }
      if (crawler !== 'all') {
        filters.crawler_name = crawler
      }

      let query = supabase
        .from('crawler_visits')
        .select('timestamp, crawler_name, crawler_company')
        .eq('workspace_id', workspaceId)
        .gte('timestamp', dataFetchStartDate.toISOString())
        .order('timestamp', { ascending: true })
        .limit(rowLimit)
      
      if (crawler !== 'all') {
        query = query.eq('crawler_name', crawler)
      }

      const { data, error } = await query
      visits = data || []
    } else {
      // Unlimited fetch using optimized batching
      const filters: Record<string, any> = {
        workspace_id: workspaceId,
        gte_timestamp: dataFetchStartDate.toISOString()
      }
      if (crawler !== 'all') {
        filters.crawler_name = crawler
      }

      visits = await fetchDataInBatches<CrawlerVisit>(
        supabase,
        'crawler_visits',
        filters,
        'timestamp, crawler_name, crawler_company',
        { column: 'timestamp', ascending: true }
      )
    }

    // Calculate period comparison
    let periodComparison: PeriodComparison | null = null
    
    // Check if we have enough historical data
    const { data: oldestVisitData } = await supabase
      .from('crawler_visits')
      .select('timestamp')
      .eq('workspace_id', workspaceId)
      .order('timestamp', { ascending: true })
      .limit(1)

    if (oldestVisitData && oldestVisitData.length > 0) {
      const oldestVisit = new Date(oldestVisitData[0].timestamp)
      const now = new Date()
      const daysSinceOldest = Math.floor((now.getTime() - oldestVisit.getTime()) / (1000 * 60 * 60 * 24))
      
      let requiredDaysForComparison: number
      switch (timeframeLower) {
        case 'last 24 hours':
        case 'last24h':
          requiredDaysForComparison = 2
          break
        case 'last 7 days':
        case 'last7d':
          requiredDaysForComparison = 14
          break
        case 'last 30 days':
        case 'last30d':
          requiredDaysForComparison = 60
          break
        case 'last 90 days':
        case 'last90d':
          requiredDaysForComparison = 180
          break
        case 'last 365 days':
        case 'last365d':
          requiredDaysForComparison = 730
          break
        default:
          requiredDaysForComparison = 60
      }
      
      if (daysSinceOldest >= requiredDaysForComparison) {
        // Calculate period comparison
        const currentPeriodVisits = visits.filter(v => new Date(v.timestamp) >= config.startDate)
        const previousPeriodVisits = visits.filter(v => new Date(v.timestamp) < config.startDate)
        
        const currentCount = currentPeriodVisits.length
        const previousCount = previousPeriodVisits.length
        
        if (previousCount > 0) {
          const percentChange = ((currentCount - previousCount) / previousCount) * 100
          periodComparison = {
            hasComparison: true,
            percentChange: Math.round(percentChange),
            trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'same'
          }
        } else if (currentCount > 0) {
          periodComparison = {
            hasComparison: true,
            percentChange: 100,
            trend: 'up'
          }
        } else {
          periodComparison = {
            hasComparison: true,
            percentChange: 0,
            trend: 'same'
          }
        }
      }
    }

    // Process visits for current period only
    const currentPeriodVisits = visits.filter(v => new Date(v.timestamp) >= config.startDate)
    
    // Aggregate data
    const timeAggregates = new Map<string, number>()
    const crawlerSet = new Map<string, { company: string, count: number }>()

    currentPeriodVisits.forEach(visit => {
      const date = new Date(visit.timestamp)
      const key = getAggregationKey(date, config.groupBy)
      
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
    const chartDataRaw = generateChartData(timeAggregates, config)
    
    // Transform to match expected format
    const chartData = chartDataRaw.map(point => ({
      date: point.date,
      crawls: point.value,
      isCurrentPeriod: point.isCurrentPeriod,
      showLabel: point.showLabel
    }))

    // Get available crawlers with icons
    const availableCrawlers: CrawlerInfo[] = Array.from(crawlerSet.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, info]) => ({
        id: name,
        name,
        company: info.company,
        count: info.count,
        icon: getCrawlerIcon(info.company)
      }))

    const totalCrawls = currentPeriodVisits.length

    return NextResponse.json({
      chartData,
      availableCrawlers,
      totalCrawls,
      timeframe,
      periodComparison
    })

  } catch (error) {
    console.error('Error in crawler visits API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get crawler icon
function getCrawlerIcon(company: string): string {
  const iconMap: Record<string, string> = {
    'OpenAI': '/images/chatgpt.svg',
    'Anthropic': '/images/claude.svg',
    'Google': '/images/gemini.svg',
    'Perplexity': '/images/perplexity.svg',
    'Microsoft': '/images/bing.svg'
  }
  
  if (iconMap[company]) {
    return iconMap[company]
  }
  
  // Favicon fallback
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