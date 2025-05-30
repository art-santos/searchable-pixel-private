export interface FirecrawlOptions {
  limit?: number
  maxDepth?: number
}

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
const BASE_URL = 'https://api.firecrawl.dev/v1'

export async function asyncCrawlUrl(url: string, options: FirecrawlOptions = {}) {
  console.log('🔥 Starting Firecrawl for:', url)
  
  if (!FIRECRAWL_API_KEY) {
    console.error('❌ FIRECRAWL_API_KEY not set')
    throw new Error('FIRECRAWL_API_KEY not set')
  }

  // V1 API format
  const requestBody = {
    url,
    limit: options.limit || 10,
    maxDepth: options.maxDepth || 2,
    scrapeOptions: {
      formats: ['markdown', 'html'],
      onlyMainContent: true
    }
  }
  
  const res = await fetch(`${BASE_URL}/crawl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify(requestBody)
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('❌ Firecrawl API error:', { status: res.status, response: text })
    throw new Error(`Firecrawl start failed: ${res.status} ${text}`)
  }

  const responseData = await res.json()
  console.log('✅ Firecrawl crawl started, ID:', responseData.id)
  
  return responseData as Promise<{ 
    success?: boolean
    id?: string 
    url?: string
  }>
}

export async function checkCrawlStatus(crawlId: string) {
  if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY not set')
  const res = await fetch(`${BASE_URL}/crawl/${crawlId}`, {
    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` }
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('❌ Status check error:', { status: res.status, response: text })
    throw new Error(`Firecrawl status failed: ${res.status} ${text}`)
  }

  const statusData = await res.json()
  console.log(`📊 Crawl status: ${statusData.status} (${statusData.completed || 0}/${statusData.total || 0})`)
  
  return statusData as Promise<{ 
    status: string
    total: number
    completed: number
    creditsUsed: number
    expiresAt: string
    data?: any[]
  }>
}
