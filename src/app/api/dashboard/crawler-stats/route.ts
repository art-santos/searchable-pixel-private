import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    // Get the auth token from cookies
    const cookieStore = cookies()
    const token = cookieStore.get('sb-access-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get timeframe from query params
    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') || 'today'
    
    // Calculate date range based on timeframe
    let startDate = new Date()
    switch (timeframe.toLowerCase()) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case '7d':
      case '7 days':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
      case '30 days':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
      case '90 days':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setHours(0, 0, 0, 0)
    }

    // Query aggregated crawler stats
    const { data: crawlerStats, error: statsError } = await supabase
      .from('crawler_stats_daily')
      .select('crawler_name, crawler_company, visit_count')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('visit_count', { ascending: false })

    if (statsError) {
      console.error('Error fetching crawler stats:', statsError)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    // Aggregate by crawler company
    const companyStats = new Map<string, { visits: number, crawlers: Set<string> }>()
    let totalVisits = 0

    crawlerStats?.forEach(stat => {
      const company = stat.crawler_company
      if (!companyStats.has(company)) {
        companyStats.set(company, { visits: 0, crawlers: new Set() })
      }
      const companyStat = companyStats.get(company)!
      companyStat.visits += stat.visit_count || 0
      companyStat.crawlers.add(stat.crawler_name)
      totalVisits += stat.visit_count || 0
    })

    // Convert to array and calculate percentages
    const crawlerData = Array.from(companyStats.entries())
      .map(([company, stats]) => ({
        name: getMainCrawlerName(company, Array.from(stats.crawlers)),
        company,
        percentage: totalVisits > 0 ? (stats.visits / totalVisits) * 100 : 0,
        crawls: stats.visits,
        icon: getCrawlerIcon(company),
        color: getCrawlerColor(company)
      }))
      .sort((a, b) => b.crawls - a.crawls)
      .slice(0, 5) // Top 5

    return NextResponse.json({
      crawlers: crawlerData,
      totalCrawls: totalVisits,
      timeframe
    })

  } catch (error) {
    console.error('Error in crawler stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get the main crawler name for a company
function getMainCrawlerName(company: string, crawlerNames: string[]): string {
  // Prefer the most common/recognizable crawler name
  const preferredNames: Record<string, string> = {
    'OpenAI': 'GPTBot',
    'Anthropic': 'Claude-Web',
    'Google': 'Google-Extended',
    'Perplexity': 'PerplexityBot',
    'Microsoft': 'Bingbot'
  }
  
  return preferredNames[company] || crawlerNames[0] || company
}

// Helper function to get icon path for crawler company
function getCrawlerIcon(company: string): string {
  const iconMap: Record<string, string> = {
    'OpenAI': '/images/chatgpt.svg',
    'Anthropic': '/images/claude.svg',
    'Google': '/images/gemini.svg',
    'Perplexity': '/images/perplexity.svg',
    'Microsoft': '/images/bing.svg'
  }
  
  return iconMap[company] || ''
}

// Helper function to get color for crawler company
function getCrawlerColor(company: string): string {
  // Using consistent gray shades for now
  return '#555'
} 