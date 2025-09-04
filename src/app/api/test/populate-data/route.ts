import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

const crawlers = [
  { name: 'GPTBot', company: 'OpenAI', category: 'ai-training' },
  { name: 'ChatGPT-User', company: 'OpenAI', category: 'ai-assistant' },
  { name: 'ClaudeBot', company: 'Anthropic', category: 'ai-training' },
  { name: 'Claude-Web', company: 'Anthropic', category: 'ai-assistant' },
  { name: 'PerplexityBot', company: 'Perplexity', category: 'ai-search' },
  { name: 'Googlebot', company: 'Google', category: 'search-ai' },
  { name: 'Google-Extended', company: 'Google', category: 'ai-training' },
  { name: 'Bingbot', company: 'Microsoft', category: 'search-ai' },
  { name: 'FacebookBot', company: 'Meta', category: 'social-ai' },
  { name: 'Meta-ExternalAgent', company: 'Meta', category: 'ai-training' },
  { name: 'Bytespider', company: 'ByteDance', category: 'ai-training' },
  { name: 'CCBot', company: 'Common Crawl', category: 'ai-training' },
]

const pages = [
  '/',
  '/about',
  '/blog',
  '/products',
  '/contact',
  '/pricing',
  '/docs',
  '/api',
  '/features',
  '/blog/ai-trends-2024',
  '/blog/getting-started',
  '/docs/installation',
  '/docs/api-reference',
  '/products/analytics',
  '/products/monitoring'
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function generateRandomTimestamp(daysBack: number): string {
  const now = new Date()
  const minTime = now.getTime() - (daysBack * 24 * 60 * 60 * 1000)
  const maxTime = now.getTime()
  const randomTime = minTime + Math.random() * (maxTime - minTime)
  return new Date(randomTime).toISOString()
}

function generateDeviceInfo(deviceType: string) {
  const deviceData: Record<string, {device_type: string, device_info: any}> = {
    desktop: {
      device_type: 'desktop',
      device_info: {
        browser: getRandomElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
        os: getRandomElement(['Windows 10', 'macOS', 'Ubuntu']),
        screen_resolution: getRandomElement(['1920x1080', '2560x1440', '1440x900']),
        viewport: getRandomElement(['1920x1080', '1366x768', '1440x900'])
      }
    },
    mobile: {
      device_type: 'mobile',
      device_info: {
        browser: getRandomElement(['Mobile Chrome', 'Mobile Safari', 'Samsung Browser']),
        os: getRandomElement(['iOS 17', 'Android 14', 'iOS 16']),
        screen_resolution: getRandomElement(['375x667', '414x896', '390x844']),
        viewport: getRandomElement(['375x667', '414x896', '390x844'])
      }
    },
    tablet: {
      device_type: 'tablet',
      device_info: {
        browser: getRandomElement(['Chrome', 'Safari', 'Firefox']),
        os: getRandomElement(['iPadOS 17', 'Android 14', 'iPadOS 16']),
        screen_resolution: getRandomElement(['1024x768', '2048x1536', '1366x1024']),
        viewport: getRandomElement(['1024x768', '2048x1536', '1366x1024'])
      }
    }
  }
  return deviceData[deviceType] || deviceData.desktop
}

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function getLLMReferralSource(referrer: string | null): string | null {
  if (!referrer) return null
  
  const llmSources = {
    'chat.openai.com': 'chatgpt',
    'perplexity.ai': 'perplexity', 
    'claude.ai': 'claude',
    'bard.google.com': 'bard',
    'gemini.google.com': 'gemini',
    'copilot.microsoft.com': 'copilot',
    'you.com': 'you'
  }
  
  for (const [domain, source] of Object.entries(llmSources)) {
    if (referrer.includes(domain)) {
      return source
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Create server-side Supabase client with session
    const supabase = createClient()
    
    // Get the authenticated user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { workspaceId, count = 50 } = body

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Verify the user has access to this workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, domain, user_id')
      .eq('id', workspaceId)
      .single()
    
    if (workspaceError || !workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      )
    }
    
    if (workspace.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Generate test data
    const testVisits = []
    const domain = workspace.domain || 'example.com'

    for (let i = 0; i < count; i++) {
      const crawler = getRandomElement(crawlers)
      const path = getRandomElement(pages)
      const timestamp = generateRandomTimestamp(30) // Last 30 days
      const deviceType = getRandomElement(['desktop', 'mobile', 'tablet'])
      const deviceInfo = generateDeviceInfo(deviceType)
      const sessionId = generateSessionId()
      
      // Generate realistic referrers (some from LLMs, some organic)
      const referrers = [
        'https://chat.openai.com/',
        'https://perplexity.ai/search',
        'https://claude.ai/chat',
        'https://gemini.google.com/',
        'https://www.google.com/search',
        'https://www.bing.com/search',
        null // Direct traffic
      ]
      const referrer = Math.random() > 0.3 ? getRandomElement(referrers) : null
      const llmReferralSource = getLLMReferralSource(referrer)

      testVisits.push({
        user_id: user.id,
        workspace_id: workspaceId,
        domain: domain,
        path: path,
        crawler_name: crawler.name,
        crawler_company: crawler.company,
        crawler_category: crawler.category,
        user_agent: `Mozilla/5.0 (compatible; ${crawler.name}/1.0; +https://${crawler.company.toLowerCase()}.com/bot)`,
        timestamp: timestamp,
        status_code: Math.random() > 0.95 ? 404 : 200, // 5% 404s
        response_time_ms: Math.floor(Math.random() * 2000) + 100, // 100-2100ms
        country: getRandomElement(['US', 'GB', 'CA', 'DE', 'FR', 'AU', 'JP', null]),
        device_type: deviceInfo.device_type,
        device_info: deviceInfo.device_info,
        session_id: sessionId,
        referrer: referrer,
        llm_referral_source: llmReferralSource,
        metadata: {
          source: 'test_data_population',
          test_run: true,
          generated_at: new Date().toISOString(),
          page_title: `Test Page: ${path}`,
          campaign: Math.random() > 0.7 ? getRandomElement(['seo', 'content', 'blog', 'docs']) : null,
          session_duration: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
          bounce_rate: Math.random() > 0.7 ? true : false
        }
      })
    }

    // Insert test data using admin client to bypass RLS
    const { error: insertError } = await supabaseAdmin
      .from('crawler_visits')
      .insert(testVisits)

    if (insertError) {
      console.error('Error inserting test data:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to insert test data' },
        { status: 500 }
      )
    }

    // Generate summary stats
    const crawlerCounts = testVisits.reduce((acc, visit) => {
      acc[visit.crawler_name] = (acc[visit.crawler_name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const companyCounts = testVisits.reduce((acc, visit) => {
      acc[visit.crawler_company] = (acc[visit.crawler_company] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      message: `Successfully populated ${testVisits.length} test crawler visits`,
      details: {
        total_visits: testVisits.length,
        unique_crawlers: Object.keys(crawlerCounts).length,
        unique_companies: Object.keys(companyCounts).length,
        unique_pages: [...new Set(testVisits.map(v => v.path))].length,
        date_range: {
          earliest: Math.min(...testVisits.map(v => new Date(v.timestamp).getTime())),
          latest: Math.max(...testVisits.map(v => new Date(v.timestamp).getTime()))
        },
        crawler_breakdown: crawlerCounts,
        company_breakdown: companyCounts
      }
    })
  } catch (error) {
    console.error('Error populating test data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}