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
    
    console.log(`[Crawler Stats API] Fetching crawler stats for timeframe: ${timeframe}`)
    
    // Calculate date range based on timeframe
    let startDate = new Date()
    
    switch (timeframe.toLowerCase()) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setHours(0, 0, 0, 0)
    }

    console.log(`[Crawler Stats API] Using date range from: ${startDate.toISOString()}`)

    // Fetch crawler visits within the timeframe
    const { data: visits, error } = await supabase
      .from('crawler_visits')
      .select('crawler_name, crawler_company, timestamp')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())

    if (error) {
      console.error('Error fetching crawler visits:', error)
      return NextResponse.json({ error: 'Failed to fetch crawler data' }, { status: 500 })
    }

    console.log(`[Crawler Stats API] Found ${visits?.length || 0} visits`)

    if (!visits || visits.length === 0) {
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
      return iconMap[company] || 'sparkles'
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

    console.log(`[Crawler Stats API] Returning ${totalVisits} total crawls across ${crawlerData.length} crawlers`)

    return NextResponse.json({
      crawlers: crawlerData,
      totalCrawls: totalVisits
    })

  } catch (error) {
    console.error('Error in crawler stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 