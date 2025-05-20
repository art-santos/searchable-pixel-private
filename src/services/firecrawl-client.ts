export interface FirecrawlOptions {
  limit?: number
}

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
const BASE_URL = 'https://api.firecrawl.dev'

export async function asyncCrawlUrl(url: string, options: FirecrawlOptions = {}) {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY not set')
  }

  const res = await fetch(`${BASE_URL}/crawl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({ url, ...options })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firecrawl start failed: ${res.status} ${text}`)
  }

  return res.json() as Promise<{ runId: string }>
}

export async function checkCrawlStatus(runId: string) {
  if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY not set')
  const res = await fetch(`${BASE_URL}/crawl/${runId}/status`, {
    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firecrawl status failed: ${res.status} ${text}`)
  }

  return res.json() as Promise<{ status: string; progress: number; total: number; completed: number }>
}

export async function getCrawlResults(runId: string) {
  if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY not set')
  const res = await fetch(`${BASE_URL}/crawl/${runId}/results`, {
    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` }
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firecrawl results failed: ${res.status} ${text}`)
  }
  return res.json() as Promise<any>
}
