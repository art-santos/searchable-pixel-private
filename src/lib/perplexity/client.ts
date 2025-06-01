// Perplexity API Client for MAX Visibility System
// Handles rate limiting, retries, and response parsing

import { 
  PerplexityQueryRequest, 
  PerplexityQueryResponse,
  MentionAnalysisRequest,
  MentionAnalysisResult,
  MaxVisibilityError
} from '@/types/max-visibility'

interface RateLimitState {
  requestCount: number
  windowStart: number
  isBlocked: boolean
  retryAfter?: number
}

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export class PerplexityClient {
  private apiKey: string
  private baseUrl = 'https://api.perplexity.ai'
  private rateLimit: RateLimitState
  private retryConfig: RetryConfig

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Perplexity API key is required')
    }
    
    this.apiKey = apiKey
    this.rateLimit = {
      requestCount: 0,
      windowStart: Date.now(),
      isBlocked: false
    }
    
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,      // 1 second
      maxDelay: 30000,      // 30 seconds
      backoffFactor: 2
    }
  }

  /**
   * Main query method with rate limiting and retry logic
   */
  async query(request: PerplexityQueryRequest): Promise<PerplexityQueryResponse> {
    await this.enforceRateLimit()
    
    const startTime = Date.now()
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateBackoffDelay(attempt)
          console.log(`🔄 Retry attempt ${attempt} after ${delay}ms delay`)
          await this.sleep(delay)
        }
        
        const response = await this.makeRequest(request)
        const processingTime = Date.now() - startTime
        
        console.log(`✅ Perplexity query successful (${processingTime}ms)`)
        this.updateRateLimit()
        
        return response
        
      } catch (error) {
        lastError = error as Error
        console.warn(`❌ Perplexity query attempt ${attempt + 1} failed:`, error)
        
        // Don't retry on certain error types
        if (this.isNonRetryableError(error as Error)) {
          break
        }
        
        // Handle rate limit errors specifically
        if (this.isRateLimitError(error as Error)) {
          await this.handleRateLimitError(error as Error)
        }
      }
    }
    
    throw this.createMaxVisibilityError(
      'PERPLEXITY_REQUEST_FAILED',
      `Failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`,
      { originalError: lastError }
    )
  }

  /**
   * Analyze response for mentions of target company
   */
  async analyzeResponse(
    response: string, 
    targetCompany: MentionAnalysisRequest['target_company']
  ): Promise<MentionAnalysisResult> {
    const openai = await this.getOpenAIClient()
    
    const prompt = this.buildMentionAnalysisPrompt(response, targetCompany)
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI analyst specialized in detecting and analyzing company mentions in text. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
      
      const result = completion.choices[0]?.message?.content
      if (!result) {
        throw new Error('No response from OpenAI')
      }
      
      return this.parseMentionAnalysisResult(result)
      
    } catch (error) {
      console.error('Error analyzing mention:', error)
      throw this.createMaxVisibilityError(
        'MENTION_ANALYSIS_FAILED',
        `Failed to analyze mention: ${(error as Error).message}`,
        { response: response.substring(0, 200) }
      )
    }
  }

  /**
   * Batch query multiple questions with intelligent spacing
   */
  async batchQuery(
    requests: PerplexityQueryRequest[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<PerplexityQueryResponse[]> {
    const results: PerplexityQueryResponse[] = []
    const total = requests.length
    
    console.log(`🔄 Starting batch query of ${total} requests`)
    
    for (let i = 0; i < requests.length; i++) {
      try {
        const result = await this.query(requests[i])
        results.push(result)
        
        if (onProgress) {
          onProgress(i + 1, total)
        }
        
        // Add intelligent spacing between requests
        if (i < requests.length - 1) {
          await this.sleep(this.calculateRequestSpacing())
        }
        
      } catch (error) {
        console.error(`Failed to process request ${i + 1}:`, error)
        // Continue with other requests even if one fails
        results.push(this.createErrorResponse(error as Error, requests[i]))
      }
    }
    
    console.log(`✅ Batch query completed: ${results.length}/${total} successful`)
    return results
  }

  /**
   * Test API connectivity and key validity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testQuery: PerplexityQueryRequest = {
        query: 'What is the current date?',
        return_citations: false,
        return_related_questions: false
      }
      
      await this.query(testQuery)
      return { success: true }
      
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message 
      }
    }
  }

  // Private helper methods

  private async makeRequest(request: PerplexityQueryRequest): Promise<PerplexityQueryResponse> {
    const url = `${this.baseUrl}/chat/completions`
    
    const body = {
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: request.query
        }
      ],
      temperature: 0.2,
      return_citations: request.return_citations,
      return_related_questions: request.return_related_questions,
      search_domain_filter: request.search_domain_filter,
      sources: request.sources
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Split-MaxVisibility/1.0'
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      await this.handleHttpError(response)
    }
    
    const data = await response.json()
    return this.validateResponse(data)
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const windowDuration = 60 * 60 * 1000 // 1 hour in milliseconds
    const maxRequestsPerHour = 500 // Increased from 100 to 500 for faster processing
    
    // Reset window if enough time has passed
    if (now - this.rateLimit.windowStart >= windowDuration) {
      this.rateLimit.requestCount = 0
      this.rateLimit.windowStart = now
      this.rateLimit.isBlocked = false
    }
    
    // Check if we're at the limit
    if (this.rateLimit.requestCount >= maxRequestsPerHour) {
      const waitTime = windowDuration - (now - this.rateLimit.windowStart)
      this.rateLimit.isBlocked = true
      this.rateLimit.retryAfter = now + waitTime
      
      throw this.createMaxVisibilityError(
        'RATE_LIMIT_EXCEEDED',
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        { retryAfter: waitTime / 1000 }
      )
    }
  }

  private updateRateLimit(): void {
    this.rateLimit.requestCount++
  }

  private calculateBackoffDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1)
    return Math.min(delay, this.retryConfig.maxDelay)
  }

  private calculateRequestSpacing(): number {
    // Reduced spacing for faster processing
    // Aim for much faster requests while staying under limits
    return 200 + Math.random() * 300 // 200-500ms with jitter (down from 2-3 seconds)
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return message.includes('authentication') || 
           message.includes('unauthorized') ||
           message.includes('forbidden') ||
           message.includes('invalid api key')
  }

  private isRateLimitError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return message.includes('rate limit') || 
           message.includes('too many requests') ||
           message.includes('quota exceeded')
  }

  private async handleRateLimitError(error: Error): Promise<void> {
    console.warn('⚠️ Rate limit encountered, implementing backoff')
    this.rateLimit.isBlocked = true
    
    // Extract retry-after from error if available
    const retryAfter = this.extractRetryAfter(error.message) || 60
    this.rateLimit.retryAfter = Date.now() + (retryAfter * 1000)
    
    await this.sleep(retryAfter * 1000)
  }

  private extractRetryAfter(errorMessage: string): number | null {
    const match = errorMessage.match(/retry.{0,10}(\d+)/i)
    return match ? parseInt(match[1]) : null
  }

  private async handleHttpError(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    
    try {
      const errorBody = await response.json()
      if (errorBody.error?.message) {
        errorMessage = errorBody.error.message
      }
    } catch {
      // Ignore JSON parsing errors, use status text
    }
    
    const errorCode = this.mapHttpStatusToErrorCode(response.status)
    throw this.createMaxVisibilityError(errorCode, errorMessage, {
      httpStatus: response.status,
      httpStatusText: response.statusText
    })
  }

  private mapHttpStatusToErrorCode(status: number): string {
    switch (status) {
      case 401: return 'PERPLEXITY_UNAUTHORIZED'
      case 403: return 'PERPLEXITY_FORBIDDEN'
      case 429: return 'PERPLEXITY_RATE_LIMIT'
      case 500: return 'PERPLEXITY_SERVER_ERROR'
      case 502:
      case 503:
      case 504: return 'PERPLEXITY_SERVICE_UNAVAILABLE'
      default: return 'PERPLEXITY_HTTP_ERROR'
    }
  }

  private validateResponse(data: any): PerplexityQueryResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format')
    }
    
    if (!data.id || !data.choices || !Array.isArray(data.choices)) {
      throw new Error('Missing required response fields')
    }
    
    if (data.choices.length === 0) {
      throw new Error('No response choices returned')
    }
    
    const choice = data.choices[0]
    if (!choice.message || !choice.message.content) {
      throw new Error('No message content in response')
    }
    
    return {
      id: data.id,
      choices: data.choices,
      citations: data.citations || [],
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0 }
    }
  }

  private buildMentionAnalysisPrompt(
    response: string, 
    targetCompany: MentionAnalysisRequest['target_company']
  ): string {
    const aliases = targetCompany.aliases || []
    const allNames = [targetCompany.name, ...aliases]
    
    return `
Analyze this AI response for mentions of "${targetCompany.name}" (domain: ${targetCompany.domain}).

Also consider these alternative names: ${aliases.join(', ')}

Response to analyze:
"""
${response}
"""

Determine:
1. Is "${targetCompany.name}" or any alias mentioned?
2. If mentioned, what is the mention position? (primary/secondary/passing/none)
3. What is the sentiment of the mention? (very_positive/positive/neutral/negative/very_negative)
4. What is the surrounding context of the mention?
5. How confident are you in this analysis? (0-1)

IMPORTANT: Return ONLY the raw JSON object below. Do not include any markdown formatting, code blocks, or explanatory text. Start your response with { and end with }

{
  "mention_detected": boolean,
  "mention_position": "primary|secondary|passing|none",
  "mention_sentiment": "very_positive|positive|neutral|negative|very_negative",
  "mention_context": "relevant surrounding text or null",
  "confidence_score": number,
  "reasoning": "brief explanation of your analysis"
}
    `.trim()
  }

  private parseMentionAnalysisResult(jsonString: string): MentionAnalysisResult {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedJson = jsonString.trim()
      
      // Remove markdown code block markers (handle multiple variations)
      cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '')
      
      // Remove any backticks that might still be present
      cleanedJson = cleanedJson.replace(/^`+/, '').replace(/`+$/, '')
      
      // Find JSON object boundaries
      const jsonStart = cleanedJson.indexOf('{')
      const jsonEnd = cleanedJson.lastIndexOf('}')
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON object found in response')
      }
      
      // Extract just the JSON portion
      cleanedJson = cleanedJson.substring(jsonStart, jsonEnd + 1)
      
      console.log('🔍 Parsing mention analysis JSON:', cleanedJson.substring(0, 100) + '...')
      
      const parsed = JSON.parse(cleanedJson)
      
      // Validate required fields
      const required = ['mention_detected', 'mention_position', 'mention_sentiment', 'confidence_score', 'reasoning']
      for (const field of required) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`)
        }
      }
      
      return {
        mention_detected: Boolean(parsed.mention_detected),
        mention_position: parsed.mention_position,
        mention_sentiment: parsed.mention_sentiment,
        mention_context: parsed.mention_context || null,
        confidence_score: Number(parsed.confidence_score),
        reasoning: String(parsed.reasoning)
      }
      
    } catch (error) {
      console.error('❌ Failed to parse mention analysis:', {
        originalString: jsonString.substring(0, 200),
        error: (error as Error).message
      })
      
      // Fallback: try to create a default response
      console.log('⚠️ Using fallback mention analysis due to parse error')
      return {
        mention_detected: false,
        mention_position: 'none',
        mention_sentiment: 'neutral',
        mention_context: null,
        confidence_score: 0.5,
        reasoning: `Parse error: ${(error as Error).message}`
      }
    }
  }

  private createErrorResponse(error: Error, originalRequest: PerplexityQueryRequest): PerplexityQueryResponse {
    return {
      id: `error-${Date.now()}`,
      choices: [{
        message: {
          content: `Error: ${error.message}`,
          role: 'assistant'
        },
        finish_reason: 'error'
      }],
      citations: [],
      usage: { prompt_tokens: 0, completion_tokens: 0 }
    }
  }

  private createMaxVisibilityError(
    code: string, 
    message: string, 
    details?: Record<string, any>
  ): MaxVisibilityError {
    return {
      code,
      message,
      details,
      retry_after: details?.retryAfter
    }
  }

  private async getOpenAIClient() {
    const { OpenAI } = await import('openai')
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public utility methods

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): RateLimitState {
    return { ...this.rateLimit }
  }

  /**
   * Reset rate limit (for testing purposes)
   */
  resetRateLimit(): void {
    this.rateLimit = {
      requestCount: 0,
      windowStart: Date.now(),
      isBlocked: false
    }
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config }
  }
} 