export interface FirecrawlOptions {
  limit?: number
  maxDepth?: number
}

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
const BASE_URL = 'https://api.firecrawl.dev'

export async function asyncCrawlUrl(url: string, options: FirecrawlOptions = {}) {
  console.log('🔥 Firecrawl asyncCrawlUrl called with:', { url, options })
  
  if (!FIRECRAWL_API_KEY) {
    console.error('❌ FIRECRAWL_API_KEY not set')
    throw new Error('FIRECRAWL_API_KEY not set')
  }

  console.log('📞 Making Firecrawl API request to:', `${BASE_URL}/crawl`)
  
  const res = await fetch(`${BASE_URL}/crawl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({ url, ...options })
  })

  console.log('📡 Firecrawl API response status:', res.status)
  
  if (!res.ok) {
    const text = await res.text()
    console.error('❌ Firecrawl API error:', { status: res.status, response: text })
    throw new Error(`Firecrawl start failed: ${res.status} ${text}`)
  }

  const responseData = await res.json()
  console.log('✅ Firecrawl API response data:', responseData)
  
  return responseData as Promise<{ 
    success?: boolean
    id?: string 
    runId?: string 
    jobId?: string
  }>
}

export async function checkCrawlStatus(runId: string) {
  console.log('🔍 Checking crawl status for ID:', runId)
  
  if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY not set')
  const res = await fetch(`${BASE_URL}/crawl/${runId}/status`, {
    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` }
  })

  console.log('📊 Status check response:', res.status)
  
  if (!res.ok) {
    const text = await res.text()
    console.error('❌ Status check error:', { status: res.status, response: text })
    throw new Error(`Firecrawl status failed: ${res.status} ${text}`)
  }

  const statusData = await res.json()
  console.log('📈 Status data:', statusData)
  
  return statusData as Promise<{ status: string; progress: number; total: number; completed: number }>
}

export async function getCrawlResults(runId: string) {
  console.log('📥 Getting crawl results for ID:', runId)
  
  if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY not set')
  const res = await fetch(`${BASE_URL}/crawl/${runId}/results`, {
    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` }
  })
  
  console.log('📋 Results response status:', res.status)
  
  if (!res.ok) {
    const text = await res.text()
    console.error('❌ Results fetch error:', { status: res.status, response: text })
    throw new Error(`Firecrawl results failed: ${res.status} ${text}`)
  }
  
  const resultsData = await res.json()
  console.log('📄 Results data summary:', {
    status: resultsData.status,
    dataLength: resultsData.data ? resultsData.data.length : 'no data',
    hasData: !!resultsData.data
  })
  
  return resultsData as Promise<any>
}
