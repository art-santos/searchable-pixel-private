import { CrawlerInfo } from './constants'
import { UnknownCrawlerInfo } from './detector'
import { 
  DEFAULT_API_ENDPOINT, 
  BATCH_SIZE, 
  BATCH_INTERVAL_MS,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY_MS 
} from './constants'

export interface CrawlerEvent {
  timestamp: string
  domain: string
  path: string
  crawlerName: string
  crawlerCompany: string
  crawlerCategory: string
  userAgent: string
  statusCode?: number
  responseTimeMs?: number
  country?: string
  metadata?: Record<string, any>
}

export interface TrackerConfig {
  apiKey: string
  apiEndpoint?: string
  batchSize?: number
  batchIntervalMs?: number
  debug?: boolean
  onError?: (error: Error) => void
}

export interface PingResponse {
  status: 'ok' | 'error'
  connection?: {
    authenticated: boolean
    keyName: string
    workspace: string
    domain: string | null
  }
  message?: string
  timestamp?: string
}

export class CrawlerTracker {
  private config: Required<TrackerConfig>
  private eventQueue: CrawlerEvent[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private isSending = false

  constructor(config: TrackerConfig) {
    this.config = {
      apiKey: config.apiKey,
      apiEndpoint: config.apiEndpoint || DEFAULT_API_ENDPOINT,
      batchSize: config.batchSize || BATCH_SIZE,
      batchIntervalMs: config.batchIntervalMs || BATCH_INTERVAL_MS,
      debug: config.debug || false,
      onError: config.onError || ((error) => console.error('[Split Analytics]', error))
    }
  }

  /**
   * Track a crawler visit
   */
  async track(event: Omit<CrawlerEvent, 'timestamp'>) {
    const fullEvent: CrawlerEvent = {
      ...event,
      timestamp: new Date().toISOString()
    }

    this.eventQueue.push(fullEvent)

    if (this.config.debug) {
      console.log('[Split Analytics] Event queued:', fullEvent)
    }

    // Check if we should send immediately
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.flush()
    } else {
      // Schedule batch send
      this.scheduleBatch()
    }
  }

  /**
   * Create a tracking event from request data
   */
  createEvent(
    crawler: CrawlerInfo | UnknownCrawlerInfo,
    request: {
      url: string
      headers: Record<string, string | string[] | undefined>
      statusCode?: number
      responseTimeMs?: number
    },
    metadata?: Record<string, any>
  ): Omit<CrawlerEvent, 'timestamp'> {
    const url = new URL(request.url)
    
    return {
      domain: url.hostname,
      path: url.pathname,
      crawlerName: crawler.bot,
      crawlerCompany: crawler.company,
      crawlerCategory: crawler.category,
      userAgent: this.getHeaderValue(request.headers['user-agent']) || '',
      statusCode: request.statusCode,
      responseTimeMs: request.responseTimeMs,
      metadata
    }
  }

  /**
   * Schedule a batch send
   */
  private scheduleBatch() {
    if (this.batchTimer) return

    this.batchTimer = setTimeout(async () => {
      this.batchTimer = null
      if (this.eventQueue.length > 0) {
        await this.flush()
      }
    }, this.config.batchIntervalMs)
  }

  /**
   * Send all queued events
   */
  async flush() {
    if (this.isSending || this.eventQueue.length === 0) return

    this.isSending = true
    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      await this.sendBatch(events)
    } catch (error) {
      // Put events back in queue for retry
      this.eventQueue.unshift(...events)
      this.config.onError(error as Error)
    } finally {
      this.isSending = false
    }
  }

  /**
   * Send a batch of events with retry logic
   */
  private async sendBatch(events: CrawlerEvent[], attempt = 1): Promise<void> {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Split-Version': '0.1.0'
        },
        body: JSON.stringify({ events })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      if (this.config.debug) {
        console.log(`[Split Analytics] Sent ${events.length} events`)
      }
    } catch (error) {
      if (attempt < MAX_RETRY_ATTEMPTS) {
        // Exponential backoff
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        if (this.config.debug) {
          console.log(`[Split Analytics] Retry attempt ${attempt} after ${delay}ms`)
        }
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.sendBatch(events, attempt + 1)
      }
      throw error
    }
  }

  /**
   * Helper to get header value
   */
  private getHeaderValue(header: string | string[] | undefined): string | undefined {
    if (!header) return undefined
    return Array.isArray(header) ? header[0] : header
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    // Try to send remaining events
    this.flush().catch(() => {})
  }

  /**
   * Ping the API to verify connection and API key validity
   */
  async ping(): Promise<PingResponse> {
    try {
      // Extract base URL and construct ping endpoint
      const baseUrl = this.config.apiEndpoint.replace(/\/crawler-events$/, '')
      const pingEndpoint = `${baseUrl}/ping`
      
      const response = await fetch(pingEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Split-Version': '0.1.0'
        }
      })

      const data = await response.json() as PingResponse

      if (!response.ok) {
        return {
          status: 'error',
          message: data.message || `API error: ${response.status}`
        }
      }

      if (this.config.debug) {
        console.log('[Split Analytics] Ping successful:', data)
      }

      return data
    } catch (error) {
      if (this.config.debug) {
        console.error('[Split Analytics] Ping failed:', error)
      }
      
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }
} 