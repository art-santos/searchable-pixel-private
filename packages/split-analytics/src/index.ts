/**
 * @split.dev/analytics
 * Simple AI crawler tracking for any website
 * Zero external dependencies, lightweight, reliable
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SplitConfig {
  /** Your Split Analytics API key */
  apiKey: string
  /** Custom API endpoint (optional) */
  apiEndpoint?: string
  /** Enable debug logging */
  debug?: boolean
}

export interface PingResponse {
  status: 'ok' | 'error'
  message?: string
  connection?: {
    authenticated: boolean
    keyName: string
    workspace: string
    domain: string | null
    plan?: string
  }
  timestamp?: string
}

export interface CrawlerInfo {
  /** Crawler name (e.g., 'GPTBot') */
  name: string
  /** Company that owns the crawler (e.g., 'OpenAI') */
  company: string
  /** Category of the crawler */
  category: 'ai-training' | 'ai-assistant' | 'ai-search' | 'search-ai' | 'social-ai' | 'ai-extraction' | 'archival'
}

export interface CrawlerVisit {
  /** Full URL that was visited */
  url: string
  /** User agent string */
  userAgent: string
  /** ISO timestamp of the visit */
  timestamp: string
  /** Detected crawler information */
  crawler?: CrawlerInfo
  /** Additional metadata about the request */
  metadata?: {
    method?: string
    statusCode?: number
    responseTime?: number
    pathname?: string
    [key: string]: any
  }
}

export interface TrackingEvent extends Omit<CrawlerVisit, 'timestamp'> {}

export interface AutoTrackOptions {
  /** Full URL that was visited */
  url: string
  /** User agent string (can be null) */
  userAgent: string | null
  /** HTTP method used */
  method?: string
  /** HTTP status code returned */
  statusCode?: number
  /** Response time in milliseconds */
  responseTime?: number
}

// Add method signatures to the SplitAnalytics class
export interface ISplitAnalytics {
  ping(): Promise<PingResponse>
  track(visit: TrackingEvent): Promise<boolean>
  autoTrack(options: AutoTrackOptions): Promise<boolean>
  isAICrawler(userAgent: string | null): boolean
  getCrawlerInfo(userAgent: string | null): CrawlerInfo | null
}

// ============================================================================
// CRAWLER DETECTION - 20+ AI CRAWLERS
// ============================================================================

const AI_CRAWLERS = {
  // OpenAI (3 main crawlers)
  'GPTBot': { name: 'GPTBot', company: 'OpenAI', category: 'ai-training' },
  'ChatGPT-User': { name: 'ChatGPT-User', company: 'OpenAI', category: 'ai-assistant' },
  'OAI-SearchBot': { name: 'OAI-SearchBot', company: 'OpenAI', category: 'ai-search' },
  
  // Anthropic
  'Claude-Web': { name: 'Claude-Web', company: 'Anthropic', category: 'ai-assistant' },
  'ClaudeBot': { name: 'ClaudeBot', company: 'Anthropic', category: 'ai-training' },
  'anthropic-ai': { name: 'anthropic-ai', company: 'Anthropic', category: 'ai-training' },
  
  // Google/Alphabet
  'Google-Extended': { name: 'Google-Extended', company: 'Google', category: 'ai-training' },
  'Googlebot': { name: 'Googlebot', company: 'Google', category: 'search-ai' },
  'Googlebot-Image': { name: 'Googlebot-Image', company: 'Google', category: 'search-ai' },
  'Googlebot-News': { name: 'Googlebot-News', company: 'Google', category: 'search-ai' },
  
  // Microsoft
  'Bingbot': { name: 'Bingbot', company: 'Microsoft', category: 'search-ai' },
  'msnbot': { name: 'msnbot', company: 'Microsoft', category: 'search-ai' },
  'BingPreview': { name: 'BingPreview', company: 'Microsoft', category: 'search-ai' },
  
  // Perplexity
  'PerplexityBot': { name: 'PerplexityBot', company: 'Perplexity', category: 'ai-search' },
  
  // Meta/Facebook
  'FacebookBot': { name: 'FacebookBot', company: 'Meta', category: 'social-ai' },
  'facebookexternalhit': { name: 'facebookexternalhit', company: 'Meta', category: 'social-ai' },
  'Meta-ExternalAgent': { name: 'Meta-ExternalAgent', company: 'Meta', category: 'ai-training' },
  
  // Other AI Search Engines
  'YouBot': { name: 'YouBot', company: 'You.com', category: 'ai-search' },
  'Neeva': { name: 'Neeva', company: 'Neeva', category: 'ai-search' },
  'Phind': { name: 'Phind', company: 'Phind', category: 'ai-search' },
  
  // Chinese AI Companies
  'Bytespider': { name: 'Bytespider', company: 'ByteDance', category: 'ai-training' },
  'Baiduspider': { name: 'Baiduspider', company: 'Baidu', category: 'search-ai' },
  'Sogou': { name: 'Sogou', company: 'Sogou', category: 'search-ai' },
  
  // E-commerce & Enterprise
  'Amazonbot': { name: 'Amazonbot', company: 'Amazon', category: 'ai-assistant' },
  'LinkedInBot': { name: 'LinkedInBot', company: 'LinkedIn', category: 'social-ai' },
  'Twitterbot': { name: 'Twitterbot', company: 'Twitter', category: 'social-ai' },
  
  // Apple
  'Applebot': { name: 'Applebot', company: 'Apple', category: 'search-ai' },
  'Applebot-Extended': { name: 'Applebot-Extended', company: 'Apple', category: 'ai-training' },
  
  // Data Extraction & Analysis
  'Diffbot': { name: 'Diffbot', company: 'Diffbot', category: 'ai-extraction' },
  'DataForSeoBot': { name: 'DataForSeoBot', company: 'DataForSEO', category: 'ai-extraction' },
  'SemrushBot': { name: 'SemrushBot', company: 'Semrush', category: 'ai-extraction' },
  'AhrefsBot': { name: 'AhrefsBot', company: 'Ahrefs', category: 'ai-extraction' },
  
  // Common Crawl & Research
  'CCBot': { name: 'CCBot', company: 'Common Crawl', category: 'ai-training' },
  'ia_archiver': { name: 'ia_archiver', company: 'Internet Archive', category: 'archival' },
  
  // Other Notable AI Crawlers
  'PetalBot': { name: 'PetalBot', company: 'Petal Search', category: 'search-ai' },
  'SeznamBot': { name: 'SeznamBot', company: 'Seznam', category: 'search-ai' },
  'Yandex': { name: 'YandexBot', company: 'Yandex', category: 'search-ai' },
  'DuckDuckBot': { name: 'DuckDuckBot', company: 'DuckDuckGo', category: 'search-ai' },
  'Qwantify': { name: 'Qwantify', company: 'Qwant', category: 'search-ai' },
} as const

function detectCrawler(userAgent: string | null) {
  if (!userAgent) return null
  
  for (const [key, info] of Object.entries(AI_CRAWLERS)) {
    if (userAgent.includes(key)) {
      return info
    }
  }
  
  return null
}

// ============================================================================
// CORE SPLIT ANALYTICS CLASS
// ============================================================================

export class SplitAnalytics implements ISplitAnalytics {
  private config: Required<SplitConfig>
  
  constructor(config: SplitConfig) {
    if (!config.apiKey) {
      throw new Error('[Split Analytics] API key is required')
    }
    
    // Validate API key format
    if (!config.apiKey.startsWith('split_live_') && !config.apiKey.startsWith('split_test_')) {
      throw new Error('[Split Analytics] Invalid API key format. Keys should start with "split_live_" or "split_test_"')
    }
    
    this.config = {
      apiKey: config.apiKey,
      apiEndpoint: config.apiEndpoint || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api' : 'https://split.dev/api'),
      debug: config.debug || false
    }
    
    if (this.config.debug) {
      console.log('[Split Analytics] Initialized with:', {
        endpoint: this.config.apiEndpoint,
        keyType: config.apiKey.startsWith('split_test_') ? 'test' : 'live',
        debug: this.config.debug
      })
    }
  }
  
  /**
   * Test connection to Split Analytics API
   */
  async ping(): Promise<PingResponse> {
    try {
      // Validate API key format first
      if (!this.config.apiKey.startsWith('split_live_') && !this.config.apiKey.startsWith('split_test_')) {
        return {
          status: 'error',
          message: 'Invalid API key format. Keys should start with "split_live_" or "split_test_"'
        }
      }

      const response = await fetch(`${this.config.apiEndpoint}/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': '@split.dev/analytics npm package'
        }
      })
      
      if (!response.ok) {
        let errorMessage: string
        
        try {
          const errorData = await response.json() as { message?: string; error?: string }
          errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`
        } catch {
          // Handle different HTTP status codes with helpful messages
          switch (response.status) {
            case 401:
              errorMessage = 'Invalid API key. Check your key in the Split Analytics dashboard.'
            case 403:
              errorMessage = 'API key access denied. Verify your key has the correct permissions.'
              break
            case 404:
              errorMessage = 'API endpoint not found. This might be a temporary issue with the Split Analytics service.'
              break
            case 429:
              errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
              break
            case 500:
              errorMessage = 'Split Analytics server error. Please try again later.'
              break
            default:
              errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
        }
        
        if (this.config.debug) {
          console.error('[Split Analytics] Ping failed:', {
            status: response.status,
            statusText: response.statusText,
            url: `${this.config.apiEndpoint}/ping`,
            apiKeyPrefix: this.config.apiKey.substring(0, 12) + '...'
          })
        }
        
        return {
          status: 'error',
          message: errorMessage
        }
      }
      
      const data = await response.json() as PingResponse
      
      if (this.config.debug) {
        console.log('[Split Analytics] Ping successful:', data)
      }
      
      return data
    } catch (error) {
      let message: string
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        message = 'Network error: Unable to connect to Split Analytics. Check your internet connection.'
      } else if (error instanceof Error) {
        message = `Connection error: ${error.message}`
      } else {
        message = 'Unknown connection error'
      }
      
      if (this.config.debug) {
        console.error('[Split Analytics] Ping failed:', {
          error,
          endpoint: `${this.config.apiEndpoint}/ping`,
          apiKeyPrefix: this.config.apiKey.substring(0, 12) + '...'
        })
      }
      
      return { 
        status: 'error', 
        message,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  /**
   * Track a crawler visit
   */
  async track(visit: TrackingEvent): Promise<boolean> {
    try {
      const fullVisit: CrawlerVisit = {
        ...visit,
        timestamp: new Date().toISOString()
      }
      
      if (this.config.debug) {
        console.log('[Split Analytics] Tracking visit:', {
          url: fullVisit.url,
          crawler: fullVisit.crawler?.name,
          userAgent: fullVisit.userAgent.substring(0, 50) + '...'
        })
      }
      
      const response = await fetch(`${this.config.apiEndpoint}/crawler-events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': '@split.dev/analytics npm package'
        },
        body: JSON.stringify({ events: [fullVisit] })
      })
      
      if (!response.ok) {
        if (this.config.debug) {
          console.error('[Split Analytics] Track failed:', {
            status: response.status,
            statusText: response.statusText,
            url: fullVisit.url,
            crawler: fullVisit.crawler?.name
          })
        }
        return false
      }
      
      if (this.config.debug) {
        console.log('[Split Analytics] Successfully tracked:', fullVisit.crawler?.name || 'unknown crawler')
      }
      
      return true
    } catch (error) {
      if (this.config.debug) {
        console.error('[Split Analytics] Track error:', {
          error: error instanceof Error ? error.message : error,
          url: visit.url,
          crawler: visit.crawler?.name
        })
      }
      return false
    }
  }
  
  /**
   * Automatically detect and track crawler from request
   */
  async autoTrack(options: AutoTrackOptions): Promise<boolean> {
    const crawler = detectCrawler(options.userAgent)
    
    if (!crawler) {
      if (this.config.debug) {
        console.log('[Split Analytics] No crawler detected in user agent:', options.userAgent?.substring(0, 50) + '...')
      }
      return false // Not a crawler, nothing to track
    }
    
    if (this.config.debug) {
      console.log('[Split Analytics] Auto-detected crawler:', crawler.name)
    }
    
    return this.track({
      url: options.url,
      userAgent: options.userAgent || '',
      crawler,
      metadata: {
        method: options.method,
        statusCode: options.statusCode,
        responseTime: options.responseTime
      }
    })
  }

  isAICrawler(userAgent: string | null): boolean {
    return detectCrawler(userAgent) !== null
  }

  getCrawlerInfo(userAgent: string | null): CrawlerInfo | null {
    return detectCrawler(userAgent)
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a new Split Analytics instance
 */
export function createSplit(config: SplitConfig): SplitAnalytics {
  return new SplitAnalytics(config)
}

/**
 * Quick ping function without creating an instance
 */
export async function ping(config: SplitConfig): Promise<PingResponse> {
  const split = new SplitAnalytics(config)
  return split.ping()
}

/**
 * Quick track function without creating an instance
 */
export async function track(config: SplitConfig, visit: TrackingEvent): Promise<boolean> {
  const split = new SplitAnalytics(config)
  return split.track(visit)
}

/**
 * Detect if a user agent is an AI crawler
 */
export function isAICrawler(userAgent: string | null): boolean {
  return detectCrawler(userAgent) !== null
}

/**
 * Get crawler information from user agent
 */
export function getCrawlerInfo(userAgent: string | null): CrawlerInfo | null {
  return detectCrawler(userAgent)
}

/**
 * Test utility to verify package installation and basic functionality
 * This is primarily for debugging and integration testing
 */
export async function testInstallation(config?: Partial<SplitConfig>): Promise<{
  packageImport: boolean
  crawlerDetection: boolean
  apiConnection: boolean
  apiConnectionDetails?: PingResponse
}> {
  const result = {
    packageImport: true, // If we got here, import worked
    crawlerDetection: false,
    apiConnection: false,
    apiConnectionDetails: undefined as PingResponse | undefined
  }
  
  try {
    // Test crawler detection
    const testUserAgent = 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)'
    const isCrawler = isAICrawler(testUserAgent)
    const crawlerInfo = getCrawlerInfo(testUserAgent)
    
    result.crawlerDetection = isCrawler && crawlerInfo?.name === 'GPTBot'
    
    // Test API connection if config provided
    if (config?.apiKey) {
      const pingResult = await ping({
        apiKey: config.apiKey,
        apiEndpoint: config.apiEndpoint,
        debug: config.debug
      })
      
      result.apiConnection = pingResult.status === 'ok'
      result.apiConnectionDetails = pingResult
    }
  } catch (error) {
    // Tests failed, but at least package import worked
  }
  
  return result
} 