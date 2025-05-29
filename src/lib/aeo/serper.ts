import PQueue from 'p-queue'

// Rate limiting: 20 requests per second for serper.dev free plan
const queue = new PQueue({ 
  interval: 1000, // 1 second
  intervalCap: 20  // 20 requests per second
})

export interface SerperResult {
  title: string
  url: string
  snippet: string
  position: number
}

export interface SerperResponse {
  organic: SerperResult[]
  answerBox?: any
  knowledgeGraph?: any
  searchParameters: {
    q: string
    type: string
    engine: string
  }
}

export interface SerpResults {
  [question: string]: {
    results: SerperResult[]
    metadata: {
      question: string
      total_results: number
      search_time: string
      status: 'success' | 'error'
      error_message?: string
    }
  }
}

/**
 * Searches all questions via Serper.dev with rate limiting
 */
export async function searchQuestions(
  questions: string[], 
  onProgress?: (completed: number, total: number, currentQuestion: string) => void
): Promise<SerpResults> {
  console.log(`🔍 Starting SERP searches for ${questions.length} questions`)
  
  const results: SerpResults = {}
  let completed = 0
  
  // Process questions with rate limiting
  const searchPromises = questions.slice(0, 50).map(question => 
    queue.add(async () => {
      try {
        onProgress?.(completed, questions.length, question)
        
        const searchResult = await searchSingleQuestion(question)
        results[question] = {
          results: searchResult.organic || [],
          metadata: {
            question,
            total_results: searchResult.organic?.length || 0,
            search_time: new Date().toISOString(),
            status: 'success'
          }
        }
        
        completed++
        onProgress?.(completed, questions.length, question)
        
        console.log(`✅ [${completed}/${questions.length}] ${question} → ${searchResult.organic?.length || 0} results`)
        
      } catch (error) {
        console.error(`❌ Failed to search: ${question}`, error)
        
        results[question] = {
          results: [],
          metadata: {
            question,
            total_results: 0,
            search_time: new Date().toISOString(),
            status: 'error',
            error_message: error instanceof Error ? error.message : String(error)
          }
        }
        
        completed++
        onProgress?.(completed, questions.length, question)
      }
    })
  )
  
  await Promise.all(searchPromises)
  
  console.log(`🎯 Completed ${completed} searches, ${Object.keys(results).length} results`)
  return results
}

/**
 * Searches a single question via Serper.dev
 */
async function searchSingleQuestion(question: string): Promise<SerperResponse> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    throw new Error('SERPER_API_KEY not configured')
  }
  
  const requestBody = {
    q: question,
    num: 10, // Top 10 results
    type: 'search',
    autocorrect: true,
    engine: 'google'
  }
  
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey
    },
    body: JSON.stringify(requestBody)
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    
    // Handle rate limiting
    if (response.status === 429) {
      console.log('⏱️ Rate limited, retrying after delay...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      return searchSingleQuestion(question) // Retry
    }
    
    throw new Error(`Serper API error: ${response.status} - ${errorText}`)
  }
  
  const data = await response.json()
  
  // Validate response structure
  if (!data.organic) {
    console.warn(`⚠️ No organic results for: ${question}`)
    data.organic = []
  }
  
  // Ensure each result has required fields
  data.organic = data.organic.map((result: any, index: number) => ({
    title: result.title || 'No title',
    url: result.link || result.url || '',
    snippet: result.snippet || result.description || '',
    position: index + 1
  }))
  
  return data
}

/**
 * Retries a failed search with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      const maxDelay = 30000 // Cap at 30 seconds
      
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, maxDelay)))
      console.log(`🔄 Retry attempt ${attempt} after ${Math.round(delay)}ms delay`)
    }
  }
  
  throw lastError!
}

/**
 * Extracts all unique URLs from SERP results
 */
export function extractUrlsFromResults(serpResults: SerpResults): string[] {
  const urls = new Set<string>()
  
  Object.values(serpResults).forEach(result => {
    result.results.forEach(item => {
      if (item.url && item.url.startsWith('http')) {
        urls.add(item.url)
      }
    })
  })
  
  return Array.from(urls)
}

/**
 * Groups SERP results by domain for analysis
 */
export function groupResultsByDomain(serpResults: SerpResults): Record<string, SerperResult[]> {
  const domainGroups: Record<string, SerperResult[]> = {}
  
  Object.values(serpResults).forEach(result => {
    result.results.forEach(item => {
      try {
        const url = new URL(item.url)
        const domain = url.hostname.replace(/^www\./, '')
        
        if (!domainGroups[domain]) {
          domainGroups[domain] = []
        }
        
        domainGroups[domain].push(item)
      } catch {
        // Skip invalid URLs
      }
    })
  })
  
  return domainGroups
} 