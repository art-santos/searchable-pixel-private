import { AI_CRAWLERS, CrawlerInfo } from './constants'

// Type for unknown crawlers
export interface UnknownCrawlerInfo {
  company: string
  bot: string
  category: string
}

export interface CrawlerDetectionResult {
  isAICrawler: boolean
  crawler?: CrawlerInfo | UnknownCrawlerInfo
  userAgent: string
}

/**
 * Detects if a user agent string belongs to an AI crawler
 */
export function detectAICrawler(userAgent: string | null): CrawlerDetectionResult {
  if (!userAgent) {
    return {
      isAICrawler: false,
      userAgent: ''
    }
  }

  // Check each known crawler pattern
  for (const [pattern, info] of Object.entries(AI_CRAWLERS)) {
    if (userAgent.includes(pattern)) {
      return {
        isAICrawler: true,
        crawler: info,
        userAgent
      }
    }
  }

  // Additional checks for less specific patterns
  const lowerUA = userAgent.toLowerCase()
  
  // Check for bot patterns that might indicate AI crawlers
  const aiPatterns = [
    'ai-crawler',
    'ai-bot',
    'llm-crawler',
    'training-bot',
    'ml-bot'
  ]
  
  for (const pattern of aiPatterns) {
    if (lowerUA.includes(pattern)) {
      return {
        isAICrawler: true,
        crawler: {
          company: 'Unknown',
          bot: pattern,
          category: 'unknown'
        } as UnknownCrawlerInfo,
        userAgent
      }
    }
  }

  return {
    isAICrawler: false,
    userAgent
  }
}

/**
 * Extract additional metadata from the request
 */
export function extractRequestMetadata(request: {
  headers: Record<string, string | string[] | undefined>
  url?: string
  method?: string
}) {
  const metadata: Record<string, any> = {}

  // Extract referer
  const referer = request.headers['referer'] || request.headers['referrer']
  if (referer) {
    metadata.referer = Array.isArray(referer) ? referer[0] : referer
  }

  // Extract accept headers to understand what the crawler wants
  const accept = request.headers['accept']
  if (accept) {
    metadata.accept = Array.isArray(accept) ? accept.join(', ') : accept
  }

  // Extract encoding
  const encoding = request.headers['accept-encoding']
  if (encoding) {
    metadata.acceptEncoding = Array.isArray(encoding) ? encoding.join(', ') : encoding
  }

  // Extract language preferences
  const language = request.headers['accept-language']
  if (language) {
    metadata.acceptLanguage = Array.isArray(language) ? language[0] : language
  }

  return metadata
} 